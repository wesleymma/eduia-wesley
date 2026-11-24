"""
EduIA — API REST de predição (FastAPI)
=======================================
Execução (a partir de backend/):
    uvicorn api.api:app --reload --port 8000

Documentação interativa: http://localhost:8000/docs

Endpoints:
    GET  /              status
    GET  /health        artefatos carregados?
    GET  /metricas      métricas do último treino
    POST /prever        predição de um aluno
    POST /prever/turma  predição de até 200 alunos
"""

import os
import json
import pickle
from typing import List, Literal

import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Caminhos ──────────────────────────────────────────────────────────────
BASE          = os.path.dirname(os.path.abspath(__file__))
ARTEFATOS     = os.path.join(BASE, "..", "modelo", "artefatos")
MODELO_PATH   = os.path.join(ARTEFATOS, "modelo_rf.pkl")
SCALER_PATH   = os.path.join(ARTEFATOS, "scaler.pkl")
METRICAS_PATH = os.path.join(ARTEFATOS, "metricas.json")

FEATURES = [
    "freq_escolar", "nota_matematica", "nota_portugues",
    "reprovacoes", "ind_socioecon", "escola_rural", "programa_social",
]
ROTULOS = {
    "freq_escolar": "Frequência", "nota_matematica": "Matemática",
    "nota_portugues": "Português", "reprovacoes": "Reprovações",
    "ind_socioecon": "Nível socioeconômico", "escola_rural": "Escola rural",
    "programa_social": "Programa social",
}
LABELS = {0: "baixo", 1: "medio", 2: "alto"}
CLASSE_ALTO = 2


def _load(path: str, label: str):
    if not os.path.exists(path):
        raise RuntimeError(
            f"{label} não encontrado em '{path}'. Rode 'python modelo/treinar.py' antes de subir a API."
        )
    with open(path, "rb") as f:
        return pickle.load(f)


modelo = _load(MODELO_PATH, "Modelo")
scaler = _load(SCALER_PATH, "Scaler")
# Recriar o explainer é instantâneo para árvores e evita depender de um
# pickle do shap, que quebra entre versões.
explainer = shap.TreeExplainer(modelo)
with open(METRICAS_PATH, encoding="utf-8") as f:
    metricas_cache = json.load(f)


app = FastAPI(
    title="EduIA — API de predição",
    description=(
        "Estima o risco de dificuldade de aprendizagem de alunos do ensino "
        "fundamental e explica cada estimativa com SHAP. TCC de Engenharia "
        "de Software, UNDB, São Luís/MA."
    ),
    version="1.1.0",
    contact={"name": "Wesley Matheus Martins Aguiar"},
)

# Em produção, troque "*" pelo domínio do dashboard.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ── Schemas ───────────────────────────────────────────────────────────────

class AlunoInput(BaseModel):
    nome:            str   = Field(..., min_length=1, max_length=120, examples=["Lucas Mendes"])
    freq_escolar:    float = Field(..., ge=0, le=100, examples=[65.0])
    nota_matematica: float = Field(..., ge=0, le=100, examples=[35.0])
    nota_portugues:  float = Field(..., ge=0, le=100, examples=[38.0])
    reprovacoes:     int   = Field(0,   ge=0, le=10,  examples=[1])
    ind_socioecon:   float = Field(5.0, ge=0, le=10,  examples=[3.5])
    escola_rural:    int   = Field(0,   ge=0, le=1,   examples=[0])
    programa_social: int   = Field(0,   ge=0, le=1,   examples=[1])


class ShapDetalhe(BaseModel):
    variavel:     str
    rotulo:       str
    valor_shap:   float      # impacto bruto na probabilidade de risco ALTO
    contribuicao: float      # % do impacto absoluto total
    direcao:      Literal["aumenta_risco", "reduz_risco"]


class PrevisaoResponse(BaseModel):
    nome:           str
    risco:          Literal["baixo", "medio", "alto"]
    probabilidade:  float    # probabilidade da classe prevista, 0–100
    probabilidades: dict     # {'baixo': %, 'medio': %, 'alto': %}
    shap:           List[ShapDetalhe]
    intervencao:    List[str]


class TurmaInput(BaseModel):
    alunos: List[AlunoInput] = Field(..., min_length=1, max_length=200)


class TurmaResponse(BaseModel):
    total:  int
    alto:   int
    medio:  int
    baixo:  int
    alunos: List[PrevisaoResponse]


# ── Lógica ────────────────────────────────────────────────────────────────

def _matriz(alunos: List[AlunoInput]) -> np.ndarray:
    df = pd.DataFrame([{f: getattr(a, f) for f in FEATURES} for a in alunos], columns=FEATURES)
    return scaler.transform(df)


def _shap_alto(X_sc: np.ndarray) -> np.ndarray:
    """Valores SHAP da classe 'alto', formato (n_alunos, n_features).
    Cobre as duas formas de saída do shap (lista antiga e array 3D)."""
    sv = explainer.shap_values(X_sc)
    if isinstance(sv, list):
        return np.asarray(sv[CLASSE_ALTO])
    sv = np.asarray(sv)
    return sv[..., CLASSE_ALTO] if sv.ndim == 3 else sv


def _detalhes_shap(vals: np.ndarray) -> List[ShapDetalhe]:
    total = float(np.sum(np.abs(vals))) or 1.0
    itens = [
        ShapDetalhe(
            variavel=f, rotulo=ROTULOS[f], valor_shap=round(float(v), 4),
            contribuicao=round(abs(float(v)) / total * 100, 1),
            direcao="aumenta_risco" if v > 0 else "reduz_risco",
        )
        for f, v in zip(FEATURES, vals)
    ]
    return sorted(itens, key=lambda x: x.contribuicao, reverse=True)


def sugerir_intervencao(risco: str, a: AlunoInput) -> List[str]:
    """Regras pedagógicas fixas. O modelo estima o risco; as ações saem
    destas regras, que a coordenação pode revisar."""
    acoes = []
    if a.freq_escolar < 75:
        acoes.append("Conversar com a família sobre as faltas nesta semana")
    elif a.freq_escolar < 85:
        acoes.append("Acompanhar a frequência a cada 15 dias")
    if a.nota_matematica < 45:
        acoes.append("Incluir no reforço de Matemática, 3 vezes por semana")
    elif a.nota_matematica < 60:
        acoes.append("Enviar atividades complementares de Matemática")
    if a.nota_portugues < 45:
        acoes.append("Incluir no reforço de leitura e interpretação de texto")
    elif a.nota_portugues < 60:
        acoes.append("Propor leitura orientada semanal")
    if a.reprovacoes >= 2:
        acoes.append("Avaliação com a equipe pedagógica")
    if a.programa_social == 1 and risco == "alto":
        acoes.append("Articular com a assistência social da escola")
    return acoes or ["Manter o acompanhamento bimestral"]


def prever_lote(alunos: List[AlunoInput]) -> List[PrevisaoResponse]:
    X_sc = _matriz(alunos)
    probas = modelo.predict_proba(X_sc)
    shap_alto = _shap_alto(X_sc)
    saida = []
    for a, p, sv in zip(alunos, probas, shap_alto):
        idx = int(np.argmax(p))
        risco = LABELS[idx]
        saida.append(PrevisaoResponse(
            nome=a.nome,
            risco=risco,
            probabilidade=round(float(p[idx]) * 100, 1),
            probabilidades={LABELS[i]: round(float(v) * 100, 1) for i, v in enumerate(p)},
            shap=_detalhes_shap(sv),
            intervencao=sugerir_intervencao(risco, a),
        ))
    return saida


# ── Endpoints ─────────────────────────────────────────────────────────────

@app.get("/", tags=["Status"])
def root():
    return {"status": "online", "sistema": "EduIA", "versao": app.version}


@app.get("/health", tags=["Status"])
def health():
    return {"modelo": True, "scaler": True, "explainer": True,
            "treinado_em": metricas_cache.get("gerado_em")}


@app.get("/metricas", tags=["Modelo"])
def get_metricas():
    """Métricas do último treino (validação cruzada, teste, baseline e SHAP global)."""
    return metricas_cache


@app.post("/prever", response_model=PrevisaoResponse, tags=["Predição"])
def prever(aluno: AlunoInput):
    """Risco de um aluno, probabilidades por classe, fatores SHAP e ações sugeridas."""
    return prever_lote([aluno])[0]


@app.post("/prever/turma", response_model=TurmaResponse, tags=["Predição"])
def prever_turma(turma: TurmaInput):
    """Predição para até 200 alunos de uma vez."""
    resultados = prever_lote(turma.alunos)
    cont = {"alto": 0, "medio": 0, "baixo": 0}
    for r in resultados:
        cont[r.risco] += 1
    return TurmaResponse(total=len(resultados), **cont, alunos=resultados)

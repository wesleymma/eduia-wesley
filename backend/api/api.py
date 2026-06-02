"""
EduIA — API REST de Predição (FastAPI)
=======================================
Execução:
    uvicorn api.api:app --reload --port 8000

Documentação automática:
    http://localhost:8000/docs

Endpoints:
    GET  /              → status
    GET  /metricas      → métricas do modelo
    GET  /health        → verificação dos artefatos
    POST /prever        → predição de 1 aluno
    POST /prever/turma  → predição de uma turma completa
"""

import os
import json
import pickle
from typing import List

import numpy as np
import shap
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Caminhos ───────────────────────────────────────────────────────────────
BASE          = os.path.dirname(os.path.abspath(__file__))
ARTEFATOS     = os.path.join(BASE, '..', 'modelo', 'artefatos')
MODELO_PATH   = os.path.join(ARTEFATOS, 'modelo_rf.pkl')
SCALER_PATH   = os.path.join(ARTEFATOS, 'scaler.pkl')
SHAP_PATH     = os.path.join(ARTEFATOS, 'shap_explainer.pkl')
METRICAS_PATH = os.path.join(ARTEFATOS, 'metricas.json')

FEATURES = [
    'freq_escolar', 'nota_matematica', 'nota_portugues',
    'reprovacoes', 'ind_socioecon', 'escola_rural', 'programa_social'
]
LABELS = {0: 'baixo', 1: 'medio', 2: 'alto'}
CORES  = {0: '#2dd4a0', 1: '#f5a623', 2: '#ff4d6d'}


# ── Carregar artefatos ──────────────────────────────────────────────────────
def _load(path, label):
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"[API] {label} não encontrado em '{path}'. "
            "Execute 'python modelo/treinar.py' primeiro."
        )
    with open(path, 'rb') as f:
        return pickle.load(f)

modelo    = _load(MODELO_PATH,   'Modelo')
scaler    = _load(SCALER_PATH,   'Scaler')
explainer = _load(SHAP_PATH,     'SHAP explainer')

with open(METRICAS_PATH) as f:
    metricas_cache = json.load(f)

print("[API] Artefatos carregados com sucesso ✅")


# ── App FastAPI ────────────────────────────────────────────────────────────
app = FastAPI(
    title="EduIA — API de Predição",
    description=(
        "API REST para identificação de risco de dificuldade de "
        "aprendizagem no ensino público. Desenvolvida como parte do "
        "TCC em Engenharia de Software — UNDB, São Luís/MA."
    ),
    version="1.0.0",
    contact={
        "name": "Wesley Matheus Martins Aguiar",
        "email": "wesley@escola.edu.br"
    }
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Em produção: restringir ao domínio do dashboard
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas Pydantic ───────────────────────────────────────────────────────

class AlunoInput(BaseModel):
    nome:            str   = Field(..., example="Lucas Mendes")
    freq_escolar:    float = Field(..., ge=0, le=100, example=65.0)
    nota_matematica: float = Field(..., ge=0, le=100, example=35.0)
    nota_portugues:  float = Field(..., ge=0, le=100, example=38.0)
    reprovacoes:     int   = Field(0,   ge=0, le=10,  example=1)
    ind_socioecon:   float = Field(5.0, ge=0, le=10,  example=3.5)
    escola_rural:    int   = Field(0,   ge=0, le=1,   example=0)
    programa_social: int   = Field(0,   ge=0, le=1,   example=1)


class ShapDetalhe(BaseModel):
    variavel:     str
    contribuicao: float   # percentual (0–100)
    direcao:      str     # 'aumenta_risco' | 'reduz_risco'


class PrevisaoResponse(BaseModel):
    nome:           str
    risco:          str           # 'baixo' | 'medio' | 'alto'
    probabilidade:  float         # 0–100
    probabilidades: dict          # {'baixo': %, 'medio': %, 'alto': %}
    shap:           List[ShapDetalhe]
    intervencao:    str
    cor:            str


class TurmaInput(BaseModel):
    alunos: List[AlunoInput]


class TurmaResponse(BaseModel):
    total:  int
    alto:   int
    medio:  int
    baixo:  int
    alunos: List[PrevisaoResponse]


# ── Helpers ────────────────────────────────────────────────────────────────

def _features_array(aluno: AlunoInput) -> np.ndarray:
    return np.array([[
        aluno.freq_escolar,    aluno.nota_matematica, aluno.nota_portugues,
        aluno.reprovacoes,     aluno.ind_socioecon,
        aluno.escola_rural,    aluno.programa_social,
    ]])


def _calcular_shap(X_sc: np.ndarray) -> List[ShapDetalhe]:
    sv = explainer.shap_values(X_sc)
    classe_pred = int(modelo.predict(X_sc)[0])
    vals = sv[classe_pred][0] if isinstance(sv, list) else sv[0]
    total = np.sum(np.abs(vals)) or 1.0
    detalhes = [
        ShapDetalhe(
            variavel=feat,
            contribuicao=round(abs(v) / total * 100, 1),
            direcao='aumenta_risco' if v > 0 else 'reduz_risco'
        )
        for feat, v in zip(FEATURES, vals)
    ]
    return sorted(detalhes, key=lambda x: x.contribuicao, reverse=True)


def _intervencao(risco: str, aluno: AlunoInput) -> str:
    acoes = []
    if aluno.freq_escolar < 75:
        acoes.append("contato imediato com a família sobre a frequência escolar")
    elif aluno.freq_escolar < 85:
        acoes.append("monitoramento da frequência quinzenalmente")
    if aluno.nota_matematica < 45:
        acoes.append("inserção em reforço de matemática (3x/semana)")
    elif aluno.nota_matematica < 60:
        acoes.append("atividades complementares de matemática")
    if aluno.nota_portugues < 45:
        acoes.append("reforço de leitura e interpretação de texto")
    if aluno.programa_social == 1 and risco == 'alto':
        acoes.append("articulação com assistente social da escola")
    if not acoes:
        return "Desempenho satisfatório. Manter monitoramento bimestral regular."
    return "Recomenda-se: " + "; ".join(acoes) + "."


def _prever_aluno(aluno: AlunoInput) -> PrevisaoResponse:
    X_raw  = _features_array(aluno)
    X_sc   = scaler.transform(X_raw)
    proba  = modelo.predict_proba(X_sc)[0]
    idx    = int(np.argmax(proba))
    risco  = LABELS[idx]
    probas = {LABELS[i]: round(float(p) * 100, 1) for i, p in enumerate(proba)}

    return PrevisaoResponse(
        nome          = aluno.nome,
        risco         = risco,
        probabilidade = round(float(proba[idx]) * 100, 1),
        probabilidades= probas,
        shap          = _calcular_shap(X_sc),
        intervencao   = _intervencao(risco, aluno),
        cor           = CORES[idx],
    )


# ── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/", tags=["Status"])
def root():
    return {"status": "online", "sistema": "EduIA", "versao": "1.0.0"}


@app.get("/health", tags=["Status"])
def health():
    return {
        "modelo":    modelo   is not None,
        "scaler":    scaler   is not None,
        "explainer": explainer is not None,
    }


@app.get("/metricas", tags=["Modelo"])
def get_metricas():
    """Retorna as métricas de avaliação do modelo treinado."""
    return metricas_cache


@app.post("/prever", response_model=PrevisaoResponse, tags=["Predição"])
def prever(aluno: AlunoInput):
    """
    Prediz o nível de risco de dificuldade de aprendizagem de um aluno.
    Retorna: risco, probabilidade, explicação SHAP e intervenção sugerida.
    """
    try:
        return _prever_aluno(aluno)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/prever/turma", response_model=TurmaResponse, tags=["Predição"])
def prever_turma(turma: TurmaInput):
    """
    Prediz o risco de uma lista de alunos (turma completa).
    Retorna predição individual + resumo de distribuição de risco.
    """
    if not turma.alunos:
        raise HTTPException(status_code=400, detail="Lista de alunos vazia.")
    if len(turma.alunos) > 200:
        raise HTTPException(status_code=400, detail="Máximo 200 alunos por requisição.")
    try:
        resultados = [_prever_aluno(a) for a in turma.alunos]
        cont = {'alto': 0, 'medio': 0, 'baixo': 0}
        for r in resultados:
            cont[r.risco] += 1
        return TurmaResponse(
            total=len(resultados), **cont, alunos=resultados
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

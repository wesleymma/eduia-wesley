"""Testes da API. Rode a partir de backend/:  python -m pytest -q
Exige os artefatos de modelo/artefatos (rode modelo/treinar.py antes)."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402
from api.api import app  # noqa: E402

client = TestClient(app)

ALUNO_RISCO = {"nome": "Teste A", "freq_escolar": 58, "nota_matematica": 30, "nota_portugues": 32,
               "reprovacoes": 2, "ind_socioecon": 2.5, "escola_rural": 1, "programa_social": 1}
ALUNO_OK = {"nome": "Teste B", "freq_escolar": 97, "nota_matematica": 85, "nota_portugues": 82,
            "reprovacoes": 0, "ind_socioecon": 7.5, "escola_rural": 0, "programa_social": 0}


def test_health():
    assert client.get("/health").json()["modelo"] is True


def test_prever_risco_alto():
    r = client.post("/prever", json=ALUNO_RISCO)
    assert r.status_code == 200
    body = r.json()
    assert body["risco"] == "alto"
    assert abs(sum(body["probabilidades"].values()) - 100) < 0.5
    assert len(body["shap"]) == 7
    # Frequência de 58% precisa empurrar o risco para cima.
    freq = next(s for s in body["shap"] if s["variavel"] == "freq_escolar")
    assert freq["direcao"] == "aumenta_risco"


def test_prever_sem_risco():
    body = client.post("/prever", json=ALUNO_OK).json()
    assert body["risco"] == "baixo"
    assert body["intervencao"] == ["Manter o acompanhamento bimestral"]


def test_validacao_entrada():
    assert client.post("/prever", json={**ALUNO_OK, "freq_escolar": 140}).status_code == 422


def test_turma():
    body = client.post("/prever/turma", json={"alunos": [ALUNO_RISCO, ALUNO_OK]}).json()
    assert body["total"] == 2 and body["alto"] == 1 and body["baixo"] == 1


def test_turma_vazia():
    assert client.post("/prever/turma", json={"alunos": []}).status_code == 422

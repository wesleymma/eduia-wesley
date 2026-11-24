"""
EduIA — Exporta os dados de demonstração do frontend
=====================================================
Execução (a partir de backend/, depois do treino):
    python modelo/exportar_demo.py

Gera três turmas fictícias, passa cada aluno pelo modelo treinado e grava
frontend/js/dados-modelo.js. Assim, risco, probabilidade, fatores SHAP e
métricas exibidos no dashboard saem do modelo real, e não de números
digitados à mão. Nomes e notas são inventados.
"""

import os
import sys
import json
import random

import numpy as np

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from api.api import AlunoInput, prever_lote, metricas_cache  # noqa: E402
from modelo.treinar import gerar_dados_sinteticos, FEATURES   # noqa: E402

SAIDA = os.path.join(BACKEND, "..", "frontend", "js", "dados-modelo.js")

NOMES = ["Ana", "Beatriz", "Camila", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena",
         "Isabela", "Júlia", "Larissa", "Letícia", "Luana", "Mariana", "Nicole", "Raíssa",
         "Sofia", "Vitória", "Yasmin", "Alice", "Arthur", "Bruno", "Caio", "Davi", "Enzo",
         "Felipe", "Gabriel", "Gustavo", "Heitor", "Igor", "João", "Kauã", "Lucas", "Mateus",
         "Miguel", "Pedro", "Rafael", "Samuel", "Thiago", "Vinícius", "Wesley", "Ruan"]
SOBRENOMES = ["Almeida", "Araújo", "Barbosa", "Cardoso", "Carvalho", "Castro", "Costa",
              "Ferreira", "Gomes", "Lima", "Martins", "Mendes", "Moraes", "Nascimento",
              "Oliveira", "Pereira", "Ribeiro", "Rocha", "Santos", "Silva", "Sousa", "Teixeira",
              "Viana", "Pinheiro", "Serra", "Coelho", "Nunes", "Brito"]

# turma: (nº de alunos, proporção de perfis baixo/médio/alto, semente)
TURMAS = {
    "7A": (32, (0.40, 0.35, 0.25), 7),
    "8B": (28, (0.55, 0.30, 0.15), 8),
    "9C": (30, (0.50, 0.30, 0.20), 9),
}

HIST_ANDAMENTO = [
    ["Responsável compareceu à reunião em 06/10", "Aluno incluído no reforço em 13/10"],
    ["Ligação para a família em 08/10", "Lista de exercícios entregue em 20/10"],
    ["Conversa individual com o aluno em 15/10"],
    ["Encaminhado à coordenação em 09/10", "Plano de estudos combinado em 22/10"],
]


def montar_turma(codigo, n, props, seed):
    rng = random.Random(seed)
    base = gerar_dados_sinteticos(n=2000, seed=seed)
    partes = []
    for classe, prop in enumerate(props):
        k = round(n * prop) if classe < 2 else n - sum(len(p) for p in partes)
        partes.append(base[base["risco"] == classe].head(k))
    import pandas as pd
    df = pd.concat(partes).sample(frac=1, random_state=seed).reset_index(drop=True)

    usados, alunos_in = set(), []
    for _, r in df.iterrows():
        while True:
            nome = f"{rng.choice(NOMES)} {rng.choice(SOBRENOMES)}"
            if nome not in usados:
                usados.add(nome); break
        alunos_in.append(AlunoInput(
            nome=nome,
            freq_escolar=round(float(r.freq_escolar)),
            nota_matematica=round(float(r.nota_matematica)),
            nota_portugues=round(float(r.nota_portugues)),
            reprovacoes=int(r.reprovacoes),
            ind_socioecon=round(float(r.ind_socioecon), 1),
            escola_rural=int(r.escola_rural),
            programa_social=int(r.programa_social),
        ))

    previsoes = prever_lote(alunos_in)
    alunos = []
    for i, (a, p) in enumerate(zip(alunos_in, previsoes), start=1):
        if p.risco == "baixo":
            status, prog, hist = "nenhuma", 0, []
        else:
            sorteio = rng.random()
            if sorteio < 0.45:
                status, prog, hist = "pendente", 0, []
            elif sorteio < 0.9 or p.risco == "alto":
                status, prog = "andamento", rng.choice([25, 50, 75])
                hist = list(rng.choice(HIST_ANDAMENTO))
            else:
                status, prog = "concluida", 100
                hist = ["Reunião com a família em 01/09", "Intervenção encerrada em 30/09"]
        alunos.append({
            "id": f"{codigo}-{i:02d}",
            "nome": a.nome,
            "freq": int(a.freq_escolar), "mat": int(a.nota_matematica), "port": int(a.nota_portugues),
            "rep": a.reprovacoes, "ise": a.ind_socioecon,
            "rural": a.escola_rural, "social": a.programa_social,
            "risco": p.risco, "prob": p.probabilidade,
            "probs": p.probabilidades,
            "pAlto": p.probabilidades["alto"],
            "shap": [{"r": s.rotulo, "c": s.contribuicao, "v": s.valor_shap,
                      "d": "+" if s.direcao == "aumenta_risco" else "-"} for s in p.shap[:5]],
            "acoes": p.intervencao,
            "status": status, "prog": prog, "hist": hist,
        })
    return alunos


def main():
    turmas = {cod: {"alunos": montar_turma(cod, *cfg)} for cod, cfg in TURMAS.items()}
    m = metricas_cache
    modelo = {
        "geradoEm": m["gerado_em"],
        "origem": m["origem_dados"],
        "nRegistros": m["n_registros"], "nTeste": m["n_teste"],
        "validacao": m["validacao"],
        "vencedorCV": m["vencedor_cv"],
        "justificativa": m.get("justificativa_producao", ""),
        "modelos": m["modelos"],
        "baseline": m["baseline_regra"],
        "matriz": m["matriz_confusao"],
        "porClasse": m["por_classe"],
        "shapGlobal": m["shap_global_alto"],
    }
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write("// Arquivo gerado por backend/modelo/exportar_demo.py. Não edite à mão.\n")
        f.write("window.EDUIA_MODELO = " + json.dumps(modelo, ensure_ascii=False) + ";\n")
        f.write("window.EDUIA_TURMAS = " + json.dumps(turmas, ensure_ascii=False) + ";\n")
    for cod, t in turmas.items():
        c = {r: sum(a["risco"] == r for a in t["alunos"]) for r in ("alto", "medio", "baixo")}
        print(f"[demo] {cod}: {len(t['alunos'])} alunos {c}")
    print(f"[ok] {os.path.abspath(SAIDA)}")


if __name__ == "__main__":
    main()

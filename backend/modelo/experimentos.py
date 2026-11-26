"""
EduIA — Experimentos complementares
====================================
Execução (a partir de backend/):
    python modelo/experimentos.py

1. Validação externa com dados reais (UCI Student Performance, 382 alunos).
   O rótulo vem da nota FINAL do ano (G3), medida depois dos indicadores
   usados como entrada. Assim o modelo não aprende uma regra criada por nós.
2. Ablação: o mesmo modelo sem as variáveis socioeconômicas.
3. Erros por grupo: o modelo erra mais com alunos de origem mais pobre?

Saída: modelo/artefatos/experimentos/ (JSON + figuras).
"""

import os
import sys
import json
import warnings

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import shap
from sklearn.model_selection import train_test_split, cross_validate, RepeatedStratifiedKFold
from sklearn.metrics import accuracy_score, f1_score, recall_score, roc_auc_score, confusion_matrix, make_scorer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from modelo.treinar import (  # noqa: E402
    montar_pipelines, valores_shap_classe, gerar_dados_sinteticos,
    regra_baseline, FEATURES, ROTULOS_FEATURES, LABELS, SEED, CLASSE_ALTO,
)

warnings.filterwarnings("ignore", category=FutureWarning)
BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS_UCI = os.path.join(BACKEND, "dados", "uci")
SAIDA = os.path.join(BACKEND, "modelo", "artefatos", "experimentos")
os.makedirs(SAIDA, exist_ok=True)

TINTA, PAPEL = "#1f1d1a", "#fbfaf6"
CHAVES_CRUZAMENTO = ["school", "sex", "age", "address", "famsize", "Pstatus", "Medu",
                     "Fedu", "Mjob", "Fjob", "reason", "nursery", "internet"]

FEATURES_UCI = ["faltas", "nota_matematica", "nota_portugues", "reprovacoes",
                "escolaridade_pais", "mora_zona_rural"]
ROTULOS_UCI = {
    "faltas": "Faltas no ano", "nota_matematica": "Matemática (1º período)",
    "nota_portugues": "Português (1º período)", "reprovacoes": "Reprovações",
    "escolaridade_pais": "Escolaridade dos pais", "mora_zona_rural": "Mora em zona rural",
}


# ══ Dados UCI ══════════════════════════════════════════════════════════════

def carregar_uci() -> pd.DataFrame:
    mat = pd.read_csv(os.path.join(DADOS_UCI, "student-mat.csv"), sep=";")
    por = pd.read_csv(os.path.join(DADOS_UCI, "student-por.csv"), sep=";")
    d = pd.merge(mat, por, on=CHAVES_CRUZAMENTO, suffixes=("_mat", "_por"))
    df = pd.DataFrame({
        "faltas": d["absences_mat"] + d["absences_por"],
        # notas de 0–20 convertidas para 0–100, como no EduIA
        "nota_matematica": d["G1_mat"] * 5,
        "nota_portugues": d["G1_por"] * 5,
        "reprovacoes": d[["failures_mat", "failures_por"]].max(axis=1),
        # Medu e Fedu vão de 0 (nenhuma) a 4 (ensino superior); escala 0–10
        "escolaridade_pais": (d["Medu"] + d["Fedu"]) / 8 * 10,
        "mora_zona_rural": (d["address"] == "R").astype(int),
    })
    # Desfecho no fim do ano (G3). Aprovação em Portugal: nota >= 10 de 20.
    menor_final = d[["G3_mat", "G3_por"]].min(axis=1)
    df["risco"] = np.where(menor_final < 10, 2, np.where(menor_final <= 11, 1, 0))
    return df


def regra_uci(X: pd.DataFrame) -> np.ndarray:
    """Regra do professor: repete a situação do 1º período."""
    menor = X[["nota_matematica", "nota_portugues"]].min(axis=1)
    return np.where(menor < 50, 2, np.where(menor <= 55, 1, 0))


# ══ Avaliação genérica ═════════════════════════════════════════════════════

def metricas(y, pred, prob=None) -> dict:
    m = {
        "acuracia": round(accuracy_score(y, pred), 4),
        "f1": round(f1_score(y, pred, average="weighted"), 4),
        "recall_alto": round(recall_score(y, pred, labels=[CLASSE_ALTO], average="macro"), 4),
    }
    if prob is not None:
        m["auc"] = round(roc_auc_score(y, prob, multi_class="ovr", average="weighted"), 4)
    return m


RECALL_ALTO = make_scorer(recall_score, labels=[CLASSE_ALTO], average="macro")
# Precisão do alerta: dos alunos que o modelo marcou como alto, quantos eram.
PRECISAO_ALTO = make_scorer(lambda y, p: float(((p == CLASSE_ALTO) & (y == CLASSE_ALTO)).sum() / max((p == CLASSE_ALTO).sum(), 1)))


def resumo_cv(valores) -> dict:
    return {"media": round(float(np.mean(valores)), 4), "desvio": round(float(np.std(valores)), 4)}


def validar_cv(X, y, n_splits=5, n_repeats=5) -> dict:
    cv = RepeatedStratifiedKFold(n_splits=n_splits, n_repeats=n_repeats, random_state=SEED)
    out = {}
    for nome, p in montar_pipelines().items():
        s = cross_validate(p, X, y, cv=cv, n_jobs=-1,
                           scoring={"f1": "f1_weighted", "auc": "roc_auc_ovr_weighted", "acc": "accuracy",
                                    "recall_alto": RECALL_ALTO, "precisao_alto": PRECISAO_ALTO})
        out[nome] = {k: resumo_cv(s["test_" + k]) for k in ("f1", "auc", "acc", "recall_alto", "precisao_alto")}
    return out


def figura_matriz(cm, titulo, caminho):
    fig, ax = plt.subplots(figsize=(5.2, 4.2), facecolor=PAPEL)
    ax.imshow(cm, cmap="Blues")
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center",
                    color="white" if cm[i, j] > cm.max() * 0.6 else TINTA, fontsize=13)
    ax.set_xticks(range(3), LABELS); ax.set_yticks(range(3), LABELS)
    ax.set_xlabel("Previsto pelo modelo"); ax.set_ylabel("Classe real")
    ax.set_title(titulo, fontsize=11, color=TINTA)
    fig.tight_layout(); fig.savefig(caminho, dpi=160); plt.close(fig)


def shap_global(pipe, X_test, feats, rotulos, caminho_fig, titulo):
    scaler, rf = pipe.named_steps["scaler"], pipe.named_steps["clf"]
    sv = valores_shap_classe(shap.TreeExplainer(rf), scaler.transform(X_test), CLASSE_ALTO)
    plt.figure(facecolor=PAPEL)
    shap.summary_plot(sv, X_test.values, feature_names=[rotulos[f] for f in feats], show=False)
    plt.title(titulo, fontsize=11)
    plt.xlabel("Valor SHAP (impacto na probabilidade de risco alto)")
    plt.tight_layout(); plt.savefig(caminho_fig, dpi=160, bbox_inches="tight"); plt.close()
    imp = np.abs(sv).mean(axis=0); imp = imp / (imp.sum() or 1)
    return sorted(({"variavel": f, "rotulo": rotulos[f], "importancia": round(float(v * 100), 1)}
                   for f, v in zip(feats, imp)), key=lambda d: -d["importancia"])


def avaliar_rf_teste(X_tr, X_te, y_tr, y_te):
    rf = montar_pipelines()["Random Forest"]
    rf.fit(X_tr, y_tr)
    return rf, rf.predict(X_te), rf.predict_proba(X_te)


def por_grupo(y, pred, grupo: pd.Series, nomes: dict) -> list:
    """Recall do risco alto e taxa de falso alarme (previsto alto sem ser) por grupo."""
    y, pred, grupo = np.asarray(y), np.asarray(pred), np.asarray(grupo)
    linhas = []
    for g, rot in nomes.items():
        m = grupo == g
        alto_real = (y == CLASSE_ALTO) & m
        nao_alto = (y != CLASSE_ALTO) & m
        linhas.append({
            "grupo": rot, "n": int(m.sum()),
            "taxa_alto_real": round(float(alto_real.sum() / max(m.sum(), 1)), 4),
            "recall_alto": round(float((pred[alto_real] == CLASSE_ALTO).mean()) if alto_real.any() else float("nan"), 4),
            "falso_alarme": round(float((pred[nao_alto] == CLASSE_ALTO).mean()) if nao_alto.any() else float("nan"), 4),
        })
    return linhas


# ══ Experimentos ═══════════════════════════════════════════════════════════

def experimento_uci() -> dict:
    df = carregar_uci()
    X, y = df[FEATURES_UCI], df["risco"]
    print(f"[uci] {len(df)} alunos | classes {y.value_counts().sort_index().to_dict()}")

    cv = validar_cv(X, y)
    for n, m in cv.items():
        print(f"[uci] {n:14s} F1 CV = {m['f1']['media']:.4f} ± {m['f1']['desvio']:.4f}")

    # Regra simples avaliada com a mesma CV (não tem parâmetro para treinar)
    regra_cv = {"f1": [], "acc": [], "recall_alto": [], "precisao_alto": []}
    for tr, te in RepeatedStratifiedKFold(n_splits=5, n_repeats=5, random_state=SEED).split(X, y):
        yt, pr = y.iloc[te].values, regra_uci(X.iloc[te])
        regra_cv["f1"].append(f1_score(yt, pr, average="weighted"))
        regra_cv["acc"].append(accuracy_score(yt, pr))
        regra_cv["recall_alto"].append(recall_score(yt, pr, labels=[CLASSE_ALTO], average="macro"))
        regra_cv["precisao_alto"].append(((pr == CLASSE_ALTO) & (yt == CLASSE_ALTO)).sum() / max((pr == CLASSE_ALTO).sum(), 1))

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.20, stratify=y, random_state=SEED)
    rf, pred, prob = avaliar_rf_teste(X_tr, X_te, y_tr, y_te)
    cm = confusion_matrix(y_te, pred)
    figura_matriz(cm, f"Dados reais (UCI) — Random Forest (n={len(y_te)})",
                  os.path.join(SAIDA, "uci_matriz_confusao.png"))
    imp = shap_global(rf, X_te, FEATURES_UCI, ROTULOS_UCI, os.path.join(SAIDA, "uci_shap_summary.png"),
                      "Dados reais (UCI): contribuição para a classe Alto risco")

    # Sem notas: o modelo ainda ajuda quando o professor só tem faltas e histórico?
    sem_notas = [f for f in FEATURES_UCI if not f.startswith("nota_")]
    cv_sem_notas = validar_cv(X[sem_notas], y)["Random Forest"]

    # Ablação socioeconômica
    sem_socio = [f for f in FEATURES_UCI if f not in ("escolaridade_pais", "mora_zona_rural")]
    cv_sem_socio = validar_cv(X[sem_socio], y)["Random Forest"]
    rf2, pred2, _ = avaliar_rf_teste(X_tr[sem_socio], X_te[sem_socio], y_tr, y_te)

    # Erros por grupo em validação cruzada (mais alunos por grupo que o teste)
    grupo = (df["escolaridade_pais"] <= 5).map({True: 1, False: 0})  # pais até fundamental completo
    nomes = {1: "Pais com escolaridade até o fundamental", 0: "Pais com ensino médio ou superior"}
    grupos = {}
    for rotulo, feats in (("com_socio", FEATURES_UCI), ("sem_socio", sem_socio)):
        rodadas = []
        for rep in range(5):  # 5 repetições de 5 folds; média por grupo
            pred_cv = np.zeros(len(y), dtype=int)
            cv1 = RepeatedStratifiedKFold(n_splits=5, n_repeats=1, random_state=SEED + rep)
            for tr, te in cv1.split(X, y):
                p = montar_pipelines()["Random Forest"]
                p.fit(X.iloc[tr][feats], y.iloc[tr])
                pred_cv[te] = p.predict(X.iloc[te][feats])
            rodadas.append(por_grupo(y, pred_cv, grupo, nomes))
        grupos[rotulo] = [{**rodadas[0][i],
                           "recall_alto": round(float(np.mean([r[i]["recall_alto"] for r in rodadas])), 4),
                           "falso_alarme": round(float(np.mean([r[i]["falso_alarme"] for r in rodadas])), 4)}
                          for i in range(len(nomes))]

    return {
        "fonte": "UCI Student Performance (Cortez e Silva, 2008), 382 alunos em Matemática e Português",
        "rotulo": "Nota final do ano (G3): alto = reprovado (< 10/20) em ao menos uma disciplina; "
                  "médio = aprovado com menor nota 10 ou 11; baixo = menor nota >= 12",
        "entradas": [ROTULOS_UCI[f] for f in FEATURES_UCI],
        "n": int(len(df)), "n_teste": int(len(y_te)),
        "classes": {LABELS[k]: int(v) for k, v in y.value_counts().sort_index().items()},
        "validacao": "RepeatedStratifiedKFold 5x5 (25 rodadas), SMOTE dentro de cada fold",
        "cv": cv,
        "regra_cv": {k: resumo_cv(v) for k, v in regra_cv.items()},
        "regra_descricao": "menor nota do 1º período < 10/20 → alto; 10 ou 11 → médio; >= 12 → baixo",
        "teste_rf": metricas(y_te, pred, prob),
        "teste_regra": metricas(y_te, regra_uci(X_te)),
        "teste_rf_sem_socio": metricas(y_te, pred2),
        "matriz_confusao": cm.tolist(),
        "shap_global_alto": imp,
        "cv_rf_sem_notas": cv_sem_notas,
        "cv_rf_sem_socio": cv_sem_socio,
        "grupos": grupos,
    }


def experimento_sintetico() -> dict:
    df = gerar_dados_sinteticos()
    X, y = df[FEATURES], df["risco"]
    sem_socio = [f for f in FEATURES if f not in ("ind_socioecon", "programa_social", "escola_rural")]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.20, stratify=y, random_state=SEED)
    _, pred, prob = avaliar_rf_teste(X_tr, X_te, y_tr, y_te)
    _, pred2, prob2 = avaliar_rf_teste(X_tr[sem_socio], X_te[sem_socio], y_tr, y_te)
    nomes = {1: "Participa de programa social", 0: "Não participa"}
    return {
        "removidas": [ROTULOS_FEATURES[f] for f in ("ind_socioecon", "programa_social", "escola_rural")],
        "teste_com": metricas(y_te, pred, prob),
        "teste_sem": metricas(y_te, pred2, prob2),
        "regra": metricas(y_te, regra_baseline(X_te)),
        "grupos_com": por_grupo(y_te, pred, X_te["programa_social"], nomes),
        "grupos_sem": por_grupo(y_te, pred2, X_te["programa_social"], nomes),
    }


def main():
    print("EduIA — experimentos complementares\n" + "=" * 40)
    res = {"uci": experimento_uci(), "sintetico_ablacao": experimento_sintetico()}
    with open(os.path.join(SAIDA, "resultados.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
    u, s = res["uci"], res["sintetico_ablacao"]
    print(f"\n[uci] RF teste: {u['teste_rf']} | regra: {u['teste_regra']}")
    print(f"[uci] regra CV: {u['regra_cv']}")
    print(f"[uci] RF CV: {u['cv']['Random Forest']}")
    print(f"[uci] RF sem notas F1 CV: {u['cv_rf_sem_notas']['f1']} | sem socio: {u['cv_rf_sem_socio']['f1']}")
    print(f"[sint] com socio: {s['teste_com']} | sem: {s['teste_sem']}")
    print(f"[ok] {SAIDA}")


if __name__ == "__main__":
    main()

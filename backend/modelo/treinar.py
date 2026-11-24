"""
EduIA — Pipeline de treinamento
================================
Execução (a partir de backend/):
    python modelo/treinar.py

Etapas:
  1. Carrega o CSV do INEP, se informado, ou gera o dataset sintético.
  2. Separa 20% para teste antes de qualquer transformação.
  3. Compara Random Forest, SVM e KNN por validação cruzada estratificada
     (10 folds). Padronização e SMOTE rodam DENTRO de cada fold, via
     imblearn.Pipeline, para que nenhuma amostra sintética vaze para a
     validação.
  4. Escolhe o vencedor pelo F1 médio da validação cruzada. O conjunto de
     teste só é usado depois da escolha, uma única vez.
  5. Compara o vencedor com uma regra pedagógica simples (baseline), para
     mostrar quanto o modelo acrescenta além de "frequência < 75 ou
     matemática < 45".
  6. Calcula SHAP para a classe "Alto" e salva figuras e métricas em
     modelo/artefatos/.

Sobre os dados sintéticos: o gerador cria três perfis com distribuições
separadas. As métricas medem a capacidade do modelo de recuperar esses
perfis, e não o desempenho em alunos reais. Diga isso na defesa.
"""

import os
import json
import pickle
import platform
import warnings
from datetime import datetime

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import shap
import sklearn

from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split, cross_validate, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix,
    f1_score, roc_auc_score, accuracy_score, recall_score,
)
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline

warnings.filterwarnings("ignore", category=FutureWarning)
SEED = 42

# ── Caminhos ──────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
ARTEFATOS_DIR = os.path.join(BASE_DIR, "artefatos")
os.makedirs(ARTEFATOS_DIR, exist_ok=True)

MODELO_PATH   = os.path.join(ARTEFATOS_DIR, "modelo_rf.pkl")
SCALER_PATH   = os.path.join(ARTEFATOS_DIR, "scaler.pkl")
METRICAS_PATH = os.path.join(ARTEFATOS_DIR, "metricas.json")

FEATURES = [
    "freq_escolar",       # frequência escolar (0–100)
    "nota_matematica",    # nota padronizada de Matemática (0–100)
    "nota_portugues",     # nota padronizada de Língua Portuguesa (0–100)
    "reprovacoes",        # reprovações anteriores (0–10)
    "ind_socioecon",      # índice socioeconômico da escola (0–10)
    "escola_rural",       # 1 = rural, 0 = urbana
    "programa_social",    # 1 = participa de programa social
]
ROTULOS_FEATURES = {
    "freq_escolar":    "Frequência",
    "nota_matematica": "Matemática",
    "nota_portugues":  "Português",
    "reprovacoes":     "Reprovações",
    "ind_socioecon":   "Nível socioeconômico",
    "escola_rural":    "Escola rural",
    "programa_social": "Programa social",
}
TARGET = "risco"            # 0 = baixo, 1 = médio, 2 = alto
LABELS = ["Baixo", "Médio", "Alto"]
CLASSE_ALTO = 2


# ══ 1. DADOS ═══════════════════════════════════════════════════════════════

def gerar_dados_sinteticos(n: int = 2000, seed: int = SEED) -> pd.DataFrame:
    """Gera três perfis de aluno (baixo, médio e alto risco) com
    distribuições inspiradas nos indicadores do SAEB."""
    rng = np.random.default_rng(seed)
    n_baixo = int(n * 0.50)
    n_medio = int(n * 0.30)
    n_alto  = n - n_baixo - n_medio

    def perfil(k, freq, mat, port, rep_p, social_p, rural_p, ise):
        return pd.DataFrame({
            "freq_escolar":    np.clip(rng.normal(freq[0], freq[1], k), 0, 100),
            "nota_matematica": np.clip(rng.normal(mat[0],  mat[1],  k), 0, 100),
            "nota_portugues":  np.clip(rng.normal(port[0], port[1], k), 0, 100),
            "reprovacoes":     rng.binomial(3, rep_p, k),
            "ind_socioecon":   np.clip(rng.normal(ise, 1.5, k), 0, 10),
            "escola_rural":    rng.binomial(1, rural_p, k),
            "programa_social": rng.binomial(1, social_p, k),
        })

    partes = [
        perfil(n_baixo, (92, 5),  (72, 12), (70, 12), 0.05, 0.20, 0.15, 6.5).assign(risco=0),
        perfil(n_medio, (80, 8),  (55, 14), (53, 14), 0.20, 0.45, 0.30, 4.5).assign(risco=1),
        perfil(n_alto,  (65, 12), (38, 14), (36, 14), 0.50, 0.70, 0.45, 3.0).assign(risco=2),
    ]
    df = pd.concat(partes, ignore_index=True)
    return df.sample(frac=1, random_state=seed).reset_index(drop=True)


def carregar_dados(caminho_csv: str | None = None) -> tuple[pd.DataFrame, str]:
    """Retorna (dataframe, origem). Com caminho_csv, tenta ler microdados
    do INEP; sem ele, gera o dataset sintético."""
    if caminho_csv and os.path.exists(caminho_csv):
        print(f"[dados] Lendo {caminho_csv}")
        df = pd.read_csv(caminho_csv, sep=";", encoding="latin1", low_memory=False)

        # ATENÇÃO: confira cada coluna no dicionário de dados do ano usado.
        # - Os microdados do SAEB por aluno NÃO trazem frequência nem número
        #   de reprovações; essas variáveis vêm do Censo Escolar ou da
        #   própria secretaria.
        # - INSE vem como nível (I a VIII); converta para número antes.
        # - TP_LOCALIZACAO: 1 = urbana, 2 = rural.
        # - IN_PROG_AEE indica Atendimento Educacional Especializado, que
        #   NÃO é programa social. Use a coluna de Bolsa Família/PBF, se
        #   houver.
        colunas_map = {
            "TX_FREQ":              "freq_escolar",
            "PROFICIENCIA_MT_SAEB": "nota_matematica",
            "PROFICIENCIA_LP_SAEB": "nota_portugues",
            "NU_REPROVACOES":       "reprovacoes",
            "INSE_NUM":             "ind_socioecon",
            "TP_LOCALIZACAO":       "escola_rural",
            "IN_BOLSA_FAMILIA":     "programa_social",
        }
        df = df.rename(columns=colunas_map)
        if "escola_rural" in df.columns:
            df["escola_rural"] = (df["escola_rural"] == 2).astype(int)
        for col in ["nota_matematica", "nota_portugues"]:
            if col in df.columns:
                mn, mx = df[col].min(), df[col].max()
                df[col] = (df[col] - mn) / (mx - mn) * 100

        # O rótulo abaixo é derivado de duas features. O modelo vai
        # aprender essa regra e as métricas vão sair infladas. Para um
        # estudo real, use um desfecho independente (reprovação ou
        # abandono no ano seguinte).
        df[TARGET] = 0
        df.loc[(df["freq_escolar"] < 85) | (df["nota_matematica"] < 60), TARGET] = 1
        df.loc[(df["freq_escolar"] < 75) | (df["nota_matematica"] < 45), TARGET] = 2
        origem = f"csv:{os.path.basename(caminho_csv)}"
    else:
        print("[dados] Gerando dataset sintético (2.000 registros)")
        df = gerar_dados_sinteticos()
        origem = "sintetico"

    df[FEATURES] = df[FEATURES].fillna(df[FEATURES].median(numeric_only=True))
    df = df.dropna(subset=[TARGET])
    df[TARGET] = df[TARGET].astype(int)
    print(f"[dados] {len(df)} registros | classes: {df[TARGET].value_counts().sort_index().to_dict()}")
    return df, origem


# ══ 2. MODELOS ═════════════════════════════════════════════════════════════

def montar_pipelines() -> dict[str, Pipeline]:
    """Cada pipeline padroniza, aplica SMOTE (só no treino de cada fold)
    e treina o classificador."""
    def pipe(clf):
        return Pipeline([
            ("scaler", StandardScaler()),
            ("smote",  SMOTE(random_state=SEED)),
            ("clf",    clf),
        ])
    return {
        "Random Forest": pipe(RandomForestClassifier(
            n_estimators=200, min_samples_leaf=2, random_state=SEED, n_jobs=-1)),
        "SVM (RBF)": pipe(SVC(kernel="rbf", C=1.0, probability=True, random_state=SEED)),
        "KNN (k=7)": pipe(KNeighborsClassifier(n_neighbors=7, weights="distance")),
    }


def validar(pipelines, X_train, y_train) -> dict:
    cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=SEED)
    resultados = {}
    for nome, p in pipelines.items():
        s = cross_validate(p, X_train, y_train, cv=cv, n_jobs=-1,
                           scoring={"f1": "f1_weighted", "auc": "roc_auc_ovr_weighted"})
        resultados[nome] = {
            "cv_f1_media": round(float(s["test_f1"].mean()), 4),
            "cv_f1_desvio": round(float(s["test_f1"].std()), 4),
            "cv_auc_media": round(float(s["test_auc"].mean()), 4),
        }
        print(f"[cv] {nome:14s} F1 = {s['test_f1'].mean():.4f} ± {s['test_f1'].std():.4f}")
    return resultados


def avaliar_teste(pipe, X_test, y_test) -> dict:
    y_pred = pipe.predict(X_test)
    y_prob = pipe.predict_proba(X_test)
    return {
        "acuracia": round(accuracy_score(y_test, y_pred), 4),
        "f1":       round(f1_score(y_test, y_pred, average="weighted"), 4),
        "auc":      round(roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted"), 4),
        "recall_alto": round(recall_score(y_test, y_pred, labels=[CLASSE_ALTO], average="macro"), 4),
    }


def regra_baseline(X: pd.DataFrame) -> np.ndarray:
    """Regra que um coordenador aplicaria sem modelo nenhum."""
    r = np.zeros(len(X), dtype=int)
    r[((X["freq_escolar"] < 85) | (X["nota_matematica"] < 60)).values] = 1
    r[((X["freq_escolar"] < 75) | (X["nota_matematica"] < 45)).values] = 2
    return r


# ══ 3. FIGURAS ═════════════════════════════════════════════════════════════

TINTA, PAPEL, AZUL = "#1f1d1a", "#fbfaf6", "#1d4e89"

def figura_matriz(cm: np.ndarray, titulo: str):
    fig, ax = plt.subplots(figsize=(5.2, 4.2), facecolor=PAPEL)
    ax.imshow(cm, cmap="Blues")
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            cor = "white" if cm[i, j] > cm.max() * 0.6 else TINTA
            ax.text(j, i, str(cm[i, j]), ha="center", va="center", color=cor, fontsize=13)
    ax.set_xticks(range(3), LABELS); ax.set_yticks(range(3), LABELS)
    ax.set_xlabel("Previsto pelo modelo"); ax.set_ylabel("Classe real")
    ax.set_title(titulo, fontsize=11, color=TINTA)
    fig.tight_layout()
    caminho = os.path.join(ARTEFATOS_DIR, "matriz_confusao.png")
    fig.savefig(caminho, dpi=160); plt.close(fig)
    print(f"[fig] {caminho}")


def valores_shap_classe(explainer, X_sc: np.ndarray, classe: int) -> np.ndarray:
    """Normaliza a saída do SHAP para (n_amostras, n_features).
    shap < 0.45 devolve lista por classe; shap >= 0.45 devolve array
    (n_amostras, n_features, n_classes)."""
    sv = explainer.shap_values(X_sc)
    if isinstance(sv, list):
        return np.asarray(sv[classe])
    sv = np.asarray(sv)
    return sv[..., classe] if sv.ndim == 3 else sv


def calcular_shap(rf, X_test_sc, X_test_orig: pd.DataFrame) -> list[dict]:
    explainer = shap.TreeExplainer(rf)
    sv_alto = valores_shap_classe(explainer, X_test_sc, CLASSE_ALTO)

    nomes = [ROTULOS_FEATURES[f] for f in FEATURES]
    plt.figure(facecolor=PAPEL)
    shap.summary_plot(sv_alto, X_test_orig.values, feature_names=nomes, show=False)
    plt.title("Contribuição de cada variável para a classe Alto risco", fontsize=11)
    plt.xlabel("Valor SHAP (impacto na probabilidade de risco alto)")
    plt.tight_layout()
    caminho = os.path.join(ARTEFATOS_DIR, "shap_summary.png")
    plt.savefig(caminho, dpi=160, bbox_inches="tight"); plt.close()
    print(f"[fig] {caminho}")

    imp = np.abs(sv_alto).mean(axis=0)
    total = imp.sum() or 1.0
    ranking = sorted(
        ({"variavel": f, "rotulo": ROTULOS_FEATURES[f], "importancia": round(float(v / total * 100), 1)}
         for f, v in zip(FEATURES, imp)),
        key=lambda d: d["importancia"], reverse=True,
    )
    return ranking


# ══ MAIN ═══════════════════════════════════════════════════════════════════

def main(caminho_csv: str | None = None):
    print("\nEduIA — pipeline de treinamento\n" + "=" * 40)
    df, origem = carregar_dados(caminho_csv)
    X, y = df[FEATURES], df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=SEED)

    pipelines = montar_pipelines()
    cv = validar(pipelines, X_train, y_train)
    vencedor = max(cv, key=lambda n: cv[n]["cv_f1_media"])
    print(f"[cv] Vencedor pela validação cruzada: {vencedor}")

    rf_cv, top = cv["Random Forest"], cv[vencedor]
    if vencedor == "Random Forest":
        justificativa = "Maior F1 médio na validação cruzada."
    else:
        dif = top["cv_f1_media"] - rf_cv["cv_f1_media"]
        empate = dif <= max(top["cv_f1_desvio"], rf_cv["cv_f1_desvio"])
        justificativa = (
            f"{vencedor} teve F1 médio {dif:.4f} acima do Random Forest na CV"
            + (", diferença menor que um desvio padrão (empate técnico)." if empate else ".")
            + " Random Forest segue em produção porque o TreeExplainer dá explicações SHAP"
              " exatas por aluno em milissegundos."
        )

    modelos = {}
    for nome, p in pipelines.items():
        p.fit(X_train, y_train)
        modelos[nome] = {**cv[nome], "teste": avaliar_teste(p, X_test, y_test)}

    base_pred = regra_baseline(X_test)
    baseline = {
        "descricao": "freq < 75 ou mat < 45 → alto; freq < 85 ou mat < 60 → médio",
        "acuracia": round(accuracy_score(y_test, base_pred), 4),
        "f1": round(f1_score(y_test, base_pred, average="weighted"), 4),
        "recall_alto": round(recall_score(y_test, base_pred, labels=[CLASSE_ALTO], average="macro"), 4),
    }

    # Random Forest é o modelo de produção: é o único com TreeExplainer
    # exato e rápido. Se outro modelo vencer a CV, o relatório registra.
    rf_pipe = pipelines["Random Forest"]
    y_pred = rf_pipe.predict(X_test)
    cm = confusion_matrix(y_test, y_pred)
    figura_matriz(cm, f"Matriz de confusão — Random Forest (n={len(y_test)})")
    rep = classification_report(y_test, y_pred, target_names=LABELS, output_dict=True, zero_division=0)
    print(classification_report(y_test, y_pred, target_names=LABELS, zero_division=0))

    scaler, rf = rf_pipe.named_steps["scaler"], rf_pipe.named_steps["clf"]
    shap_global = calcular_shap(rf, scaler.transform(X_test), X_test)

    metricas = {
        "gerado_em": datetime.now().isoformat(timespec="seconds"),
        "origem_dados": origem,
        "n_registros": int(len(df)),
        "n_treino": int(len(X_train)),
        "n_teste": int(len(X_test)),
        "validacao": "StratifiedKFold 10 folds, SMOTE dentro de cada fold",
        "vencedor_cv": vencedor,
        "modelo_producao": "Random Forest",
        "justificativa_producao": justificativa,
        "modelos": modelos,
        "baseline_regra": baseline,
        "matriz_confusao": {"labels": LABELS, "valores": cm.tolist()},
        "por_classe": {k: {m: round(v[m], 4) for m in ("precision", "recall", "f1-score")}
                       for k, v in rep.items() if k in LABELS},
        "shap_global_alto": shap_global,
        "versoes": {"python": platform.python_version(), "sklearn": sklearn.__version__,
                    "shap": shap.__version__},
    }

    with open(MODELO_PATH, "wb") as f: pickle.dump(rf, f)
    with open(SCALER_PATH, "wb") as f: pickle.dump(scaler, f)
    with open(METRICAS_PATH, "w", encoding="utf-8") as f:
        json.dump(metricas, f, indent=2, ensure_ascii=False)
    # Explainer antigo (pickle de 9 MB, frágil entre versões do shap) não é
    # mais salvo; a API recria o TreeExplainer a partir do modelo.
    antigo = os.path.join(ARTEFATOS_DIR, "shap_explainer.pkl")
    if os.path.exists(antigo):
        os.remove(antigo)

    t = modelos["Random Forest"]["teste"]
    print(f"\nRandom Forest no teste: acurácia {t['acuracia']:.4f} | F1 {t['f1']:.4f} | AUC {t['auc']:.4f}")
    print(f"Regra simples no teste: acurácia {baseline['acuracia']:.4f} | F1 {baseline['f1']:.4f}")
    print(f"[ok] Artefatos em {ARTEFATOS_DIR}")
    print("Próximo passo: python modelo/exportar_demo.py  (atualiza os dados do frontend)")


if __name__ == "__main__":
    main(caminho_csv=None)

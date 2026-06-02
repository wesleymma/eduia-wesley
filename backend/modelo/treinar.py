"""
EduIA — Módulo de Treinamento
==============================
Execução:
    python modelo/treinar.py

O que este arquivo faz:
  1. Carrega (ou gera) o dataset educacional
  2. Pré-processamento: limpeza, encoding, normalização, SMOTE
  3. Treina e compara Random Forest, SVM e KNN
  4. Avalia com F1, AUC-ROC, matriz de confusão
  5. Salva modelo, scaler e explainer SHAP em modelo/artefatos/
  6. Gera gráficos: matriz de confusão e SHAP summary plot

Para usar com dados reais do INEP:
  - Baixe os microdados do SAEB em https://www.gov.br/inep/
  - Passe o caminho do CSV em: carregar_dados(caminho_csv='dados/saeb.csv')
"""

import os
import json
import warnings
import pickle

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import shap

from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import (
    train_test_split, cross_val_score, StratifiedKFold, GridSearchCV
)
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix,
    f1_score, roc_auc_score, accuracy_score
)
from imblearn.over_sampling import SMOTE

warnings.filterwarnings('ignore')
np.random.seed(42)

# ── Configurações ──────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
ARTEFATOS_DIR = os.path.join(BASE_DIR, 'artefatos')
os.makedirs(ARTEFATOS_DIR, exist_ok=True)

MODELO_PATH   = os.path.join(ARTEFATOS_DIR, 'modelo_rf.pkl')
SCALER_PATH   = os.path.join(ARTEFATOS_DIR, 'scaler.pkl')
SHAP_PATH     = os.path.join(ARTEFATOS_DIR, 'shap_explainer.pkl')
METRICAS_PATH = os.path.join(ARTEFATOS_DIR, 'metricas.json')

FEATURES = [
    'freq_escolar',       # Taxa de frequência escolar (0–100)
    'nota_matematica',    # Nota padronizada SAEB Matemática (0–100)
    'nota_portugues',     # Nota padronizada SAEB Língua Portuguesa (0–100)
    'reprovacoes',        # Nº de reprovações anteriores (0–10)
    'ind_socioecon',      # Índice socioeconômico da escola — INSE (0–10)
    'escola_rural',       # 1 = rural, 0 = urbana
    'programa_social',    # 1 = participa de programa social
]
TARGET = 'risco'  # 0 = baixo, 1 = medio, 2 = alto
LABELS = ['Baixo', 'Medio', 'Alto']


# ══ 1. DADOS ════════════════════════════════════════════════════════════════

def gerar_dados_sinteticos(n: int = 2000) -> pd.DataFrame:
    """
    Gera dataset sintético com distribuição realista baseada nos
    padrões dos microdados do SAEB para prototipagem.
    Substitua por carregar_dados(caminho_csv=...) para dados reais.
    """
    np.random.seed(42)
    n_baixo = int(n * 0.50)
    n_medio = int(n * 0.30)
    n_alto  = n - n_baixo - n_medio

    def perfil(n, freq_mu, freq_sd, mat_mu, mat_sd,
               port_mu, port_sd, rep_p, social_p, rural_p, ise_mu):
        return pd.DataFrame({
            'freq_escolar':    np.clip(np.random.normal(freq_mu, freq_sd, n), 0, 100),
            'nota_matematica': np.clip(np.random.normal(mat_mu,  mat_sd,  n), 0, 100),
            'nota_portugues':  np.clip(np.random.normal(port_mu, port_sd, n), 0, 100),
            'reprovacoes':     np.random.binomial(3, rep_p, n),
            'ind_socioecon':   np.clip(np.random.normal(ise_mu, 1.5, n), 0, 10),
            'escola_rural':    np.random.binomial(1, rural_p, n),
            'programa_social': np.random.binomial(1, social_p, n),
        })

    df_baixo = perfil(n_baixo, 92, 5,  72, 12, 70, 12, 0.05, 0.20, 0.15, 6.5)
    df_medio = perfil(n_medio, 80, 8,  55, 14, 53, 14, 0.20, 0.45, 0.30, 4.5)
    df_alto  = perfil(n_alto,  65, 12, 38, 14, 36, 14, 0.50, 0.70, 0.45, 3.0)

    df_baixo[TARGET] = 0
    df_medio[TARGET] = 1
    df_alto[TARGET]  = 2

    df = pd.concat([df_baixo, df_medio, df_alto], ignore_index=True)
    return df.sample(frac=1, random_state=42).reset_index(drop=True)


def carregar_dados(caminho_csv: str = None) -> pd.DataFrame:
    """
    Carrega e normaliza o dataset educacional.
    Se caminho_csv for informado, usa dados reais do INEP.
    Caso contrário, gera dataset sintético.
    """
    if caminho_csv and os.path.exists(caminho_csv):
        print(f"[dados] Carregando {caminho_csv}...")
        df = pd.read_csv(caminho_csv, sep=';', encoding='latin1', low_memory=False)

        # Mapeamento das colunas reais do INEP — ajuste conforme necessário
        colunas_map = {
            'TX_FREQ':               'freq_escolar',
            'PROFICIENCIA_MT_SAEB':  'nota_matematica',
            'PROFICIENCIA_LP_SAEB':  'nota_portugues',
            'NU_REPROVACOES':        'reprovacoes',
            'INSE_CLASSIFICACAO':    'ind_socioecon',
            'TP_LOCALIZACAO':        'escola_rural',
            'IN_PROG_AEE':           'programa_social',
        }
        df = df.rename(columns=colunas_map)

        # Normalizar notas SAEB para escala 0–100
        for col in ['nota_matematica', 'nota_portugues']:
            if col in df.columns:
                mn, mx = df[col].min(), df[col].max()
                df[col] = (df[col] - mn) / (mx - mn) * 100

        # Construir variável-alvo com base em critérios pedagógicos
        df[TARGET] = 0
        df.loc[(df['freq_escolar'] < 85) | (df['nota_matematica'] < 60), TARGET] = 1
        df.loc[(df['freq_escolar'] < 75) | (df['nota_matematica'] < 45), TARGET] = 2
    else:
        print("[dados] Gerando dataset sintético para prototipagem...")
        df = gerar_dados_sinteticos()

    # Tratar valores ausentes
    df[FEATURES] = df[FEATURES].fillna(df[FEATURES].median(numeric_only=True))
    df = df.dropna(subset=[TARGET])
    df[TARGET] = df[TARGET].astype(int)

    dist = df[TARGET].value_counts().sort_index().to_dict()
    print(f"[dados] {len(df)} registros | {dist}")
    return df


# ══ 2. PRÉ-PROCESSAMENTO ════════════════════════════════════════════════════

def preprocessar(df: pd.DataFrame):
    X = df[FEATURES].copy()
    y = df[TARGET].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc  = scaler.transform(X_test)

    # SMOTE apenas no conjunto de treino
    sm = SMOTE(random_state=42)
    X_train_bal, y_train_bal = sm.fit_resample(X_train_sc, y_train)

    dist_bal = dict(zip(*np.unique(y_train_bal, return_counts=True)))
    print(f"[prep]  Após SMOTE: {dist_bal}")

    return X_train_bal, X_test_sc, y_train_bal, y_test, scaler, X_test


# ══ 3. TREINAMENTO ══════════════════════════════════════════════════════════

def treinar_modelos(X_train, y_train):
    modelos = {
        'Random Forest': RandomForestClassifier(
            n_estimators=200, max_depth=None,
            min_samples_leaf=2, random_state=42, n_jobs=-1
        ),
        'SVM': SVC(
            kernel='rbf', C=1.0, probability=True, random_state=42
        ),
        'KNN': KNeighborsClassifier(
            n_neighbors=7, weights='distance'
        ),
    }

    cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
    resultados = {}

    for nome, modelo in modelos.items():
        scores = cross_val_score(
            modelo, X_train, y_train,
            cv=cv, scoring='f1_weighted', n_jobs=-1
        )
        modelo.fit(X_train, y_train)
        resultados[nome] = {
            'modelo': modelo,
            'cv_f1':  scores.mean(),
            'cv_std': scores.std()
        }
        print(f"[treino] {nome}: F1-CV = {scores.mean():.4f} ± {scores.std():.4f}")

    return resultados


# ══ 4. AVALIAÇÃO ════════════════════════════════════════════════════════════

def avaliar(resultados, X_test, y_test):
    print("\n" + "="*55)
    print("COMPARAÇÃO — CONJUNTO DE TESTE")
    print("="*55)

    metricas_finais = {}
    melhor_nome, melhor_f1 = None, 0.0

    for nome, res in resultados.items():
        modelo = res['modelo']
        y_pred = modelo.predict(X_test)
        y_prob = modelo.predict_proba(X_test)

        acc = accuracy_score(y_test, y_pred)
        f1  = f1_score(y_test, y_pred, average='weighted')
        auc = roc_auc_score(
            y_test, y_prob, multi_class='ovr', average='weighted'
        )

        print(f"\n{nome}")
        print(f"  Acurácia : {acc:.4f}")
        print(f"  F1 (w)   : {f1:.4f}")
        print(f"  AUC-ROC  : {auc:.4f}")
        print(classification_report(
            y_test, y_pred,
            target_names=LABELS, zero_division=0
        ))

        metricas_finais[nome] = {
            'acuracia': round(acc, 4),
            'f1':       round(f1,  4),
            'auc':      round(auc, 4)
        }

        if f1 > melhor_f1:
            melhor_f1   = f1
            melhor_nome = nome

    print(f"\n✅ Modelo vencedor: {melhor_nome} (F1 = {melhor_f1:.4f})")

    # Matriz de confusão do vencedor
    y_pred_best = resultados[melhor_nome]['modelo'].predict(X_test)
    cm = confusion_matrix(y_test, y_pred_best)
    plt.figure(figsize=(6, 4))
    sns.heatmap(
        cm, annot=True, fmt='d', cmap='Blues',
        xticklabels=LABELS, yticklabels=LABELS
    )
    plt.title(f'Matriz de Confusão — {melhor_nome}')
    plt.tight_layout()
    fig_path = os.path.join(ARTEFATOS_DIR, 'matriz_confusao.png')
    plt.savefig(fig_path, dpi=150)
    plt.close()
    print(f"[avaliação] Figura salva: {fig_path}")

    return resultados[melhor_nome]['modelo'], metricas_finais, melhor_nome


# ══ 5. SHAP ═════════════════════════════════════════════════════════════════

def gerar_shap(modelo, X_test_orig: pd.DataFrame, X_test_sc: np.ndarray):
    print("[shap] Calculando valores SHAP...")
    explainer   = shap.TreeExplainer(modelo)
    shap_values = explainer.shap_values(X_test_sc)

    plt.figure()
    shap.summary_plot(
        shap_values, X_test_orig,
        feature_names=FEATURES, show=False
    )
    plt.tight_layout()
    fig_path = os.path.join(ARTEFATOS_DIR, 'shap_summary.png')
    plt.savefig(fig_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f"[shap]  Figura salva: {fig_path}")
    return explainer


# ══ 6. PERSISTÊNCIA ═════════════════════════════════════════════════════════

def salvar(modelo, scaler, explainer, metricas):
    with open(MODELO_PATH,   'wb') as f: pickle.dump(modelo,    f)
    with open(SCALER_PATH,   'wb') as f: pickle.dump(scaler,    f)
    with open(SHAP_PATH,     'wb') as f: pickle.dump(explainer, f)
    with open(METRICAS_PATH, 'w')  as f: json.dump(metricas,    f, indent=2)
    print(f"\n[salvo] {MODELO_PATH}")
    print(f"[salvo] {SCALER_PATH}")
    print(f"[salvo] {SHAP_PATH}")
    print(f"[salvo] {METRICAS_PATH}")


# ══ MAIN ════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("\n" + "="*55)
    print("EduIA — Pipeline de Treinamento")
    print("="*55 + "\n")

    # Troque None pelo caminho real do CSV quando disponível
    df = carregar_dados(caminho_csv=None)

    X_train, X_test_sc, y_train, y_test, scaler, X_test_orig = preprocessar(df)
    resultados = treinar_modelos(X_train, y_train)
    melhor_modelo, metricas, nome_vencedor = avaliar(resultados, X_test_sc, y_test)

    if 'Random Forest' in nome_vencedor:
        explainer = gerar_shap(melhor_modelo, X_test_orig, X_test_sc)
    else:
        explainer = shap.KernelExplainer(
            melhor_modelo.predict_proba,
            shap.sample(X_test_sc, 50)
        )

    salvar(melhor_modelo, scaler, explainer, metricas)
    print("\n✅ Pipeline concluído. Execute: uvicorn api.api:app --reload")

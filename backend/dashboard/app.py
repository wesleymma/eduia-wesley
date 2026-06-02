"""
EduIA — Dashboard Streamlit
============================
Execução:
    streamlit run dashboard/app.py

Requer a API rodando em http://localhost:8000:
    uvicorn api.api:app --reload --port 8000

Caso a API não esteja disponível, o sistema entra em modo
demonstração com dados sintéticos automaticamente.
"""

import requests
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from typing import List, Dict, Optional

# ── Configuração da página ─────────────────────────────────────────────────
st.set_page_config(
    page_title="EduIA — Monitor de Aprendizagem",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Estilo customizado ─────────────────────────────────────────────────────
st.markdown("""
<style>
  .stApp { background-color: #0f1117; }
  section[data-testid="stSidebar"] { background-color: #171b26; }
  div[data-testid="metric-container"] {
    background: #171b26;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; padding: 14px;
  }
  h1,h2,h3 { color: #e8eaf0 !important; }
  p, label { color: #a0a4b8 !important; }
  .risk-alto  { color:#ff4d6d; background:rgba(255,77,109,.15);
                padding:3px 10px; border-radius:20px; font-weight:600; font-size:12px; }
  .risk-medio { color:#f5a623; background:rgba(245,166,35,.15);
                padding:3px 10px; border-radius:20px; font-weight:600; font-size:12px; }
  .risk-baixo { color:#2dd4a0; background:rgba(45,212,160,.15);
                padding:3px 10px; border-radius:20px; font-weight:600; font-size:12px; }
  .int-box {
    background:rgba(245,166,35,.1); border:1px solid rgba(245,166,35,.25);
    border-radius:8px; padding:12px 16px; color:#f5a623; font-size:13px; line-height:1.6;
  }
</style>
""", unsafe_allow_html=True)

# ── Constantes ─────────────────────────────────────────────────────────────
API_URL  = "http://localhost:8000"
COR_RISCO = {'alto': '#ff4d6d', 'medio': '#f5a623', 'baixo': '#2dd4a0'}

# ── Cadastro de professores ─────────────────────────────────────────────────
PROFESSORES = [
    {"id": "admin", "nome": "Ana Lima",      "email": "ana.lima@escola.edu.br",
     "senha": "admin123", "role": "admin",
     "disciplinas": ["Coordenação"], "turmas": ["7A","8B","9C"]},
    {"id": "prof1", "nome": "Carlos Rocha",  "email": "carlos.rocha@escola.edu.br",
     "senha": "prof123",  "role": "professor",
     "disciplinas": ["Matemática"], "turmas": ["7A","8B","9C"]},
    {"id": "prof2", "nome": "Maria Souza",   "email": "maria.souza@escola.edu.br",
     "senha": "prof123",  "role": "professor",
     "disciplinas": ["História","Geografia"], "turmas": ["7A","8B"]},
    {"id": "prof3", "nome": "Pedro Alves",   "email": "pedro.alves@escola.edu.br",
     "senha": "prof123",  "role": "professor",
     "disciplinas": ["Português"], "turmas": ["7A","8B","9C"]},
]

# ── Dados de demonstração ──────────────────────────────────────────────────
DEMO_TURMAS = {
    "7A": [
        {"nome":"Lucas Mendes",   "freq_escolar":61,"nota_matematica":32,"nota_portugues":28,"reprovacoes":2,"ind_socioecon":3.2,"escola_rural":0,"programa_social":1},
        {"nome":"Beatriz Santos", "freq_escolar":65,"nota_matematica":29,"nota_portugues":33,"reprovacoes":1,"ind_socioecon":3.0,"escola_rural":0,"programa_social":1},
        {"nome":"Ana Paula",      "freq_escolar":70,"nota_matematica":41,"nota_portugues":35,"reprovacoes":1,"ind_socioecon":3.8,"escola_rural":0,"programa_social":0},
        {"nome":"Carlos Rocha",   "freq_escolar":78,"nota_matematica":55,"nota_portugues":60,"reprovacoes":0,"ind_socioecon":4.5,"escola_rural":0,"programa_social":0},
        {"nome":"Felipe Torres",  "freq_escolar":82,"nota_matematica":62,"nota_portugues":57,"reprovacoes":0,"ind_socioecon":5.0,"escola_rural":0,"programa_social":0},
        {"nome":"Camila Nunes",   "freq_escolar":94,"nota_matematica":78,"nota_portugues":74,"reprovacoes":0,"ind_socioecon":6.5,"escola_rural":0,"programa_social":0},
        {"nome":"Rafael Lima",    "freq_escolar":96,"nota_matematica":82,"nota_portugues":80,"reprovacoes":0,"ind_socioecon":7.0,"escola_rural":0,"programa_social":0},
    ],
    "8B": [
        {"nome":"Mariana Lopes",  "freq_escolar":68,"nota_matematica":38,"nota_portugues":42,"reprovacoes":1,"ind_socioecon":3.5,"escola_rural":0,"programa_social":1},
        {"nome":"Thiago Barbosa", "freq_escolar":72,"nota_matematica":31,"nota_portugues":36,"reprovacoes":2,"ind_socioecon":3.0,"escola_rural":0,"programa_social":1},
        {"nome":"Diego Ferreira", "freq_escolar":80,"nota_matematica":52,"nota_portugues":55,"reprovacoes":0,"ind_socioecon":4.8,"escola_rural":0,"programa_social":0},
        {"nome":"Sofia Alves",    "freq_escolar":83,"nota_matematica":58,"nota_portugues":61,"reprovacoes":0,"ind_socioecon":5.2,"escola_rural":0,"programa_social":0},
        {"nome":"Gabriela Costa", "freq_escolar":92,"nota_matematica":75,"nota_portugues":77,"reprovacoes":0,"ind_socioecon":6.8,"escola_rural":0,"programa_social":0},
    ],
    "9C": [
        {"nome":"Renata Oliveira","freq_escolar":59,"nota_matematica":27,"nota_portugues":30,"reprovacoes":2,"ind_socioecon":2.8,"escola_rural":1,"programa_social":1},
        {"nome":"Eduardo Klein",  "freq_escolar":66,"nota_matematica":35,"nota_portugues":31,"reprovacoes":1,"ind_socioecon":3.2,"escola_rural":0,"programa_social":1},
        {"nome":"Bruno Viana",    "freq_escolar":77,"nota_matematica":52,"nota_portugues":58,"reprovacoes":0,"ind_socioecon":4.5,"escola_rural":0,"programa_social":0},
        {"nome":"Leticia Neves",  "freq_escolar":80,"nota_matematica":58,"nota_portugues":54,"reprovacoes":0,"ind_socioecon":5.0,"escola_rural":0,"programa_social":0},
        {"nome":"Camila Zanetti", "freq_escolar":95,"nota_matematica":80,"nota_portugues":76,"reprovacoes":0,"ind_socioecon":7.2,"escola_rural":0,"programa_social":0},
    ],
}


# ══ AUTENTICAÇÃO ════════════════════════════════════════════════════════════

def tela_login():
    col1, col2, col3 = st.columns([1, 1.5, 1])
    with col2:
        st.markdown("## 🎓 EduIA")
        st.markdown("*Monitor de Aprendizagem — E.E. Dom Bosco, São Luís/MA*")
        st.markdown("---")
        email = st.text_input("E-mail", placeholder="professor@escola.edu.br")
        senha = st.text_input("Senha", type="password", placeholder="••••••••")

        if st.button("Entrar no sistema", use_container_width=True, type="primary"):
            prof = next(
                (p for p in PROFESSORES
                 if p["email"].lower() == email.lower() and p["senha"] == senha),
                None
            )
            if prof:
                st.session_state["user"] = prof
                st.session_state["turma"] = prof["turmas"][0]
                st.rerun()
            else:
                st.error("E-mail ou senha incorretos.")

        st.markdown("---")
        st.markdown("**Acesso rápido (demonstração):**")
        for p in PROFESSORES:
            label = f"{p['nome']} — {', '.join(p['disciplinas'])}"
            if st.button(label, key=f"quick_{p['id']}", use_container_width=True):
                st.session_state["user"] = p
                st.session_state["turma"] = p["turmas"][0]
                st.rerun()


# ══ API ═════════════════════════════════════════════════════════════════════

@st.cache_data(ttl=300)
def chamar_api_turma(alunos_json: str) -> Optional[Dict]:
    try:
        resp = requests.post(
            f"{API_URL}/prever/turma",
            json={"alunos": eval(alunos_json)},
            timeout=10
        )
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


@st.cache_data(ttl=60)
def chamar_api_metricas() -> Optional[Dict]:
    try:
        resp = requests.get(f"{API_URL}/metricas", timeout=5)
        return resp.json() if resp.ok else None
    except Exception:
        return None


def modo_demo(alunos: List[Dict]) -> Dict:
    """Gera predições simuladas quando a API está offline."""
    resultados = []
    for a in alunos:
        score = 0
        if a["freq_escolar"] < 75:     score += 3
        elif a["freq_escolar"] < 85:   score += 1
        if a["nota_matematica"] < 45:  score += 3
        elif a["nota_matematica"] < 60:score += 1
        if a["nota_portugues"] < 45:   score += 2
        if a["reprovacoes"] >= 2:      score += 2
        elif a["reprovacoes"] == 1:    score += 1

        if score >= 5:
            risco, prob = 'alto',  min(95, 65 + score * 3)
        elif score >= 2:
            risco, prob = 'medio', min(75, 45 + score * 5)
        else:
            risco, prob = 'baixo', max(10, 25 - score * 3)

        acoes = []
        if a["freq_escolar"]    < 75: acoes.append("contato com família sobre frequência")
        if a["nota_matematica"] < 50: acoes.append("reforço de matemática")
        if a["nota_portugues"]  < 50: acoes.append("reforço de leitura")
        if a["programa_social"] and risco == 'alto':
            acoes.append("articulação com assistente social")
        intervencao = (
            "Recomenda-se: " + "; ".join(acoes) + "."
            if acoes else "Desempenho satisfatório. Monitoramento bimestral."
        )

        resultados.append({
            "nome": a["nome"], "risco": risco, "probabilidade": prob,
            "probabilidades": {"alto": prob, "medio": 10, "baixo": max(0, 90 - prob)},
            "shap": [
                {"variavel":"freq_escolar",    "contribuicao":38,"direcao":"aumenta_risco"},
                {"variavel":"nota_matematica", "contribuicao":31,"direcao":"aumenta_risco"},
                {"variavel":"nota_portugues",  "contribuicao":18,"direcao":"aumenta_risco"},
                {"variavel":"reprovacoes",     "contribuicao":13,"direcao":"aumenta_risco"},
            ],
            "intervencao": intervencao,
            "cor": COR_RISCO[risco],
        })

    cont = {r: sum(1 for a in resultados if a["risco"] == r)
            for r in ["alto","medio","baixo"]}
    return {"total": len(resultados), **cont, "alunos": resultados}


# ══ COMPONENTES ═════════════════════════════════════════════════════════════

def render_metricas(dados: Dict, turma: str):
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("👥 Total de alunos", dados["total"], f"Turma {turma}")
    c2.metric("🔴 Risco alto",  dados["alto"],
              f"{round(dados['alto']/dados['total']*100)}% da turma",
              delta_color="inverse")
    c3.metric("🟡 Risco médio", dados["medio"],
              f"{round(dados['medio']/dados['total']*100)}% da turma",
              delta_color="off")
    c4.metric("🟢 Sem risco",   dados["baixo"],
              f"{round(dados['baixo']/dados['total']*100)}% da turma")


def render_grafico_distribuicao(dados: Dict):
    fig = go.Figure(go.Pie(
        labels=["Risco alto","Risco médio","Sem risco"],
        values=[dados["alto"], dados["medio"], dados["baixo"]],
        marker_colors=["#ff4d6d","#f5a623","#2dd4a0"],
        hole=0.6, textinfo="label+percent", textfont_size=13,
    ))
    fig.update_layout(
        showlegend=False, height=240,
        margin=dict(t=10,b=10,l=10,r=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font_color="#a0a4b8",
    )
    st.plotly_chart(fig, use_container_width=True)


def render_grafico_desempenho(alunos_resp: List[Dict], alunos_data: List[Dict]):
    dados_map = {a["nome"]: a for a in alunos_data}
    nomes = [a["nome"].split()[0] for a in alunos_resp]
    mats  = [dados_map.get(a["nome"],{}).get("nota_matematica", 0) for a in alunos_resp]
    ports = [dados_map.get(a["nome"],{}).get("nota_portugues",  0) for a in alunos_resp]

    fig = go.Figure()
    fig.add_trace(go.Bar(name="Matemática", x=nomes, y=mats,
                         marker_color="#4f8ef7", opacity=0.85))
    fig.add_trace(go.Bar(name="Português",  x=nomes, y=ports,
                         marker_color="#2dd4a0", opacity=0.65))
    fig.add_hline(y=50, line_dash="dot", line_color="#ff4d6d",
                  annotation_text="Mín. adequado", annotation_font_color="#ff4d6d")
    fig.update_layout(
        barmode="group", height=240,
        margin=dict(t=10,b=10,l=10,r=10),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font_color="#a0a4b8",
        legend=dict(orientation="h", yanchor="bottom", y=1),
        yaxis=dict(range=[0,100], gridcolor="rgba(255,255,255,.05)"),
        xaxis=dict(gridcolor="rgba(255,255,255,.05)"),
    )
    st.plotly_chart(fig, use_container_width=True)


def render_shap_global():
    labels = ["Frequência escolar","Nota matemática","Nota português","Reprovações ant."]
    vals   = [38, 31, 18, 13]
    cores  = ["#ff4d6d","#f5a623","#4f8ef7","#7a7f94"]
    fig = go.Figure(go.Bar(
        x=vals, y=labels, orientation="h",
        marker_color=cores,
        text=[f"{v}%" for v in vals],
        textposition="outside", textfont=dict(color="#a0a4b8", size=12),
    ))
    fig.update_layout(
        height=200, margin=dict(t=10,b=10,l=10,r=50),
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font_color="#a0a4b8", xaxis=dict(visible=False),
    )
    st.plotly_chart(fig, use_container_width=True)


def render_detalhe_aluno(aluno_data: Dict, aluno_resp: Dict):
    risco = aluno_resp["risco"]
    cor   = COR_RISCO[risco]
    st.markdown(f"### {aluno_resp['nome']}")
    st.markdown(
        f"<span class='risk-{risco}'>{risco.upper()} — "
        f"{aluno_resp['probabilidade']:.0f}%</span>",
        unsafe_allow_html=True
    )
    st.markdown("---")
    c1, c2, c3 = st.columns(3)
    c1.metric("Frequência", f"{aluno_data.get('freq_escolar','-')}%")
    c2.metric("Matemática", aluno_data.get("nota_matematica", "-"))
    c3.metric("Português",  aluno_data.get("nota_portugues",  "-"))

    st.markdown("**Fatores SHAP — por que este risco?**")
    nomes_pt = {
        "freq_escolar":    "Frequência",
        "nota_matematica": "Matemática",
        "nota_portugues":  "Português",
        "reprovacoes":     "Reprovações",
        "ind_socioecon":   "Nível socioecon.",
        "escola_rural":    "Escola rural",
        "programa_social": "Prog. social",
    }
    cores_shap = {
        "freq_escolar": "#ff4d6d", "nota_matematica": "#f5a623",
        "nota_portugues": "#4f8ef7", "reprovacoes": "#7a7f94",
    }
    for item in aluno_resp.get("shap", [])[:4]:
        lbl = nomes_pt.get(item["variavel"], item["variavel"])
        cor_s = cores_shap.get(item["variavel"], "#7a7f94")
        pct   = item["contribuicao"]
        st.markdown(
            f"<div style='display:flex;align-items:center;gap:8px;margin-bottom:6px;'>"
            f"<span style='font-size:11px;color:#a0a4b8;width:120px;'>{lbl}</span>"
            f"<div style='flex:1;height:5px;background:rgba(255,255,255,.08);border-radius:4px;'>"
            f"<div style='width:{pct}%;height:5px;background:{cor_s};border-radius:4px;'></div></div>"
            f"<span style='font-size:11px;color:#a0a4b8;'>{pct}%</span>"
            f"</div>",
            unsafe_allow_html=True
        )
    st.markdown(
        f"<div class='int-box'><strong>💡 Intervenção sugerida</strong>"
        f"{aluno_resp['intervencao']}</div>",
        unsafe_allow_html=True
    )


def exportar_csv(turma: str, resultado: Dict) -> bytes:
    bom = "\uFEFF"
    sep = ";"
    cab = sep.join(["Nome","Turma","Risco","Prob(%)","Intervenção"])
    linhas = [bom + cab]
    for a in resultado["alunos"]:
        linhas.append(sep.join([
            a["nome"], turma, a["risco"],
            str(a["probabilidade"]), a["intervencao"]
        ]))
    return "\n".join(linhas).encode("utf-8")


# ══ APP PRINCIPAL ════════════════════════════════════════════════════════════

def main():
    # Verificar autenticação
    if "user" not in st.session_state:
        tela_login()
        return

    user  = st.session_state["user"]
    turma = st.session_state.get("turma", user["turmas"][0])

    # ── Sidebar ──────────────────────────────────────────────────────────
    with st.sidebar:
        st.markdown(f"## 🎓 EduIA")
        st.markdown("*Monitor de Aprendizagem*")
        st.markdown("---")
        st.markdown(f"**{user['nome']}**")
        st.caption(", ".join(user["disciplinas"]))
        if st.button("Sair", key="logout"):
            del st.session_state["user"]
            st.rerun()
        st.markdown("---")

        st.markdown("**Minhas turmas**")
        for tk in user["turmas"]:
            if st.button(f"Turma {tk}", key=f"turma_{tk}",
                         use_container_width=True,
                         type="primary" if turma == tk else "secondary"):
                st.session_state["turma"] = tk
                st.rerun()

        st.markdown("---")
        metricas_api = chamar_api_metricas()
        if metricas_api:
            st.success("🟢 API conectada")
            rf = metricas_api.get("Random Forest", {})
            st.metric("Acurácia (RF)",  f"{rf.get('acuracia','-'):.1%}"
                      if isinstance(rf.get("acuracia"), float) else "-")
            st.metric("F1-Score (RF)",  f"{rf.get('f1','-'):.1%}"
                      if isinstance(rf.get("f1"), float) else "-")
        else:
            st.warning("🟡 Modo demonstração\n(API offline)")

        st.markdown("---")
        uploaded = st.file_uploader(
            "Importar CSV da turma", type=["csv"],
            help="Colunas: nome, freq_escolar, nota_matematica, nota_portugues, "
                 "reprovacoes, ind_socioecon, escola_rural, programa_social"
        )
        if uploaded:
            df_up = pd.read_csv(uploaded)
            DEMO_TURMAS["📂 Importado"] = df_up.to_dict("records")
            st.session_state["turma"] = "📂 Importado"
            st.success(f"{len(df_up)} alunos carregados!")
            st.rerun()

        st.caption(f"SAEB/INEP · São Luís, MA")

    # ── Header ───────────────────────────────────────────────────────────
    st.title(f"📊 Turma {turma}")
    st.caption(f"E.E. Dom Bosco · {user['nome']} · IA: Random Forest + SHAP")

    # ── Buscar predições ──────────────────────────────────────────────────
    alunos_data = DEMO_TURMAS.get(turma, [])
    if not alunos_data:
        st.warning("Nenhum aluno encontrado para esta turma.")
        return

    with st.spinner("Calculando predições..."):
        resultado = chamar_api_turma(str(alunos_data))
        modo_offline = resultado is None
        if modo_offline:
            st.info("ℹ️ API offline — modo demonstração ativo.")
            resultado = modo_demo(alunos_data)

    # ── Métricas ──────────────────────────────────────────────────────────
    render_metricas(resultado, turma)
    st.markdown("---")

    # ── Tabela + Detalhe ──────────────────────────────────────────────────
    col_tab, col_det = st.columns([3, 2])

    with col_tab:
        st.subheader("Alunos por nível de risco")
        dados_map = {a["nome"]: a for a in alunos_data}
        df_tabela = pd.DataFrame([{
            "Aluno":        a["nome"],
            "Risco":        a["risco"].upper(),
            "Prob. (%)":    a["probabilidade"],
            "Frequência":   dados_map.get(a["nome"],{}).get("freq_escolar", "-"),
            "Matemática":   dados_map.get(a["nome"],{}).get("nota_matematica", "-"),
            "Português":    dados_map.get(a["nome"],{}).get("nota_portugues",  "-"),
        } for a in resultado["alunos"]])

        def cor_risco(v):
            return {"ALTO":"color:#ff4d6d;font-weight:bold",
                    "MEDIO":"color:#f5a623;font-weight:bold",
                    "BAIXO":"color:#2dd4a0;font-weight:bold"}.get(v,"")
        def cor_num(v):
            try:
                n = float(v)
                return "color:#ff4d6d" if n<50 else "color:#f5a623" if n<70 else "color:#2dd4a0"
            except: return ""

        styled = (df_tabela.style
            .applymap(cor_risco, subset=["Risco"])
            .applymap(cor_num,   subset=["Frequência","Matemática","Português","Prob. (%)"])
            .format({"Prob. (%)": "{:.0f}%","Frequência":"{:.0f}%",
                     "Matemática":"{:.0f}","Português":"{:.0f}"}))
        st.dataframe(styled, use_container_width=True, height=300)

    with col_det:
        st.subheader("Diagnóstico individual")
        sel = st.selectbox(
            "Selecionar aluno:",
            ["— selecione —"] + [a["nome"] for a in resultado["alunos"]]
        )
        if sel != "— selecione —":
            aluno_resp = next((a for a in resultado["alunos"] if a["nome"] == sel), None)
            aluno_data = next((a for a in alunos_data      if a["nome"] == sel), {})
            if aluno_resp:
                render_detalhe_aluno(aluno_data, aluno_resp)
        else:
            st.info("← Selecione um aluno para ver o diagnóstico.")

    st.markdown("---")

    # ── Gráficos ──────────────────────────────────────────────────────────
    col_g1, col_g2 = st.columns(2)
    with col_g1:
        st.subheader("Distribuição de risco")
        render_grafico_distribuicao(resultado)
    with col_g2:
        st.subheader("Desempenho da turma")
        render_grafico_desempenho(resultado["alunos"], alunos_data)

    st.markdown("---")
    st.subheader("Importância das variáveis — SHAP global")
    st.caption("Fatores que mais influenciam as predições do modelo (todas as turmas)")
    render_shap_global()

    # ── Exportar ──────────────────────────────────────────────────────────
    st.markdown("---")
    col_e1, col_e2 = st.columns([1, 3])
    with col_e1:
        csv_bytes = exportar_csv(turma, resultado)
        st.download_button(
            "📥 Baixar CSV da turma",
            data=csv_bytes,
            file_name=f"EduIA_Turma_{turma}.csv",
            mime="text/csv",
        )


if __name__ == "__main__":
    main()

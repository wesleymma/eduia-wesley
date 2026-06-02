# Changelog — EduIA

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0] — 2025-06-01 — Versão Final TCC

### ✨ Adicionado — Frontend
- Dashboard web completo com tema escuro e design responsivo
- Sistema de autenticação com dois perfis: Professor e Coordenador
- Tela de visão geral com métricas e gráficos (Chart.js)
- Listagem e diagnóstico individual de alunos
- Planos de intervenção pedagógica por aluno
- Visão consolidada por turma
- Exportação de relatórios em CSV
- Tela de métricas e explicabilidade do modelo de IA
- Tela de configurações do sistema
- Navegação SPA (Single Page Application) sem recarregamento de página

### ✨ Adicionado — Backend
- Modelo de Machine Learning: Random Forest com SMOTE para balanceamento
- Explicabilidade via SHAP (SHapley Additive exPlanations)
- API REST com FastAPI: endpoint `POST /predict` para diagnóstico
- Dashboard analítico avançado com Streamlit + Plotly
- Pipeline completo de treinamento com validação cruzada (5-fold)
- Métricas: AUC-ROC, F1-Score, Precisão e Recall

### ✨ Adicionado — Infraestrutura
- Estrutura de repositório organizada (frontend / backend / docs)
- `.gitignore` com conformidade LGPD (dados de alunos nunca versionados)
- `README.md` completo com arquitetura, instruções e stack tecnológica
- `CHANGELOG.md` para rastreabilidade de versões
- Protótipo standalone em `docs/dashboard_v3.html`

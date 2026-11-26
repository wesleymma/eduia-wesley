# Changelog — EduIA

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.2.0] — 2026-11-12

### Interface
- Nova tela de login centralizada, com logo do EduIA e cartões das contas de demonstração.
- Logo e símbolo da marca em docs/marca/.
- Tela "Como o risco é calculado" mostra a validação com dados reais.

### Dados e modelo
- Validação com dados reais: UCI Student Performance, 382 alunos (modelo/experimentos.py). F1 de 70,4%, empate com a regra da nota do 1º período.
- Ablação das variáveis socioeconômicas e análise de falso alarme por grupo.
- Nos dados sintéticos, a vantagem do modelo sobre a regra simples vem do gerador e não vale como argumento.

### Documentação
- Figuras do TCC em docs/figuras_tcc/ e análise técnica atualizada.

## [1.1.0] — 2026-11-02

### Interface
- Nova identidade visual: papel claro, tinta escura e azul de azulejo; títulos em Newsreader, texto em Public Sans; tema escuro opcional.
- Risco exibido com forma, cor e texto (triângulo, losango, círculo), legível para daltônicos.
- Tela da turma abre com um resumo em uma frase, lista ordenável e ficha do aluno ao lado.
- Ficha mostra fatores SHAP em barras divergentes, em pontos percentuais.
- Intervenções em quadro (a iniciar, em andamento, encerradas) com etapas e histórico.
- Novas telas: Escola (comparação e CSV), Como o risco é calculado, Simulador ligado à API.
- Navegação por endereço (#turma, #alunos…), botão voltar funciona, diálogos nativos com Esc.
- Chart.js e fontes embarcados: o painel funciona sem internet.
- Removidas opções que não faziam nada (troca de algoritmo, limiares, período).

### Dados e modelo
- Números do painel saem do modelo treinado (exportar_demo.py), não mais digitados à mão.
- SMOTE passou para dentro da validação cruzada; escolha do modelo pela CV, não pelo teste.
- Corrigido erro 500 em /prever com shap ≥ 0.45 e figura SHAP que saía como "interaction values".
- Direção do SHAP agora se refere sempre à classe risco alto.
- Comparação com regra simples sem modelo.

## [1.0.0] — 2026-06-01 — Versão inicial do TCC

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

# 🎓 EduIA — Sistema Inteligente de Identificação de Dificuldades de Aprendizagem

<div align="center">

![EduIA Banner](https://img.shields.io/badge/EduIA-Sistema%20de%20IA%20Educacional-6366f1?style=for-the-badge&logo=graduation-cap)

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.34-FF4B4B?style=flat-square&logo=streamlit&logoColor=white)](https://streamlit.io)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![HTML5](https://img.shields.io/badge/HTML5-Dashboard-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![License](https://img.shields.io/badge/Licença-Acadêmica-green?style=flat-square)](LICENSE)

**Trabalho de Conclusão de Curso — Engenharia de Software**  
**UNDB — São Luís, Maranhão**

---

> **Autor:** Wesley Matheus Martins Aguiar  
> **Orientador:** Prof. Wildemarkes de Almeida da Silva  
> **Instituição:** UNDB — Centro Universitário

</div>

---

## 📋 Sobre o Projeto

O **EduIA** é um sistema baseado em Inteligência Artificial desenvolvido para auxiliar professores e coordenadores pedagógicos na **identificação precoce de dificuldades de aprendizagem** em alunos do ensino básico.

O sistema utiliza um modelo de **Random Forest** treinado com dados educacionais sintéticos, com interpretabilidade via **SHAP (SHapley Additive exPlanations)**, e é disponibilizado via **API REST** (FastAPI) e **dashboard interativo** (Streamlit + HTML/CSS/JS).

### 🎯 Problema que Resolve

- Identificação **manual e tardia** de alunos com dificuldades
- Falta de ferramentas acessíveis para análise pedagógica baseada em dados
- Ausência de **recomendações automáticas** de intervenções pedagógicas

### ✅ Solução Proposta

| Funcionalidade | Descrição |
|---|---|
| 🤖 **Diagnóstico por IA** | Classifica o risco de dificuldade de aprendizagem de cada aluno |
| 📊 **Dashboard Interativo** | Visualização clara de métricas por turma e aluno |
| 📋 **Plano de Intervenção** | Recomendações pedagógicas geradas automaticamente |
| 📈 **Métricas do Modelo** | Transparência total sobre a performance da IA (AUC, F1, SHAP) |
| 📄 **Exportação CSV** | Relatórios exportáveis para uso externo |

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        EduIA System                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   👩‍🏫 Professor / Coordenador (Usuário)                       │
│              │                                              │
│   ┌──────────▼──────────┐    ┌──────────────────────┐      │
│   │   Frontend Web       │    │  Dashboard Streamlit  │      │
│   │  (HTML+CSS+JS)       │    │       (Python)        │      │
│   │  - Login/Auth        │    │  - Análise avançada   │      │
│   │  - Turmas/Alunos     │    │  - Gráficos Plotly    │      │
│   │  - Intervenções      │    │  - Métricas do modelo │      │
│   └──────────┬──────────┘    └──────────┬───────────┘      │
│              │                           │                  │
│   ┌──────────▼───────────────────────────▼───────────┐     │
│   │              API REST (FastAPI)                   │     │
│   │         POST /predict  |  GET /health             │     │
│   └──────────────────────┬────────────────────────────┘     │
│                           │                                  │
│   ┌───────────────────────▼────────────────────────────┐    │
│   │           Modelo de Machine Learning               │    │
│   │     Random Forest + SMOTE + SHAP Explainability    │    │
│   │          scikit-learn | imbalanced-learn            │    │
│   └────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura do Repositório

```
eduia/
├── 📂 frontend/                    ← Interface web (sem dependências)
│   ├── 📄 index.html               ← Ponto de entrada, todas as telas SPA
│   ├── 📂 css/
│   │   └── 🎨 style.css            ← Tema escuro, layout responsivo
│   └── 📂 js/
│       ├── 🔐 auth.js              ← Login, sessão e controle de perfil
│       ├── 📊 dashboard.js         ← Métricas gerais e gráficos (Chart.js)
│       ├── 👥 alunos.js            ← Lista de alunos e diagnóstico IA
│       ├── 🏫 turmas.js            ← Visão consolidada por turma
│       ├── 📋 intervencoes.js      ← Planos pedagógicos de intervenção
│       ├── 📄 relatorios.js        ← Exportação de relatórios CSV
│       ├── 🤖 modelo.js            ← Métricas e explicabilidade do modelo
│       ├── ⚙️  config.js           ← Configurações do sistema
│       ├── 🗺️  navegacao.js        ← Roteamento SPA entre telas
│       ├── 🛠️  utils.js            ← Toast, modal e utilitários globais
│       ├── 📦 dados.js             ← Dados de turmas e alunos (mock)
│       └── 🚀 main.js              ← Inicialização da aplicação
│
├── 📂 backend/                     ← Lógica de IA e servidor
│   ├── 📂 modelo/
│   │   └── 🧠 treinar.py          ← Pipeline ML: RF + SMOTE + SHAP
│   ├── 📂 api/
│   │   └── 🌐 api.py              ← API REST com FastAPI (POST /predict)
│   ├── 📂 dashboard/
│   │   └── 📊 app.py              ← Dashboard Streamlit analítico
│   └── 📦 requirements.txt        ← Dependências Python (pip)
│
├── 📂 docs/
│   └── 🗂️  dashboard_v3.html      ← Protótipo standalone completo
│
├── 🚫 .gitignore                  ← Arquivos ignorados (LGPD, artefatos)
└── 📖 README.md                   ← Este arquivo
```

---

## 🚀 Como Executar

### Pré-requisitos

- **Python 3.11+** — [python.org](https://python.org)
- **Navegador moderno** — Chrome, Firefox ou Edge
- **pip** — gerenciador de pacotes Python

---

### 🖥️ Frontend (HTML + CSS + JavaScript)

> Não requer servidor — basta abrir no navegador!

1. Navegue até a pasta `frontend/`
2. Abra o arquivo `index.html` diretamente no navegador

**Credenciais de acesso para demonstração:**

| 👤 E-mail | 🔑 Senha | 🏷️ Perfil |
|---|---|---|
| `professor@eduia.com` | `123456` | Professor |
| `coordenador@eduia.com` | `123456` | Coordenador |

---

### 🐍 Backend (Python)

```bash
# 1. Entre na pasta do backend
cd backend

# 2. (Recomendado) Crie e ative um ambiente virtual
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Treine o modelo de IA
python modelo/treinar.py

# 5. Inicie a API REST (porta 8000)
uvicorn api.api:app --reload --port 8000

# 6. (Opcional) Inicie o Dashboard Streamlit (porta 8501)
streamlit run dashboard/app.py
```

**Endpoints da API:**

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Verifica se a API está online |
| `POST` | `/predict` | Envia dados de um aluno e recebe diagnóstico |

---

## 🤖 Modelo de Machine Learning

| Aspecto | Detalhe |
|---|---|
| **Algoritmo** | Random Forest Classifier |
| **Balanceamento** | SMOTE (Synthetic Minority Oversampling) |
| **Explicabilidade** | SHAP Values (TreeExplainer) |
| **Validação** | Cross-validation estratificada (5-fold) |
| **Métricas** | AUC-ROC, F1-Score, Precisão, Recall |

### Variáveis de Entrada

O modelo analisa os seguintes indicadores por aluno:

- 📊 **Frequência escolar** (%)
- 📝 **Média de notas** por disciplina
- 🏠 **Tarefas entregues** (%)
- 🤝 **Participação** em sala de aula
- 👨‍👩‍👧 **Engajamento familiar**
- 📚 **Histórico de reprovações**

---

## 🔒 Privacidade e LGPD

Este sistema foi projetado com **privacidade por design**:

- ✅ Nenhum dado real de aluno é armazenado no repositório
- ✅ Arquivos `.csv` e `.pkl` são ignorados pelo `.gitignore`
- ✅ Dados utilizados no desenvolvimento são 100% sintéticos
- ✅ A API não persiste dados recebidos nas requisições

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| HTML5 | — | Estrutura das telas |
| CSS3 | — | Tema escuro e responsividade |
| JavaScript ES6+ | — | Lógica e interatividade |
| Chart.js | CDN | Gráficos e visualizações |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.11+ | Linguagem base |
| FastAPI | 0.111 | API REST |
| scikit-learn | 1.4.2 | Modelo de ML |
| SHAP | 0.45 | Explicabilidade |
| Streamlit | 1.34 | Dashboard analítico |
| Plotly | 5.21 | Gráficos interativos |

---

## 📄 Licença

Este projeto foi desenvolvido exclusivamente para fins **acadêmicos** como Trabalho de Conclusão de Curso (TCC) na UNDB.  
Uso, reprodução ou distribuição deve citar o autor e a instituição de ensino.

---

<div align="center">

**Desenvolvido com ❤️ por Wesley Matheus Martins Aguiar**  
UNDB — Engenharia de Software — São Luís/MA — 2025/2026

</div>

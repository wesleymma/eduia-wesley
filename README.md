# EduIA

Painel para professores e coordenação acompanharem alunos do fundamental II com risco de baixo desempenho e de reprovação. O sistema não diagnostica dificuldades de aprendizagem nem transtornos: um Random Forest estima o nível de risco (baixo, médio ou alto) de cada aluno a partir de sete indicadores, e o SHAP mostra quais indicadores pesaram em cada estimativa.

Trabalho de Conclusão de Curso em Engenharia de Software, UNDB, São Luís/MA.
Autor: Wesley Matheus Martins Aguiar. Orientador: Prof. Esp. Rodrigo da Conceição Almeida.

## O que tem aqui

```
frontend/            painel web (HTML, CSS e JS puros; funciona sem internet)
  js/dados-modelo.js gerado a partir do modelo treinado; não edite à mão
  vendor/            Chart.js e fontes, embarcados
backend/
  modelo/treinar.py       treino, validação e figuras
  modelo/exportar_demo.py passa as turmas de demonstração pelo modelo
  modelo/experimentos.py  validação com dados reais (UCI) e ablação socioeconômica
  dados/uci/              Student Performance (UCI), dados públicos
  api/api.py              API FastAPI (/prever, /prever/turma, /metricas)
  dashboard/app.py        painel Streamlit alternativo
  tests/                  testes da API (pytest)
docs/                protótipo antigo e análise técnica
```

## Como rodar

No Windows, `iniciar_demo.bat` faz tudo de uma vez: treina o modelo se ainda não existir, sobe a API e abre o painel.

O painel também abre direto no navegador: `frontend/index.html`. Acesso de demonstração: `professor@eduia.com` ou `coordenador@eduia.com`, senha `123456`.

Para treinar o modelo, atualizar os dados do painel e usar o simulador:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS
pip install -r requirements.txt

python modelo/treinar.py        # gera modelo/artefatos/
python modelo/experimentos.py   # validação com 382 alunos reais
python modelo/exportar_demo.py  # atualiza frontend/js/dados-modelo.js
python -m pytest -q             # 6 testes da API

uvicorn api.api:app --port 8000 # o simulador do painel usa esta API
```

Documentação interativa da API: http://localhost:8000/docs

## Modelo

| Item | Escolha |
|---|---|
| Classificador | Random Forest (200 árvores) |
| Comparados | SVM (RBF) e KNN (k=7) |
| Validação | StratifiedKFold com 10 folds; padronização e SMOTE dentro de cada fold |
| Teste | 20% separados antes de qualquer ajuste, usados uma vez |
| Referência | regra simples por frequência e nota de Matemática |
| Explicação | SHAP TreeExplainer, classe risco alto |

Indicadores de entrada: frequência, notas de Matemática e Português, reprovações, nível socioeconômico da escola, escola rural e participação em programa social.

As métricas atuais estão em `backend/modelo/artefatos/metricas.json` e na tela "Como o risco é calculado" do painel.

## Limites

- O modelo do painel usa 2.000 registros sintéticos. Com 382 alunos reais (UCI), o mesmo método chega a F1 de 70% e empata com a regra "menor nota do 1º período abaixo de 10".
- Nível socioeconômico e programa social influenciam a estimativa. Use o resultado para priorizar apoio, não para rotular alunos.
- O acesso do painel é demonstrativo e os registros de intervenção ficam no navegador. Dados reais de estudantes exigem backend com autenticação e adequação à LGPD.

## Licença

Uso acadêmico. Cite autor e instituição ao reutilizar.

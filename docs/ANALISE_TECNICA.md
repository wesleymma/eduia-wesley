# Análise técnica (novembro de 2026)

Pontos encontrados na revisão e o que foi feito com cada um.

## Interface

| Problema | Correção |
|---|---|
| Visual de template: fundo azul-marinho, verde neon, Space Mono, cartões com faixa colorida no topo, rótulos em caixa alta espaçada | Identidade própria em papel claro e azul de azulejo, tipografia editorial, tabelas como elemento principal |
| Risco indicado só por cor (vermelho/verde) | Forma + cor + palavra |
| Turma com "32 alunos" mostrava 7 na lista | Turmas completas (32, 28 e 30 alunos), contagens calculadas da lista |
| Acurácia de 87,3% fixa no HTML, diferente do modelo | Métricas lidas do treino |
| Matriz de confusão somava 539 com teste de 400 | Matriz real do teste |
| Configurações de algoritmo, limiar e período sem efeito | Removidas |
| "Notificar família" sugeria envio de mensagem | "Registrar contato com a família", com aviso de que nada é enviado |
| Observações digitadas entravam no HTML sem escape | Escape em todo texto do usuário |
| Navegação por div com onclick, sem teclado | Links, botões, foco visível, setas na tabela, diálogos nativos |
| Chart.js e fontes por CDN | Embarcados em frontend/vendor |

## Modelo e API

| Problema | Impacto | Correção |
|---|---|---|
| /prever devolvia erro 500 com shap ≥ 0.45 | API e Streamlit não funcionavam | Leitura do array 3D do SHAP |
| shap_summary.png gerado como "SHAP interaction value" | Figura do TCC errada | Figura da classe risco alto |
| Direção do SHAP relativa à classe prevista | "aumenta_risco" invertido para alunos de risco baixo | Sempre classe alto |
| SMOTE antes da validação cruzada | CV otimista | imblearn.Pipeline |
| Vencedor escolhido pelo teste | Teste deixa de ser independente | Escolha pela CV |
| IN_PROG_AEE mapeado como programa social | AEE é educação especial | Comentado e trocado |

## Para a defesa

- Rodando hoje, SVM empata com o Random Forest na CV (diferença menor que um desvio padrão). O Random Forest fica por causa do SHAP exato por aluno. A justificativa sai em metricas.json.
- A regra simples acerta 67%; o modelo, 91%. Isso responde "por que usar ML".
- Com dados sintéticos, as métricas medem a recuperação dos perfis do gerador. Diga isso antes que a banca pergunte.
- Atualize no texto do TCC os números e a figura SHAP com os novos artefatos.

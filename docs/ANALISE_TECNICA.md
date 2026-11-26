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

## Validação com dados reais (modelo/experimentos.py)

382 alunos reais (UCI Student Performance). Rótulo: nota final do ano. Validação 5x5.

| Método | F1 | Reprovações encontradas | Alertas corretos | AUC |
|---|---|---|---|---|
| Random Forest | 70,4% ± 3,0 | 74,5% ± 8,9 | 71,2% ± 5,5 | 0,871 |
| Regra do 1º período | 71,5% ± 4,9 | 80,1% ± 7,8 | 69,2% ± 5,5 | — |

- Modelo e regra empatam. A vantagem de 91% contra 67% existe só nos dados sintéticos e não deve ser usada como argumento.
- Sem as notas do 1º período, o F1 cai para 42%. Sem as variáveis socioeconômicas, não muda (70,4%).
- Falso alarme: 21,7% entre filhos de pais com até o fundamental, 13,4% nos demais. Tirar as variáveis socioeconômicas não reduz essa diferença (25,8% contra 10,7%).
- No teste único de 77 alunos o modelo marcou 76,6% contra 64,9% da regra. Com amostra tão pequena, a validação cruzada é o número confiável.

## Para a defesa

- O valor do EduIA está em ordenar os alunos por probabilidade (AUC 0,87; a regra não ordena), explicar cada caso com SHAP e organizar as intervenções. Na classificação pura, ele empata com uma regra que o professor já aplica.
- Na CV dos dados sintéticos, o SVM empata com o Random Forest. O Random Forest fica por causa do SHAP exato por aluno.
- Atualize no TCC os números, a figura SHAP e as capturas de tela com os novos artefatos.

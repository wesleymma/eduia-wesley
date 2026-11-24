/* EduIA — tela "Como o risco é calculado": avaliação honesta do modelo. */
function telaModelo() {
  const el = $('#tela-modelo');
  if (!MODELO) { el.innerHTML = '<p class="texto">Dados do modelo ausentes. Rode <code>python modelo/treinar.py</code> e <code>python modelo/exportar_demo.py</code>.</p>'; return; }
  const M = MODELO, rf = M.modelos['Random Forest'];
  const data = new Date(M.geradoEm).toLocaleDateString('pt-BR');
  const linhaM = (nome, m) => `<tr class="${nome === 'Random Forest' ? 'destaque-linha' : ''}">
      <td class="nome">${esc(nome)}${nome === 'Random Forest' ? ' <span style="font-weight:400;color:var(--ink-2)">(em uso)</span>' : ''}</td>
      <td class="num">${pct(m.cv_f1_media)} ± ${fmt(m.cv_f1_desvio * 100, 1)}</td>
      <td class="num">${pct(m.teste.acuracia)}</td><td class="num">${pct(m.teste.f1)}</td>
      <td class="num">${fmt(m.teste.auc, 3)}</td><td class="num">${pct(m.teste.recall_alto)}</td></tr>`;
  const mx = M.matriz.valores, maxv = Math.max(...mx.flat());
  const celula = (v, i, j) => {
    const a = v / maxv;
    const fundo = i === j ? `color-mix(in srgb, var(--azul) ${Math.round(25 + a * 60)}%, var(--sheet))` : (v ? 'var(--alto-soft)' : 'var(--sheet-2)');
    const txt = i === j && a > .5 ? 'var(--on-azul)' : 'var(--ink)';
    return `<div class="cel" style="background:${fundo};color:${txt}" aria-label="real ${M.matriz.labels[i]}, previsto ${M.matriz.labels[j]}: ${v}">${v}</div>`;
  };

  el.innerHTML = `
    <div class="texto" style="margin-bottom:24px">
      <p>O EduIA usa um <b>Random Forest</b> que recebe sete indicadores do aluno e devolve a probabilidade de cada nível de risco.
      Para cada aluno, o SHAP mostra quanto cada indicador empurrou a chance de risco alto para cima ou para baixo.</p>
      <p>Treino de ${data}: ${fmt(M.nRegistros)} registros ${M.origem === 'sintetico' ? 'sintéticos' : 'do arquivo ' + esc(M.origem)}, ${fmt(M.nTeste)} separados para teste antes de qualquer ajuste.
      ${esc(M.validacao)}.</p>
    </div>

    <section class="bloco" aria-labelledby="h-comp">
      <div class="bloco-topo"><h2 id="h-comp">Comparação com outros modelos e com uma regra simples</h2></div>
      <div class="tabela-wrap"><table class="tabela">
        <thead><tr><th>Modelo</th><th class="num">F1 na validação cruzada</th><th class="num">Acurácia (teste)</th><th class="num">F1 (teste)</th><th class="num">AUC-ROC</th><th class="num">Acerto nos casos de risco alto</th></tr></thead>
        <tbody>
          ${Object.entries(M.modelos).map(([n, m]) => linhaM(n, m)).join('')}
          <tr><td class="nome">Regra sem modelo <span style="font-weight:400;color:var(--ink-2)">(${esc(M.baseline.descricao)})</span></td>
            <td class="num">—</td><td class="num">${pct(M.baseline.acuracia)}</td><td class="num">${pct(M.baseline.f1)}</td><td class="num">—</td><td class="num">${pct(M.baseline.recall_alto)}</td></tr>
        </tbody></table></div>
      <div class="bloco-corpo"><p class="rodape-nota" style="margin:0">${esc(M.justificativa)}</p></div>
    </section>

    <div class="grade-2">
      <section class="bloco" aria-labelledby="h-mat">
        <div class="bloco-topo"><h2 id="h-mat">Matriz de confusão</h2><span class="nota">Random Forest, ${fmt(M.nTeste)} alunos de teste</span></div>
        <div class="bloco-corpo">
          <div class="matriz" role="table" aria-label="Matriz de confusão">
            <div class="cab lado">real ↓ previsto →</div>${M.matriz.labels.map(l => `<div class="cab">${l}</div>`).join('')}
            ${mx.map((lin, i) => `<div class="cab lado">${M.matriz.labels[i]}</div>${lin.map((v, j) => celula(v, i, j)).join('')}`).join('')}
          </div>
          <p class="rodape-nota">Diagonal: acertos. Dos ${mx[2].reduce((s, v) => s + v, 0)} alunos de risco alto, o modelo reconheceu ${mx[2][2]} e nenhum foi classificado como risco baixo: ${mx[2][0] === 0 ? 'o erro que mais importa não aconteceu no teste.' : mx[2][0] + ' foram classificados como baixo.'}</p>
        </div>
      </section>
      <section class="bloco" aria-labelledby="h-imp2">
        <div class="bloco-topo"><h2 id="h-imp2">Peso médio de cada indicador</h2><span class="nota">SHAP, classe risco alto</span></div>
        <div class="bloco-corpo">${htmlImportancia()}</div>
      </section>
    </div>

    <section class="bloco" style="margin-top:24px" aria-labelledby="h-fig">
      <div class="bloco-topo"><h2 id="h-fig">Distribuição dos valores SHAP</h2><span class="nota">figura gerada pelo treino</span></div>
      <div class="bloco-corpo">
        <figure class="figura"><img src="../backend/modelo/artefatos/shap_summary.png" alt="Gráfico SHAP: cada ponto é um aluno; à direita do zero o indicador aumenta a chance de risco alto." loading="lazy" width="1232" height="672" onerror="this.closest('section').hidden=true">
        <figcaption>Cada ponto é um aluno do teste. Cor: valor do indicador (azul baixo, rosa alto). À direita do zero, o indicador aumenta a chance de risco alto.</figcaption></figure>
      </div>
    </section>

    <div class="aviso" style="margin-top:24px">
      <h3>Limites que a escola precisa conhecer</h3>
      <ul>
        ${M.origem === 'sintetico' ? '<li>Os dados de treino são sintéticos. As métricas mostram que o modelo recupera os perfis do gerador; o desempenho com alunos reais só se mede com dados reais.</li>' : ''}
        <li>Nível socioeconômico e programa social entram no cálculo. Eles ajudam a prever, mas não descrevem o aluno: use a estimativa para priorizar apoio, nunca para rotular.</li>
        <li>O risco é uma estimativa estatística, não um diagnóstico. A decisão sobre cada intervenção é da equipe pedagógica.</li>
      </ul>
    </div>`;
}

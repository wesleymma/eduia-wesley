/* EduIA — tela "Turma": leitura rápida da turma, lista ordenável e ficha. */
let graficoDispersao = null;

function telaTurma() {
  const t = TURMAS[ESTADO.turma];
  const r = resumo(t.alunos);
  const semInicio = t.alunos.filter(a => a.risco === 'alto' && a.status === 'pendente').length;
  const p = n => (n / r.total * 100).toFixed(1);

  $('#tela-turma').innerHTML = `
    <div class="abertura">
      <p>${esc(t.nome)} tem <b class="em-alto">${r.alto} ${r.alto === 1 ? 'aluno' : 'alunos'} em risco alto</b>
        e ${r.medio} em risco médio, de ${r.total}.
        ${r.alto ? (semInicio ? `Dos casos de risco alto, ${semInicio} ainda ${semInicio === 1 ? 'está' : 'estão'} sem intervenção iniciada.` : 'Todos os casos de risco alto já têm intervenção iniciada.') : ''}</p>
    </div>
    <div class="composicao" aria-label="Composição da turma por nível de risco">
      <div class="composicao-barra">
        <span style="width:${p(r.alto)}%;background:var(--alto)"></span>
        <span style="width:${p(r.medio)}%;background:var(--medio)"></span>
        <span style="width:${p(r.baixo)}%;background:var(--baixo)"></span>
      </div>
      <div class="composicao-legenda">
        <span>${riscoTag('alto')} <b>${r.alto}</b></span>
        <span>${riscoTag('medio')} <b>${r.medio}</b></span>
        <span>${riscoTag('baixo')} <b>${r.baixo}</b></span>
        <span style="margin-left:auto">Frequência média <b>${fmt(r.freq)}%</b> · Matemática <b>${fmt(r.mat)}</b> · Português <b>${fmt(r.port)}</b></span>
      </div>
    </div>

    <div class="grade-turma">
      <section class="bloco" aria-labelledby="h-lista">
        <div class="bloco-topo"><h2 id="h-lista">Lista da turma</h2><span class="nota">Clique em um aluno para ver a ficha</span></div>
        <div class="tabela-wrap">${htmlTabelaAlunos(ordenar(t.alunos), { turma: false })}</div>
      </section>
      <aside class="bloco ficha" id="ficha" aria-live="polite"></aside>
    </div>

    <div class="grade-2">
      <section class="bloco" aria-labelledby="h-disp">
        <div class="bloco-topo"><h2 id="h-disp">Frequência e Matemática</h2><span class="nota">cada ponto é um aluno</span></div>
        <div class="bloco-corpo"><div class="grafico"><canvas id="cv-disp" role="img" aria-label="Gráfico de dispersão de frequência por nota de Matemática, por nível de risco"></canvas></div></div>
      </section>
      <section class="bloco" aria-labelledby="h-imp">
        <div class="bloco-topo"><h2 id="h-imp">O que mais pesa no risco alto</h2><span class="nota">média do modelo, todas as turmas</span></div>
        <div class="bloco-corpo">${htmlImportancia()}</div>
      </section>
    </div>`;

  ligarTabela($('#tela-turma'), telaTurma);
  desenharFicha();
  desenharDispersao(t.alunos);
}

function ordenar(lista) {
  const { col, dir } = ESTADO.ordem;
  return [...lista].sort((a, b) => {
    const x = a[col], y = b[col];
    return (typeof x === 'string' ? x.localeCompare(y, 'pt-BR') : x - y) * dir;
  });
}

function htmlTabelaAlunos(lista, { turma }) {
  const th = (col, rot, num, opc) => {
    const ativo = ESTADO.ordem.col === col;
    const sort = ativo ? (ESTADO.ordem.dir === 1 ? 'ascending' : 'descending') : null;
    return `<th class="${num ? 'num' : ''} ${opc ? 'opcional' : ''}" ${sort ? `aria-sort="${sort}"` : ''}><button type="button" data-ordem="${col}">${rot}</button></th>`;
  };
  return `<table class="tabela">
    <thead><tr>
      ${th('nome', 'Aluno')}
      ${turma ? th('turma', 'Turma') : ''}
      ${th('pAlto', 'Chance de risco alto', true)}
      <th>Nível</th>
      ${th('freq', 'Freq.', true)}${th('mat', 'Mat.', true, true)}${th('port', 'Port.', true, true)}
    </tr></thead>
    <tbody>${lista.map(a => `
      <tr data-id="${a.id}" tabindex="0" aria-selected="${ESTADO.sel === a.id}">
        <td class="nome">${esc(a.nome)}</td>
        ${turma ? `<td class="turma-col">${esc(TURMAS[a.turma].nome)}</td>` : ''}
        <td class="num"><div class="prob"><div class="prob-trilho"><span style="width:${a.pAlto}%"></span></div><b>${fmt(a.pAlto)}%</b></div></td>
        <td>${riscoTag(a.risco)}</td>
        <td class="num ${nivel('freq', a.freq)}">${a.freq}%</td>
        <td class="num opcional ${nivel('mat', a.mat)}">${a.mat}</td>
        <td class="num opcional ${nivel('port', a.port)}">${a.port}</td>
      </tr>`).join('')}
    </tbody></table>`;
}

/** Ordenação por cabeçalho e seleção por clique ou teclado. */
function ligarTabela(raiz, rerender, aoSelecionar) {
  $$('[data-ordem]', raiz).forEach(b => b.addEventListener('click', () => {
    const col = b.dataset.ordem;
    ESTADO.ordem = ESTADO.ordem.col === col ? { col, dir: -ESTADO.ordem.dir } : { col, dir: col === 'nome' || col === 'turma' ? 1 : -1 };
    rerender();
    $(`[data-ordem="${col}"]`, raiz)?.focus();
  }));
  $$('tbody tr', raiz).forEach(tr => {
    const sel = () => {
      ESTADO.sel = tr.dataset.id;
      $$('tbody tr', raiz).forEach(x => x.setAttribute('aria-selected', x === tr));
      (aoSelecionar || desenharFicha)(tr.dataset.id);
    };
    tr.addEventListener('click', sel);
    tr.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); tr.nextElementSibling?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); tr.previousElementSibling?.focus(); }
    });
  });
}

function desenharFicha() {
  const el = $('#ficha');
  if (!el) return;
  const a = TURMAS[ESTADO.turma].alunos.find(x => x.id === ESTADO.sel);
  el.innerHTML = a ? htmlFicha(a) : `<div class="ficha-vazia"><h2>Ficha do aluno</h2>
    <p>Selecione um aluno na lista para ver indicadores, probabilidade por nível, os fatores que mais pesaram e as ações sugeridas.</p></div>`;
}

function htmlImportancia() {
  if (!MODELO) return '<p class="rodape-nota">Rode backend/modelo/exportar_demo.py para gerar os dados do modelo.</p>';
  const itens = MODELO.shapGlobal;
  const max = Math.max(...itens.map(i => i.importancia));
  return `<div class="importancia">${itens.map(i => `
    <div class="importancia-item"><span>${esc(i.rotulo)}</span>
      <div class="trilho"><span style="width:${i.importancia / max * 100}%"></span></div><b>${fmt(i.importancia, 1)}%</b></div>`).join('')}
    </div>
    <p class="rodape-nota">Participação de cada variável no impacto médio sobre a probabilidade de risco alto (SHAP, conjunto de teste).</p>`;
}

function desenharDispersao(alunos) {
  const cv = $('#cv-disp');
  if (!cv) return;
  if (!window.Chart) { cv.parentElement.innerHTML = '<div class="grafico-fallback">Não foi possível carregar o Chart.js (vendor/chart.umd.min.js).</div>'; return; }
  if (graficoDispersao) graficoDispersao.destroy();
  const forma = { alto: 'triangle', medio: 'rectRot', baixo: 'circle' };
  const ds = ['alto', 'medio', 'baixo'].map(r => ({
    label: RISCO_ROT[r],
    data: alunos.filter(a => a.risco === r).map(a => ({ x: a.freq, y: a.mat, nome: a.nome, id: a.id })),
    backgroundColor: cor(r), borderColor: cor(r), pointStyle: forma[r], pointRadius: 6, pointHoverRadius: 8,
  }));
  const tinta = cor('ink-2'), regua = cor('rule');
  graficoDispersao = new Chart(cv, {
    type: 'scatter',
    data: { datasets: ds },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false, clip: false, layout: { padding: 8 },
      plugins: {
        legend: { position: 'bottom', labels: { color: tinta, usePointStyle: true, boxWidth: 8, font: { family: 'Public Sans', size: 13 } } },
        tooltip: { callbacks: { label: c => `${c.raw.nome}: freq. ${c.raw.x}%, mat. ${c.raw.y}` } },
      },
      scales: {
        x: { title: { display: true, text: 'Frequência (%)', color: tinta }, min: 30, max: 100, ticks: { color: tinta }, grid: { color: regua } },
        y: { title: { display: true, text: 'Nota de Matemática', color: tinta }, min: 0, max: 100, ticks: { color: tinta }, grid: { color: regua } },
      },
      onClick: (e, els) => {
        if (!els.length) return;
        const p = graficoDispersao.data.datasets[els[0].datasetIndex].data[els[0].index];
        ESTADO.sel = p.id; telaTurma();
        $(`tr[data-id="${p.id}"]`)?.scrollIntoView({ block: 'nearest' });
      },
    },
  });
}

function seletorTurma() {
  return `<div class="segmentado" role="group" aria-label="Turma">${Object.values(TURMAS).map(t =>
    `<button type="button" data-turma="${t.cod}" aria-pressed="${t.cod === ESTADO.turma}">${esc(t.nome)}</button>`).join('')}</div>`;
}

/* EduIA — tela "Escola": visão por turma e exportação CSV. */
function telaEscola() {
  const turmas = Object.values(TURMAS);
  const g = resumo(todosAlunos());
  const linha = (rot, r, cod) => {
    const p = n => (n / r.total * 100).toFixed(1);
    return `<tr ${cod ? `data-turma-link="${cod}"` : 'class="destaque-linha"'}>
      <td class="nome">${esc(rot)}</td>
      <td class="num">${r.total}</td>
      <td class="num">${r.alto}</td><td class="num">${r.medio}</td><td class="num">${r.baixo}</td>
      <td><div class="mini-barra" aria-hidden="true"><span style="width:${p(r.alto)}%;background:var(--alto)"></span><span style="width:${p(r.medio)}%;background:var(--medio)"></span><span style="flex:1;background:var(--baixo)"></span></div></td>
      <td class="num opcional">${fmt(r.freq)}%</td><td class="num opcional">${fmt(r.mat)}</td><td class="num opcional">${fmt(r.port)}</td>
      <td class="num">${r.abertas}</td>
      <td>${cod ? `<button class="btn btn-texto" type="button" data-csv="${cod}"><svg><use href="#i-baixar"/></svg>CSV</button>` : ''}</td>
    </tr>`;
  };
  $('#tela-escola').innerHTML = `
    <section class="bloco" aria-labelledby="h-esc">
      <div class="bloco-topo"><h2 id="h-esc">Turmas</h2><span class="nota">Clique no nome para abrir a turma</span></div>
      <div class="tabela-wrap"><table class="tabela">
        <thead><tr><th>Turma</th><th class="num">Alunos</th><th class="num">Alto</th><th class="num">Médio</th><th class="num">Baixo</th><th>Composição</th>
          <th class="num opcional">Freq. média</th><th class="num opcional">Mat.</th><th class="num opcional">Port.</th><th class="num">Intervenções abertas</th><th><span class="sr-only">Exportar</span></th></tr></thead>
        <tbody>${turmas.map(t => linha(t.nome, resumo(t.alunos), t.cod)).join('')}${linha('Escola', g)}</tbody>
      </table></div>
    </section>
    <section class="bloco" style="margin-top:24px" aria-labelledby="h-exp">
      <div class="bloco-topo"><h2 id="h-exp">Exportar planilha</h2></div>
      <div class="bloco-corpo">
        <p class="texto">Um arquivo CSV por turma ou um com a escola inteira. Abre no Excel e no LibreOffice com acentos corretos.</p>
        <div class="opcoes">
          <label class="check"><input type="checkbox" id="csv-shap" ${CFG.csvShap ? 'checked' : ''}> Incluir os três fatores de maior peso</label>
          <label class="check"><input type="checkbox" id="csv-hist" ${CFG.csvHistorico ? 'checked' : ''}> Incluir histórico de intervenção</label>
          <button class="btn btn-primario" type="button" id="csv-todos"><svg><use href="#i-baixar"/></svg>Exportar a escola</button>
        </div>
      </div>
    </section>`;

  $$('tr[data-turma-link] td.nome').forEach(td => {
    td.style.cursor = 'pointer';
    td.addEventListener('click', () => { ESTADO.turma = td.parentElement.dataset.turmaLink; ESTADO.sel = null; location.hash = '#turma'; });
  });
  $('#tela-escola tbody').querySelectorAll('tr').forEach(tr => tr.style.cursor = 'default');
  $$('[data-csv]').forEach(b => b.addEventListener('click', () => exportarCSV(TURMAS[b.dataset.csv].alunos, `turma-${b.dataset.csv}`)));
  $('#csv-todos').addEventListener('click', () => exportarCSV(todosAlunos(), 'escola'));
  $('#csv-shap').addEventListener('change', e => { CFG.csvShap = e.target.checked; salvarCFG(); });
  $('#csv-hist').addEventListener('change', e => { CFG.csvHistorico = e.target.checked; salvarCFG(); });
}

function exportarCSV(alunos, sufixo) {
  const sep = CFG.sepCSV || ';';
  const q = v => { const s = String(v ?? ''); return /["\n\r]/.test(s) || s.includes(sep) ? `"${s.replace(/"/g, '""')}"` : s; };
  const cab = ['Aluno', 'Turma', 'Nível de risco', 'Chance de risco alto (%)', 'Frequência (%)', 'Matemática', 'Português', 'Reprovações', 'Situação da intervenção', 'Ações sugeridas'];
  if (CFG.csvShap) cab.push('Fator 1', 'Fator 2', 'Fator 3');
  if (CFG.csvHistorico) cab.push('Histórico');
  const linhas = alunos.map(a => {
    const l = [a.nome, TURMAS[a.turma].nome, RISCO_ROT[a.risco], fmt(a.pAlto, 1), a.freq, a.mat, a.port, a.rep, STATUS_ROT[a.status], a.acoes.join(' | ')];
    if (CFG.csvShap) a.shap.slice(0, 3).forEach(s => l.push(`${s.r} (${s.v > 0 ? '+' : '−'}${Math.abs(Math.round(s.v * 100))} pp)`));
    if (CFG.csvHistorico) l.push(a.hist.join(' | '));
    return l.map(q).join(sep);
  });
  const nome = `eduia-${sufixo}-${new Date().toISOString().slice(0, 10)}.csv`;
  baixarArquivo(nome, '﻿' + [cab.map(q).join(sep), ...linhas].join('\r\n'));
  toast(`${nome} baixado.`);
}

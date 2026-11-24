/* EduIA — tela "Intervenções": quadro por situação. */
let filtroIntervTurma = null;  // null = turma aberta no painel
let focoInterv = null;

const ETAPAS = ['Iniciada', 'Família contatada', 'Acompanhamento', 'Encerrada'];

function telaIntervencoes() {
  if (filtroIntervTurma === null) filtroIntervTurma = ESTADO.turma;
  const base = todosAlunos().filter(a => a.status !== 'nenhuma' &&
    (filtroIntervTurma === 'todas' || a.turma === filtroIntervTurma))
    .sort((a, b) => b.pAlto - a.pAlto);
  const cols = [
    ['pendente', 'A iniciar'], ['andamento', 'Em andamento'], ['concluida', 'Encerradas'],
  ];
  const btnT = (v, rot) => `<button type="button" data-ft="${v}" aria-pressed="${filtroIntervTurma === v}">${esc(rot)}</button>`;

  $('#tela-intervencoes').innerHTML = `
    <div class="ferramentas">
      <div class="segmentado" role="group" aria-label="Filtrar por turma">
        ${btnT('todas', 'Todas as turmas')}${Object.values(TURMAS).map(t => btnT(t.cod, t.nome)).join('')}
      </div>
      <span class="contagem">Alunos em risco baixo não entram no quadro.</span>
    </div>
    <div class="quadro">${cols.map(([st, rot]) => {
      const itens = base.filter(a => a.status === st);
      return `<section class="coluna" aria-labelledby="col-${st}">
        <h2 id="col-${st}">${rot}<span>${itens.length}</span></h2>
        ${itens.length ? itens.map(cartaoInterv).join('') : '<p class="vazio">Nenhum aluno nesta situação.</p>'}
      </section>`;
    }).join('')}</div>`;

  $$('[data-ft]').forEach(b => b.addEventListener('click', () => { filtroIntervTurma = b.dataset.ft; telaIntervencoes(); }));
  $$('[data-acao]').forEach(b => b.addEventListener('click', () => acaoInterv(b.dataset.acao, b.dataset.id)));
  if (focoInterv) {
    const c = $(`#card-${focoInterv}`);
    if (c) { c.scrollIntoView({ block: 'center' }); c.querySelector('button')?.focus(); c.style.outline = '2px solid var(--azul)'; }
    focoInterv = null;
  }
}

function cartaoInterv(a) {
  const feitas = Math.round(a.prog / 25);
  const ult = a.hist[a.hist.length - 1];
  const enc = a.status === 'concluida';
  return `<article class="cartao" id="card-${a.id}">
    <div class="cartao-topo">
      <div><strong>${esc(a.nome)}</strong><small>${esc(TURMAS[a.turma].nome)} · ${fmt(a.pAlto)}% de chance de risco alto</small></div>
      ${riscoTag(a.risco)}
    </div>
    <p class="proxima"><span>Próxima ação</span>${esc(a.acoes[0])}${a.acoes.length > 1 ? ` <em>+${a.acoes.length - 1}</em>` : ''}</p>
    <div class="etapas" aria-hidden="true">${ETAPAS.map((_, i) => `<span class="${i < feitas ? 'feita' : ''}"></span>`).join('')}</div>
    <div class="etapas-leg">${feitas ? `Etapa ${feitas} de 4: ${ETAPAS[feitas - 1]}` : 'Nenhuma etapa registrada'}</div>
    ${ult ? `<p class="ultimo">Último registro: ${esc(ult)}</p>` : ''}
    <div class="cartao-acoes">
      ${enc ? '' : `<button class="btn btn-primario" type="button" data-acao="etapa" data-id="${a.id}">${a.status === 'pendente' ? 'Iniciar' : 'Registrar etapa'}</button>`}
      ${enc ? '' : `<button class="btn" type="button" data-acao="familia" data-id="${a.id}">Contato com a família</button>`}
      ${enc ? '' : `<button class="btn" type="button" data-acao="obs" data-id="${a.id}">Anotar</button>`}
      <button class="btn btn-texto" type="button" data-acao="hist" data-id="${a.id}">Histórico${a.hist.length ? ` (${a.hist.length})` : ''}</button>
    </div>
  </article>`;
}

function registrar(a, texto) {
  a.hist.push(`${texto} · ${hoje()}`);
  salvarIntervencoes();
  atualizarContadores();
  focoInterv = a.id;
  telaIntervencoes();
}

function acaoInterv(acao, id) {
  const a = acharAluno(id);
  if (!a) return;
  if (acao === 'etapa') {
    if (a.status === 'pendente') { a.status = 'andamento'; a.prog = 25; registrar(a, 'Intervenção iniciada'); toast(`Intervenção de ${a.nome} iniciada.`); return; }
    a.prog = Math.min(100, a.prog + 25);
    if (a.prog === 100) { a.status = 'concluida'; registrar(a, 'Intervenção encerrada'); toast(`Intervenção de ${a.nome} encerrada.`); }
    else { const e = ETAPAS[a.prog / 25 - 1]; registrar(a, `Etapa registrada: ${e}`); toast(`Etapa registrada: ${e}.`); }
  }
  if (acao === 'hist') {
    abrirDialogo({
      titulo: 'Histórico', sub: `${a.nome} · ${TURMAS[a.turma].nome}`,
      corpo: a.hist.length ? `<ol class="historico">${[...a.hist].reverse().map(h => `<li>${esc(h)}</li>`).join('')}</ol>` : '<p>Nada registrado até agora.</p>',
    });
  }
  if (acao === 'obs') {
    abrirDialogo({
      titulo: 'Anotar observação', sub: `${a.nome} · ${TURMAS[a.turma].nome}`,
      corpo: `<div class="campo"><label for="obs">Observação</label><textarea class="textarea" id="obs" maxlength="500"></textarea><span class="ajuda">Fica no histórico do aluno, neste navegador.</span><p class="erro" id="obs-erro" role="alert"></p></div>`,
      acoes: `<button class="btn" type="button" data-fechar>Cancelar</button><button class="btn btn-primario" type="button" id="salvar-obs">Salvar</button>`,
    });
    $('#salvar-obs').addEventListener('click', () => {
      const t = $('#obs').value.trim();
      if (!t) { $('#obs-erro').textContent = 'Escreva a observação antes de salvar.'; $('#obs').focus(); return; }
      fecharDialogo(); registrar(a, t); toast('Observação salva.');
    });
  }
  if (acao === 'familia') {
    const r = (n, v, rot, chk) => `<label><input type="radio" name="${n}" value="${v}" ${chk ? 'checked' : ''}> ${rot}</label>`;
    abrirDialogo({
      titulo: 'Registrar contato com a família', sub: `${a.nome} · ${TURMAS[a.turma].nome}`,
      corpo: `<p style="font-size:14px;color:var(--ink-2);margin-bottom:14px">O EduIA não envia mensagens. Registre aqui o contato que você fez.</p>
        <fieldset style="border:0;padding:0;margin:0"><legend class="campo" style="font-weight:600;font-size:14px;margin-bottom:6px">Assunto</legend>
        <div class="radio-lista">${r('assunto', 'faltas', 'Faltas', true)}${r('assunto', 'desempenho', 'Desempenho')}${r('assunto', 'reunião', 'Convite para reunião')}</div></fieldset>
        <fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:600;font-size:14px;margin-bottom:6px">Meio</legend>
        <div class="radio-lista">${r('meio', 'telefone', 'Telefone', true)}${r('meio', 'bilhete', 'Bilhete na agenda')}${r('meio', 'presencial', 'Presencial')}</div></fieldset>
        <div class="campo"><label for="fam-obs">Resumo da conversa (opcional)</label><textarea class="textarea" id="fam-obs" maxlength="300"></textarea></div>`,
      acoes: `<button class="btn" type="button" data-fechar>Cancelar</button><button class="btn btn-primario" type="button" id="salvar-fam">Registrar</button>`,
    });
    $('#salvar-fam').addEventListener('click', () => {
      const as = $('input[name=assunto]:checked').value, me = $('input[name=meio]:checked').value;
      const o = $('#fam-obs').value.trim();
      fecharDialogo(); registrar(a, `Contato com a família (${me}): ${as}${o ? '. ' + o : ''}`); toast('Contato registrado no histórico.');
    });
  }
}

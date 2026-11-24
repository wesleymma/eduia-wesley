/* EduIA — rotas por hash (#turma, #alunos, ...) com link direto e voltar. */
const TELAS = {
  turma:        { titulo: () => TURMAS[ESTADO.turma].nome, sub: () => `${TURMAS[ESTADO.turma].turno} · ${CFG.escola}`, render: () => telaTurma(), extra: () => seletorTurma() },
  alunos:       { titulo: () => 'Alunos', sub: () => 'Todas as turmas, ordenadas pela chance de risco alto', render: () => telaAlunos() },
  intervencoes: { titulo: () => 'Intervenções', sub: () => 'O que foi combinado para cada aluno e em que pé está', render: () => telaIntervencoes() },
  escola:       { titulo: () => 'Escola', sub: () => 'Comparação entre turmas e exportação', render: () => telaEscola() },
  modelo:       { titulo: () => 'Como o risco é calculado', sub: () => 'Avaliação do modelo e seus limites', render: () => telaModelo() },
  simulador:    { titulo: () => 'Simulador', sub: () => 'Teste o modelo com um aluno hipotético', render: () => telaSimulador() },
  config:       { titulo: () => 'Configurações', sub: () => 'Valem só para este navegador', render: () => telaConfig() },
};

function rotear() {
  if (!document.body.classList.contains('autenticado')) return;
  const nome = (location.hash || '#turma').slice(1);
  const tela = TELAS[nome] ? nome : 'turma';
  const T = TELAS[tela];
  $$('.tela').forEach(s => s.classList.toggle('ativa', s.id === 'tela-' + tela));
  $$('#nav a').forEach(a => { if (a.dataset.tela === tela) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#titulo').textContent = T.titulo();
  $('#subtitulo').textContent = T.sub();
  $('#cabecalho-extra').innerHTML = T.extra ? T.extra() : '';
  $$('[data-turma]').forEach(b => b.addEventListener('click', () => { ESTADO.turma = b.dataset.turma; ESTADO.sel = null; rotear(); }));
  document.title = `${T.titulo()} · EduIA`;
  T.render();
  atualizarContadores();
}

function atualizarContadores() {
  const n = todosAlunos().filter(a => a.status === 'pendente' && a.risco === 'alto').length;
  const c = $('#nav-pendentes');
  c.hidden = !n; c.textContent = n; c.title = `${n} casos de risco alto a iniciar`;
}

function redesenharGraficos() { if ((location.hash || '#turma') === '#turma') telaTurma(); }

window.addEventListener('hashchange', () => { rotear(); $('#conteudo').scrollTop = 0; window.scrollTo(0, 0); $('#titulo').focus({ preventScroll: true }); });
document.addEventListener('click', e => {
  const f = e.target.closest('[data-foco]');
  if (f) { focoInterv = f.dataset.foco; filtroIntervTurma = 'todas'; fecharDialogo(); }
});

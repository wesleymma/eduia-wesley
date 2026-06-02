/**
 * EduIA — Navegação — roteamento entre telas
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ NAV ════════════════════════════════════════════════════════════════════
const TITULOS = {
  dashboard:    ['Monitoramento de Turmas',    'Escola Estadual · São Luís, MA'],
  alunos:       ['Cadastro de Alunos',          'Busque, filtre e analise individualmente'],
  intervencoes: ['Plano de Intervenções',       'Acompanhe o andamento de cada ação pedagógica'],
  relatorios:   ['Relatórios',                  'Exportar e visualizar relatórios por turma'],
  modelo:       ['Modelo de IA',                'Desempenho e explicabilidade do Random Forest'],
  turmas:       ['Gestao de Turmas',            'Visao consolidada por turma'],
  config:       ['Configurações',               'Preferências do sistema EduIA'],
};

function goTo(scr, el) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('screen-'+scr).classList.add('active');
  if(el) el.classList.add('active');
  const [title, sub] = TITULOS[scr];
  document.getElementById('topbar-title').textContent = title;
  document.getElementById('topbar-sub').textContent = sub;
  document.getElementById('turma-pills').style.display = scr==='dashboard' ? 'flex' : 'none';
  if(scr==='alunos')       renderAlunos();
  if(scr==='intervencoes') renderIntervencoes();
  if(scr==='relatorios')   renderRelatorios();
  if(scr==='modelo')       renderModelo();
  if(scr==='turmas')       renderTurmas();
  if(scr==='config')       renderConfig();
}

function setTurma(id, btn) {
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active'); CT=id; SEL=null; render();
}
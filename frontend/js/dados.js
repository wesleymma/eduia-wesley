/* EduIA — dados de trabalho
   Os alunos e as métricas vêm de js/dados-modelo.js, gerado por
   backend/modelo/exportar_demo.py a partir do modelo treinado. */
const MODELO = window.EDUIA_MODELO || null;

const TURMA_META = {
  '7A': { nome: '7º ano A', turno: 'Manhã' },
  '8B': { nome: '8º ano B', turno: 'Manhã' },
  '9C': { nome: '9º ano C', turno: 'Tarde' },
};

const TURMAS = {};
Object.entries(window.EDUIA_TURMAS || {}).forEach(([cod, t]) => {
  TURMAS[cod] = { cod, ...(TURMA_META[cod] || { nome: cod, turno: '' }), alunos: t.alunos.map(a => ({ ...a, turma: cod })) };
});

const CHAVE_INTERV = 'eduia_intervencoes_v2';
(function restaurar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_INTERV) || '{}');
    todosAlunos().forEach(a => { if (salvo[a.id]) Object.assign(a, salvo[a.id]); });
  } catch (e) {}
})();

function salvarIntervencoes() {
  const s = {};
  todosAlunos().forEach(a => { s[a.id] = { status: a.status, prog: a.prog, hist: a.hist }; });
  try { localStorage.setItem(CHAVE_INTERV, JSON.stringify(s)); } catch (e) {}
}

function todosAlunos() { return Object.values(TURMAS).flatMap(t => t.alunos); }
function acharAluno(id) { return todosAlunos().find(a => a.id === id); }

function resumo(alunos) {
  const c = { total: alunos.length, alto: 0, medio: 0, baixo: 0, pendentes: 0, abertas: 0 };
  alunos.forEach(a => {
    c[a.risco]++;
    if (a.status === 'pendente') c.pendentes++;
    if (a.status === 'pendente' || a.status === 'andamento') c.abertas++;
  });
  const media = k => alunos.length ? alunos.reduce((s, a) => s + a[k], 0) / alunos.length : 0;
  c.freq = media('freq'); c.mat = media('mat'); c.port = media('port');
  return c;
}

/* Estado da sessão de uso */
const ESTADO = { turma: '7A', sel: null, filtro: 'todos', busca: '', ordem: { col: 'pAlto', dir: -1 } };

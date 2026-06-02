/**
 * EduIA — Autenticacao — login, sessao e controle de acesso
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

const DEMO_USERS = [
  { email:'professor@eduia.com', senha:'123456', nome:'Prof. Ana Souza', perfil:'Professor' },
  { email:'coordenador@eduia.com', senha:'123456', nome:'Coord. Marcos Lima', perfil:'Coordenação' }
];
const SESSION_KEY = 'eduia_session';
const INTERVENTION_KEY = 'eduia_intervencoes';

function initAuth() {
  const form = document.getElementById('login-form');
  if(form) form.addEventListener('submit', handleLogin);
  const session = getSession();
  if(session) unlockApp(session);
  else lockApp();
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch(e) { return null; }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const senha = document.getElementById('login-password').value;
  const user = DEMO_USERS.find(u=>u.email===email && u.senha===senha);
  const error = document.getElementById('login-error');
  if(!user) {
    error.textContent = 'E-mail ou senha inválidos para o acesso demonstrativo.';
    return;
  }
  const session = { email:user.email, nome:user.nome, perfil:user.perfil, loginAt:new Date().toISOString() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  error.textContent = '';
  unlockApp(session);
  toast('Bem-vindo(a), '+user.nome+'!', 'success');
}

function lockApp() {
  document.body.classList.add('auth-locked');
}

function unlockApp(session) {
  document.body.classList.remove('auth-locked');
  const chip = document.getElementById('user-chip');
  if(chip) chip.textContent = `${session.nome} · ${session.perfil}`;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  lockApp();
  closeModal();
  const form = document.getElementById('login-form');
  if(form) form.reset();
}

function applyInterventionState() {
  try {
    const saved = JSON.parse(localStorage.getItem(INTERVENTION_KEY) || '{}');
    Object.entries(saved).forEach(([id, patch])=>{
      Object.values(TURMAS).forEach(t=>{
        const aluno = t.alunos.find(a=>a.id===id);
        if(aluno) Object.assign(aluno, patch);
      });
    });
  } catch(e) {}
}

function saveInterventionState() {
  const state = {};
  Object.values(TURMAS).forEach(t=>t.alunos.forEach(a=>{
    state[a.id] = { status:a.status, prog:a.prog, hist:a.hist };
  }));
  try { localStorage.setItem(INTERVENTION_KEY, JSON.stringify(state)); } catch(e) {}
}
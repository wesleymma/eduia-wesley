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

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
function initAuth() {
  const form = document.getElementById('login-form');
  if (form) form.addEventListener('submit', handleLogin);

  _initPasswordToggle();
  _initDemoFill();
  _initLoginAnimations();

  const session = getSession();
  if (session) unlockApp(session);
  else lockApp();
}

/* ─────────────────────────────────────────────
   SESSION
───────────────────────────────────────────── */
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch(e) { return null; }
}

/* ─────────────────────────────────────────────
   LOGIN HANDLER (with loading state)
───────────────────────────────────────────── */
function handleLogin(e) {
  e.preventDefault();
  const email  = document.getElementById('login-email').value.trim().toLowerCase();
  const senha  = document.getElementById('login-password').value;
  const error  = document.getElementById('login-error');
  const btn    = document.getElementById('login-btn');

  // Clear previous error
  error.textContent = '';

  // Show loading state
  if (btn) btn.classList.add('loading');

  // Simulate small async delay for better UX feel
  setTimeout(() => {
    const user = DEMO_USERS.find(u => u.email === email && u.senha === senha);

    if (!user) {
      error.textContent = 'E-mail ou senha inválidos para o acesso demonstrativo.';
      if (btn) btn.classList.remove('loading');
      // Shake animation on error
      const panel = document.querySelector('.login-panel-inner');
      if (panel) {
        panel.style.animation = 'loginShake 0.4s ease';
        setTimeout(() => { panel.style.animation = ''; }, 400);
      }
      return;
    }

    const session = {
      email: user.email,
      nome: user.nome,
      perfil: user.perfil,
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    error.textContent = '';
    if (btn) btn.classList.remove('loading');
    unlockApp(session);
    toast('Bem-vindo(a), ' + user.nome + '!', 'success');
  }, 600);
}

/* ─────────────────────────────────────────────
   LOCK / UNLOCK
───────────────────────────────────────────── */
function lockApp() {
  document.body.classList.add('auth-locked');
  // Re-trigger login animations when locking
  setTimeout(_initLoginAnimations, 100);
}

function unlockApp(session) {
  document.body.classList.remove('auth-locked');
  const chip = document.getElementById('user-chip');
  if (chip) chip.textContent = `${session.nome} · ${session.perfil}`;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  lockApp();
  closeModal();
  const form = document.getElementById('login-form');
  if (form) form.reset();
}

/* ─────────────────────────────────────────────
   PASSWORD TOGGLE
───────────────────────────────────────────── */
function _initPasswordToggle() {
  const btn   = document.getElementById('toggle-password');
  const input = document.getElementById('login-password');
  const icon  = document.getElementById('eye-icon');
  if (!btn || !input || !icon) return;

  btn.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    // Toggle icon: eye vs eye-off
    icon.innerHTML = isHidden
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
         <line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>`;
  });
}

/* ─────────────────────────────────────────────
   CLICK-TO-FILL DEMO CREDENTIALS
───────────────────────────────────────────── */
function _initDemoFill() {
  const emailInput = document.getElementById('login-email');
  const passInput  = document.getElementById('login-password');

  const fillProf  = document.getElementById('fill-prof');
  const fillCoord = document.getElementById('fill-coord');

  if (fillProf && emailInput && passInput) {
    fillProf.addEventListener('click', () => {
      _animateFill(emailInput, 'professor@eduia.com');
      _animateFill(passInput,  '123456');
    });
  }
  if (fillCoord && emailInput && passInput) {
    fillCoord.addEventListener('click', () => {
      _animateFill(emailInput, 'coordenador@eduia.com');
      _animateFill(passInput,  '123456');
    });
  }
}

function _animateFill(input, value) {
  input.value = '';
  input.focus();
  let i = 0;
  const interval = setInterval(() => {
    input.value += value[i];
    i++;
    if (i >= value.length) clearInterval(interval);
  }, 30);
}

/* ─────────────────────────────────────────────
   LOGIN SCREEN ANIMATIONS
   (stat counters + risk bars)
───────────────────────────────────────────── */
function _initLoginAnimations() {
  // Animated stat counters
  const statVals = document.querySelectorAll('.lv-stat-val[data-target]');
  statVals.forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    _animateCounter(el, 0, target, suffix, 1200);
  });

  // Animated risk bars (delay so they're visible)
  setTimeout(() => {
    const fills = document.querySelectorAll('.lv-risk-fill[data-width]');
    fills.forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  }, 400);
}

function _animateCounter(el, from, to, suffix, duration) {
  const start = performance.now();
  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutCubic
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ─────────────────────────────────────────────
   INTERVENTION STATE
───────────────────────────────────────────── */
function applyInterventionState() {
  try {
    const saved = JSON.parse(localStorage.getItem(INTERVENTION_KEY) || '{}');
    Object.entries(saved).forEach(([id, patch]) => {
      Object.values(TURMAS).forEach(t => {
        const aluno = t.alunos.find(a => a.id === id);
        if (aluno) Object.assign(aluno, patch);
      });
    });
  } catch(e) {}
}

function saveInterventionState() {
  const state = {};
  Object.values(TURMAS).forEach(t => t.alunos.forEach(a => {
    state[a.id] = { status: a.status, prog: a.prog, hist: a.hist };
  }));
  try { localStorage.setItem(INTERVENTION_KEY, JSON.stringify(state)); } catch(e) {}
}
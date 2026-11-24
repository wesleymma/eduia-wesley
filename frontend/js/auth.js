/* EduIA — acesso de demonstração (sem backend de autenticação) */
const USUARIOS_DEMO = [
  { email: 'professor@eduia.com', senha: '123456', nome: 'Ana Souza', perfil: 'Professora de Matemática' },
  { email: 'coordenador@eduia.com', senha: '123456', nome: 'Marcos Lima', perfil: 'Coordenação pedagógica' },
];
const CHAVE_SESSAO = 'eduia_session';

function sessaoAtual() {
  try { return JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null'); } catch (e) { return null; }
}

function iniciarAcesso() {
  $('#form-login').addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#login-email').value.trim().toLowerCase();
    const senha = $('#login-senha').value;
    const erro = $('#login-erro');
    if (!email || !senha) { erro.textContent = 'Preencha e-mail e senha.'; return; }
    const u = USUARIOS_DEMO.find(x => x.email === email && x.senha === senha);
    if (!u) { erro.textContent = 'E-mail ou senha não conferem. Confira os dados de demonstração abaixo.'; return; }
    erro.textContent = '';
    const s = { email: u.email, nome: u.nome, perfil: u.perfil };
    try { localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s)); } catch (e) {}
    entrar(s);
  });
  $$('[data-demo]').forEach(b => b.addEventListener('click', () => {
    $('#login-email').value = b.dataset.demo;
    $('#login-senha').value = '123456';
    $('#login-senha').focus();
  }));
  $('#btn-sair').addEventListener('click', sair);

  const total = todosAlunos().length;
  if (total) $('#login-resumo').textContent =
    `${total} alunos em ${Object.keys(TURMAS).length} turmas do fundamental II, acompanhados um a um.`;

  const s = sessaoAtual();
  if (s) entrar(s, true); else $('#login-email').focus();
}

function entrar(s, silencioso) {
  document.body.classList.add('autenticado');
  $('#usuario-nome').textContent = s.nome;
  $('#usuario-perfil').textContent = s.perfil;
  rotear();
  if (!silencioso) $('#titulo').focus();
}

function sair() {
  try { localStorage.removeItem(CHAVE_SESSAO); } catch (e) {}
  document.body.classList.remove('autenticado');
  $('#form-login').reset();
  history.replaceState(null, '', location.pathname);
  $('#login-email').focus();
}

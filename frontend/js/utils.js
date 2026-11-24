/* EduIA — utilitários de interface */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/** Escapa texto antes de entrar em innerHTML. */
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const fmt = (n, d = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (n, d = 1) => fmt(n * 100, d) + '%';

const RISCO_ROT = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' };
const riscoTag = r => `<span class="risco ${r}">${RISCO_ROT[r]}</span>`;

/** Classe de destaque para indicadores abaixo do esperado. */
function nivel(campo, v) {
  const lim = { freq: [75, 85], mat: [45, 60], port: [45, 60] }[campo];
  if (!lim) return '';
  return v < lim[0] ? 'fraco' : v < lim[1] ? 'atencao' : '';
}

function cor(nome) { return getComputedStyle(document.documentElement).getPropertyValue('--' + nome).trim(); }

let _toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('visivel');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => t.classList.remove('visivel'), 3200);
}

function hoje() { return new Date().toLocaleDateString('pt-BR'); }

/* Diálogo nativo: Esc fecha, foco volta para quem abriu. */
const dlg = { el: null, origem: null };
function abrirDialogo({ titulo, sub = '', corpo = '', acoes = '', largo = false }) {
  dlg.el = $('#dialogo');
  dlg.origem = document.activeElement;
  $('#dlg-titulo').textContent = titulo;
  $('#dlg-sub').textContent = sub;
  $('#dlg-corpo').innerHTML = corpo;
  $('#dlg-acoes').innerHTML = acoes || '<button class="btn" type="button" data-fechar>Fechar</button>';
  dlg.el.classList.toggle('largo', largo);
  dlg.el.showModal();
  const alvo = $('#dlg-corpo [autofocus]') || $('#dlg-corpo input, #dlg-corpo textarea');
  if (alvo) alvo.focus();
}
function fecharDialogo() { if (dlg.el?.open) dlg.el.close(); }
document.addEventListener('click', e => {
  if (e.target.closest('[data-fechar]')) fecharDialogo();
  if (e.target === $('#dialogo')) fecharDialogo();
});
document.addEventListener('DOMContentLoaded', () => {
  $('#dialogo').addEventListener('close', () => dlg.origem?.focus?.());
});

function baixarArquivo(nome, conteudo, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

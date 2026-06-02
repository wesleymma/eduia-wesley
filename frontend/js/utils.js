/**
 * EduIA — Utilitários — toast, modal, helpers gerais
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ UTILS ══════════════════════════════════════════════════════════════════
function toast(msg, tipo='success') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast '+tipo;
  setTimeout(()=>t.classList.add('show'),10);
  setTimeout(()=>t.classList.remove('show'),2800);
}

function openModal(title, sub, body, actions) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-sub').textContent = sub;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-actions').innerHTML = actions;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
function fecharModal(e) { if(e.target===document.getElementById('modal-overlay')) closeModal(); }
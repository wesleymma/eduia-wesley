/* EduIA — inicialização */
document.addEventListener('DOMContentLoaded', () => {
  aplicarTema();
  $('#escola-nome').textContent = CFG.escola;
  $('#escola-cidade').textContent = CFG.cidade;
  if (MODELO) $('#modelo-info').textContent = `Modelo de ${new Date(MODELO.geradoEm).toLocaleDateString('pt-BR')}`;
  iniciarAcesso();
});

/* EduIA — tela "Alunos": todas as turmas, busca e filtro por nível. */
function telaAlunos() {
  const termo = ESTADO.busca.trim().toLowerCase();
  const lista = ordenar(todosAlunos().filter(a =>
    (ESTADO.filtro === 'todos' || a.risco === ESTADO.filtro) &&
    (!termo || a.nome.toLowerCase().includes(termo))));
  const f = (v, rot) => `<button type="button" data-filtro="${v}" aria-pressed="${ESTADO.filtro === v}">${rot}</button>`;

  $('#tela-alunos').innerHTML = `
    <div class="ferramentas">
      <label class="sr-only" for="busca">Buscar aluno</label>
      <input class="input" id="busca" type="search" placeholder="Buscar pelo nome" value="${esc(ESTADO.busca)}" autocomplete="off">
      <div class="segmentado" role="group" aria-label="Filtrar por nível de risco">
        ${f('todos', 'Todos')}${f('alto', 'Alto')}${f('medio', 'Médio')}${f('baixo', 'Baixo')}
      </div>
      <span class="contagem" aria-live="polite">${lista.length} de ${todosAlunos().length} alunos</span>
    </div>
    <section class="bloco">
      ${lista.length
        ? `<div class="tabela-wrap">${htmlTabelaAlunos(lista, { turma: true })}</div>`
        : `<div class="ficha-vazia"><h2>Nenhum aluno encontrado</h2><p>Nenhum nome contém “${esc(ESTADO.busca)}” neste filtro. <button class="btn btn-texto" type="button" id="limpar">Limpar busca e filtro</button></p></div>`}
    </section>`;

  const busca = $('#busca');
  busca.addEventListener('input', () => {
    ESTADO.busca = busca.value;
    clearTimeout(busca._t);
    busca._t = setTimeout(() => { const pos = busca.selectionStart; telaAlunos(); const b = $('#busca'); b.focus(); b.setSelectionRange(pos, pos); }, 180);
  });
  $$('[data-filtro]').forEach(b => b.addEventListener('click', () => { ESTADO.filtro = b.dataset.filtro; telaAlunos(); $(`[data-filtro="${ESTADO.filtro}"]`).focus(); }));
  $('#limpar')?.addEventListener('click', () => { ESTADO.busca = ''; ESTADO.filtro = 'todos'; telaAlunos(); });
  ligarTabela($('#tela-alunos'), telaAlunos, id => abrirFichaDialogo(id));
}

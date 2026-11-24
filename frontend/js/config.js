/* EduIA — configurações persistidas no navegador */
const CFG_PADRAO = {
  escola: 'E.E. Dom Bosco',
  cidade: 'São Luís, MA',
  apiUrl: 'http://localhost:8000',
  tema: 'sistema',          // 'claro' | 'escuro' | 'sistema'
  sepCSV: ';',
  csvShap: false,
  csvHistorico: false,
};
const CFG = { ...CFG_PADRAO };
try { Object.assign(CFG, JSON.parse(localStorage.getItem('eduia_cfg') || '{}')); } catch (e) {}

function salvarCFG() {
  try { localStorage.setItem('eduia_cfg', JSON.stringify(CFG)); } catch (e) {}
}

function aplicarTema() {
  let t = CFG.tema;
  if (t === 'sistema') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  else t = t === 'escuro' ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (CFG.tema === 'sistema') { aplicarTema(); if (typeof redesenharGraficos === 'function') redesenharGraficos(); }
});

/* Tela de configurações */
function telaConfig() {
  const op = (v, rot, atual) => `<option value="${v}" ${atual === v ? 'selected' : ''}>${rot}</option>`;
  $('#tela-config').innerHTML = `
    <form class="form-config" id="form-config" novalidate>
      <fieldset><legend>Escola</legend>
        <div class="campo"><label for="c-escola">Nome da escola</label><input class="input" id="c-escola" value="${esc(CFG.escola)}" required maxlength="80"><span class="ajuda">Aparece na barra lateral e no cabeçalho das turmas.</span></div>
        <div class="campo"><label for="c-cidade">Cidade</label><input class="input" id="c-cidade" value="${esc(CFG.cidade)}" maxlength="60"></div>
      </fieldset>
      <fieldset><legend>Aparência</legend>
        <div class="campo"><label for="c-tema">Tema</label><select class="select" id="c-tema">${op('sistema', 'Seguir o sistema', CFG.tema)}${op('claro', 'Claro', CFG.tema)}${op('escuro', 'Escuro', CFG.tema)}</select></div>
      </fieldset>
      <fieldset><legend>Integração</legend>
        <div class="campo"><label for="c-api">Endereço da API</label><input class="input" id="c-api" type="url" value="${esc(CFG.apiUrl)}"><span class="ajuda">Usado pelo simulador. Padrão: http://localhost:8000</span><p class="erro" id="c-api-erro" role="alert"></p></div>
        <div class="campo"><label for="c-sep">Separador do CSV</label><select class="select" id="c-sep">${op(';', 'Ponto e vírgula (Excel em português)', CFG.sepCSV)}${op(',', 'Vírgula', CFG.sepCSV)}</select></div>
      </fieldset>
      <div class="linha-botoes">
        <button class="btn btn-primario" type="submit">Salvar</button>
        <button class="btn" type="button" id="c-padrao">Restaurar padrão</button>
        <button class="btn btn-texto" type="button" id="c-limpar" style="margin-left:auto;color:var(--alto)">Apagar registros de intervenção</button>
      </div>
    </form>`;

  $('#c-tema').addEventListener('change', e => { CFG.tema = e.target.value; aplicarTema(); });
  $('#form-config').addEventListener('submit', e => {
    e.preventDefault();
    const api = $('#c-api').value.trim();
    if (!/^https?:\/\/.+/.test(api)) { $('#c-api-erro').textContent = 'Use um endereço que comece com http:// ou https://'; $('#c-api').focus(); return; }
    Object.assign(CFG, { escola: $('#c-escola').value.trim() || CFG_PADRAO.escola, cidade: $('#c-cidade').value.trim(), apiUrl: api, tema: $('#c-tema').value, sepCSV: $('#c-sep').value });
    salvarCFG();
    $('#escola-nome').textContent = CFG.escola; $('#escola-cidade').textContent = CFG.cidade;
    toast('Configurações salvas.');
  });
  $('#c-padrao').addEventListener('click', () => { Object.assign(CFG, CFG_PADRAO); salvarCFG(); aplicarTema(); telaConfig(); $('#escola-nome').textContent = CFG.escola; $('#escola-cidade').textContent = CFG.cidade; toast('Configurações restauradas.'); });
  $('#c-limpar').addEventListener('click', () => {
    abrirDialogo({
      titulo: 'Apagar registros de intervenção?', sub: 'Esta ação não pode ser desfeita',
      corpo: '<p>Os históricos, etapas e anotações feitos neste navegador voltam ao estado da demonstração.</p>',
      acoes: '<button class="btn" type="button" data-fechar>Cancelar</button><button class="btn btn-primario" type="button" id="c-confirma" style="background:var(--alto);border-color:var(--alto)">Apagar</button>',
    });
    $('#c-confirma').addEventListener('click', () => { try { localStorage.removeItem(CHAVE_INTERV); } catch (e) {} location.reload(); });
  });
}

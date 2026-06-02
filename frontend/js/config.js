/**
 * EduIA — Configuracoes — preferencias e persistencia localStorage
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ CONFIG — Estado global real ════════════════════════════════════════════
const CFG_DEFAULT = {
  escola:'E.E. Dom Bosco', cidade:'São Luís - MA',
  responsavel:'Coordenador Pedagogico', email:'escola@educa.ma.gov.br',
  algoritmo:'Random Forest', ciclo:14, limiarAlto:70, limiarMedio:40,
  sepCSV:';', alertas:true, relatorioAuto:false,
  notifEmail:true, notifBrowser:false,
  inclHistorico:false, inclShap:false,
  temaDark:true, animacoes:true
};

// Carrega CFG do localStorage se existir, senão usa default
function cfgLoad() {
  try {
    const s = localStorage.getItem('eduia_cfg');
    if(s) Object.assign(CFG, JSON.parse(s));
  } catch(e) {}
}
function cfgSave() {
  try { localStorage.setItem('eduia_cfg', JSON.stringify(CFG)); } catch(e) {}
}

// Inicializa CFG com os defaults que ainda não existem
Object.keys(CFG_DEFAULT).forEach(k=>{ if(CFG[k]===undefined) CFG[k]=CFG_DEFAULT[k]; });
cfgLoad();

// Aba ativa de config
let cfgAba = 'escola';

function renderConfig() {
  const abas = [
    {id:'escola',    label:'Perfil da escola'},
    {id:'modelo',    label:'Modelo de IA'},
    {id:'notif',     label:'Notificacoes'},
    {id:'exportacao',label:'Exportacao'},
  ];

  document.getElementById('config-content').innerHTML = `
  <!-- Abas internas -->
  <div style="display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px;flex-wrap:wrap;">
    ${abas.map(a=>`
      <button class="filter-btn ${cfgAba===a.id?'active':''}"
              onclick="setCfgAba('${a.id}')"
              style="border-radius:8px;">${a.label}</button>`).join('')}
  </div>

  <!-- Conteudo da aba -->
  <div id="cfg-aba-content"></div>

  <!-- Rodape sempre visivel -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:12px;">
    <div style="font-size:11px;color:var(--muted);">
      EduIA v1.0.0 &middot; Random Forest + SHAP &middot; SAEB/INEP 2022
      <span id="cfg-unsaved" style="display:none;color:var(--amber);margin-left:10px;">&#9679; Alteracoes nao salvas</span>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-int" onclick="resetarConfig()">Restaurar padrão</button>
      <button class="btn-int primary" onclick="salvarConfig()" style="padding:8px 20px;font-size:13px;">Salvar</button>
    </div>
  </div>`;

  renderCfgAba();
}

function setCfgAba(id) {
  cfgAba = id;
  renderConfig();
}

function renderCfgAba() {
  const el = document.getElementById('cfg-aba-content');
  if(!el) return;

  if(cfgAba === 'escola') {
    el.innerHTML = `
    <div class="panel">
      <div class="panel-header"><span class="panel-title">Identificacao da escola</span></div>
      <div class="panel-body">
        ${cfgField('Nome da escola','Exibido no cabecalho e nos relatorios exportados','text','cfg-escola',CFG.escola,'cfg-escola')}
        ${cfgField('Cidade / Estado','Localidade para contexto dos dados','text','cfg-cidade',CFG.cidade,'cfg-cidade')}
        ${cfgField('Responsavel pelo sistema','Professor ou coordenador que administra o EduIA','text','cfg-responsavel',CFG.responsavel,'cfg-responsavel')}
        ${cfgField('E-mail de contato','Usado no envio de alertas e relatorios automaticos','email','cfg-email',CFG.email,'cfg-email')}
      </div>
    </div>
    <div style="background:var(--surface2);border-radius:8px;padding:12px 16px;margin-top:12px;font-size:12px;color:var(--muted);line-height:1.6;">
      Os dados de perfil sao usados apenas localmente no sistema EduIA.<br>
      Nenhuma informacao e enviada para servidores externos.
    </div>`;

  } else if(cfgAba === 'modelo') {
    el.innerHTML = `
    <div class="panel" style="margin-bottom:12px;">
      <div class="panel-header"><span class="panel-title">Algoritmo de predicao</span></div>
      <div class="panel-body">
        <div class="config-row">
          <div><div class="config-label">Algoritmo ativo</div><div class="config-desc">Modelo de machine learning usado nas predicoes</div></div>
          <select id="cfg-algoritmo" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 12px;font-family:var(--sans);font-size:12px;outline:none;"
                  onchange="cfgMark()">
            <option ${CFG.algoritmo==='Random Forest'?'selected':''}>Random Forest</option>
            <option ${CFG.algoritmo==='SVM (RBF)'?'selected':''}>SVM (RBF)</option>
            <option ${CFG.algoritmo==='KNN (k=7)'?'selected':''}>KNN (k=7)</option>
          </select>
        </div>
        <div style="background:var(--green-dim);border:1px solid rgba(45,212,160,.2);border-radius:8px;padding:10px 14px;margin-top:8px;font-size:12px;color:var(--green);line-height:1.6;">
          Random Forest e o algoritmo com melhor desempenho (F1: 84.9%, AUC-ROC: 0.921). Troque apenas se tiver retreinado os modelos alternativos.
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">Limiares de classificacao</span></div>
      <div class="panel-body">
        ${cfgSlider('Limiar risco alto (%)','Probabilidade minima para classificar como ALTO','cfg-limiarAlto',CFG.limiarAlto,50,95,'var(--red)')}
        ${cfgSlider('Limiar risco medio (%)','Probabilidade minima para classificar como MEDIO','cfg-limiarMedio',CFG.limiarMedio,20,70,'var(--amber)')}
        ${cfgSliderNum('Ciclo de reavaliação (dias)','Frequência com que o modelo reavalia todos os alunos','cfg-ciclo',CFG.ciclo,7,60)}
        <div style="background:var(--surface2);border-radius:8px;padding:10px 14px;margin-top:10px;font-size:11px;color:var(--muted);line-height:1.6;">
          Aluno com prob. &ge; limiar alto = RISCO ALTO.<br>
          Aluno com prob. entre limiar medio e alto = RISCO MEDIO.<br>
          Abaixo do limiar medio = SEM RISCO.
        </div>
      </div>
    </div>`;
    // Atualizar displays dos sliders
    setTimeout(()=>{
      ['cfg-limiarAlto','cfg-limiarMedio','cfg-ciclo'].forEach(id=>{
        const inp = document.getElementById(id);
        const out = document.getElementById(id+'-out');
        if(inp && out) out.textContent = inp.value + (id==='cfg-ciclo'?' dias':'%');
      });
    }, 0);

  } else if(cfgAba === 'notif') {
    el.innerHTML = `
    <div class="panel" style="margin-bottom:12px;">
      <div class="panel-header"><span class="panel-title">Alertas automaticos</span></div>
      <div class="panel-body">
        ${cfgToggleRow('Alertas de risco alto','Notificar imediatamente ao detectar aluno em risco alto','alertas')}
        ${cfgToggleRow('Relatorio automatico semanal','Gerar e exibir relatorio toda segunda-feira ao abrir o sistema','relatorioAuto')}
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">Canais de notificacao</span></div>
      <div class="panel-body">
        ${cfgToggleRow('Notificação por e-mail','Enviar alertas para o e-mail cadastrado no perfil','notifEmail')}
        ${cfgToggleRow('Notificação no navegador','Mostrar pop-up ao detectar novos riscos','notifBrowser')}
        <div style="background:var(--amber-dim);border:1px solid rgba(245,166,35,.2);border-radius:8px;padding:10px 14px;margin-top:10px;font-size:12px;color:var(--amber);line-height:1.6;">
          Notificacoes por e-mail requerem a API Python rodando localmente.<br>Configure o SMTP em <code style="font-size:11px;">api/api.py</code>.
        </div>
      </div>
    </div>`;

  } else if(cfgAba === 'exportacao') {
    el.innerHTML = `
    <div class="panel" style="margin-bottom:12px;">
      <div class="panel-header"><span class="panel-title">Formato do arquivo CSV</span></div>
      <div class="panel-body">
        <div class="config-row">
          <div><div class="config-label">Separador de campos</div><div class="config-desc">Caractere usado entre colunas no arquivo exportado</div></div>
          <select id="cfg-sepCSV" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:6px;padding:6px 12px;font-family:var(--sans);font-size:12px;outline:none;"
                  onchange="cfgMark()">
            <option value=";" ${CFG.sepCSV===';'?'selected':''}>Ponto-e-virgula (;) — Excel BR</option>
            <option value="," ${CFG.sepCSV===','?'selected':''}>Vírgula (,) — padrão internacional</option>
            <option value="	" ${CFG.sepCSV==='\t'?'selected':''}>Tabulação — TSV</option>
          </select>
        </div>
        ${cfgToggleRow('Incluir histórico de intervenções','Adicionar coluna com o histórico de ações de cada aluno','inclHistorico')}
        ${cfgToggleRow('Incluir importancia SHAP','Adicionar colunas com os valores SHAP de cada variavel','inclShap')}
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><span class="panel-title">Pre-visualizacao do CSV</span></div>
      <div class="panel-body">
        <div style="background:var(--surface2);border-radius:8px;padding:12px;font-family:var(--mono);font-size:11px;color:var(--muted);line-height:1.8;overflow-x:auto;white-space:nowrap;" id="csv-preview"></div>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button class="btn-int primary" onclick="exportarCSVTodos()">Baixar todas as turmas</button>
          <button class="btn-int" onclick="exportarCSV('7A')">Exportar turma 7A</button>
        </div>
      </div>
    </div>`;
    renderCsvPreview();
  }
}

function renderCsvPreview() {
  const el = document.getElementById('csv-preview');
  if(!el) return;
  const sep = CFG.sepCSV || ';';
  const header = csvHeader().map(v=>csvEscape(v, sep)).join(sep);
  const ex1 = csvRow(TURMAS['7A'].alunos[0], '7A').map(v=>csvEscape(v, sep)).join(sep);
  const ex2 = csvRow(TURMAS['7A'].alunos[5], '7A').map(v=>csvEscape(v, sep)).join(sep);
  el.textContent = header+'\n'+ex1+'\n'+ex2+'\n...';
}

// ── Helpers de campo ────────────────────────────────────────────────────
function cfgField(label, desc, type, id, val, cfgKey) {
  return `
  <div class="config-row">
    <div><div class="config-label">${label}</div><div class="config-desc">${desc}</div></div>
    <input class="config-input" type="${type}" id="${id}" value="${val}"
           style="width:210px;font-size:12px;"
           oninput="cfgMark()"
           onblur="cfgValidate('${cfgKey}',this)">
  </div>`;
}

function cfgSlider(label, desc, id, val, min, max, cor) {
  return `
  <div style="margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div><div class="config-label">${label}</div><div class="config-desc">${desc}</div></div>
      <span id="${id}-out" style="font-family:var(--mono);font-size:14px;font-weight:700;color:${cor};min-width:40px;text-align:right;">${val}%</span>
    </div>
    <input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="1"
           style="width:100%;accent-color:${cor};"
           oninput="document.getElementById('${id}-out').textContent=this.value+'%';cfgMark()">
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:3px;">
      <span>${min}%</span><span>${max}%</span>
    </div>
  </div>`;
}

function cfgSliderNum(label, desc, id, val, min, max) {
  return `
  <div style="margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div><div class="config-label">${label}</div><div class="config-desc">${desc}</div></div>
      <span id="${id}-out" style="font-family:var(--mono);font-size:14px;font-weight:700;color:var(--blue);min-width:55px;text-align:right;">${val} dias</span>
    </div>
    <input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="1"
           style="width:100%;accent-color:var(--blue);"
           oninput="document.getElementById('${id}-out').textContent=this.value+' dias';cfgMark()">
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:3px;">
      <span>${min} dias</span><span>${max} dias</span>
    </div>
  </div>`;
}

function cfgToggleRow(label, desc, key) {
  if(CFG[key]===undefined) CFG[key]=CFG_DEFAULT[key]||false;
  return `
  <div class="config-row">
    <div><div class="config-label">${label}</div><div class="config-desc">${desc}</div></div>
    <div class="toggle ${CFG[key]?'on':''}" id="tog-${key}" onclick="toggleCfg('${key}')"></div>
  </div>`;
}

function toggleCfg(key) {
  CFG[key] = !CFG[key];
  const el = document.getElementById('tog-'+key);
  if(el) el.classList.toggle('on', CFG[key]);
  cfgMark();
  renderCsvPreview();
}

// Marca alteracoes nao salvas
function cfgMark() {
  const el = document.getElementById('cfg-unsaved');
  if(el) el.style.display = 'inline';
}

// Validacao de campo ao sair
function cfgValidate(key, input) {
  const val = input.value.trim();
  if(!val) {
    input.style.borderColor = 'var(--red)';
    toast('Campo nao pode ser vazio: '+key, 'warn');
    input.value = CFG[key] || CFG_DEFAULT[key] || '';
    setTimeout(()=>input.style.borderColor='', 1500);
    return;
  }
  if(key==='cfg-email' && val && !val.includes('@')) {
    input.style.borderColor = 'var(--red)';
    toast('E-mail invalido — use o formato: nome@dominio.com', 'warn');
    setTimeout(()=>input.style.borderColor='', 1500);
    return;
  }
  input.style.borderColor = 'var(--green)';
  setTimeout(()=>input.style.borderColor='', 1000);
  cfgMark();
}

// Lê todos os inputs da tela e salva no CFG real
function salvarConfig() {
  const erros = [];

  // Lê campos de texto do perfil
  const mapText = {
    'cfg-escola':'escola','cfg-cidade':'cidade',
    'cfg-responsavel':'responsavel','cfg-email':'email'
  };
  Object.entries(mapText).forEach(([id,key])=>{
    const el = document.getElementById(id);
    if(el) {
      const val = el.value.trim();
      if(!val){ erros.push(key); return; }
      if(key==='email' && !val.includes('@')){ erros.push('email (formato invalido)'); return; }
      CFG[key] = val;
    }
  });

  // Lê sliders do modelo
  const mapSlider = {
    'cfg-limiarAlto':'limiarAlto','cfg-limiarMedio':'limiarMedio','cfg-ciclo':'ciclo'
  };
  Object.entries(mapSlider).forEach(([id,key])=>{
    const el = document.getElementById(id);
    if(el) CFG[key] = parseInt(el.value);
  });

  // Valida limiares
  if(CFG.limiarMedio >= CFG.limiarAlto) {
    erros.push('limiar medio deve ser menor que limiar alto');
  }

  // Lê selects
  const elAlg = document.getElementById('cfg-algoritmo');
  if(elAlg) CFG.algoritmo = elAlg.value;
  const elSep = document.getElementById('cfg-sepCSV');
  if(elSep) CFG.sepCSV = elSep.value;

  if(erros.length > 0) {
    openModal('Erro ao salvar', 'Corrija os campos antes de salvar',
      `<div style="font-size:13px;color:var(--muted);">
        Os seguintes campos precisam ser corrigidos:<br><br>
        ${erros.map(e=>`<span style="color:var(--red);">&#9679;</span> ${e}`).join('<br>')}
      </div>`,
      `<button class="modal-btn cancel" onclick="closeModal()">Fechar</button>`
    );
    return;
  }

  cfgSave();
  const el = document.getElementById('cfg-unsaved');
  if(el) el.style.display = 'none';

  // Atualiza topbar com novo nome da escola se mudou
  document.querySelector('.school-badge b').textContent = CFG.escola;

  toast('Configurações salvas com sucesso!', 'success');
}

function resetarConfig() {
  openModal(
    'Restaurar configurações padrão',
    'Esta acao nao pode ser desfeita.',
    `<div style="font-size:13px;color:var(--muted);line-height:1.6;">
      Todos os campos voltarao para os valores originais do sistema.<br><br>
      <strong style="color:var(--text);">Isso inclui:</strong><br>
      Nome da escola, e-mail, limiares, toggles e preferencias de exportacao.
    </div>`,
    `<button class="modal-btn cancel" onclick="closeModal()">Cancelar</button>
     <button class="modal-btn warn" onclick="confirmarReset()">Restaurar tudo</button>`
  );
}

function confirmarReset() {
  Object.assign(CFG, CFG_DEFAULT);
  cfgSave();
  closeModal();
  toast('Configurações restauradas para o padrão!', 'info');
  renderConfig();
}
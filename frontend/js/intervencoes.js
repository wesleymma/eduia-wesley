/**
 * EduIA — Intervenções — plano pedagógico e acompanhamento
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ INTERVENCOES ═══════════════════════════════════════════════════════════
function renderIntervencoes() {
  const todos = Object.entries(TURMAS).flatMap(([tk,t])=>t.alunos.map(a=>({...a,turma:tk})));
  document.getElementById('int-total').textContent    = todos.filter(a=>a.status!=='concluida').length;
  document.getElementById('int-pendentes').textContent = todos.filter(a=>a.status==='pendente').length;
  document.getElementById('int-concluidas').textContent= todos.filter(a=>a.status==='concluida').length;

  const ord = {pendente:0, andamento:1, concluida:2};
  const sorted = [...todos].sort((a,b)=>ord[a.status]-ord[b.status]||b.prob-a.prob);

  const grupos = [
    { titulo:'Ação imediata necessária', cor:'var(--red)',   lista: sorted.filter(a=>a.risco==='alto'&&a.status!=='concluida') },
    { titulo:'Monitoramento ativo',      cor:'var(--amber)', lista: sorted.filter(a=>a.risco==='medio') },
    { titulo:'Concluídas / sem risco',   cor:'var(--green)', lista: sorted.filter(a=>a.risco==='baixo'||a.status==='concluida') },
  ];

  document.getElementById('intervencoes-list').innerHTML = grupos
    .filter(g=>g.lista.length>0)
    .map(g=>`<div class="section-label" style="color:${g.cor}">${g.titulo}</div>${g.lista.map(a=>cardInt(a)).join('')}`)
    .join('');
}

function cardInt(a) {
  const SL = {pendente:'Pendente', andamento:'Em andamento', concluida:'Concluida'};
  const cp = a.prog===100?'var(--green)':a.prog>0?'var(--blue)':'var(--surface2)';
  const concluida = a.status==='concluida';
  return `
  <div class="int-card">
    <div class="int-card-header">
      <div class="int-aluno">
        <div class="avatar" style="background:${a.bg};color:${a.cor};width:34px;height:34px;">${a.init}</div>
        <div>
          <div class="int-nome">${a.nome}</div>
          <div class="int-sub">Turma ${a.turma} &middot; <span class="risk-badge r-${a.risco}" style="font-size:10px;padding:1px 7px;">${a.risco}</span></div>
        </div>
      </div>
      <span class="status-badge s-${a.status}">${SL[a.status]}</span>
    </div>
    <div class="int-texto">${a.int}</div>
    <div class="progress-wrap">
      <div class="progress-top"><span>Progresso</span><span>${a.prog}%</span></div>
      <div class="progress-bg"><div class="progress-fill" style="width:${a.prog}%;background:${cp}"></div></div>
    </div>
    <div class="int-meta">
      <div class="int-meta-item">Frequência: <b style="color:${a.freq<75?'var(--red)':a.freq<85?'var(--amber)':'var(--green)'}">${a.freq}%</b></div>
      <div class="int-meta-item">Matemática: <b style="color:${a.mat<50?'var(--red)':a.mat<65?'var(--amber)':'var(--green)'}">${a.mat}</b></div>
      <div class="int-meta-item">Português: <b style="color:${a.port<50?'var(--red)':a.port<65?'var(--amber)':'var(--green)'}">${a.port}</b></div>
      <div class="int-meta-item">Prob. risco: <b style="color:${a.cor}">${a.prob}%</b></div>
    </div>
    <div class="int-actions">
      ${!concluida ? `<button class="btn-int primary" onclick="avancarStatus('${a.id}','${a.turma}',event)">Atualizar progresso</button>` : '<button class="btn-int concluido" disabled>Concluida</button>'}
      <button class="btn-int" onclick="modalHistorico('${a.id}','${a.turma}',event)">Ver histórico</button>
      <button class="btn-int warn" onclick="modalNotificar('${a.id}','${a.turma}',event)">Notificar família</button>
      ${!concluida ? `<button class="btn-int" onclick="modalRegistrar('${a.id}','${a.turma}',event)">Registrar observação</button>` : ''}
    </div>
  </div>`;
}

function avancarStatus(id, turma, e) {
  if(e) e.stopPropagation();
  const a = TURMAS[turma].alunos.find(al=>al.id===id);
  if(!a || a.status==='concluida') return;
  const passos = {pendente:{status:'andamento',prog:25,msg:'Intervenção iniciada!'}, andamento:{prog:null,msg:'Progresso atualizado!'}};
  if(a.status==='pendente') { a.status='andamento'; a.prog=25; a.hist.push('Intervenção iniciada em '+hojeStr()); }
  else { a.prog = Math.min(100, a.prog+25); if(a.prog===100){ a.status='concluida'; a.hist.push('Intervenção concluída em '+hojeStr()); } else { a.hist.push('Progresso atualizado para '+a.prog+'% em '+hojeStr()); } }
  saveInterventionState();
  toast('Progresso atualizado para '+a.prog+'%', a.prog===100?'success':'info');
  renderIntervencoes();
}

function hojeStr() {
  const d = new Date();
  return d.getDate().toString().padStart(2,'0')+'/'+(d.getMonth()+1).toString().padStart(2,'0')+'/'+d.getFullYear();
}

function getAluno(id, turma) {
  return TURMAS[turma]?.alunos.find(a=>a.id===id);
}

function modalHistorico(id, turma, e) {
  if(e) e.stopPropagation();
  const a = getAluno(id, turma);
  if(!a) return;
  const cores = {pendente:'var(--amber)',andamento:'var(--blue)',concluida:'var(--green)'};
  const histHtml = a.hist.length===0
    ? '<div style="color:var(--muted);font-size:12px;">Nenhuma atividade registrada ainda.</div>'
    : a.hist.map((h,i)=>`<div class="hist-item"><div class="hist-dot" style="background:var(--green)"></div><div><div class="hist-text">${h}</div></div></div>`).join('');
  openModal(
    'Histórico de intervenção',
    a.nome+' · Turma '+turma,
    `<div style="max-height:240px;overflow-y:auto;">${histHtml}</div>`,
    `<button class="modal-btn cancel" onclick="closeModal()">Fechar</button>`
  );
}

function modalNotificar(id, turma, e) {
  if(e) e.stopPropagation();
  const a = getAluno(id, turma);
  if(!a) return;
  openModal(
    'Notificar família',
    'Enviar mensagem sobre '+a.nome,
    `<div style="font-size:13px;color:var(--muted);margin-bottom:8px;">Selecione o tipo de notificacao:</div>
     <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">
       <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;"><input type="radio" name="tipo" value="frequencia" checked> Alerta de frequencia escolar</label>
       <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;"><input type="radio" name="tipo" value="desempenho"> Alerta de desempenho acadêmico</label>
       <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;"><input type="radio" name="tipo" value="reuniao"> Convocação para reunião</label>
     </div>
     <textarea class="modal-textarea" id="msg-textarea" placeholder="Mensagem adicional para a família (opcional)..."></textarea>`,
    `<button class="modal-btn cancel" onclick="closeModal()">Cancelar</button>
     <button class="modal-btn warn" onclick="confirmarNotificacao('${id}','${turma}')">Enviar notificação</button>`
  );
}

function confirmarNotificacao(id, turma) {
  const a = getAluno(id, turma);
  const tipo = document.querySelector('input[name="tipo"]:checked')?.value || 'geral';
  a.hist.push('Familia notificada ('+tipo+') em '+hojeStr());
  saveInterventionState();
  closeModal();
  toast('Notificação enviada para a família de '+a.nome+'!', 'success');
  renderIntervencoes();
}

function modalRegistrar(id, turma, e) {
  if(e) e.stopPropagation();
  const a = getAluno(id, turma);
  if(!a) return;
  openModal(
    'Registrar observação',
    a.nome+' · Turma '+turma,
    `<textarea class="modal-textarea" id="obs-textarea" placeholder="Descreva a observação pedagógica..." style="margin-top:0;min-height:100px;"></textarea>`,
    `<button class="modal-btn cancel" onclick="closeModal()">Cancelar</button>
     <button class="modal-btn confirm" onclick="salvarObservacao('${id}','${turma}')">Salvar observação</button>`
  );
}

function salvarObservacao(id, turma) {
  const a = getAluno(id, turma);
  const obs = document.getElementById('obs-textarea')?.value?.trim();
  if(!obs){ toast('Escreva a observação antes de salvar.','warn'); return; }
  a.hist.push(obs+' ('+hojeStr()+')');
  saveInterventionState();
  closeModal();
  toast('Observação registrada com sucesso!','success');
  renderIntervencoes();
}
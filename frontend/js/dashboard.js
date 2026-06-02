/**
 * EduIA — Dashboard — métricas, tabela, gráficos e SHAP
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ DASHBOARD ══════════════════════════════════════════════════════════════
function render() {
  const d = TURMAS[CT];
  renderMetrics(d); renderTabela(d); renderDetail(null); renderCharts(d); renderGlobalShap(d);
  document.getElementById('dist-label').textContent = d.total+' alunos';
}

function renderMetrics(d) {
  const items = [
    { label:'Total alunos', val:d.total, sub:'na turma', color:'var(--green)', badge:null, click:null },
    { label:'Risco alto',   val:d.alto,  sub:Math.round(d.alto/d.total*100)+'% da turma',  color:'var(--red)',   badge:'Ação imediata', click:'alto' },
    { label:'Risco medio',  val:d.medio, sub:Math.round(d.medio/d.total*100)+'% da turma', color:'var(--amber)', badge:'Monitorar',     click:'medio' },
    { label:'Sem risco',    val:d.baixo, sub:Math.round(d.baixo/d.total*100)+'% da turma', color:'var(--blue)',  badge:null,           click:'baixo' },
  ];
  document.getElementById('metrics').innerHTML = items.map(m=>`
    <div class="metric-card" style="--accent:${m.color}" ${m.click?`onclick="irParaAlunos('${m.click}')" title="Ver alunos com risco ${m.click}"`:''}> 
      <div class="metric-label">${m.label}</div>
      <div class="metric-val" style="color:${m.color}">${m.val}</div>
      <div class="metric-sub">${m.sub}</div>
      ${m.badge?`<div class="metric-badge" style="background:${m.color}22;color:${m.color}">${m.badge}</div>`:''}
    </div>`).join('');
}

function irParaAlunos(filtro) {
  FA = filtro;
  goTo('alunos', document.getElementById('nav-alunos'));
}

function renderTabela(d) {
  document.getElementById('aluno-tbody').innerHTML = d.alunos.map(a=>`
    <tr id="row-${a.id}" onclick="selAluno('${a.id}')" class="${SEL===a.id?'selected':''}">
      <td style="padding-left:18px;"><div class="name-cell"><div class="avatar" style="background:${a.bg};color:${a.cor}">${a.init}</div><span>${a.nome}</span></div></td>
      <td><span class="risk-badge r-${a.risco}">${a.risco}</span></td>
      <td><div class="prob-bar-wrap"><div class="prob-bar-bg"><div class="prob-bar-fill" style="width:${a.prob}%;background:${a.cor}"></div></div><span class="prob-val">${a.prob}%</span></div></td>
      <td style="font-family:var(--mono);font-size:12px;color:${a.freq<75?'var(--red)':a.freq<85?'var(--amber)':'var(--green)'}">${a.freq}%</td>
      <td style="font-family:var(--mono);font-size:12px;color:${a.mat<50?'var(--red)':a.mat<65?'var(--amber)':'var(--green)'}">${a.mat}</td>
      <td style="font-family:var(--mono);font-size:12px;color:${a.port<50?'var(--red)':a.port<65?'var(--amber)':'var(--green)'}">${a.port}</td>
    </tr>`).join('');
}

function selAluno(id) {
  SEL = id; renderTabela(TURMAS[CT]);
  const a = TURMAS[CT].alunos.find(x=>x.id===id);
  renderDetail(a);
}

function renderDetail(a) {
  const p = document.getElementById('detail-panel');
  if(!a){ p.innerHTML='<div class="detail-empty"><span class="icon">&#8592;</span>Selecione um aluno<br>para ver o diagnóstico<br>e a intervenção sugerida</div>'; return; }
  const SL=['Frequência','Nota mat.','Nota port.','Reprovações'], SC=['var(--red)','var(--amber)','var(--blue)','var(--muted)'];
  p.innerHTML = `
    <div class="panel-header">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="avatar" style="background:${a.bg};color:${a.cor};width:34px;height:34px;font-size:12px;">${a.init}</div>
        <div><div style="font-weight:600;font-size:13px;">${a.nome}</div><span class="risk-badge r-${a.risco}" style="font-size:10px;">${a.risco} ${a.prob}%</span></div>
      </div>
      <button class="btn-int" onclick="verIntervencaoAluno('${a.id}')" style="font-size:11px;">Ver intervenção</button>
    </div>
    <div class="panel-body">
      <div class="mini-metrics">
        <div class="mini-card"><div class="mini-label">Frequência</div><div class="mini-val" style="color:${a.freq<75?'var(--red)':a.freq<85?'var(--amber)':'var(--green)'}">${a.freq}%</div></div>
        <div class="mini-card"><div class="mini-label">Matemática</div><div class="mini-val" style="color:${a.mat<50?'var(--red)':a.mat<65?'var(--amber)':'var(--green)'}">${a.mat}</div></div>
        <div class="mini-card"><div class="mini-label">Português</div><div class="mini-val" style="color:${a.port<50?'var(--red)':a.port<65?'var(--amber)':'var(--green)'}">${a.port}</div></div>
      </div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:8px;">Fatores SHAP — por que este risco?</div>
      ${a.shap.map((v,i)=>`<div class="shap-row"><span class="shap-label">${SL[i]}</span><div class="shap-track"><div class="shap-fill" style="width:${v}%;background:${SC[i]}"></div></div><span class="shap-pct">${v}%</span></div>`).join('')}
      <div class="int-box"><strong>Intervenção sugerida</strong>${a.int}</div>
    </div>`;
}

function verIntervencaoAluno(id) {
  goTo('intervencoes', document.getElementById('nav-intervencoes'));
}

function renderCharts(d) {
  if(!window.Chart) {
    document.querySelectorAll('.chart-wrap').forEach(w=>{
      w.innerHTML = '<div class="chart-fallback">Não foi possível carregar os gráficos. Verifique a conexão com a internet para baixar o Chart.js.</div>';
    });
    return;
  }
  if(CD) CD.destroy(); if(CP) CP.destroy();
  const base = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#7a7f94', font:{ family:"'DM Sans'" }, boxWidth:10, padding:12 } } } };
  CD = new Chart(document.getElementById('chartDist').getContext('2d'), {
    type:'doughnut',
    data:{ labels:['Risco alto','Risco medio','Sem risco'], datasets:[{ data:[d.alto,d.medio,d.baixo], backgroundColor:['rgba(255,77,109,.8)','rgba(245,166,35,.8)','rgba(45,212,160,.8)'], borderColor:'#171b26', borderWidth:3, hoverOffset:6 }] },
    options:{ ...base, cutout:'68%' }
  });
  CP = new Chart(document.getElementById('chartPerf').getContext('2d'), {
    type:'bar',
    data:{ labels:d.alunos.map(a=>a.nome.split(' ')[0]), datasets:[
      { label:'Matemática', data:d.alunos.map(a=>a.mat),  backgroundColor:'rgba(79,142,247,.7)', borderRadius:4 },
      { label:'Português',  data:d.alunos.map(a=>a.port), backgroundColor:'rgba(45,212,160,.5)', borderRadius:4 },
    ]},
    options:{ ...base, scales:{ x:{ ticks:{ color:'#7a7f94', font:{ family:"'DM Sans'", size:11 } }, grid:{ color:'rgba(255,255,255,.04)' } }, y:{ ticks:{ color:'#7a7f94' }, grid:{ color:'rgba(255,255,255,.04)' }, max:100 } } }
  });
}

function renderGlobalShap(d) {
  document.getElementById('global-shap').innerHTML = d.shap.map(s=>`
    <div class="shap-row" style="margin-bottom:10px;">
      <span class="shap-label" style="width:160px;">${s.l}</span>
      <div class="shap-track" style="height:8px;"><div class="shap-fill" style="height:8px;width:${s.v}%;background:${s.c}"></div></div>
      <span class="shap-pct">${s.v}%</span>
    </div>`).join('');
}
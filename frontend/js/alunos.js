/**
 * EduIA — Alunos — lista, filtro, busca e detalhe individual
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ ALUNOS ═════════════════════════════════════════════════════════════════
function renderAlunos(filtro='') {
  const fi = document.getElementById('search-input');
  const termo = filtro || (fi ? fi.value : '');
  const todos = Object.entries(TURMAS).flatMap(([tk,t])=>t.alunos.map(a=>({...a,turma:tk})));
  const lista = todos.filter(a=>{
    return a.nome.toLowerCase().includes(termo.toLowerCase()) && (FA==='todos' || a.risco===FA);
  }).sort((a,b)=>b.prob-a.prob);

  const SL=['Frequência','Nota mat.','Nota port.','Reprovações'], SC=['var(--red)','var(--amber)','var(--blue)','var(--muted)'];

  // Sync active filter button
  document.querySelectorAll('.filter-btn').forEach(b=>{
    b.classList.toggle('active', b.textContent.toLowerCase().includes(FA==='todos'?'todos':FA==='alto'?'alto':FA==='medio'?'medio':'risco'===FA?'risco':'sem'));
  });

  document.getElementById('alunos-list').innerHTML = lista.length===0
    ? '<div style="text-align:center;color:var(--muted);padding:40px;font-size:13px;background:var(--surface);border:1px solid var(--border);border-radius:12px;">Nenhum aluno encontrado com os filtros atuais. Ajuste a busca ou selecione outro nível de risco.</div>'
    : lista.map(a=>{
        const key = a.id;
        const isExp = EXP === key;
        const cp = a.prog===100?'var(--green)':a.prog>0?'var(--blue)':'var(--surface2)';
        return `
        <div class="aluno-card ${isExp?'expanded':''}" onclick="toggleAluno('${key}')">
          <div class="ac-header">
            <div class="avatar" style="background:${a.bg};color:${a.cor};width:36px;height:36px;">${a.init}</div>
            <div><div class="ac-name">${a.nome}</div><div class="ac-sub">Turma ${a.turma} &middot; ${a.rep} reprovação(ões)</div></div>
            <div class="ac-stat"><div class="ac-stat-val" style="color:${a.freq<75?'var(--red)':a.freq<85?'var(--amber)':'var(--green)'}">${a.freq}%</div><div class="ac-stat-label">Frequência</div></div>
            <div class="ac-stat"><div class="ac-stat-val" style="color:${a.mat<50?'var(--red)':a.mat<65?'var(--amber)':'var(--green)'}">${a.mat}</div><div class="ac-stat-label">Matemática</div></div>
            <div class="ac-stat"><div class="ac-stat-val" style="color:${a.port<50?'var(--red)':a.port<65?'var(--amber)':'var(--green)'}">${a.port}</div><div class="ac-stat-label">Português</div></div>
            <span class="risk-badge r-${a.risco}">${a.risco} ${a.prob}%</span>
            <span class="ac-arrow ${isExp?'open':''}">&#9660;</span>
          </div>
          <div class="ac-detail ${isExp?'open':''}">
            <div>
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:10px;">Fatores SHAP</div>
              ${a.shap.map((v,i)=>`<div class="shap-row"><span class="shap-label">${SL[i]}</span><div class="shap-track"><div class="shap-fill" style="width:${v}%;background:${SC[i]}"></div></div><span class="shap-pct">${v}%</span></div>`).join('')}
            </div>
            <div>
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:10px;">Intervenção sugerida</div>
              <div class="int-box" style="margin-top:0;">${a.int}</div>
              <div style="margin-top:12px;">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:5px;"><span>Progresso da intervenção</span><span>${a.prog}%</span></div>
                <div class="progress-bg"><div class="progress-fill" style="width:${a.prog}%;background:${cp}"></div></div>
              </div>
              <div style="margin-top:12px;display:flex;gap:8px;">
                <button class="btn-int primary" onclick="event.stopPropagation();modalHistorico('${a.id}','${a.turma}')">Ver histórico</button>
                <button class="btn-int warn" onclick="event.stopPropagation();modalNotificar('${a.id}','${a.turma}')">Notificar família</button>
              </div>
            </div>
          </div>
        </div>`;
      }).join('');
}

function toggleAluno(key) { EXP = EXP===key ? null : key; renderAlunos(); }
function filtrarAlunos(v) { renderAlunos(v); }
function setFiltro(r, btn) {
  FA = r;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderAlunos();
}
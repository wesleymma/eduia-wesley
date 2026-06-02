/**
 * EduIA — Relatórios — visualização e exportação CSV
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ RELATORIOS ═════════════════════════════════════════════════════════════
function renderRelatorios() {
  const turmasArr = Object.entries(TURMAS);
  const totalAlunos   = turmasArr.reduce((s,[,t])=>s+t.total,0);
  const totalAlto     = turmasArr.reduce((s,[,t])=>s+t.alto,0);
  const totalConcluidas = turmasArr.reduce((s,[,t])=>s+t.alunos.filter(a=>a.status==='concluida').length,0);

  document.getElementById('relatorios-content').innerHTML = `
    <!-- Cabecalho e filtros -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div style="display:flex;gap:10px;align-items:center;">
        <span style="font-size:13px;color:var(--muted);">Periodo:</span>
        <select id="sel-periodo" style="background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:6px 12px;font-family:var(--sans);font-size:13px;outline:none;">
          <option>Abril 2025</option><option>Março 2025</option><option>Fevereiro 2025</option><option>Janeiro 2025</option>
        </select>
      </div>
      <button class="btn-int primary" onclick="exportarCSVTodos()" style="padding:8px 16px;font-size:13px;">
        Exportar todas as turmas
      </button>
    </div>

    <!-- Resumo geral -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;">
      <div class="int-sum-card"><div class="int-sum-val" style="color:var(--blue)">${totalAlunos}</div><div class="int-sum-label">Total monitorados</div></div>
      <div class="int-sum-card"><div class="int-sum-val" style="color:var(--red)">${totalAlto}</div><div class="int-sum-label">Em risco alto</div></div>
      <div class="int-sum-card"><div class="int-sum-val" style="color:var(--green)">${totalConcluidas}</div><div class="int-sum-label">Intervenções concluídas</div></div>
    </div>

    <!-- Cards por turma -->
    ${turmasArr.map(([tk,t])=>{
      const alto     = t.alunos.filter(a=>a.risco==='alto').length;
      const medio    = t.alunos.filter(a=>a.risco==='medio').length;
      const baixo    = t.alunos.filter(a=>a.risco==='baixo').length;
      const concl    = t.alunos.filter(a=>a.status==='concluida').length;
      const pend     = t.alunos.filter(a=>a.status==='pendente').length;
      const mmat     = Math.round(t.alunos.reduce((s,a)=>s+a.mat,0)/t.alunos.length);
      const mport    = Math.round(t.alunos.reduce((s,a)=>s+a.port,0)/t.alunos.length);
      const mfreq    = Math.round(t.alunos.reduce((s,a)=>s+a.freq,0)/t.alunos.length);
      const pctRisco = Math.round(alto/t.total*100);
      const pctInt   = Math.round(concl/t.alunos.length*100);
      return `
      <div class="relatorio-card" style="margin-bottom:14px;">
        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">
          <div>
            <div style="font-size:15px;font-weight:600;">Turma ${tk}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${t.total} alunos &middot; E.E. Dom Bosco &middot; Abril 2025</div>
          </div>
          <span class="risk-badge r-${pctRisco>30?'alto':pctRisco>15?'medio':'baixo'}" style="font-size:11px;">${pctRisco}% risco alto</span>
        </div>

        <!-- Stats grid -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:14px;">
          ${[['Risco alto','var(--red)',alto],['Risco medio','var(--amber)',medio],['Sem risco','var(--green)',baixo],['Media Mat.','var(--blue)',mmat],['Media Port.','var(--blue)',mport],['Freq. media','var(--muted)',mfreq+'%']].map(([l,c,v])=>`
          <div style="text-align:center;background:var(--surface2);border-radius:8px;padding:10px 6px;">
            <div style="font-family:var(--mono);font-size:18px;font-weight:700;color:${c};">${v}</div>
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-top:3px;">${l}</div>
          </div>`).join('')}
        </div>

        <!-- Barra risco -->
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px;"><span>Distribuicao de risco</span></div>
          <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;gap:2px;">
            <div style="width:${Math.round(alto/t.total*100)}%;background:var(--red);border-radius:4px 0 0 4px;" title="Alto: ${alto}"></div>
            <div style="width:${Math.round(medio/t.total*100)}%;background:var(--amber);" title="Medio: ${medio}"></div>
            <div style="flex:1;background:var(--green);border-radius:0 4px 4px 0;" title="Baixo: ${baixo}"></div>
          </div>
          <div style="display:flex;gap:12px;margin-top:5px;">
            <span style="font-size:10px;color:var(--red);">&#9632; Alto (${alto})</span>
            <span style="font-size:10px;color:var(--amber);">&#9632; Medio (${medio})</span>
            <span style="font-size:10px;color:var(--green);">&#9632; Sem risco (${baixo})</span>
          </div>
        </div>

        <!-- Barra intervencoes -->
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px;"><span>Intervenções concluídas</span><span>${pctInt}%</span></div>
          <div class="progress-bg"><div class="progress-fill" style="width:${pctInt}%;background:${pctInt>70?'var(--green)':pctInt>30?'var(--blue)':'var(--amber)'}"></div></div>
          <div style="font-size:10px;color:var(--muted);margin-top:4px;">${concl} concluidas &middot; ${pend} pendentes</div>
        </div>

        <!-- Acoes -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--border);padding-top:12px;">
          <button class="btn-int primary" onclick="exportarCSV('${tk}')">Baixar CSV</button>
          <button class="btn-int" onclick="verDetalheRelatorio('${tk}')">Ver alunos</button>
          <button class="btn-int" onclick="goTo('dashboard',document.getElementById('nav-dashboard'));CT='${tk}';document.querySelectorAll('.pill').forEach((p,i)=>{p.classList.toggle('active',['7A','8B','9C'][i]==='${tk}')});render()">Abrir dashboard</button>
        </div>
      </div>`;
    }).join('')}`;
}

function csvEscape(value, sep) {
  const text = String(value ?? '');
  return /["\n\r]/.test(text) || text.includes(sep) ? `"${text.replace(/"/g,'""')}"` : text;
}

function csvHeader() {
  const header = ['Nome','Turma','Risco','Probabilidade (%)','Frequência (%)','Nota Matemática','Nota Português','Reprovações','Status Intervenção','Progresso (%)'];
  if(CFG.inclHistorico) header.push('Histórico Intervenções');
  if(CFG.inclShap) header.push('SHAP Frequência','SHAP Matemática','SHAP Português','SHAP Reprovações');
  return header;
}

function csvRow(a, turma) {
  const row = [a.nome, turma, a.risco, a.prob, a.freq, a.mat, a.port, a.rep, a.status, a.prog];
  if(CFG.inclHistorico) row.push((a.hist || []).join(' | '));
  if(CFG.inclShap) row.push(...a.shap);
  return row;
}

function exportarCSV(turma) {
  const t = TURMAS[turma];
  const sep = CFG.sepCSV || ';';
  const bom = '\uFEFF'; // BOM UTF-8 — corrige acentos no Excel
  const linhas = [bom+csvHeader().map(v=>csvEscape(v, sep)).join(sep)];
  t.alunos.forEach(a=>linhas.push(csvRow(a, turma).map(v=>csvEscape(v, sep)).join(sep)));
  const blob = new Blob([linhas.join('\n')], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `EduIA_Turma_${turma}_${hojeStr().replace(/\//g,'-')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast('CSV da Turma '+turma+' baixado com sucesso!', 'success');
}

function exportarCSVTodos() {
  const bom = '\uFEFF';
  const sep = CFG.sepCSV || ';';
  const linhas = [bom+csvHeader().map(v=>csvEscape(v, sep)).join(sep)];
  Object.entries(TURMAS).forEach(([tk,t])=>{
    t.alunos.forEach(a=>linhas.push(csvRow(a, tk).map(v=>csvEscape(v, sep)).join(sep)));
  });
  const blob = new Blob([linhas.join('\n')], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href=url; link.download=`EduIA_Todas_Turmas_${hojeStr().replace(/\//g,'-')}.csv`;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast('CSV de todas as turmas exportado!', 'success');
}

function verDetalheRelatorio(turma) {
  const t = TURMAS[turma];
  const rows = t.alunos
    .sort((a,b)=>b.prob-a.prob)
    .map(a=>`
      <tr>
        <td style="padding:7px 8px;font-size:12px;">${a.nome}</td>
        <td style="padding:7px 8px;"><span class="risk-badge r-${a.risco}" style="font-size:10px;">${a.risco}</span></td>
        <td style="padding:7px 8px;font-family:var(--mono);font-size:12px;">${a.prob}%</td>
        <td style="padding:7px 8px;font-family:var(--mono);font-size:12px;color:${a.freq<75?'var(--red)':a.freq<85?'var(--amber)':'var(--green)'}">${a.freq}%</td>
        <td style="padding:7px 8px;font-family:var(--mono);font-size:12px;color:${a.mat<50?'var(--red)':a.mat<65?'var(--amber)':'var(--green)'}">${a.mat}</td>
        <td style="padding:7px 8px;font-family:var(--mono);font-size:12px;color:${a.port<50?'var(--red)':a.port<65?'var(--amber)':'var(--green)'}">${a.port}</td>
        <td style="padding:7px 8px;"><span class="status-badge s-${a.status}" style="font-size:10px;padding:2px 8px;">${a.status}</span></td>
      </tr>`).join('');
  openModal(
    'Alunos — Turma '+turma,
    t.total+' alunos · '+t.alunos.filter(a=>a.risco==='alto').length+' em risco alto',
    `<div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:480px;">
        <thead><tr style="border-bottom:1px solid var(--border);">
          ${['Aluno','Risco','Prob.','Freq.','Mat.','Port.','Status'].map(h=>`<th style="text-align:left;padding:6px 8px;color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:500;">${h}</th>`).join('')}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`,
    `<button class="modal-btn cancel" onclick="closeModal()">Fechar</button>
     <button class="modal-btn confirm" onclick="exportarCSV('${turma}');closeModal()">Baixar CSV</button>`
  );
}
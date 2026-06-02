/**
 * EduIA — Turmas — visão consolidada por turma
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ TURMAS ═════════════════════════════════════════════════════════════════
function renderTurmas() {
  document.getElementById('turmas-content').innerHTML = `
    <div style="margin-bottom:16px;font-size:13px;color:var(--muted);">Clique em uma turma para abrir o dashboard correspondente.</div>
    ${Object.entries(TURMAS).map(([tk,t])=>{
      const pct_alto = Math.round(t.alto/t.total*100);
      const pct_med  = Math.round(t.medio/t.total*100);
      const pct_bx   = 100 - pct_alto - pct_med;
      const media_freq = Math.round(t.alunos.reduce((s,a)=>s+a.freq,0)/t.alunos.length);
      const media_mat  = Math.round(t.alunos.reduce((s,a)=>s+a.mat,0)/t.alunos.length);
      const media_port = Math.round(t.alunos.reduce((s,a)=>s+a.port,0)/t.alunos.length);
      const pendentes  = t.alunos.filter(a=>a.status==='pendente').length;
      const nivel_risco = pct_alto>30?'alto':pct_alto>15?'medio':'baixo';
      return `
      <div class="relatorio-card" style="cursor:pointer;transition:border-color .15s;" onclick="abrirTurma('${tk}')"
           onmouseover="this.style.borderColor='rgba(45,212,160,0.4)'" onmouseout="this.style.borderColor='var(--border)'">

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:10px;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:15px;font-weight:700;color:var(--green);">${tk}</div>
            <div>
              <div style="font-size:15px;font-weight:600;">Turma ${tk}</div>
              <div style="font-size:11px;color:var(--muted);">${t.total} alunos &middot; E.E. Dom Bosco</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            ${pendentes>0?`<span style="background:var(--amber-dim);color:var(--amber);font-size:10px;padding:3px 8px;border-radius:10px;font-weight:600;">${pendentes} pendentes</span>`:''}
            <span class="risk-badge r-${nivel_risco}" style="font-size:11px;">${pct_alto}% risco alto</span>
            <span style="color:var(--muted);font-size:16px;">&#8594;</span>
          </div>
        </div>

        <!-- Estatísticas -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:14px;">
          ${[
            ['Alto','var(--red)',t.alto],
            ['Medio','var(--amber)',t.medio],
            ['Baixo','var(--green)',t.baixo],
            ['Media Mat.','var(--blue)',media_mat],
            ['Media Port.','var(--blue)',media_port],
            ['Freq. media','var(--muted)',media_freq+'%'],
          ].map(([l,c,v])=>`
          <div style="text-align:center;background:var(--surface2);border-radius:8px;padding:10px 4px;">
            <div style="font-family:var(--mono);font-size:17px;font-weight:700;color:${c};">${v}</div>
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-top:3px;">${l}</div>
          </div>`).join('')}
        </div>

        <!-- Barra de composição -->
        <div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:5px;">Composicao da turma por risco</div>
          <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;gap:1px;">
            <div style="width:${pct_alto}%;background:var(--red);" title="Alto"></div>
            <div style="width:${pct_med}%;background:var(--amber);" title="Medio"></div>
            <div style="flex:1;background:var(--green);" title="Sem risco"></div>
          </div>
          <div style="display:flex;gap:14px;margin-top:5px;">
            <span style="font-size:10px;color:var(--red);">&#9632; Alto (${t.alto})</span>
            <span style="font-size:10px;color:var(--amber);">&#9632; Medio (${t.medio})</span>
            <span style="font-size:10px;color:var(--green);">&#9632; Sem risco (${t.baixo})</span>
          </div>
        </div>
      </div>`;
    }).join('')}`;
}

function abrirTurma(tk) {
  // Navega para o dashboard e seleciona a turma correta
  goTo('dashboard', document.getElementById('nav-dashboard'));
  CT = tk;
  SEL = null;
  document.querySelectorAll('.pill').forEach(p => {
    const match = p.textContent.replace(/\s/g,'') === tk.replace(/\s/g,'');
    p.classList.toggle('active', match);
  });
  render();
}
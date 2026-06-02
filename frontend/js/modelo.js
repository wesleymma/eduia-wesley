/**
 * EduIA — Modelo de IA — métricas e matriz de confusão
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ MODELO ═════════════════════════════════════════════════════════════════
function renderModelo() {
  document.getElementById('modelo-content').innerHTML = `
    <div class="modelo-grid">
      <div class="panel"><div class="panel-header"><span class="panel-title">Comparacao de modelos</span></div>
        <div class="panel-body">
          ${[['Random Forest','87.3%','84.9%','0.921','var(--green)',true],['SVM (RBF)','82.1%','80.4%','0.887','var(--muted)',false],['KNN (k=7)','78.6%','76.2%','0.851','var(--muted)',false]].map(([n,a,f,r,c,best])=>`
          <div style="background:${best?'var(--green-dim)':'var(--surface2)'};border:1px solid ${best?'rgba(45,212,160,.3)':'var(--border)'};border-radius:8px;padding:12px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-weight:600;font-size:13px;color:${c}">${n}</span>
              ${best?'<span style="font-size:10px;background:var(--green);color:#0f1117;padding:2px 8px;border-radius:10px;font-weight:700;">Vencedor</span>':''}
            </div>
            <div style="display:flex;gap:16px;">
              <div><div style="font-size:10px;color:var(--muted);">Acurácia</div><div style="font-family:var(--mono);font-size:14px;font-weight:700;">${a}</div></div>
              <div><div style="font-size:10px;color:var(--muted);">F1-Score</div><div style="font-family:var(--mono);font-size:14px;font-weight:700;">${f}</div></div>
              <div><div style="font-size:10px;color:var(--muted);">AUC-ROC</div><div style="font-family:var(--mono);font-size:14px;font-weight:700;">${r}</div></div>
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div class="panel"><div class="panel-header"><span class="panel-title">Importancia das variaveis (SHAP global)</span></div>
        <div class="panel-body">
          ${[{l:'Frequencia escolar',v:38,c:'var(--red)'},{l:'Nota matematica',v:31,c:'var(--amber)'},{l:'Nota portugues',v:18,c:'var(--blue)'},{l:'Reprovacoes ant.',v:13,c:'var(--muted)'}].map(s=>`
          <div class="shap-row" style="margin-bottom:12px;">
            <span class="shap-label" style="width:160px;">${s.l}</span>
            <div class="shap-track" style="height:10px;"><div class="shap-fill" style="height:10px;width:${s.v}%;background:${s.c}"></div></div>
            <span class="shap-pct">${s.v}%</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="panel"><div class="panel-header"><span class="panel-title">Matriz de confusao — Random Forest</span><span class="panel-hint">Conjunto de teste (20%)</span></div>
      <div class="panel-body">
        <div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:6px;max-width:420px;">
          <div></div>
          <div style="text-align:center;font-size:11px;color:var(--muted);padding:6px;">Baixo</div>
          <div style="text-align:center;font-size:11px;color:var(--muted);padding:6px;">Medio</div>
          <div style="text-align:center;font-size:11px;color:var(--muted);padding:6px;">Alto</div>
          ${[['Baixo','#174','18','4'],['Medio','22','#161','12'],['Alto','6','14','#128']].map(([label,...vals])=>`
            <div style="font-size:11px;color:var(--muted);display:flex;align-items:center;">${label}</div>
            ${vals.map(v=>`<div style="text-align:center;padding:10px 6px;border-radius:6px;font-family:var(--mono);font-size:14px;font-weight:700;background:${v.startsWith('#')?'var(--green-dim)':'var(--surface2)'};color:${v.startsWith('#')?'var(--green)':'var(--muted)'};">${v.startsWith('#')?v.slice(1):v}</div>`).join('')}
          `).join('')}
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--muted);">Diagonal = predicoes corretas. Valores fora da diagonal = erros do modelo.</div>
      </div>
    </div>`;
}
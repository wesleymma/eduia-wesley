/* EduIA — ficha individual do aluno (usada no painel da turma, na lista
   de alunos e no simulador). */

function valorDoFator(rotulo, a) {
  switch (rotulo) {
    case 'Frequência': return a.freq + '%';
    case 'Matemática': return a.mat;
    case 'Português': return a.port;
    case 'Reprovações': return a.rep;
    case 'Nível socioeconômico': return fmt(a.ise, 1);
    case 'Programa social': return a.social ? 'sim' : 'não';
    case 'Escola rural': return a.rural ? 'sim' : 'não';
    default: return '';
  }
}

/** Barras divergentes: para a direita o fator aumenta a chance de risco
 *  alto, para a esquerda reduz. Unidade: pontos percentuais. */
function htmlShap(a) {
  const itens = a.shap.slice(0, 5);
  const escala = Math.max(...itens.map(s => Math.abs(s.v)), 0.05);
  const linhas = itens.map(s => {
    const w = Math.round(Math.abs(s.v) / escala * 100);
    const pp = Math.round(s.v * 100);
    const txt = (pp > 0 ? '+' : pp < 0 ? '−' : '') + Math.abs(pp) + ' pp';
    return `<div class="shap-item" role="listitem" aria-label="${esc(s.r)}: ${pp > 0 ? 'aumenta' : 'reduz'} ${Math.abs(pp)} pontos">
      <span class="rot">${esc(s.r)} <span style="color:var(--ink-3)">${esc(valorDoFator(s.r, a))}</span></span>
      <span class="neg">${s.v < 0 ? `<span style="width:${w}%"></span>` : ''}</span>
      <span class="pos">${s.v > 0 ? `<span style="width:${w}%"></span>` : ''}</span>
      <span class="val">${txt}</span>
    </div>`;
  }).join('');
  return `<div class="shap-lista" role="list">${linhas}</div>
    <div class="shap-eixo" aria-hidden="true"><span></span><span>reduz o risco</span><span>aumenta o risco</span><span></span></div>`;
}

function htmlProbs(p) {
  return `<div class="probs" aria-hidden="true">
      <span style="width:${p.alto}%;background:var(--alto)"></span>
      <span style="width:${p.medio}%;background:var(--medio)"></span>
      <span style="width:${p.baixo}%;background:var(--baixo)"></span>
    </div>
    <div class="probs-leg"><span>Alto ${fmt(p.alto)}%</span><span>Médio ${fmt(p.medio)}%</span><span>Baixo ${fmt(p.baixo)}%</span></div>`;
}

const STATUS_ROT = { pendente: 'Intervenção a iniciar', andamento: 'Intervenção em andamento', concluida: 'Intervenção encerrada', nenhuma: 'Sem intervenção' };

function htmlFicha(a, { comBotao = true, meta } = {}) {
  const t = TURMAS[a.turma];
  return `
    <div class="ficha-cabeca">
      <h2>${esc(a.nome)}</h2>
      <p class="meta">${esc(meta || `${t ? t.nome : ''} · ${a.rep} reprovaç${a.rep === 1 ? 'ão' : 'ões'} · ${STATUS_ROT[a.status] || ''}`)}</p>
      <div style="margin-top:10px">${riscoTag(a.risco)} <span style="color:var(--ink-2);font-size:13px">· ${fmt(a.prob)}% de probabilidade neste nível</span></div>
    </div>
    <div class="ficha-sec">
      <dl class="indicadores">
        <div><dt>Frequência</dt><dd class="${nivel('freq', a.freq)}">${a.freq}%</dd></div>
        <div><dt>Matemática</dt><dd class="${nivel('mat', a.mat)}">${a.mat}</dd></div>
        <div><dt>Português</dt><dd class="${nivel('port', a.port)}">${a.port}</dd></div>
      </dl>
    </div>
    <div class="ficha-sec">
      <h3>Probabilidade por nível</h3>
      ${htmlProbs(a.probs)}
    </div>
    <div class="ficha-sec">
      <h3>O que puxou a estimativa de risco alto</h3>
      ${htmlShap(a)}
    </div>
    <div class="ficha-sec">
      <h3>Ações sugeridas</h3>
      <ul class="acoes">${a.acoes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      ${comBotao && a.status !== 'nenhuma' ? `<div style="margin-top:14px"><a class="btn" href="#intervencoes" data-foco="${a.id}">Abrir intervenção</a></div>` : ''}
    </div>`;
}

function abrirFichaDialogo(id) {
  const a = acharAluno(id);
  if (!a) return;
  abrirDialogo({ titulo: 'Ficha do aluno', sub: TURMAS[a.turma].nome, corpo: `<div class="bloco" style="border:0">${htmlFicha(a)}</div>`, largo: false });
  $('#dlg-corpo').style.padding = '0';
}
document.addEventListener('DOMContentLoaded', () => {
  $('#dialogo').addEventListener('close', () => { $('#dlg-corpo').style.padding = ''; });
});

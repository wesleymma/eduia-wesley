/* EduIA — Simulador: envia um aluno hipotético para a API (POST /prever). */
const CAMPOS_SIM = [
  { k: 'freq_escolar', rot: 'Frequência (%)', min: 0, max: 100, passo: 1, v: 72 },
  { k: 'nota_matematica', rot: 'Nota de Matemática', min: 0, max: 100, passo: 1, v: 48 },
  { k: 'nota_portugues', rot: 'Nota de Português', min: 0, max: 100, passo: 1, v: 55 },
  { k: 'reprovacoes', rot: 'Reprovações anteriores', min: 0, max: 5, passo: 1, v: 1 },
  { k: 'ind_socioecon', rot: 'Nível socioeconômico da escola (0 a 10)', min: 0, max: 10, passo: 0.1, v: 4.5 },
];
let apiOnline = null;

async function checarAPI() {
  try {
    const r = await fetch(CFG.apiUrl.replace(/\/$/, '') + '/health', { signal: AbortSignal.timeout(2500) });
    apiOnline = r.ok;
  } catch (e) { apiOnline = false; }
  const s = $('#status-api');
  if (s) { s.className = 'status-api ' + (apiOnline ? 'on' : 'off'); s.textContent = apiOnline ? `API conectada em ${CFG.apiUrl}` : `API fora do ar em ${CFG.apiUrl}`; }
  return apiOnline;
}

function telaSimulador() {
  $('#tela-simulador').innerHTML = `
    <div class="grade-sim">
      <section class="bloco" aria-labelledby="h-sim">
        <div class="bloco-topo"><h2 id="h-sim">Dados do aluno</h2></div>
        <form class="bloco-corpo form-sim" id="form-sim">
          <span class="status-api" id="status-api">Verificando a API…</span>
          <div class="campo"><label for="sim-nome">Nome ou identificação</label><input class="input" id="sim-nome" value="Aluno simulado" maxlength="80"></div>
          ${CAMPOS_SIM.map(c => `<div class="campo"><label for="sim-${c.k}">${c.rot}</label>
            <div class="faixa"><input type="range" id="sim-${c.k}-r" min="${c.min}" max="${c.max}" step="${c.passo}" value="${c.v}" aria-label="${c.rot}">
            <input class="input" type="number" id="sim-${c.k}" min="${c.min}" max="${c.max}" step="${c.passo}" value="${c.v}"></div></div>`).join('')}
          <div class="opcoes" style="margin-top:0">
            <label class="check"><input type="checkbox" id="sim-programa_social" checked> Participa de programa social</label>
            <label class="check"><input type="checkbox" id="sim-escola_rural"> Escola rural</label>
          </div>
          <button class="btn btn-primario btn-grande" type="submit" id="btn-sim">Calcular risco</button>
        </form>
      </section>
      <section class="bloco" id="sim-resultado" aria-live="polite">
        <div class="ficha-vazia"><h2>Resultado</h2><p>Ajuste os indicadores e clique em Calcular risco. O cálculo roda no modelo treinado, pela API.</p></div>
      </section>
    </div>`;

  CAMPOS_SIM.forEach(c => {
    const r = $(`#sim-${c.k}-r`), n = $(`#sim-${c.k}`);
    r.addEventListener('input', () => { n.value = r.value; });
    n.addEventListener('input', () => { r.value = n.value; });
  });
  $('#form-sim').addEventListener('submit', simular);
  checarAPI();
}

async function simular(e) {
  e.preventDefault();
  const btn = $('#btn-sim'), out = $('#sim-resultado');
  const corpo = { nome: $('#sim-nome').value.trim() || 'Aluno simulado' };
  for (const c of CAMPOS_SIM) {
    const v = Number($(`#sim-${c.k}`).value);
    if (Number.isNaN(v) || v < c.min || v > c.max) { toast(`${c.rot}: use um valor entre ${c.min} e ${c.max}.`); $(`#sim-${c.k}`).focus(); return; }
    corpo[c.k] = c.k === 'reprovacoes' ? Math.round(v) : v;
  }
  corpo.programa_social = $('#sim-programa_social').checked ? 1 : 0;
  corpo.escola_rural = $('#sim-escola_rural').checked ? 1 : 0;

  btn.disabled = true; btn.textContent = 'Calculando…';
  try {
    const r = await fetch(CFG.apiUrl.replace(/\/$/, '') + '/prever', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const p = await r.json();
    const a = {
      id: 'sim', turma: null, nome: p.nome, freq: corpo.freq_escolar, mat: corpo.nota_matematica, port: corpo.nota_portugues,
      rep: corpo.reprovacoes, ise: corpo.ind_socioecon, social: corpo.programa_social, rural: corpo.escola_rural,
      risco: p.risco, prob: p.probabilidade, probs: p.probabilidades, pAlto: p.probabilidades.alto,
      shap: p.shap.map(s => ({ r: s.rotulo, c: s.contribuicao, v: s.valor_shap })), acoes: p.intervencao, status: 'nenhuma',
    };
    out.innerHTML = htmlFicha(a, { comBotao: false, meta: 'Simulação · nada é salvo' });
  } catch (err) {
    out.innerHTML = `<div class="ficha-vazia"><h2>Não consegui falar com a API</h2>
      <p>O simulador precisa da API rodando em ${esc(CFG.apiUrl)}. No terminal, dentro de <code>backend/</code>:</p>
      <pre class="cmd">uvicorn api.api:app --port 8000</pre>
      <p style="margin-top:12px">Depois clique em Calcular risco de novo. O endereço pode ser trocado em Configurações.</p></div>`;
    checarAPI();
  } finally {
    btn.disabled = false; btn.textContent = 'Calcular risco';
  }
}

/* Conversa por voz, parte 2: a voz neural do Cifrão e os cartões visuais da resposta.
   A voz é gerada no aparelho (assets/js/voz-worker.js, Piper pt-BR), de graça e sem limite. Ela começa a ser preparada
   quando a conversa por voz abre (~63 MB na primeira vez, depois fica no Cache). Até ficar pronta, ou se falhar,
   basVozLigar (basico.js) fala com a melhor voz em português do sistema. A fala sai frase a frase: a primeira começa logo. */
'use strict';
const VOZN = { w: null, estado: 'nada', p: 0, ctx: null, an: null, id: 0, fila: [], fim: 0, segs: [], raf: 0, cb: null, total: 0, chegou: 0, acabou: false };
const vozNLigada = () => { const p = S.profile && S.profile.prefs && S.profile.prefs.vozCifrao; return !p || p === 'neural'; };
function vozNeuralPreparar(tela) {
  if (!vozNLigada() || VOZN.estado === 'pronto' || VOZN.estado === 'baixando' || typeof Worker === 'undefined') { vozNSelo(tela); return; }
  const c = navigator.connection; if (c && c.saveData && VOZN.estado !== 'pedido') { vozNSelo(tela); return; } // economia de dados: só baixa se a pessoa pedir (toque no selo)
  try { VOZN.w = VOZN.w || new Worker(new URL('assets/js/voz-worker.js?v=vn1', document.baseURI).href); } catch (e) { VOZN.estado = 'erro'; return; }
  VOZN.w.onmessage = vozNMsg; VOZN.w.onerror = () => { VOZN.estado = 'erro'; vozNSelo(); };
  VOZN.estado = 'baixando'; VOZN.p = 0; vozNSelo(tela); VOZN.w.postMessage({ tipo: 'preparar' });
}
// selo discreto no topo da conversa: "Preparando a voz 34%" → some quando fica pronta
function vozNSelo(tela) {
  const w = tela || document.querySelector('.bas-voz'); if (!w) return; let s = w.querySelector('[data-voz-prep]');
  const txt = VOZN.estado === 'baixando' ? `Preparando a voz natural ${Math.round(VOZN.p * 100)}%` : VOZN.estado === 'erro' && vozNLigada() ? 'Voz do aparelho' : !vozNLigada() || VOZN.estado === 'pronto' ? '' : 'Baixar a voz natural';
  if (!txt) { if (s) s.remove(); return; }
  if (!s) { s = document.createElement('button'); s.type = 'button'; s.className = 'vzn-prep'; s.dataset.vozPrep = ''; s.addEventListener('click', () => { if (VOZN.estado === 'nada') { VOZN.estado = 'pedido'; vozNeuralPreparar(); } }); const c = w.querySelector('.bas-voz-c'); if (c) c.before(s); else w.appendChild(s); }
  s.textContent = txt; s.style.setProperty('--p', String(VOZN.p)); s.classList.toggle('on', VOZN.estado === 'baixando');
}
function vozNMsg(e) {
  const d = e.data || {};
  if (d.tipo === 'prog') { VOZN.p = d.p; vozNSelo(); return; }
  if (d.tipo === 'pronto') { VOZN.estado = 'pronto'; VOZN.p = 1; vozNSelo(); return; }
  if (d.tipo === 'erro') { if (VOZN.estado !== 'pronto') VOZN.estado = 'erro'; vozNSelo(); if (d.id === VOZN.id && VOZN.cb) { const cb = VOZN.cb; VOZN.cb = null; cb.erro(); } return; }
  if (d.id !== VOZN.id || !VOZN.cb) return; // resposta de uma fala já interrompida
  if (d.tipo === 'audio') vozNTocar(d.i, d.pcm, d.sr);
  if (d.tipo === 'fim') { VOZN.acabou = true; vozNTalvezFim(); }
}
// no iPhone o áudio só pode começar dentro de um toque: o toque no Cifrão (ouvir) destrava o AudioContext
function vozNeuralDestravar() {
  try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; if (!VOZN.ctx) { VOZN.ctx = new AC(); VOZN.an = VOZN.ctx.createAnalyser(); VOZN.an.fftSize = 256; VOZN.an.connect(VOZN.ctx.destination); }
    if (VOZN.ctx.state === 'suspended') VOZN.ctx.resume(); } catch (e) { VOZN.ctx = null; }
}
// texto para falar: números e símbolos do jeito que se diz (R$ 1.234,56 → 1234 reais e 56 centavos)
// números por extenso: as vozes liam "R$ 1.000" como "um real" ou dígito a dígito
const VZ_U = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const VZ_D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const VZ_C = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
function vozAte999(n) {
  if (n === 100) return 'cem'; const c = Math.floor(n / 100), r = n % 100, p = [];
  if (c) p.push(VZ_C[c]); if (r) p.push(r < 20 ? VZ_U[r] : VZ_D[Math.floor(r / 10)] + (r % 10 ? ' e ' + VZ_U[r % 10] : ''));
  return p.join(' e ');
}
function vozExtenso(n) {
  n = Math.floor(Math.abs(n)); if (!n) return 'zero'; if (n >= 1e12) return String(n);
  const NOMES = [null, ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']]; const g = []; for (let x = n; x > 0; x = Math.floor(x / 1000)) g.push(x % 1000);
  const partes = []; for (let k = g.length - 1; k >= 0; k--) { const v = g[k]; if (!v) continue; partes.push(k === 1 && v === 1 ? 'mil' : vozAte999(v) + (k ? ' ' + NOMES[k][v === 1 ? 0 : 1] : '')); }
  const ult = g[0]; return partes.length > 1 && ult && (ult < 100 || ult % 100 === 0) ? partes.slice(0, -1).join(' ') + ' e ' + partes[partes.length - 1] : partes.join(' ');
}
const vozReais = (n, cc) => { const redondo = n >= 1e6 && n % 1e6 === 0; return `${n ? `${vozExtenso(n)}${redondo ? ' de' : ''} ${n === 1 ? 'real' : 'reais'}` : ''}${n && cc ? ' e ' : ''}${cc ? `${vozExtenso(cc)} ${cc === 1 ? 'centavo' : 'centavos'}` : ''}` || 'zero reais'; };
const vozDec = (b) => (b[0] === '0' ? [...b].map((d) => VZ_U[+d]).join(' ') : vozExtenso(+b));
function vozNDizer(t) {
  return String(t).replace(/R\$\s?•+/g, 'um valor escondido').replace(/(-)\s?R\$/g, 'menos R$')
    .replace(/R\$\s?(\d+)(?:,(\d+))?\s?(mil|milhões|milhão|bilhões|bilhão)\b/g, (_, a, b, u) => `${vozExtenso(+a)}${b ? ` vírgula ${vozDec(b)}` : ''} ${u} ${/mil$/.test(u) ? '' : 'de '}reais`)
    .replace(/R\$\s?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/g, (_, r, c) => vozReais(+r.replace(/\./g, ''), c ? +c.padEnd(2, '0') : 0))
    .replace(/(\d+),(\d+)\s?%/g, (_, a, b) => `${vozExtenso(+a)} vírgula ${vozDec(b)} por cento`).replace(/(\d+)\s?%/g, (_, a) => `${vozExtenso(+a)} por cento`)
    .replace(/p\.p\./g, 'pontos percentuais').replace(/\b(\d{1,3}(?:\.\d{3})+)\b/g, (m) => m.replace(/\./g, ''))
    .replace(/(\d+),(\d+)/g, (_, a, b) => `${vozExtenso(+a)} vírgula ${vozDec(b)}`).replace(/\d+/g, (m) => vozExtenso(+m));
}
// frases com a posição no texto (para acender as palavras de cada uma enquanto ela toca)
function vozNFrases(txt) {
  const out = []; const re = /[^.!?]+(?:[.!?]+|$)/g; let m;
  while ((m = re.exec(txt))) { const s = m[0]; if (!s.trim()) continue; const ult = out[out.length - 1];
    if (ult && ult.t.length < 18) { ult.t += s; ult.c1 = m.index + s.length; } else out.push({ t: s, c0: m.index, c1: m.index + s.length }); }
  return out;
}
/* fala com a voz neural; devolve false se ela ainda não estiver pronta (aí quem chamou usa a voz do sistema).
   o: { acende(c), est(e, dica), pausa, cif(gesto), w } (as mesmas ferramentas da conversa por voz) */
function vozNeuralFalar(txt, o) {
  if (!vozNLigada() || VOZN.estado !== 'pronto' || !VOZN.w) return false;
  vozNeuralDestravar(); if (!VOZN.ctx) return false;
  vozNeuralParar(); const fr = vozNFrases(String(txt)); if (!fr.length) return false;
  VOZN.id++; VOZN.segs = []; VOZN.fim = 0; VOZN.total = fr.length; VOZN.chegou = 0; VOZN.acabou = false; VOZN.fr = fr;
  VOZN.cb = Object.assign({}, o, { erro: () => { vozNParaLoop(); o.acende(1e9); o.pausa.disabled = true; o.est('parado', 'Toque no Cifrão para continuar'); } });
  o.est('pensando', 'Preparando a fala…');
  VOZN.w.postMessage({ tipo: 'falar', id: VOZN.id, frases: fr.map((f) => vozNDizer(f.t)) });
  return true;
}
function vozNTocar(i, pcm, sr) {
  const cb = VOZN.cb; const ctx = VOZN.ctx; if (!cb || !ctx) return; VOZN.chegou++;
  const buf = ctx.createBuffer(1, pcm.length, sr); buf.copyToChannel(pcm, 0); const src = ctx.createBufferSource(); src.buffer = buf; src.connect(VOZN.an);
  const ini = Math.max(ctx.currentTime + 0.04, VOZN.fim + (i ? 0.16 : 0)); src.start(ini); VOZN.fim = ini + buf.duration; VOZN.fila.push(src);
  const f = VOZN.fr[i]; VOZN.segs.push({ ini, dur: buf.duration, c0: f.c0, c1: f.c1 });
  if (i === 0) { cb.est('falando', 'Falando…'); cb.pausa.disabled = false; vozNLoop(); }
  src.onended = () => vozNTalvezFim();
}
function vozNTalvezFim() {
  const cb = VOZN.cb; if (!cb || !VOZN.acabou || VOZN.chegou < VOZN.total || (VOZN.ctx && VOZN.ctx.currentTime < VOZN.fim - 0.05)) return;
  VOZN.cb = null; vozNParaLoop(); cb.acende(1e9); cb.pausa.disabled = true; if (cb.w.dataset.est === 'falando') cb.est('parado', 'Toque no Cifrão para continuar');
}
// a cada quadro: acende as palavras da frase que está tocando e passa o volume da voz para a tela (--vn: ondas e o Cifrão "respirando")
function vozNLoop() {
  const cb = VOZN.cb; const ctx = VOZN.ctx; if (!cb || !ctx) return; const t = ctx.currentTime; const s = VOZN.segs.filter((x) => x.ini <= t).pop();
  if (s) cb.acende(s.c0 + (s.c1 - s.c0) * Math.min(1, (t - s.ini) / s.dur));
  const a = new Uint8Array(VOZN.an.fftSize); VOZN.an.getByteTimeDomainData(a); let q = 0; for (let k = 0; k < a.length; k++) { const v = (a[k] - 128) / 128; q += v * v; }
  cb.w.style.setProperty('--vn', Math.min(1, Math.sqrt(q / a.length) * 4).toFixed(3));
  if (!cb.w.isConnected) { vozNeuralParar(); return; }
  VOZN.raf = requestAnimationFrame(vozNLoop);
}
function vozNParaLoop() { cancelAnimationFrame(VOZN.raf); const w = document.querySelector('.bas-voz'); if (w) w.style.setProperty('--vn', '0'); }
function vozNeuralParar() {
  if (VOZN.w) VOZN.w.postMessage({ tipo: 'parar' }); VOZN.id++; VOZN.fila.forEach((s) => { try { s.onended = null; s.stop(); } catch (e) { /* já parou */ } }); VOZN.fila = [];
  const cb = VOZN.cb; VOZN.cb = null; vozNParaLoop(); if (cb) { cb.pausa.disabled = true; if (cb.w.dataset.est === 'falando' || cb.w.dataset.est === 'pensando') cb.est('parado', 'Toque no Cifrão para continuar'); }
}

/* ---------- cartões visuais da resposta (embaixo do texto falado) ---------- */
// o tipo vem da intenção local da pergunta (E.iaIntencao) e das ações propostas
const VOZV_TIPO = { gastos: 'areas', fixos: 'areas', dicas: 'areas', orcamento: 'orc', posso_gastar: 'orc', previsao: 'orc', compra: 'orc', aporte: 'meta', meta: 'meta', investir: 'meta', sobra: 'mes', resumo: 'mes', renda: 'mes', mes_passado: 'mes', ano: 'mes', objetivos: 'sonho' };
const VOZV_FORMA = { meta: 'seta', mes: 'moeda', sonho: 'moeda', anotar_entrada: 'mais', anotar_aporte: 'seta', anotar_gasto: 'moeda' };
const vozVAnel = (f, cor) => { const r = 34; const L = 2 * Math.PI * r; return `<svg class="vzv-anel" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="f"/><circle cx="40" cy="40" r="${r}" class="v" style="--L:${L.toFixed(1)};--o:${(L * (1 - Math.max(0, Math.min(1, f)))).toFixed(1)};${cor ? `stroke:${cor}` : ''}"/></svg><b class="vzv-anel-p">${pct(Math.max(0, f))}</b>`; };
function vozVisualHtml(m) {
  if (m.rel && typeof iaRelHtml === 'function') return `<div class="vzv vzv-rel">${iaRelHtml(m, VOZV.i, true)}</div>`; // relatório da IA: o cartão grande
  if (m.acoes && m.acoes.length && typeof iaxCartoesHtml === 'function') return `<div class="vzv vzv-acao">${iaxCartoesHtml(m, VOZV.i)}</div>`;
  if (m.vis && typeof iaVisHtml === 'function') return `<div class="vzv vzv-vis">${iaVisHtml(m, VOZV.i, true)}</div>`; // visual que a IA montou
  const tipo = VOZV_TIPO[m.r && m.r.id]; if (!tipo || !S.C) return '';
  const C = S.C; const mm = S.year === NOW_Y ? NOW_M : S.mes;
  try {
    if (tipo === 'areas') {
      const g = Object.entries(E.gastosAreaMes(S.plan, E.carryItems(S.plans, S.year), mm)).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 5); if (!g.length) return '';
      const max = g[0][1]; return `<div class="vzv"><small class="vzv-k">Onde foi o dinheiro em ${MES_LONGO[mm]}</small><ul class="vzv-bars">${g.map(([a, v], k) => `<li style="--k:${k};--f:${(v / max).toFixed(3)}"><span>${esc(a)}</span><i></i><b>${brl0(v)}</b></li>`).join('')}</ul></div>`;
    }
    if (tipo === 'orc') {
      const gasto = +C.despesas[mm] || 0; const orc = +C.orcamento[mm] || 0; if (!orc) return '';
      const f = gasto / orc; const dia = new Date().getDate() / new Date(NOW_Y, mm + 1, 0).getDate();
      return `<div class="vzv"><small class="vzv-k">Orçamento de ${MES_LONGO[mm]}</small><div class="vzv-orc${f > 1 ? ' passou' : f > 0.8 ? ' perto' : ''}" style="--f:${Math.min(1, f).toFixed(3)};--d:${Math.min(1, dia).toFixed(3)}"><i></i><em aria-hidden="true"></em></div>
        <p class="vzv-orc-l"><b>${brl0(gasto)}</b><span>de ${brl0(orc)} · ${f > 1 ? `passou ${brl0(gasto - orc)}` : `faltam ${brl0(orc - gasto)}`}</span></p></div>`;
    }
    if (tipo === 'meta') {
      const D = E.disponivelAporte({ C, mes: mm, metaMes: C.metaAporteMes }); if (!(D.meta > 0)) return '';
      return `<div class="vzv vzv-l">${vozVAnel(D.aportado / D.meta)}<div><small class="vzv-k">Meta de investir em ${MES_LONGO[mm]}</small><b class="vzv-g">${brl0(D.aportado)}</b><span class="vzv-s">de ${brl0(D.meta)}</span></div></div>`;
    }
    if (tipo === 'mes') {
      const ent = +C.receita[mm] || 0; const sai = +C.despesas[mm] || 0; const max = Math.max(ent, sai, 1);
      return `<div class="vzv"><small class="vzv-k">${MES_LONGO[mm].replace(/^./, (c) => c.toUpperCase())} até agora</small><ul class="vzv-bars vzv-2"><li class="ent" style="--k:0;--f:${(ent / max).toFixed(3)}"><span>Entrou</span><i></i><b>${brl0(ent)}</b></li><li class="sai" style="--k:1;--f:${(sai / max).toFixed(3)}"><span>Saiu</span><i></i><b>${brl0(sai)}</b></li></ul>
        <p class="vzv-sobra ${ent - sai >= 0 ? 'pos' : 'neg'}">${ent - sai >= 0 ? 'Sobra' : 'Faltou'} <b>${brl0(Math.abs(ent - sai))}</b></p></div>`;
    }
    if (tipo === 'sonho') {
      const g = typeof objFoco === 'function' ? objFoco(objAnalise()) : null; if (!g) return '';
      return `<div class="vzv vzv-l">${vozVAnel(g.progresso || 0, '#FFC94D')}<div><small class="vzv-k">Seu sonho</small><b class="vzv-g">${esc(objNomeDe(g))}</b><span class="vzv-s">${brl0(g.saldo || 0)} de ${brl0(g.valor || 0)}</span></div></div>`;
    }
  } catch (e) { return ''; }
  return '';
}
const VOZV = { i: -1 };
// chamada pela conversa por voz quando a resposta chega: desenha o cartão e o Cifrão muda de forma conforme o assunto
function vozVisual(w, m, i) {
  const c = w.querySelector('.bas-voz-c'); if (!c) return; VOZV.i = i; let v = c.querySelector('[data-voz-vis]');
  if (!v) { v = document.createElement('div'); v.className = 'vzv-box'; v.dataset.vozVis = ''; const t = c.querySelector('[data-voz-t]'); t.after(v); }
  const loc = !m.ai && typeof iaVisHtml === 'function' ? iaVisHtml(m, i, true) : ''; // resposta local: kpis com os números dela
  v.innerHTML = vozVisualHtml(m) || (loc ? `<div class="vzv vzv-vis">${loc}</div>` : m.ai && typeof iaVozChipsHtml === 'function' ? iaVozChipsHtml(m) : ''); // nuvem sem visual: os valores viram fichas
  if (typeof iaRelConta === 'function') iaRelConta(v);
  // o cartão do trecho falado acende: segue as palavras que a fala marca como lidas (voz neural ou do aparelho)
  if (VOZV.obs) VOZV.obs.disconnect(); const tx = c.querySelector('[data-voz-t]');
  if (tx && typeof iaVisAcende === 'function' && v.querySelector('.iav[data-c0]') && typeof MutationObserver === 'function') { let pend = 0;
    VOZV.obs = new MutationObserver(() => { if (pend) return; pend = requestAnimationFrame(() => { pend = 0; const ls = tx.querySelectorAll('.lido'); const u = ls[ls.length - 1]; if (u) iaVisAcende(v, +u.dataset.c || 0); }); });
    VOZV.obs.observe(tx, { subtree: true, attributes: true, attributeFilter: ['class'] }); }
  const h = w.querySelector('.bas-voz-orb .cifrao'); if (!h || !window.Cifrao) return;
  const fm = VOZV_FORMA[(m.acoes && m.acoes[0] && m.acoes[0].tipo) || VOZV_TIPO[m.r && m.r.id]];
  if (fm) { window.Cifrao.forma(h, fm); setTimeout(() => { if (h.isConnected) window.Cifrao.forma(h, 'cifrao'); }, 4200); }
}
// depois de confirmar ou cancelar uma ação, o cartão da conversa por voz se atualiza
function vozVisualRefaz() { const w = document.querySelector('.bas-voz'); const m = w && VOZV.i >= 0 && iaEstado().msgs[VOZV.i]; if (m) vozVisual(w, m, VOZV.i); }
// a voz natural ainda está carregando: espera até 25 s (o Cifrão fica "pensando") em vez de cair na voz robótica do aparelho
function vozNeuralAguardar(depois, est) {
  if (!vozNLigada() || VOZN.estado !== 'baixando') return false;
  const t0 = Date.now(); est('pensando', 'Preparando a voz do Cifrão…');
  const olha = () => { if (VOZN.estado === 'baixando' && Date.now() - t0 < 25000) { setTimeout(olha, 200); return; } depois(); };
  setTimeout(olha, 200); return true;
}
// voz já baixada antes: prepara em segundo plano logo depois que o app abre, assim a primeira fala já sai com ela
setTimeout(() => {
  try { if (!window.caches || !vozNLigada() || VOZN.estado !== 'nada') return;
    caches.open('cifrao-voz-v1').then((c) => c.match('https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx'))
      .then((r) => { if (r && VOZN.estado === 'nada') vozNeuralPreparar(); }).catch(() => {}); } catch (e) { /* sem Cache */ }
}, 4000);

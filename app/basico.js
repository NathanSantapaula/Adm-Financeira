/* Modo Básico: a segunda interface, para quem está começando. Jeito de app de celular: números grandes, pouco texto,
   uma ação principal por tela e abas embaixo; no computador fica centralizado como um app.
   Mesmos dados (S.plan, S.profile) e os mesmos cálculos do engine; só a tela muda. Escolha por aparelho em localStorage fp:interface (padrão: o App no celular, basCelular; nos outros aparelhos, S.profile.interface).
   Telas próprias, sem modais nem painéis do Completo: cada aba, detalhe e formulário entra numa pilha (S.basPilha),
   com voltar pelo botão, pelo Esc e pelo voltar do celular (history). */
'use strict';
const BASICO_PAGANTES = true; // pagantes podem trocar para o Básico; false = Básico só no plano gratuito
// a versão escolhida vale só neste aparelho (localStorage); sem escolha aqui, vale a do perfil. Trocar no celular não muda o computador.
const basUiLocal = () => { try { const v = localStorage.getItem('fp:interface'); return v === 'basico' || v === 'completo' ? v : null; } catch (e) { return null; } };
// celular (toque e tela pequena, deitado ou em pé): sem escolha guardada no próprio aparelho, abre o App; a escolha do perfil (que o computador grava) não leva o celular ao SaaS
const basCelular = () => { try { return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600; } catch (e) { return false; } };
const basSaasLiberado = () => planoAtual() === 'completo' || !!S.isAdmin; // o SaaS é do plano Assessoria (e do consultor)
const basTelaPequena = () => { try { return basCelular() || Math.min(screen.width, screen.height) < 600 || innerWidth < 700; } catch (e) { return false; } };
const basInterface = () => !basSaasLiberado() || basTelaPequena() ? 'basico' : E.interfaceDe(planoAtual(), basUiLocal() || (basCelular() ? 'basico' : S.profile.interface), BASICO_PAGANTES);
// abaixo de 901 px o SaaS não tem versão encolhida: abre o App
const modoBasico = () => S.screen === 'app' && !!S.profile && (basInterface() === 'basico' || innerWidth < 901);
try { matchMedia('(max-width: 900px)').addEventListener('change', () => { if (S.screen === 'app') render(); }); } catch (e) { /* navegador antigo */ }
const basEscolhe = () => BASICO_PAGANTES && basSaasLiberado() && !basTelaPequena(); // pagantes e o consultor escolhem a versão
const BAS_NOMES = { basico: 'App', completo: 'SaaS' }; // nomes das duas versões na tela: App (celular; no gratuito, a única) e SaaS (o painel completo)
// seletor dos dois modos: Perfil do Simples, página inicial do painel e o Mais do celular no Completo (só para quem pode escolher)
const basTrocaHtml = () => { const v = basInterface();
  return `<div class="seg bas-troca" role="group" aria-label="Versão do Cifrão">${['basico', 'completo'].map((k) => `<button${v === k ? ' class="on"' : ''} data-act="bas-ui" data-v="${k}" aria-pressed="${v === k}">${BAS_NOMES[k]}</button>`).join('')}</div>`; };
const BAS_ABAS = [['inicio', 'Início', I.geral], ['gastos', 'Gastos', I.despesas], ['investir', 'Patrimônio', I.inv]]; // o Perfil abre pelo botão do topo (`basEuBtn`)
const BAS_FORMS = new Set(['gasto', 'conta', 'conta-f', 'entrada', 'aporte', 'ativo-ed', 'meta', 'objetivo', 'perfil', 'provento', 'limite', 'alvos', 'ponto', 'excluir', 'retro', 'importar', 'sonho-novo', 'sonho-ed', 'voz']); // telas de formulário (e a retrospectiva, em tela cheia) escondem as abas
const BAS_AREAS = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Compras', 'Contas', 'Educação'];
const I_VOLTA = ic('<path d="m15 6-6 6 6 6"/>');

// textos de orientação nas três vozes (os números nunca mudam com a voz)
const BAS_VOZ = {
  consultivo: { bas_disp_sim: 'É o que sobrou e ainda não foi investido.', bas_disp_tudo: 'Tudo o que sobrou já foi investido.', bas_disp_nao: 'Este mês ainda não sobrou dinheiro para investir.',
    bas_vazio: 'Anote o que entrou e o que saiu, e o painel mostra quanto sobra.', bas_meta_ok: 'Meta do mês cumprida.', bas_meta_sem: 'Defina quanto quer investir por mês.',
    bas_saude_bom: 'Base sólida: reserva, sobra e contas em equilíbrio.', bas_saude_med: 'Bom caminho. Um ou dois pontos merecem atenção.', bas_saude_baixo: 'Vale fortalecer a base antes de acelerar.' },
  direto: { bas_disp_sim: 'Sobrou e não foi investido.', bas_disp_tudo: 'Sobra toda investida.', bas_disp_nao: 'Sem sobra este mês.',
    bas_vazio: 'Anote entradas e gastos para ver a sobra.', bas_meta_ok: 'Meta cumprida.', bas_meta_sem: 'Defina a meta mensal.',
    bas_saude_bom: 'Tudo em ordem.', bas_saude_med: 'Ajuste os pontos em amarelo.', bas_saude_baixo: 'Fortaleça a base primeiro.' },
  acolhedor: { bas_disp_sim: 'Esse dinheiro sobrou e está esperando por você.', bas_disp_tudo: 'Tudo o que sobrou já está investido. Que orgulho!', bas_disp_nao: 'Este mês ainda não sobrou. Tudo bem, um passo de cada vez.',
    bas_vazio: 'Vamos começar? Anote o que entrou e o que saiu e eu mostro quanto sobra.', bas_meta_ok: 'Você cumpriu a meta do mês!', bas_meta_sem: 'Que tal definir quanto quer investir por mês?',
    bas_saude_bom: 'Que orgulho! Sua base está firme.', bas_saude_med: 'Você está indo bem. Dá para cuidar de um ou dois pontos.', bas_saude_baixo: 'Sem pressa: vamos fortalecer a base juntos.' },
};
Object.keys(BAS_VOZ).forEach((t) => { if (VOZ[t]) Object.assign(VOZ[t], BAS_VOZ[t]); });

/* ---------- peças de tela ---------- */
// o consultor abre Clientes pelo fim do Perfil (tela `clientes`)
const basAbas = () => BAS_ABAS;
const basAba = () => (S.basAba === 'perfil' || basAbas().some((a) => a[0] === S.basAba) ? S.basAba : 'inicio');
const basPilha = () => (S.basPilha = S.basPilha || []);
const basTopoPilha = () => basPilha()[basPilha().length - 1] || null;
const basBarra = (f) => `<span class="bas-bar" aria-hidden="true"><i style="width:${(Math.max(0, Math.min(1, f)) * 100).toFixed(1)}%"></i></span>`;
const basCard = (corpo, cls) => `<section class="card bas-card${cls ? ' ' + cls : ''}">${corpo}</section>`;
const basVazio = (t) => `<p class="bas-vz">${t}</p>`;
const basIr = (t, o) => `data-act="bas-abrir" data-t="${t}"${['id', 'area', 'op', 'modo', 'mes', 'ativo'].map((k) => (o && o[k] != null ? ` data-${k}="${esc(o[k])}"` : '')).join('')}`;
const basLinha = (attrs, esq, dir) => `<li><button ${attrs}>${esq}${dir}${I.chev}</button></li>`;
const basNome = (b, s) => `<span class="bas-n"><b>${b}</b>${s ? `<small>${s}</small>` : ''}</span>`;
const basHoje = () => { const h = new Date(); return `${h.getFullYear()}-${pad2(h.getMonth() + 1)}-${pad2(h.getDate())}`; };
const basDataMes = (m) => { const h = new Date(); return S.year === h.getFullYear() && m === h.getMonth() ? basHoje() : `${S.year}-${pad2(m + 1)}-01`; };
const basMesDe = (data) => { const d = E.parseDataISO(data); return d && d.ano === S.year ? d.mes : null; };
const basLancMes = (m) => S.plan.lancamentos.filter((l) => basMesDe(l.data) === m).sort((x, y) => (x.data < y.data ? 1 : -1));
// categoria do gasto (fixa ou variável) no formato do Completo; cria as padrões se o plano não tiver nenhuma
function basCat(fixa) {
  const c = S.plan.catsDesp; if (!c.length) c.push(...E.CATS_DESP());
  const f = c.find((x) => x.id === 'fixa' || E.norm(x.nome).includes('fixa')); const v = c.find((x) => x !== f);
  return ((fixa ? f : v) || c[0]).id;
}

// abas embaixo (no lugar do menu lateral e do topo); some nas telas de formulário
function basicoBarra() {
  $('#topo').innerHTML = ''; $('#side').innerHTML = ''; const a = basAba(); const t = basTopoPilha();
  document.body.dataset.basFolha = t && BAS_FORMS.has(t.t) ? '1' : ''; document.body.dataset.basPerfil = a === 'perfil' && !t ? '1' : ''; document.body.dataset.basIa = t && (t.t === 'duvidas' || t.t === 'avisos-tela' || t.t === 'gasto-ver' || t.t === 'cartao-estilo' || t.t === 'cartao-novo' || t.t === 'cartao' || t.t === 'ativo' || t.t === 'cartoes' || (t.t === 'ia' && (S.basIaAba || 'conversa') === 'conversa')) ? '1' : '';
  const av = basAvisosNovos();
  // botão da IA separado, à esquerda da barra: fundo em degradê neon que se move, vidro por cima e o Cifrão dentro
  $('#tabbar').innerHTML = `<button class="bas-ia-fab${av ? ' alerta' : ''}${document.querySelector('.bas-cif-solto') ? ' vazia' : ''}" data-act="bas-ia-fab" aria-label="Assistente${av ? `: ${av} avisos novos` : ''}. Segure e arraste para o Cifrão andar pela tela."><span class="cifrao" aria-hidden="true"></span></button><div class="bas-tabs"><span class="bas-tab-lente" aria-hidden="true"></span>${basAbas().map(([k, l, i]) => `<button data-act="bas-aba" data-v="${k}" ${a === k ? 'aria-current="page"' : ''}>${i}<span>${l}</span></button>`).join('')}</div>`;
  basTabLigar(); basIaFabLigar();
}
// barra de abas no jeito do iPhone: uma lente de vidro marca a aba e desliza até a nova; segurar e arrastar leva a lente
// com o dedo (ou o mouse) por cima das abas, e soltar abre a aba onde ela parou
// botão da IA: tocar abre o assistente; segurar faz o Cifrão sair da bolinha e passear pela tela,
// parando nas informações e comentando cada uma; tocar nele (ou na bolinha) o leva de volta
function basIaFabLigar() {
  const b = document.querySelector('.bas-ia-fab'); if (!b || b.dataset.lig) return; b.dataset.lig = '1'; let t = 0;
  // na bolinha ele só pisca e mexe os olhos: sem os gestos grandes da landing
  // na bolinha ele fica quieto (sem seguir o dedo nem fazer gestos) e só pisca de vez em quando; as animações são do Cifrão solto
  const calmo = () => { const h = b.querySelector('.cifrao'); if (!h || !h.cifrao) { setTimeout(calmo, 120); return; } h.cifrao.gestoEm = 1e15; h.setAttribute('data-scroll-suspended', '');
    const pisca = () => { if (!h.isConnected) return; h.removeAttribute('data-scroll-suspended'); h.cifrao.tocar('wink'); setTimeout(() => { if (h.isConnected) h.setAttribute('data-scroll-suspended', ''); }, 1000); setTimeout(pisca, 6000 + Math.random() * 4000); };
    setTimeout(pisca, 3000); }; calmo();
  b.addEventListener('pointerdown', (e) => { clearTimeout(t); const id = e.pointerId; t = setTimeout(() => { S.basCifPasseio = true; if (typeof basVibra === 'function') basVibra(20); b.setPointerCapture(id); basCifSolta(b, e.clientX, e.clientY, b); }, 420); });
  ['pointerup', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => clearTimeout(t)));
  b.addEventListener('contextmenu', (e) => e.preventDefault());
}
// rotas do Cifrão solto, como a trilha da landing: em cada aba ele tem pousos (em cima de um bloco, numa fração da largura);
// ao rolar ele corre aos saltos para o pouso mais perto do meio da tela; ao trocar de aba, sorteia uma das 3 rotas dela.
// Arrastar com o dedo o tira da rota; rolar ou trocar de aba o devolve a ela.
const BAS_CIF_ROTAS = {
  inicio: [
    [['.bas-noite-v', .88], ['.bas-var', .06], ['.card.bas-sonho', .9], ['.card.bas-w-hist', .12], ['.card.bas-w-aviso', .88], ['.card.bas-w-ano', .15], ['.card.bas-w-res', .85], ['.bas-org', .2]],
    [['.bas-eu-m', .95], ['.bas-var', .94], ['.bas-sec .card', .1, 0], ['.bas-sec .card', .9, 1], ['.bas-sec .card', .1, 2], ['.bas-sec .card', .9, 3], ['.bas-sec .card', .1, 4], ['.bas-sec .card', .9, 5]],
    [['.bas-noite-v', .5], ['.card.bas-sonho', .5], ['.card.bas-card', .8], ['.card.bas-w-hist', .5], ['.card.bas-w-ano', .85], ['.card.bas-w-res', .2], ['.bas-org', .5]],
  ],
  gastos: [
    [['.bas-gt-v', .9], ['.bas-gt-pilha', .1], ['.bas-gt-acoes', .5], ['.bas-onde-a', .9, 0], ['.bas-onde-a', .1, 2], ['.bas-onde-a', .9, 4], ['.card.bas-ult', .15], ['.bas-ult-l', .85, 3]],
    [['.bas-gt-pilha', .9], ['.bas-en-bt', .2], ['.bas-onde-a', .1, 1], ['.bas-onde-a', .9, 3], ['.bas-lim-add', .5], ['.bas-ult-l', .9, 1], ['.bas-ult-l', .1, 3]],
    [['.bas-gt-v', .1], ['.bas-inv-pl', .7], ['.bas-onde-a', .5, 0], ['.bas-onde-a', .85, 2], ['.bas-onde-a', .15, 5], ['.card.bas-ult', .85], ['.bas-ult-l', .5, 4]],
  ],
  investir: [
    [['.bas-ev-v', .9], ['.bas-ev-g', .2], ['.bas-pt-acoes', .85], ['.card.bas-qa', .1], ['.card.bas-dp', .9], ['.bas-sn-c', .15], ['.bas-ativ li', .9, 0], ['.bas-ativ li', .1, 2]],
    [['.bas-ev-h', .15], ['.bas-ev-g', .85], ['.bas-inv-pl', .5], ['.bas-qa-c', .9], ['.card.bas-dp', .1], ['.bas-sn-c', .5], ['.bas-ativ li', .1, 1]],
    [['.bas-ev-g', .5], ['.bas-circ', .5, 0], ['.card.bas-qa', .85], ['.bas-dp-v', .2], ['.bas-comp', .85], ['.bas-ativ li', .5, 2]],
  ],
  perfil: [
    [['.bas-pf-eu', .85], ['.card.bas-pf-l', .1], ['.bas-pf-li', .9, 2], ['.bas-pf-tema', .15], ['.bas-ativ', .85], ['.bas-sair', .5]],
    [['.bas-pf-eu', .15], ['.bas-pf-li', .9, 0], ['.bas-pf-li', .1, 3], ['.bas-pf-tema', .85], ['.bas-ativ li', .1, 1]],
    [['.bas-pf-h', .5], ['.card.bas-pf-l', .85], ['.bas-pf-tema', .5], ['.bas-ativ li', .9, 2], ['.bas-sair', .2]],
  ],
};
// telas sem rota própria: os cartões da tela, alternando os lados (cada uma das 3 rotas com um jeito)
const BAS_CIF_GERAL = [[.88, .12], [.12, .88], [.5, .85, .15]];
const basCifChave = () => { const t = S.basPilha && S.basPilha.length ? S.basPilha[S.basPilha.length - 1].t : ''; return t || S.basAba || 'inicio'; };
function basCifPousos(chave, n) {
  const rota = BAS_CIF_ROTAS[chave];
  const lista = rota ? rota[n % rota.length].map(([s, fx, i]) => [document.querySelectorAll('#view ' + s)[i || 0], fx])
    : [...document.querySelectorAll('#view .card, #view .bas-sec')].filter((e) => !e.parentElement.closest('.card')).slice(0, 14).map((e, i) => { const g = BAS_CIF_GERAL[n % 3]; return [e, g[i % g.length]]; });
  const vistos = new Set(); return lista.filter(([e]) => e && !vistos.has(e) && vistos.add(e) && e.getClientRects().length);
}
function basCifSolta(fab, px, py, alvo) {
  if (document.querySelector('.bas-cif-solto')) return;
  const w = document.createElement('div'); w.className = 'bas-cif-solto'; w.innerHTML = '<span class="bas-cif-corpo"><span class="cifrao"></span></span>'; document.body.appendChild(w); fab.classList.add('vazia');
  const corpo = w.querySelector('.bas-cif-corpo'); const T = 64; const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rf = fab.getBoundingClientRect(); let x = rf.left + rf.width / 2 - T / 2, y = rf.top + rf.height / 2 - T / 2; let tx = px - T / 2, ty = py - T - 18; let solto = true, vivo = true, andava = false;
  // rota: livre = fora dela (arrastado); pouso = índice do pouso atual; corrida = salto em andamento até um pouso novo
  let livre = true, chave = basCifChave(), rotaN = Math.floor(Math.random() * 3), pouso = -1, corrida = null, voltando = false;
  const lim = () => { tx = Math.max(4, Math.min(innerWidth - T - 4, tx)); ty = Math.max(4, Math.min(innerHeight - T - 4, ty)); };
  const cif = () => w.querySelector('.cifrao');
  const naRota = () => { if (voltando) return; livre = false; };
  const alvoRota = () => {
    const k = basCifChave(); if (k !== chave) { chave = k; rotaN = (rotaN + 1 + Math.floor(Math.random() * 2)) % 3; pouso = -1; livre = false; }
    const ps = basCifPousos(chave, rotaN); if (!ps.length) return null; const vh = innerHeight; const foco = vh * 0.38;
    let best = -1, bd = 1e9; ps.forEach(([e], i) => { const r = e.getBoundingClientRect(); const d = Math.abs(r.top - foco) + (r.top < 70 || r.top > vh - 170 ? 600 : 0); if (d < bd) { bd = d; best = i; } });
    const [e, fx] = ps[best]; const r = e.getBoundingClientRect();
    return { i: best, x: Math.max(4, Math.min(innerWidth - T - 4, r.left + r.width * fx - T / 2)), y: Math.max(56, Math.min(vh - T - 96, r.top - T + 10)) };
  };
  const pose = (dir, s) => { const h = cif(); if (!h) return; h.setAttribute('data-scroll-suspended', ''); h.dispatchEvent(new CustomEvent('cifrao:scroll-pose', { detail: {
    yaw: dir * .5, rotation: dir * .12, scaleY: 1 + .12 * s - .06 * (1 - s), scaleX: 1 - .07 * s + .05 * (1 - s), gazeX: dir * .045, gazeY: .02, eyeScaleX: 1.18 } })); };
  const passo = () => {
    if (!vivo) return;
    if (!livre && !solto && !voltando) {
      const a = alvoRota();
      if (a) { if (a.i !== pouso || !corrida && Math.hypot(a.x - x, a.y - y) > 90) { pouso = a.i; corrida = { x0: x, y0: y, d: Math.max(1, Math.hypot(a.x - x, a.y - y)) }; } tx = a.x; ty = a.y; }
    }
    let hop = 0;
    if (corrida && !livre && !solto) {
      const dx = tx - x, dy = ty - y; const rem = Math.hypot(dx, dy); x += dx * 0.11; y += dy * 0.11;
      const p = Math.min(1, Math.max(0, 1 - rem / corrida.d)); const n = Math.max(1, Math.min(5, Math.round(corrida.d / 110)));
      const s = Math.abs(Math.sin(Math.PI * p * n)); hop = calmo ? 0 : s * Math.min(34, corrida.d * 0.3) * (1 - p * 0.35);
      if (!calmo) pose(Math.sign(dx) || 1, s);
      if (rem < 1.5) { corrida = null; x = tx; y = ty; const h = cif(); if (h) { h.removeAttribute('data-scroll-suspended'); h.dispatchEvent(new CustomEvent('cifrao:scroll-pose', { detail: {} })); } basCifSob(w, x + T / 2, y + T + 8); }
    } else if (!livre && !solto && !voltando) { x = tx; y = ty; } // pousado: grudado no bloco enquanto a página rola
    else { const dx = tx - x, dy = ty - y; x += dx * 0.16; y += dy * 0.16; }
    const mov = !!corrida || (livre || solto || voltando) && Math.hypot(tx - x, ty - y) > 1.5;
    if (andava && !mov && (livre || solto)) basCifSob(w, x + T / 2, y + T + 8); andava = mov;
    w.classList.toggle('andando', mov && !corrida); /* nunca espelha: o cifrão invertido não é o símbolo */ w.style.transform = `translate(${x}px, ${y - hop}px)`; requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
  addEventListener('scroll', naRota, { passive: true });
  // segue o dedo enquanto ele estiver na tela (primeiro o toque longo da bolinha, depois arrastando o próprio Cifrão)
  const segue = (e) => { if (!solto) return; tx = e.clientX - T / 2; ty = e.clientY - T - 18; lim(); };
  const larga = () => { solto = false; };
  alvo.addEventListener('pointermove', segue); alvo.addEventListener('pointerup', larga, { once: true }); alvo.addEventListener('pointercancel', larga, { once: true });
  let x0 = 0, y0 = 0, arrastou = false;
  w.addEventListener('pointerdown', (e) => { w.setPointerCapture(e.pointerId); solto = true; arrastou = false; x0 = e.clientX; y0 = e.clientY; });
  w.addEventListener('pointermove', (e) => { if (!solto) return; if (Math.hypot(e.clientX - x0, e.clientY - y0) > 6) { arrastou = true; livre = true; corrida = null; const h = cif(); if (h) h.removeAttribute('data-scroll-suspended'); } segue(e); });
  w.addEventListener('pointerup', () => { solto = false; if (!arrastou) volta(); });
  S.basCifEm = Date.now(); S.basCifVolta = (destino) => volta(destino);
  const volta = (destino) => { voltando = true; corrida = null; removeEventListener('scroll', naRota); const f = destino || document.querySelector('.bas-ia-fab') || fab; const r = f.getBoundingClientRect(); tx = r.left + r.width / 2 - T / 2; ty = r.top + r.height / 2 - T / 2; setTimeout(() => { vivo = false; w.remove(); document.querySelectorAll('.bas-ia-fab').forEach((x) => x.classList.remove('vazia')); document.querySelectorAll('.bas-iax-orb.espera').forEach((x) => x.classList.remove('espera')); S.basCifPasseio = false; S.basCifVolta = null; }, 650); };
  // o toque que solta o toque longo não abre o assistente (S.basCifEm)
}
function basTabLigar() {
  { const b = document.querySelector('#tabbar .bas-tabs'); if (b && b.dataset.lig) return; }
  const bar = document.querySelector('#tabbar .bas-tabs'); if (!bar) return; const lente = bar.querySelector('.bas-tab-lente'); const bts = [...bar.querySelectorAll('button')];
  const pos = (b) => ({ x: b.offsetLeft, w: b.offsetWidth });
  const por = (x, w, anima) => { lente.style.transition = anima ? '' : 'none'; lente.style.width = `${w}px`; lente.style.transform = `translateX(${x}px)`; };
  const atual = bts.find((b) => b.hasAttribute('aria-current')) || bts[0]; const p = pos(atual);
  if (!p.w) { S.basTabX = null; return; } // barra escondida (formulário ou globo): mede no próximo desenho
  // a lente sai de onde estava antes do desenho e desliza até a aba nova
  if (S.basTabX != null && S.basTabX !== p.x) { por(S.basTabX, S.basTabW || p.w, false); bar.classList.add('voa'); requestAnimationFrame(() => requestAnimationFrame(() => por(p.x, p.w, true))); setTimeout(() => bar.classList.remove('voa'), 380); } else por(p.x, p.w, false);
  S.basTabX = p.x; S.basTabW = p.w; bar.dataset.lig = '1';
  let x0 = null, ox = 0, arr = false;
  const perto = (cx) => bts.reduce((m, b) => (Math.abs(b.offsetLeft + b.offsetWidth / 2 - cx) < Math.abs(m.offsetLeft + m.offsetWidth / 2 - cx) ? b : m));
  bar.addEventListener('pointerdown', (e) => { x0 = e.clientX; ox = bar.getBoundingClientRect().left; arr = false; bar.classList.add('aperta'); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => bar.addEventListener(t, () => bar.classList.remove('aperta')));
  bar.addEventListener('pointermove', (e) => { if (x0 == null) return; if (!arr && Math.abs(e.clientX - x0) > 6) { arr = true; bar.classList.add('arrasta'); bar.setPointerCapture(e.pointerId); }
    if (!arr) return; const cx = Math.max(p.w / 2, Math.min(bar.clientWidth - p.w / 2, e.clientX - ox)); por(cx - p.w / 2, p.w, false);
    const b = perto(cx); bts.forEach((x) => x.classList.toggle('sob', x === b)); });
  const solta = (e) => { if (x0 == null) return; x0 = null; if (!arr) return; bar.classList.remove('arrasta'); bts.forEach((x) => x.classList.remove('sob'));
    const b = perto(e.clientX - ox); const q = pos(b); S.basTabX = parseFloat(lente.style.transform.slice(11)) || q.x; por(q.x, q.w, true);
    if (b !== atual) { S.basTabX = q.x; b.click(); } };
  bar.addEventListener('pointerup', solta); bar.addEventListener('pointercancel', solta);
  bar.addEventListener('click', (e) => { if (arr) { arr = false; if (!e.isTrusted) return; e.stopPropagation(); e.preventDefault(); } }, true);
}
// cabeçalho das telas empilhadas: voltar (ou cancelar, nos formulários) e o título grande
const basNav = (titulo, form, extra) => `<header class="bas-nav"><button type="button" class="bas-voltar" data-act="bas-voltar">${form ? 'Cancelar' : I_VOLTA + '<span>Voltar</span>'}</button>${form ? '' : `<span class="bas-nav-r">${extra || ''}${olhoHtml()}</span>`}</header><h1 class="bas-tit">${titulo}</h1>`;
const basDet = (titulo, corpo, extra) => `${basNav(titulo, false, extra)}${corpo}`;
function basForm(t, titulo, corpo, o) {
  o = o || {};
  return `<form class="bas-form" data-form="bas" data-t="${t}" novalidate autocomplete="off">${basNav(titulo, true)}${corpo}
    <div class="bas-salvar"><p class="bas-err" role="alert" hidden></p><button class="btn primary lg bas-cta" type="submit">${o.ok || 'Salvar'}</button>${o.excluir ? `<button type="button" class="btn lg bas-cta bas-del" data-act="bas-excluir">${o.excluir}</button>` : ''}</div></form>`;
}
const basValor = (nome, v, rot) => `<label class="bas-vl"><span>${rot}</span><span class="bas-vl-in"><i aria-hidden="true">R$</i><input name="${nome}" inputmode="decimal" placeholder="0,00" value="${v ? esc(nf.format(v)) : ''}" data-foco></span></label>`;
const basCampo = (nome, rot, v, extra) => `<label class="bas-fl"><span>${rot}</span><input name="${nome}" value="${esc(v == null ? '' : v)}" ${extra || ''}></label>`;
const basChips = (nome, ops, sel, rot) => `<fieldset class="bas-fs"><legend>${rot}</legend><div class="bas-chips">${ops.map(([v, l]) => `<label class="bas-chip"><input type="radio" name="${nome}" value="${esc(v)}" ${String(v) === String(sel) ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div></fieldset>`;
const basSw = (nome, rot, desc, on) => `<label class="bas-op bas-sw">${basNome(rot, desc)}<span class="wg-sw"><input type="checkbox" name="${nome}" ${on ? 'checked' : ''}><span></span></span></label>`;
const basSumiu = () => basDet('Não encontrado', basCard(basVazio('Este item não existe mais.')));

/* ---------- navegação: pilha de telas ligada ao histórico do navegador ---------- */
function basAbrir(t, o) {
  if (t === 'periodo') { basPeriodoPop(); return; }
  if (t === 'gasto-ver' && o && o.id) { basGastoPop(o.id, o.op === 'conta', o.modo); return; }
  if (document.querySelector('.bas-gp')) { document.querySelector('.bas-gp').remove(); }
  basPilha().push(Object.assign({ t, volta: window.scrollY }, o)); history.pushState({ bas: basPilha().length }, ''); basSom('toque');
  basTransicao(t === 'ia' ? 'ia' : t === 'cartao-estilo' ? 'cc' : 'vai', () => { render(); window.scrollTo(0, 0); const f = $('#view [data-foco]'); if (f && matchMedia('(pointer: coarse)').matches === false) f.focus({ preventScroll: true }); });
}
function basFechar() {
  const t = basPilha().pop(); basSom('volta'); basTransicao(t && t.t === 'ia' ? 'ia-sai' : t && t.t === 'cartao-estilo' ? 'cc' : 'volta', () => { render(); window.scrollTo(0, t ? t.volta || 0 : 0); });
  if (history.state && history.state.bas) history.back(); // o popstate vê a pilha já menor e não faz nada
}
function basLimpar() { const n = basPilha().length; S.basPilha = []; if (n && history.state && history.state.bas) history.go(-Math.min(n, history.state.bas)); }
window.addEventListener('popstate', (e) => { // voltar do celular ou do navegador
  const n = (e.state && e.state.bas) || 0; if (!modoBasico() || n >= basPilha().length) return;
  const t = basPilha()[n]; S.basPilha.length = n; if ($('#modal').open) $('#modal').close(); basSom('volta'); basTransicao('volta', () => { render(); window.scrollTo(0, t.volta || 0); });
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modoBasico() && basPilha().length && !$('#modal').open) { e.preventDefault(); basFechar(); } });
document.addEventListener('submit', (e) => { const f = e.target; if (f.dataset.form !== 'bas') return; e.preventDefault(); basSalvar(f); });

// telas sem valores pessoais: o olho de esconder valores não faz sentido nelas
const BAS_SEM_OLHO = ['config', 'config-ap', 'config-id', 'config-not', 'config-priv', 'config-seg', 'voz', 'perfil', 'privacidade', 'contato', 'duvidas', 'perfil-inv', 'sonho-ed'];
function basicoHtml() {
  if (!S.plan) return `<div class="bas">${basCard(`<h2 class="bas-h2">Vamos começar</h2><p class="bas-p">${voz('bas_vazio')}</p><button class="btn primary lg bas-cta" data-act="create-plan">Começar ${S.year || NOW_Y}</button>`)}</div>`;
  if (S.profile) basAplicarAp();
  const t = basTopoPilha();
  if (t) { const f = BAS_TELAS[t.t]; const h = f ? f(t) : basSumiu(); return `<div class="bas bas-tela" data-t="${t.t}">${BAS_SEM_OLHO.includes(t.t) ? h.replace(olhoHtml(), '') : h}</div>`; }
  const a = basAba(); const m = S.mes;
  return `<div class="bas" data-aba="${a}">${a === 'gastos' ? basGastos(m) : a === 'investir' ? basInvestir(m) : a === 'perfil' ? basPerfil() : basInicio(m)}</div>`;
}

/* ================= abas ================= */
// valor com os centavos mais apagados (como nos apps de banco); com o olho oculto, só a máscara
const basCent = (v) => { const t = brl(v); const k = t.lastIndexOf(','); return k < 0 ? esc(t) : `${esc(t.slice(0, k))}<span class="bas-cent">${esc(t.slice(k))}</span>`; };
const basIniciais = (t) => String(t || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const I_GASTO = ic('<path d="M12 19V5m0 0-5 5m5-5 5 5"/>');
const I_ENTRADA = ic('<path d="M12 5v14m0 0-5-5m5 5 5-5"/>');
const I_CONTA = ic('<path d="M7 3.5h10v17l-2.5-1.6L12 20.5l-2.5-1.6L7 20.5z"/><path d="M9.5 8h5M9.5 11.5h5"/>');
const I_PARC = ic('<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17M7.5 14.5h2M11.5 14.5h2"/>');
const I_META = ic('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>');
const I_RESGATE = ic('<path d="M12 4v11m0 0-4-4m4 4 4-4"/><path d="M5 19.5h14"/>');
const I_PROV = ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 14.3c.4.9 1.3 1.4 2.5 1.4 1.4 0 2.4-.7 2.4-1.7 0-2.3-4.9-1.2-4.9-3.5 0-1 1-1.7 2.4-1.7 1.1 0 2 .5 2.4 1.3"/>');
const I_CART = ic('<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z"/><path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15z"/>');
const I_TEMA = ic('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>');
const I_APLICAR = ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>');
const I_ORDEM = ic('<path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/>');
const basIrInv = (o) => (temRecurso('aporte_simples') ? basIr('aporte', o) : `data-act="upgrade" data-plano="${planoMinimoDe('aporte_simples')}"`);
const basRow = (attrs, ini, nome, sub, dir, cor) => `<li><button ${attrs}><span class="bas-ini" aria-hidden="true"${cor ? ` style="--bc:${cor}"` : ''}>${ini}</span>${basNome(nome, sub)}${dir}</button></li>`;
const basSecao = (titulo, link, corpo) => `<div class="bas-ch bas-ch-f"><h2 class="bas-h2">${titulo}</h2>${link || ''}</div>${corpo}`;
// barra de cima igual em todas as abas: o avatar e a saudação abrem o Perfil; à direita só o olho
const basTopo = () => `<header class="bas-noite-h bas-topo"><button class="bas-eu-m" data-act="bas-aba" data-v="perfil" aria-label="Meu perfil">${avatarHtml(S.profile)}<span class="bas-eu-t"><small>${esc(saudacaoHora())},</small><b>${esc((S.profile.apelido || S.profile.nome || '').split(/\s+/)[0] || 'você')}</b></span></button><span class="bas-noite-r"><button class="bell bas-cal-b" ${basIr('periodo')} aria-label="Período: ${esc(basJanRot())}, ${S.year}" title="Trocar o período">${typeof I_CAL !== 'undefined' ? I_CAL : ''}</button>${olhoHtml()}</span></header>`;
const basCab = () => basTopo();
// anel de progresso (SVG): f de 0 a 1, tamanho em px, conteúdo no centro
function basAnel(f, tam, centro, cls) {
  const r = tam / 2 - 9; const c = 2 * Math.PI * r; const v = Math.max(0, Math.min(1, f || 0));
  return `<div class="bas-anel${cls ? ' ' + cls : ''}" style="--t:${tam}px"><svg viewBox="0 0 ${tam} ${tam}" aria-hidden="true"><circle class="bas-anel-f" cx="${tam / 2}" cy="${tam / 2}" r="${r}"/><circle class="bas-anel-v" cx="${tam / 2}" cy="${tam / 2}" r="${r}" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" style="--c:${c.toFixed(1)}"/></svg><div class="bas-anel-c">${centro}</div></div>`;
}

/* ---- período (como no SaaS): um mês, um intervalo ou o ano todo, e o ano; vale para Início, Gastos e Investir ---- */
const basJan = () => { const p = S.basPer; return p && p.de != null && p.ate != null ? { de: p.de, ate: p.ate, n: p.ate - p.de + 1 } : { de: S.mes, ate: S.mes, n: 1 }; };
const basJanRot = () => { const j = basJan(); return j.n === 12 ? 'Ano todo' : j.n === 1 ? cap(MES_LONGO[j.de]) : `${MES[j.de]}–${MES[j.ate]}`; };
const basJanFrase = () => { const j = basJan(); return j.n === 12 ? `em ${S.year}` : j.n === 1 ? `em ${MES_LONGO[j.de]}` : `de ${MES_LONGO[j.de]} a ${MES_LONGO[j.ate]}`; };
const basSomaJ = (arr) => { const j = basJan(); return (arr || []).slice(j.de, j.ate + 1).reduce((s, v) => s + (+v || 0), 0); };
const basPerPill = (escuro) => `<button class="bas-per${escuro ? ' n' : ''}" ${basIr('periodo')} aria-label="Período: ${esc(basJanRot())}, ${S.year}">${typeof I_CAL !== 'undefined' ? I_CAL : ''}<span>${esc(basJanRot())}</span><i aria-hidden="true"></i><b>${S.year}</b>${I.down}</button>`;
const basLancJan = () => { const j = basJan(); return S.plan.lancamentos.filter((l) => { const m = basMesDe(l.data); return m != null && m >= j.de && m <= j.ate; }).sort((x, y) => (x.data < y.data ? 1 : -1)); };
// a variação do patrimônio no período: do fim do mês anterior ao período até o fim dele (E.variacao)
// a variação do patrimônio numa pílula de vidro, em frase: "Cresceu R$ 1.200 (0,8%) em novembro", "Caiu…" ou "Sem variação…"; a seta vai num círculo na cor do sentido
const basVarChip = (V, rec) => { if (V.va == null) return ''; const z = Math.abs(V.dif) < 0.5; const up = V.dif >= 0;
  return `<p class="bas-var"><span class="bas-var-p${z ? '' : up ? ' pos' : ' neg'}"><i aria-hidden="true">${z ? '–' : up ? '↑' : '↓'}</i>${z ? `Sem variação ${esc(basJanFrase())}` : `${up ? '+' : '−'}${brl0(Math.abs(V.dif))} · ${pct(Math.abs(V.va), 1)} ${esc(basJanFrase())}`}</span></p>`; };
const basVarPatr = (C) => { const j = basJan(); const base = j.de > 0 ? C.patrimonio[j.de - 1] : C.patrimonioBase; const fim = C.patrimonio[j.ate]; const va = E.variacao(fim, base); return { dif: fim - base, va }; };
// Período num pop-up: sobe de baixo sobre a tela, com o ano, o calendário e os atalhos embaixo dele
function basPeriodoPop() {
  document.querySelector('.bas-pp')?.remove();
  const w = document.createElement('div'); w.className = 'bas-pp'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', 'Período');
  w.innerHTML = `<button class="bas-pp-fundo" data-act="bas-pp-fechar" aria-label="Fechar"></button><div class="bas-pp-f"><i class="bas-pp-alca" aria-hidden="true"></i><header class="bas-pp-h"><b>Período</b><button class="bas-pp-x" data-act="bas-pp-fechar" aria-label="Fechar">${I.x}</button></header><div class="bas-pp-c">${basPeriodoCorpo()}</div></div>`;
  document.body.appendChild(w); basSom('toque'); w._esc = (e) => { if (e.key === 'Escape') basPeriodoFechar(); }; addEventListener('keydown', w._esc); requestAnimationFrame(() => w.classList.add('on'));
}
function basPeriodoFechar() { const w = document.querySelector('.bas-pp'); if (!w) return; S.basPerIni = null; removeEventListener('keydown', w._esc); w.classList.remove('on'); setTimeout(() => w.remove(), 300); }
const basPeriodoRepinta = () => { const c = document.querySelector('.bas-pp .bas-pp-c'); if (c) c.innerHTML = basPeriodoCorpo(); };
const basTelaPeriodo = () => basDet('Período', basPeriodoCorpo());
function basPeriodoCorpo() {
  const anos = Object.keys(S.plans).map(Number).sort(); const j = basJan(); const ini = S.basPerIni; const ref = S.year === NOW_Y ? NOW_M : 11;
  const ats = [[3, '3 meses'], [6, '6 meses'], [1, 'Este mês'], [12, 'Ano todo']].map(([n, l]) => { const on = ini == null && (n === 12 ? j.n === 12 : n === 1 ? j.n === 1 && j.de === ref : j.n === n && j.ate === ref); return `<button class="${on ? 'on' : ''}" data-act="bas-per-at" data-n="${n}" aria-pressed="${on}">${l}</button>`; }).join('');
  const meses = MES.map((m, i) => { const c = ini != null ? (i === ini ? ' ponta' : '') : (i === j.de || i === j.ate ? ' ponta' : i > j.de && i < j.ate ? ' in' : ''); return `<button class="bas-per-m${c}${S.year === NOW_Y && i > NOW_M ? ' fut' : ''}" data-act="bas-per-mes" data-m="${i}" aria-pressed="${!!c}">${m}</button>`; }).join('');
  return `<div class="bas-pp-anos">${anos.map((y) => `<button class="${y === S.year ? 'on' : ''}" data-act="bas-ano" data-y="${y}" aria-pressed="${y === S.year}">${y}</button>`).join('')}${S.plans[Math.max(...anos) + 1] ? '' : `<button data-act="bas-ano" data-y="${Math.max(...anos) + 1}" aria-label="Abrir ${Math.max(...anos) + 1}">+</button>`}</div>
    <div class="bas-pp-cal${ini != null ? ' esc' : ''}"><div class="bas-per-grade">${meses}</div></div>
    <div class="seg bas-per-at bas-pp-at">${ats}</div>`;
}

/* ---- blocos que o cliente organiza (ordem e quais aparecem), salvos no perfil ---- */
const BAS_SECS = {
  inicio: [['sonho', 'Meu sonho'], ['disp', 'Dá para investir'], ['historico', 'Patrimônio ano a ano'], ['aviso', 'O que o assistente notou'], ['resumo', 'Resumo do mês'], ['calendario', 'Mês dia a dia', 0], ['semana', 'Dia que mais gasta', 0], ['maior', 'Maior gasto', 0], ['globo', 'Seu universo', 0], ['saude', 'Saúde financeira', 0], ['contas', 'Contas do mês', 0], ['limite', 'Limite do mês', 0], ['meta', 'Meta de investimento', 0], ['cartoes', 'Seus cartões', 0], ['proventos', 'Proventos', 0]],
  gastos: [['onde', 'Para onde foi o dinheiro'], ['ultimos', 'Últimos gastos']],
  investir: [['patr', 'Evolução do patrimônio'], ['meta', 'Meta e disponível'], ['comp', 'Como está dividido'], ['feitos', 'Investido no período']],
};
function basOrdemDe(aba) {
  const ids = BAS_SECS[aba].map((x) => x[0]); const o = ((S.profile.basOrdem || {})[aba] || []).filter((id) => ids.includes(id));
  return o.concat(ids.filter((id) => !o.includes(id)));
}
// widget com padrão 0 começa fora da tela (catálogo); o cliente adiciona em Organizar
const basOculto = (aba, id) => { if (((S.profile.basOcultos || {})[aba] || []).includes(id)) return true; const d = BAS_SECS[aba].find((x) => x[0] === id); return !!d && d[2] === 0 && !((S.profile.basMostrados || {})[aba] || []).includes(id); };
function basOrdenar(aba, html) { return basOrdemDe(aba).filter((id) => html[id] && !basOculto(aba, id)).map((id) => `<div class="bas-sec" data-sec="${id}">${html[id]}</div>`).join(''); }
const basOrganizarBtn = (aba) => `<button class="bas-org" ${basIr('organizar', { area: aba })}>${I_ORDEM}Organizar esta tela</button>`;
function basTelaOrganizar(o) {
  const aba = BAS_SECS[o.area] ? o.area : 'inicio'; const nomes = Object.fromEntries(BAS_SECS[aba].map((x) => [x[0], x[1]])); const ord = basOrdemDe(aba); const vis = ord.filter((id) => !basOculto(aba, id)); const fora = ord.filter((id) => basOculto(aba, id));
  const I_ALCA = ic('<path d="M5 9h14M5 15h14"/>');
  return basDet('Organizar a tela', `<p class="bas-p">Arraste pela alça para mudar a ordem. Toque em + para colocar um widget na tela de ${esc({ inicio: 'Início', gastos: 'Gastos', investir: 'Patrimônio' }[aba])}.</p>
    ${basSecao('Na tela', '', `<ul class="bas-org-l" data-aba="${aba}">${vis.map((id, i) => `<li data-id="${id}"><span class="bas-org-h" aria-hidden="true">${I_ALCA}</span><span class="bas-org-n">${esc(nomes[id])}</span>
      <button class="bas-org-b" data-act="bas-ord" data-aba="${aba}" data-id="${id}" data-d="-1" aria-label="Subir ${esc(nomes[id])}"${i ? '' : ' disabled'}>${I.up}</button><button class="bas-org-b" data-act="bas-ord" data-aba="${aba}" data-id="${id}" data-d="1" aria-label="Descer ${esc(nomes[id])}"${i < vis.length - 1 ? '' : ' disabled'}>${I.down}</button>
      <button class="bas-org-b menos" data-act="bas-ord-vis" data-aba="${aba}" data-id="${id}" aria-label="Tirar ${esc(nomes[id])} da tela">${ic('<path d="M6 12h12"/>')}</button></li>`).join('')}</ul>`)}
    ${fora.length ? basSecao('Para adicionar', '', `<ul class="bas-org-l bas-org-fora">${fora.map((id) => `<li><span class="bas-org-n">${esc(nomes[id])}</span><button class="bas-org-b mais" data-act="bas-ord-vis" data-aba="${aba}" data-id="${id}" aria-label="Colocar ${esc(nomes[id])} na tela">${I.plus}</button></li>`).join('')}</ul>`) : ''}
    <button class="btn lg bas-cta bas-add" data-act="bas-ord-pad" data-aba="${aba}">Voltar ao padrão</button>`);
}
function basOrdAcao(act, ds) {
  const aba = ds.aba; if (!BAS_SECS[aba]) return; const p = S.profile; p.basOrdem = p.basOrdem || {}; p.basOcultos = p.basOcultos || {};
  if (act === 'bas-ord') { const o = basOrdemDe(aba); const vis = o.filter((id) => !basOculto(aba, id)); const i = vis.indexOf(ds.id); const k = i + +ds.d; if (i < 0 || k < 0 || k >= vis.length) return; [vis[i], vis[k]] = [vis[k], vis[i]]; p.basOrdem[aba] = vis.concat(o.filter((id) => basOculto(aba, id))); }
  else if (act === 'bas-ord-vis') { p.basMostrados = p.basMostrados || {}; const oc = new Set(p.basOcultos[aba] || []); const mo = new Set(p.basMostrados[aba] || []); if (basOculto(aba, ds.id)) { oc.delete(ds.id); mo.add(ds.id); } else { oc.add(ds.id); mo.delete(ds.id); } p.basOcultos[aba] = [...oc]; p.basMostrados[aba] = [...mo]; }
  else { delete p.basOrdem[aba]; delete p.basOcultos[aba]; if (p.basMostrados) delete p.basMostrados[aba]; }
  touch('profile'); basSom('toque'); render();
}

/* ---- Início: o patrimônio total, o período, as ações do dia a dia e os blocos do cliente ---- */
const basAvisoNivel = () => { const n = (typeof notifLista === 'function' ? notifLista() : []).filter((x) => !x.lida); return n.some((x) => x.nivel === 'critico') ? ' vivo-critico' : n.some((x) => x.nivel === 'alerta') ? ' vivo-alerta' : ''; };
const basAvisosNovos = () => (typeof notifLista === 'function' ? notifLista().filter((n) => !n.lida).length : 0);
function basInicio() {
  const C = S.C; const p = S.plan; const pr = S.profile; const j = basJan(); const ent = basSomaJ(C.receita); const sai = basSomaJ(C.despesas); const sob = basSomaJ(C.investAlocado);
  const D = E.disponivelAporte({ C, mes: j.de, ate: j.ate, metaMes: C.metaAporteMes }); const V = basVarPatr(C); const av = basAvisosNovos();
  const nome = (pr.apelido || pr.nome || '').split(/\s+/)[0];
  const secs = {};
  // recorde: o patrimônio do fim do período é o maior já registrado (meses anteriores deste ano e o fim dos anos anteriores)
  const antes = C.patrimonio.slice(0, j.ate).concat((histDados().anos || []).filter((l) => l.ano < S.year && l.preenchido).map((l) => l.patrimonioFim));
  const rec = antes.length > 0 && C.patrimonio[j.ate] > Math.max(...antes) + 0.5;
  // fundo do painel pela hora do dia: manhã, tarde ou noite
  const hr = new Date().getHours(); const fase = hr >= 5 && hr < 12 ? 'manha' : hr >= 12 && hr < 18 ? 'tarde' : 'noite';
  const metaM = C.metaAporteMes[j.ate] || 0; const humor = basAvisoNivel() ? 'atento' : rec || (metaM > 0 && D.aportado >= metaM) ? 'festa' : 'calmo';
  const hero = `<section class="bas-noite" data-fase="${fase}">
    ${basTopo()}
    <small class="bas-noite-k">Patrimônio total</small><b class="bas-noite-v brilha${rec ? ' recorde' : ''}${brl(C.patrimonio[j.ate]).length > 13 ? ' longo' : ''}" data-conta="${C.patrimonio[j.ate]}">${basCent(C.patrimonio[j.ate])}</b>
    ${basVarChip(V, rec)}
    <div class="bas-noite-par"><button ${basIr('entradas')}><small>Entrou</small><b>${basCent(ent)}</b></button><button data-act="bas-aba" data-v="gastos"><small>Saiu</small><b>${basCent(sai)}</b></button></div>
    </section>`;
  const g = objFoco(objAnalise());
  secs.sonho = `<button class="card bas-sonho" ${basIr(g ? 'sonhos' : 'sonho-novo')}>${g ? `<span class="bas-sonho-l">${objIcone(g, 0)}${basNome(esc(objNomeDe(g)), `${brl0(g.saldo)} de ${brl0(g.valor)}`)}<b class="bas-pct">${pct(g.progresso)}</b></span>${basBarra(g.progresso)}`
    : `<span class="bas-sonho-l"><span class="obj-ic" aria-hidden="true">${I.plus}</span>${basNome('Qual é o seu sonho?', 'Dê um nome e acompanhe quanto falta')}${I.chev}</span>`}</button>`;
  // Dá para investir: uma linha só, com ícone, valor e uma ficha curta do estado (ou o botão Investir); a meta vira só uma barra fina
  const dSit = D.disponivel > 0.005 ? '' : D.sobra > 0.005 ? ['ok', 'Tudo investido'] : !(ent > 0) && !(sai > 0) ? ['', 'Sem dados'] : ['', 'Sem sobra'];
  const dMeta = D.meta > 0 ? Math.min(1, (D.aportado || 0) / D.meta) : null;
  secs.disp = `<section class="card bas-card bas-dp3"><div class="bas-dp3-l"><span class="bas-dp3-t"><small>Dá para investir</small><b>${basCent(D.disponivel)}</b></span>
      ${dSit ? `<span class="bas-dp3-st ${dSit[0]}">${dSit[1]}</span>` : `<button class="btn primary bas-dp3-bt" ${basIrInv()}>Investir</button>`}</div>
    ${dMeta != null ? `<div class="bas-dp3-m" aria-label="Meta do mês: ${Math.round(dMeta * 100)}%"><i style="width:${(dMeta * 100).toFixed(1)}%"></i></div><small class="bas-dp3-mt">Meta do mês · ${Math.round(dMeta * 100)}%</small>` : ''}</section>`;
  const ents = j.n === 1 ? p.rendas.filter((r) => +r.valores[j.de] > 0.005).map((r) => basRow(basIr('entrada', { id: r.id }), I_ENTRADA, esc(r.nome), `Entrada · ${MES_LONGO[j.de]}`, `<b class="pos">+${basCent(r.valores[j.de])}</b>`)) : [];
  const ativ = ents.concat(basLancJan().slice(0, 6).map(basLancLinha)).slice(0, 7);
  secs.atividade = basSecao(j.n === 1 ? 'Atividade do mês' : 'Atividade do período', '<button class="lnk strong" data-act="bas-aba" data-v="gastos">Ver tudo</button>', ativ.length ? `<ul class="bas-ativ">${ativ.join('')}</ul>` : basCard(basVazio(voz('bas_vazio'))));
  basExtrasInicio(secs); basWidgetsInicio(secs);
  const sobe = ['sonho', 'disp', 'sequencia', 'saude', 'globo', 'limite', 'meta', 'historico', 'aviso', 'ritmo', 'maior', 'resumo'].includes(basOrdemDe('inicio').find((id) => !basOculto('inicio', id)));
  return `${hero.replace('class="bas-noite"', `class="bas-noite${sobe ? ' sobe' : ''}"`)}<div class="bas-secs${sobe ? ' sobe' : ''}">${basOrdenar('inicio', secs)}</div>${basOrganizarBtn('inicio')}`;
}
// entradas do período: lista e a nova entrada (o botão Entrou do Início abre aqui)
// Entradas: o total do período, o mês a mês, o que é previsível, a renda passiva, cada fonte com a sua parte e leituras automáticas
// (E.analiseRenda, a mesma análise da aba Rendas do SaaS); tocar numa fonte edita, e o + cria
function basTelaEntradas() {
  // só as fontes de renda (C.rendas): os proventos ficam fora, eles têm a tela deles
  const j = basJan(); const C = S.C; const p = S.plan; const R = E.analiseRenda({ C: { ...C, receita: C.rendas }, de: j.de, ate: j.ate, meses: Math.max(j.ate + 1, 1), rendas: p.rendas, rendaCats: p.rendaCats });
  const tot = basSomaJ(C.rendas); const mx = Math.max(1, ...C.rendas); const ult = S.year === NOW_Y ? NOW_M : 11;
  const fontes = p.rendas.map((r) => [r, (r.valores || []).slice(j.de, j.ate + 1).reduce((a, v) => a + (+v || 0), 0)]).filter((x) => x[1] > 0.005).sort((a, b) => b[1] - a[1]);
  const totF = fontes.reduce((a, x) => a + x[1], 0) || 1;
  // recorrente pelo ano até agora (não só pelo período escolhido): entrou em pelo menos 60% dos meses e em 3 ou mais
  const recDe = (id) => { const r = p.rendas.find((x) => x.id === id); const nM = ((r && r.valores) || []).slice(0, ult + 1).filter((v) => +v > 0).length; return nM >= Math.min(3, ult + 1) && nM / (ult + 1) >= 0.6; };
  const prev = fontes.reduce((a, [r, v]) => a + (recDe(r.id) ? v : 0), 0) / totF; const prevMes = fontes.reduce((a, [r]) => a + (recDe(r.id) ? +((r.valores || [])[ult]) || 0 : 0), 0);
  const prov = basSomaJ(C.faturamento); const futuro = S.year === NOW_Y ? p.rendas.reduce((a, r) => a + (r.valores || []).slice(NOW_M + 1).reduce((b, v) => b + (+v || 0), 0), 0) : 0;
  // tocar numa barra mostra aquele mês (o ano e vários meses ficam na pílula do período, acima)
  const barras = C.rendas.map((v, m) => `<button class="${m >= j.de && m <= j.ate ? 'on' : ''}${m > ult ? ' fut' : ''}" data-act="bas-en-mes" data-m="${m}" aria-label="${cap(MES_LONGO[m])}: ${esc(brl0(v))}" aria-pressed="${m >= j.de && m <= j.ate}"><i style="--h:${Math.max(3, (v / mx) * 100).toFixed(1)}%"></i><b>${MES[m][0]}</b></button>`).join('');
  const tile = (n, v, sub) => `<span class="bas-en-k"><small>${n}</small><b>${v}</b>${sub ? `<em>${sub}</em>` : ''}</span>`;
  const fixaM = (m) => p.rendas.filter((r) => r.cat === 'fixa').reduce((a, r) => a + (+((r.valores || [])[m]) || 0), 0);
  const n = j.ate - j.de + 1; let ant = null; if (j.de - n >= 0) { ant = 0; for (let m = j.de - n; m < j.de; m++) ant += +C.rendas[m] || 0; }
  const dif = ant != null ? tot - ant : null; const up = dif == null || dif >= 0; const pv = ant > 0 ? Math.abs(dif) / ant : null;
  // mesmas barras de Proventos; o topo listrado de cada uma é a renda extra, a base lisa é a renda fixa
  const col = C.rendas.map((v, m) => { const fx = Math.min(v, fixaM(m)); const ex = Math.max(0, v - fx); const dentro = m >= j.de && m <= j.ate; const on = n === 1 && m === j.ate;
    return `<button class="${dentro ? 'in' : 'fora'}${on ? ' on' : ''}${m > ult ? ' fut' : ''}" data-act="bas-en-mes" data-m="${m}" style="--h:${v > 0 ? Math.max(6, (v / mx) * 78).toFixed(1) : 3}%" aria-label="${cap(MES_LONGO[m])}: ${esc(brl0(v))}${ex > 0 ? `, ${esc(brl0(ex))} extra` : ''}" aria-pressed="${dentro}">${on && v > 0 ? `<small>${brl0(v)}</small>` : ''}${ex > 0 ? `<i class="dv"><em class="bas-en3-ex" style="--p:${((ex / v) * 100).toFixed(1)}%"></em><u class="bas-en3-fx"></u></i>` : '<i></i>'}<b>${MES[m][0]}</b></button>`; }).join('');
  const k = (nome, v, sub) => `<span><small>${nome}</small><b>${v}</b>${sub ? `<em>${sub}</em>` : ''}</span>`;
  const fonte = ([r, v], i) => `<li><button class="bas-pv2-l" ${basIr('entrada', { id: r.id })}><span class="bas-pv2-ini bas-ren-ic" style="--bc:${PAL[i % 6]}">${ic(BAS_REN_IC[basRenIcId(r)][1])}</span><span class="bas-pv2-n"><b>${esc(r.nome)}</b><small>${esc(((p.rendaCats || []).find((c) => c.id === r.cat) || {}).nome || 'Renda')} · ${recDe(r.id) ? 'todo mês' : 'pontual'}${r.soGasto ? ' · só para gastos' : ''}</small><i style="--p:${((v / totF) * 100).toFixed(1)}%"></i></span><b class="bas-pv2-v">+${basCent(v)}</b></button></li>`;
  // arco das fontes (padrão): cada fonte do período ocupa um trecho do arco pelo valor; a escolhida fica em verde
  const arAnt = (r) => { if (j.de - n < 0) return null; let t = 0; for (let m = j.de - n; m < j.de; m++) t += +((r.valores || [])[m]) || 0; return t; };
  // escala do arco: o seu melhor mês do ano (vezes o número de meses do período); o listrado no fim é o que falta até ele
  const arCheio = fontes.length ? Math.min(1, totF / Math.max(totF, n * Math.max(...C.rendas))) : 0;
  const arF = fontes.map(([r, v]) => { const a0 = arAnt(r); return [r.nome, brl0(v), pct(v / totF), a0 > 0 ? Math.round(((v - a0) / a0) * 100) : null, (v / totF) * arCheio, brl(v)]; });
  const arQuando = j.de - n >= 0 ? (n === 1 ? MES_LONGO[j.de - 1] : 'o período anterior') : '';
  const arco = `<div class="bas-gg${fontes.length ? '' : ' vazio'}" data-f="${esc(JSON.stringify(arF))}" data-q="${esc(arQuando)}" data-t="${esc(brl(tot))}" data-tk="${esc(`Entrou ${basJanFrase()}`)}" tabindex="0" role="slider" aria-label="Fontes de renda ${esc(basJanFrase())}. Toque numa parte do arco." aria-valuemin="1" aria-valuemax="${Math.max(1, arF.length)}">
      <svg class="bas-gg-svg" viewBox="0 0 340 280" aria-hidden="true"></svg>
      <div class="bas-gg-tx" aria-live="polite">${fontes.length ? '<small class="bas-gg-k"></small><b class="bas-gg-v"></b><span class="bas-gg-s"></span>' : `<small class="bas-gg-k">Nenhuma entrada ${esc(basJanFrase())}</small><b class="bas-gg-v">${esc(brl(0))}</b><span class="bas-gg-s">Anote o seu salário, freelas e outras rendas.</span><button class="bas-ar-bt" ${basIr('entrada')}>${I.plus}<span>Anotar entrada</span></button>`}</div></div>`;
  const vis = S.basEnVis === 'hist' ? 'hist' : 'fontes';
  const seg = `<div class="bas-rl-seg" role="group" aria-label="Visualização">${[['fontes', 'Fontes'], ['hist', 'Evolução']].map(([v, t]) => `<button data-act="bas-en-vis" data-v="${v}" aria-pressed="${vis === v}">${t}</button>`).join('')}</div>`;
  return `<div class="bas-pg bas-pg-ent"><div class="bas-gt-bg bas-pt-bg bas-en2-bg${vis === 'fontes' ? ' ar-on' : ''}">
    <header class="bas-pv2-h"><button class="bell bas-cal-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><b>Entradas</b><span class="bas-noite-r"><button class="bell bas-cal-b" ${basIr('periodo')} aria-label="Período: ${esc(basJanRot())}, ${S.year}">${I_CAL}</button>${olhoHtml()}</span></header>
    ${seg}<small class="bas-pv2-k">Entrou ${esc(basJanFrase())}</small>
    <b class="bas-pv2-t">${basCent(tot)}</b>
    ${vis === 'fontes' ? arco : `<p class="bas-pv2-var">${pv != null ? `<span class="bas-ev-pct${up ? '' : ' neg'}">${up ? '↑' : '↓'} ${pct(pv, 1)}</span><span>${up ? '+' : '−'}${brl0(Math.abs(dif))} contra ${n === 1 ? MES_LONGO[j.de - 1] : 'o período anterior'}</span>` : ''}</p>
    <div class="bas-en2-leg" aria-hidden="true"><span><i class="fx"></i>Renda fixa</span><span><i class="ex"></i>Extra</span></div>
    <div class="bas-pv2-g bas-en3-g" role="group" aria-label="Entradas mês a mês, renda fixa e extra">${col}</div>`}
  </div><div class="bas-gt-folha">
    <div class="bas-pg-per bas-gt-acoes bas-en2-acoes"><button class="bas-circ bas-en-bt" ${basIr('entrada')}>${I.plus}<span>Nova entrada</span></button></div>
    <div class="card bas-en2-ks">${k('Média por mês', brl0(R.mediaMes))}${k('Previsível', fontes.length ? pct(prev) : '–', `${brl0(prevMes)}/mês`)}${k('Guardou', R.poupanca != null ? pct(R.poupanca) : '–', `${brl0(R.sobraMes)}/mês`)}</div>
    ${fontes.length ? basSecao('De onde vem', `<small class="bas-pv2-q">${fontes.length} ${fontes.length === 1 ? 'fonte' : 'fontes'}</small>`, `<ul class="card bas-pv2-ls">${fontes.map(fonte).join('')}</ul>`) : basCard(basVazio('Nenhuma entrada neste período. Toque em + Entrada para anotar.'))}
  </div></div>`;
}

/* ---- peças compartilhadas pelas listas ---- */
const basContas = (m) => E.contasMes({ despesas: S.plan.despesas, carry: E.carryItems(S.plans, S.year), ano: S.year, mes: m });
const basContaLinha = (x) => basRow(basIr('gasto-ver', { id: x.id, op: 'conta', modo: S.mes }), x.inst ? instIcone(x.inst) : `<span class="bas-catic-i">${basCatIc(x.area)}</span>`, esc(x.nome), `${esc(x.area || 'Outros')} · ${x.parcela ? `parcela ${x.parcela.i} de ${x.parcela.n}` : 'todo mês'}`,
  `<span class="bas-v"><b>${basCent(x.valor)}</b>${S.year > NOW_Y || (S.year === NOW_Y && S.mes > NOW_M) ? '<em class="bas-st">Previsto</em>' : ''}</span>`);
const basLancLinha = (l) => { const d = E.parseDataISO(l.data);
  return basRow(basIr('gasto-ver', { id: l.id }), l.inst ? instIcone(l.inst) : `<span class="bas-catic-i">${basCatIc(l.area)}</span>`, esc(l.desc || l.area), `${esc(l.area || 'Outros')} · ${pad2(d.dia)}/${pad2(d.mes + 1)}`, `<span class="bas-v"><b>${basCent(Math.abs(l.valor))}</b></span>`); };

/* ---- Gastos: "Para onde foi". Anel interativo (tocar destaca a categoria e mostra o valor; tocar de novo abre),
   anel fino de fora com o uso do limite, cartões por banco, contas numa linha do tempo e o + flutuante ---- */
function basGastos() {
  const C = S.C; const j = basJan(); const sai = basSomaJ(C.despesas); const orc = basSomaJ(C.orcamento); const carry = E.carryItems(S.plans, S.year);
  const areas = E.gastosAreaPeriodo(S.plan, carry, j.de, j.ate); const lista = Object.keys(areas).map((k) => [k, areas[k]]).filter((x) => x[1] > 0.005).sort((x, y) => y[1] - x[1]);
  const tot = lista.reduce((s, x) => s + x[1], 0); const secs = {};
  secs.onde = basOndeHtml();
  const lanc = basLancJan().slice(0, 8);
  // últimos gastos numa lista simples (ícone redondo, nome, quando e valor); "Ver tudo" mostra o período inteiro
  // contas do mês e parcelas também são gastos: entram na lista com os lançamentos (as que já viraram lançamento não repetem)
  const jj = basJan(); const contas = []; for (let mm = jj.de; mm <= jj.ate; mm++) basContas(mm).itens.filter((x) => !x.pago).forEach((x) => contas.push({ conta: true, id: x.id, desc: x.nome, area: x.area || 'Contas', valor: x.valor, data: `${S.year}-${String(mm + 1).padStart(2, '0')}-01`, mm, parcela: x.parcela }));
  const todos = basLancJan().concat(contas).sort((x, y) => (x.data < y.data ? 1 : x.data > y.data ? -1 : x.conta ? 1 : -1));
  const quando = (l) => { if (l.conta) return l.parcela ? `parcela ${l.parcela.i} de ${l.parcela.n}` : `todo mês · ${MES[l.mm].toLowerCase()}`; const d = E.parseDataISO(l.data); const hj = new Date(); const ont = new Date(hj - 864e5);
    return d.ano === hj.getFullYear() && d.mes === hj.getMonth() && d.dia === hj.getDate() ? 'Hoje' : d.ano === ont.getFullYear() && d.mes === ont.getMonth() && d.dia === ont.getDate() ? 'Ontem' : `${d.dia} ${MES[d.mes].toLowerCase()}`; };
  const linha = (l) => `<li><button class="bas-ult-l" ${l.conta ? basIr('gasto-ver', { id: l.id, op: 'conta', modo: l.mm }) : basIr('gasto-ver', { id: l.id })}><span class="bas-ult-ic bas-catic-i">${basCatIc(l.area)}</span><span class="bas-ult-n"><b>${esc(l.desc || l.area)}</b><small>${esc(quando(l))} · ${esc(l.area)}</small></span><b class="bas-ult-v">${brl(Math.abs(l.valor))}</b></button></li>`;
  secs.ultimos = todos.length ? basSecao('Últimos gastos', todos.length > 5 ? `<button class="bas-ult-ver" data-act="bas-ult-todos">Ver tudo</button>` : '',
    `<ul class="card bas-ult">${todos.slice(0, 5).map(linha).join('')}</ul>${todos.length > 5 ? `<template id="bas-ult-tpl"><ul class="bas-ult">${todos.map(linha).join('')}</ul></template>` : ''}`) : '';
  return `<div class="bas-pg bas-pg-g"><div class="bas-gt-bg">${basTopo()}
    ${basGastoTopoHtml(sai, orc)}</div><div class="bas-gt-folha"><div class="bas-pg-per bas-gt-acoes"><button class="bas-circ bas-en-bt" ${basIr('entradas')}>${I_ENTRADA}<span>Entradas</span></button><button class="bas-inv-pl" ${basIr('gasto')} aria-label="Novo gasto">${I.plus}<span>Gasto</span></button></div>${basOrdenar('gastos', secs)}</div></div>`;
}
// toque num arco ou na legenda: destaca a categoria e mostra o valor no centro, sem redesenhar; o segundo toque abre
function basArco(el) {
  const box = document.querySelector('.bas-roda'); if (!box) return; const area = el.dataset.area;
  if (box.dataset.sel === area) { basAbrir('categoria', { area }); return; }
  box.dataset.sel = area; box.classList.add('sel'); basSom('toque');
  document.querySelectorAll('.bas-arco, .bas-leg button').forEach((x) => x.classList.toggle('on', x.dataset.area === area));
  const c = box.querySelector('.bas-roda-cat'); c.querySelector('[data-r="n"]').textContent = area; c.querySelector('[data-r="v"]').textContent = el.dataset.v; c.querySelector('[data-r="p"]').textContent = `${el.dataset.p} dos gastos`;
}

/* ---- Investir: o quanto investiu. O patrimônio num gráfico que segue o dedo, a meta e o disponível, a carteira e o investido ---- */
function basInvestir() {
  const C = S.C; const j = basJan(); const D = E.disponivelAporte({ C, mes: j.de, ate: j.ate, metaMes: C.metaAporteMes }); const pode = temRecurso('aporte_simples'); const V = basVarPatr(C); const secs = {};
  const ultAno = S.year === NOW_Y ? NOW_M : 11; const comPer = !!S.basPer; const jan = 12;
  const ult = comPer ? Math.min(j.ate, ultAno) : ultAno; const ini = comPer ? Math.max(0, Math.min(ult, j.n === 1 ? j.de - 1 : j.de)) : 0; const serie = C.patrimonio.slice(ini, ult + 1); const mn = Math.min(...serie); const mx = Math.max(...serie); const W = 320; const H = 170; const P = 16;
  const xs = (i) => (serie.length > 1 ? P + (i / (serie.length - 1)) * (W - 2 * P) : W / 2); const ys = (v) => (mx > mn ? H - 26 - ((v - mn) / (mx - mn)) * (H - 40) : H * 0.4);
  const pts = serie.map((v, i) => [xs(i), ys(v)]);
  // curva suave (Catmull-Rom para Bézier), a área com degradê e a faixa do período escolhido
  const curva = basCurva([[0, pts[0][1]], ...pts, [W, pts[pts.length - 1][1]]]); // a linha entra e sai pelas bordas, como no gráfico de referência
  const fai = '';
  const dados = serie.map((v, i) => [MES_LONGO[ini + i], brl(v)]); const sel = serie.length - 1;
  const area = `${curva} L${W} ${H} L0 ${H} Z`;
  const masc = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='none'><path d='${area}'/></svg>`)}")`;
  const vF = C.patrimonio[ult]; const vI = ini > 0 ? C.patrimonio[ini - 1] : serie[0]; const dif = vF - vI; const va = vI ? dif / Math.abs(vI) : 0; const up = dif >= 0;
  const janTxt = comPer ? basJanFrase() : `em ${S.year}`;
  secs.patr = `<section class="bas-ev" data-pts='${esc(JSON.stringify(pts.map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)])))}' data-d='${esc(JSON.stringify(dados))}' data-w="${W}" data-h="${H}">
    <div class="bas-ev-h"><small class="bas-ev-k" data-ev="k">Patrimônio em ${MES_LONGO[ini + sel]}</small><b class="bas-ev-v" data-ev="v">${basCent(serie[sel])}</b>
      <p class="bas-ev-var"><span class="bas-ev-pct${up ? '' : ' neg'}">${up ? '↑' : '↓'} ${pct(Math.abs(va), 2)}</span><span>${up ? '+' : '−'}${brl(Math.abs(dif))} ${esc(janTxt)}</span></p></div>
    <div class="bas-ev-g" role="img" aria-label="Evolução do patrimônio em ${S.year}. Arraste o dedo para ver cada mês."><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bas-ev-ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient><linearGradient id="bas-ev-ln" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0"><stop offset="0"/><stop offset=".6"/><stop offset="1"/></linearGradient></defs>
      <path class="bas-ev-a" d="${area}"/><path class="bas-ev-l" d="${curva}"/></svg>
      <span class="bas-ev-pts" aria-hidden="true" style="--m:${esc(masc)}"></span><svg class="bas-ev-sobre" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="bas-ev-l bas-ev-l2" d="${curva}"/></svg>
      <span class="bas-ev-guia" aria-hidden="true" style="left:${((pts[sel][0] / W) * 100).toFixed(2)}%;top:${((pts[sel][1] / H) * 100).toFixed(2)}%"></span><span class="bas-ev-p" aria-hidden="true" style="left:${((pts[sel][0] / W) * 100).toFixed(2)}%;top:${((pts[sel][1] / H) * 100).toFixed(2)}%"></span></div>
    <div class="bas-ev-meses" aria-hidden="true">${serie.map((_, i) => `<span style="left:${((xs(i) / W) * 100).toFixed(2)}%"${i === sel ? ' class="on"' : ''}>${MES[ini + i][0]}</span>`).join('')}</div></section>`;
  const f = D.meta > 0 ? D.aportado / D.meta : 0;
  secs.meta = basMetaDispHtml();
  // seus sonhos também em Investir: cada aporte aproxima um deles; tocar abre os detalhes
  const As = objAnalise(); const gF = objFoco(As);
  secs.sonhos = basSecao('Seus sonhos', `<button class="lnk strong" ${basIr('sonhos')}>Ver todos</button>`, `<div class="bas-sn-c">${As.itens.map((x, i) => `<button class="bas-sn${gF && x.id === gF.id ? ' on' : ''}" ${basIr('sonho-det', { id: x.id })}>${basAnel(x.progresso, 54, objIcone(x, i))}<b>${esc(objNomeDe(x))}</b><small>${pct(x.progresso)}</small></button>`).join('')}<button class="bas-sn novo" ${basIr('sonho-novo')}><span class="bas-sn-mais" aria-hidden="true">${I.plus}</span><b>Novo sonho</b><small>Dê um nome</small></button></div>`);
  if (temRecurso('carteira')) { const { K } = cartAnalise(); const tt = K.classes.reduce((t, c) => t + c.valor, 0);
    if (tt > 0) { const cls = K.classes.slice().sort((a, b) => b.valor - a.valor);
      secs.comp = basSecao('Como está dividido', `<button class="lnk strong" ${basIr('carteira')}>Carteira</button>`, `<div class="card bas-comp"><div class="bas-comp-b" aria-hidden="true">${cls.map((c, i) => `<i style="flex:${c.valor.toFixed(2)};--bc:${PAL[i % 6]}"></i>`).join('')}</div>
        <ul class="bas-comp-l">${cls.map((c, i) => `<li><i style="--bc:${PAL[i % 6]}"></i><span>${esc(c.classe || 'Outros')}</span><b>${pct(c.valor / tt)}</b></li>`).join('')}</ul></div>`); } }
  // acompanhar: botões redondos só com o ícone, ao lado do período (o nome fica no aria-label e no title)
  const atalho = (attrs, ic0, nome) => `<button class="bas-circ" ${attrs} aria-label="${nome}" title="${nome}">${ic0}</button>`;
  const extras = [temRecurso('proventos') ? atalho(basIr('proventos'), I_PROV, 'Proventos') : '', temRecurso('carteira') ? atalho(basIr('carteira'), I_CART, 'Minha carteira') : '',
    temRecurso('carteira_recomendada') && S.recomendacao && (S.recomendacao.carteira || []).length ? atalho(basIr('carteira'), I_REC, `Recomendação do ${esc(primeiroNome())}`) : ''].filter(Boolean).join('');
  const ativos = S.plan.ativos.map((a) => [a, (a.ap || []).slice(j.de, j.ate + 1).reduce((s, v) => s + (+v || 0), 0)]).filter((x) => Math.abs(x[1]) > 0.005);
  secs.feitos = ativos.length ? basSecao(`Investido ${esc(basJanFrase())}`, '', `<ul class="bas-ativ">${ativos.map(([a, v], i) => basRow(basIr('ativo', { id: a.id }), esc(basIniciais(a.nome)), esc(a.nome), v < 0 ? 'Resgate' : E.norm(a.classe) === E.norm(a.nome) ? '' : esc(a.classe || ''), `<b class="${v < 0 ? 'neg' : 'pos'}">${v < 0 ? '−' : '+'}${basCent(Math.abs(v))}</b>`, PAL[i % 6])).join('')}</ul>`) : '';
  // Investimento: pílula compacta na linha do período (aportar, resgatar ou importar ficam na tela que ela abre)
  const acoes = `<button class="bas-inv-pl" ${basIrInv()} aria-label="Investimento: aportar, resgatar ou importar">${I.plus}<span>Investir</span></button>`;
  const patrTopo = secs.patr || ''; delete secs.patr;
  return `<div class="bas-pg bas-pg-i"><div class="bas-gt-bg bas-pt-bg">${basTopo()}${patrTopo}</div><div class="bas-gt-folha"><div class="bas-pg-per bas-pt-acoes">${extras}${acoes}</div>${basOrdenar('investir', secs)}<p class="bas-disc keep">Valores a custo, sem cotação de mercado.</p></div></div>`;
}
// o gráfico do patrimônio segue o dedo (manipulação direta): o mês mais perto do toque aparece em cima, sem redesenhar
const BAS_EV_COR = [[0, [61, 139, 255]], [0.55, [56, 214, 255]], [1, [150, 248, 255]]];
function basEvCor(t) { t = Math.max(0, Math.min(1, t)); let a = BAS_EV_COR[0]; let b = BAS_EV_COR[BAS_EV_COR.length - 1]; for (let n = 1; n < BAS_EV_COR.length; n++) if (BAS_EV_COR[n][0] >= t) { a = BAS_EV_COR[n - 1]; b = BAS_EV_COR[n]; break; }
  const k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 0; return `rgb(${a[1].map((c, i) => Math.round(c + (b[1][i] - c) * k)).join(',')})`; }
function basEvLigar() {
  const ev = document.querySelector('.bas-ev[data-pts]'); if (!ev || ev.dataset.on) return; ev.dataset.on = '1';
  const g = ev.querySelector('.bas-ev-g'); const pts = JSON.parse(ev.dataset.pts); const dd = JSON.parse(ev.dataset.d); const W = +ev.dataset.w; const H = +ev.dataset.h;
  const ponto = ev.querySelector('.bas-ev-p'); const guia = ev.querySelector('.bas-ev-guia'); const k = ev.querySelector('[data-ev="k"]'); const v = ev.querySelector('[data-ev="v"]');
  const k0 = k.textContent; const v0 = v.innerHTML; let ult = -1; const corEm = (i) => ev.style.setProperty('--ev-cor', basEvCor(pts[i][0] / W)); const topo = pts.reduce((b, p, n) => (p[1] < pts[b][1] ? n : b), 0);
  const mover = (e) => { const r = g.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W; let i = 0; pts.forEach((p, n) => { if (Math.abs(p[0] - x) < Math.abs(pts[i][0] - x)) i = n; });
    if (i === ult) return; ult = i; const L = (pts[i][0] / W) * 100; ponto.style.left = L + '%'; ponto.style.top = (pts[i][1] / H) * 100 + '%'; guia.style.left = L + '%'; guia.style.top = (pts[i][1] / H) * 100 + '%'; ev.classList.add('arrasta'); corEm(i);
    k.textContent = `Patrimônio em ${dd[i][0]}`; v.textContent = dd[i][1]; basSom('toque'); ponto.classList.toggle('topo', i === topo); if (i === topo) basVibra(14); };
  const l0 = ponto.style.left; const t0 = ponto.style.top; const soltar = () => { ev.classList.remove('arrasta'); ult = -1; k.textContent = k0; v.innerHTML = v0; ponto.style.left = guia.style.left = l0; ponto.style.top = guia.style.top = t0; corEm(pts.length - 1); };
  corEm(pts.length - 1);
  g.addEventListener('pointerdown', (e) => { g.setPointerCapture(e.pointerId); mover(e); }); g.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'mouse') mover(e); });
  g.addEventListener('pointerup', soltar); g.addEventListener('pointercancel', soltar); g.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') soltar(); });
}

/* ---- saúde financeira (E.saudeFinanceira): nota de 0 a 100 e quatro indicadores, cada um com o que significa e onde agir ---- */
function basSaude(ult) { const g = objFoco(objAnalise()); return E.saudeFinanceira({ C: S.C, ult, fixosMes: basContas(ult).total, objetivo: g }); }
const BAS_SIT = { ok: 'Em dia', atencao: 'Atenção', baixo: 'Cuidar', sem: 'Sem dados' };
const BAS_OBJ_ST = { concluido: 'concluído', 'no-prazo': 'no prazo', atrasado: 'atrasado', fora: 'fora do alcance', 'sem-prazo': 'sem prazo', 'sem-divisao': 'sem parte do patrimônio', 'sem-valor': 'sem valor' };

/* ---- Perfil: o cartão de membro (inclina com o dedo e vira com um toque, com os seus números atrás), saúde financeira, cor, voz e ajustes ---- */
function basPerfil() {
  const p = S.profile; const t = p.prefs.tema; const k = typeof temaCustom === 'function' ? temaCustom() : { cor: '' }; const custom = t === 'custom' || (t === 'auto' && p.prefs.manual === 'custom');
  const desde = (p.criadoEm && /^\d{4}/.test(p.criadoEm)) ? p.criadoEm.slice(0, 4) : String(S.year); const C = S.C; const ult = S.year === NOW_Y ? NOW_M : 11;
  const H = basSaude(ult);
  const num = String((p.email || p.nome || 'aven').split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 10000).padStart(4, '0');
  const membro = `<div class="bas-membro-w"><div class="bas-membro${S.basVirado ? ' virado' : ''}" data-act="bas-virar" role="button" tabindex="0" aria-label="Cartão de membro. Toque para virar.">
    <div class="bas-membro-in"><div class="bas-membro-f"><span class="bas-membro-holo" aria-hidden="true"></span><span class="bas-membro-t"><span class="bas-membro-m" aria-hidden="true">${LOGO}</span><span class="bas-membro-pl${basPago() ? ' foil' : ''}">${esc(planLabel().replace(/^Plano /, ''))}</span></span>
      <span class="bas-membro-chip" aria-hidden="true"></span><span class="bas-membro-num" aria-hidden="true">•••• •••• •••• ${num}</span><span class="bas-membro-n">${esc(p.nome || 'Minha conta')}</span>
      <span class="bas-membro-pe"><span><small>Membro desde</small><b>${esc(desde)}</b></span><span><small>Saúde</small><b>${H.nota == null ? '–' : H.nota}</b></span><span class="bas-membro-nfc" aria-hidden="true">${CC_NFC}</span></span></div>
    <div class="bas-membro-v"><span class="bas-membro-faixa" aria-hidden="true"></span><div class="bas-membro-st"><span><small>Patrimônio</small><b>${brl0(C.patrimonio[ult])}</b></span><span><small>Guardou no ano</small><b>${C.T.poupanca != null ? pct(C.T.poupanca) : '–'}</b></span>
      <span><small>Investido no ano</small><b>${brl0(C.T.aplicado)}</b></span><span><small>Sonhos</small><b>${objLista().length}</b></span></div><span class="bas-membro-dica">Toque para virar</span></div></div></div></div>`;
  const conq = basSaudeResumo(H);
  const cores = `<div class="bas-cores" role="group" aria-label="Cor do app">${CORES_DESTAQUE.map(([c, n]) => `<button style="--c:${c}" data-act="bas-cor" data-v="${c}" aria-label="${n}" aria-pressed="${custom && k.cor && k.cor.toLowerCase() === c.toLowerCase()}"></button>`).join('')}</div>`;
  const temas = [['auto', 'Automático'], ['light', 'Claro'], ['oled', 'Escuro']].map(([v, l]) => `<button${t === v ? ' class="on"' : ''} data-act="bas-tema" data-v="${v}" aria-pressed="${t === v}">${l}</button>`).join('');
  const vozes = Object.keys(VOZES).map((v) => `<button class="bas-voz${tomAtual() === v ? ' on' : ''}" data-act="voz" data-voz="${v}" aria-pressed="${tomAtual() === v}"><b>${VOZES[v].nome}</b><small>${esc(VOZ[v].bas_disp_sim || '')}</small></button>`).join('');
  const modo = basEscolhe() ? basCard(`<div class="bas-op">${basNome('Versão do Cifrão', `${BAS_NOMES.basico}: no jeito de celular. ${BAS_NOMES.completo}: o painel completo, com todas as telas.`)}${basTrocaHtml()}</div>`) : '';
  const st = S.plan.settings; const plano = `<button class="card bas-pj-bt" ${basIr('planejamento')}><span class="bas-pj-bic" aria-hidden="true">${I_PLANO}</span><span class="bas-n"><b>Planejamento</b><small>Metas, limites, minhas instituições e anos</small></span>${I.chev}
    <span class="bas-pj-res"><span><small>Investir</small><b>${+st.metaAporte > 0 ? brl0(st.metaAporte) : '–'}</b></span><span><small>Gastar até</small><b>${+st.orcPadrao > 0 ? brl0(st.orcPadrao) : '–'}</b></span><span><small>Instituições</small><b>${instMinhas().length}</b></span></span></button>`;
  const cli = S.isAdmin && Store.mode === 'cloud' ? basSecao('Consultor', '', `<ul class="bas-ativ">${basRow(basIr('clientes'), I.clientes, 'Clientes', 'Cadastros e planos', I.chev)}</ul>`) : '';
  // Perfil no jeito de app: degradê azul no alto com fechar, a foto com a câmera, o nome e "Editar perfil"; embaixo, a folha com as opções em lista
  const lin = (a, icone, nome, dir) => `<li><button class="bas-pf-li" ${a}><span class="bas-pf-ic" aria-hidden="true">${icone}</span><span class="bas-pf-nm">${nome}</span>${dir || ''}${I.chev}</button></li>`;
  const topoPf = `<div class="bas-gt-bg bas-pf-bg"><header class="bas-pf-h"><button class="bas-circ bas-pf-volta" data-act="bas-aba" data-v="${esc(S.basAbaAntes || 'inicio')}" aria-label="Fechar">${I.x}</button><span class="bas-pf-hr">${typeof aberturaPode === 'function' && aberturaPode() ? `<button class="bas-pf-globo" data-act="bas-globo" aria-label="Globo do seu Patrimônio" title="Globo do seu Patrimônio"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/></svg></button>` : ''}</span></header>
    <div class="bas-pf-eu"><label class="bas-pf-av" for="av-file" aria-label="Trocar a foto de perfil">${avatarHtml(p)}<span class="bas-pf-pen" aria-hidden="true">${I_CAM}</span></label><input id="av-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
      <b>${esc(p.nome || 'Você')}</b>${p.email ? `<small>${esc(p.email)}</small>` : ''}</div></div>`;
  const lista = `<ul class="card bas-pf-l">${lin(basIr('perfil'), I.user, 'Dados pessoais')}${lin(basIr('perfil-inv'), I.inv, 'Perfil de investidor', `<small>${esc((S.profile.perfilInvestidor && E.PERFIS[S.profile.perfilInvestidor.resultado] || {}).nome || 'Fazer o teste')}</small>`)}${lin(basIr('planejamento'), I_PLANO, 'Planejamento', `<small>${instMinhas().length} ${instMinhas().length === 1 ? 'banco' : 'bancos'}</small>`)}${lin(basIr('config'), I_ENG, 'Configurações')}</ul>`;
  return `<div class="bas-pg bas-pg-p">${topoPf}<div class="bas-gt-folha bas-pf-folha">${lista}${basPlanoCard()}
    ${modo ? basSecao('Versão', '', modo) : ''}
    ${cli}<ul class="bas-ativ bas-sair"><li><button data-act="bas-sair">${basNome('Sair')}</button></li></ul></div></div>`;
}

/* ---- Assistente com os avisos (o sino agora mora aqui): abas Conversa e Avisos ---- */
function basAvisosLista() {
  const L = typeof notifLista === 'function' ? notifLista() : []; const novos = L.filter((n) => !n.lida).length;
  return `${novos ? `<button class="btn bas-cta bas-add" data-act="bas-avisos-lidos">${I.check}Marcar todos como lidos</button>` : ''}
    ${L.length ? `<ul class="bas-avisos">${L.map((n) => `<li class="${n.lida ? 'lida' : ''} ${esc(n.nivel || '')}"><button data-act="bas-aviso" data-id="${esc(n.id)}"><span class="bas-ini" aria-hidden="true">${I_SINO}</span><span class="bas-n"><b>${esc(n.titulo || '')}</b><small>${esc(n.texto || '')}</small></span>${n.cta ? I.chev : ''}</button></li>`).join('')}</ul>` : basCard(basVazio('Nenhum aviso agora. Tudo em dia.'))}`;
}
/* ---------- Dúvidas: guias passo a passo pela tela (motor em tour.js, tourIniciar) ---------- */
// leva à aba e, se preciso, abre uma tela; espera o voltar do histórico de basLimpar antes de empilhar a tela nova
function basGuiaIr(aba, tela, o) {
  return () => { const tinha = basPilha().length; basLimpar(); S.basAba = aba; if (!tela) { render(); window.scrollTo(0, 0); return; }
    const abre = () => basAbrir(tela, o || {}); if (tinha) { render(); setTimeout(abre, 260); } else abre(); };
}
const BAS_SALVAR = '.bas-salvar .bas-cta';
// k: começos de palavra que, numa pergunta de ajuda, apontam para o guia ("escond" vale para esconder e escondo)
const BAS_GUIAS = [
  { id: 'gasto', t: 'Como registro um gasto?', k: ['gasto', 'gastei', 'despesa', 'compra', 'comprei', 'lancar', 'anotar', 'paguei', 'conta fixa', 'parcel'], passos: [
    { ir: basGuiaIr('gastos'), s: '.bas-inv-pl[data-t="gasto"]', t: 'Novo gasto', d: 'Em Gastos, toque em "+ Gasto" no topo. No Início também tem o botão Novo gasto.' },
    { ir: basGuiaIr('gastos', 'gasto'), s: '.bas-fs:has([name="tipo"])', t: 'Como é o gasto', d: 'Uma vez, todo mês ou parcelado. Todo mês vira uma conta fixa; parcelado divide o total pelos meses.' },
    { s: '[name="valor"]', t: 'Valor', d: 'Quanto saiu.' },
    { s: '[name="desc"]', t: 'O que foi', d: 'Um nome curto. Se o nome já foi usado, o app lembra a categoria e o banco da última vez.' },
    { s: '.bas-fs:has([name="area"])', t: 'Categoria', d: 'Escolha onde o gasto entra ou crie uma categoria nova.' },
    { s: '.bas-fs:has([name="inst"])', t: 'Pago com', d: 'O banco ou cartão usado. Ele aparece em Seus cartões, na aba Gastos.' },
    { s: BAS_SALVAR, t: 'Salvar', d: 'Pronto: o gasto entra no mês, no limite e nos seus números.' }] },
  { id: 'entrada', t: 'Como registro uma entrada, como o salário?', k: ['entrada', 'salario', 'receita', 'renda', 'recebi', 'ganhei', 'freela', 'bonus'], passos: [
    { ir: basGuiaIr('inicio'), s: '.bas-noite [data-t="entradas"]', t: 'Entrou', d: 'No Início, toque em Entrou para ver todas as entradas do período.' },
    { ir: basGuiaIr('inicio', 'entradas'), s: '.bas-inv-pl[data-t="entrada"]', t: 'Nova entrada', d: 'Aqui você registra salário, freela, aluguel recebido ou qualquer dinheiro que entrou.' },
    { ir: basGuiaIr('inicio', 'entrada'), s: '[name="valor"]', t: 'Valor e tipo', d: 'Diga quanto entrou e se é renda fixa (todo mês) ou extra.' },
    { s: BAS_SALVAR, t: 'Salvar', d: 'A entrada soma no que sobrou do mês e no quanto dá para investir.' }] },
  { id: 'investimento', t: 'Como registro um investimento?', k: ['investimento', 'investi', 'aporte', 'aportar', 'aplicar', 'apliquei', 'resgat', 'tesouro', 'cdb', 'acao', 'acoes'], passos: [
    { ir: basGuiaIr('inicio'), s: '.bas-bt.prim[data-t="aporte"]', t: 'Investimento', d: 'No Início (ou no topo de Investir), toque em Investimento.' },
    { ir: basGuiaIr('inicio', 'aporte'), s: '.bas-fs:has([name="modo"])', t: 'Aplicar ou resgatar', d: 'Aplicar quando colocou dinheiro; resgatar quando tirou.' },
    { s: '.bas-fs:has([name="ativo"])', t: 'Ativo', d: 'Escolha um que você já tem ou cadastre um novo, com nome e tipo.' },
    { s: '.bas-fs:has([name="mes"])', t: 'Mês', d: 'O mês em que o dinheiro foi aplicado.' },
    { s: BAS_SALVAR, t: 'Salvar', d: 'O aporte conta na sua meta, no patrimônio e na sequência.' }] },
  { id: 'periodo', t: 'Como vejo outro mês ou período?', k: ['mes passado', 'outro mes', 'periodo', 'ano passado', 'trimestre', 'semestre', 'meses', 'calendario', 'trocar o mes'], passos: [
    { ir: basGuiaIr('inicio'), s: '.bas-per', t: 'Período', d: 'Toque aqui para escolher o mês, vários meses ou o ano. Vale para Início, Gastos e Investir.' },
    { ir: basGuiaIr('inicio', 'periodo'), s: '[data-act="bas-per-at"]', t: 'Atalhos', d: 'Este mês, 3 meses, 6 meses ou o ano todo, num toque.' },
    { s: '.bas-per-m', t: 'Calendário', d: 'Toque no mês de início e depois no de fim.' },
    { s: '[data-act="bas-ano"]', t: 'Ano', d: 'Troque de ano ou abra o próximo.' }] },
  { id: 'olho', t: 'Como escondo os valores?', k: ['escond', 'ocult', 'olho', 'em publico', 'mostrar os valores', 'mostrar valores'], passos: [
    { ir: basGuiaIr('inicio'), s: '.bas-noite .olho', t: 'Olho', d: 'Toque no olho e os valores em reais ficam ocultos em todas as telas. Toque de novo para mostrar.' }] },
  { id: 'limite', t: 'Como defino um limite de gastos?', k: ['limite', 'orcamento', 'teto', 'gastar menos', 'controlar gastos'], passos: [
    { ir: basGuiaIr('gastos'), s: '.bas-roda-lim', t: 'Limite do mês', d: 'Em Gastos, toque em Definir limite. O anel de fora mostra quanto já usou.' },
    { s: '.bas-onde-a', t: 'Por categoria', d: 'Toque numa categoria para ver os gastos dela e definir um limite só para ela.' },
    { ir: basGuiaIr('perfil'), s: '.bas-pj-bt', t: 'Planejamento', d: 'Todos os limites, a meta de investimento e os bancos também ficam em Perfil › Planejamento.' }] },
  { id: 'sonho', t: 'Como crio um sonho?', k: ['sonho', 'objetivo', 'meta de', 'viagem', 'casa propria', 'carro', 'juntar', 'guardar para'], passos: [
    { ir: basGuiaIr('investir'), s: '.bas-sn.novo', t: 'Novo sonho', d: 'Em Investir, no carrossel Seus sonhos, toque em Novo sonho.' },
    { ir: basGuiaIr('investir', 'objetivo'), s: '.bas-fs:has([name="tipo"])', t: 'Qual é o sonho', d: 'Escolha o tipo: viagem, casa, carro, aposentadoria e outros.' },
    { s: '[name="valor"]', t: 'Quanto custa', d: 'O valor que você quer juntar.' },
    { s: '[name="ano"]', t: 'Até quando', d: 'O ano em que quer chegar lá. O app mostra se o ritmo de hoje chega.' },
    { s: BAS_SALVAR, t: 'Salvar', d: 'O sonho aparece no Início e em Investir, com o quanto falta.' }] },
  { id: 'importar', t: 'Como importo o extrato do banco?', k: ['importar', 'extrato', 'ofx', 'csv', 'planilha', 'arquivo do banco', 'b3'], passos: [
    { ir: basGuiaIr('gastos'), s: '[data-act="bas-importar"]', t: 'Importar', d: 'Envie o arquivo do extrato (OFX ou CSV) ou o relatório da B3. Você confere tudo antes de gravar, e nada entra repetido.' }] },
  { id: 'ondefoi', t: 'Como vejo para onde foi o meu dinheiro?', k: ['para onde', 'onde gasto', 'onde gastei', 'categoria', 'raio', 'gastando muito', 'maior gasto'], passos: [
    { ir: basGuiaIr('gastos'), s: '.bas-roda, [data-act="bas-arco"]', t: 'O anel', d: 'Cada cor é uma categoria. Toque para ver o valor no centro; toque de novo para abrir.' },
    { s: '.bas-rx', t: 'Raio-X', d: 'A análise do ano: categorias que mais pesam, gastos que se repetem e o ritmo.' },
    { s: '.bas-cc-c', t: 'Seus cartões', d: 'Os gastos separados por banco. Toque num cartão para ver só os dele.' }] },
  { id: 'sequencia', t: 'O que é a sequência e as medalhas?', k: ['sequencia', 'constelacao', 'medalha', 'estrela', 'ofensiva', 'galaxia', 'escudo'], passos: [
    { ir: basGuiaIr('inicio'), s: '.bas-sq', t: 'Sequência', d: 'Meses seguidos em que você investiu qualquer valor. Toque para abrir.' },
    { ir: basGuiaIr('inicio', 'sequencia'), s: '.bas-sqx', t: 'Sua estrela', d: 'A cor muda com o nível: bronze, prata, ouro, platina e diamante.' },
    { s: '.bas-gx-h', t: 'Sua galáxia', d: 'Cada mês acende uma estrela de uma constelação real. Completa, ela entra na galáxia.' },
    { s: '.bas-esc', t: 'Medalhas', d: 'Uma a cada marco. Toque numa conquistada para ver de perto, girar e virar.' }] },
  { id: 'organizar', t: 'Como organizo a tela inicial?', k: ['organizar', 'widget', 'ordem', 'tirar bloco', 'personalizar', 'mudar o inicio', 'adicionar bloco'], passos: [
    { ir: basGuiaIr('inicio'), s: '.bas-org', t: 'Organizar esta tela', d: 'No fim de cada aba. Arraste pela alça para mudar a ordem, tire o que não usa e coloque blocos novos.' }] },
  { id: 'cor', t: 'Como mudo a cor ou o tema?', k: ['cor', 'tema', 'modo escuro', 'modo claro', 'aparencia', 'jeito de falar', 'voz'], passos: [
    { ir: basGuiaIr('perfil'), s: '.bas-pf-cfg', t: 'Configurações', d: 'A engrenagem no alto do Perfil.' },
    { ir: basGuiaIr('perfil', 'config-ap'), s: '.bas-ap-seg', t: 'Aparência', d: 'O tema, a cor do topo, o tamanho do texto e o estilo dos cantos.' },
    { s: '.bas-voz', t: 'Jeito de falar', d: 'Consultivo, Direto ou Acolhedor. Muda os textos; os números são sempre os mesmos.' }] },
  { id: 'saude', t: 'O que é a saúde financeira?', k: ['saude', 'nota', 'rostinho', 'reserva de emergencia', 'estou bem'], passos: [
    { ir: basGuiaIr('inicio', 'saude'), s: '.bas-sdx', t: 'Saúde financeira', d: 'Uma nota de 0 a 100 pela reserva, pela sobra do ano, pelas contas fixas e pelo seu sonho. Toque para ver cada ponto e o que fazer.' }] },
  { id: 'globo', t: 'O que é o globo?', k: ['globo', 'universo', 'patrimonio total'], passos: [
    { ir: basGuiaIr('inicio'), s: '.bas-globo-btn', t: 'Seu universo', d: 'O seu patrimônio em forma de globo: classes da carteira, aportes e dividendos. Ele abre sozinho ao entrar e por este botão.' }] },
  { id: 'assistente', t: 'O que o assistente faz?', k: ['assistente', 'aviso', 'notificacao', 'sino', 'inteligencia'], passos: [
    { ir: basGuiaIr('inicio'), s: '.bas-noite .ia-btn', t: 'Assistente', d: 'Pergunte sobre o seu dinheiro, veja os avisos do mês e, em Dúvidas, peça o caminho de qualquer coisa no app.' }] },
  { id: 'carteira', t: 'Como vejo a carteira e os proventos?', k: ['carteira', 'provento', 'dividendo', 'alvo', 'divisao', 'rebalance'], pago: true, passos: [
    { ir: basGuiaIr('investir'), s: '.bas-circ[data-t="proventos"]', t: 'Proventos', d: 'Os dividendos e juros recebidos, mês a mês.' },
    { s: '.bas-circ[data-t="carteira"]', t: 'Minha carteira', d: 'Como os investimentos estão divididos e onde aportar para chegar nos seus alvos.' }] },
  { id: 'cartao', t: 'Como personalizo o cartão do banco?', k: ['cartao', 'modelo do cartao', 'personalizar cartao', 'cor do cartao'], passos: [
    { ir: basGuiaIr('gastos'), s: '.bas-cc-c', t: 'Seus cartões', d: 'Toque num cartão para ver os gastos dele. Lá, a engrenagem ao lado do olho escolhe o modelo e a cor.' }] },
  { id: 'dados', t: 'Como baixo ou apago os meus dados?', k: ['baixar', 'backup', 'excluir', 'apagar', 'meus dados', 'lgpd', 'privacidade', 'cancelar conta'], passos: [
    { ir: basGuiaIr('perfil', 'config-priv'), s: '[data-act="backup"]', t: 'Baixar meus dados', d: 'Uma cópia de tudo, num arquivo.' },
    { s: '[data-t="privacidade"]', t: 'Privacidade e termos', d: 'O que fazemos com os seus dados.' },
    { ir: basGuiaIr('perfil', 'config-seg'), s: '[data-t="excluir"]', t: 'Excluir minha conta', d: 'Apaga a conta e todos os dados, depois de confirmar.' }] },
];
const basGuias = () => BAS_GUIAS.filter((g) => !g.pago || basPago());
const basSemAcento = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// pergunta de ajuda sobre o app ("como", "onde", "o que é"...) vira o guia de mais palavras em comum
function basGuiaAchar(q) {
  const t = basSemAcento(q); if (!/\b(como|onde|cade|o que e|pra que|para que|nao (sei|acho|consigo)|ajuda|consigo|da pra|tem como|mostra)\b/.test(t)) return null;
  // só é dúvida de uso do app com um verbo de ação ("onde mais gastei?" é pergunta sobre o dinheiro, não guia)
  if (!/\b(registr|lanc|anot|adicion|coloc|cri|defin|import|escond|mud|troc|vej|ver\b|abr|edit|exclu|apag|organiz|mex|us[ao]r?\b|faz|fac)/.test(t)) return null;
  let melhor = null; let max = 0; basGuias().forEach((g) => { const n = g.k.filter((k) => new RegExp(`\\b${k}`).test(t)).length; if (n > max) { max = n; melhor = g; } });
  return melhor;
}
function basGuiaIniciar(id) {
  const g = basGuias().find((x) => x.id === id); if (!g || typeof tourIniciar !== 'function') return; basSom('toque');
  tourIniciar(g.passos.map((p) => Object.assign({}, p)), 'Entendi');
}
// Dúvidas: busca solta no alto e os guias numa lista agrupada, cada um com o ícone do assunto numa cor própria
const basDvIc = () => ({ gasto: [I_GASTO, '#FF6B5E'], entrada: [I_ENTRADA, '#2FBF71'], investimento: [I_APLICAR, '#3D7BFF'], periodo: [I_ANO, '#7C5CFF'], olho: [I.lock, '#8E8E93'],
  limite: [I_META, '#FF9F0A'], sonho: [I_REC, '#EC4899'], importar: [I_IMPORTAR, '#14B8A6'], ondefoi: [I_RAIOX, '#F97316'], sequencia: [I_REC, '#EAB308'], organizar: [I_ORDEM, '#6366F1'],
  cor: [I_TEMA, '#A855F7'], saude: [I.check, '#22C55E'], globo: [I.geral, '#0EA5E9'], assistente: [I.chat, '#3D7BFF'], carteira: [I_CART, '#8B5CF6'], cartao: [I.despesas, '#64748B'], dados: [I.lock, '#475569'] });
function basDuvidasHtml() {
  const M = basDvIc(); const ic = (id) => { const [svg, cor] = M[id] || [I.chat, '#3D7BFF']; return `<span class="bas-dv-ic" style="--c:${cor}" aria-hidden="true">${svg}</span>`; };
  return `<label class="bas-dv-b">${typeof I_LUPA !== 'undefined' ? I_LUPA : ''}<input type="search" placeholder="Qual é a sua dúvida?" aria-label="Procurar uma dúvida" data-bas-dv></label>
    <p class="bas-dv-p">Escolha uma e eu mostro o caminho na tela, passo a passo.</p>
    <ul class="card bas-dv-l">${basGuias().map((g) => `<li data-k="${esc(basSemAcento(g.t + ' ' + g.k.join(' ')))}"><button data-act="bas-guia" data-id="${g.id}">${ic(g.id)}<span class="bas-n"><b>${esc(g.t)}</b><small>${g.passos.length === 1 ? '1 passo' : `${g.passos.length} passos`}</small></span>${I.chev}</button></li>`).join('')}</ul>
    <p class="bas-p bas-dv-nada" hidden>Nada com esse nome. Tente outra palavra ou pergunte na Conversa.</p>`;
}
// filtra a lista de dúvidas enquanto digita (sem render)
function basDvLigar() {
  const i = document.querySelector('[data-bas-dv]'); if (!i || i.dataset.lig) return; i.dataset.lig = '1';
  i.addEventListener('input', () => { const ws = basSemAcento(i.value).trim().split(/\s+/).filter(Boolean); let n = 0;
    document.querySelectorAll('.bas-dv-l li').forEach((li) => { const ok = ws.every((w) => li.dataset.k.includes(w)); li.hidden = !ok; if (ok) n++; }); document.querySelector('.bas-dv-nada').hidden = !!n; });
}
// tela do assistente no jeito dos apps de IA: escura, com o brilho azul no alto, o selo do assistente no centro,
// dois cartões com números do mês, as sugestões e a caixa de pergunta embaixo; Avisos e Dúvidas ficam nos botões do alto
const I_IA_ASTER = ic('<path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2M5.6 18.4l3.2-3.2M15.2 8.8l3.2-3.2"/>');
const I_IA_SINO = ic('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>');
const I_IA_ENV = ic('<path d="M4 12 20 4l-6 16-2.5-6.5z"/><path d="M11.5 13.5 20 4"/>');
// tela de avisos, feita do zero: cabeçalho com voltar e "marcar tudo como lido", os novos em destaque e os já vistos embaixo;
// cada aviso num cartão com o ícone na cor do nível, o título, o texto e, se houver, o atalho para resolver
const BAS_AV_NIVEL = { critico: ['neg', '!'], alerta: ['warn', '!'], atencao: ['warn', '!'], info: ['acc', 'i'], ok: ['pos', '✓'] };
function basTelaAvisosNova() {
  const L = typeof notifLista === 'function' ? notifLista() : []; const novos = L.filter((n) => !n.lida); const vistos = L.filter((n) => n.lida);
  const item = (n) => { const [cor, sim] = BAS_AV_NIVEL[n.nivel] || BAS_AV_NIVEL.info;
    return `<li><button class="bas-av2-i${n.lida ? ' lida' : ''}" data-act="bas-aviso" data-id="${esc(n.id)}"><span class="bas-av2-ic ${cor}" aria-hidden="true">${sim}</span><span class="bas-av2-t"><b>${esc(n.titulo || '')}</b><small>${esc(n.texto || '')}</small>${n.cta ? `<em>${esc(n.cta.rotulo || 'Ver')} ${I.chev}</em>` : ''}</span>${n.lida ? '' : '<i class="bas-av2-pt" aria-label="Novo"></i>'}</button></li>`; };
  const grupo = (t, l) => (l.length ? `<h2 class="bas-av2-g">${t}<span>${l.length}</span></h2><ul class="bas-av2-l">${l.map(item).join('')}</ul>` : '');
  return `<div class="bas-av2"><header class="bas-av2-h"><button class="bas-circ bas-pf-volta" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button>${novos.length ? '<button class="bas-av2-lidos" data-act="bas-avisos-lidos">Marcar tudo como lido</button>' : ''}</header>
    <h1 class="bas-av2-tit">Avisos</h1><p class="bas-av2-sub">${novos.length ? `${novos.length} ${novos.length === 1 ? 'novo' : 'novos'} para você` : 'Tudo em dia por aqui'}</p>
    ${L.length ? grupo('Novos', novos) + grupo('Vistos', vistos) : `<div class="bas-av2-vazio"><span aria-hidden="true">✓</span><b>Nenhum aviso agora</b><small>Quando algo precisar de você, aparece aqui.</small></div>`}</div>`;
}
function basIaTela() {
  const C = S.C; const j = basJan(); const D = E.disponivelAporte({ C, mes: j.de, ate: j.ate, metaMes: C.metaAporteMes }); const sai = basSomaJ(C.despesas); const av = basAvisosNovos();
  const st = iaEstado(); const ult = st.msgs.slice().reverse().find((m) => m.de === 'eu');
  const card = (q, rot, val, ic0) => `<button class="bas-iax-c" data-act="ia-perg" data-q="${esc(q)}"><small>${esc(rot)}</small><b>${val}</b><span class="bas-iax-cr"><span class="bas-iax-ci" aria-hidden="true">${ic0}</span><span class="bas-iax-ca" aria-hidden="true">${I.chev}</span></span></button>`;
  // sem conversa: saudação e três faixas de perguntas que deslizam (alternando o sentido); com conversa, as respostas trazem o ícone do app
  const MQ = [[['resumo', I.geral, '#3E6BFF'], ['gastos', I.despesas, '#FF7A59'], ['compra', I.cart, '#B06BFF'], ['previsao', I.up, '#2FB57A'], ['fixos', I.rendas, '#F5A623']],
    [['aporte', I.inv, '#2FB57A'], ['carteira', I.cart, '#3E6BFF'], ['proventos', I.pro, '#F5A623'], ['patrimonio', I.up, '#B06BFF'], ['objetivos', I.check, '#FF5A8A']],
    [['dicas', I.chat, '#B06BFF'], ['reserva', I.lock, '#3E6BFF'], ['produto', I.geral, '#2FB57A'], ['divida', I.despesas, '#FF7A59'], ['renda_extra', I.rendas, '#F5A623']]];
  const chip = ([k, ic0, cor]) => { const q = E.IA_FICHAS[k] || ''; const w = q.split(' '); return `<button class="bas-iax-ch" data-act="ia-perg" data-q="${esc(q)}" style="--c:${cor}"><span class="bas-iax-chi" aria-hidden="true">${ic0}</span><b>${esc(w.slice(0, 2).join(' '))}</b> <em>${esc(w.slice(2).join(' '))}</em></button>`; };
  const nome = String((S.profile && (S.profile.apelido || S.profile.nome)) || '').trim().split(/\s+/)[0];
  const ola = `<div class="bas-iax-ola"><h2>Oi${nome ? `, <span>${esc(nome)}</span>` : ''}</h2><p>Pergunte o que quiser sobre o seu dinheiro.</p></div>
    <div class="bas-iax-mq" role="group" aria-label="Sugestões de perguntas">${MQ.map((r, i) => `<div class="bas-iax-mr${i % 2 ? ' volta' : ''}"><div>${r.map(chip).join('')}${r.map(chip).join('').replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ')}</div></div>`).join('')}</div>`;
  return `<div class="bas-iax" style="--ico:url('${new URL('assets/img/icon-192.png', document.baseURI).href}')"><span class="bas-iax-brilho" aria-hidden="true"></span>
    <header class="bas-iax-h"><button class="bas-iax-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><span class="bas-iax-hr"><button class="bas-iax-b" ${basIr('duvidas')} aria-label="Dúvidas">?</button><button class="bas-iax-b" ${basIr('avisos-tela')} aria-label="Avisos${av ? `: ${av} novos` : ''}">${I_IA_SINO}${av ? '<i class="bas-iax-pt"></i>' : ''}</button></span></header>
    <div class="bas-iax-topo"><span class="bas-iax-orb" aria-hidden="true"><span class="cifrao" data-sem-giro></span></span><p class="bas-iax-st" aria-live="polite"><span class="ok" data-cif-st>Como posso ajudar?</span><span class="pe">Pensando…</span></p></div>
    ${ola}
    <div class="ia-log bas-iax-log" data-ia-log="b" role="log" aria-live="polite">${st.msgs.length ? iaLogHtml('b') : ''}</div>
    <div class="bas-iax-cs">${card(E.IA_FICHAS.aporte, 'Dá para investir', basCent(D.disponivel), I.inv)}${card(E.IA_FICHAS.gastos, `Gastou ${basJanFrase()}`, basCent(sai), I.despesas)}</div>
    <div class="ia-fichas bas-iax-fi" data-ia-fichas role="group" aria-label="Sugestões de perguntas">${iaFichasHtml()}</div>
    <form class="ia-f bas-iax-f" data-form="ia" autocomplete="off"><input name="q" maxlength="300" placeholder="${ult ? esc(ult.txt) : 'Pergunte sobre o seu dinheiro'}" aria-label="Pergunta para o assistente" enterkeyhint="send">
      <span class="bas-iax-fr"><button type="button" class="bas-iax-mais" data-act="ia-mais" aria-label="Mais perguntas">${I.plus}</button><span class="bas-iax-mod">${esc(CFG.marca || '')} Intelligence</span><button type="button" class="bas-iax-voz" ${basIr('voz')} aria-label="Conversar por voz com o Cifrão">${I_MIC}</button><button class="bas-iax-env" aria-label="Enviar">${I_IA_ENV}</button></span></form></div>`;
}
function basTelaIa() {
  const aba = ['avisos', 'duvidas'].includes(S.basIaAba) ? S.basIaAba : 'conversa'; const av = basAvisosNovos();
  if (aba === 'conversa') { S.iaComecou = true; return basIaTela(); }
  const abas = `<div class="seg bas-ia-abas" role="tablist">${[['conversa', 'Conversa'], ['avisos', `Avisos${av ? ` <em>${av}</em>` : ''}`]].map(([v, l]) => `<button role="tab" class="${aba === v ? 'on' : ''}" data-act="bas-ia-aba" data-v="${v}" aria-selected="${aba === v}">${l}</button>`).join('')}</div>`;
  const duv = `<button class="bas-circ bas-ia-duv${aba === 'duvidas' ? ' on' : ''}" data-act="bas-ia-aba" data-v="${aba === 'duvidas' ? 'conversa' : 'duvidas'}" aria-label="Dúvidas" aria-pressed="${aba === 'duvidas'}">?</button>`;
  return basDet(`Assistente ${esc(CFG.marca || '')}`, `${aba === 'duvidas' ? '' : abas}${aba === 'avisos' ? basAvisosLista() : aba === 'duvidas' ? basDuvidasHtml() : `<section class="card ia-card bas-ia">${S.iaComecou ? `${iaConversaHtml('b')}<p class="ia-disc disc">Respostas automáticas a partir do seu planejamento, sem indicação de investimentos.</p>` : iaIntroHtml()}</section>`}`, duv).replace(olhoHtml(), '');
}

// depois de cada desenho do App (chamado no drawAll): objeto 3D, gráfico que segue o dedo e o cartão que inclina
// contagem: o patrimônio do Início sobe até o valor na primeira abertura da sessão (com o olho aberto) e, no recorde, ganha um brilho
function basContar() {
  const el = document.querySelector('.bas-noite-v[data-conta]'); if (!el || S.basContou || oculto() || matchMedia('(prefers-reduced-motion: reduce)').matches) return; S.basContou = true;
  const alvo = +el.dataset.conta || 0; const de = alvo * 0.82; const t0 = performance.now(); const dur = 1100;
  const passo = (t) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.innerHTML = basCent(de + (alvo - de) * e); if (k < 1 && el.isConnected) requestAnimationFrame(passo); else if (el.classList.contains('recorde')) { el.classList.add('celebra'); basVibra([10, 40, 10]); } };
  requestAnimationFrame(passo);
}
// cartões 3D: inclinam com o dedo ou o mouse e com o movimento do celular (no iPhone, a permissão é pedida no primeiro toque num cartão)
let basGiroOk = false;
function basGiroCartoes(e) { const cs = document.querySelectorAll('.bas-cc-c:not(.bas-cc-mini), .bas-membro, .bas-esc .bas-mx.on'); if (!cs.length || e.gamma == null) return;
  const ry = Math.max(-1, Math.min(1, e.gamma / 30)) * 10; const rx = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30)) * -8;
  cs.forEach((c) => { if (c.classList.contains('mexe')) return; c.style.setProperty('--ry', ry.toFixed(2) + 'deg'); c.style.setProperty('--rx', rx.toFixed(2) + 'deg'); c.style.setProperty('--hx', (50 + ry * 4).toFixed(1) + '%'); }); }
function basCartoes3d() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!basGiroOk && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') { basGiroOk = true; window.addEventListener('deviceorientation', basGiroCartoes, { passive: true }); }
  // medalhas: inclinam com o dedo (também no toque), o mouse e o celular; o brilho segue a luz
  document.querySelectorAll('.bas-esc .bas-mx.on').forEach((c) => { if (c.dataset.tilt) return; c.dataset.tilt = '1';
    const mover = (e) => { const r = c.getBoundingClientRect(); const x = Math.max(-.5, Math.min(.5, (e.clientX - r.left) / r.width - 0.5)); const y = Math.max(-.5, Math.min(.5, (e.clientY - r.top) / r.height - 0.5));
      c.style.setProperty('--ry', (x * 34).toFixed(2) + 'deg'); c.style.setProperty('--rx', (-y * 30).toFixed(2) + 'deg'); c.style.setProperty('--hx', ((x + 0.5) * 100).toFixed(1) + '%'); c.classList.add('mexe'); };
    const soltar = () => { c.classList.remove('mexe'); ['--rx', '--ry'].forEach((k) => c.style.setProperty(k, '0deg')); };
    c.addEventListener('pointerdown', mover); c.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) mover(e); });
    c.addEventListener('pointerleave', soltar); c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar); });
  document.querySelectorAll('.bas-cc-c:not(.bas-cc-mini)').forEach((c) => { if (c.dataset.tilt) return; c.dataset.tilt = '1';
    const mover = (e) => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5;
      c.style.setProperty('--ry', (x * 18).toFixed(2) + 'deg'); c.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg'); c.style.setProperty('--hx', ((x + 0.5) * 100).toFixed(1) + '%'); c.classList.add('mexe'); };
    const soltar = () => { c.classList.remove('mexe'); ['--rx', '--ry'].forEach((k) => c.style.setProperty(k, '0deg')); };
    c.addEventListener('pointerdown', () => { if (!basGiroOk && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then((r) => { if (r === 'granted' && !basGiroOk) { basGiroOk = true; window.addEventListener('deviceorientation', basGiroCartoes, { passive: true }); } }).catch(() => {}); }, { passive: true });
    c.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') mover(e); }); c.addEventListener('pointerleave', soltar); c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar); });
}
// uma vez por sessão, no Início: a retrospectiva do mês que passou (até o dia 7, uma vez por mês) ou a conquista de um marco novo da sequência
function basSurpresas() {
  if (S.basSurpresa || (typeof AB !== 'undefined' && AB) || (S.basPilha || []).length || basAba() !== 'inicio' || !S.profile || S.year !== NOW_Y) return; S.basSurpresa = true;
  const chave = `${NOW_Y}-${NOW_M}`; const dia = new Date().getDate();
  if (NOW_M > 0 && dia <= 7 && S.profile.retroVista !== chave) { S.profile.retroVista = chave; touch('profile'); setTimeout(() => basAbrir('retro', { id: NOW_M - 1 }), 900); return; }
}
/* Cifrão do assistente com olhos: olha para o que acontece na tela (o campo enquanto você digita, a sua mensagem,
   a resposta que chega, a ficha tocada, a conversa rolando), pensa enquanto espera e reage ao que a resposta diz. */
const basCifHost = () => document.querySelector('.bas-iax-orb .cifrao');
function basCifOlha(el, corpo) { const h = basCifHost(); if (!h || !el) return; const r = el.getBoundingClientRect ? el.getBoundingClientRect() : el;
  h.dispatchEvent(new CustomEvent('cifrao:olhar', { detail: { x: r.left + (r.width || 0) / 2, y: r.top + (r.height || 0) / 2, corpo } })); }
const basCifFaz = (nome) => { const h = basCifHost(); if (h && h.cifrao) h.cifrao.tocar(nome); };
// lê a resposta como uma pessoa leria: boa notícia, alerta, falta de dados ou neutra; cada tipo tem reações que se alternam
const BAS_CIF_HUMOR = [
  ['aperto', /nao tem sobra|falta[mr]? |atras|sem sobra|apertad/, ['frio', 'timido', 'nao']],
  ['alerta', /passou|acima do limite|a mais do que|estour|negativ|cuidado|gastou mais|fora do padrao|acima da sua media/, ['susto', 'nao', 'surpreso']],
  ['duvida', /nao ha|nao encontrei|registre|sem dados|nao entendi|ainda nao|nao sei/, ['espiada', 'confuso', 'calculando']],
  ['festa', /parab|bateu|batida|recorde|em dia|tudo investido|otim|excelente|cresceu|acima da meta|saudavel|alcanc|conquist/, ['festa', 'orgulho', 'plim', 'comemorando', 'brilha']],
  ['dinheiro', /sobrou r|sobra de|da para investir|disponivel|aport|investi|rendeu|proventos|dividend/, ['plim', 'sim', 'orgulho']],
  ['compra', /compra|objetivo|planejar|sonho/, ['calculando', 'pensando', 'sim']],
];
// o que a pessoa escreve também mexe com ele: agradecer dá carinho, um oi dá pulinhos
const BAS_CIF_PERG = [[/obrigad|valeu|brigad|amei|gostei/, 'carinho'], [/^(oi|ola|bom dia|boa tarde|boa noite)\b/, 'festa']];
let basCifN = 0; let basCifPend = false; let basCifVez = 0;
// a frase ao lado do selo mostra o que ele está fazendo; parado, alterna sugestões curtas
const BAS_CIF_FALA = { aperto: 'Vamos com calma', alerta: 'Opa, olha isso', duvida: 'Hmm, faltou um dado', festa: 'Que notícia boa!', dinheiro: 'Plim! Falando de dinheiro', compra: 'Fazendo as contas' };
const basCifDicas = () => [`Olhando ${basJanFrase()}`, 'Pergunte o que quiser', 'Posso ver seus gastos', 'Quer falar de metas?', 'Dá para investir? Pergunte', 'Toque em mim'];
let basCifStT = 0; let basCifStI = 0;
function basCifFala(txt, depois) {
  const el = document.querySelector('[data-cif-st]'); if (!el) return; clearTimeout(basCifStT);
  if (el.textContent !== txt) { el.classList.remove('troca'); void el.offsetWidth; el.textContent = txt; el.classList.add('troca'); }
  basCifStT = setTimeout(() => { const d = basCifDicas(); basCifFala(d[basCifStI++ % d.length], true); }, depois ? 6500 : 4200);
}
function basCifConversa() {
  if (!basCifHost()) return; const st = iaEstado(); const n = st.msgs.length;
  if (st.pend && !basCifPend) { basCifPend = true; const eu = [...document.querySelectorAll('.bas-iax-log .ia-m.eu')].pop(); basCifOlha(eu, .5);
    const q = basSemAcento((st.msgs[n - 1] && st.msgs[n - 1].txt) || ''); const pq = BAS_CIF_PERG.find(([re]) => re.test(q));
    // enquanto espera: reage ao que foi dito ou faz conta de olho, alternando com o pensar
    setTimeout(() => basCifFaz(pq ? pq[1] : basCifVez++ % 2 ? 'calculando' : 'pensando'), 380); basCifFala(pq && pq[1] === 'carinho' ? 'Eu que agradeço' : 'Pensando…'); }
  if (!st.pend && basCifPend && n > basCifN) {
    basCifPend = false; const m = st.msgs[n - 1]; const resp = [...document.querySelectorAll('.bas-iax-log .ia-m.ia')].pop();
    const t = basSemAcento(m.ai || (m.r ? voz(m.r.chave, iaVars(m.r.vars)) : m.t || ''));
    const h = BAS_CIF_HUMOR.find(([, re]) => re.test(t)); const ops = h ? h[2] : ['piscadela', 'animado', 'curioso'];
    basCifOlha(resp, .8); setTimeout(() => basCifFaz(ops[basCifVez++ % ops.length]), 260); basCifFala(h ? BAS_CIF_FALA[h[0]] : 'Pronto');
  }
  basCifN = n;
}
/* O Cifrão da bolinha lê a tela que abriu e reage ao que vê (olhando para o que chamou a atenção):
   limite estourado em Gastos, patrimônio subindo ou caindo, recorde, valores escondidos. Cada situação tem várias reações, que se alternam. */
const BAS_CIF_VE = { estourou: ['susto', 'nao', 'frio', 'surpreso'], perto: ['calculando', 'espiada', 'pensando'], tranquilo: ['sim', 'plim', 'piscadela'],
  recorde: ['festa', 'orgulho', 'brilha', 'comemorando'], subiu: ['plim', 'orgulho', 'sim', 'festa'], caiu: ['frio', 'timido', 'nao', 'calculando'],
  escondeu: ['timido', 'piscadela'], mostrou: ['espiada', 'curioso'], olhar: ['curioso', 'espiada', 'calculando'] };
let basCifVeSig = ''; let basCifVeN = 0; let basCifVeT = 0;
function basCifVe() {
  const fab = document.querySelector('.bas-ia-fab:not(.vazia)'); const h = fab && fab.querySelector('.cifrao'); if (!h) return; if (!h.cifrao) { setTimeout(basCifVe, 150); return; }
  const topo = basPilha().length ? basPilha()[basPilha().length - 1].t : ''; const sig = [S.basAba, topo, S.privado ? 1 : 0, S.mes, JSON.stringify(S.basPer || '')].join('|');
  if (sig === basCifVeSig) return; const antes = basCifVeSig.split('|'); basCifVeSig = sig;
  clearTimeout(basCifVeT); basCifVeT = setTimeout(() => {
    if (!h.isConnected || !h.cifrao) return; const q = (sel) => document.querySelector(sel);
    let tipo = ''; let alvo = null;
    if (antes.length > 2 && antes[2] !== (S.privado ? '1' : '0')) { tipo = S.privado ? 'escondeu' : 'mostrou'; alvo = q('[data-act="olho"], .bas-olho, [aria-label*="valores"]'); }
    else if ((alvo = q('.bas-gt-chip.neg'))) tipo = 'estourou';
    else if ((alvo = q('.bas-gt-chip.warn'))) tipo = 'perto';
    else if ((alvo = q('.bas-noite-v.recorde'))) tipo = 'recorde';
    else if ((alvo = q('.bas-var-p.neg'))) tipo = 'caiu';
    else if ((alvo = q('.bas-var-p.pos'))) tipo = 'subiu';
    else if ((alvo = q('.bas-gt-chip'))) tipo = 'tranquilo';
    else { alvo = q('#view h1, .bas-noite-v, .bas-gt-v'); tipo = basCifVeN % 3 === 0 ? 'olhar' : ''; }
    if (alvo) h.dispatchEvent(new CustomEvent('cifrao:olhar', { detail: (() => { const r = alvo.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, corpo: .6 }; })() }));
    if (tipo) { const ops = BAS_CIF_VE[tipo]; setTimeout(() => h.cifrao && h.cifrao.tocar(ops[basCifVeN % ops.length]), 300); }
    basCifVeN++;
  }, 650);
}
// o Cifrão solto, quando para em cima de algo, reage ao que está embaixo dele
let basCifSobT = 0;
function basCifSob(w, cx, cy) {
  const agora = Date.now(); if (agora - basCifSobT < 1200) return; basCifSobT = agora;
  const h = w.querySelector('.cifrao'); if (!h || !h.cifrao) return;
  const el = document.elementsFromPoint(cx, cy).find((e) => !w.contains(e) && e !== document.body && e !== document.documentElement); if (!el) return;
  const t = (el.closest('button, li, .card, section') || el).textContent || '';
  const n = basCifVeN++; const pega = (ops) => ops[n % ops.length];
  let r = '';
  if (el.closest('.bas-cc-c, .bas-rc, .bas-gt-c, .bas-cr')) r = pega(['plim', 'carinho', 'orgulho']);
  else if (el.closest('.neg, .bas-gt-chip.neg') || /passou|acima do limite|−\s?R\$/.test(t)) r = pega(['susto', 'nao', 'frio']);
  else if (el.closest('.pos') || /\+\s?R\$|recorde/.test(t)) r = pega(['festa', 'plim', 'sim']);
  else if (el.closest('.bas-tabs, .tabbar')) r = pega(['espiada', 'curioso']);
  else if (/R\$/.test(t)) r = pega(['calculando', 'espiada', 'sim']);
  else if (el.closest('button, a')) r = pega(['curioso', 'espiada']);
  h.dispatchEvent(new CustomEvent('cifrao:olhar', { detail: { x: cx, y: cy + 30, corpo: .4 } }));
  if (r) setTimeout(() => h.cifrao && h.cifrao.tocar(r), 200);
}
function basIaxLigar() {
  const tela = document.querySelector('.bas-iax'); if (!tela || tela.dataset.cif) return; tela.dataset.cif = '1'; basCifN = iaEstado().msgs.length; basCifPend = false;
  let parado = 0; const acorda = () => { clearTimeout(parado); parado = setTimeout(() => { basCifFaz('sonolento'); basCifFala('Zzz… me chame quando quiser'); }, 25000); }; acorda();
  basCifStI = 0; basCifStT = setTimeout(() => basCifFala(basCifDicas()[basCifStI++], true), 3500);
  const selo = tela.querySelector('.bas-iax-orb'); if (selo) selo.addEventListener('click', () => { acorda(); basCifFala(['Oi!', 'Hehe', 'Faz cócegas', 'Estou aqui'][basCifVez++ % 4]); });
  const inp = tela.querySelector('.bas-iax-f input'); let ult = 0;
  if (inp) {
    inp.addEventListener('focus', () => { basCifOlha(inp, .6); basCifFaz('curioso'); acorda(); basCifFala('Estou ouvindo'); });
    // enquanto digita, os olhos acompanham o fim do texto
    inp.addEventListener('input', () => { const agora = Date.now(); acorda(); if (agora - ult < 250) return; ult = agora; if (inp.value.length > 2) basCifFala('Lendo o que você escreve…'); const r = inp.getBoundingClientRect();
      basCifOlha({ left: r.left + Math.min(r.width - 10, 10 + inp.value.length * 8.5), top: r.top + r.height / 2, width: 0, height: 0 }, .35); });
  }
  tela.addEventListener('pointerdown', (e) => { acorda(); const alvo = e.target.closest('.ia-ficha, .bas-iax-c, .bas-iax-b, .bas-iax-env, .btn'); if (alvo) basCifOlha(alvo, .7); }, true);
  const log = tela.querySelector('.bas-iax-log'); let rol = 0;
  if (log) log.addEventListener('scroll', () => { const agora = Date.now(); acorda(); if (agora - rol < 300) return; rol = agora; const r = log.getBoundingClientRect(); basCifOlha({ left: r.left + r.width / 2, top: r.top + r.height * .6, width: 0, height: 0 }, .4); }, { passive: true });
}
function basDesenhar() {
  const st = document.getElementById('bas-o3');
  if (st) { const falhou = () => st.classList.add('sem-3d'); if (typeof o3Ligar === 'function') o3Ligar(st, st.dataset.tipo, falhou); else falhou(); }
  basRlLigar(); basArLigar(); basAhLigar(); basSn2Ligar(); basVozLigar(); basIaxLigar(); basIaxPulo(); basCifVe(); basGfLigar(); basPeriodoRepinta(); { const f = document.querySelector('.bas-form'); if (f && f.querySelector('[name="areaIc"]') && !f.dataset.ic) { f.dataset.ic = '1'; f.addEventListener('change', (e) => { if (e.target.name !== 'area') return; const r = f.querySelector(`[name="areaIc"][value="${basCatIcId(e.target.value)}"]`); if (r) r.checked = true; }); } } { const on = document.querySelector('.bas-cce-m.on'); const col = on && on.parentElement; if (col && !col.dataset.vis) { col.dataset.vis = '1'; col.scrollTop = on.offsetTop - col.clientHeight / 2 + on.offsetHeight / 2; } } basEvLigar(); basRcLigar(); basCtLigar(); basOrgLigar(); basAlSoma(); basHlLigar(); basAtLigar(); basEfLigar(); basCtwLigar(); basOiLigar(); basInvLigar(); basIgLigar(); basGfPickLigar(); basContar(); basCartoes3d(); basMedalhaLigar(); basDvLigar();
  const wr = document.querySelector('.bas-wr'); if (wr && !wr.dataset.lig) { wr.dataset.lig = '1'; basWrIr(wr, 0); }
  const sq = document.querySelector('[data-sq-conta]'); if (sq && !sq.dataset.lig && !matchMedia('(prefers-reduced-motion: reduce)').matches) { sq.dataset.lig = '1'; const alvo = +sq.dataset.sqConta; const t0 = performance.now();
    const passo = (t) => { const k = Math.min(1, (t - t0) / 900); sq.textContent = Math.round(alvo * (1 - Math.pow(1 - k, 3))); if (k < 1 && sq.isConnected) requestAnimationFrame(passo); }; if (alvo > 0) requestAnimationFrame(passo); }
  basSurpresas();
  const c = document.querySelector('.bas-membro');
  if (c && !c.dataset.tilt && !matchMedia('(prefers-reduced-motion: reduce)').matches) { c.dataset.tilt = '1';
    // inclina 1:1 com o dedo ou o mouse, a partir de onde tocou; ao soltar, volta com mola (transição em CSS)
    const mover = (e) => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5;
      c.style.setProperty('--ry', (x * 16).toFixed(2) + 'deg'); c.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg'); c.style.setProperty('--hx', ((x + 0.5) * 100).toFixed(1) + '%'); c.style.setProperty('--hy', ((y + 0.5) * 100).toFixed(1) + '%'); c.classList.add('mexe'); };
    const soltar = () => { c.classList.remove('mexe'); ['--rx', '--ry'].forEach((k) => c.style.setProperty(k, '0deg')); };
    c.addEventListener('pointermove', mover); c.addEventListener('pointerleave', soltar); c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar); }
}

/* ================= telas empilhadas ================= */
// gasto do dia (novo ou editar)
// memória do lançamento: por nome (normalizado), a última categoria, banco, valor e data, e quantas vezes apareceu
function basMemGastos() {
  const ls = [].concat(((S.plans[S.year - 1] || {}).lancamentos) || [], S.plan.lancamentos || []).filter((l) => l && l.desc && +l.valor > 0);
  const mem = new Map(); ls.sort((a, b) => String(a.data).localeCompare(String(b.data))).forEach((l) => { const k = E.norm(l.desc); const x = mem.get(k) || { n: 0 }; mem.set(k, { desc: l.desc, area: l.area || '', inst: l.inst || '', valor: +l.valor, data: l.data, n: x.n + 1 }); });
  return mem;
}
// preenche o formulário com o que lembra daquele nome (categoria, banco e, se vazio, o valor) e mostra a dica
function basGastoLembra(f, x, valor) {
  if (!f || !x) return; const pick = (nome, v) => { const r = v && [...f.querySelectorAll(`input[name="${nome}"]`)].find((i) => i.value === v); if (r) r.checked = true; return !!r; };
  if (!pick('area', x.area) && x.area) f.querySelector('[name="areaNova"]').value = x.area; pick('inst', x.inst);
  const v = f.querySelector('[name="valor"]'); if (valor && v && !v.value) v.value = nf.format(x.valor);
  const d = f.querySelector('.bas-lembra'); if (d) { d.hidden = false; d.textContent = `Da última vez: ${brl(x.valor)} em ${x.area || 'Outros'}${x.inst && instDe(x.inst) ? ' · ' + instDe(x.inst)[1] : ''}.`; }
}
document.addEventListener('input', (e) => { const t = e.target; if (!t.matches || !t.matches('form[data-t="gasto"] input[name="desc"]')) return; const x = basMemGastos().get(E.norm(t.value)); if (x) basGastoLembra(t.form, x, false); });
// Ícones das categorias: cada categoria tem o seu (escolhido pela pessoa ao criar ou editar; sem escolha, sai pelo nome)
const BAS_CAT_IC = {
  comida: ['Comida', '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2.2 1.8-2.6 6.2 0 8v10"/>'],
  mercado: ['Mercado', '<path d="M3 4h2l2.4 11h10.2l2-8H6.2"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>'],
  casa: ['Casa', '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
  carro: ['Transporte', '<path d="M4 16v-3l2-5h12l2 5v3zM4 16v3h3v-3M17 16v3h3v-3"/><circle cx="8" cy="13" r=".9"/><circle cx="16" cy="13" r=".9"/>'],
  saude: ['Saúde', '<path d="M20.4 5.7a5 5 0 0 0-7.1 0L12 7l-1.3-1.3a5 5 0 0 0-7.1 7.1L12 21l8.4-8.2a5 5 0 0 0 0-7.1z"/><path d="M7 12h3l1-2 2 4 1-2h3"/>'],
  lazer: ['Lazer', '<path d="M4 7h16v3.5a2 2 0 0 0 0 3V17H4v-3.5a2 2 0 0 0 0-3zM10 7v10"/>'],
  compras: ['Compras', '<path d="M6 8h12l-1 12.5H7zM9 8V6.5a3 3 0 0 1 6 0V8"/>'],
  contas: ['Contas', '<path d="M6 3h12v18l-2.4-1.6L13.2 21 12 20.2 10.8 21l-2.4-1.6L6 21zM9 8h6M9 12h6M9 16h3"/>'],
  educacao: ['Educação', '<path d="M3 8.5 12 4l9 4.5-9 4.5zM7 10.5V15c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5M21 8.5V14"/>'],
  pessoal: ['Pessoal', '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'],
  coracao: ['Relacionamento', '<path d="M12 20.5C5.5 15.2 3 11.6 3 8.4A4.4 4.4 0 0 1 7.4 4c1.9 0 3.6 1.1 4.6 2.7C13 5.1 14.7 4 16.6 4A4.4 4.4 0 0 1 21 8.4c0 3.2-2.5 6.8-9 12.1z"/>'],
  pet: ['Pets', '<circle cx="6" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M8 17.5c0-2.5 1.8-5 4-5s4 2.5 4 5c0 1.8-1.6 2.5-4 2.5s-4-.7-4-2.5z"/>'],
  viagem: ['Viagem', '<path d="M3 13.5 21 6l-4 14-5.5-5.5zM11.5 14.5 21 6"/>'],
  tech: ['Tecnologia', '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'],
  assin: ['Assinaturas', '<path d="M17 3l3.5 3.5L17 10M4 11V9.5A3 3 0 0 1 7 6.5h13.5M7 21l-3.5-3.5L7 14M20 13v1.5a3 3 0 0 1-3 3H3.5"/>'],
  esporte: ['Esporte', '<path d="M6.5 7v10M17.5 7v10M3.5 10v4M20.5 10v4M6.5 12h11"/>'],
  presente: ['Presentes', '<path d="M4 11h16v10H4zM3 7.5h18V11H3zM12 7.5V21M12 7.5C10.4 5 7 4.6 7 6.4s3.2 1.1 5 1.1c1.8 0 5 .7 5-1.1S13.6 5 12 7.5z"/>'],
  outros: ['Outros', '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>'],
};
const BAS_CAT_NOME = [['comida', /aliment|comida|restaur|lanche|ifood|padaria|cafe/], ['mercado', /mercado|supermerc|feira|hortifr/], ['casa', /moradia|aluguel|casa|condomin|reforma/],
  ['carro', /transp|uber|combust|gasolin|carro|onibus|metro|estacion/], ['saude', /saude|farmac|medic|plano|dentist|hospital|remedio/], ['lazer', /lazer|cinema|show|diversao|festa|\bbar\b|passeio/],
  ['compras', /compra|roupa|loja|shopping|vestu/], ['contas', /conta|luz|agua|internet|energia|imposto|taxa|boleto/], ['educacao', /educa|curso|escola|faculd|livro|estudo/],
  ['pessoal', /pessoal|beleza|cabel|barbear|cuidado/], ['coracao', /relacion|namor|casal|famil|filho/], ['pet', /\bpet|cachorr|gato|veterin/], ['viagem', /viag|hotel|passag|turism|ferias/],
  ['tech', /celular|tecnolog|eletron|computad|\bxp\b/], ['assin', /assinat|streaming|netflix|spotify|mensal/], ['esporte', /academ|esporte|gym|treino/], ['presente', /present|doac/]];
function basCatIcId(area) {
  const salvo = ((S.profile && S.profile.catIcones) || {})[area]; if (BAS_CAT_IC[salvo]) return salvo;
  const t = basSemAcento(area || ''); const h = BAS_CAT_NOME.find(([, re]) => re.test(t)); return h ? h[0] : 'outros';
}
const basCatIc = (area) => ic(BAS_CAT_IC[basCatIcId(area)][1]);
// escolha do ícone (no formulário do gasto e da conta)
const basCatIcEscolha = (sel) => `<fieldset class="bas-fs bas-catic"><legend>Ícone da categoria</legend><div class="bas-catic-g">${Object.keys(BAS_CAT_IC).map((k) => `<label title="${esc(BAS_CAT_IC[k][0])}"><input type="radio" name="areaIc" value="${k}" ${k === sel ? 'checked' : ''}><span aria-label="${esc(BAS_CAT_IC[k][0])}">${ic(BAS_CAT_IC[k][1])}</span></label>`).join('')}</div></fieldset>`;
function basCatIcGrava(area, k) { if (!area || !BAS_CAT_IC[k]) return; S.profile.catIcones = Object.assign({}, S.profile.catIcones, { [area]: k }); touch('profile'); }
// Gasto em pop-up (visual de comprovante): folha escura que sobe sobre a tela atual, o comprovante sai de uma fenda.
// Mesmas funções da tela do gasto: fechar, editar, lançar de novo, categoria, detalhes e números.
function basGastoPop(id, conta, mm) {
  const p = S.plan; let l;
  if (conta) { const m0 = mm != null && mm !== '' ? +mm : S.mes; const x = basContas(m0).itens.find((i) => i.id === id); if (!x) return;
    l = { id: x.id, desc: x.nome, area: x.area || 'Contas', valor: x.valor, inst: x.inst, data: `${S.year}-${String(m0 + 1).padStart(2, '0')}-01`, conta: true, parcela: x.parcela, mm: m0 }; }
  else l = p.lancamentos.find((x) => x.id === id);
  if (!l) return;
  document.querySelector('.bas-gp')?.remove();
  const dt = l.data ? new Date(l.data + 'T12:00:00') : null; const ok = dt && !isNaN(dt);
  const data = ok ? dt.toLocaleDateString(document.documentElement.lang || 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sem data';
  const nome = l.desc || l.area || 'Gasto'; const inst = l.inst && instDe(l.inst);
  const m = l.conta ? l.mm : ok ? dt.getMonth() : S.mes; const totMes = +(S.C.despesas[m] || 0); const parte = totMes > 0 ? (+l.valor / totMes) : 0;
  const chave = basSemAcento(nome); const iguais = p.lancamentos.filter((x) => basSemAcento(x.desc || x.area || '') === chave); const somaIg = iguais.reduce((t, x) => t + (+x.valor || 0), 0);
  const fixo = l.itemId && p.despesas.find((x) => x.id === l.itemId);
  const lin = (k, v, cls) => `<li><span>${k}</span><b${cls ? ` class="${cls}"` : ''}>${v}</b></li>`;
  // a última linha é a mesma em todo comprovante: quantas vezes e quanto no total (na parcela, a compra inteira)
  const itC = l.conta && p.despesas.find((x) => x.id === l.id); const mesesC = itC ? (itC.valores || []).filter((v) => +v > 0) : [];
  const vezes = l.conta && l.parcela ? lin(`Parcelas de ${esc(nome)}`, `${l.parcela.n} · ${basCent((+l.valor || 0) * l.parcela.n)}`)
    : l.conta ? lin(`Vezes com ${esc(nome)}`, `${mesesC.length || 1} · ${basCent(mesesC.length ? mesesC.reduce((t, v) => t + (+v || 0), 0) : +l.valor || 0)}`)
    : lin(`Vezes com ${esc(nome)}`, `${iguais.length || 1} · ${basCent(iguais.length ? somaIg : +l.valor || 0)}`);
  const w = document.createElement('div'); w.className = 'bas-gp'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', `Gasto: ${nome}`);
  w.innerHTML = `<button class="bas-gp-fundo" data-act="bas-gp-fechar" aria-label="Fechar"></button>
    <div class="bas-gp-f"><i class="bas-gp-alca" aria-hidden="true"></i>
      <header class="bas-gp-h"><button class="bas-gp-x" data-act="bas-gp-fechar" aria-label="Fechar">${I.x}</button><b>Seu gasto</b><button class="bas-gp-x" ${l.conta ? basIr('conta', { id: l.id }) : basIr('gasto', { id: l.id })} aria-label="Editar gasto">${I.edit}</button></header>
      <span class="bas-gp-ic" aria-hidden="true">${basCatIc(l.area)}</span>
      <p class="bas-gp-q">${esc(nome)} · ${esc(l.area || 'Sem categoria')}</p>
      <p class="bas-gp-v">${basCent(+l.valor || 0)}</p>
      <div class="bas-gp-fenda"><span class="bas-gp-boca" aria-hidden="true"><i></i></span><div class="bas-gp-saida"><div class="bas-gp-papel">
        <div class="bas-gp-marca"><b>${esc(CFG.marca || '')}</b><small>Comprovante nº ${esc(String(l.id).replace(/\W/g, '').slice(-8).toUpperCase().padStart(8, '0'))}</small></div>
        <div class="bas-gp-t"><b>${esc(nome)}</b><b>Total ${basCent(+l.valor || 0)}</b></div>
        <ul>${lin('Data', l.conta ? `${esc(cap(MES_LONGO[l.mm]))} de ${S.year}` : esc(cap(data)))}${lin('Pago com', inst ? `${instIcone(l.inst)} ${esc(inst[1])}` : 'Não informado')}${lin('Tipo', l.conta ? (l.parcela ? `Parcela ${l.parcela.i} de ${l.parcela.n}` : 'Todo mês') : fixo ? 'Conta do mês' : 'Gasto do dia')}${lin('Origem', l.conta ? (l.parcela ? 'Compra parcelada' : 'Conta fixa') : l.origem === 'manual' ? 'Anotado por você' : 'Extrato')}${lin(`Do total de ${MES_LONGO[m]}`, `${Math.round(parte * 100)}%`)}${vezes}</ul>
      </div></div><span class="bas-gp-labio" aria-hidden="true"></span></div>
      <div class="bas-gp-as"><button ${basIr('gasto', { area: l.area })}>${I_REC}Lançar de novo</button><button ${basIr('categoria', { area: l.area })}>${I_RAIOX}Ver a categoria</button></div>
    </div>`;
  document.body.appendChild(w); basSom('toque');
  const esc0 = (e) => { if (e.key === 'Escape') basGastoFechar(); }; w._esc = esc0; addEventListener('keydown', esc0);
  requestAnimationFrame(() => w.classList.add('on'));
}
function basGastoFechar() {
  const w = document.querySelector('.bas-gp'); if (!w) return; removeEventListener('keydown', w._esc); w.classList.remove('on'); w.classList.add('sai'); setTimeout(() => w.remove(), 320);
}
// A tela do gasto: quem recebeu (logo do banco ou iniciais), o valor grande, a data, três atalhos e os detalhes;
// o lápis no alto abre o formulário de edição (a tela "gasto" de sempre)
function basTelaGastoVer(o) {
  const p = S.plan; const l = p.lancamentos.find((x) => x.id === o.id);
  if (!l) return basSumiu();
  const dt = l.data ? new Date(l.data + 'T12:00:00') : null; const ok = dt && !isNaN(dt);
  const data = ok ? dt.toLocaleDateString(document.documentElement.lang || 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Sem data';
  const nome = l.desc || l.area || 'Gasto'; const inst = l.inst && instDe(l.inst);
  const m = ok ? dt.getMonth() : S.mes; const totMes = +(S.C.despesas[m] || 0); const parte = totMes > 0 ? (+l.valor / totMes) : 0;
  const chave = basSemAcento(nome); const iguais = p.lancamentos.filter((x) => basSemAcento(x.desc || x.area || '') === chave); const somaIg = iguais.reduce((t, x) => t + (+x.valor || 0), 0);
  const fixo = l.itemId && p.despesas.find((x) => x.id === l.itemId);
  const lin = (k, v) => `<li><span>${k}</span><b>${v}</b></li>`;
  const atalho = (attrs, ic, t) => `<button class="bas-gv-a" ${attrs}>${ic}<span>${t}</span></button>`;
  return `<div class="bas-gv"><header class="bas-gv-h"><button class="bas-circ" data-act="bas-voltar" aria-label="Fechar">${I.x}</button><button class="bas-circ" ${basIr('gasto', { id: l.id })} aria-label="Editar gasto">${I.edit}</button></header>
    <div class="bas-gv-id"><span class="bas-gv-ic" aria-hidden="true">${inst ? instIcone(l.inst) : `<i>${esc(basIniciais(nome))}</i>`}</span><span><b>${esc(nome)}</b><small>${esc(l.area || 'Sem categoria')}</small></span></div>
    <p class="bas-gv-v">−${basCent(+l.valor || 0)}</p><p class="bas-gv-d">${esc(cap(data))}</p>
    <div class="bas-gv-as">${atalho(basIr('gasto', { id: l.id }), I.edit, 'Editar')}${atalho(basIr('gasto', { area: l.area }), I_REC, 'Lançar de novo')}${atalho(basIr('categoria', { area: l.area }), I_RAIOX, 'Categoria')}</div>
    <h2 class="bas-gv-g">Detalhes</h2>
    <ul class="card bas-gv-l">${lin('Pago com', inst ? `${instIcone(l.inst)} ${esc(inst[1])}` : 'Não informado')}${lin('Categoria', esc(l.area || '–'))}${lin('Tipo', fixo ? `Conta do mês · ${esc(fixo.nome || '')}` : 'Gasto do dia')}${lin('Origem', l.origem === 'manual' ? 'Anotado por você' : 'Importado do extrato')}</ul>
    <h2 class="bas-gv-g">Em números</h2>
    <ul class="card bas-gv-l">${lin(`Do total de ${MES_LONGO[m]}`, `${Math.round(parte * 100)}%`)}${iguais.length > 1 ? lin(`Vezes com ${esc(nome)}`, `${iguais.length} · ${basCent(somaIg)}`) : ''}</ul></div>`;
}
// Gasto, refeito: o valor grande no alto, o nome, como é (uma vez, todo mês ou parcelado, sempre dá para trocar, inclusive ao editar),
// quando, a categoria em fichas com ícone (nova categoria abre o nome e o ícone) e o banco em fichas com a logo. Menos texto, tudo à mão.
function basTelaGasto(o, it) {
  const p = S.plan; const l = !it && o.id ? p.lancamentos.find((x) => x.id === o.id) : null; if (o.id && !l && !it) return basSumiu();
  const a0 = l ? l.area : it ? it.area : o.area || ''; const usadas = p.despesas.map((x) => x.area).concat(p.lancamentos.map((x) => x.area));
  const areas = [...new Set((a0 ? [a0] : []).concat(BAS_AREAS, usadas).filter(Boolean))].slice(0, 18);
  const pc = it && it.parcel; const tipo = it ? (pc ? 'parc' : 'mes') : l ? 'uma' : o.modo === 'parc' || o.modo === 'mes' ? o.modo : 'uma';
  const mem = basMemGastos();
  const i0 = l ? l.inst || '' : it ? it.inst || '' : instDe(o.inst || '') ? o.inst : ([...(p.lancamentos || [])].reverse().find((x) => x.inst && instMinhas().includes(x.inst)) || {}).inst || '';
  const v0 = l ? Math.abs(l.valor) : pc ? pc.total : it ? +it.valores[S.mes] || 0 : 0;
  // data: a do gasto; numa conta que vira "uma vez", o dia 1 do mês dela (nunca pula para hoje); gasto novo, hoje (no mês aberto)
  const d0 = l ? l.data : it ? `${S.year}-${pad2(S.mes + 1)}-01` : basDataMes(S.mes);
  const hoje = basHoje(); const ontem = (() => { const d = new Date(Date.now() - 864e5); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; })();
  const seg = [['uma', 'Uma vez'], ['mes', 'Todo mês'], ['parc', 'Parcelado']].map(([v, n]) => `<label><input type="radio" name="tipo" value="${v}" ${v === tipo ? 'checked' : ''}><span>${n}</span></label>`).join('');
  const cat = areas.map((a) => `<label class="bas-gf-c"><input type="radio" name="area" value="${esc(a)}" ${a === a0 ? 'checked' : ''}><span><i aria-hidden="true">${basCatIc(a)}</i>${esc(a)}</span></label>`).join('')
    + `<label class="bas-gf-c bas-gf-nova"><input type="radio" name="area" value=""><span><i aria-hidden="true">${I.plus}</i>Nova</span></label>`;
  const bancos = ['', ...new Set(instMinhas().concat(i0 ? [i0] : []))].filter((v) => !v || instDe(v)).map((v) => `<label class="bas-gf-b"><input type="radio" name="inst" value="${v}" ${v === i0 ? 'checked' : ''}><span>${v ? instIcone(v) + esc(instDe(v)[1]) : 'Sem banco'}</span></label>`).join('');
  return basForm(it ? 'conta' : 'gasto', l || it ? 'Editar gasto' : 'Novo gasto', `<div class="bas-gf">
    <label class="bas-gf-v"><span class="bas-gf-rot"><b class="r-uma">Quanto foi?</b><b class="r-mes">Quanto por mês?</b><b class="r-parc">Valor total da compra</b></span><span class="bas-gf-vin"><i aria-hidden="true">R$</i><input name="valor" inputmode="decimal" placeholder="0,00" value="${v0 ? esc(nf.format(v0)) : ''}" data-foco autocomplete="off"></span></label>
    <input class="bas-gf-nome" name="desc" value="${esc(l ? l.desc : it ? it.nome : '')}" placeholder="Com o quê? Ex.: Mercado, Aluguel" list="bas-dl-desc" autocomplete="off" aria-label="Com o quê?"><datalist id="bas-dl-desc">${[...mem.values()].map((x) => `<option value="${esc(x.desc)}">`).join('')}</datalist>
    <p class="bas-p bas-lembra" aria-live="polite" hidden></p>
    <div class="bas-gf-seg" role="radiogroup" aria-label="Como é o gasto">${seg}</div>
    <div class="bas-blk bas-gf-quando" data-blk="data"><button type="button" class="bas-gf-dia${d0 === hoje ? ' on' : ''}" data-gf-dia="${hoje}">Hoje</button><input type="date" name="data" value="${esc(d0)}" min="${S.year}-01-01" max="${S.year}-12-31" aria-label="Data do gasto"></div>
    <p class="bas-blk bas-gf-info" data-blk="mesp">Todo mês, de ${MES_LONGO[S.mes]} até dezembro.</p>
    <div class="bas-blk bas-gf-parc" data-blk="parc"><button type="button" data-gf-n="-1" aria-label="Menos parcelas">−</button><input name="n" inputmode="numeric" maxlength="3" value="${pc ? pc.n : 10}" aria-label="Número de parcelas"><button type="button" data-gf-n="1" aria-label="Mais parcelas">+</button><span class="bas-gf-pt" data-gf-pt></span></div>
    <p class="bas-gf-k">Categoria</p><button type="button" class="card bas-inv-sel bas-gf-sel" data-gf-pick="area" aria-label="Trocar a categoria"></button><div class="bas-gf-cs" role="radiogroup" aria-label="Categoria">${cat}</div>
    <div class="bas-gf-novaq"><input name="areaNova" placeholder="Nome da categoria, ex.: Pets" autocomplete="off" aria-label="Nova categoria">${basCatIcEscolha('outros')}</div>
    <p class="bas-gf-k">Pago com</p><button type="button" class="card bas-inv-sel bas-gf-sel" data-gf-pick="inst" aria-label="Trocar o banco"></button><div class="bas-gf-bs" role="radiogroup" aria-label="Pago com">${bancos}</div>
    ${l || it ? '' : `<button type="button" class="bas-gf-imp" data-act="bas-importar">${I_IMP}Importar do extrato</button>`}
  </div>`, { excluir: l || it ? 'Excluir gasto' : '' });
}
// uma gravação para os três jeitos, criando, editando ou trocando o tipo (gasto do dia ⇄ conta de todo mês ⇄ parcelado)
function basSalvarGasto(f, d, t, ok) {
  const p = S.plan; const m = S.mes; const v = parseReais(d.valor || '');
  const l = t.t === 'gasto' && t.id ? p.lancamentos.find((x) => x.id === t.id) : null; const it = t.t === 'conta' && t.id ? p.despesas.find((x) => x.id === t.id) : null;
  const area = (d.areaNova || '').trim() || d.area || (it && it.area) || (l && l.area) || 'Outros'; const desc = (d.desc || '').trim();
  if (!(v > 0)) return basErro(f, d.tipo === 'parc' ? 'Informe o valor total da compra.' : 'Informe quanto foi, como 25,90.');
  if (!desc && d.tipo !== 'uma') return basErro(f, 'Diga com o quê, como Aluguel.');
  const tiraLanc = () => { if (l) { desfazerBaixa(l); p.lancamentos = p.lancamentos.filter((x) => x !== l); } };
  const tiraConta = () => { if (it) { p.lancamentos.forEach((x) => { if (x.itemId === it.id) delete x.itemId; }); p.despesas = p.despesas.filter((x) => x !== it); } };
  if (d.tipo === 'uma') {
    const dt = E.parseDataISO(d.data); if (!dt || dt.ano !== S.year) return basErro(f, `Escolha uma data de ${S.year}.`);
    const nome = desc || area;
    if (l) { if (l.itemId && basMesDe(l.data) !== dt.mes) { desfazerBaixa(l); delete l.itemId; } Object.assign(l, { data: d.data, desc: nome, area, inst: d.inst || '', valor: E.r2(v) }); S.mes = dt.mes; ok('Gasto atualizado.'); return; }
    tiraConta();
    const nl = { id: uid(), origem: 'manual', data: d.data, desc: nome, valor: E.r2(v), cat: basCat(false), area, sub: '', inst: d.inst || '' }; p.lancamentos.push(nl); let msg = it ? 'Gasto atualizado.' : 'Gasto anotado.';
    if (!it) { const fx = E.acharFixo(p.despesas, nome, dt.ano, dt.mes); if (fx) { nl.itemId = fx.id; nl.cat = fx.cat; fx.baixas = Object.assign({}, fx.baixas, { [dt.ano + '-' + dt.mes]: nl.id }); msg = `Conta “${fx.nome}” já conta como gasto de ${MES_LONGO[dt.mes]}.`; } }
    S.mes = dt.mes; ok(msg); return;
  }
  tiraLanc();
  const alvo = it || { id: uid(), sub: '', valores: z12() }; Object.assign(alvo, { nome: desc, area, inst: d.inst || '' });
  if (d.tipo === 'parc') { const n = parseInt(d.n, 10); if (!(n >= 1 && n <= 120)) return basErro(f, 'Informe de 1 a 120 parcelas.');
    alvo.cat = alvo.cat || basCat(false); alvo.parcel = Object.assign({ ano: S.year, mes: m }, alvo.parcel, { total: E.r2(v), n }); alvo.valores = z12(); }
  else { alvo.cat = alvo.cat || basCat(true); if (alvo.parcel) { delete alvo.parcel; alvo.valores = z12(); } fillFrom(alvo.valores, E.r2(v), m); }
  if (!it) p.despesas.push(alvo); ok(it || l ? 'Gasto atualizado.' : d.tipo === 'parc' ? 'Compra parcelada anotada.' : 'Gasto de todo mês anotado.');
}
// botões da tela: Hoje/Ontem, mais e menos parcelas e a conta das parcelas ao vivo
function basGfLigar() {
  const f = document.querySelector('.bas-form .bas-gf'); if (!f || f.dataset.lig) return; f.dataset.lig = '1';
  const dt = f.querySelector('[name="data"]'); const n = f.querySelector('[name="n"]'); const val = f.querySelector('[name="valor"]'); const pt = f.querySelector('[data-gf-pt]');
  const conta = () => { if (!pt) return; const t = parseReais(val.value || ''); const k = parseInt(n.value, 10) || 0; pt.textContent = t > 0 && k > 0 ? `${k}× de ${brl(t / k)}` : 'vezes'; };
  const dias = () => f.querySelectorAll('[data-gf-dia]').forEach((b) => b.classList.toggle('on', b.dataset.gfDia === dt.value));
  f.addEventListener('click', (e) => { const b = e.target.closest('[data-gf-dia], [data-gf-n]'); if (!b) return; e.preventDefault();
    if (b.dataset.gfDia) { dt.value = b.dataset.gfDia; dias(); } else { n.value = Math.max(1, Math.min(120, (parseInt(n.value, 10) || 0) + +b.dataset.gfN)); conta(); } basSom('toque'); });
  dt && dt.addEventListener('change', dias); n && n.addEventListener('input', conta); val && val.addEventListener('input', conta); conta();
}
// conta do mês: gasto fixo ou parcela
function basTelaConta(o) {
  const p = S.plan; const it = p.despesas.find((i) => i.id === o.id); if (it) return basTelaGasto(o, it);
  const x = basContas(S.mes).itens.find((i) => i.id === o.id); if (!x) return basSumiu();
  return basDet(esc(x.nome), basCard(`<small class="bas-k">${x.parcela ? `Parcela ${x.parcela.i} de ${x.parcela.n}` : 'Todo mês'} · ${MES_LONGO[S.mes]}</small><b class="bas-big">${brl(x.valor)}</b>
    <p class="bas-p">${x.area ? esc(x.area) + ' · ' : ''}Parcela de uma compra de ${x.herdado}. Ela é editada no planejamento daquele ano.</p>`, 'bas-hero'));
}
// nova conta (todo mês ou parcelada) ou editar uma de todo mês
function basTelaContaF(o) {
  const p = S.plan; const it = o.id ? p.despesas.find((i) => i.id === o.id) : null; if (o.id && !it) return basSumiu();
  const areas = [...new Set(BAS_AREAS.concat(p.despesas.map((x) => x.area), it ? [it.area] : []).filter(Boolean))].slice(0, 16);
  return basForm('conta-f', it ? 'Editar conta' : 'Nova conta', `${it ? '' : basChips('modo', [['mes', 'Todo mês'], ['parc', 'Parcelada']], o.modo === 'parc' ? 'parc' : 'mes', 'Como é a conta')}
    <div class="bas-blk" data-blk="mes">${basValor('valor', it ? +it.valores[S.mes] || 0 : 0, it ? `Valor por mês, de ${MES_LONGO[S.mes]} em diante` : 'Valor por mês')}</div>
    ${it ? '' : `<div class="bas-blk" data-blk="parc">${basValor('total', 0, 'Valor total da compra')}${basCampo('n', 'Em quantas vezes?', 10, 'inputmode="numeric" maxlength="3"')}<p class="bas-p">A primeira parcela cai em ${MES_LONGO[S.mes]} de ${S.year}.</p></div>`}
    ${basCampo('nome', 'Nome', it ? it.nome : '', 'placeholder="Ex.: Aluguel, Internet, Celular"')}${basChips('area', areas.map((a) => [a, a]), it ? it.area : '', 'Categoria')}`);
}
// ícones das fontes de entrada (o cliente escolhe no formulário; sem escolha, vem do nome)
const BAS_REN_IC = {
  salario: ['Salário', '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>'],
  vale: ['Vale-refeição', '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2.2 1.8-2.6 6.2 0 8v10"/>'],
  cartao: ['Benefício', '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>'],
  freela: ['Freela', '<rect x="4" y="5" width="16" height="10.5" rx="1.5"/><path d="M2 19h20"/>'],
  negocio: ['Negócio', '<path d="M4 10h16l-1.5-5h-13zM5 10v10h14V10M10 20v-5h4v5"/>'],
  aluguel: ['Aluguel', '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
  invest: ['Rendimentos', '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'],
  bonus: ['Bônus', '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'],
  pix: ['Transferência', '<path d="M17 3l3.5 3.5L17 10M3.5 6.5h17M7 21l-3.5-3.5L7 14M20.5 17.5h-17"/>'],
  presente: ['Presente', '<path d="M4 11h16v10H4zM3 7.5h18V11H3zM12 7.5V21M12 7.5C10.4 5 7 4.6 7 6.4s3.2 1.1 5 1.1c1.8 0 5 .7 5-1.1S13.6 5 12 7.5z"/>'],
  outros: ['Outros', '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>'],
};
const BAS_REN_NOME = [['vale', /vale|\bvr\b|\bva\b|refeic|aliment|ifood|sodexo|alelo|ticket/], ['salario', /salar|holerite|clt|pro.?labore|ordenado/], ['freela', /freela|freelanc|projeto|servic/],
  ['aluguel', /aluguel|imovel/], ['invest', /rendiment|dividend|provent|juros|invest/], ['bonus', /bonus|bônus|plr|13|decimo|comiss|premio/], ['pix', /pix|transfer|reembols/], ['presente', /present|mesada|doac/], ['negocio', /negocio|empresa|loja|venda/]];
function basRenIcId(r) { if (r && BAS_REN_IC[r.icone]) return r.icone; if (r && r.soGasto) return 'cartao'; const t = basSemAcento((r && r.nome) || '').toLowerCase(); const h = BAS_REN_NOME.find(([, re]) => re.test(t)); return h ? h[0] : 'outros'; }
// nova entrada no jeito de app de pagamento: o valor grande digitado num teclado próprio, o cartão "De onde vem"
// com o ícone, o nome e o que essa entrada significa (até dezembro, o peso na renda), atalhos das fontes que já existem,
// mais opções recolhidas e o Salvar acima do teclado. Grava pelo mesmo basSalvar('entrada').
function basTelaEntrada(o) {
  const r = o.id ? S.plan.rendas.find((x) => x.id === o.id) : null; if (o.id && !r) return basSumiu();
  const v0 = r ? +r.valores[S.mes] || 0 : 0; const ic0 = r ? basRenIcId(r) : 'salario';
  const C = S.C; const ult = S.year === NOW_Y ? NOW_M : 11; let soma = 0; for (let m = 0; m <= ult; m++) soma += +C.receita[m] || 0; const media = soma / (ult + 1);
  const vistos = new Set(); const recentes = S.plan.rendas.filter((x) => x !== r && x.nome && !vistos.has(x.nome) && vistos.add(x.nome)).slice(0, 6);
  const cats = S.plan.rendaCats && S.plan.rendaCats.length ? S.plan.rendaCats : E.CATS_RENDA();
  const tecla = (k, rot) => `<button type="button" class="bas-ef-k" data-ef-k="${k}" aria-label="${rot || k}">${k === 'x' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7z"/><path d="m12.5 9.5 5 5m0-5-5 5"/></svg>' : k}</button>`;
  return `<form class="bas-form bas-ef" data-form="bas" data-t="entrada" novalidate autocomplete="off" data-media="${media.toFixed(2)}" data-meses="${12 - S.mes}">
    <header class="bas-ef-h"><button type="button" class="bas-circ bas-ef-x" data-act="bas-voltar" aria-label="Cancelar">${I_VOLTA}</button><b>${r ? 'Editar entrada' : 'Nova entrada'}</b>${r ? `<button type="button" class="bas-circ bas-ef-del" data-act="bas-excluir" aria-label="Excluir entrada"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>` : '<span></span>'}</header>
    <small class="bas-ef-k0">Vai entrar em ${esc(MES_LONGO[S.mes])}</small>
    <div class="bas-ef-v" aria-live="polite"><i>R$</i><b data-ef-v>${v0 ? esc(nf.format(v0)) : '0'}</b><span class="bas-ef-cur" aria-hidden="true"></span></div>
    <input type="hidden" name="valor" value="${v0 ? esc(nf.format(v0)) : ''}">
    <section class="card bas-ef-c">
      <div class="bas-ef-fonte"><span class="bas-ef-ic" data-ef-ic aria-hidden="true">${ic(BAS_REN_IC[ic0][1])}</span>
        <span class="bas-ef-fn"><input name="nome" value="${esc(r ? r.nome : '')}" placeholder="De onde vem? Ex.: salário" aria-label="De onde veio?" enterkeyhint="done"><small data-ef-sub></small></span>
        ${recentes.length ? '<button type="button" class="bas-ef-src-b" data-ef-src>Fontes</button>' : ''}</div>
      <div class="bas-ef-l2">${basSw('todo', r ? 'Usar até dezembro' : 'Entra todo mês', '', !r)}<button type="button" class="bas-ef-aj" data-ef-mais>Ajustes</button></div>
      <ul class="bas-ef-num" hidden><li><b data-ef-mes></b></li><li><b data-ef-ano></b></li><li><b data-ef-pct></b></li></ul>
    </section>
    <div class="bas-ef-sh" data-ef-sh="opc" hidden><div class="bas-ef-shf"><span class="bas-pop-al" aria-hidden="true"></span><div class="bas-pop-h"><span><b>Ajustes da entrada</b><small>Tipo, uso e ícone</small></span><button type="button" class="btn primary bas-ef-pronto" data-ef-fecha>Pronto</button></div>
      <div class="bas-ef-opc">
        ${basChips('cat', cats.map((c) => [c.id, c.nome]), r ? r.cat : 'fixa', 'Tipo de renda')}
        ${basChips('uso', [['livre', 'Pode investir'], ['gasto', 'Só para gastos']], r && r.soGasto ? 'gasto' : 'livre', 'Esse dinheiro pode ser investido?')}
        <div class="bas-blk" data-blk="ben">${basChips('inst', [...new Set(['ifood', ...instMinhas(), ...(r && r.inst ? [r.inst] : [])])].filter((v) => instDe(v) && v !== 'dinheiro' && v !== 'outra').map((v) => [v, instDe(v)[1]]), (r && r.inst) || 'ifood', 'Em qual cartão ele cai?')}
          <p class="bas-p">Os gastos pagos com este cartão usam esse saldo, e o que sobrar nele não entra no que dá para investir.</p></div>
        <fieldset class="bas-fs bas-catic"><legend>Ícone</legend><div class="bas-catic-g">${Object.keys(BAS_REN_IC).map((k) => `<label title="${esc(BAS_REN_IC[k][0])}"><input type="radio" name="rendaIc" value="${k}" ${k === ic0 ? 'checked' : ''}><span aria-label="${esc(BAS_REN_IC[k][0])}">${ic(BAS_REN_IC[k][1])}</span></label>`).join('')}</div></fieldset>
      </div></div></div>
    ${recentes.length ? `<div class="bas-ef-sh" data-ef-sh="src" hidden><div class="bas-ef-shf"><span class="bas-pop-al" aria-hidden="true"></span><div class="bas-pop-h"><span><b>Suas fontes</b><small>Toque para repetir</small></span><button type="button" class="bell" data-ef-fecha aria-label="Fechar">${I.x}</button></div>
      <div class="bas-ef-rec" role="group" aria-label="Fontes que você já tem">${recentes.map((x) => `<button type="button" data-ef-rec data-nome="${esc(x.nome)}" data-ic="${basRenIcId(x)}" data-cat="${esc(x.cat || '')}" data-uso="${x.soGasto ? 'gasto' : 'livre'}" data-v="${esc(nf.format(+((x.valores || [])[S.mes] || (x.valores || []).filter((y) => +y > 0).slice(-1)[0] || 0)))}"><i>${ic(BAS_REN_IC[basRenIcId(x)][1])}</i><span>${esc(x.nome)}</span></button>`).join('')}</div></div></div>` : ''}
    <div class="bas-ef-pe"><p class="bas-err" role="alert" hidden></p><button class="btn primary lg bas-cta bas-ef-ok" type="submit">${r ? 'Salvar' : 'Anotar entrada'}</button>
      <div class="bas-ef-tec" role="group" aria-label="Teclado numérico">${['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => tecla(k)).join('')}${tecla(',', 'vírgula')}${tecla('0')}${tecla('x', 'apagar')}</div></div>
  </form>`;
}
function basEfLigar() {
  const f = document.querySelector('form.bas-ef'); if (!f || f.dataset.lig) return; f.dataset.lig = '1';
  const inp = f.querySelector('[name="valor"]'); const out = f.querySelector('[data-ef-v]'); const media = +f.dataset.media || 0; const meses = +f.dataset.meses || 1;
  let txt = inp.value.replace(/\./g, ''); if (/,00$/.test(txt)) txt = txt.slice(0, -3);
  const fmt = (t) => { const [i, d] = t.split(','); const ii = (i || '0').replace(/^0+(?=\d)/, ''); return ii.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d != null ? ',' + d : ''); };
  const conta = () => { const v = parseReais(txt || '0') || 0; const todo = f.querySelector('[name="todo"]').checked; const nome = f.querySelector('[name="nome"]').value.trim();
    const cat = f.querySelector('[name="cat"]:checked'); const uso = f.querySelector('[name="uso"]:checked');
    f.querySelector('[data-ef-sub]').textContent = [cat ? cat.nextElementSibling.textContent : '', todo ? 'todo mês' : 'só este mês', uso && uso.value === 'gasto' ? 'só para gastos' : ''].filter(Boolean).join(' · ');
    f.querySelector('[data-ef-mes]').innerHTML = v ? basCent(v) : '–'; f.querySelector('[data-ef-ano]').innerHTML = v ? basCent(todo ? v * meses : v) : '–';
    f.querySelector('[data-ef-pct]').textContent = v && media > 0 ? pct(v / media) : '–'; f.classList.toggle('tem', v > 0); };
  const mostra = () => { out.textContent = txt ? fmt(txt) : '0'; inp.value = txt; out.parentElement.classList.remove('pulo'); void out.offsetWidth; out.parentElement.classList.add('pulo'); conta(); };
  const tecla = (k) => { if (k === 'x') txt = txt.slice(0, -1); else if (k === ',') { if (!txt.includes(',')) txt = (txt || '0') + ','; } else { const [i, d] = txt.split(','); if (d != null ? d.length >= 2 : (i || '').length >= 9) return; txt = txt === '0' ? k : txt + k; }
    if (typeof basSom === 'function') basSom('toque'); if (typeof basVibra === 'function') basVibra(6); mostra(); };
  f.querySelectorAll('[data-ef-k]').forEach((b) => b.addEventListener('click', () => tecla(b.dataset.efK)));
  // teclado do computador também digita o valor (fora do campo do nome)
  f.addEventListener('keydown', (e) => { if (e.target.matches('input[name="nome"]')) return; const k = e.key === 'Backspace' ? 'x' : e.key === '.' ? ',' : e.key; if (/^[\d,x]$/.test(k)) { e.preventDefault(); tecla(k); } });
  const icone = () => { const s = f.querySelector('[name="rendaIc"]:checked'); if (s) f.querySelector('[data-ef-ic]').innerHTML = ic(BAS_REN_IC[s.value][1]); };
  f.addEventListener('change', () => { icone(); conta(); });
  // nome conhecido escolhe o ícone sozinho (se o cliente ainda não escolheu um)
  let icMexeu = false; f.querySelectorAll('[name="rendaIc"]').forEach((x) => x.addEventListener('change', () => { icMexeu = true; }));
  f.querySelector('[name="nome"]').addEventListener('input', (e) => { if (icMexeu) return; const k = basRenIcId({ nome: e.target.value }); const rr = f.querySelector(`[name="rendaIc"][value="${k}"]`); if (rr && k !== 'outros') { rr.checked = true; icone(); } });
  // fontes e ajustes abrem em janelas que sobem de baixo; fecham no Pronto, no X, no fundo ou ao escolher uma fonte
  const sh = (k, abre) => { const e = f.querySelector(`[data-ef-sh="${k}"]`); if (!e) return; if (abre) { e.hidden = false; e.classList.remove('sai'); basSom('toque'); } else { e.classList.add('sai'); setTimeout(() => { e.hidden = true; e.classList.remove('sai'); }, 220); } };
  const mais = f.querySelector('[data-ef-mais]'); mais.addEventListener('click', () => sh('opc', true));
  const src = f.querySelector('[data-ef-src]'); if (src) src.addEventListener('click', () => sh('src', true));
  f.querySelectorAll('[data-ef-sh]').forEach((e) => e.addEventListener('click', (ev) => { if (ev.target === e || ev.target.closest('[data-ef-fecha]') || ev.target.closest('[data-ef-rec]')) sh(e.dataset.efSh, false); }));
  f.querySelectorAll('[data-ef-rec]').forEach((b) => b.addEventListener('click', () => { const d = b.dataset; f.querySelector('[name="nome"]').value = d.nome;
    [['rendaIc', d.ic], ['cat', d.cat], ['uso', d.uso]].forEach(([n, v]) => { const x = f.querySelector(`[name="${n}"][value="${v}"]`); if (x) x.checked = true; }); icMexeu = true; icone();
    if (!parseReais(txt || '0') && d.v && d.v !== '0,00') { txt = d.v.replace(/\./g, '').replace(/,00$/, ''); mostra(); } else conta();
    f.querySelectorAll('[data-ef-rec]').forEach((x) => x.classList.toggle('on', x === b)); }));
  conta();
}
// registrar investimento (ou corrigir o valor de um ativo no mês)
function basTelaAporte(o) {
  const p = S.plan; const a = o.id ? p.ativos.find((x) => x.id === o.id) : null; if (o.id && !a) return basSumiu(); const m = o.mes != null && o.mes !== '' ? +o.mes : S.mes;
  if (a) return basForm('aporte', esc(a.nome), `${basValor('valor', Math.abs(+a.ap[m] || 0), `Quanto em ${MES_LONGO[m]}?`)}${basChips('op', [['1', 'Aplicar'], ['-1', 'Resgatar']], a.ap[m] < 0 ? '-1' : '1', 'O que foi')}`, { excluir: `Apagar o registro de ${MES_LONGO[m]}` });
  return basTelaInvest(o);
}
// meta de investimento: a padrão vale para todos os meses; cada mês pode ter a sua (plan.metasAporte, vazio = a padrão), como no SaaS
function basTelaMeta() {
  const st = S.plan.settings; const mm = S.plan.metasAporte || []; const pad = +st.metaAporte || 0;
  return basForm('meta', 'Meta de investimento', `${basValor('valor', pad, 'Quanto quer investir por mês?')}<p class="bas-p">Essa é a meta padrão do ano. Comece com um valor que caiba no bolso.</p>
    <fieldset class="bas-fs"><legend>Meta de cada mês <small>(vazio = a padrão)</small></legend><div class="bas-metas">${MES_LONGO.map((n, m) => `<label class="bas-meta-m${m === S.mes ? ' on' : ''}"><span>${cap(n).slice(0, 3)}</span><input name="m${m}" inputmode="decimal" placeholder="${pad ? esc(nf.format(pad)) : '0,00'}" value="${mm[m] != null ? esc(nf.format(mm[m])) : ''}" aria-label="Meta de ${n}"></label>`).join('')}</div></fieldset>`);
}
function basTelaObjetivos() {
  const A = objAnalise(); const foco = S.profile.objetivoFoco;
  return basDet('Meus objetivos', `${A.itens.length ? basCard(`<ul class="bas-l">${A.itens.map((g, i) => `<li><button ${basIr('sonho-ed', { id: g.id })}>${objIcone(g, i)}<span class="bas-cl">${basNome(esc(objNomeDe(g)) + (g.id === foco ? ' <em class="bas-tag">Principal</em>' : ''), `${brl0(g.saldo)} de ${brl0(g.valor)}${g.ano ? ' até ' + g.ano : ''}`)}<b>${pct(g.progresso)}</b>${basBarra(g.progresso).replace('bas-bar', 'bas-bar fina')}</span>${I.chev}</button></li>`).join('')}</ul>`) : basCard(basVazio('Nenhum objetivo ainda.'))}
    <button class="btn primary lg bas-cta bas-add" ${basIr('sonho-novo')}>${I.plus}Novo sonho</button><p class="bas-disc keep">Projeção ilustrativa, sem promessa de rentabilidade.</p>`);
}
function basTelaObjetivo(o) {
  const g = o.id ? objLista().find((x) => x.id === o.id) : null; if (o.id && !g) return basSumiu();
  // escolha visual: cada sonho é um cartão com a foto e o ícone; em "Outro", o cliente escolhe o ícone
  const t0 = g ? g.tipo : 'viagem'; const ic0 = g && g.icone ? g.icone : 'outro';
  const tipos = `<fieldset class="bas-fs"><legend>Qual é o sonho?</legend><div class="bas-tipos">${OBJETIVOS.map(([k, n]) => `<label class="bas-tipo" style="--foto:url('${new URL(objFoto(k), document.baseURI).href}')"><input type="radio" name="tipo" value="${k}" ${k === t0 ? 'checked' : ''}><span class="bas-tipo-ic" aria-hidden="true">${OBJ_ICONES[k] || OBJ_ICONES.outro}</span><b>${esc(n)}</b></label>`).join('')}</div></fieldset>
    <fieldset class="bas-fs bas-blk" data-blk="icone"><legend>Escolha o ícone</legend><div class="bas-icones">${OBJ_3D_ESCOLHA.filter(([k]) => OBJ_ICONES[k]).map(([k, n]) => `<label class="bas-icone" title="${esc(n)}"><input type="radio" name="icone" value="${k}" ${k === ic0 ? 'checked' : ''} aria-label="${esc(n)}"><span aria-hidden="true">${OBJ_ICONES[k]}</span></label>`).join('')}</div></fieldset>`;
  return basForm('objetivo', g ? 'Editar objetivo' : 'Novo objetivo', `${tipos}
    ${basCampo('nome', 'Nome (opcional)', g ? g.nome : '', 'placeholder="Ex.: Viagem ao Japão"')}${basValor('valor', g ? g.valor : 0, 'Quanto custa?')}
    ${basCampo('ano', 'Até quando? (ano)', g && g.ano ? g.ano : '', `inputmode="numeric" maxlength="4" placeholder="Ex.: ${NOW_Y + 3}"`)}
    ${basSw('foco', 'Meu objetivo principal', 'Aparece na aba Investir.', !g || g.id === S.profile.objetivoFoco)}`, { excluir: g ? 'Excluir objetivo' : '' });
}
// limite da categoria no mês (E.analiseLimites), com o botão para definir ou mudar
const basLimArea = (area, tot) => { const lim = S.plan.settings.limites || {}; const L = E.analiseLimites(lim, { [area]: tot })[0];
  return L && E.norm(L.area) === E.norm(area) ? `${basBarra(L.uso)}<p class="bas-p">${L.sit === 'passou' ? `Passou ${brl(-L.falta)} do limite de ${brl(L.limite)}.` : `Ainda cabe ${brl(L.falta)} do limite de ${brl(L.limite)}.`} <button class="lnk strong" ${basIr('limite', { area })}>Mudar</button></p>`
    : `<p class="bas-p"><button class="lnk strong" ${basIr('limite', { area })}>Definir um limite para ${esc(area)}</button></p>`; };
function basTelaCategoria(o) {
  const m = S.mes; const area = o.area; const tot = E.gastosAreaMes(S.plan, E.carryItems(S.plans, S.year), m)[area] || 0;
  const contas = basContas(m).itens.filter((x) => (x.area || 'Outros') === area); const lanc = basLancMes(m).filter((l) => (l.area || 'Outros') === area);
  const ics = `<template id="bas-catic-tpl"><div class="bas-catic-g bas-catic-tela" role="group" aria-label="Ícone da categoria">${Object.keys(BAS_CAT_IC).map((k) => `<button class="${k === basCatIcId(area) ? 'on' : ''}" data-act="bas-cat-ic" data-area="${esc(area)}" data-v="${k}" aria-label="${esc(BAS_CAT_IC[k][0])}" aria-pressed="${k === basCatIcId(area)}">${ic(BAS_CAT_IC[k][1])}</button>`).join('')}</div></template>`;
  const n = contas.filter((x) => !x.pago).length + lanc.length;
  return `<div class="bas-pg bas-pg-cat"><div class="bas-gt-bg bas-pt-bg bas-cat-bg">
    <header class="bas-pv2-h"><button class="bell bas-cal-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><b>${esc(area)}</b><span class="bas-noite-r"><button class="bell bas-cal-b" data-act="bas-cat-ed" aria-label="Editar o ícone" title="Editar o ícone">${I.edit}</button>${olhoHtml()}</span></header>
    <div class="bas-cat-top"><span class="bas-cat-ic" aria-hidden="true">${basCatIc(area)}</span><small class="bas-pv2-k">Gastos em ${esc(MES_LONGO[m])}</small><b class="bas-pv2-t">${basCent(tot)}</b>${basCatLim(area, tot)}</div>
  </div><div class="bas-gt-folha">
    <div class="bas-pg-per bas-gt-acoes"><button class="bas-inv-pl bas-cat-add" ${basIr('gasto', { area })}>${I.plus}<span>Novo gasto</span></button></div>
    ${n ? basSecao('Gastos', `<small class="bas-pv2-q">${n}</small>`, `<ul class="bas-ativ">${contas.filter((x) => !x.pago).map(basContaLinha).join('')}${lanc.map(basLancLinha).join('')}</ul>`) : basCard(basVazio(`Nenhum gasto em ${esc(area)} em ${esc(MES_LONGO[m])}.`))}
  </div></div>${ics}`;
}
const I_CAM = ic('<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>');
// perfil de investidor: a régua dos três perfis com o seu marcado, a sua carteira de hoje contra a referência do perfil e refazer o teste
const BAS_PF_ORDEM = ['conservador', 'moderado', 'agressivo'];
const basEhRf = (a) => /fixa|tesouro|cdb|lci|lca|reserva|caixa|poupan|debent|\bcri\b|\bcra\b|pos.?fixad|prefixad|ipca/.test(basSemAcento(`${a.tipo || ''} ${a.classe || ''}`));
function basTelaPerfilInv() {
  const r = S.profile.perfilInvestidor && S.profile.perfilInvestidor.resultado; const pf = r && E.PERFIS[r];
  if (!pf) return basDet('Perfil de investidor', `<div class="card bas-pi-vz"><span class="bas-pi-ic" aria-hidden="true">${I.inv}</span><b>Descubra o seu perfil</b><p>Perguntas rápidas sobre como você lida com risco. O resultado ajuda o assessor a montar uma carteira do seu jeito.</p><button type="button" class="btn primary lg bas-cta" data-act="refazer-perfil">Fazer o teste</button></div>`).replace(olhoHtml(), '');
  const ix = BAS_PF_ORDEM.indexOf(r);
  let rf = 0; let tot = 0;
  try { const { K } = cartAnalise(); (K.classes || []).forEach((c) => { tot += c.valor || 0; if (basEhRf(c)) rf += c.valor || 0; }); } catch (e) { tot = 0; }
  const hoje = tot > 0 ? Math.round((rf / tot) * 100) : null; const dif = hoje == null ? 0 : hoje - pf.alvo.rendaFixa;
  const barra = (v) => `<span class="bas-pi-b"><i style="width:${v}%"></i></span>`;
  const leitura = hoje == null ? 'Quando você registrar os seus investimentos, mostramos aqui como a sua carteira se compara ao seu perfil.'
    : Math.abs(dif) < 10 ? 'Sua carteira está alinhada com o seu perfil.'
    : dif > 0 ? `Sua carteira está mais conservadora do que o seu perfil: ${hoje}% em renda fixa. Vale conversar com o assessor.`
    : `Sua carteira tem mais renda variável do que o seu perfil sugere: ${100 - hoje}%. Vale conversar com o assessor.`;
  return basDet('Perfil de investidor', `<div class="bas-pi-hero"><small>Seu perfil</small><b>${esc(pf.nome)}</b>
      <div class="bas-pi-regua" role="img" aria-label="Perfil ${esc(pf.nome)}, ${ix + 1} de 3">${BAS_PF_ORDEM.map((k, n) => `<span class="${n <= ix ? 'on' : ''}${n === ix ? ' eu' : ''}"><i></i><em>${esc(E.PERFIS[k].nome)}</em></span>`).join('')}</div>
      <p>${esc(pf.desc)}</p></div>
    <h2 class="bas-dp-g">Sua carteira e o seu perfil</h2>
    <div class="card bas-dp-c bas-pi-cmp"><div class="bas-pi-l"><span>Referência do perfil</span><b>${pf.alvo.rendaFixa}% renda fixa</b></div>${barra(pf.alvo.rendaFixa)}
      ${hoje == null ? '' : `<div class="bas-pi-l"><span>Sua carteira hoje</span><b>${hoje}% renda fixa</b></div>${barra(hoje)}`}
      <p class="bas-pi-txt${hoje != null && Math.abs(dif) < 10 ? ' ok' : ''}">${leitura}</p></div>
    <button type="button" class="btn lg bas-cta bas-pi-ref" data-act="refazer-perfil">Refazer o teste</button><p class="bas-dp-nota bas-pi-nota">Mudou de momento de vida? Refaça: leva uns 2 minutos.</p>`).replace(olhoHtml(), '');
}
// Dados pessoais: foto, dados, contato, perfil de investidor (com refazer o teste) e a conta
function basTelaPerfil() {
  const p = S.profile; const cloud = Store.mode === 'cloud';
  const desde = /^\d{4}-\d{2}/.test(String(p.criadoEm || '')) ? `${MES_LONGO[+p.criadoEm.slice(5, 7) - 1]} de ${p.criadoEm.slice(0, 4)}` : '';
  const sec = (t, corpo) => `<h2 class="bas-dp-g">${t}</h2><div class="card bas-dp-c">${corpo}</div>`;
  return basForm('perfil', 'Dados pessoais', `<div class="bas-dp-eu"><label class="bas-dp-av" for="av-file" aria-label="Trocar a foto de perfil">${avatarHtml(p, 'lg')}<span class="bas-pf-pen" aria-hidden="true">${I_CAM}</span></label><input id="av-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
      <b>${esc(p.apelido || p.nome || 'Seu nome')}</b>${desde ? `<small>No ${esc(CFG.marca || '')} desde ${desde}</small>` : ''}</div>
    ${sec('Sobre você', `${basCampo('nome', 'Nome completo', p.nome, 'autocomplete="name" maxlength="80"')}${basCampo('apelido', 'Como prefere ser chamado', p.apelido, 'maxlength="80" placeholder="Opcional"')}${basCampo('profissao', 'Profissão', p.profissao, 'maxlength="60" autocomplete="organization-title" placeholder="Opcional"')}${basCampo('cidade', 'Cidade', p.cidade, 'maxlength="60" autocomplete="address-level2" placeholder="Opcional"')}`)}
    ${sec('Contato', `<label class="bas-fl"><span>E-mail</span><input value="${esc(p.email || '')}" readonly aria-readonly="true"></label>${cloud ? '<p class="bas-dp-nota">O e-mail é o seu login e não muda aqui.</p>' : ''}${basCampo('whatsapp', 'WhatsApp', p.whatsapp, 'type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="(11) 90000-0000"')}`)}
    ${sec('Sua conta', `<ul class="bas-dp-l"><li><span>Plano</span><b>${esc(planLabel())}</b></li>${desde ? `<li><span>Membro desde</span><b>${desde}</b></li>` : ''}</ul>`)}`);
}
const basTelaContato = () => basDet(`Falar com o ${esc(primeiroNome())}`, basCard(`<p class="bas-p bas-p0">${esc(CFG.consultor)} atende você direto. Escolha o canal.</p><div class="bas-contato">${contactButtons()}</div>`));
function basTelaAno() {
  const ys = Object.keys(S.plans).map(Number).sort(); const prox = Math.max(...ys, NOW_Y) + (S.plans[NOW_Y] ? 1 : 0);
  return basDet('Ano do planejamento', `${basCard(`<ul class="bas-l">${ys.map((y) => `<li><button data-act="bas-ano" data-y="${y}">${basNome(String(y), y === S.year ? 'Aberto agora' : '')}${y === S.year ? I.check : I.chev}</button></li>`).join('')}</ul>`)}
    ${S.plans[prox] ? '' : `<button class="btn lg bas-cta bas-add" data-act="bas-ano" data-y="${prox}">${I.plus}Começar ${prox}</button><p class="bas-p">Entradas, contas e investimentos vêm com valores zerados. Parcelas em andamento aparecem sozinhas.</p>`}`);
}
// proventos do mês: o que cada ativo pagou; tocar corrige o valor
function basTelaProvento(o) {
  const p = S.plan; const m = S.mes; const a = o.id ? p.ativos.find((x) => x.id === o.id) : null; if (o.id && !a) return basSumiu();
  if (a) return basForm('provento', esc(a.nome), basValor('valor', +a.pr[m] || 0, `Quanto pagou em ${MES_LONGO[m]}?`), { excluir: `Apagar o provento de ${MES_LONGO[m]}` });
  if (!p.ativos.length) return basDet('Novo provento', basCard(basVazio('Registre um investimento primeiro.')));
  return basForm('provento', 'Novo provento', `<div class="bas-inv-v">${basValor('valor', 0, 'Quanto recebeu?')}</div>
    <p class="bas-inv-k">De qual ativo</p>${basAtPick(o.ativo, true)}<p class="bas-inv-k">Mês</p>${basMesFaixa(m)}`, { ok: 'Registrar' });
}
// Minha carteira, no jeito dos apps de investimento premium (Robinhood, Wealthsimple, Revolut): uma linha limpa da evolução
// no topo (a mesma do ativo, que segue o dedo), a alocação numa barra segmentada fina com as classes em lista (tocar abre os
// ativos, cada um com a sua mini linha), o plano contra o real com um marcador de alvo e o próximo aporte. Tudo em tons de azul.
const BAS_CT_COR = ['#2F6BFF', '#38D6FF', '#8AB4FF', '#5B5BD6', '#B8C7FF', '#1B3FA8', '#7FE3FF', '#9C8CFF'];
const basSigla = (n) => { n = String(n || '').trim(); return /\s/.test(n) ? basIniciais(n) : n.slice(0, 4).toUpperCase(); };
function basSpark(vals) {
  const v = vals.length > 1 ? vals : [0].concat(vals); const lo = Math.min(...v); const hi = Math.max(...v); const d = hi - lo || 1;
  const pts = v.map((x, i) => `${((i / (v.length - 1)) * 60).toFixed(1)},${(20 - ((x - lo) / d) * 18 - 1).toFixed(1)}`).join(' ');
  return `<svg class="bas-ct-sp${v[v.length - 1] < v[0] ? ' desce' : ''}" viewBox="0 0 60 20" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}"/></svg>`;
}
// o anel da carteira (inspirado nos anéis de alocação dos apps premium): um segmento por classe, aberto embaixo.
// Começa inteiro preenchido, com o total no centro; tocar numa parte (ou deslizar) mostra só ela: as outras ficam em vidro
// com listras, o centro passa ao valor daquela classe e, embaixo, o peso dela, o alvo e uma etiqueta curta. Sem redesenhar a tela.
function basCtwHtml(cls, total, comAlvo, its) {
  const vivas = cls.filter((c) => c.valor > 0.005); if (!vivas.length || !(total > 0)) return '';
  const dados = vivas.map((c) => { const at = c.valor / total; const al = c.alvo / 100; const df = (at - al) * 100; const falta = Math.max(0, al * total - c.valor);
    const tag = !comAlvo || !(c.alvo > 0) ? ['', ''] : Math.abs(df) < 2 ? ['ok', 'No alvo'] : df > 0 ? ['acima', 'Acima do alvo'] : ['abaixo', `Faltam ${brl0(falta)}`];
    return { n: c.classe || 'Outros', p: pct(at, 1), sub: `${pct(at, 1)} da carteira${comAlvo && c.alvo > 0 ? ` · alvo ${pct(al)}` : ''}`, v: basCent(c.valor), t: tag[1], tk: tag[0] }; });
  const cx = 150, cy = 150, R = 124, r = 86, A0 = -135, A1 = 135, gap = 2.6; const pt = (rr, a) => [cx + rr * Math.sin((a * Math.PI) / 180), cy - rr * Math.cos((a * Math.PI) / 180)];
  let a = A0;
  const segs = vivas.map((c, i) => { const span = Math.max(6, (c.valor / total) * (A1 - A0)); const s0 = a + gap; const s1 = Math.min(A1, a + span) - gap; a += span;
    const big = s1 - s0 > 180 ? 1 : 0; const [x0, y0] = pt(R, s0); const [x1, y1] = pt(R, s1); const [x2, y2] = pt(r, s1); const [x3, y3] = pt(r, s0); const [h0x, h0y] = pt(R - 5, s0 + 1); const [h1x, h1y] = pt(R - 5, s1 - 1);
    const meio = ((s0 + s1) / 2) * Math.PI / 180; const dd = `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${big} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} A${r} ${r} 0 ${big} 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z`;
    return `<g class="bas-ctw-s" data-i="${i}" style="--dx:${(Math.sin(meio) * 9).toFixed(1)}px;--dy:${(-Math.cos(meio) * 9).toFixed(1)}px;--d:${i * 70}ms" role="button" tabindex="0" aria-label="${esc(dados[i].n)}: ${esc(dados[i].p)}">
      <path class="c" d="${dd}"/><path class="l" d="${dd}"/><path class="g" d="${dd}"/><path class="b" d="M${h0x.toFixed(1)} ${h0y.toFixed(1)} A${R - 5} ${R - 5} 0 ${big} 1 ${h1x.toFixed(1)} ${h1y.toFixed(1)}"/></g>`; }).join('');
  const nAt = its.filter((i) => i.valor > 0.005).length;
  return `<section class="bas-ctw" data-ctw="${esc(JSON.stringify(dados))}" data-total="${esc(basCent(total))}" data-resumo="${esc(`${nAt} ${nAt === 1 ? 'ativo' : 'ativos'} em ${vivas.length} ${vivas.length === 1 ? 'produto' : 'produtos'}`)}">
    <div class="bas-ctw-r"><svg viewBox="0 0 300 262" aria-label="Alocação por produto. Toque numa parte do anel."><defs>
        <linearGradient id="ctw-onw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#E4F6FF"/><stop offset="1" stop-color="#9FDCFF"/></linearGradient>
        <pattern id="ctw-lis" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="1" y1="0" x2="1" y2="7" style="stroke:#fff;stroke-width:1.8;stroke-opacity:.92"/></pattern>
        <radialGradient id="ctw-gl" gradientUnits="userSpaceOnUse" cx="110" cy="40" r="170"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>${segs}</svg>
      <div class="bas-ctw-c"><small data-ctw-k>Total investido</small><b data-ctw-v>${basCent(total)}</b></div></div>
    <div class="bas-ctw-tx" aria-live="polite"><b data-ctw-n>Sua carteira</b><span data-ctw-s>${esc(`${nAt} ${nAt === 1 ? 'ativo' : 'ativos'} em ${vivas.length} ${vivas.length === 1 ? 'produto' : 'produtos'}`)}</span><em data-ctw-t hidden></em></div>
    <div class="bas-ctw-pt" role="group" aria-label="Classes">${dados.map((d, i) => `<button data-ctw-i="${i}" aria-label="${esc(d.n)}"></button>`).join('')}</div>
  </section>`;
}
function basCtwLigar() {
  const w = document.querySelector('.bas-ctw[data-ctw]'); if (!w || w.dataset.lig) return; w.dataset.lig = '1'; const D = JSON.parse(w.dataset.ctw); let sel = -1;
  const q = (s) => w.querySelector(s);
  const vai = (i) => { sel = i; const d = D[i]; w.classList.toggle('tem-sel', i >= 0);
    w.querySelectorAll('.bas-ctw-s').forEach((g) => g.classList.toggle('on', +g.dataset.i === i)); w.querySelectorAll('[data-ctw-i]').forEach((b) => b.classList.toggle('on', +b.dataset.ctwI === i));
    const tx = q('.bas-ctw-tx'); tx.classList.remove('troca'); void tx.offsetWidth; tx.classList.add('troca');
    q('[data-ctw-k]').textContent = d ? d.sub : 'Total investido'; q('[data-ctw-v]').innerHTML = d ? d.v : w.dataset.total;
    q('[data-ctw-n]').textContent = d ? d.n : 'Sua carteira'; q('[data-ctw-s]').textContent = d ? '' : w.dataset.resumo;
    const t = q('[data-ctw-t]'); t.hidden = !(d && d.t); t.textContent = d ? d.t : ''; t.className = d ? d.tk : '';
    const pg = w.closest('.bas-pg'); if (pg) { pg.querySelectorAll('.bas-ct-vis, .bas-ct-al:not(.bas-ct-so)').forEach((x) => { x.hidden = !!d; });
      pg.querySelectorAll('[data-ctw-lista]').forEach((x) => { x.hidden = +x.dataset.ctwLista !== i; }); const h = pg.querySelector('[data-ctw-h]'); if (h) h.textContent = d ? d.n : 'Minha carteira'; }
    if (typeof basSom === 'function') basSom('toque'); if (typeof basVibra === 'function') basVibra(8); };
  const toca = (i) => vai(i === sel ? -1 : i); // tocar de novo na mesma parte volta ao anel inteiro
  w.addEventListener('click', (e) => { const g = e.target.closest('.bas-ctw-s'); const b = e.target.closest('[data-ctw-i]'); if (g) toca(+g.dataset.i); else if (b) toca(+b.dataset.ctwI); });
  w.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') vai((sel + 1) % D.length); else if (e.key === 'ArrowLeft') vai((sel - 1 + D.length) % D.length); else if (e.key === 'Enter' && e.target.matches('.bas-ctw-s')) toca(+e.target.dataset.i); });
  const anel = q('.bas-ctw-r'); let x0 = null; anel.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  anel.addEventListener('pointerup', (e) => { if (x0 != null && Math.abs(e.clientX - x0) > 40) { const dir = e.clientX < x0 ? 1 : -1; vai(sel < 0 ? (dir > 0 ? 0 : D.length - 1) : (sel + dir + D.length) % D.length); } x0 = null; });
}
// onde investir o dinheiro do mês: o disponível (E.disponivelAporte) vem preenchido e é dividido pelos alvos (E.rebalance, sem
// vender nada); cada valor pode ser trocado, um ativo pode sair (×) e o + inclui outro que você já tem ou um novo. "Registrar"
// soma tudo ao aporte do mês de uma vez (o novo entra por ativoInserir, a mesma regra do cadastro).
function basTelaOndeInvestir() {
  const { M } = cartAnalise(); const D = M.D || {}; const disp = Math.max(0, +D.disponivel || 0); const comAlvo = M.sumAlvo > 0;
  const its = M.items.map((i) => ({ id: i.a.id, n: i.a.nome, c: i.a.classe || '', w: i.alvo, v: i.valor, pr: i.preco || 0 }));
  return `<div class="bas-pg bas-pg-oi" data-oi="${esc(JSON.stringify(its))}" data-alvo="${comAlvo ? 1 : 0}"><div class="bas-gt-bg bas-pt-bg">
    <header class="bas-pv2-h"><button class="bell bas-cal-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><b>Onde investir</b><span class="bas-noite-r">${olhoHtml()}</span></header>
    <small class="bas-pv2-k">Disponível para investir em ${esc(MES_LONGO[S.mes])}</small><b class="bas-pv2-t">${basCent(disp)}</b>
    <p class="bas-pv2-var"><span>${comAlvo ? 'Dividido pelos seus alvos. Ajuste como quiser.' : 'Defina seus alvos para o app dividir por você.'}</span></p>
  </div><div class="bas-gt-folha">
    <div class="card bas-oi-c"><label class="bas-oi-v"><small>Vou investir</small><span><i>R$</i><input data-oi-v inputmode="decimal" value="${disp ? esc(nf.format(disp)) : ''}" placeholder="0,00" aria-label="Quanto vai investir"></span></label>
      <div class="bas-oi-at">${disp > 0 ? `<button data-oi-tudo="${esc(nf.format(disp))}">Usar o disponível</button>` : ''}${comAlvo ? '<button data-oi-sug>Dividir pelos alvos</button>' : `<button ${basIr('alvos')}>Definir alvos</button>`}</div></div>
    <div class="bas-ch bas-oi-ch"><h2 class="bas-h2">Para onde vai</h2><small data-oi-soma></small></div>
    <ul class="card bas-oi-l" data-oi-l></ul>
    <button class="bas-oi-mais" data-oi-mais aria-expanded="false">${I.plus}<span>Adicionar ativo</span></button>
    <button class="btn primary lg bas-cta bas-oi-reg" data-act="bas-oi-reg" ${temRecurso('aporte_simples') ? '' : 'disabled'}>Registrar em ${esc(MES_LONGO[S.mes])}</button>
  </div></div>`;
}
function basOiLigar() {
  const pg = document.querySelector('.bas-pg-oi[data-oi]'); const inp = pg && pg.querySelector('[data-oi-v]'); if (!inp || inp.dataset.lig) return; inp.dataset.lig = '1';
  const its = JSON.parse(pg.dataset.oi); const comAlvo = pg.dataset.alvo === '1'; const lista = pg.querySelector('[data-oi-l]'); const reg = pg.querySelector('.bas-oi-reg');
  let linhas = []; // { id (ou null para ativo novo), n, c, tipo, s }
  const num = (x) => Math.max(0, parseReais(String(x || '0')) || 0); const fmt = (v) => (v ? nf.format(v) : '');
  const sugere = () => { const v = num(inp.value); if (!comAlvo) return; const rb = E.rebalance(its.map((i) => ({ w: i.w, v: i.v })), v);
    const novos = linhas.filter((l) => !l.id); linhas = its.map((i, k) => ({ id: i.id, n: i.n, c: i.c, s: Math.round((rb.alloc[k] || 0) * 100) / 100 })).filter((l) => l.s > 0.004).sort((a, b) => b.s - a.s).concat(novos); };
  const soma = () => linhas.reduce((t, l) => t + (+l.s || 0), 0);
  const status = () => { const v = num(inp.value); const t = soma(); const el = pg.querySelector('[data-oi-soma]'); const dif = Math.round((v - t) * 100) / 100;
    el.textContent = !linhas.length ? '' : Math.abs(dif) < 0.01 ? `${brl(t)} · tudo distribuído` : dif > 0 ? `${brl(t)} · faltam ${brl(dif)}` : `${brl(t)} · ${brl(-dif)} a mais`;
    el.className = Math.abs(dif) < 0.01 ? 'ok' : dif < 0 ? 'neg' : ''; if (reg) reg.disabled = !linhas.some((l) => l.s > 0.004) || !temRecurso('aporte_simples');
    pg.dataset.alloc = JSON.stringify(linhas.filter((l) => l.s > 0.004)); };
  const desenha = () => { lista.innerHTML = linhas.length ? linhas.map((l, k) => `<li data-k="${k}"><span class="bas-ct-lg sm" style="--bc:${l.id ? BAS_CT_COR[0] : BAS_CT_COR[3]}">${esc(basSigla(l.n))}</span><span class="bas-ct-an"><b>${esc(l.n)}</b><small>${l.id ? esc(l.c) : `Novo · ${esc(l.c)}`}</small></span>
      <label class="bas-oi-in"><i>R$</i><input data-oi-s="${k}" inputmode="decimal" value="${esc(fmt(l.s))}" placeholder="0,00" aria-label="Quanto em ${esc(l.n)}"></label><button class="bas-oi-x" data-oi-x="${k}" aria-label="Tirar ${esc(l.n)}">${I.x}</button></li>`).join('')
    : `<li class="bas-oi-vz">${comAlvo ? 'Digite quanto vai investir ou adicione um ativo.' : 'Adicione os ativos em que vai investir.'}</li>`; status(); };
  const foco = () => { const q = lista.querySelector(`[data-oi-s="${linhas.length - 1}"]`); if (q) q.focus(); };
  // adicionar: janela com duas abas, "Que já tenho" (busca e lista por classe) e "Ativo novo" (nome e a classe escolhida entre as que já existem)
  const classes = [...new Set(its.map((i) => i.c).filter(Boolean))]; const corC = (c) => BAS_CT_COR[Math.max(0, classes.indexOf(c)) % BAS_CT_COR.length];
  const tipoDe = (c) => { const a = S.plan.ativos.find((x) => (x.classe || '') === c); return a ? (a.tipo === 'RENDA FIXA' ? 'RENDA FIXA' : 'BOLSA DE VALORES') : basEhRf({ classe: c }) ? 'RENDA FIXA' : 'BOLSA DE VALORES'; };
  const abreAdd = () => { const fora = its.filter((i) => !linhas.some((l) => l.id === i.id)); const g = {}; fora.forEach((i) => { (g[i.c || 'Outros'] = g[i.c || 'Outros'] || []).push(i); });
    let tpl = document.getElementById('bas-oi-tpl'); if (!tpl) { tpl = document.createElement('template'); tpl.id = 'bas-oi-tpl'; document.body.appendChild(tpl); }
    const ab0 = fora.length ? 'ex' : 'novo';
    tpl.innerHTML = `<div class="seg bas-oi-seg" role="tablist">${[['ex', 'Que já tenho'], ['novo', 'Ativo novo']].map(([k, l]) => `<button type="button" role="tab" class="${k === ab0 ? 'on' : ''}" data-oi-aba="${k}" aria-selected="${k === ab0}">${l}</button>`).join('')}</div>
      <div data-oi-p="ex" ${ab0 === 'ex' ? '' : 'hidden'}>${fora.length ? `<label class="bas-mvp-b"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input type="search" data-oi-q placeholder="Buscar ativo ou classe" aria-label="Buscar ativo"></label>
        <ul class="bas-inv-ls">${Object.keys(g).map((c) => `<li class="bas-inv-g" data-q="${esc(c.toLowerCase())}">${esc(c)}</li>${g[c].map((i) => `<li data-q="${esc(`${i.n} ${c}`.toLowerCase())}"><button type="button" class="bas-ct-at" data-oi-add-id="${esc(i.id)}"><span class="bas-ct-lg" style="--bc:${corC(i.c)}">${esc(basSigla(i.n))}</span><span class="bas-ct-an"><b>${esc(i.n)}</b><small>${esc(c)}</small></span>${I.plus}</button></li>`).join('')}`).join('')}</ul>` : '<p class="bas-mvp-vz">Todos os seus ativos já estão na lista.</p>'}</div>
      <div data-oi-p="novo" class="bas-oi-novo2" ${ab0 === 'novo' ? '' : 'hidden'}><input data-oi-nn placeholder="Nome (ex.: PETR4, CDB Banco X)" aria-label="Nome do ativo novo">
        <p class="bas-inv-k">Classe</p><div class="bas-oi-cls">${classes.map((c) => `<button type="button" data-oi-cl="${esc(c)}" style="--bc:${corC(c)}"><i></i>${esc(c)}</button>`).join('')}<button type="button" data-oi-cl="" class="outra">${I.plus}Outra</button></div>
        <input data-oi-nc placeholder="Nome da classe nova (ex.: Ações BR)" aria-label="Classe nova" hidden>
        <button type="button" class="btn primary lg bas-cta" data-oi-novo disabled>Adicionar</button></div>`;
    const el = basUltPop('bas-oi-tpl', 'Adicionar ativo', 'Escolha um que você tem ou crie um novo'); if (!el) return;
    const q = (x) => el.querySelector(x); let cl = null; const lis = [...el.querySelectorAll('.bas-inv-ls li')];
    const pode = () => { q('[data-oi-novo]').disabled = !(q('[data-oi-nn]').value.trim() && (cl || (cl === '' && q('[data-oi-nc]').value.trim()))); };
    const fecha = () => q('[data-pop="x"]').click();
    el.addEventListener('input', (e) => { if (e.target.matches('[data-oi-q]')) { const t = e.target.value.trim().toLowerCase(); lis.forEach((li) => { li.hidden = !!t && !li.dataset.q.includes(t); }); } else pode(); });
    el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
      if (d.oiAba) { el.querySelectorAll('[data-oi-aba]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); }); el.querySelectorAll('[data-oi-p]').forEach((x) => { x.hidden = x.dataset.oiP !== d.oiAba; }); if (d.oiAba === 'novo') q('[data-oi-nn]').focus(); }
      else if (d.oiAddId) { const i = its.find((x) => x.id === d.oiAddId); if (i) { linhas.push({ id: i.id, n: i.n, c: i.c, s: 0 }); fecha(); desenha(); foco(); } }
      else if (d.oiCl != null) { cl = d.oiCl; el.querySelectorAll('[data-oi-cl]').forEach((x) => x.classList.toggle('on', x === b)); const nc = q('[data-oi-nc]'); nc.hidden = cl !== ''; if (cl === '') nc.focus(); pode(); }
      else if (d.oiNovo != null) { const n = q('[data-oi-nn]').value.trim(); const c = cl || q('[data-oi-nc]').value.trim(); if (!n || !c) return;
        linhas.push({ id: null, n, c, tipo: tipoDe(c), s: 0 }); fecha(); desenha(); foco(); }
      else return; basSom('toque'); }); };
  inp.addEventListener('input', () => { sugere(); desenha(); });
  pg.addEventListener('input', (e) => { const k = e.target.dataset.oiS; if (k == null) return; linhas[+k].s = num(e.target.value); status(); });
  pg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || !pg.contains(b)) return; const d = b.dataset;
    if (d.oiTudo) { inp.value = d.oiTudo; sugere(); desenha(); }
    else if (d.oiSug != null) { sugere(); desenha(); }
    else if (d.oiX != null) { linhas.splice(+d.oiX, 1); desenha(); }
    else if (d.oiMais != null) abreAdd();
    else return; if (typeof basSom === 'function') basSom('toque'); });
  sugere(); desenha();
}
function basOiRegistrar() {
  const pg = document.querySelector('.bas-pg-oi'); if (!pg || !temRecurso('aporte_simples')) return; const L = JSON.parse(pg.dataset.alloc || '[]'); if (!L.length) return; const m = S.mes;
  L.forEach((l) => { let a = l.id ? S.plan.ativos.find((x) => x.id === l.id) : null;
    if (!a && !l.id) { const tipo = l.tipo === 'RENDA FIXA' ? 'RENDA FIXA' : 'BOLSA DE VALORES'; a = ativoInserir({ tipo, classe: matchCase(l.c, suggest('classe', { tipo })), grupo: null, subgrupo: null, nome: l.n }); }
    if (a) a.ap[m] = E.r2((+a.ap[m] || 0) + (+l.s || 0)); });
  touch('plan'); basRetorno('pago'); basFechar(); basFesta('inv', 'Investimento registrado', `${L.length === 1 ? 'Aporte registrado' : `${L.length} aportes registrados`} em ${MES_LONGO[m]}.`);
}
// editar o ativo: nome, tipo e classe (em todos os anos) e excluir; o alvo da carteira acompanha a troca de nome ou classe
function basTelaAtivoEd(o) {
  const a = S.plan.ativos.find((x) => x.id === o.id); if (!a) return basSumiu();
  const classes = [...new Set(S.plan.ativos.map((x) => x.classe).filter(Boolean))];
  return basForm('ativo-ed', 'Editar ativo', `${basCampo('nome', 'Nome do ativo', a.nome, 'placeholder="Ex.: PETR4, CDB Banco X"')}
    ${basChips('tipo', [['BOLSA DE VALORES', 'Bolsa de valores'], ['RENDA FIXA', 'Renda fixa']], a.tipo === 'RENDA FIXA' ? 'RENDA FIXA' : 'BOLSA DE VALORES', 'Tipo')}
    ${basCampo('classe', 'Classe', a.classe || '', 'list="bas-dl-classe2" placeholder="Ex.: Ações, CDB, Fundos imobiliários"')}<datalist id="bas-dl-classe2">${classes.concat(["CDB's", 'Tesouro Direto', 'Ações BR', 'Fundos Imobiliários', "ETF's"]).filter((c, i, l) => l.indexOf(c) === i).map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist>`, { excluir: 'Excluir ativo' });
}
function basSalvarAtivoEd(f, d, t, ok) {
  const nome = (d.nome || '').trim(); const classe = (d.classe || '').trim(); if (!nome || !classe) return basErro(f, 'Preencha o nome e a classe.');
  const a0 = S.plan.ativos.find((x) => x.id === t.id); if (!a0) return; const k0 = E.ativoKey(a0); const tipo = d.tipo === 'RENDA FIXA' ? 'RENDA FIXA' : 'BOLSA DE VALORES';
  [...new Set([...Object.values(S.plans), S.plan])].forEach((pl) => (pl.ativos || []).forEach((x) => { if (x.id === a0.id) { x.nome = nome; x.classe = classe; x.tipo = tipo; } }));
  const k1 = E.ativoKey(a0); if (k1 !== k0) { (S.profile.carteira || []).forEach((e) => { if (e.k === k0) e.k = k1; }); touch('profile'); }
  ok('Ativo atualizado.');
}
const BAS_CT_VIS = [['classes', 'Classes'], ['produtos', 'Produtos'], ['ativos', 'Ativos']];
// o grande grupo do ativo, lido do nome da classe cadastrada (e do tipo, para a renda fixa)
function basMacro(a) {
  const c = String(a.classe || '');
  if (/mutual|exterior|internac|global|bdr|stock|reit/i.test(c)) return 'Internacional';
  if (/previd/i.test(c)) return 'Previdência';
  if (/imobili|fii/i.test(c)) return 'Fundos imobiliários';
  if (/fundo|multimerc/i.test(c)) return 'Fundos';
  if (a.tipo === 'RENDA FIXA' || /cdb|lc[ia]|cr[ia]|tesouro|deb[eê]n|poupan|renda fixa/i.test(c)) return 'Renda fixa';
  return 'Ações e outros';
}
function basTelaCarteira() {
  const { M, K } = cartAnalise(); const total = M.total; const its = M.items.filter((i) => i.valor > 0.005 || i.alvo > 0); const comAlvo = M.sumAlvo > 0;
  const cls = K.classes.filter((c) => c.valor > 0.005 || c.alvo > 0).sort((a, b) => b.valor - a.valor); const corC = (c) => BAS_CT_COR[cls.indexOf(c) % BAS_CT_COR.length];
  const corDe = (classe) => { const c = cls.find((x) => (x.classe || '') === (classe || '')); return c ? corC(c) : BAS_CT_COR[0]; };
  // série de cada ativo (para as mini linhas)
  const series = new Map(); its.forEach((i) => series.set(i, basAtSerie(i.a)));
  const vivos = its.filter((i) => i.valor > 0.005).sort((a, b) => b.valor - a.valor); const pc = (v) => pct(total > 0 ? v / total : 0, 1);
  const linhaAt = (i, prod) => { const s = series.get(i) || []; return `<li><button class="bas-ct-at" ${basIr('ativo', { id: i.a.id })}><span class="bas-ct-lg" style="--bc:${corDe(i.a.classe)}">${esc(basSigla(i.a.nome))}</span><span class="bas-ct-an"><b>${esc(i.a.nome)}</b><small>${prod ? `${esc(i.a.classe || 'Outros')} · ` : ''}${pc(i.valor)}</small></span>${basSpark(s.slice(-12).map((p) => p.c))}<b class="bas-ct-av">${basCent(i.valor)}</b></button></li>`; };
  // três jeitos de ver: Classes (o grande grupo, por basMacro), Produtos (a classe cadastrada) e Ativos (os maiores; o resto no "Ver todos")
  const vis = BAS_CT_VIS.some(([k]) => k === S.basCartVis) ? S.basCartVis : 'classes'; const aberta = S.basCartAbre;
  const grupos = (chave) => { const g = new Map(); vivos.forEach((i) => { const k = chave(i.a); if (!g.has(k)) g.set(k, []); g.get(k).push(i); });
    return [...g].map(([n, l]) => ({ n, l, v: l.reduce((t, i) => t + i.valor, 0) })).sort((x, y) => y.v - x.v); };
  const corMacro = new Map(); const linhaG = (g, k, cor) => { const id = `${vis}:${g.n}`; const ab = aberta === id;
    return `<li class="${ab ? 'on' : ''}"><button class="bas-ct-ch" data-act="bas-cart-cl" data-v="${esc(id)}" aria-expanded="${ab}"><i style="--bc:${cor}"></i><span><b>${esc(g.n)}</b><small>${pc(g.v)} · ${g.l.length} ${g.l.length === 1 ? 'ativo' : 'ativos'}</small></span><b class="bas-ct-cv">${basCent(g.v)}</b><svg class="bas-ct-sc" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg><span class="bas-ct-pb" aria-hidden="true"><i style="--bc:${cor};--p:${total > 0 ? ((g.v / total) * 100).toFixed(1) : 0}%"></i></span></button>
      ${ab ? `<ul class="bas-ct-ats">${g.l.map((i) => linhaAt(i, vis === 'classes')).join('')}</ul>` : ''}</li>`; };
  const TOP = 5; const corpo = vis === 'ativos' ? `<ul class="bas-ct-cl bas-ct-top">${vivos.slice(0, TOP).map((i) => linhaAt(i, true)).join('')}</ul>${vivos.length > TOP ? `<button class="bas-ct-mais" data-act="bas-cart-todos">Ver todos os ${vivos.length} ativos</button><template id="bas-ct-tpl"><ul class="bas-ct-cl bas-ct-top">${vivos.map((i) => linhaAt(i, true)).join('')}</ul></template>` : ''}`
    : `<ul class="bas-ct-cl">${(vis === 'classes' ? grupos(basMacro) : grupos((a) => a.classe || 'Outros')).map((g, k) => linhaG(g, k, vis === 'classes' ? BAS_CT_COR[k % BAS_CT_COR.length] : corDe(g.n === 'Outros' ? '' : g.n))).join('')}</ul>`;
  const alocacao = total > 0 ? `<div class="seg bas-ct-vis" role="tablist" aria-label="Ver a carteira por">${BAS_CT_VIS.map(([k, l]) => `<button role="tab" class="${vis === k ? 'on' : ''}" data-act="bas-cart-vis" data-v="${k}" aria-selected="${vis === k}">${l}</button>`).join('')}</div>
    <div class="card bas-ct-al">${corpo}</div>${cls.filter((c) => c.valor > 0.005).map((c, k) => { const l = vivos.filter((i) => (i.a.classe || '') === (c.classe || ''));
      return `<div class="card bas-ct-al bas-ct-so" data-ctw-lista="${k}" hidden><ul class="bas-ct-cl bas-ct-top">${l.map((i) => linhaAt(i, false)).join('')}</ul></div>`; }).join('')}` : basCard(basVazio('Sua carteira aparece aqui quando você registrar o primeiro investimento.'));
  return `<div class="bas-pg bas-pg-ctw"><div class="bas-gt-bg bas-pt-bg bas-ctw-bg">
    <header class="bas-pv2-h"><button class="bell bas-cal-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><b>Minha carteira</b><span class="bas-noite-r">${olhoHtml()}</span></header>
    ${basCtwHtml(cls, total, comAlvo, its)}
  </div><div class="bas-gt-folha">
    ${its.length ? `<div class="bas-pg-per bas-gt-acoes"><button class="bas-circ bas-en-bt" ${basIr('alvos')}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/></svg><span>Alvos</span></button><button class="bas-inv-pl" ${basIr('aportar')}>${I.plus}<span>Onde investir</span></button></div>` : ''}
    ${basSecao('<span data-ctw-h>Minha carteira</span>', '', alocacao)}${basRecHtml()}
    </div></div>`;
}
/* ---- App completo: limites, avisos, simulador do sonho e alvos da carteira ---- */
const I_SINO = ic('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>');
const I_IMPORTAR = ic('<path d="M12 4v11m0 0-4-4m4 4 4-4"/><path d="M5 19.5h14"/>');
const basPago = () => temRecurso('investimentos'); // recursos do App para quem paga (Investidor ou Assessoria)
// limite de gastos: sem área, o limite do mês (orçamento padrão); com área, o limite daquela categoria (plan.settings.limites)
function basTelaLimite(o) {
  const st = S.plan.settings; const area = o.area || ''; const atual = area ? +((st.limites || {})[area]) || 0 : +st.orcPadrao || 0;
  return basForm('limite', area ? `Limite de ${esc(area)}` : 'Limite do mês', `${basValor('valor', atual, area ? `Quanto quer gastar com ${esc(area)} por mês?` : 'Quanto quer gastar por mês, no máximo?')}
    <p class="bas-p">${area ? 'O app avisa quando os gastos da categoria chegarem a 80% e quando passarem.' : 'Vale para todos os meses. O anel de Gastos mostra quanto do limite já foi usado.'}</p>`, { excluir: atual ? 'Tirar o limite' : '' });
}
// central de avisos (as regras são as do SaaS, em E.notificacoes): tocar abre o lugar certo e marca como lido
function basTelaAvisos() {
  const L = typeof notifLista === 'function' ? notifLista() : []; const novos = L.filter((n) => !n.lida).length;
  return basDet('Avisos', `${novos ? `<button class="btn bas-cta bas-add" data-act="bas-avisos-lidos">${I.check}Marcar todos como lidos</button>` : ''}
    ${L.length ? `<ul class="bas-avisos">${L.map((n) => `<li class="${n.lida ? 'lida' : ''} ${esc(n.nivel || '')}"><button data-act="bas-aviso" data-id="${esc(n.id)}"><span class="bas-ini" aria-hidden="true">${I_SINO}</span><span class="bas-n"><b>${esc(n.titulo || '')}</b><small>${esc(n.texto || '')}</small></span>${n.cta ? I.chev : ''}</button></li>`).join('')}</ul>`
      : basCard(basVazio('Nenhum aviso agora. Tudo em dia.'))}`);
}
// simulador "E se eu investir mais?" do sonho em foco (E.simularObjetivo); o controle atualiza só os textos, sem render()
const basMesAno = (meses) => { if (meses == null) return 'fora do alcance'; const h = new Date(); const t = h.getMonth() + meses; return `${MES[t % 12].toLowerCase()}/${h.getFullYear() + Math.floor(t / 12)}`; };
// E se eu investir mais? Calculadora de juros compostos (E.jurosCompostos, testada): valor inicial, aporte por mês, taxa ao ano e prazo,
// com o gráfico do que você põe e do que os juros somam, e quando cada sonho é alcançado. Atualiza na hora, sem render().
const BAS_JC_PRAZOS = [1, 3, 5, 10, 20, 30];
const basPrazoTxt = (m) => (m == null ? 'fora do alcance' : m === 0 ? 'já alcançado' : `${m >= 12 ? `${Math.floor(m / 12)} ano${m >= 24 ? 's' : ''}` : ''}${m >= 12 && m % 12 ? ' e ' : ''}${m % 12 ? `${m % 12} ${m % 12 === 1 ? 'mês' : 'meses'}` : ''}`);
function basJcVals(f) {
  const n = (k) => { const el = f && f.querySelector(`[data-jc="${k}"]`); return el ? parseReais(el.value) : NaN; };
  const anos = +((f && f.querySelector('input[name="jc-prazo"]:checked')) || {}).value || 10;
  return { inicial: Math.max(0, n('ini') || 0), aporte: Math.max(0, n('ap') || 0), taxa: Math.min(100, Math.max(0, Number.isFinite(n('tx')) ? n('tx') : 0)), anos };
}
function basJcOut(v) {
  const sonhos = objAnalise().itens; const J = E.jurosCompostos({ inicial: v.inicial, aporte: v.aporte, taxa: v.taxa, meses: v.anos * 12, metas: sonhos.map((g) => ({ id: g.id, nome: objNomeDe(g), valor: g.valor, g })) });
  const W = 300; const H = 140; const mx = Math.max(1, J.final); const nS = J.serie.length; const x = (i) => (nS > 1 ? (i / (nS - 1)) * W : W / 2); const y = (val) => H - 4 - (val / mx) * (H - 12);
  const linha = (k) => J.serie.map((p0, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p0[k]).toFixed(1)}`).join(' ');
  const area = (k) => `${linha(k)} L${W} ${H} L0 ${H} Z`;
  const marcas = J.metas.filter((m) => m.meses != null && m.meses > 0 && m.meses <= nS).map((m) => `<line class="bas-jc-m" x1="${x(m.meses - 1).toFixed(1)}" x2="${x(m.meses - 1).toFixed(1)}" y1="0" y2="${H}"/><circle class="bas-jc-mp" cx="${x(m.meses - 1).toFixed(1)}" cy="${y(J.serie[m.meses - 1].total).toFixed(1)}" r="4"/>`).join('');
  const pJ = J.final > 0 ? J.juros / J.final : 0;
  return `<div class="card bas-jc-res"><small class="bas-k">Em ${v.anos} ${v.anos === 1 ? 'ano' : 'anos'} você teria</small><b class="bas-jc-v">${basCent(J.final)}</b>
      <div class="bas-jc-leg"><span><i class="ap"></i>Você investe <b>${brl0(J.aportado)}</b></span><span><i class="jr"></i>Juros somam <b>${brl0(J.juros)}</b>${pJ > 0 ? ` <em>${pct(pJ)}</em>` : ''}</span></div>
      <svg class="bas-jc-g" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path class="bas-jc-at" d="${area('total')}"/><path class="bas-jc-aa" d="${area('aportado')}"/><path class="bas-jc-lt" d="${linha('total')}"/>${marcas}</svg>
      <span class="bas-jc-x" aria-hidden="true"><b>hoje</b><b>${Math.round(v.anos / 2) || ''}${v.anos > 1 ? ' anos' : ''}</b><b>${v.anos} ${v.anos === 1 ? 'ano' : 'anos'}</b></span></div>
    ${J.metas.length ? basSecao('Quando chega em cada sonho', '', `<ul class="bas-ativ bas-jc-sn">${J.metas.map((m, i) => `<li><span class="bas-row">${objIcone(m.g, i)}${basNome(esc(m.nome), brl0(m.valor))}<b class="${m.meses != null && m.meses <= nS ? 'pos' : ''}">${basPrazoTxt(m.meses)}</b></span></li>`).join('')}</ul>`) : ''}`;
}
function basSimOut(g, v, tx) {
  const R = E.simularObjetivo({ patrimonio: g.saldo, aporte: g.aporte, extra: v - g.aporte, retornoBase: tx, retorno: tx, alvo: g.valor });
  const h = new Date(); const pz = g.ano ? (g.ano - h.getFullYear()) * 12 + 11 - h.getMonth() : null; const m = R.sim.meses;
  let tag = m == null ? '<span class="bas-sn-st baixo">Fora do alcance</span>' : ''; if (m != null && pz != null) { const d = pz - m; tag = d === 0 ? '<span class="bas-sn-st ok">Bem no prazo</span>' : d > 0 ? `<span class="bas-sn-st ok">${basPrazoTxt(d)} antes do prazo</span>` : `<span class="bas-sn-st atencao">${basPrazoTxt(-d)} depois do prazo</span>`; }
  const ganho = R.diferenca != null && R.diferenca !== 0 ? (R.diferenca > 0 ? `<em class="pos">${basPrazoTxt(R.diferenca)} mais cedo</em>` : `<em class="neg">${basPrazoTxt(-R.diferenca)} mais tarde</em>`) : '';
  return `<div class="card bas-sm2-r"><small class="bas-k">Você chega lá em</small><b class="bas-sm2-d">${m == null ? 'Fora do alcance' : m === 0 ? 'Já chegou' : basMesAno(m)}</b>${tag}
      ${m > 0 ? `<p class="bas-sm2-j">Até lá você guarda <b>${brl0(R.sim.aportado - g.saldo)}</b> e os juros somam <b>${brl0(R.sim.juros)}</b>.</p>` : ''}</div>
    <ul class="card bas-sm2-cmp"><li><span>Como está hoje<small>${brl0(g.aporte)} por mês</small></span><b>${R.base.meses == null ? 'fora do alcance' : basMesAno(R.base.meses)}</b></li>
      <li class="on"><span>Com o novo valor<small>${brl0(v)} por mês</small></span><b>${m == null ? 'fora do alcance' : basMesAno(m)}${ganho}</b></li></ul>`;
}
function basSimAtualiza(f) { const g = objAnalise().itens.find((x) => x.id === f.dataset.id); if (!g) return;
  const v = Math.max(0, parseReais(f.querySelector('[data-sim-v]').value) || 0); const r = f.querySelector('[data-sim-r]'); if (r && +r.value !== v) r.value = Math.min(+r.max, v);
  f.querySelector('.bas-sm2-out').innerHTML = basSimOut(g, v, +f.dataset.tx); }
const basInt = (n) => Math.round(+n || 0).toLocaleString('pt-BR'); // só para o campo de edição
const BAS_SIM_TX = [[6, 'Poupança'], [10, 'Renda fixa'], [12, 'Equilibrado'], [15, 'Mais ousado']];
function basTelaSimular(o) {
  const gS = o.id ? objAnalise().itens.find((x) => x.id === o.id) : objFoco(objAnalise());
  if (gS && gS.valor > 0) { const tx = +S.profile.retornoAnual || 10; const v0 = Math.round(gS.aporte) || 0; const mx = Math.max(1000, Math.ceil(Math.max(v0 * 3, (gS.necessario || 0) * 1.5) / 100) * 100);
    return basDet('E se eu guardar mais?', `<form class="bas-sm2" data-id="${esc(gS.id)}" data-tx="${tx}" onsubmit="return false">
      <div class="card bas-sm2-c"><small class="bas-k">Quanto você guarda por mês para ${esc(objNomeDe(gS))}?</small>
        <div class="bas-sm2-v"><button type="button" data-sim-d="-100" aria-label="Menos 100 reais">−</button><label><i>R$</i><input data-sim-v inputmode="decimal" value="${esc(basInt(v0))}" aria-label="Valor por mês"></label><button type="button" data-sim-d="100" aria-label="Mais 100 reais">+</button></div>
        <input type="range" class="bas-sm2-rg" data-sim-r min="0" max="${mx}" step="50" value="${Math.min(mx, v0)}" aria-label="Arraste para mudar o valor por mês"></div>
      <div class="bas-sm2-out" aria-live="polite">${basSimOut(gS, v0, tx)}</div>
      <div class="card bas-sm2-tx"><button type="button" class="bas-sm2-txb" data-sim-tx-abre aria-expanded="false"><span class="bas-sm2-txi" aria-hidden="true">${I.inv}</span><span>Rendendo<b data-sim-tx-v>${String(tx).replace('.', ',')}% ao ano</b></span><em>Mudar</em></button>
        <div class="bas-sm2-txs" hidden>${BAS_SIM_TX.map(([t, n]) => `<button type="button" class="${t === tx ? 'on' : ''}" data-sim-tx="${t}"><b>${t}%</b><small>${n}</small></button>`).join('')}</div></div></form>
      <p class="bas-sm2-nota">Só uma simulação. O rendimento pode ser menor.</p>`); }
  return basTelaJc(o);
}
// régua, campo e − / + mudam só o resultado, sem render()
document.addEventListener('input', (e) => { const f = e.target.closest && e.target.closest('form.bas-sm2'); if (!f) return;
  if (e.target.matches('[data-sim-r]')) f.querySelector('[data-sim-v]').value = basInt(+e.target.value); basSimAtualiza(f); });
document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('[data-sim-tx-abre]');
  if (a) { const l = a.nextElementSibling; l.hidden = !l.hidden; a.setAttribute('aria-expanded', String(!l.hidden)); return; }
  const t = e.target.closest && e.target.closest('[data-sim-tx]');
  if (t) { const f = t.closest('form.bas-sm2'); f.dataset.tx = t.dataset.simTx; f.querySelector('[data-sim-tx-v]').textContent = `${t.dataset.simTx}% ao ano`;
    t.parentNode.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === t)); basVibra(6); basSimAtualiza(f); return; }
  const b = e.target.closest && e.target.closest('[data-sim-d]'); if (!b) return; const f = b.closest('form.bas-sm2'); const inp = f.querySelector('[data-sim-v]');
  inp.value = basInt(Math.max(0, (parseReais(inp.value) || 0) + +b.dataset.simD)); basVibra(6); basSimAtualiza(f); });
function basTelaJc(o) {
  const g = o.id ? objAnalise().itens.find((x) => x.id === o.id) : objFoco(objAnalise()); const C = S.C; const ult = S.year === NOW_Y ? NOW_M : 11;
  const v0 = { inicial: Math.round(g ? g.saldo : C.patrimonio[ult]) || 0, aporte: Math.round(g ? g.aporte : +S.plan.settings.metaAporte || 0) || 0, taxa: +S.profile.retornoAnual || 10, anos: 10 };
  const campo = (k, rot, val, suf) => `<label class="bas-jc-f"><span>${rot}</span><span class="bas-jc-in">${suf ? '' : '<i>R$</i>'}<input data-jc="${k}" inputmode="decimal" value="${esc(nf.format(val))}">${suf ? `<i>${suf}</i>` : ''}</span></label>`;
  return basDet('E se eu investir mais?', `<form class="bas-jc" onsubmit="return false">
      <div class="card bas-jc-c">${campo('ini', 'Valor inicial', v0.inicial)}${campo('ap', 'Aporte por mês', v0.aporte)}${campo('tx', 'Taxa ao ano', v0.taxa, '% a.a.')}
        <fieldset class="bas-fs bas-jc-p"><legend>Prazo</legend><div class="bas-chips">${BAS_JC_PRAZOS.map((a) => `<label class="bas-chip"><input type="radio" name="jc-prazo" value="${a}" ${a === v0.anos ? 'checked' : ''}><span>${a} ${a === 1 ? 'ano' : 'anos'}</span></label>`).join('')}</div></fieldset></div>
      <div class="bas-jc-out" aria-live="polite">${basJcOut(v0)}</div></form>
    <p class="bas-disc keep">Simulação com juros compostos e taxa constante, só para comparar cenários. Não é promessa de rentabilidade: investimentos podem render menos ou ter perdas.</p>`);
}
// digitar ou trocar o prazo refaz só o resultado (um quadro por vez)
let basJcQ = 0;
document.addEventListener('input', (e) => { const f = e.target.closest && e.target.closest('form.bas-jc'); if (!f || basJcQ) return;
  basJcQ = requestAnimationFrame(() => { basJcQ = 0; const out = f.querySelector('.bas-jc-out'); if (out) out.innerHTML = basJcOut(basJcVals(f)); }); });
// alvos da carteira: quanto de cada investimento (em %), gravado em S.profile.carteira como no SaaS

/* ---- App pago: vitrine "Para você", Seu ano, Histórico, Raio-X dos gastos, Resumo do mês, calendário de proventos e recomendação ---- */
const I_ANO = ic('<path d="M4 19V10M9.5 19V5M15 19v-7M20.5 19V8"/>');
const I_RAIOX = ic('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20M8 11.5l2 2 3.5-4"/>');
const I_PLAY = ic('<path d="M8 5.5v13l10.5-6.5z"/>');
const I_PARTILHA = ic('<path d="M12 15V3.5m0 0-4 4m4-4 4 4"/><path d="M6 11.5H5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 5 20.5h14a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5h-1"/>');
const I_REC = ic('<path d="M12 3.5 14.4 8.6 20 9.3l-4.1 3.8 1 5.5L12 15.9l-4.9 2.7 1-5.5L4 9.3l5.6-.7z"/>');
// vibração curta nos momentos que importam (salvar, pagar, excluir), onde o aparelho permitir
const basHaptico = () => { try { if (navigator.vibrate && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(8); } catch (e) { /* ignora */ } };
// barras mês a mês (SVG): valores de 12 meses, o mês em destaque, negativos em vermelho
function basBarras(vals, sel, cls) {
  const W = 300; const H = 120; const mx = Math.max(1, ...vals.map((v) => Math.abs(+v || 0))); const neg = vals.some((v) => v < 0); const base = neg ? H / 2 : H - 16; const esc0 = neg ? (H / 2 - 8) : (H - 24);
  const bw = W / 12;
  return `<svg class="bas-barras${cls ? ' ' + cls : ''}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${vals.map((v, i) => { const h = Math.max(2, (Math.abs(+v || 0) / mx) * esc0); const y = v < 0 ? base : base - h;
    return `<rect x="${(i * bw + 4).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 8).toFixed(1)}" height="${h.toFixed(1)}" rx="4" class="${v < 0 ? 'neg' : ''}${i === sel ? ' sel' : ''}" style="--i:${i}"/>`; }).join('')}
    ${neg ? `<line x1="0" x2="${W}" y1="${base}" y2="${base}" class="bas-barras-z"/>` : ''}</svg><div class="bas-barras-m" aria-hidden="true">${MES.map((m, i) => `<span${i === sel ? ' class="on"' : ''}>${m[0]}</span>`).join('')}</div>`;
}
// vitrine do Início: cartões de recursos; no gratuito, um convite bloqueado
// Seu ano: sobra de cada mês, melhor e pior mês, totais e a taxa de poupança (compute)
// página no padrão azul das outras (topo azul com o número grande e a folha por baixo)
const basPgAzul = (cls, tit, topo, folha, extra) => `<div class="bas-pg bas-pg-az ${cls}"><div class="bas-gt-bg bas-pt-bg">
    <header class="bas-pv2-h"><button class="bell bas-cal-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><b>${tit}</b><span class="bas-noite-r">${extra || ''}${olhoHtml()}</span></header>${topo}
  </div><div class="bas-gt-folha">${folha}</div></div>`;
// Histórico: patrimônio no fim de cada ano e o crescimento (E.historico, o mesmo da linha do tempo do SaaS); com um ano só, a linha mostra os meses dele
function basTelaHistorico() {
  const H = histDados(); const anos = H.anos || []; const t = H.totais || {}; const C = S.C; const ult = S.year === NOW_Y ? NOW_M : 11;
  const porAno = anos.length > 1; const pts = porAno ? anos.map((l) => ({ k: l.ano, v: l.patrimonioFim })) : C.patrimonio.slice(0, ult + 1).map((v, m) => ({ k: MES[m][0], v }));
  const W = 320; const HH = 120; const vs = pts.map((q) => q.v); const mn = Math.min(...vs); const mx = Math.max(...vs); const fo = (mx - mn) * 0.18 || mx * 0.05 || 1;
  const P = pts.map((q, i) => [pts.length > 1 ? 16 + (i / (pts.length - 1)) * (W - 32) : W / 2, HH - 6 - ((q.v - (mn - fo)) / ((mx + fo) - (mn - fo))) * (HH - 34)]);
  const d = P.length > 1 ? basCurva(P) : ''; const xp = (q) => ((q[0] / W) * 100).toFixed(2);
  const graf = P.length ? `<div class="bas-hs-g" aria-hidden="true"><div class="bas-hs-c"><svg viewBox="0 0 ${W} ${HH}" preserveAspectRatio="none"><defs><linearGradient id="bas-hs-gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      ${d ? `<path d="${d} L${P[P.length - 1][0].toFixed(1)} ${HH} L${P[0][0].toFixed(1)} ${HH} Z" fill="url(#bas-hs-gr)" class="bas-hs-a"/><path class="bas-hs-l" d="${d}"/>` : ''}</svg>
      ${P.map((q, i) => `<i class="bas-hs-d${i === P.length - 1 ? ' fim' : ''}${i === 0 && P.length > 1 ? ' ini' : ''}" style="left:${xp(q)}%;top:${((q[1] / HH) * 100).toFixed(2)}%">${porAno ? `<b>${tickFmt(pts[i].v)}</b>` : ''}</i>`).join('')}</div>
    <div class="bas-hs-x">${P.map((q, i) => `<span class="${i === P.length - 1 ? 'on' : ''}" style="left:${xp(q)}%">${pts[i].k}</span>`).join('')}</div></div>` : '';
  const up = (t.crescimento || 0) >= 0;
  const topo = `<small class="bas-pv2-k">Patrimônio hoje</small><b class="bas-pv2-t">${basCent(t.patrimonioAtual || C.patrimonio[ult] || 0)}</b>
    <p class="bas-pv2-var">${t.crescimento && anos[0] ? `${t.crescimentoPct != null ? `<span class="bas-ev-pct${up ? '' : ' neg'}">${up ? '↑' : '↓'} ${pct(Math.abs(t.crescimentoPct))}</span>` : ''}<span>${up ? '+' : '−'}${brl0(Math.abs(t.crescimento))} desde ${anos[0].ano}</span>` : '<span>O histórico cresce a cada ano planejado.</span>'}</p>${graf}`;
  const mxA = Math.max(1, ...anos.map((l) => l.patrimonioFim)); const comVar = anos.filter((l) => l.variacaoPct != null);
  const melhor = comVar.reduce((b, l) => (!b || l.variacaoPct > b.variacaoPct ? l : b), null);
  const media = anos.length > 1 && t.crescimento != null ? t.crescimento / (anos.length - 1) : null;
  const tiles = melhor ? `<div class="bas-sa-dupla"><div class="card bas-sa-t"><span class="bas-sa-ic" style="--bc:var(--pos)" aria-hidden="true">${I_GASTO}</span><small>Melhor ano</small><b>${melhor.ano}</b><em>+${pct(melhor.variacaoPct)}</em></div><div class="card bas-sa-t"><span class="bas-sa-ic" style="--bc:var(--accent)" aria-hidden="true">${I.inv}</span><small>Em média por ano</small><b>${media != null ? `${media >= 0 ? '+' : '−'}${brl0(Math.abs(media))}` : '—'}</b><em>de patrimônio</em></div></div>` : '';
  const linha = (l) => `<li><button class="bas-pv2-l" ${basIr('ano-hist', { id: l.ano })} aria-label="Análise de ${l.ano}"><span class="bas-pv2-n"><b>${l.ano}${l.parcial ? ' <small>até agora</small>' : ''}</b><i style="--p:${((l.patrimonioFim / mxA) * 100).toFixed(1)}%"></i></span><span class="bas-hs-v"><b>${brl0(l.patrimonioFim)}</b>${l.variacaoPct != null ? `<em class="${l.variacao >= 0 ? 'pos' : 'neg'}">${l.variacao >= 0 ? '+' : '−'}${pct(Math.abs(l.variacaoPct))}</em>` : ''}</span>${I.chev}</button></li>`;
  return basPgAzul('bas-pg-hs', 'Histórico', topo, anos.length ? `${tiles}${basSecao('Ano a ano', '', `<ul class="card bas-pv2-ls">${anos.slice().reverse().map(linha).join('')}</ul>`)}` : basCard(basVazio('Ainda sem anos com dados.')));
}
// análise de um ano (aberta pela setinha de cada ano no Histórico)
function basTelaAnoHist(o) {
  const H = histDados(); const anos = (H.anos || []).filter((l) => l.preenchido); const ano = +o.id || S.year; const k = anos.findIndex((l) => l.ano === ano); if (k < 0) return basSumiu();
  const L = anos[k]; const A = k > 0 ? anos[k - 1] : null; const ser = (H.serie || []).filter((p0) => p0.ano === ano);
  const apl = L.aplicado != null ? L.aplicado : L.aportes;
  const baseP = A ? A.patrimonioFim : L.patrimonioInicio; const varP = L.patrimonioFim - baseP;
  // colunas da sobra de cada mês (como as de Proventos); tocar num mês mostra entrou, saiu e sobrou dele no lugar do ano
  const sel = S.basAhMes != null && ser.some((q) => q.mes === S.basAhMes) ? S.basAhMes : null; const um = sel != null;
  const W = 320; const Hh = 130; const vs = ser.map((q) => q.patrimonio); const mn = Math.min(...vs, L.patrimonioInicio); const mx = Math.max(...vs, 1); const fg = (mx - mn) * 0.15 || mx * 0.05 || 1;
  const xM = (m) => ((m + 0.5) / 12) * W; const yV = (v) => Hh - 8 - ((v - (mn - fg)) / ((mx + fg) - (mn - fg))) * (Hh - 34);
  const mxD = Math.max(1, ...ser.map((q) => +q.proventos || 0)); const PA = ser.map((q) => [xM(q.mes), yV(q.patrimonio)]); const dA = PA.length > 1 ? basCurva(PA) : ''; const ultQ = ser[ser.length - 1]; const foco = um ? sel : ultQ ? ultQ.mes : null;
  const nums = (e0, g0, a0, d0) => ({ ent: brl0(e0), gas: brl0(g0), sob: brl0(e0 - g0), neg: e0 - g0 < 0 ? 1 : 0, apo: brl0(a0), div: brl0(d0) });
  const anoApo = (L.aplicado != null ? L.aplicado : L.aportes) || 0;
  const DD = { ult: ultQ ? ultQ.mes : null, ano: Object.assign(nums(L.entradas || 0, L.gastos || 0, anoApo, L.proventos || 0), { t: `No ano${L.parcial ? ' até agora' : ''}` }), m: {} };
  ser.forEach((q) => { DD.m[q.mes] = Object.assign(nums(+q.entradas || 0, +q.gastos || 0, +q.aplicado || 0, +q.proventos || 0), { t: cap(MES_LONGO[q.mes]), pl: tickFmt(q.patrimonio) }); });
  const linha = `<div class="bas-ah4-g" role="slider" tabindex="0" aria-label="Escolha um mês: toque ou arraste" data-d="${esc(JSON.stringify(DD))}"><svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bas-ah4g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      ${dA ? `<path class="bas-hs-a" d="${dA} L${PA[PA.length - 1][0].toFixed(1)} ${Hh} L${PA[0][0].toFixed(1)} ${Hh} Z" fill="url(#bas-ah4g)"/><path class="bas-ah4-h" d="${dA}"/><path class="bas-hs-l bas-ah4-l" d="${dA}"/>` : ''}</svg>
      ${ser.map((q) => { const on = q.mes === foco; return `<span class="bas-ah4-p${on ? ' on' : ''}" data-m="${q.mes}" style="left:${((xM(q.mes) / W) * 100).toFixed(2)}%;top:${((yV(q.patrimonio) / Hh) * 100).toFixed(2)}%" aria-label="${cap(MES_LONGO[q.mes])}: ${esc(brl0(q.patrimonio))}" aria-pressed="${q.mes === sel}"><i></i>${on ? `<b>${tickFmt(q.patrimonio)}</b>` : ''}</span>`; }).join('')}</div>
    <div class="bas-ah7-dv" aria-hidden="true">${MES.map((n, m) => { const q = ser.find((x0) => x0.mes === m); const d = q ? +q.proventos || 0 : 0; return `<span class="${m === foco ? 'on' : ''}"><i style="--h:${d > 0 ? Math.max(8, (d / mxD) * 100).toFixed(1) : 0}%"></i></span>`; }).join('')}</div>
    <div class="bas-ah2-x" aria-hidden="true">${MES.map((n, m) => `<span class="${m === foco ? 'on' : ser.some((q) => q.mes === m) ? '' : 'fut'}">${n[0]}</span>`).join('')}</div>
    <p class="bas-ah7-leg"><span><i class="l"></i>Patrimônio</span><span><i class="d"></i>Dividendos do mês</span></p>`;
  const qS = um ? ser.find((x0) => x0.mes === sel) : null;
  const apo = um ? +qS.aplicado || 0 : (L.aplicado != null ? L.aplicado : L.aportes) || 0; const div = um ? +qS.proventos || 0 : L.proventos || 0;
  const ent = um ? +qS.entradas || 0 : L.entradas; const gas = um ? +qS.gastos || 0 : L.gastos; const sob = ent - gas;
  const topo = `<div class="bas-ah-anos bas-ah2-anos" role="group" aria-label="Escolher o ano">${anos.map((l) => `<button class="${l.ano === ano ? 'on' : ''}" data-act="bas-ah-ano" data-y="${l.ano}" aria-pressed="${l.ano === ano}">${l.ano}</button>`).join('')}</div>
    <small class="bas-pv2-k">Patrimônio ${L.parcial ? `até ${MES_LONGO[L.meses - 1]}` : `no fim de ${ano}`}</small><b class="bas-pv2-t">${basCent(L.patrimonioFim)}</b>
    ${baseP > 0 && Math.abs(varP) >= 1 ? `<p class="bas-ah3-var"><span class="bas-ah8-p ${varP >= 0 ? 'pos' : 'neg'}"><i aria-hidden="true">${varP >= 0 ? '↑' : '↓'}</i>${brl0(Math.abs(varP))} ${varP >= 0 ? 'a mais' : 'a menos'} no ano <em>${pct(Math.abs(varP / baseP))}</em></span></p>` : ''}
    ${linha}`;
  const mesC = `<div class="bas-ah6-h" aria-live="polite"><b data-ahk="t">${um ? cap(MES_LONGO[sel]) : `No ano${L.parcial ? ' até agora' : ''}`}</b><button class="lnk" data-act="bas-ah-ano-todo" ${um ? '' : 'hidden'}>Ver o ano</button></div>
    <div class="bas-ah6-c"><div class="card"><em>Gastos</em><b data-ahk="gas">${brl0(gas)}</b></div><div class="card"><em>Aportes</em><b class="inv" data-ahk="apo">${brl0(apo)}</b></div><div class="card"><em>Dividendos</em><b class="div" data-ahk="div">${brl0(div)}</b></div></div>`;
  // a análise do ano, como na tela antiga: melhor mês, mês mais apertado e o ano com a média por mês
  const sobQ = (q) => (+q.entradas || 0) - (+q.gastos || 0); const nM = Math.max(1, ser.length);
  const melhor = ser.length ? ser.reduce((b, q) => (sobQ(q) > sobQ(b) ? q : b)) : null; const pior = ser.length ? ser.reduce((b, q) => (sobQ(q) < sobQ(b) ? q : b)) : null;
  const tile = (k0, q, ic, cor) => `<div class="card bas-sa-t"><span class="bas-sa-ic" style="--bc:${cor}" aria-hidden="true">${ic}</span><small>${k0}</small><b>${cap(MES_LONGO[q.mes])}</b><em>${basCent(sobQ(q))}</em></div>`;
  const lin = ([nome, v, i0, cor]) => `<li><span class="bas-pv2-l"><span class="bas-pv2-ini" style="--bc:${cor}" aria-hidden="true">${i0}</span><span class="bas-pv2-n"><b>${nome}</b><small>${brl0(v / nM)} por mês</small></span><b class="bas-pv2-v">${basCent(v)}</b></span></li>`;
  const analise = `${melhor ? `<div class="bas-sa-dupla">${tile('Melhor mês', melhor, I_GASTO, 'var(--pos)')}${tile('Mês mais apertado', pior, I_ENTRADA, sobQ(pior) < 0 ? 'var(--neg)' : '#FF9F0A')}</div>` : ''}
    ${basSecao('No ano', '', `<ul class="card bas-pv2-ls">${[['Entrou', L.entradas || 0, I_ENTRADA, 'var(--pos)'], ['Saiu', L.gastos || 0, I_GASTO, 'var(--neg)'], ['Investido', (L.aplicado != null ? L.aplicado : L.aportes) || 0, I.inv, 'var(--accent)'], ['Proventos', L.proventos || 0, I_PROV, '#F5B83D']].map(lin).join('')}</ul>`)}`;
  const folha = `${mesC}${analise}
    ${L.parcial ? `<p class="bas-disc keep">${ano} em andamento: valores até ${MES_LONGO[L.meses - 1]}.</p>` : ''}`;
  return basPgAzul('bas-pg-ah', `Seu ${ano}`, topo, folha);
}
// Raio-X dos gastos do ano (E.analiseGastos, a mesma análise da aba Gastos do SaaS)
function basRaioX() {
  const ents = []; for (let m = 0; m < 12; m++) entradasMes(m).forEach((e) => { e.m = m; ents.push(e); });
  const hoje = S.year === NOW_Y ? { mes: NOW_M, dia: new Date().getDate() } : null;
  return E.analiseGastos({ ano: S.year, mes: -1, entradas: ents, catsDesp: S.plan.catsDesp, orcamento: S.C.orcamento, hoje, parcelados: S.plan.despesas.concat(planCtx().carry).filter((it) => it.parcel) });
}
function basTelaRaioX() {
  const G = basRaioX(); const areas = (G.porArea || []).slice(0, 5); const mxA = areas.length ? areas[0].total : 1;
  return basDet('Raio-X dos gastos', `${basCard(`<small class="bas-k">Gastos de ${S.year}</small><b class="bas-big">${basCent(G.total)}</b>
      <div class="bas-raio-k"><span><small>Média por mês</small><b>${brl0(G.mediaMes)}</b></span><span><small>Contas fixas</small><b>${G.pctFixos != null ? pct(G.pctFixos) : '–'}</b></span><span><small>Lançamentos</small><b>${G.nReais}</b></span></div>`, 'bas-hero')}
    ${areas.length ? basSecao('Onde mais gasta', '', `<div class="card bas-raio-a">${areas.map((a, i) => `<button ${basIr('categoria', { area: a.nome })}><span>${esc(a.nome)}</span><span class="bas-raio-b"><i style="width:${((a.total / mxA) * 100).toFixed(1)}%;--bc:${PAL[i % 6]}"></i></span><b>${brl0(a.total)}</b></button>`).join('')}</div>`) : ''}
    ${(G.recorrentes || []).length ? basSecao('O que se repete', `<small class="bas-raio-t">${brl0(G.recorrentesMes)} por mês</small>`, `<ul class="bas-ativ">${G.recorrentes.slice(0, 6).map((r) => basRow('disabled', esc(basIniciais(r.nome)), esc(r.nome), `${r.meses} ${r.meses === 1 ? 'mês' : 'meses'} no ano`, `<b>${basCent(r.media)}</b>`)).join('')}</ul>`) : ''}
    ${(G.estab || []).length ? basSecao('Onde mais comprou', '', `<ul class="bas-ativ">${G.estab.slice(0, 5).map((e) => basRow('disabled', esc(basIniciais(e.nome)), esc(e.nome), `${e.qtd} ${e.qtd === 1 ? 'vez' : 'vezes'}`, `<b>${basCent(e.total)}</b>`)).join('')}</ul>`) : ''}
    ${(G.top || []).length ? basSecao('Maiores gastos', '', `<ul class="bas-ativ">${G.top.slice(0, 5).map((e) => basRow('disabled', esc(basIniciais(e.nome || e.area)), esc(e.nome || e.area), `${esc(e.area || '')} · ${MES[e.m]}`, `<b>${basCent(e.valor)}</b>`)).join('')}</ul>`) : ''}`);
}
// Resumo do mês: o que vai na imagem é escolha da pessoa (porcentagens ou valores, e quais linhas); a imagem compartilhada é a mesma do cartão
const BAS_RS_ITENS = [['ent', 'Entrou'], ['sai', 'Saiu'], ['inv', 'Investido'], ['prov', 'Proventos'], ['sonho', 'Sonho']];
const basRsOp = () => { const p = S.profile.prefs || (S.profile.prefs = {}); if (!p.resumo) p.resumo = { modo: 'pct', it: { ent: 1, sai: 1, inv: 1, prov: 1, sonho: 1 } }; return p.resumo; };
function basRsDados(m) {
  const C = S.C; const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes }); const g = objFoco(objAnalise()); const op = basRsOp(); const pc = op.modo === 'pct' || oculto();
  const ent = +C.receita[m] || 0; const sob = +C.investAlocado[m] || 0; const da = (v) => (ent > 0 ? pct(Math.max(0, v) / ent) : '–'); const antE = m > 0 ? +C.receita[m - 1] || 0 : 0;
  const varE = antE > 0 ? (ent - antE) / antE : null;
  const head = pc ? { v: ent > 0 ? pct(Math.max(0, sob / ent)) : '–', k: 'do que entrou ficou com você' } : { v: brl(sob), k: 'sobraram no mês' };
  const L = [];
  if (op.it.ent) L.push(['Entrou', pc ? (varE == null ? '100%' : `${varE >= 0 ? '↑' : '↓'} ${pct(Math.abs(varE))} vs ${MES[m - 1].toLowerCase()}`) : brl(ent), 'pos']);
  if (op.it.sai) L.push(['Saiu', pc ? da(C.despesas[m]) : brl(C.despesas[m]), '']);
  if (op.it.inv) L.push(['Investido', pc ? da(D.aportado) : brl(D.aportado), 'pos']);
  if (op.it.prov && C.faturamento[m] > 0) L.push(['Proventos', pc ? da(C.faturamento[m]) : brl(C.faturamento[m]), 'pos']);
  return { m, pc, head, L, g: op.it.sonho && g ? { nome: objNomeDe(g), p: Math.min(1, Math.max(0, g.progresso || 0)) } : null, sub: pc && ent > 0 ? 'Porcentagens sobre o que entrou no mês' : '' };
}
function basTelaResumo(o) {
  const m = o && o.id != null ? +o.id : S.mes; const R = basRsDados(m); const op = basRsOp();
  const card = `<div class="bas-story bas-rs"><img class="bas-rs-ic" src="assets/img/icon-192.png" alt="" aria-hidden="true"><small>${esc(cap(MES_LONGO[m]))} de ${S.year}</small><b class="bas-story-v">${esc(R.head.v)}</b><span class="bas-story-k">${R.head.k}</span>
      ${R.L.length ? `<ul>${R.L.map(([n, v, c]) => `<li><span>${n}</span><b class="${c}">${esc(v)}</b></li>`).join('')}</ul>` : ''}
      ${R.g ? `<div class="bas-story-g"><span>${esc(R.g.nome)}</span>${basBarra(R.g.p)}<b>${pct(R.g.p)}</b></div>` : ''}<p class="bas-rs-pe">Feito com ${esc(CFG.marca || 'Cifrão')}</p></div>`;
  const opcoes = `<section class="card bas-rs-op"><small class="bas-k">O que vai na imagem</small>
      <div class="bas-rs-seg" role="radiogroup" aria-label="Mostrar como">${[['pct', 'Porcentagens'], ['val', 'Valores']].map(([k, l]) => `<button type="button" role="radio" aria-checked="${op.modo === k}" data-act="bas-rs-modo" data-v="${k}"${k === 'val' && oculto() ? ' disabled' : ''}>${l}</button>`).join('')}</div>
      <div class="bas-rs-its">${BAS_RS_ITENS.map(([k, l]) => `<button type="button" class="bas-rs-it" aria-pressed="${!!op.it[k]}" data-act="bas-rs-it" data-k="${k}"><i aria-hidden="true">${op.it[k] ? '✓' : '+'}</i>${l}</button>`).join('')}</div>
      ${oculto() ? '<p class="bas-rs-dica">Com o olho fechado, só porcentagens.</p>' : ''}</section>`;
  return basDet('Resumo do mês', `${card}${opcoes}<button class="btn primary lg bas-cta bas-add" data-act="bas-partilhar" data-m="${m}">${I_PARTILHA}Compartilhar imagem</button>`);
}
async function basPartilhar(m) {
  m = m == null ? S.mes : m; let blob; try { blob = await basStoryPng(m); } catch (e) { blob = null; }
  return basEnviaPng(blob, `${(CFG.marca || 'aven').toLowerCase()}-resumo-${MES[m].toLowerCase()}-${S.year}.png`, `Resumo de ${MES_LONGO[m]}`);
}
async function basEnviaPng(blob, nome, titulo) {
  if (!blob) { toast('Não foi possível montar a imagem neste aparelho.'); return; }
  const file = new File([blob], nome, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: titulo }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Imagem salva. É só enviar de onde quiser.');
}
// carteira recomendada pelo assessor (Assessoria): a lista, a nota e aplicar com dois toques (mesma regra do SaaS)
function basRecHtml() {
  const r = S.recomendacao; if (!temRecurso('carteira_recomendada') || !r || !(r.carteira || []).length) return '';
  return basSecao(`Recomendação do ${esc(primeiroNome())}`, '', `<div class="card bas-rec">${(r.notas || '').trim() ? `<p class="bas-rec-n">“${esc(r.notas.trim())}”</p>` : ''}
    <ul class="bas-comp-l">${r.carteira.map((x, i) => `<li><i style="--bc:${PAL[i % 6]}"></i><span>${esc(x.nome)}</span><b>${fmtPct(+x.alvo)}</b></li>`).join('')}</ul>
    <button class="btn primary bas-cta bas-add" data-act="bas-rec-aplicar">Usar como meus alvos</button></div>`);
}
function basRecAplicar(el) {
  if (!el.dataset.ok) { el.dataset.ok = '1'; el.textContent = 'Toque de novo para trocar os seus alvos'; return; }
  const r = S.recomendacao; if (!r || !(r.carteira || []).length) return;
  S.profile.carteira.forEach((e) => { e.alvo = 0; });
  r.carteira.forEach((x) => { const a = FPIngest.garantirAtivo(S.plan, { tipo: x.tipo || tipoDeClasse(x.classe), classe: x.classe, grupo: x.grupo || null, subgrupo: x.subgrupo || null, nome: x.nome }, uid); cartEntry(E.ativoKey(a), true).alvo = +x.alvo || 0; });
  touch('plan'); touch('profile'); basHaptico(); render(); toast('Alvos do assessor aplicados.');
}

/* ---- sons e transições: efeitos curtos gerados no aparelho (Web Audio, sem arquivos), só nos momentos que importam ---- */
let BAS_AC = null;
const basSomLigado = () => false; // sons desligados a pedido do Nathan (o efeito continua em basSom, caso volte)
// tipos: toque (trocar de aba, abrir tela), ok (salvar), pago (conta paga, investimento), apaga (excluir), volta (voltar)
function basSom(tipo) {
  if (!basSomLigado()) return;
  try {
    BAS_AC = BAS_AC || new (window.AudioContext || window.webkitAudioContext)(); const ac = BAS_AC; if (ac.state === 'suspended') ac.resume();
    const t0 = ac.currentTime + 0.005;
    const nota = (f, ini, dur, vol, forma) => { const o = ac.createOscillator(); const g = ac.createGain(); o.type = forma || 'sine'; o.frequency.setValueAtTime(f, t0 + ini);
      g.gain.setValueAtTime(0.0001, t0 + ini); g.gain.exponentialRampToValueAtTime(vol, t0 + ini + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + ini + dur);
      o.connect(g).connect(ac.destination); o.start(t0 + ini); o.stop(t0 + ini + dur + 0.02); };
    if (tipo === 'toque') nota(1320, 0, 0.05, 0.035, 'triangle');
    else if (tipo === 'volta') nota(990, 0, 0.05, 0.03, 'triangle');
    else if (tipo === 'ok') { nota(880, 0, 0.12, 0.06); nota(1320, 0.07, 0.18, 0.05); }
    else if (tipo === 'pago') { nota(784, 0, 0.12, 0.06); nota(1047, 0.07, 0.12, 0.055); nota(1568, 0.14, 0.26, 0.045); }
    else if (tipo === 'apaga') { nota(420, 0, 0.1, 0.05, 'triangle'); nota(300, 0.06, 0.16, 0.045, 'triangle'); }
  } catch (e) { /* sem áudio no aparelho: segue sem som */ }
}
// tela de sucesso, tela cheia azul. Gasto: o Cifrão vem jogado de baixo, gira e vira moeda no alto, pisca e cai de volta.
// Investimento: jogado para cima, vira seta no meio do caminho e sai por cima. A tela espera o OK. Depois o OK. Movimento reduzido: só o OK.
let BAS_FESTA_T = 0;
const basFestaValor = (v) => { const [r, c] = brl(v).split(','); return c ? `${r}<span class="c">,${c}</span>` : r; };
function basFesta(tipo, titulo, msg, valor) {
  document.querySelector('.bas-ok')?.remove(); clearTimeout(BAS_FESTA_T);
  const menos = matchMedia('(prefers-reduced-motion: reduce)').matches, inv = tipo === 'inv', W = innerWidth, H = innerHeight;
  // linha que sobe (investimento), em pixels da tela; o último ponto fica fora, para a seta sair por cima
  const P = [[.14, .78], [.3, .67], [.42, .71], [.58, .5], [.7, .55], [.86, .3], [1.2, .02]].map(([x, y]) => [x * W, y * H]);
  const d = 'M' + P.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L');
  const el = document.createElement('div'); el.className = 'bas-ok' + (inv ? ' inv' : '') + (valor > 0 ? ' tem-val' : '') + (menos ? ' fim' : ''); el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<div class="bas-ok-bg" aria-hidden="true"><span class="bas-ok-pts">${Array.from({ length: 22 }, (_, k) => `<i style="--x:${(k * 37) % 100}%;--s:${1 + (k % 3)}px;--d:${7 + (k * 13) % 9}s;--k:${-((k * 7) % 11)}s"></i>`).join('')}</span></div>
    <span class="bas-ok-cif" aria-hidden="true"><span class="cifrao" data-volume></span></span>
    <span class="bas-ok-v" aria-hidden="true"><i class="bas-ok-onda"></i><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M16 27l6.5 6.5L36.5 19.5"/></svg></span>
    ${valor > 0 ? `<p class="bas-ok-val">${basFestaValor(valor)}</p>` : ''}<p class="bas-ok-t">${esc(titulo)}</p>${msg ? `<p class="bas-ok-m">${esc(msg)}</p>` : ''}<button type="button" class="bas-ok-bt">OK</button>`;
  const fecha = () => { el.classList.add('sai'); setTimeout(() => el.remove(), 300); };
  el.querySelector('.bas-ok-bt').addEventListener('click', fecha); document.body.appendChild(el); // só fecha no OK
  const fim = () => el.classList.add('fim'); const depois = () => setTimeout(fim, 350); // o OK só aparece depois que o Cifrão saiu da tela
  if (!menos) requestAnimationFrame(() => requestAnimationFrame(() => { const h = el.querySelector('.cifrao'), w = el.querySelector('.bas-ok-cif'); if (!window.Cifrao || !h.cifrao || !w.animate) { fim(); return; }
    window.Cifrao.expressao(h, inv ? 'celebraInv' : 'celebraGasto');
    if (!inv) {
      const t = (y) => `translate(${W / 2 - 75}px, ${y}px)`, cy = H * .42 - 75;
      setTimeout(() => window.Cifrao.forma(h, 'moeda'), 1070); // troca de costas, no meio do giro
      const voo = w.animate([{ transform: t(H + 20), easing: 'cubic-bezier(.15, .75, .3, 1)' }, { transform: t(cy - 10), offset: .32, easing: 'cubic-bezier(.45, 0, .55, 1)' },
        { transform: t(cy), offset: .74, easing: 'cubic-bezier(.55, 0, .85, .35)' }, { transform: t(H + 40) }], { duration: 3000, fill: 'forwards' });
      voo.finished.then(depois, fim);
    } else {
      // investimento: jogado para cima, vira seta no caminho, para um instante no alto, pisca e dispara para cima
      const t = (y) => `translate(${W / 2 - 75}px, ${y}px)`, cy = H * .4 - 75;
      setTimeout(() => window.Cifrao.forma(h, 'seta'), 570);
      const voo = w.animate([{ transform: t(H + 20), easing: 'cubic-bezier(.15, .75, .3, 1)' }, { transform: t(cy - 8), offset: .32, easing: 'cubic-bezier(.45, 0, .55, 1)' },
        { transform: t(cy), offset: .74, easing: 'cubic-bezier(.45, 0, .55, 1)' }, { transform: t(cy + 12), offset: .81, easing: 'cubic-bezier(.5, 0, .85, .25)' }, { transform: t(-260) }], { duration: 2600, fill: 'forwards' });
      voo.finished.then(depois, fim);
    } }));
}
// som e vibração juntos, no mesmo quadro (o retorno precisa chegar junto com a mudança na tela)
const basRetorno = (tipo) => { basSom(tipo); if (tipo !== 'toque' && tipo !== 'volta') basHaptico(); };
// transições entre telas (View Transitions): empilhar desliza da direita, voltar desliza de volta, trocar de aba esmaece
function basTransicao(dir, fn) {
  const pode = document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!pode) { fn(); return; }
  // garantia: se o navegador não desenhar o próximo quadro (aba em segundo plano, aparelho ocupado), a tela troca sem animação
  let feito = false; const uma = () => { if (feito) return; feito = true; fn(); };
  document.documentElement.dataset.vt = dir;
  const vt = document.startViewTransition(uma); vt.ready.catch(() => {}); vt.updateCallbackDone.catch(() => {}); vt.finished.finally(() => { delete document.documentElement.dataset.vt; }).catch(() => {}); // pular a transição rejeita ready; sem o catch vira erro no console
  setTimeout(() => { if (!feito) { try { vt.skipTransition(); } catch (e) { /* ignora */ } uma(); delete document.documentElement.dataset.vt; } }, 300);
}

/* ---- widgets extras do Início (o cliente adiciona em "Organizar esta tela") ---- */
// modelos de cartão: inspirados em acabamentos conhecidos (black, metal, carbono…), sem logos nem nomes de outras marcas
const CC_MODELOS = [['banco', 'Do banco'], ['black', 'Black'], ['metal', 'Metal escovado'], ['carbono', 'Fibra de carbono'], ['vidro', 'Vidro'], ['holo', 'Holográfico'], ['fosco', 'Preto fosco'], ['ouro', 'Ouro'], ['platina', 'Platina'], ['aurora', 'Grafite aurora']];
const CC_COM_COR = ['banco', 'vidro', 'aurora']; // modelos que aceitam a cor escolhida
const I_ENGRENAGEM = ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>');
function basCcEstilo(k) {
  const e = ((S.profile && S.profile.cartaoEstilo) || {})[k] || {}; const i = instDe(k) || [k, k, '#333', '#fff'];
  const m = CC_MODELOS.some((x) => x[0] === e.m) ? e.m : 'banco'; const c = /^#[0-9a-f]{6}$/i.test(e.c || '') ? e.c : i[2];
  return { m, c, attr: `data-m="${m}" style="--cb:${c};--cf:${i[3]}"` };
}
function basCartoesHtml() {
  const j = basJan(); const ents = []; for (let m = j.de; m <= j.ate; m++) entradasMes(m).forEach((e) => ents.push(e)); const sai = basSomaJ(S.C.despesas);
  const insts = E.gastosPorInst(ents).filter((x) => instDe(x.k));
  return insts.length ? basSecao('Seus cartões', '', `<div class="bas-cc" role="list">${insts.map((x) => { const i = instDe(x.k);
    return `<button class="bas-cc-c" role="listitem" ${basCcEstilo(x.k).attr} ${basIr('cartao', { id: x.k })} aria-label="${esc(i[1])}: ver os gastos"><span class="bas-cc-t"><span class="bas-cc-nfc" aria-hidden="true">${CC_NFC}</span>${instIcone(x.k)}</span><span class="bas-cc-n">${esc(i[1])}</span><span class="bas-cc-v"><small>${esc(cap(basJanFrase()))}</small><b>${basCent(x.v)}</b></span><span class="bas-cc-p">${pct(x.v / (sai || 1))}</span></button>`; }).join('')}</div>`) : '';
}
// topo de Gastos: o total em destaque e os cartões translúcidos empilhados; tocar abre os cartões na tela, para rodar de lado
const basGastoInsts = () => { const j = basJan(); const ents = []; for (let m = j.de; m <= j.ate; m++) entradasMes(m).forEach((e) => ents.push(e));
  const l = E.gastosPorInst(ents).filter((x) => instDe(x.k)); instMinhas().forEach((k) => { if (instDe(k) && !l.some((x) => x.k === k)) l.push({ k, v: 0 }); }); return l.sort((a, b) => b.v - a.v); };
function basGastoTopoHtml(sai, orc) {
  const insts = basGastoInsts(); const uso = orc > 0 ? sai / orc : null;
  // cartões translúcidos com a textura do modelo de cada um; na frente, aproximação, logo do banco e bandeira, translúcidos, sem valor
  const pilha = insts.slice(0, 3).map((x, i) => { const st = basCcEstilo(x.k);
    return `<span class="bas-gt-c" style="--i:${i};z-index:${3 - i};--cb:${st.c}"><span class="bas-cc-c bas-cc-mini bas-gt-tx" data-m="${st.m}" style="--cb:${st.c}" aria-hidden="true"></span>${i === 0 ? `<span class="bas-gt-d"><span class="bas-gt-nfc">${CC_NFC}</span>${CC_BAND[basBand(x.k)]}</span>` : ''}</span>`; }).join('');
  return `<section class="bas-gt"><small>Gastou ${esc(basJanFrase())}</small><b class="bas-gt-v">${basCent(sai)}</b>
    ${uso != null ? `<button class="bas-gt-chip${uso > 1 ? ' neg' : uso >= 0.8 ? ' warn' : ''}" ${basIr('limite')}>${pct(uso)} do limite do mês</button>` : `<button class="bas-gt-chip" ${basIr('limite')}>Definir limite do mês</button>`}
    ${insts.length ? `<button class="bas-gt-pilha" data-act="bas-ccv" aria-label="Ver seus ${insts.length} cartões">${pilha}</button>` : `<button class="bas-gt-pilha bas-gt-vazia" ${basIr('cartao-novo')} aria-label="Adicionar um cartão"><span class="bas-gt-c bas-gt-novo" style="--i:0"><span class="bas-gt-d"><i aria-hidden="true">${I.plus}</i>Adicionar um cartão</span></span></button>`}</section>`;
}
// bandeira do cartão: os símbolos reais da Visa (Simple Icons) e da Mastercard, em branco e translúcidos: Visa ou Mastercard em cartaoEstilo[inst].b; sem escolha, sai do nome do banco
const CC_BAND = {
  visa: '<svg class="bas-band" viewBox="0 8.1 24 7.8" role="img" aria-label="Visa"><path fill="currentColor" d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/></svg>',
  // Mastercard em branco: os dois círculos na proporção real; a sobreposição mais clara mantém o sentido do símbolo
  elo: '<svg class="bas-band" viewBox="0 0 2000 620" role="img" aria-label="Elo"><g fill="currentColor"><rect x="0" y="253" width="752" height="114"/><rect x="842" y="4" width="128" height="610"/><rect x="842" y="492" width="360" height="122"/><rect x="1780" y="253" width="220" height="114"/></g><path fill="currentColor" d="M690 510A311 311 0 1 1 763 310H651A199 199 0 1 0 604 438Z"/><path fill="currentColor" fill-rule="evenodd" d="M1541 -1a311 311 0 1 0 0.01 0ZM1541 121a189 189 0 1 1 -0.01 0Z"/></svg>',
  master: '<svg class="bas-band" viewBox="0 0 256 158" role="img" aria-label="Mastercard"><circle cx="79" cy="79" r="79" fill="currentColor" opacity=".55"/><circle cx="177" cy="79" r="79" fill="currentColor" opacity=".55"/></svg>' };
const basBand = (k) => { const b = ((S.profile.cartaoEstilo || {})[k] || {}).b; if (CC_BAND[b]) return b; let h = 0; for (const c of k) h += c.charCodeAt(0); return h % 2 ? 'master' : 'visa'; };
// o cartão "de verdade" em pé: é um cartão deitado (logo, chip, aproximação e bandeira nos lugares de sempre) girado 90°, como na mão
const CC_CHIP = '<svg class="bas-cr-chip" viewBox="0 0 40 30" aria-hidden="true"><path d="M0 9.5h12M0 20.5h12M28 9.5h12M28 20.5h12M20 0v6M20 24v6M12 6h16v18H12z"/></svg>';
const basCartaoFace = (k) => { const st = basCcEstilo(k); return `<span class="bas-cc-c bas-cc-mini bas-cr" data-m="${st.m}" style="--cb:${st.c}" aria-hidden="true"><span class="bas-cr-in"><span class="bas-cr-t">${instIcone(k)}</span>${CC_CHIP}<span class="bas-cr-nfc">${CC_NFC}</span><span class="bas-cr-b ${basBand(k)}">${CC_BAND[basBand(k)]}</span></span></span>`; };
function basCcVer() {
  const p = document.querySelector('.bas-gt-pilha'); basSom('toque');
  if (!p || matchMedia('(prefers-reduced-motion: reduce)').matches) { basAbrir('cartoes'); return; }
  p.classList.add('abre'); setTimeout(() => basAbrir('cartoes'), 320);
}
function basTelaCartoes() {
  const insts = basGastoInsts(); const tot = insts.reduce((s, x) => s + x.v, 0);
  return basDet('Seus cartões', insts.length ? `<div class="bas-rc-fila" role="list">${insts.map((x) => { const i = instDe(x.k); return `<button class="bas-rc-i" role="listitem" ${basIr('cartao', { id: x.k })} aria-label="${esc(i[1])}: ver os gastos">${basCartaoFace(x.k)}<span class="bas-rc-n"><small>${esc(i[1])}</small><b>${basCent(x.v)}</b><em>${x.v > 0 ? `${pct(x.v / (tot || 1))} dos gastos ${esc(basJanFrase())}` : `sem gastos ${esc(basJanFrase())}`}</em></span></button>`; }).join('')}<button class="bas-rc-i bas-rc-add" role="listitem" ${basIr('cartao-novo')} aria-label="Adicionar um cartão"><span class="bas-rc-novo" aria-hidden="true"><i>${I.plus}</i><b>Adicionar cartão</b><small>Escolha o seu banco</small></span><span class="bas-rc-n"><small>Novo</small><b>&nbsp;</b><em>&nbsp;</em></span></button></div>
    <div class="bas-ccv-p" aria-hidden="true">${insts.concat([0]).map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : basCard(basVazio('Nenhum cartão com gasto no período.')));
}
// fila em leque: o cartão do meio fica de frente e os vizinhos giram e encolhem conforme a distância (--d, --a)
// arrastar o cartão para o lado troca para o cartão vizinho (a mesma ordem de "Seus cartões", em loop), sem empilhar outra tela
// "Ver tudo" dos Últimos gastos: todos os gastos do período numa janela que sobe de baixo; fecha no X, no fundo ou com Esc
function basUltPop(id = 'bas-ult-tpl', tit = 'Todos os gastos', sub0) {
  const tpl = document.getElementById(id); if (!tpl) return; const n = tpl.content.querySelectorAll('li').length; const at = id === 'bas-ct-tpl';
  const el = document.createElement('div'); el.className = 'bas-pop'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', tit);
  el.innerHTML = `<div class="bas-pop-f"><span class="bas-pop-al" aria-hidden="true"></span><div class="bas-pop-h"><span><b>${tit}</b><small>${sub0 ? esc(sub0) : at ? `${n} ${n === 1 ? 'ativo' : 'ativos'}, do maior para o menor` : `${n} ${n === 1 ? 'gasto' : 'gastos'} ${esc(basJanFrase())}`}</small></span><button class="bell" data-pop="x" aria-label="Fechar">${I.x}</button></div><div class="bas-pop-c"></div></div>`;
  el.querySelector('.bas-pop-c').appendChild(tpl.content.cloneNode(true));
  const fechar = () => { document.removeEventListener('keydown', tecla); el.classList.add('sai'); setTimeout(() => el.remove(), 240); };
  const tecla = (e) => { if (e.key === 'Escape') fechar(); };
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-pop="x"]')) fechar(); else if (e.target.closest('[data-act]')) { document.removeEventListener('keydown', tecla); setTimeout(() => el.remove(), 0); } });
  document.addEventListener('keydown', tecla); document.body.appendChild(el); basSom('toque'); return el;
}
// todas as movimentações do ativo: período (3M, 6M, 1A, Tudo, contado a partir de hoje) e busca por tipo ou mês, sem redesenhar
function basMovPop() {
  const el = basUltPop('bas-mv-tpl', 'Movimentações'); if (!el) return; const sub = el.querySelector('.bas-pop-h small'); const lis = [...el.querySelectorAll('.bas-pop-c li')];
  const PER = [['3', '3M'], ['6', '6M'], ['12', '1A'], ['0', 'Tudo']]; let per = '0', q = '';
  el.querySelector('.bas-pop-c').insertAdjacentHTML('beforebegin', `<div class="bas-mvp-f"><label class="bas-mvp-b"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input type="search" placeholder="Buscar: aplicação, provento, março…" aria-label="Buscar movimentação"></label>
    <div class="seg bas-mvp-p" role="group" aria-label="Período">${PER.map(([v, l]) => `<button class="${v === per ? 'on' : ''}" data-mvp="${v}" aria-pressed="${v === per}">${l}</button>`).join('')}</div></div><p class="bas-mvp-vz" hidden>Nada nesse período.</p>`);
  const hoje = new Date(); const agora = hoje.getFullYear() * 12 + hoje.getMonth(); const sem = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const filtra = () => { let n = 0; const qq = sem(q.trim().toLowerCase());
    lis.forEach((li) => { const ok = (per === '0' || +li.dataset.ym > agora - +per) && (!qq || sem(li.dataset.q).includes(qq)); li.hidden = !ok; if (ok) n++; });
    sub.textContent = `${n} ${n === 1 ? 'movimentação' : 'movimentações'}${per === '0' ? '' : ` em ${PER.find((p) => p[0] === per)[1].replace('M', ' meses').replace('1A', '12 meses')}`}`; el.querySelector('.bas-mvp-vz').hidden = n > 0; };
  el.querySelector('input').addEventListener('input', (e) => { q = e.target.value; filtra(); });
  el.querySelector('.bas-mvp-p').addEventListener('click', (e) => { const b = e.target.closest('[data-mvp]'); if (!b) return; per = b.dataset.mvp;
    el.querySelectorAll('[data-mvp]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); filtra(); basSom('toque'); });
  filtra();
}
function basCtLigar() {
  const c = document.querySelector('.bas-ct2-card'); S.basCtDir = 0; if (!c || c.dataset.lig) return; c.dataset.lig = '1';
  const ks = basGastoInsts().map((x) => x.k); const i = ks.indexOf(c.dataset.id); let x0 = null, dx = 0;
  c.addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; c.setPointerCapture(e.pointerId); c.classList.add('arrasta'); });
  c.addEventListener('pointermove', (e) => { if (x0 == null) return; dx = e.clientX - x0; c.style.setProperty('--dx', `${ks.length > 1 ? dx : dx * 0.25}px`); });
  const solta = () => { if (x0 == null) return; x0 = null; c.classList.remove('arrasta'); const n = ks.length < 2 || Math.abs(dx) <= 70 ? -1 : (i + (dx < 0 ? 1 : -1) + ks.length) % ks.length; // em loop: depois do último vem o primeiro
    if (n >= 0) { basSom('toque'); const t = basPilha()[basPilha().length - 1]; t.id = ks[n]; S.basCtDir = dx < 0 ? 1 : -1; render(); window.scrollTo(0, 0); } else c.style.setProperty('--dx', '0px'); };
  c.addEventListener('pointerup', solta); c.addEventListener('pointercancel', solta);
}
function basRcLigar() {
  const f = document.querySelector('.bas-rc-fila'); if (!f || f.dataset.lig) return; f.dataset.lig = '1'; const pts = document.querySelectorAll('.bas-ccv-p i');
  const it = [...f.children]; const passo = () => { const c = f.scrollLeft + f.clientWidth / 2; let perto = 0, md = 9;
    it.forEach((e, i) => { const d = (e.offsetLeft + e.offsetWidth / 2 - c) / e.offsetWidth; e.style.setProperty('--d', Math.max(-1.5, Math.min(1.5, d)).toFixed(3)); e.style.setProperty('--a', Math.min(1.5, Math.abs(d)).toFixed(3)); e.style.zIndex = String(20 - Math.round(Math.abs(d) * 4)); if (Math.abs(d) < md) { md = Math.abs(d); perto = i; } });
    pts.forEach((p, i) => p.classList.toggle('on', i === perto));
  };
  let q = 0; f.addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(() => { q = 0; passo(); }); }, { passive: true }); passo();
  const centro = (e) => f.scrollTo({ left: e.offsetLeft + e.offsetWidth / 2 - f.clientWidth / 2, behavior: 'smooth' });
  let x0 = null, s0 = 0, mov = false;
  f.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = f.scrollLeft; mov = false; });
  f.addEventListener('pointermove', (e) => { if (x0 == null) return; const dx = e.clientX - x0; if (!mov && Math.abs(dx) > 5) { mov = true; f.classList.add('arrasta'); f.setPointerCapture(e.pointerId); } if (mov) f.scrollLeft = s0 - dx; });
  const solta = () => { if (x0 == null) return; x0 = null; f.classList.remove('arrasta'); if (mov) { const c = f.scrollLeft + f.clientWidth / 2; centro(it.reduce((b, e) => (Math.abs(e.offsetLeft + e.offsetWidth / 2 - c) < Math.abs(b.offsetLeft + b.offsetWidth / 2 - c) ? e : b))); } };
  f.addEventListener('pointerup', solta); f.addEventListener('pointercancel', solta);
  f.addEventListener('click', (e) => { const el = e.target.closest('.bas-rc-i'); if (mov) { mov = false; e.preventDefault(); e.stopPropagation(); return; }
    if (el && +el.style.getPropertyValue('--a') > 0.4) { e.preventDefault(); e.stopPropagation(); centro(el); } }, true);
}
function basExtrasInicio(secs) {
  const C = S.C; const j = basJan(); const D = E.disponivelAporte({ C, mes: j.de, ate: j.ate, metaMes: C.metaAporteMes });
  if (typeof aberturaPode === 'function' && aberturaPode()) secs.globo = `<button class="card bas-w-globo" data-act="bas-globo"><span class="bas-w-orb" aria-hidden="true"></span>${basNome('Seu universo financeiro', 'O seu patrimônio como um globo vivo')}${I.chev}</button>`;
  const H = basSaude(j.ate); const cls = H.nota == null ? '' : H.nota >= 80 ? 'ok' : H.nota >= 60 ? 'atencao' : 'baixo';
  secs.saude = `<button class="card bas-w-saude" data-act="bas-aba" data-v="perfil">${basAnel(H.nota == null ? 0 : H.nota / 100, 72, `<b>${H.nota == null ? '–' : H.nota}</b>`, cls)}${basNome('Saúde financeira', H.nota == null ? voz('bas_vazio') : voz(H.nota >= 80 ? 'bas_saude_bom' : H.nota >= 60 ? 'bas_saude_med' : 'bas_saude_baixo'))}${I.chev}</button>`;
  const K = basContas(j.ate); const pend = K.itens.slice(0, 3);
  secs.contas = basSecao(`Contas de ${MES_LONGO[j.ate]}`, `<button class="lnk strong" data-act="bas-aba" data-v="gastos">Todas</button>`, pend.length ? `<ul class="bas-ativ">${pend.map(basContaLinha).join('')}</ul>` : basCard(basVazio(K.itens.length ? 'Tudo pago neste mês.' : 'Nenhuma conta do mês anotada.')));
  const orc = basSomaJ(C.orcamento); const sai = basSomaJ(C.despesas);
  secs.limite = orc > 0 ? basCard(`<div class="bas-ch"><h2 class="bas-h2">Limite ${esc(basJanFrase())}</h2><button class="lnk strong" ${basIr('limite')}>Mudar</button></div>${basBarra(sai / orc)}<p class="bas-p">${sai <= orc ? `Ainda cabe <b>${brl(orc - sai)}</b> de ${brl(orc)}.` : `<b class="neg">Passou ${brl(sai - orc)}</b> do limite de ${brl(orc)}.`}</p>`)
    : basCard(`<div class="bas-ch"><h2 class="bas-h2">Limite do mês</h2></div><p class="bas-p bas-p0">Defina quanto gastar no máximo e acompanhe aqui.</p><button class="btn bas-cta bas-add" ${basIr('limite')}>Definir limite</button>`);
  const f = D.meta > 0 ? D.aportado / D.meta : 0;
  secs.meta = basCard(`<div class="bas-ch"><h2 class="bas-h2">Meta de investimento</h2><button class="lnk strong" ${basIr('meta')}>${D.meta > 0 ? 'Mudar' : 'Definir'}</button></div>${D.meta > 0 ? `<b class="bas-big md">${basCent(D.aportado)} <small>de ${brl(D.meta)}</small></b>${basBarra(f)}<p class="bas-p">${f >= 1 ? voz('bas_meta_ok') : `Faltam <b>${brl(D.faltaMeta)}</b> ${esc(basJanFrase())}.`}</p>` : `<p class="bas-p bas-p0">${voz('bas_meta_sem')}</p>`}`);
  secs.cartoes = basCartoesHtml();
  if (temRecurso('proventos')) secs.proventos = `<ul class="bas-ativ">${basRow(basIr('proventos'), I_PROV, 'Proventos', `${esc(cap(basJanFrase()))} · ${brl(C.T.faturamento)} no ano`, `<b class="pos">${basCent(basSomaJ(C.faturamento))}</b>`)}</ul>`;
}
// organizar: arrastar pela alça (manipulação direta, 1:1 com o dedo); a ordem é lida da tela ao soltar
function basOrgLigar() {
  const lista = document.querySelector('.bas-org-l[data-aba]'); if (!lista || lista.dataset.on) return; lista.dataset.on = '1'; const aba = lista.dataset.aba;
  lista.addEventListener('pointerdown', (e) => {
    const h = e.target.closest('.bas-org-h'); if (!h) return; const li = h.closest('li'); e.preventDefault(); try { h.setPointerCapture(e.pointerId); } catch (er) { /* sem captura: segue pelos eventos da alça */ }
    let y0 = e.clientY; li.classList.add('arrasta'); basSom('toque');
    const mover = (ev) => { let dy = ev.clientY - y0; const irmas = [...lista.children].filter((x) => x !== li);
      for (const o of irmas) { const r = o.getBoundingClientRect(); const meio = r.top + r.height / 2; const rl = li.getBoundingClientRect();
        if (dy < 0 && o.compareDocumentPosition(li) & Node.DOCUMENT_POSITION_FOLLOWING && ev.clientY < meio) { lista.insertBefore(li, o); y0 -= r.height + 8; dy = ev.clientY - y0; break; }
        if (dy > 0 && o.compareDocumentPosition(li) & Node.DOCUMENT_POSITION_PRECEDING && ev.clientY > meio && rl.bottom < r.bottom) { lista.insertBefore(li, o.nextSibling); y0 += r.height + 8; dy = ev.clientY - y0; break; } }
      li.style.translate = `0 ${dy}px`; };
    const soltar = () => { h.removeEventListener('pointermove', mover); li.style.translate = ''; li.classList.remove('arrasta');
      const vis = [...lista.querySelectorAll('li[data-id]')].map((x) => x.dataset.id); const resto = basOrdemDe(aba).filter((id) => !vis.includes(id));
      const p = S.profile; p.basOrdem = p.basOrdem || {}; p.basOrdem[aba] = vis.concat(resto); touch('profile'); basRetorno('ok'); render(); };
    h.addEventListener('pointermove', mover); h.addEventListener('pointerup', soltar, { once: true }); h.addEventListener('pointercancel', soltar, { once: true });
  });
}
// resumo do mês como imagem (canvas 1080 x 1350), para compartilhar a foto e não o texto; com o olho oculto, sem os valores
function basStoryPng(m) {
  const R = basRsDados(m); const cs = getComputedStyle(document.documentElement); const acc = cs.getPropertyValue('--accent').trim() || '#0A84FF'; const acc2 = cs.getPropertyValue('--accent-2').trim() || '#5E5CE6';
  const fonte = getComputedStyle(document.body).fontFamily; const W = 1080; const H = 1350; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const ic = new Image(); ic.src = new URL('assets/img/icon-512.png', document.baseURI).href;
  return (ic.decode ? ic.decode() : Promise.resolve()).catch(() => null).then(() => {
    x.fillStyle = '#0E0F13'; x.fillRect(0, 0, W, H);
    const brilho = (cx, cy, r, cor, a) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, cor); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a; x.fillStyle = gr; x.fillRect(0, 0, W, H); x.globalAlpha = 1; };
    brilho(W * 0.5, -60, 760, acc, 0.75); brilho(W * 0.5, H + 120, 760, acc2, 0.5);
    x.fillStyle = 'rgba(255,255,255,0.10)'; for (let yy = 30; yy < 620; yy += 36) for (let xx = 30; xx < W; xx += 36) { x.globalAlpha = 0.9 * (1 - yy / 620); x.fillRect(xx, yy, 2.5, 2.5); } x.globalAlpha = 1;
    const txt = (t, px, peso, cor, y, al) => { x.font = `${peso} ${px}px ${fonte}`; x.fillStyle = cor; x.textAlign = al || 'center'; x.fillText(t, al === 'left' ? 96 : al === 'right' ? W - 96 : W / 2, y); };
    // o ícone do Cifrão no alto, com cantos redondos
    if (ic.complete && ic.naturalWidth) { x.save(); x.beginPath(); x.roundRect(W / 2 - 72, 70, 144, 144, 34); x.clip(); x.drawImage(ic, W / 2 - 72, 70, 144, 144); x.restore(); }
    txt(`${cap(MES_LONGO[R.m])} de ${S.year}`, 38, 500, 'rgba(245,245,247,0.7)', 286);
    txt(R.head.v, R.head.v.length > 14 ? 104 : 128, 800, '#ffffff', 420); txt(R.head.k, 38, 500, 'rgba(245,245,247,0.7)', 485);
    const y0 = 560; R.L.forEach(([n, val, c], i) => { const y = y0 + i * 118; x.fillStyle = 'rgba(255,255,255,0.07)'; x.beginPath(); x.roundRect(80, y, W - 160, 96, 28); x.fill(); txt(n, 38, 500, 'rgba(245,245,247,0.7)', y + 61, 'left'); txt(val, 42, 700, c === 'pos' ? '#30D158' : '#ffffff', y + 62, 'right'); });
    if (R.g) { const y = y0 + R.L.length * 118 + 44; txt(`${R.g.nome} · ${pct(R.g.p)} do caminho`, 36, 600, '#ffffff', y, 'left'); x.fillStyle = 'rgba(255,255,255,0.14)'; x.beginPath(); x.roundRect(96, y + 30, W - 192, 22, 11); x.fill();
      const gr = x.createLinearGradient(96, 0, W - 96, 0); gr.addColorStop(0, acc2); gr.addColorStop(1, acc); x.fillStyle = gr; x.beginPath(); x.roundRect(96, y + 30, Math.max(22, (W - 192) * R.g.p), 22, 11); x.fill(); }
    txt(`Feito com ${CFG.marca || 'Cifrão'}`, 30, 500, 'rgba(245,245,247,0.5)', H - 70);
    return new Promise((ok) => cv.toBlob((b) => ok(b), 'image/png'));
  });
}

/* ---- rodada 5: widgets inteligentes do Início, sonhos com carrossel e detalhes, e a tela de cada cartão ---- */
const BAS_SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
// análise de gastos de um mês (ou do ano com m = -1), a mesma do SaaS (E.analiseGastos), com todas as entradas do ano
function basAnalise(m, de, ate) {
  const ents = []; for (let k = 0; k < 12; k++) entradasMes(k).forEach((e) => { e.m = k; ents.push(e); });
  const hoje = S.year === NOW_Y ? { mes: NOW_M, dia: new Date().getDate() } : null;
  return E.analiseGastos({ ano: S.year, mes: m, ...(de != null ? { de, ate } : {}), entradas: ents, catsDesp: S.plan.catsDesp, orcamento: S.C.orcamento, hoje, parcelados: S.plan.despesas.concat(planCtx().carry).filter((it) => it.parcel) });
}
// curva suave (Catmull-Rom para Bézier) por uma lista de pontos [x, y]
const basCurva = (pts) => pts.map((p0, i) => { if (!i) return `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)}`; const a = pts[i - 2] || pts[i - 1]; const b = pts[i - 1]; const d = pts[i + 1] || p0;
  return `C${(b[0] + (p0[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (p0[1] - a[1]) / 6).toFixed(1)} ${(p0[0] - (d[0] - b[0]) / 6).toFixed(1)} ${(p0[1] - (d[1] - b[1]) / 6).toFixed(1)} ${p0[0].toFixed(1)} ${p0[1].toFixed(1)}`; }).join(' ');
const basVibra = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* sem vibração */ } };
function basAhLigar() {
  const g = document.querySelector('.bas-ah4-g[data-d]'); if (!g || g.dataset.lig) return; g.dataset.lig = '1';
  const D = JSON.parse(g.dataset.d); const pg = g.closest('.bas-pg-ah'); const ms = Object.keys(D.m).map(Number); if (!ms.length) return;
  let atual = S.basAhMes != null && D.m[S.basAhMes] ? S.basAhMes : null; let arr = false;
  const mostra = (m) => { atual = m; S.basAhMes = m; const foco = m == null ? D.ult : m; const v = m == null ? D.ano : D.m[m];
    pg.querySelectorAll('.bas-ah4-p').forEach((b) => { const on = +b.dataset.m === foco; b.classList.toggle('on', on); const lb = b.querySelector('b'); if (lb) lb.remove(); if (on) b.insertAdjacentHTML('beforeend', `<b>${D.m[b.dataset.m].pl}</b>`); });
    pg.querySelectorAll('.bas-ah7-dv span').forEach((sp, i) => sp.classList.toggle('on', i === foco));
    pg.querySelectorAll('.bas-ah2-x span').forEach((sp, i) => sp.classList.toggle('on', i === foco));
    pg.querySelectorAll('[data-ahk]').forEach((e) => { e.innerHTML = v[e.dataset.ahk]; if (e.dataset.ahk === 'sob') e.classList.toggle('neg', !!v.neg); });
    const vt = pg.querySelector('[data-act="bas-ah-ano-todo"]'); if (vt) vt.hidden = m == null; };
  const pega = (e) => { const r = g.getBoundingClientRect(); const i = Math.max(0, Math.min(11, Math.floor(((e.clientX - r.left) / r.width) * 12)));
    const m = ms.reduce((b, x) => (Math.abs(x - i) < Math.abs(b - i) ? x : b), ms[0]); if (m !== atual) { mostra(m); if (typeof basVibra === 'function') basVibra(); } };
  g.addEventListener('pointerdown', (e) => { arr = true; try { g.setPointerCapture(e.pointerId); } catch (x) { /* sem captura */ } pega(e); });
  g.addEventListener('pointermove', (e) => { if (arr) pega(e); });
  ['pointerup', 'pointercancel'].forEach((t) => g.addEventListener(t, () => { arr = false; }));
  g.addEventListener('keydown', (e) => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); const k = ms.indexOf(atual == null ? D.ult : atual); const n = ms[Math.max(0, Math.min(ms.length - 1, k + (e.key === 'ArrowRight' ? 1 : -1)))]; mostra(n); });
  pg.querySelector('[data-act="bas-ah-ano-todo"]')?.addEventListener('click', (e) => { e.stopPropagation(); mostra(null); });
}
function basHlLigar() {
  document.querySelectorAll('.bas-hl-g').forEach((g) => { if (g.dataset.lig) return; g.dataset.lig = '1';
    const pts = JSON.parse(g.dataset.pts || '[]'); const W = +g.dataset.w; const H = +g.dataset.h; const tips = [...g.querySelector('.bas-hl-tips').content.children].map((d) => d.innerHTML);
    const tip = g.querySelector('.bas-hl-tip'); const guia = g.querySelector('.bas-hl-guia'); const dots = g.querySelectorAll('.bas-hl-d'); let ultI = -1; const topo = pts.reduce((b, q, n) => (q[1] < pts[b][1] ? n : b), 0);
    const mostra = (e) => { const r = g.getBoundingClientRect(); const xv = ((e.clientX - r.left) / r.width) * W; let i = 0; pts.forEach((q, k) => { if (Math.abs(q[0] - xv) < Math.abs(pts[i][0] - xv)) i = k; });
      if (i === ultI) return; ultI = i; const xp = (pts[i][0] / W) * 100; const yp = (pts[i][1] / H) * 100;
      guia.style.left = xp + '%'; g.classList.add('ativo'); dots.forEach((d, k) => d.classList.toggle('on', k === i));
      tip.innerHTML = tips[i]; tip.hidden = false; tip.style.left = Math.min(78, Math.max(22, xp)) + '%'; tip.style.top = Math.max(0, yp - 6) + '%'; tip.classList.toggle('topo', i === topo); if (i === topo) basVibra(14); };
    g.addEventListener('pointerdown', (e) => { try { g.setPointerCapture(e.pointerId); } catch (er) { /* sintético */ } ultI = -1; mostra(e); });
    g.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || g.hasPointerCapture && g.hasPointerCapture(e.pointerId)) mostra(e); });
    g.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { g.classList.remove('ativo'); tip.hidden = true; ultI = -1; } });
  });
}
// sequência: meses seguidos com aporte (E.sequenciaMeses, testada), somando o ano anterior; anel de 12 segmentos que acendem
// sequência: aportes mês a mês deste ano e do anterior (a soma de ap de cada ativo) e a contagem (E.sequenciaMeses, testada)
function basSeqDados() {
  const apl = (pl) => { const v = new Array(12).fill(0); ((pl && pl.ativos) || []).forEach((a) => (a.ap || []).forEach((x, m) => { v[m] += +x || 0; })); return v; };
  const ult = S.year === NOW_Y ? NOW_M : 11; const anos = Object.keys(S.plans).map(Number).filter((y) => y <= S.year).sort((a, b) => a - b);
  const cr = String((S.profile && S.profile.criadoEm) || ''); const dIni = /^\d{4}-\d{2}/.test(cr) ? { ano: +cr.slice(0, 4), mes: +cr.slice(5, 7) - 1 } : { ano: anos[0] || S.year, mes: 0 };
  // o primeiro mês com aporte pode ser anterior à conta (dados importados): começa no que vier primeiro
  let ini = dIni; anos.forEach((y) => { const v = apl(S.plans[y]); const k = v.findIndex((x) => x > 0); if (k >= 0 && (y < ini.ano || (y === ini.ano && k < ini.mes))) ini = { ano: y, mes: k }; });
  const meses = []; for (let y = ini.ano; y <= S.year; y++) { const v = apl(S.plans[y]); for (let m = y === ini.ano ? ini.mes : 0; m <= (y === S.year ? ult : 11); m++) meses.push({ ano: y, mes: m, v: v[m] }); }
  if (!meses.length) meses.push({ ano: S.year, mes: ult, v: 0 }); const vals = meses.map((x) => x.v);
  return { ult, vals, meses, ini, Q: E.sequenciaMeses(vals, vals.length - 1) };
}
// constelação: 12 estrelas num caminho que sobe; cada mês seguido acende uma, as acesas se ligam e a mais nova pulsa
function basConstelacao(n) {
  const k = Math.min(n, 12); const P = [[8, 72], [21, 60], [33, 67], [45, 51], [57, 57], [66, 41], [79, 45], [88, 29], [100, 35], [108, 19], [120, 23], [126, 8]];
  const caminho = (a) => a.map((q, i) => `${i ? 'L' : 'M'}${q[0]} ${q[1]}`).join(' ');
  return `<svg viewBox="0 0 134 80" aria-hidden="true"><path class="bas-ct-p" d="${caminho(P)}"/>${k > 1 ? `<path class="bas-ct-l" d="${caminho(P.slice(0, k))}" pathLength="1"/>` : ''}
    ${P.map((q, i) => `<circle class="bas-ct-e${i < k ? ' on' : ''}${i === k - 1 ? ' nova' : ''}" cx="${q[0]}" cy="${q[1]}" r="${i < k ? (i === k - 1 ? 3.6 : 2.6) : 1.6}" style="--i:${i}"/>`).join('')}</svg>`;
}
// marcos da sequência, como conquistas que acendem
const BAS_SEQ_MARCOS = [[3, 'Lua crescente', '3 meses seguidos', 'bronze'], [6, 'Lua cheia', '6 meses seguidos', 'prata'], [12, 'Planeta de anéis', '12 meses seguidos', 'ouro'], [24, 'Supernova', '24 meses seguidos', 'platina'], [36, 'Buraco negro', '36 meses seguidos', 'diamante']];
// abertura do mês: no começo de um mês novo, uma retrospectiva do mês que passou, em 4 telas que passam sozinhas
function basTelaRetro(o) {
  const m = o.id != null ? +o.id : NOW_M - 1; if (!(m >= 0) || !S.C) return basSumiu(); const C = S.C; const carry = E.carryItems(S.plans, S.year);
  const sob = C.investAlocado[m]; const ent = C.receita[m]; const ar = E.gastosAreaMes(S.plan, carry, m); const top = Object.keys(ar).map((k) => [k, ar[k]]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 3); const mxA = top.length ? top[0][1] : 1;
  const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes }); const n = basSeqDados().Q.atual; const pAnt = m > 0 ? C.patrimonio[m - 1] : C.patrimonioBase; const dp = C.patrimonio[m] - pAnt;
  const sl = [
    `<small>Sua retrospectiva</small><b class="bas-wr-g">${cap(MES_LONGO[m])}<br>acabou.</b><p>Vamos ver como foi?</p>`,
    `<small>Sobrou no mês</small><b class="bas-wr-v">${basCent(sob)}</b><p>${ent > 0 ? `Você guardou <em>${pct(Math.max(0, sob / ent))}</em> do que entrou.` : 'Anote as entradas para ver quanto guardou.'}</p>`,
    `<small>Para onde foi o dinheiro</small>${top.length ? `<ul class="bas-wr-l">${top.map(([a, v], i) => `<li><span>${i + 1}. ${esc(a)}</span><i style="--w:${((v / mxA) * 100).toFixed(0)}%"></i><b>${brl0(v)}</b></li>`).join('')}</ul>` : '<p>Nenhum gasto anotado.</p>'}`,
    `<small>Investido</small><b class="bas-wr-v">${basCent(D.aportado)}</b><p>${n > 0 ? `Sua sequência está em <em>${n} ${n === 1 ? 'mês' : 'meses'}</em>.` : 'Um aporte este mês começa uma sequência.'}${C.faturamento[m] > 0 ? ` E os proventos somaram ${brl0(C.faturamento[m])}.` : ''}</p>`,
    `<small>Seu patrimônio</small><b class="bas-wr-v">${basCent(C.patrimonio[m])}</b><p>${Math.abs(dp) >= 1 ? `${dp > 0 ? 'Cresceu' : 'Caiu'} <em>${brl0(Math.abs(dp))}</em> no mês.` : 'Ficou estável no mês.'}</p><button class="bas-dp-bt" data-act="bas-retro-share" data-m="${m}">${I_PARTILHA}Compartilhar o mês</button>`,
  ];
  return `<section class="bas-wr" data-n="${sl.length}" style="--n:${sl.length}"><div class="bas-wr-bar">${sl.map((_, i) => `<span><i style="--i:${i}"></i></span>`).join('')}</div>
    <button class="bas-wr-x" data-act="bas-voltar" aria-label="Fechar">${I.x}</button>${sl.map((h, i) => `<div class="bas-wr-s${i ? '' : ' on'}" data-s="${i}">${h}</div>`).join('')}
    <button class="bas-wr-z e" data-act="bas-wr" data-d="-1" aria-label="Anterior"></button><button class="bas-wr-z d" data-act="bas-wr" data-d="1" aria-label="Próxima"></button></section>`;
}
// telas da retrospectiva: troca a cada 5 s ou num toque nas metades da tela (sem render)
function basWrIr(w, i) {
  const n = +w.dataset.n; if (i >= n) { basFechar(); return; } i = Math.max(0, i); w.dataset.i = i;
  w.querySelectorAll('.bas-wr-s').forEach((x, k) => x.classList.toggle('on', k === i)); w.querySelectorAll('.bas-wr-bar i').forEach((b, k) => { b.className = k < i ? 'cheia' : k === i ? 'anda' : ''; });
  clearTimeout(w._t); if (i < n - 1) w._t = setTimeout(() => { if (w.isConnected) basWrIr(w, i + 1); }, 5000);
}
// os meses que fizeram a conquista: a primeira vez em que a sequência chegou a q meses seguidos
function basMarcoInfo(q) {
  const { meses } = basSeqDados(); let run = 0;
  for (let i = 0; i < meses.length; i++) { run = meses[i].v > 0 ? run + 1 : 0; if (run === q) { const ms = meses.slice(i - q + 1, i + 1); return { ms, ini: ms[0], fim: meses[i], tot: ms.reduce((t, x) => t + x.v, 0), maior: ms.reduce((a, x) => (x.v > a.v ? x : a), ms[0]) }; } }
  return null;
}
const basMesCurto = (x) => `${MES[x.mes].slice(0, 3)}/${String(x.ano).slice(2)}`;
// verso da medalha, no mesmo metal: borda gravada com a data, um ponto cunhado por mês da sequência e o que foi preciso para chegar lá
function basMedalhaVerso(q, nivel, info) {
  const [m1, m2, m3] = BAS_METAIS[nivel] || BAS_METAIS.prata; const id = `mv${q}`; const M = BAS_SEQ_MARCOS.find((x) => x[0] === q) || [q, ''];
  const borda = `${info ? `CONQUISTADA EM ${MES[info.fim.mes].slice(0, 3).toUpperCase()} DE ${info.fim.ano}` : `${q} MESES SEGUIDOS`} · ${(CFG.marca || 'Cifrão').toUpperCase()} ·`;
  const pontos = Array.from({ length: q }, (_, k) => { const a = (-90 + (k * 360) / q) * Math.PI / 180; return `<circle cx="${(50 + 30.5 * Math.cos(a)).toFixed(2)}" cy="${(50 + 30.5 * Math.sin(a)).toFixed(2)}" r="${q > 24 ? 0.9 : 1.2}"/>`; }).join('');
  const gr = (t, y, px, cls) => `<text class="bas-mv-tx${cls ? ' ' + cls : ''}" x="50" y="${y}" text-anchor="middle" style="font-size:${px}px">${esc(t)}</text>`;
  const grav = (t, y, px, cls) => gr(t, y, px, `l ${cls || ''}`) + gr(t, y, px, cls);
  return `<span class="bas-mxw ${nivel} on" aria-hidden="true"><i class="bas-mx-aura"></i><span class="bas-mx on bas-mv" style="--m1:${m1};--m2:${m2};--m3:${m3}"><svg viewBox="0 0 100 100">
      <defs><filter id="${id}r" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b"/>
        <feDiffuseLighting in="b" surfaceScale="2.6" diffuseConstant="1.05" lighting-color="${m2}" result="d"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting><feComposite in="d" in2="SourceAlpha" operator="in" result="d2"/>
        <feSpecularLighting in="b" surfaceScale="2.6" specularConstant="1.1" specularExponent="24" lighting-color="#fff" result="s"><feDistantLight azimuth="225" elevation="40"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
        <feMerge><feMergeNode in="d2"/><feMergeNode in="s2"/></feMerge></filter>
        <path id="${id}t" d="M50 50 m-39 0 a39 39 0 1 1 78 0 a39 39 0 1 1 -78 0"/></defs>
      <text class="bas-mx-tx l"><textPath href="#${id}t">${esc(borda)}</textPath></text><text class="bas-mx-tx"><textPath href="#${id}t">${esc(borda)}</textPath></text>
      <g class="bas-mx-em" filter="url(#${id}r)">${pontos}<text x="50" y="52" text-anchor="middle" class="bas-mv-n">${q}</text></g>
      ${grav('SEQUÊNCIA DE', 33.5, 3.4)}${grav('MESES SEGUIDOS', 58.5, 3.4)}<path class="bas-mv-li" d="M38 62 H62"/>
      ${info ? `${grav(`${basMesCurto(info.ini)} — ${basMesCurto(info.fim)}`.toUpperCase(), 67.5, 3.6)}${grav(oculto() ? 'INVESTIMENTO CONSTANTE' : `${brl0(info.tot)} INVESTIDOS`, 72.5, 3, 'f')}` : grav(cap(M[1]).toUpperCase(), 68, 3.6)}
    </svg><i class="bas-mx-rf"></i></span></span>`;
}
// conquista: a medalha em tamanho grande para ver de perto; arrastar gira, tocar vira para o verso
function basTelaConquista(o) {
  const q = +o.id; const M = BAS_SEQ_MARCOS.find((x) => x[0] === q); if (!M) return basSumiu(); const nv = M[3]; const info = basMarcoInfo(q);
  const borda = Array.from({ length: 12 }, (_, k) => `<i style="--z:${(k - 5.5).toFixed(1)}px"></i>`).join('');
  const ks = info ? `<div class="bas-cq-ks"><span><small>Período</small><b>${basMesCurto(info.ini)} a ${basMesCurto(info.fim)}</b></span><span><small>Investido</small><b>${brl0(info.tot)}</b></span><span><small>Média por mês</small><b>${brl0(info.tot / q)}</b></span></div>` : '';
  return basDet('Conquista', `<section class="bas-cq ${nv}"><span class="bas-cq-luz" aria-hidden="true"></span>
      <div class="bas-m3" role="button" tabindex="0" aria-label="Medalha ${esc(M[1])}. Toque para ver o verso; arraste para girar." style="--m1:${BAS_METAIS[nv][0]};--m2:${BAS_METAIS[nv][1]};--m3:${BAS_METAIS[nv][2]}">
        <div class="bas-m3-r"><div class="bas-m3-f">${basBrasao(q, nv, true)}</div><div class="bas-m3-b" aria-hidden="true">${borda}</div><div class="bas-m3-f tras">${basMedalhaVerso(q, nv, info)}</div></div><span class="bas-m3-sombra" aria-hidden="true"></span></div>
      <small class="bas-m3-dica">Arraste para girar · toque para virar</small>
      <b class="bas-cq-t">${esc(M[1])}</b><span class="bas-cq-s">${q} meses seguidos investindo · ${cap(nv)}</span>
      ${info ? `<span class="bas-cq-em">Conquistada em ${MES_LONGO[info.fim.mes]} de ${info.fim.ano}</span>` : ''}${ks}
      <p class="bas-cq-p">Cada estrela é um mês em que você escolheu o seu futuro. Continue acendendo.</p></section>
    <button class="btn primary lg bas-cta bas-add" data-act="bas-cq-share" data-q="${q}">Compartilhar conquista</button>`);
}
// gira a medalha: segue o dedo 1:1, ao soltar a mola leva à face mais próxima do ponto projetado pela velocidade; toque vira
function basMedalhaLigar() {
  const w = document.querySelector('.bas-m3'); if (!w || w.dataset.lig) return; w.dataset.lig = '1';
  const r = w.querySelector('.bas-m3-r'); const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches; const mx = w.querySelectorAll('.bas-mx');
  let a = 0; let t = 0; let va = 0; let alvo = 0; let raf = 0; let g = null; let tq = 0;
  const pinta = () => { r.style.transform = `rotateX(${t.toFixed(2)}deg) rotateY(${a.toFixed(2)}deg)`; const hx = `${(50 - Math.sin(a * Math.PI / 180) * 42).toFixed(1)}%`; mx.forEach((m) => m.style.setProperty('--hx', hx)); };
  const mola = (agora) => { const dt = Math.min(0.032, (agora - (tq || agora)) / 1000) || 0.016; tq = agora;
    va += ((alvo - a) * 160 - va * 18) * dt; a += va * dt; t += -t * Math.min(1, dt * 9); pinta(); // mola com leve balanço (amortecimento ~0.7)
    if (Math.abs(alvo - a) > 0.08 || Math.abs(va) > 0.5 || Math.abs(t) > 0.08) raf = requestAnimationFrame(mola); else { a = alvo; t = 0; pinta(); raf = 0; } };
  const ir = (novo, vel) => { alvo = novo; if (vel != null) va = vel; if (calmo) { a = alvo; t = 0; pinta(); return; } if (!raf) { tq = 0; raf = requestAnimationFrame(mola); } };
  const virar = () => { ir((Math.round(a / 180) + 1) * 180, 0); basSom('toque'); basVibra(8); };
  w.addEventListener('pointerdown', (e) => { cancelAnimationFrame(raf); raf = 0; w.setPointerCapture(e.pointerId); g = { x: e.clientX, y: e.clientY, a, t, h: [[e.clientX, e.timeStamp]], mov: false }; });
  w.addEventListener('pointermove', (e) => { if (!g) return; const dx = e.clientX - g.x; const dy = e.clientY - g.y; if (!g.mov && Math.hypot(dx, dy) > 8) g.mov = true; if (!g.mov) return;
    a = g.a + dx * 0.75; t = Math.max(-28, Math.min(28, g.t - dy * 0.3)); g.h.push([e.clientX, e.timeStamp]); if (g.h.length > 6) g.h.shift(); pinta(); });
  const fim = () => { if (!g) return; const p = g; g = null; if (!p.mov) { virar(); return; }
    const [x0, t0] = p.h[0]; const [x1, t1] = p.h[p.h.length - 1]; const vel = ((x1 - x0) / Math.max(16, t1 - t0)) * 1000 * 0.75; // graus por segundo
    ir(Math.round((a + (vel / 1000) * 0.995 / 0.005) / 180) * 180, vel); };
  w.addEventListener('pointerup', fim); w.addEventListener('pointercancel', fim);
  w.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); virar(); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); ir(alvo + (e.key === 'ArrowLeft' ? -30 : 30), 0); } });
  if (!calmo) { a = -38; t = 8; pinta(); ir(0, 0); } // entra girando de leve até a frente
}
function basConquistaPng(q) {
  const M = BAS_SEQ_MARCOS.find((x) => x[0] === q) || [q, '', '']; const cs = getComputedStyle(document.documentElement); const acc = cs.getPropertyValue('--accent').trim() || '#0A84FF';
  const fonte = getComputedStyle(document.body).fontFamily; const W = 1080; const H = 1350; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#0B0C12'; x.fillRect(0, 0, W, H);
  const brilho = (cx, cy, r, cor, a) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, cor); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a; x.fillStyle = gr; x.fillRect(0, 0, W, H); x.globalAlpha = 1; };
  brilho(W * 0.8, 80, 760, acc, 0.6); brilho(W * 0.1, H, 760, '#7c5cff', 0.45);
  x.fillStyle = 'rgba(255,255,255,0.12)'; for (let yy = 24; yy < H; yy += 36) for (let xx = 24; xx < W; xx += 36) x.fillRect(xx, yy, 2.5, 2.5);
  const P = [[8, 72], [21, 60], [33, 67], [45, 51], [57, 57], [66, 41], [79, 45], [88, 29], [100, 35], [108, 19], [120, 23], [126, 8]].map(([a, b]) => [140 + a * 6.2, 230 + b * 6.2]); const k = Math.min(q, 12);
  x.strokeStyle = 'rgba(255,255,255,0.25)'; x.setLineDash([6, 12]); x.lineWidth = 3; x.beginPath(); P.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke(); x.setLineDash([]);
  x.strokeStyle = acc; x.lineWidth = 6; x.shadowColor = acc; x.shadowBlur = 24; x.beginPath(); P.slice(0, k).forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
  P.forEach((p, i) => { x.beginPath(); x.fillStyle = i < k ? '#fff' : 'rgba(255,255,255,0.3)'; x.arc(p[0], p[1], i < k ? 13 : 7, 0, Math.PI * 2); x.fill(); }); x.shadowBlur = 0;
  const gr = x.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0); gr.addColorStop(0, '#e3b445'); gr.addColorStop(0.5, '#fff1c4'); gr.addColorStop(1, '#e3b445'); x.fillStyle = gr; x.beginPath(); x.arc(W / 2, 860, 110, 0, Math.PI * 2); x.fill();
  const txt = (t, px, peso, cor, y) => { x.font = `${peso} ${px}px ${fonte}`; x.fillStyle = cor; x.textAlign = 'center'; x.fillText(t, W / 2, y); };
  txt(String(q), 110, 800, '#2b2006', 900); txt(M[1], 76, 800, '#ffffff', 1080); txt(`${q} meses seguidos investindo`, 40, 500, 'rgba(245,245,247,0.75)', 1145);
  txt(`Feito com ${CFG.marca || 'Cifrão'}`, 30, 500, 'rgba(245,245,247,0.5)', H - 70);
  return new Promise((ok) => cv.toBlob((b) => ok(b), 'image/png'));
}
// paletas das joias por nível: claro, médio, escuro e brilho; "base" segue a cor de destaque
const BAS_GEMAS = { base: ['color-mix(in srgb, var(--accent) 35%, #fff)', 'var(--accent)', 'color-mix(in srgb, var(--accent) 55%, #000)', 'var(--accent)'],
  bronze: ['#ffd2a3', '#cd7f3e', '#6e3a12', '#e0894a'], prata: ['#ffffff', '#b9c4d1', '#5b6674', '#c9d4e2'], ouro: ['#fff3c2', '#f2b632', '#8a5606', '#ffc94a'],
  platina: ['#effcff', '#86d0f0', '#2f7096', '#7fd6ff'], diamante: ['#f6efff', '#a487ff', '#3a2a9e', '#7cdcff'] };
const basNivel = (meses) => { const m = [...BAS_SEQ_MARCOS].reverse().find((x) => meses >= x[0]); return m ? m[3] : 'base'; };
// estrela lapidada: cinco pontas, cada uma em duas facetas (luz e sombra), núcleo de luz e um reflexo que corre
function basEstrela(nivel, id) {
  // estrela como no céu: núcleo branco, brilho na cor do nível e um halo que se apaga; dois raios finos e discretos de luz
  const [cl, md] = BAS_GEMAS[nivel] || BAS_GEMAS.base;
  return `<defs><radialGradient id="eh-${id}"><stop offset="0" stop-color="#fff"/><stop offset=".1" stop-color="#fff"/><stop offset=".22" style="stop-color:${cl}"/><stop offset=".45" style="stop-color:${md};stop-opacity:.45"/><stop offset="1" style="stop-color:${md};stop-opacity:0"/></radialGradient>
    <linearGradient id="ev-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="eo-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g class="bas-es"><circle class="bas-es-halo" cx="50" cy="50" r="48" fill="url(#eh-${id})"/><rect class="bas-es-raio" x="49.3" y="6" width="1.4" height="88" fill="url(#ev-${id})"/><rect class="bas-es-raio" x="6" y="49.3" width="88" height="1.4" fill="url(#eo-${id})"/><circle cx="50" cy="50" r="5.5" fill="#fff"/></g>`;
}
// medalha comemorativa de um marco: moeda de metal escovado do nível (obsidiana no máximo), borda em relevo com o texto gravado,
// campo rebaixado com gravação fina e o emblema cunhado em alto relevo (luz e sombra reais por filtro de iluminação do SVG)
const BAS_METAIS = { bronze: ['#f0c39a', '#a8683a', '#4e2a12'], prata: ['#ffffff', '#b8bfc8', '#5c636d'], ouro: ['#fff0c0', '#d9a43a', '#6e4a0c'],
  platina: ['#f4f8fb', '#a9bccb', '#4f6272'], diamante: ['#8c95a8', '#252a35', '#07080b'] };
function basBrasao(q, nivel, on) {
  const [m1, m2, m3] = BAS_METAIS[nivel] || BAS_METAIS.prata; const id = `mx${q}`; const M = BAS_SEQ_MARCOS.find((x) => x[0] === q) || [q, ''];
  const emb = {
    bronze: `<mask id="${id}k"><rect width="100" height="100" fill="#fff"/><circle cx="58" cy="44" r="19" fill="#000"/></mask><g mask="url(#${id}k)"><circle cx="50" cy="50" r="22"/></g>`,
    prata: `<mask id="${id}k"><rect width="100" height="100" fill="#fff"/><circle cx="42" cy="44" r="3.6" fill="#666"/><circle cx="57" cy="58" r="4.6" fill="#555"/><circle cx="46" cy="61" r="2" fill="#777"/><circle cx="60" cy="41" r="1.8" fill="#777"/><circle cx="38" cy="54" r="1.4" fill="#888"/><circle cx="63" cy="50" r="1.2" fill="#888"/><circle cx="52" cy="35" r="1.5" fill="#888"/></mask><circle cx="50" cy="50" r="22" mask="url(#${id}k)"/>`,
    ouro: `<g transform="rotate(-18 50 50)"><circle cx="50" cy="50" r="13"/><ellipse cx="50" cy="50" rx="29" ry="7.5" fill="none" stroke="#000" stroke-width="3.6"/></g>`,
    platina: `<polygon points="${Array.from({ length: 16 }, (_, k) => { const a = (k * 22.5 - 90) * Math.PI / 180; const r = k % 2 ? 7 : k % 4 ? 18 : 27; return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`; }).join(' ')}"/>`,
    diamante: `<mask id="${id}k"><rect width="100" height="100" fill="#fff"/><circle cx="50" cy="50" r="11" fill="#000"/></mask><g mask="url(#${id}k)"><circle cx="50" cy="50" r="15"/><ellipse cx="50" cy="51" rx="31" ry="6" fill="none" stroke="#000" stroke-width="3.4"/></g>`,
  }[nivel] || '';
  const texto = `${cap(M[1] || '').toUpperCase()} · ${q} MESES · ${(CFG.marca || 'Cifrão').toUpperCase()} ·`;
  // cada nível com a sua aura (atrás), o seu reflexo (sobre o metal) e os seus brilhos
  const brilhos = on ? Array.from({ length: { ouro: 3, platina: 2, diamante: 4 }[nivel] || 0 }, (_, k) => `<i class="bas-mx-sp" style="--i:${k}"></i>`).join('') : '';
  return `<span class="bas-mxw ${nivel}${on ? ' on' : ''}" aria-hidden="true"><i class="bas-mx-aura"></i><span class="bas-mx${on ? ' on' : ''}" style="--m1:${m1};--m2:${m2};--m3:${m3}"><svg viewBox="0 0 100 100">
      <defs><filter id="${id}r" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b"/>
        <feDiffuseLighting in="b" surfaceScale="3.2" diffuseConstant="1.05" lighting-color="${m2}" result="d"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting><feComposite in="d" in2="SourceAlpha" operator="in" result="d2"/>
        <feSpecularLighting in="b" surfaceScale="3.2" specularConstant="1.1" specularExponent="24" lighting-color="#fff" result="s"><feDistantLight azimuth="225" elevation="40"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
        <feMerge><feMergeNode in="d2"/><feMergeNode in="s2"/></feMerge></filter>
        <path id="${id}t" d="M50 50 m-39 0 a39 39 0 1 1 78 0 a39 39 0 1 1 -78 0"/></defs>
      <text class="bas-mx-tx l"><textPath href="#${id}t" startOffset="0">${esc(texto)}</textPath></text><text class="bas-mx-tx"><textPath href="#${id}t" startOffset="0">${esc(texto)}</textPath></text>
      <g class="bas-mx-em" filter="url(#${id}r)">${emb}</g></svg>${on ? `<i class="bas-mx-rf"></i>${brilhos}` : '<i class="bas-mx-ca"></i>'}</span></span>`;
}
const BAS_CEU = [
  { n: 'Cruzeiro do Sul', d: 'A menor constelação do céu e a que aponta o sul. Está na bandeira do Brasil.', e: [[54, 92, 3], [50, 8, 2.6], [16, 44, 2.6], [84, 38, 2], [66, 62, 1.4]], l: [[0, 1], [2, 3]] },
  { n: 'Cassiopeia', d: 'O W do céu do norte: a rainha da mitologia grega sentada no seu trono.', e: [[6, 36, 2.2], [27, 70, 2.6], [48, 44, 2.4], [70, 74, 2.2], [93, 28, 2]], l: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { n: 'Órion', d: 'O caçador. As Três Marias formam o seu cinturão.', e: [[24, 12, 3], [72, 18, 2.4], [58, 50, 2], [49, 55, 2.2], [40, 60, 2], [30, 92, 2.2], [80, 88, 3]], l: [[0, 1], [0, 4], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6]] },
  { n: 'Ursa Maior', d: 'As sete estrelas do Grande Carro, usadas há milênios para achar o norte.', e: [[6, 30, 2.2], [22, 20, 2.4], [40, 26, 2.4], [58, 30, 1.8], [62, 52, 2.2], [86, 46, 2.4], [88, 18, 2.8]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { n: 'Escorpião', d: 'Antares, uma supergigante vermelha, é o seu coração.', e: [[14, 14, 2], [22, 6, 2], [24, 24, 2], [32, 30, 2], [40, 40, 3.2], [47, 51, 2], [52, 63, 2], [56, 76, 2.2], [64, 87, 2.2], [76, 92, 2.2], [86, 86, 2.4], [90, 74, 2.6]], l: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11]] },
  { n: 'Leão', d: 'Régulo, a mais brilhante, marca o coração do leão.', e: [[18, 70, 3], [22, 48, 2.2], [30, 30, 2.4], [42, 22, 2], [52, 30, 2], [48, 48, 2.2], [76, 46, 2.2], [88, 66, 2.6], [70, 70, 2]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [7, 8], [8, 0]] },
  { n: 'Lira', d: 'Vega, uma das estrelas mais brilhantes do céu, é a harpa de Orfeu.', e: [[50, 10, 3.2], [40, 36, 2], [60, 36, 2], [38, 74, 2.2], [62, 72, 2.2]], l: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]] },
  { n: 'Cisne', d: 'Deneb marca a cauda do cisne que voa ao longo da Via Láctea.', e: [[50, 8, 3], [50, 34, 2.4], [50, 60, 2], [50, 92, 2.4], [18, 40, 2.2], [82, 30, 2.2]], l: [[0, 1], [1, 2], [2, 3], [4, 1], [1, 5]] },
];
// em que estrela de que constelação está cada mês com aporte (as constelações se repetem depois da última)
function basCeuDe(meses) {
  const com = meses.filter((x) => x.v > 0); const cons = []; let k = 0; let i = 0;
  while (k < com.length || !cons.length || cons[cons.length - 1].acesas === cons[cons.length - 1].c.e.length) {
    const c = BAS_CEU[i % BAS_CEU.length]; const meus = com.slice(k, k + c.e.length); cons.push({ c, meus, acesas: meus.length }); k += meus.length; i++; if (meus.length < c.e.length) break;
  }
  return { completas: cons.filter((x) => x.acesas === x.c.e.length), atual: cons[cons.length - 1] };
}
// um céu: fundo com Via Láctea e estrelinhas, as ligações entre as estrelas acesas e as estrelas da constelação
function basCeuSvg(cs, nv, id, mini) {
  const c = cs.c; const H = 70; const yy = (y) => 6 + (y / 100) * (H - 12); const xx = (x) => 6 + (x / 100) * 88;
  const lig = c.l.map(([a, b]) => { const on = a < cs.acesas && b < cs.acesas; return `<line class="bas-cl${on ? ' on' : ''}" x1="${xx(c.e[a][0])}" y1="${yy(c.e[a][1])}" x2="${xx(c.e[b][0])}" y2="${yy(c.e[b][1])}" style="--i:${Math.max(a, b)}"/>`; }).join('');
  const est = mini ? c.e.map(([x, y, m], k) => `<circle class="bas-cm${k < cs.acesas ? ' on' : ''}" cx="${xx(x)}" cy="${yy(y)}" r="${(m * 0.55).toFixed(2)}"/>`).join('') : '';
  // campo de estrelas espalhado (sempre o mesmo para cada constelação), com tamanhos e brilhos diferentes
  let sd = c.n.length * 97 + 13; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const fundo = Array.from({ length: mini ? 26 : 70 }, (_, k) => `<circle class="bas-cf" cx="${(rnd() * 100).toFixed(1)}" cy="${(rnd() * H).toFixed(1)}" r="${(0.08 + rnd() * rnd() * (mini ? 0.32 : 0.38)).toFixed(2)}" style="--o:${(0.25 + rnd() * 0.65).toFixed(2)};--d:${(rnd() * 4).toFixed(1)}s"/>`).join('');
  return `<svg class="bas-ceu-svg" viewBox="0 0 100 ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${fundo}${lig}${est}</svg>`;
}
// o céu grande: Via Láctea, ligações e as estrelas da constelação em botões (tocar mostra o mês); a próxima pulsa à espera
function basCeuGrande(A, nv, pre, agoraSem, ult) {
  const H = 70; const yy = (y) => 6 + (y / 100) * (H - 12); const xx = (x) => 6 + (x / 100) * 88;
  const estrelas = A.c.e.map(([x, y, m], k) => { const mm = A.meus[k]; const prox = k === A.acesas && agoraSem;
    return `<button class="bas-sq-dia bas-ce${mm ? ' on' : ''}${prox ? ' agora' : ''}" style="left:${xx(x)}%;top:${(yy(y) / H) * 100}%;--m:${m};--i:${k}" data-act="bas-sq-dia" data-r="${esc(mm ? `${cap(MES_LONGO[mm.mes])} de ${mm.ano}: ${brl0(mm.v)} investidos` : prox ? `${cap(MES_LONGO[ult])}: esta estrela acende com o aporte do mês` : 'Uma estrela ainda apagada. Cada mês com aporte acende uma.')}" aria-label="Estrela ${k + 1} de ${A.c.e.length}">
      ${mm ? `<svg viewBox="0 0 100 100" aria-hidden="true">${basEstrela(nv, pre + k)}</svg>` : '<i aria-hidden="true"></i>'}</button>`; }).join('');
  return `<div class="bas-ceu"><span class="bas-ceu-via" aria-hidden="true"></span><span class="bas-ceu-fundo" aria-hidden="true"></span>${basCeuSvg(A, nv, pre)}${estrelas}</div>`;
}
// uma constelação da galáxia: o céu dela, o período e cada mês que acendeu uma estrela
function basTelaConstelacao(o) {
  const { meses, ult, Q } = basSeqDados(); const ceu = basCeuDe(meses); const todas = ceu.completas.concat(ceu.atual); const k = +o.id; const cs = todas[k]; if (!cs) return basSumiu();
  const nv = basNivel(Q.atual); const ms = cs.meus; const tot = ms.reduce((t, x) => t + x.v, 0); const mx = ms.reduce((a, x) => Math.max(a, x.v), 0) || 1; const completa = cs.acesas === cs.c.e.length;
  const agoraSem = !completa && !Q.contaHoje && S.year === NOW_Y;
  const nav = todas.length > 1 ? `<div class="bas-cs-nav"><button class="bas-cs-s" data-act="bas-cs-ir" data-d="-1" aria-label="Constelação anterior"${k ? '' : ' disabled'}>${I.chev}</button><span>${k + 1} de ${todas.length}</span><button class="bas-cs-s" data-act="bas-cs-ir" data-d="1" aria-label="Próxima constelação"${k < todas.length - 1 ? '' : ' disabled'}>${I.chev}</button></div>` : '';
  const lista = ms.length ? `<ol class="bas-cs-l">${ms.map((x, i) => `<li style="--i:${i}"><span class="bas-cs-e" aria-hidden="true"><svg viewBox="0 0 100 100">${basEstrela(nv, 'l' + i)}</svg></span><span class="bas-n"><b>${cap(MES_LONGO[x.mes])} de ${x.ano}</b><small>Estrela ${i + 1}</small></span><span class="bas-cs-v"><b>${brl0(x.v)}</b><i style="--w:${((x.v / mx) * 100).toFixed(1)}%"></i></span></li>`).join('')}</ol>`
    : basVazio('Nenhuma estrela acesa ainda. O próximo aporte acende a primeira.');
  return basDet(cs.c.n, `<section class="card bas-sq-fila bas-cs" style="--jx-c:${(BAS_GEMAS[nv] || BAS_GEMAS.base)[3]}"><small class="bas-tj-t">${completa ? 'Constelação completa' : 'Em construção'}</small>
      ${basCeuGrande(cs, nv, 'k', agoraSem, ult)}<div class="bas-ceu-r"><b>${esc(cs.c.n)}</b><span>${cs.acesas} de ${cs.c.e.length} estrelas</span></div><p class="bas-sq-fila-r" aria-live="polite">Toque numa estrela</p></section>
    ${nav}<p class="bas-cs-d">${esc(cs.c.d || '')}</p>
    ${ms.length ? `<div class="bas-sq-ks"><span><small>Período</small><b>${basMesCurto(ms[0])}${ms.length > 1 ? ` a ${basMesCurto(ms[ms.length - 1])}` : ''}</b><em>${ms.length} ${ms.length === 1 ? 'mês' : 'meses'} com aporte</em></span><span><small>Investido</small><b>${brl0(tot)}</b><em>nesta constelação</em></span><span><small>Média por estrela</small><b>${brl0(tot / ms.length)}</b><em>maior: ${brl0(mx)}</em></span></div>` : ''}
    ${basSecao('Estrela por estrela', '', `<div class="card bas-cs-c">${lista}</div>`)}`);
}
// todos os meses: um mapa de pontos num céu, uma linha por ano; cada mês é uma estrela que brilha mais quanto maior o aporte
function basMapaMeses(meses, ult) {
  const anos = [...new Set(meses.map((x) => x.ano))].reverse(); const mx = meses.reduce((a, x) => Math.max(a, x.v), 0) || 1;
  const linha = (y) => `<span class="y">${y}</span>${MES.map((nm, m) => { const x = meses.find((z) => z.ano === y && z.mes === m); const k = x && x.v > 0 ? Math.sqrt(x.v / mx) : 0;
    const r = !x ? `${cap(MES_LONGO[m])} de ${y}: ${y > NOW_Y || (y === NOW_Y && m > NOW_M) ? 'ainda vai chegar' : 'antes de você começar'}` : x.v > 0 ? `${cap(MES_LONGO[m])} de ${y}: ${brl0(x.v)} investidos` : y === NOW_Y && m === ult ? `${cap(MES_LONGO[m])}: ainda dá tempo de investir` : `${cap(MES_LONGO[m])} de ${y}: sem aporte`;
    return `<button class="${!x ? 'fora' : x.v > 0 ? 'on' : 'off'}" style="--k:${k.toFixed(2)}" data-act="bas-an-mes" data-r="${esc(r)}" aria-label="${esc(r)}"${x ? '' : ' tabindex="-1"'}>${k ? '<i></i>' : ''}</button>`; }).join('')}`;
  return `<div class="card bas-pm"><div class="bas-pm-g"><span></span>${MES.map((nm) => `<span>${nm.slice(0, 1)}</span>`).join('')}${anos.map(linha).join('')}</div>
    <div class="bas-pm-leg" aria-hidden="true">menos <i></i><i></i><i></i> mais</div><p class="bas-an-r" aria-live="polite">Toque num mês</p></div>`;
}
// seta que recolhe e expande uma seção (estado só da sessão)
const basRecolhe = (id, nome) => `<button class="bas-gx-bt" data-act="bas-gx" data-nome="${nome}" aria-expanded="${S.basFech && S.basFech[id] ? 'false' : 'true'}" aria-controls="${id}" aria-label="${S.basFech && S.basFech[id] ? 'Expandir' : 'Recolher'} ${nome}">${I.chev}</button>`;
const basRecolheW = (id, corpo) => `<div class="bas-gx-w${S.basFech && S.basFech[id] ? ' fechada' : ''}" id="${id}"><div class="bas-gx-in">${corpo}</div></div>`;
function basTelaSequencia() {
  const { ult, meses, ini, Q } = basSeqDados(); const n = Q.atual; const hoje = new Date(); const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate(); const faltam = fimMes - hoje.getDate();
  const corrente = S.year === NOW_Y; const com = meses.filter((x) => x.v > 0).length; const tot = meses.length; const prox = BAS_SEQ_MARCOS.find((m) => m[0] > n); const ant = [...BAS_SEQ_MARCOS].reverse().find((m) => m[0] <= n);
  const base = ant ? ant[0] : 0; const prog = prox ? (n - base) / (prox[0] - base) : 1;
  const status = n === 0 ? 'Faça um aporte este mês e acenda o seu astro.' : Q.contaHoje ? `${cap(MES_LONGO[ult])} já está garantido. Continue no próximo mês!`
    : corrente ? `Faltam <b>${faltam} ${faltam === 1 ? 'dia' : 'dias'}</b> para o aporte de ${MES_LONGO[ult]}. Não deixe o astro apagar!` : `Falta o aporte de ${MES_LONGO[ult]}.`;
  const nv = basNivel(n);
  const parts = Array.from({ length: 16 }, (_, k) => `<i style="--x:${(k * 37) % 100}%;--d:${(k * 0.43) % 4}s;--t:${3 + (k % 5) * 0.6}s"></i>`).join('');
  // céu: cada mês com aporte acende uma estrela de uma constelação real; completa, ela vai para a galáxia e começa a próxima
  const ceu = basCeuDe(meses); const A = ceu.atual;
  const fila = `${basCeuGrande(A, nv, 'c', !Q.contaHoje && corrente, ult)}<div class="bas-ceu-r"><b>${esc(A.c.n)}</b><span>${A.acesas} de ${A.c.e.length} estrelas</span></div>`;
  const galaxia = ceu.completas;
  const desde = `${cap(MES_LONGO[ini.mes])} de ${ini.ano}`; const temp = tot >= 12 ? `${Math.floor(tot / 12)} ${tot >= 24 ? 'anos' : 'ano'}${tot % 12 ? ` e ${tot % 12} ${tot % 12 === 1 ? 'mês' : 'meses'}` : ''}` : `${tot} ${tot === 1 ? 'mês' : 'meses'}`;
  return basDet('Sua sequência', `<section class="bas-sqx" data-act="bas-sq-astro"><span class="bas-sqx-parts" aria-hidden="true">${parts}</span>
      <div class="bas-sqx-astro bas-jx ${nv}${n > 0 ? ' aceso' : ''}"><span class="bas-jx-raios" aria-hidden="true"></span><svg class="bas-jx-g" viewBox="0 0 100 100" aria-hidden="true">${basEstrela(nv, 'hero')}</svg>
        ${[0, 1, 2, 3].map((k) => `<i class="bas-jx-sp" style="--i:${k}" aria-hidden="true"></i>`).join('')}</div>
      <b class="bas-jx-n" data-sq-conta="${n}">${n}</b><b class="bas-sqx-t">${n === 1 ? 'mês de sequência' : 'meses de sequência'}</b><small class="bas-jx-nv">${nv === 'base' ? 'Estrela inicial' : `Estrela ${({ bronze: 'de bronze', prata: 'de prata', ouro: 'de ouro', platina: 'de platina', diamante: 'de diamante' })[nv]}`}</small><p class="bas-sqx-s">${status}</p>
      ${prox ? `<div class="bas-sqx-prox"><span>Próximo brasão: <b>${esc(prox[1])}</b></span><span class="bas-sqx-pb"><i style="width:${(prog * 100).toFixed(1)}%"></i></span><small>${prox[0] - n} ${prox[0] - n === 1 ? 'mês' : 'meses'} para chegar</small></div>` : '<div class="bas-sqx-prox"><span>Você conquistou todos os brasões. Lenda!</span></div>'}
      ${!Q.contaHoje && corrente && temRecurso('aporte_simples') ? `<button class="bas-dp-bt bas-sqx-bt" ${basIrInv()}>Investir agora</button>` : ''}</section>
    <div class="bas-sq-ks"><span><small>No ${esc(CFG.marca || 'app')} há</small><b>${temp}</b><em>desde ${desde}</em></span><span><small>Meses com aporte</small><b>${com} de ${tot}</b><em>${pct(com / tot)} de constância</em></span>
      <span><small>Recorde</small><b>${Q.maior} ${Q.maior === 1 ? 'mês' : 'meses'}</b><em>${Q.maior > n ? `faltam ${Q.maior - n} para igualar` : n > 0 ? 'é a sequência de agora' : 'comece hoje'}</em></span></div>
    ${basSecao('Sua galáxia', `<span class="bas-gx-h"><small class="bas-raio-t">${galaxia.length} ${galaxia.length === 1 ? 'constelação' : 'constelações'}</small>${basRecolhe('bas-gx', 'a galáxia')}</span>`, basRecolheW('bas-gx', `<div class="card bas-sq-fila" style="--jx-c:${(BAS_GEMAS[nv] || BAS_GEMAS.base)[3]}"><small class="bas-tj-t">Sua constelação</small>${fila}<p class="bas-sq-fila-r" aria-live="polite">Toque numa estrela</p></div><div class="bas-gx">${galaxia.map((g, k) => `<button class="bas-gx-c on" ${basIr('constelacao', { id: k })} style="--i:${k}">${basCeuSvg(g, nv, 'g' + k, true)}<b>${esc(g.c.n)}</b><small>${g.meus[0] ? `${MES[g.meus[0].mes].slice(0, 3)}/${String(g.meus[0].ano).slice(2)} a ${MES[g.meus[g.meus.length - 1].mes].slice(0, 3)}/${String(g.meus[g.meus.length - 1].ano).slice(2)}` : ''}</small></button>`).join('')}
      <button class="bas-gx-c prox" ${basIr('constelacao', { id: galaxia.length })}>${basCeuSvg({ c: A.c, acesas: A.acesas }, nv, 'gp', true)}<b>${esc(A.c.n)}</b><small>${A.c.e.length - A.acesas} ${A.c.e.length - A.acesas === 1 ? 'estrela' : 'estrelas'} para completar</small></button></div>`))}
    ${basSecao('Escudos', `<small class="bas-raio-t">${BAS_SEQ_MARCOS.filter((m) => Q.maior >= m[0]).length} de ${BAS_SEQ_MARCOS.length}</small>`, `<div class="bas-esc">${BAS_SEQ_MARCOS.map(([q, nm, , nvM], k) => { const on = Q.maior >= q; const nv = nvM;
      return on ? `<button class="bas-esc-c bas-br on ${nv}" ${basIr('conquista', { id: q })} style="--i:${k}">${basBrasao(q, nv, true)}<b>${esc(nm)}</b><small>${cap(nv)}</small></button>`
        : `<span class="bas-esc-c bas-br ${nv}" style="--i:${k}">${basBrasao(q, nv, false)}<b>${esc(nm)}</b><small>${Math.max(0, q - n)} ${q - n === 1 ? 'mês' : 'meses'} para chegar</small></span>`; }).join('')}</div>`)}
    ${basSecao('Todos os seus meses', `<span class="bas-gx-h"><small class="bas-raio-t">${com} de ${tot}</small>${basRecolhe('bas-meses', 'todos os meses')}</span>`, basRecolheW('bas-meses', basMapaMeses(meses, ult)))}`);
}
function basSequenciaHtml() {
  const { ult, Q } = basSeqDados(); const n = Q.atual; const ceu = basConstelacao(n);
  const txt = n === 0 ? (Q.maior > 0 ? `Sua maior sequência foi de ${Q.maior} ${Q.maior === 1 ? 'mês' : 'meses'}. Um aporte este mês acende a primeira estrela.` : 'Cada mês com aporte acende uma estrela. Comece este mês.')
    : `${Q.contaHoje ? 'Este mês já brilha.' : `Falta o aporte de ${MES_LONGO[ult]} para acender a próxima.`}${Q.maior > n ? ` Seu recorde: ${Q.maior} meses.` : n > 1 ? ' É o seu recorde!' : ''}`;
  return `<button class="card bas-sq${n >= 3 ? ' forte' : ''}" ${basIr('sequencia')}><span class="bas-ct">${ceu}</span>
    <span class="bas-n"><small>Sequência</small><b>${n === 0 ? 'Comece hoje' : `${n} ${n === 1 ? 'mês' : 'meses'} seguidos investindo`}</b><small class="bas-sq-t">${txt}</small></span></button>`;
}
function basWidgetsInicio(secs) {
  const C = S.C; const j = basJan();
  // Patrimônio ano a ano: linha de verdade, ponto a ponto, com cada mês de cada ano (H.serie, a mesma da linha do tempo do SaaS);
  // cada ano numa seção separada por divisória; o dedo mostra o mês exato; tocar num ano abre os números dele
  const H = histDados(); const t = H.totais || {}; const ult = S.year === NOW_Y ? NOW_M : 11;
  // Patrimônio ano a ano: uma linha que sobe, um ponto por ano (até 5) com o valor curto, e o crescimento em percentual; com um ano só, os meses dele
  const anosH = (H.anos || []).filter((l) => l.preenchido).slice(-5); const porAno = anosH.length > 1;
  // só anos: com um ano só, o começo dele (o fim do ano anterior) e agora
  const ptsH = porAno ? anosH.map((l) => ({ k: String(l.ano), v: l.patrimonioFim })) : [{ k: String(S.year - 1), v: +C.patrimonioBase || 0 }, { k: String(S.year), v: C.patrimonio[ult] }];
  const b0 = +C.patrimonioBase || 0; const pct1 = b0 > 0 ? (C.patrimonio[ult] - b0) / b0 : null;
  const WH = 320; const HH = 110; const vsH = ptsH.map((q) => q.v); const mnH = Math.min(...vsH); const mxH = Math.max(...vsH); const foH = (mxH - mnH) * 0.2 || mxH * 0.05 || 1;
  const PH = ptsH.map((q, k) => [ptsH.length > 1 ? 18 + (k / (ptsH.length - 1)) * (WH - 36) : WH / 2, HH - 6 - ((q.v - (mnH - foH)) / ((mxH + foH) - (mnH - foH))) * (HH - 30)]);
  const dH = PH.length > 1 ? basCurva(PH) : ''; const xH = (q) => ((q[0] / WH) * 100).toFixed(2); const upH = (t.crescimento || 0) >= 0;
  const subH = porAno && (t.crescimentoPct != null || t.crescimento) ? `<em class="bas-ph-c${upH ? '' : ' neg'}">${upH ? '↑' : '↓'} ${t.crescimentoPct != null ? pct(Math.abs(t.crescimentoPct)) : tickFmt(Math.abs(t.crescimento))}</em>desde ${anosH[0].ano}` : pct1 != null && Math.abs(pct1) >= 0.0005 ? `<em class="bas-ph-c${pct1 >= 0 ? '' : ' neg'}">${pct1 >= 0 ? '↑' : '↓'} ${pct(Math.abs(pct1))}</em>em ${S.year}` : `em ${S.year}`;
  secs.historico = `<button class="card bas-w-ph" ${basIr('historico')} aria-label="Patrimônio ano a ano. Ver o histórico completo">
    <span class="bas-ph-h"><span class="bas-ph-t"><b>Patrimônio ano a ano</b><small>${subH}</small></span><span class="bas-ph-ir" aria-hidden="true">${I.chev}</span></span>
    <span class="bas-ph-g" aria-hidden="true"><svg viewBox="0 0 ${WH} ${HH}" preserveAspectRatio="none"><defs><linearGradient id="bas-ph-gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></linearGradient><linearGradient id="bas-ph-lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="l0"/><stop offset="1" class="l1"/></linearGradient></defs>
      ${dH ? `<path class="bas-ph-a" d="${dH} L${PH[PH.length - 1][0].toFixed(1)} ${HH} L${PH[0][0].toFixed(1)} ${HH} Z" fill="url(#bas-ph-gr)"/><path class="bas-ph-l" d="${dH}" stroke="url(#bas-ph-lg)"/>` : ''}</svg>
      ${PH.map((q, k) => `<i class="bas-ph-d${k === PH.length - 1 ? ' fim' : ''}${k === 0 && PH.length > 1 ? ' ini' : ''}" style="left:${xH(q)}%;top:${((q[1] / HH) * 100).toFixed(2)}%"><b>${tickFmt(ptsH[k].v)}</b></i>`).join('')}</span>
    <span class="bas-ph-x" aria-hidden="true">${PH.map((q, k) => `<span class="${k === PH.length - 1 ? 'on' : ''}" style="left:${xH(q)}%">${ptsH[k].k}</span>`).join('')}</span></button>`;
  // Seu ano: a sobra de cada mês numa fileira de 12 cápsulas de luz (verde quando sobra, vermelho quando falta; os meses que vêm, apagados)
  // Resumo do mês: um story em miniatura, inclinado e brilhando, pronto para compartilhar
  const mR = S.mes; const Dr = E.disponivelAporte({ C, mes: mR, metaMes: C.metaAporteMes }); const topR = Math.max(1, C.receita[mR], C.despesas[mR], Dr.aportado); const Cr = C;
  secs.resumo = `<div class="card bas-w-res"><div class="bas-w-res-t"><small>Retrospectiva de ${MES_LONGO[mR]}</small><b>Seu mês num story</b><span>Reveja como foi o mês e, no final, compartilhe a imagem.</span>
      <span class="bas-w-res-bts"><button class="bas-sn-bt prim" ${basIr('retro', { id: mR })}>${I_PLAY}Ver retrospectiva</button></span></div>
    <button class="bas-w-res-s" ${basIr('retro', { id: mR })} aria-label="Ver a retrospectiva de ${MES_LONGO[mR]}"><img class="bas-w-res-m" src="assets/img/icon-192.png" alt="" aria-hidden="true"><small>${cap(MES_LONGO[mR])}</small><b>${Cr.receita[mR] > 0 ? pct(Math.max(0, Cr.investAlocado[mR] / Cr.receita[mR])) : brl0(Cr.investAlocado[mR])}</b><em>${Cr.receita[mR] > 0 ? 'ficou com você' : 'sobraram'}</em>
      <span class="bas-w-res-l" aria-hidden="true">${[['pos', C.receita[mR]], ['', C.despesas[mR]], ['acc', Dr.aportado]].map(([c, v]) => `<i class="${c}" style="--w:${Math.max(6, (v / topR) * 100).toFixed(0)}%"></i>`).join('')}</span></button></div>`;
  // o que o assistente notou: o aviso mais importante ainda não lido
  const av = (typeof notifLista === 'function' ? notifLista() : []).filter((n) => !n.lida); const ordem = { critico: 0, alerta: 1, info: 2 }; av.sort((a, b) => (ordem[a.nivel] ?? 3) - (ordem[b.nivel] ?? 3)); const n = av[0];
  secs.aviso = `<button class="card bas-w-aviso ${n ? esc(n.nivel || '') : 'ok'}" data-act="bas-ia-avisos"><span class="bas-w-aviso-ic" aria-hidden="true">${IA_ICONE}</span>${basNome(n ? esc(n.titulo || '') : 'Tudo em dia', n ? esc(n.texto || '') : 'O assistente não viu nada que precise de você agora.')}${av.length > 1 ? `<em>+${av.length - 1}</em>` : I.chev}</button>`;
  // ritmo do mês: o acumulado dia a dia, a linha do limite e onde o mês deve fechar
  const m = j.ate; const G = basAnalise(m); const R = G.ritmo;
  if (R) { const orc = C.orcamento[m]; const topo = Math.max(1, orc || 0, R.projecao || 0, ...R.acum); const W = 300; const Hh = 90; const xs = (d) => (d / Math.max(1, R.dias - 1)) * W; const ys = (v) => Hh - 6 - (v / topo) * (Hh - 14);
    const ate = R.diaAtual ? R.acum.slice(0, R.diaAtual) : R.acum; const linha = ate.map((v, d) => `${d ? 'L' : 'M'}${xs(d).toFixed(1)} ${ys(v).toFixed(1)}`).join(' ');
    const proj = R.diaAtual && R.projecao != null ? `<line class="bas-w-ritmo-p" x1="${xs(R.diaAtual - 1).toFixed(1)}" y1="${ys(ate[ate.length - 1]).toFixed(1)}" x2="${W}" y2="${ys(R.projecao).toFixed(1)}"/>` : '';
    const lim = orc > 0 ? `<line class="bas-w-ritmo-l" x1="0" x2="${W}" y1="${ys(orc).toFixed(1)}" y2="${ys(orc).toFixed(1)}"/>` : '';
    const passa = orc > 0 && R.projecao != null && R.projecao > orc;
    secs.ritmo = `<button class="card bas-w-ritmo${passa ? ' passa' : ''}" data-act="bas-aba" data-v="gastos"><span class="bas-ch"><b class="bas-h2">Ritmo de ${MES_LONGO[m]}</b>${R.cabeDia != null ? `<small>Cabem ${brl0(R.cabeDia)} por dia</small>` : ''}</span>
      <svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true">${lim}<path class="bas-w-ritmo-a" d="${linha} L${xs(ate.length - 1).toFixed(1)} ${Hh} L0 ${Hh} Z"/><path class="bas-w-ritmo-v" d="${linha}"/>${proj}</svg>
      <span class="bas-p bas-p0">${R.projecao != null ? `No ritmo de hoje, ${MES_LONGO[m]} fecha em <b>${brl0(R.projecao)}</b>${orc > 0 ? (passa ? `, <b class="neg">${brl0(R.projecao - orc)} acima</b> do limite.` : `, dentro do limite de ${brl0(orc)}.`) : '.'}` : `Gastou ${brl0(G.total)} em ${MES_LONGO[m]}.`}</span></button>`; }
  // calendário do mês: cada dia com a cor do quanto saiu (toque mostra o valor)
  if (R) { const dia = R.acum.map((v, d) => r2Bas(v - (d ? R.acum[d - 1] : 0))); const mxD = Math.max(1, ...dia); const ini = new Date(S.year, m, 1).getDay();
    secs.calendario = basCard(`<div class="bas-ch"><h2 class="bas-h2">${cap(MES_LONGO[m])} dia a dia</h2><small class="bas-cal-sel" aria-live="polite">Toque num dia</small></div>
      <div class="bas-cal">${BAS_SEM.map((s) => `<span class="bas-cal-s">${s[0]}</span>`).join('')}${'<span></span>'.repeat(ini)}${dia.map((v, d) => `<button class="bas-cal-d${R.diaAtual === d + 1 ? ' hoje' : ''}${R.diaAtual && d + 1 > R.diaAtual ? ' fut' : ''}" style="--a:${v > 0 ? (0.18 + 0.82 * Math.sqrt(v / mxD)).toFixed(2) : 0}" data-act="bas-dia" data-r="${d + 1} de ${MES_LONGO[m]}: ${esc(v > 0 ? brl(v) : 'sem gastos')}">${d + 1}</button>`).join('')}</div>
      <div class="bas-cal-leg" aria-hidden="true"><small>Menos</small>${[0.18, 0.45, 0.72, 1].map((a) => `<i style="--a:${a}"></i>`).join('')}<small>Mais</small></div>`, 'bas-w-cal'); }
  // em que dia da semana mais gasta (no período)
  const Gp = j.n === 1 ? G : basAnalise(-1); const sem = Gp.semana || []; const mxS = Math.max(1, ...sem); const top = sem.indexOf(Math.max(...sem));
  if (sem.some((v) => v > 0)) secs.semana = basCard(`<div class="bas-ch"><h2 class="bas-h2">Dia que mais gasta</h2><small>${BAS_SEM[top]}</small></div><div class="bas-w-sem">${sem.map((v, i) => `<span class="${i === top ? 'on' : ''}" style="--h:${Math.max(4, (v / mxS) * 100).toFixed(1)}%"><i></i><b>${BAS_SEM[i][0]}</b></span>`).join('')}</div>`);
  // o maior gasto do período
  const maior = basLancJan().filter((l) => l.valor > 0).sort((a, b) => b.valor - a.valor)[0];
  if (maior) secs.maior = `<button class="card bas-w-maior" ${basIr('gasto-ver', { id: maior.id })}><small class="bas-k">Maior gasto ${esc(basJanFrase())}</small><b class="bas-big md">${basCent(maior.valor)}</b><span class="bas-p bas-p0">${esc(maior.desc || maior.area)} · ${esc(maior.area)}</span></button>`;
}
const r2Bas = (v) => Math.round((+v || 0) * 100) / 100;
// Meus sonhos: escolher o principal tocando no carrossel; o palco mostra o principal; os detalhes ficam num toque
// ===== Sonhos, refeitos (pedido do Nathan, referências de apps de bolsos e do fluxo de criação do Believe) =====
// arte do sonho: a miniatura do objeto 3D (desenhada uma vez, objMiniLigar) sobre um degradê; sem WebGL fica o ícone
const basSnPct = (g) => (Math.max(0, Math.min(1, +g.progresso || 0)) * 100).toFixed(1);
const basSnArte = (g, i, cls) => `<span class="bas-sn2-arte${cls ? ' ' + cls : ''}" aria-hidden="true"><span class="bas-sn2-ic">${objIcone(g, i || 0)}</span><img alt="" data-o3="${esc(obj3dDe(g))}" hidden></span>`;
function basTelaSonhos() {
  const A = objAnalise(); const g = objFoco(A); const L = A.itens;
  const topo = g ? `<div class="bas-sn2-hero"><span class="bas-sn2-flut">${basSnArte(g, 0, 'hero')}</span>
      <small class="bas-pv2-k">Seu sonho principal</small><b class="bas-sn2-hn">${esc(objNomeDe(g))}</b>
      <p class="bas-sn2-hv">${brl0(g.saldo)} <span>de ${brl0(g.valor)}</span></p>
      <span class="bas-sn2-hb"><i style="width:${basSnPct(g)}%"></i></span><small class="bas-sn2-hp">${pct(g.progresso)}${g.ano ? ` · até ${g.ano}` : ''}</small></div>`
    : `<div class="bas-sn2-hero vazio"><span class="bas-sn2-flut">${basSnArte({ tipo: 'outro' }, 0, 'hero')}</span><b class="bas-sn2-hn">Qual é o seu sonho?</b><p class="bas-sn2-hv"><span>Dê um nome a ele e veja quanto falta, mês a mês.</span></p></div>`;
  const tile = (x, i) => `<button class="bas-sn2-t${g && x.id === g.id ? ' on' : ''}" ${basIr('sonho-det', { id: x.id })} style="--i:${i}">${basSnArte(x, i)}${g && x.id === g.id ? '<em class="bas-sn2-pri">Principal</em>' : ''}<b>${esc(objNomeDe(x))}</b><small>${brl0(x.saldo)} · ${pct(x.progresso)}</small><i class="bas-sn2-pb"><i style="width:${basSnPct(x)}%"></i></i></button>`;
  const folha = `<div class="bas-sn2-g">${L.map(tile).join('')}<button class="bas-sn2-t novo" ${basIr('sonho-novo')} style="--i:${L.length}"><span class="bas-sn2-arte novo" aria-hidden="true">${I.plus}</span><b>Novo sonho</b><small>Leva menos de um minuto</small></button></div>`;
  return basPgAzul('bas-pg-sn2', 'Meus sonhos', topo, folha);
}
const BAS_SN_COR = { concluido: 'ok', 'no-prazo': 'ok', atrasado: 'atencao', fora: 'baixo', 'sem-prazo': '', 'sem-divisao': 'atencao', 'sem-valor': '' };
function basTelaSonhoDet(o) {
  const A = objAnalise(); const g = A.itens.find((x) => x.id === o.id); if (!g) return basSumiu(); const principal = g.id === S.profile.objetivoFoco; const tipo = obj3dDe(g);
  const topo = `<div class="bas-sn2-palco"><div class="bas-o3 bas-sn2-o3" id="bas-o3" data-tipo="${esc(tipo)}">${obj3dHtml(tipo)}<span class="bas-o3-ic" aria-hidden="true">${objIcone(g, 0)}</span></div></div>
    <small class="bas-pv2-k">${principal ? 'Seu sonho principal' : 'Guardado para ele'}</small><b class="bas-pv2-t">${basCent(g.saldo)}</b>
    <p class="bas-pv2-var"><span class="bas-ev-pct">${pct(g.progresso)}</span><span>de ${brl0(g.valor)}</span></p>`;
  const ma = (p) => (p ? `${MES[p.mes].toLowerCase()}/${p.ano}` : '');
  const cor = BAS_SN_COR[g.status] || ''; const falta = Math.max(0, g.falta || 0);
  const dica = g.status === 'concluido' ? 'Você já chegou lá. Parabéns!'
    : g.status === 'atrasado' && g.necessario != null ? `Guardando <b>${brl0(g.necessario)}</b> por mês${g.necessario > g.aporte ? `, ${brl0(g.necessario - g.aporte)} a mais do que hoje,` : ''} você chega até ${g.ano}.`
    : g.status === 'no-prazo' ? `Guardando <b>${brl0(g.aporte)}</b> por mês você chega a tempo. Continue assim.`
    : esc(objFrase(g));
  const folha = `<div class="card bas-sdt"><small class="bas-k">Falta para chegar</small><b class="bas-sdt-v">${basCent(falta)}</b>
      <span class="bas-sdt-bar" aria-hidden="true"><i style="width:${basSnPct(g)}%"></i></span>
      <span class="bas-sdt-bl"><span>Guardado<b>${brl0(g.saldo)}</b></span><span>Meta<b>${brl0(g.valor)}</b></span></span></div>
    <div class="card bas-sdt"><div class="bas-sdt-h"><small class="bas-k">Quando você chega lá</small>${g.status !== 'sem-valor' ? `<span class="bas-sn-st ${cor}">${esc(cap(BAS_OBJ_ST[g.status] || ''))}</span>` : ''}</div>
      <div class="bas-sdt-2"><span><small>Você quer</small><b>${g.ano || 'Sem prazo'}</b></span><span><small>No ritmo de hoje</small><b class="${cor}">${g.status === 'concluido' ? 'Já chegou' : ma(g.previsto) || 'Sem previsão'}</b></span></div>
      <p class="bas-sdt-dica">${dica}</p></div>
    <div class="bas-sn2-acs"><button class="btn primary lg" ${basIrInv()}>${I.plus}Guardar dinheiro</button></div>
    ${basPago() && g.status !== 'concluido' ? `<button class="card bas-sdt-sim" ${basIr('simular', { id: g.id })}><span class="bas-sdt-sim-i" aria-hidden="true">${I_REC}</span><span><b>E se eu guardar mais?</b><small>Veja quando você chega com outro valor por mês</small></span>${I.chev}</button>` : ''}
    <div class="bas-sn2-lks">${principal ? '' : `<button class="lnk strong" data-act="bas-foco" data-id="${esc(g.id)}" data-volta="1">Tornar o principal</button>`}<button class="lnk strong" ${basIr('sonho-ed', { id: g.id })}>Editar sonho</button></div>`;
  return basPgAzul('bas-pg-sn2d', esc(objNomeDe(g)), topo, folha);
}
// Editar um sonho numa tela só: tipo, nome, valor, prazo, principal e excluir, tudo à vista (antes era o fluxo de criação de novo)
function basTelaSonhoEd(o) {
  const g = objLista().find((x) => x.id === o.id); if (!g) return basSumiu();
  if (!S.basSn2 || S.basSn2.ed !== g.id || !o.ini) { o.ini = 1; S.basSn2 = { p: 2, ed: g.id, tipo: g.tipo || 'outro', nome: g.nome || '', valor: g.valor ? (g.valor % 1 ? nf.format(g.valor) : basInt(g.valor)) : '', ano: g.ano || null }; }
  const st = S.basSn2; const nomeT = (t) => (OBJETIVOS.find((x) => x[0] === t) || [, 'Sonho'])[1]; const principal = g.id === S.profile.objetivoFoco; const n = st.ano ? st.ano - NOW_Y : 0;
  const topo = `<div class="bas-sn2-hero bas-sne-hero"><span class="bas-sn2-flut">${basSnArte({ tipo: st.tipo }, 0, 'hero')}</span><small class="bas-pv2-k">Editando</small><b class="bas-sn2-hn">${esc(st.nome || nomeT(st.tipo))}</b></div>`;
  const folha = `<section class="bas-sne-sec"><small class="bas-sne-k">Tipo</small>
      <div class="bas-sne-tipos" role="radiogroup" aria-label="Tipo de sonho">${OBJETIVOS.map(([k, nm]) => `<button type="button" class="bas-sne-tp${k === st.tipo ? ' on' : ''}" data-act="bas-sne-tipo" data-v="${k}" role="radio" aria-checked="${k === st.tipo}">${basSnArte({ tipo: k }, 0, 'ri')}<span>${esc(nm)}</span></button>`).join('')}</div></section>
    <section class="card bas-sne-cx">
      <label class="bas-sne-l"><small>Nome</small><input data-sn2="nome" value="${esc(st.nome)}" placeholder="${esc(nomeT(st.tipo))}" maxlength="40" aria-label="Nome do sonho"></label>
      <label class="bas-sne-l"><small>Quanto custa</small><span class="bas-sne-rs"><em>R$</em><input data-sn2="valor" value="${esc(st.valor)}" inputmode="decimal" placeholder="0" aria-label="Quanto custa, em reais"></span></label>
      <div class="bas-sne-l"><small>Para quando</small><div class="bas-sne-pz"><button type="button" data-act="bas-sn2-ano" data-d="-1" aria-label="Um ano antes">−</button><span><b data-sn2-ano>${st.ano || 'Sem prazo'}</b><small data-sn2-anos>${st.ano ? `daqui a ${n} ${n === 1 ? 'ano' : 'anos'}` : 'você pode definir depois'}</small></span><button type="button" data-act="bas-sn2-ano" data-d="1" aria-label="Um ano depois">+</button></div>
        <button type="button" class="bas-sn2-semp bas-sne-semp${st.ano ? '' : ' on'}" data-act="bas-sn2-ano" data-v="0">Sem prazo</button></div></section>
    <section class="card bas-sne-cx">${principal ? `<div class="bas-sne-pri on"><span class="bas-sne-pi" aria-hidden="true">★</span><span><b>Seu sonho principal</b><small>Ele aparece em destaque no Início</small></span></div>`
      : `<button type="button" class="bas-sne-pri" data-act="bas-foco" data-id="${esc(g.id)}"><span class="bas-sne-pi" aria-hidden="true">☆</span><span><b>Tornar o principal</b><small>Ele passa a aparecer em destaque no Início</small></span>${I.chev}</button>`}</section>
    <button class="btn primary lg bas-cta bas-sne-ok" data-act="bas-sn2-criar">Salvar alterações</button>
    <button type="button" class="bas-sne-del" data-act="bas-sn2-del">Excluir sonho</button>`;
  return basPgAzul('bas-pg-sne', 'Editar sonho', topo, folha);
}
// Criar um sonho, no jeito do fluxo do Believe: roda curva para o tipo, nome, valor e prazo; o cartão se forma em pontinhos e nasce com confete
const BAS_SN2_PASSOS = 3;
function basTelaSonhoNovo(o) {
  if (!o.ini) { o.ini = 1; const ge = o.edit && objLista().find((x) => x.id === o.edit);
    S.basSn2 = ge ? { p: 0, ed: ge.id, tipo: ge.tipo || 'outro', nome: ge.nome || '', valor: ge.valor ? (ge.valor % 1 ? nf.format(ge.valor) : basInt(ge.valor)) : '', ano: ge.ano || null }
      : { p: 0, tipo: 'viagem', nome: '', valor: '', ano: NOW_Y + 3 }; }
  const st = S.basSn2; const tipos = OBJETIVOS; const nomeT = (t) => (tipos.find((x) => x[0] === t) || [, 'Sonho'])[1];
  const barra = st.p < BAS_SN2_PASSOS ? `<div class="bas-sn2-nh"><button class="bas-gp-x" ${st.p ? `data-act="bas-sn2-ir" data-p="${st.p - 1}"` : 'data-act="bas-voltar"'} aria-label="${st.p ? 'Voltar' : 'Fechar'}">${st.p ? I_VOLTA : I.x}</button><span class="bas-sn2-prog" aria-label="Passo ${st.p + 1} de ${BAS_SN2_PASSOS}">${[0, 1, 2].map((k) => `<i class="${k <= st.p ? 'on' : ''}"></i>`).join('')}</span><span class="bas-sn2-nh-v" aria-hidden="true"></span></div>` : '';
  let corpo = '';
  if (st.p === 0) corpo = `<div class="bas-sn2-passo"><span class="bas-sn2-cx" aria-hidden="true">${basSnArte({ tipo: st.tipo }, 0, 'cx')}</span><small class="bas-sn2-q">${st.ed ? 'Editar sonho' : 'O que você quer conquistar?'}</small><h2 class="bas-sn2-tt" data-sn2-nome>${esc(nomeT(st.tipo))}</h2>
      <div class="bas-sn2-roda" role="listbox" tabindex="0" aria-label="Tipo de sonho. Deslize ou use as setas.">${tipos.map(([k, n], i) => `<button class="bas-sn2-ri${k === st.tipo ? ' on' : ''}" data-sn2-tipo="${k}" data-i="${i}" role="option" aria-selected="${k === st.tipo}" aria-label="${esc(n)}" tabindex="-1">${basSnArte({ tipo: k }, 0, 'ri')}</button>`).join('')}</div>
      <p class="bas-sn2-dica">Deslize para escolher</p></div>
    <button class="btn primary lg bas-cta bas-sn2-cta" data-act="bas-sn2-ir" data-p="1">Continuar</button>`;
  else if (st.p === 1) corpo = `<div class="bas-sn2-passo"><span class="bas-sn2-cx sobe" aria-hidden="true">${basSnArte({ tipo: st.tipo }, 0, 'cx')}</span><small class="bas-sn2-q">${esc(nomeT(st.tipo))}</small><h2 class="bas-sn2-tt">Como você chama esse sonho?</h2>
      <input class="bas-sn2-in" data-sn2="nome" value="${esc(st.nome)}" placeholder="${esc(st.tipo === 'viagem' ? 'Ex.: Viagem ao Japão' : st.tipo === 'imovel' ? 'Ex.: Apartamento novo' : st.tipo === 'carro' ? 'Ex.: Carro elétrico' : `Ex.: ${nomeT(st.tipo)}`)}" maxlength="40" enterkeyhint="next" aria-label="Nome do sonho"><p class="bas-sn2-dica">Opcional. Sem nome, ele se chama ${esc(nomeT(st.tipo))}.</p></div>
    <button class="btn primary lg bas-cta bas-sn2-cta" data-act="bas-sn2-ir" data-p="2">Continuar</button>`;
  else if (st.p === 2) corpo = `<div class="bas-sn2-passo"><small class="bas-sn2-q">${esc(st.nome || nomeT(st.tipo))}</small><h2 class="bas-sn2-tt">Quanto ele custa?</h2>
      <label class="bas-sn2-val"><small>R$</small><input data-sn2="valor" value="${esc(st.valor)}" inputmode="decimal" placeholder="0" aria-label="Quanto custa, em reais"></label>
      <small class="bas-sn2-q2">Para quando?</small>
      <div class="bas-sn2-prazo" data-sn2-prazo><button type="button" data-act="bas-sn2-ano" data-d="-1" aria-label="Um ano antes">−</button><span><b data-sn2-ano>${st.ano || 'Sem prazo'}</b><small data-sn2-anos>${st.ano ? `daqui a ${st.ano - NOW_Y} ${st.ano - NOW_Y === 1 ? 'ano' : 'anos'}` : 'você pode definir depois'}</small></span><button type="button" data-act="bas-sn2-ano" data-d="1" aria-label="Um ano depois">+</button></div>
      <button type="button" class="bas-sn2-semp${st.ano ? '' : ' on'}" data-act="bas-sn2-ano" data-v="0">Sem prazo</button></div>
    <div class="bas-sn2-cta"><button class="btn primary lg bas-cta" data-act="bas-sn2-criar">${st.ed ? 'Salvar alterações' : 'Criar meu sonho'}</button>${st.ed ? '<button class="lnk bas-sn2-del" data-act="bas-sn2-del">Excluir sonho</button>' : ''}</div>`;
  else if (st.p === 3) corpo = `<div class="bas-sn2-forma" aria-live="polite"><small class="bas-sn2-q">Criando seu sonho</small><div class="bas-sn2-pontos" aria-hidden="true">${Array.from({ length: 48 }, (_, k) => `<i style="--k:${k};--x:${(k % 8)};--y:${Math.floor(k / 8)}"></i>`).join('')}</div><p class="bas-sn2-dica">Organizando o plano mês a mês…</p></div>`;
  else { const g = objAnalise().itens.find((x) => x.id === st.id) || { tipo: st.tipo, nome: st.nome, valor: parseReais(st.valor) || 0, ano: st.ano, progresso: 0 };
    corpo = `<div class="bas-sn2-fim"><small class="bas-sn2-q">Sonho criado</small><div class="bas-sn2-conf" aria-hidden="true">${Array.from({ length: 26 }, (_, k) => `<i style="--k:${k};--a:${(k * 137) % 360}deg;--d:${70 + ((k * 53) % 90)}px;--c:${['#FFC94D', '#5AC8FA', '#30D158', '#FF6B81', '#B48CFF'][k % 5]}"></i>`).join('')}</div>
      <article class="bas-sn2-cartao">${basSnArte(g, 0, 'cart')}<small>Eu sonho com</small><b>${esc(objNomeDe(g))}</b><span class="bas-sn2-cl">${I.chev}<span>${brl0(g.valor)}${g.ano ? ` · até ${g.ano}` : ''}</span></span><span class="bas-sn2-cl">${I.inv}<span>${pct(g.progresso || 0)} guardado</span></span></article>
      <p class="bas-sn2-dica">A partir de agora, cada aporte aproxima você dele.</p></div>
    <div class="bas-sn2-fbts"><button class="btn primary lg bas-cta" data-act="bas-sn2-ver" data-id="${esc(st.id || '')}">Ver meu sonho</button><button class="btn lg bas-cta" data-act="bas-voltar">Voltar</button></div>`; }
  return `<div class="bas-pg bas-pg-sn2n" data-p="${st.p}">${barra}${corpo}</div>`;
}
// ===== Conversa por voz com o Cifrão (referência: telas de "coach" por voz) =====
// ouve pelo reconhecimento de fala do aparelho, responde com a mesma IA da conversa escrita (iaEnviar) e fala com a voz em português do iPhone,
// mais leve e amigável; as palavras acendem enquanto ele fala e os valores viram fichas, com o primeiro em destaque contando até o número
const I_MIC = ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>');
const I_TECLADO = ic('<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>');
const I_PAUSA = ic('<path d="M9 6.5v11M15 6.5v11"/>');
function basTelaVoz() {
  const nome = String(S.profile.apelido || S.profile.nome || '').trim().split(' ')[0];
  return `<div class="bas-voz" data-est="parado">
    <div class="bas-voz-painel" aria-hidden="true"><span class="bas-voz-trama"></span><span class="bas-voz-luz"></span><span class="bas-voz-part">${Array.from({ length: 18 }, (_, k) => `<i style="--x:${(k * 37) % 100}%;--s:${1 + (k % 3)}px;--d:${7 + (k * 13) % 9}s;--k:${-((k * 7) % 11)}s"></i>`).join('')}</span></div>
    <header class="bas-voz-h"><button class="bas-voz-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><b>Cifrão</b><button class="bas-voz-b" data-voz-troca aria-label="Trocar a voz do Cifrão">${I_IA_ASTER}</button></header>
    <div class="bas-voz-c" aria-live="polite"><div class="bas-voz-num" data-voz-num hidden></div>
      <p class="bas-voz-t" data-voz-t><span class="oi">Olá${nome ? `, ${esc(nome)}` : ''}</span><span class="cm">Como posso ajudar?</span></p><div class="bas-voz-cta" data-voz-cta></div><p class="bas-voz-dica" data-voz-dica>Toque no Cifrão e fale</p></div>
    <div class="bas-voz-pe">
      <button class="bas-voz-lado" data-act="bas-voltar" aria-label="Escrever em vez de falar">${I_TECLADO}</button>
      <button class="bas-voz-orb" data-voz-orb aria-label="Falar com o Cifrão"><span class="bas-voz-ondas" aria-hidden="true"><i></i><i></i><i></i></span><span class="cifrao" data-sem-giro></span></button>
      <button class="bas-voz-lado" data-voz-pausa aria-label="Parar a fala" disabled>${I_PAUSA}</button></div></div>`;
}
let basVozAtivo = null; // reconhecimento em andamento (para parar ao sair da tela)
function basVozParar() { try { if (basVozAtivo) basVozAtivo.abort(); } catch (e) { /* já parado */ } basVozAtivo = null; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* sem voz */ } }
function basVozVozes() { try { return (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter((v) => /^pt[-_]BR/i.test(v.lang)); } catch (e) { return []; } }
function basVozEscolhida() { const vs = basVozVozes(); const pref = S.profile.prefs && S.profile.prefs.vozCifrao;
  return vs.find((v) => pref && v.name === pref) || vs.find((v) => /luciana/i.test(v.name)) || vs.find((v) => /felipe/i.test(v.name)) || vs.find((v) => /google/i.test(v.name)) || vs[0] || null; }
function basVozLigar() {
  const w = document.querySelector('.bas-voz'); if (!w) { if (basVozAtivo) basVozParar(); return; } if (w.dataset.lig) return; w.dataset.lig = '1';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; const fala = window.speechSynthesis;
  const q$ = (x) => w.querySelector(x); const t = q$('[data-voz-t]'); const dica = q$('[data-voz-dica]'); const num = q$('[data-voz-num]'); const cta = q$('[data-voz-cta]'); const orb = q$('[data-voz-orb]'); const pausa = q$('[data-voz-pausa]');
  const cif = (g) => { const h = orb.querySelector('.cifrao'); if (h && h.cifrao && g) h.cifrao.tocar(g); };
  const est = (e, d) => { w.dataset.est = e; if (d != null) dica.textContent = d; };
  let ouvindo = false; let fim = '';
  // a resposta em palavras (que acendem enquanto ele fala); dinheiro e porcentagem viram fichas; o primeiro valor em destaque, contando
  const mostra = (txt) => { let pos = 0; let html = '';
    txt.split(/(R\$\s?[\d.]+(?:,\d{1,2})?|-?\d+(?:,\d+)?\s?%)/).forEach((p, k) => { if (!p) return;
      if (k % 2) html += `<span class="bas-voz-ficha w" data-c="${pos}">${esc(p)}</span>`;
      else p.split(/(\s+)/).forEach((x) => { if (!x) return; html += /^\s+$/.test(x) ? x : `<span class="w" data-c="${pos}">${esc(x)}</span>`; pos += x.length; });
      if (k % 2) pos += p.length; });
    t.innerHTML = html;
    const m = txt.match(/R\$\s?[\d.]+(?:,\d{1,2})?/); num.hidden = !m;
    if (m) { const alvo = parseReais(m[0].replace(/R\$\s?/, '')) || 0; num.innerHTML = '<b></b>'; const b = num.firstChild; const t0 = performance.now();
      const pinta = (v) => { const tx = brl(v); const m0 = tx.match(/^(R\$\s?)(.*?)(,\d+)?$/); b.innerHTML = m0 ? `<span class="rs">R$</span>${esc(m0[2])}<span class="ct">${esc(m0[3] || '')}</span>` : esc(tx); };
      const passo = (n) => { const k = Math.min(1, (n - t0) / 900); pinta(alvo * (1 - Math.pow(1 - k, 3))); if (k < 1 && b.isConnected) requestAnimationFrame(passo); }; requestAnimationFrame(passo); } };
  const falar = (txt) => {
    const ws = [...t.querySelectorAll('.w')]; const acende = (c) => ws.forEach((x) => x.classList.toggle('lido', +x.dataset.c <= c));
    if (!fala) { acende(1e9); est('parado', 'Toque no Cifrão para continuar'); return; }
    fala.cancel(); const u = new SpeechSynthesisUtterance(oculto() ? txt.replace(/R\$\s?•+/g, 'um valor escondido') : txt); const v = basVozEscolhida(); if (v) u.voice = v; u.lang = 'pt-BR'; u.rate = 1.03; u.pitch = 1.12;
    let viuLimite = false; let tm = 0; let n = 0;
    u.onboundary = (e) => { viuLimite = true; acende(e.charIndex); if (++n % 6 === 0) cif('sim'); };
    u.onstart = () => { est('falando', 'Falando…'); pausa.disabled = false;
      // sem eventos de palavra (alguns aparelhos), as palavras acendem num ritmo estimado
      setTimeout(() => { if (viuLimite) return; let i = 0; tm = setInterval(() => { if (i >= ws.length) { clearInterval(tm); return; } ws[i++].classList.add('lido'); }, 300); }, 400); };
    u.onend = u.onerror = () => { clearInterval(tm); acende(1e9); pausa.disabled = true; if (w.dataset.est === 'falando') est('parado', 'Toque no Cifrão para continuar'); };
    fala.speak(u); };
  const pergunta = (q) => { est('pensando', 'Pensando…'); t.innerHTML = `<span class="eu">${esc(q)}</span>`; cta.innerHTML = ''; num.hidden = true; cif('pensando');
    const st = iaEstado(); if (st.pend) { est('parado', 'Ainda pensando na anterior. Tente de novo.'); return; } iaEnviar(q); const t0 = Date.now();
    const espera = () => { if (!w.isConnected) return; if (st.pend && Date.now() - t0 < 20000) { setTimeout(espera, 120); return; }
      const i = st.msgs.length - 1; const m = st.msgs[i]; if (!m || m.de !== 'ia') { est('parado', 'Não consegui responder. Tente de novo.'); return; }
      const tmp = document.createElement('div'); tmp.innerHTML = iaMsgHtml(m, i); const txt = (tmp.querySelector('p') ? tmp.querySelector('p').textContent : '').replace(/\s+/g, ' ').trim(); const bt = tmp.querySelector('button');
      mostra(txt); cta.innerHTML = bt ? bt.outerHTML : ''; cif('animado'); falar(txt); };
    espera(); };
  const ouvir = () => {
    if (!SR) { est('parado', 'Este aparelho não liberou a fala no navegador. Use o teclado para escrever.'); return; }
    if (fala) { try { fala.cancel(); fala.speak(new SpeechSynthesisUtterance('')); } catch (e) { /* sem voz */ } } // no iPhone a voz precisa de um toque para ser liberada
    const rec = new SR(); basVozAtivo = rec; rec.lang = 'pt-BR'; rec.interimResults = true; rec.continuous = false; fim = '';
    rec.onstart = () => { ouvindo = true; est('ouvindo', 'Estou ouvindo…'); t.innerHTML = '<span class="cm">Pode falar</span>'; num.hidden = true; cta.innerHTML = ''; cif('curioso'); basVibra(12); };
    rec.onresult = (e) => { let fin = ''; let tmp = ''; for (const r of e.results) { if (r.isFinal) fin += r[0].transcript; else tmp += r[0].transcript; } fim = (fin || tmp).trim();
      t.innerHTML = `<span class="eu">${esc(fin)}</span><span class="eu int">${esc(tmp)}</span>`; };
    rec.onerror = (e) => { ouvindo = false; basVozAtivo = null; est('parado', e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'Libere o microfone e o ditado do iPhone para este site e tente de novo.' : e.error === 'no-speech' ? 'Não ouvi nada. Toque e fale de novo.' : 'Não consegui ouvir. Toque e tente de novo.'); };
    rec.onend = () => { ouvindo = false; basVozAtivo = null; if (fim) pergunta(fim); else if (w.dataset.est === 'ouvindo') est('parado', 'Não ouvi nada. Toque e fale de novo.'); };
    try { rec.start(); } catch (e) { est('parado', 'Não consegui abrir o microfone.'); } };
  orb.addEventListener('click', () => { if (ouvindo && basVozAtivo) { basVozAtivo.stop(); return; } if (w.dataset.est === 'pensando') return; if (fala) fala.cancel(); ouvir(); });
  pausa.addEventListener('click', () => { if (fala) fala.cancel(); });
  // trocar a voz: passa pelas vozes em português do aparelho e diz uma frase de exemplo
  q$('[data-voz-troca]').addEventListener('click', () => { const vs = basVozVozes(); if (!vs.length) { est(w.dataset.est, 'Este aparelho só tem uma voz em português.'); return; }
    const at = basVozEscolhida(); const nv = vs[(vs.indexOf(at) + 1) % vs.length]; S.profile.prefs = Object.assign({}, S.profile.prefs, { vozCifrao: nv.name }); touch('profile');
    est('parado', `Voz: ${nv.name.replace(/\s*\(.*\)/, '')}`); mostra('Oi! Eu sou o Cifrão. Posso ajudar com o seu dinheiro?'); falar('Oi! Eu sou o Cifrão. Posso ajudar com o seu dinheiro?'); });
}
function basSn2Criar() {
  const st = S.basSn2; const L = objLista();
  if (st.ed) { const g = L.find((x) => x.id === st.ed); const v = parseReais(st.valor); if (!g) return; if (!(v > 0)) { toast('Informe quanto o sonho custa.'); return; }
    Object.assign(g, { tipo: st.tipo, nome: (st.nome || '').trim(), valor: E.r2(v), ano: st.ano || null }); objSalvar(); basSom('ok'); basRetorno('ok'); basFechar(); toast('Sonho atualizado.'); return; }
  if (L.length >= 12) { toast('Você chegou ao limite de 12 sonhos.'); return; }
  const v = parseReais(st.valor); if (!(v > 0)) { toast('Informe quanto o sonho custa.'); const i = document.querySelector('[data-sn2="valor"]'); if (i) i.focus(); return; }
  const alvo = Object.assign({ id: uid() }, L.length ? { modo: 'marco', pct: 0 } : { modo: 'fatia', pct: 100 }, { tipo: st.tipo, nome: (st.nome || '').trim(), valor: E.r2(v), ano: st.ano || null });
  L.push(alvo); if (L.length === 1 || !S.profile.objetivoFoco) S.profile.objetivoFoco = alvo.id; objSalvar(); st.id = alvo.id; st.p = 3; basSom('ok'); render();
}
// ligações: miniaturas 3D, a roda curva (cada item sobe numa curva e cresce no meio), campos sem redesenhar e o tempo da animação de criação
function basSn2Ligar() {
  if (document.querySelector('img[data-o3][hidden]') && typeof objMiniLigar === 'function') objMiniLigar();
  document.querySelectorAll('[data-sn2]').forEach((e) => { if (e.dataset.lig) return; e.dataset.lig = '1'; e.addEventListener('input', () => { if (S.basSn2) S.basSn2[e.dataset.sn2] = e.value; }); });
  { const tp = document.querySelector('.bas-sne-tp.on'); const fi = tp && tp.parentElement; if (fi && !fi.dataset.vis) { fi.dataset.vis = '1'; fi.scrollLeft = tp.offsetLeft - fi.clientWidth / 2 + tp.offsetWidth / 2; } } // o tipo escolhido aparece no meio da fileira
  const roda = document.querySelector('.bas-sn2-roda');
  if (roda && !roda.dataset.lig) { roda.dataset.lig = '1'; const its = [...roda.children]; const PASSO = 84; const n = its.length;
    let pos = Math.max(0, its.findIndex((b) => b.classList.contains('on'))); let alvo = pos; let vel = 0; let raf = 0; let arr = null; let ult = 0;
    const desenha = () => { its.forEach((b, i) => { const d = i - pos; const a = Math.min(Math.abs(d), 3.2);
      b.style.transform = `translate(-50%, -50%) translateX(${(d * PASSO).toFixed(1)}px) translateY(${(a * a * 7).toFixed(1)}px) rotate(${(d * 6).toFixed(1)}deg) scale(${(1.16 - a * 0.15).toFixed(3)})`;
      b.style.opacity = String(Math.max(0, 1 - a * 0.3)); b.style.zIndex = String(100 - Math.round(a * 10)); }); };
    const escolhe = (i) => { const k = its[i].dataset.sn2Tipo; if (!S.basSn2 || S.basSn2.tipo === k) return; S.basSn2.tipo = k;
      its.forEach((x, j) => { x.classList.toggle('on', j === i); x.setAttribute('aria-selected', String(j === i)); });
      const nm = document.querySelector('[data-sn2-nome]'); if (nm) nm.textContent = (OBJETIVOS.find((x) => x[0] === k) || [, ''])[1];
      const cx = document.querySelector('.bas-sn2-cx img'); const M = typeof O3_MINI !== 'undefined' && O3_MINI.get(k); if (cx && M) cx.src = M;
      const ic0 = document.querySelector('.bas-sn2-cx .bas-sn2-ic'); if (ic0) ic0.innerHTML = objIcone({ tipo: k }, 0); basVibra(6); };
    const mola = () => { const f = (alvo - pos) * 0.16; vel = vel * 0.72 + f; pos += vel; if (Math.abs(alvo - pos) < 0.002 && Math.abs(vel) < 0.002) { pos = alvo; desenha(); raf = 0; return; } desenha(); raf = requestAnimationFrame(mola); };
    const vai = (i) => { alvo = Math.max(0, Math.min(n - 1, i)); escolhe(alvo); if (!raf) raf = requestAnimationFrame(mola); };
    roda.addEventListener('pointerdown', (e) => { arr = { x: e.clientX, p: pos, t: performance.now(), mov: false }; ult = e.clientX; vel = 0; cancelAnimationFrame(raf); raf = 0; try { roda.setPointerCapture(e.pointerId); } catch (x) { /* sem captura */ } });
    roda.addEventListener('pointermove', (e) => { if (!arr) return; const dx = e.clientX - arr.x; if (Math.abs(dx) > 4) arr.mov = true;
      pos = Math.max(-0.4, Math.min(n - 0.6, arr.p - dx / PASSO)); vel = -(e.clientX - ult) / PASSO; ult = e.clientX; desenha(); const i = Math.round(Math.max(0, Math.min(n - 1, pos))); escolhe(i); });
    const solta = (e) => { if (!arr) return; const a = arr; arr = null;
      if (!a.mov) { const b = e.target.closest && e.target.closest('.bas-sn2-ri'); vai(b ? +b.dataset.i : Math.round(pos)); return; }
      vai(Math.round(pos + vel * 6)); };
    roda.addEventListener('pointerup', solta); roda.addEventListener('pointercancel', solta);
    roda.addEventListener('click', (e) => e.preventDefault());
    roda.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); vai(Math.round(alvo) + (e.key === 'ArrowRight' ? 1 : -1)); } });
    desenha(); }
  const forma = document.querySelector('.bas-pg-sn2n[data-p="3"]');
  if (forma && !forma.dataset.lig) { forma.dataset.lig = '1'; const rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => { if (S.basSn2 && S.basSn2.p === 3) { S.basSn2.p = 4; render(); if (typeof basVibra === 'function') basVibra(30); } }, rm ? 300 : 1900); }
}
// cada cartão: os gastos daquele banco no período, por categoria, e a lista
// Personalizar cartão: o cartão oficial (o de chip) inclinado no alto, os modelos em bolinhas numa coluna à esquerda
// e, ao lado, o nome, uma frase do modelo, a cor (nos modelos que aceitam) e Pronto. O cartão chega da tela anterior voando (View Transitions).
const CC_DESC = { banco: 'As cores do seu banco, com um brilho suave.', black: 'Preto profundo com reflexo diagonal, o clássico dos cartões premium.', metal: 'Aço escovado em linhas finas, frio ao toque.',
  carbono: 'Trama de fibra de carbono, esportiva e discreta.', vidro: 'Vidro fosco translúcido na cor que você escolher.', holo: 'Reflexos de arco-íris que mudam com a luz.',
  fosco: 'Preto sem brilho, sóbrio e elegante.', ouro: 'Dourado polido, para quem gosta de destaque.', platina: 'Prata clara e luminosa.', aurora: 'Grafite com uma aurora de cor por cima.' };
// Novo cartão: escolhe o banco (fichas com a logo), e o cartão inclinado no alto já mostra o banco; modelo, cor e bandeira como na edição
function basTelaCartaoNovo() {
  const livres = INSTITUICOES.filter((x) => x[0] !== 'dinheiro' && !instMinhas().includes(x[0]));
  if (!livres.length) return basDet('Novo cartão', basCard(basVazio('Todos os bancos já estão nos seus cartões.')));
  if (!livres.some((x) => x[0] === S.basCcNovo)) S.basCcNovo = livres[0][0];
  const k = S.basCcNovo;
  const bancos = `<div class="bas-ccn-bancos" role="group" aria-label="Banco do cartão">${livres.map((x) => `<button class="bas-ccn-b${x[0] === k ? ' on' : ''}" data-act="bas-ccn-banco" data-v="${esc(x[0])}" aria-pressed="${x[0] === k}">${instIcone(x[0])}<span>${esc(x[1])}</span></button>`).join('')}</div>`;
  return basTelaCartaoEstilo({ id: k, novo: bancos });
}
function basTelaCartaoEstilo(o) {
  const i = instDe(o.id); if (!i) return basSumiu(); const E0 = basCcEstilo(o.id); const nome = (m) => (CC_MODELOS.find((x) => x[0] === m) || [, m])[1];
  const bola = (m, n) => `<button class="bas-cce-m${m === E0.m ? ' on' : ''} bas-ccm" data-act="bas-cc-mod" data-id="${esc(o.id)}" data-m="${m}" aria-pressed="${m === E0.m}" aria-label="${esc(n)}"><span class="bas-cc-c bas-cc-mini" data-m="${m}" style="--cb:${E0.c};--cf:${i[3]}" aria-hidden="true"></span></button>`;
  const cores = [[i[2], `Cor do ${i[1]}`]].concat(CORES_DESTAQUE);
  return basDet(o.novo ? 'Novo cartão' : 'Personalizar cartão', `${o.novo ? `<p class="bas-ccn-k">Banco</p>${o.novo}` : ''}<div class="bas-cce-palco"><div class="bas-cce-card">${basCartaoFace(o.id).replace('class="bas-cc-c ', 'class="bas-cc-c bas-cc-prev ')}</div></div>
    <div class="bas-cce">
      <div class="bas-cce-ms" role="group" aria-label="Modelo do cartão">${CC_MODELOS.map(([m, n]) => bola(m, n)).join('')}</div>
      <div class="bas-cce-t"><h2 data-cce-n>${esc(nome(E0.m))}</h2><p data-cce-d>${esc(CC_DESC[E0.m] || '')}</p>
        <div class="bas-cce-cores${CC_COM_COR.includes(E0.m) ? '' : ' fora'}" data-cce-cores><small>Cor</small><div class="bas-cores" role="group" aria-label="Cor do cartão">${cores.map(([c, n]) => `<button style="--c:${c}" data-act="bas-cc-cor" data-id="${esc(o.id)}" data-v="${c}" aria-label="${esc(n)}" aria-pressed="${c.toLowerCase() === E0.c.toLowerCase()}"></button>`).join('')}</div></div>
        <div class="bas-cce-bands" role="group" aria-label="Bandeira do cartão"><small>Bandeira</small><div>${[['visa', 'Visa'], ['master', 'Mastercard'], ['elo', 'Elo']].map(([b, n]) => `<button class="bas-cce-b${basBand(o.id) === b ? ' on' : ''} ${b}" data-act="bas-cc-band" data-id="${esc(o.id)}" data-v="${b}" aria-pressed="${basBand(o.id) === b}" aria-label="${n}">${CC_BAND[b]}</button>`).join('')}</div></div>
        ${o.novo ? `<button class="btn primary lg bas-cta bas-cce-ok" data-act="bas-ccn-ok" data-id="${esc(o.id)}">Adicionar cartão</button>` : '<button class="btn primary lg bas-cta bas-cce-ok" data-act="bas-voltar">Pronto</button>'}</div>
    </div>`).replace(olhoHtml(), '');
}
// escolha do modelo ou da cor: grava no perfil e troca só a prévia e as miniaturas, sem redesenhar
function basCcGrava(k, campo, v) {
  const est = Object.assign({}, S.profile.cartaoEstilo || {}); est[k] = Object.assign({}, est[k], { [campo]: v }); S.profile.cartaoEstilo = est; touch('profile');
  const E0 = basCcEstilo(k); const pv = document.querySelector('.bas-cc-prev'); if (pv) { pv.dataset.m = E0.m; pv.style.setProperty('--cb', E0.c); }
  document.querySelectorAll('.bas-ccm').forEach((b) => { const on = b.dataset.m === E0.m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); const mm = b.querySelector('.bas-cc-mini'); if (mm) mm.style.setProperty('--cb', E0.c); });
  document.querySelectorAll('[data-act="bas-cc-cor"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v.toLowerCase() === E0.c.toLowerCase()));
  const n = document.querySelector('[data-cce-n]'); if (n) { n.textContent = (CC_MODELOS.find((x) => x[0] === E0.m) || [, ''])[1]; n.classList.remove('troca'); void n.offsetWidth; n.classList.add('troca'); }
  const d = document.querySelector('[data-cce-d]'); if (d) d.textContent = CC_DESC[E0.m] || '';
  const cs = document.querySelector('[data-cce-cores]'); if (cs) cs.classList.toggle('fora', !CC_COM_COR.includes(E0.m));
  if (campo === 'b') { const b = basBand(k); document.querySelectorAll('.bas-cce-b').forEach((x) => { const on = x.dataset.v === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    const cc = document.querySelector('.bas-cce-card'); const slot = cc && cc.querySelector('.bas-cr-b');
    if (cc && slot) { cc.classList.add('band'); clearTimeout(cc._t); setTimeout(() => { slot.className = `bas-cr-b ${b} nova`; slot.innerHTML = CC_BAND[b]; }, 380); cc._t = setTimeout(() => cc.classList.remove('band'), 2000); } }
  const card = document.querySelector('.bas-cce-card'); if (card && campo === 'm') { card.classList.remove('gira'); void card.offsetWidth; card.classList.add('gira'); }
  basSom('toque');
}
function basTelaCartao(o) {
  const i = instDe(o.id); if (!i) return basSumiu(); const j = basJan(); const ents = []; for (let m = j.de; m <= j.ate; m++) entradasMes(m).forEach((e) => { if ((e.inst || '') === o.id && +e.valor > 0) { e.m = m; ents.push(e); } });
  const tot = ents.reduce((s, e) => s + +e.valor, 0); const sai = basSomaJ(S.C.despesas); const areas = {}; ents.forEach((e) => { areas[e.area] = (areas[e.area] || 0) + +e.valor; });
  const la = Object.keys(areas).map((k) => [k, areas[k]]).sort((a, b) => b[1] - a[1]); const cor = (a) => PAL[Math.max(0, la.findIndex((x) => x[0] === a)) % 6];
  const maior = ents.slice().sort((a, b) => b.valor - a.valor)[0];
  const lado = [[basIr('gasto', { inst: o.id }), I.plus, 'Novo gasto neste cartão'], [basIr('limite'), I_LIMITE_IC, 'Limite do mês'], [basIr('cartao-estilo', { id: o.id }), I_ENGRENAGEM, 'Personalizar o cartão']]
    .map(([a, ic, t]) => `<button class="bas-circ bas-ct2-b" ${a} aria-label="${t}" title="${t}">${ic}</button>`).join('');
  // a lista por dia, do mais recente; contas e parcelas sem dia ficam juntas no fim de cada mês
  const ord = ents.slice().sort((a, b) => b.m - a.m || (b.dia || 0) - (a.dia || 0)); let ult = ''; const lis = [];
  ord.forEach((e) => { const g = e.dia ? `${e.dia} de ${MES_LONGO[e.m].toLowerCase()}` : `Contas de ${MES_LONGO[e.m].toLowerCase()}`; if (g !== ult) { ult = g; lis.push(`<li class="bas-tx-g">${esc(g)}</li>`); }
    lis.push(`<li><button class="bas-tx" ${e.tipo === 'real' ? basIr('gasto-ver', { id: e.id }) : basIr('gasto-ver', { id: e.id, op: 'conta', modo: e.m })}><span class="bas-tx-ic bas-catic-i" style="--bc:${cor(e.area)}">${basCatIc(e.area)}</span><span class="bas-tx-n"><b>${esc(e.nome || e.area)}</b><small>${esc(e.area)}${e.parcela ? ` · parcela ${esc(String(e.parcela))}` : ''}</small></span><b class="bas-tx-v">−${basCent(e.valor)}</b></button></li>`); });
  return basDet(esc(i[1]), `<div class="bas-ct2" style="--cb:${basCcEstilo(o.id).c}"><div class="bas-ct2-lado">${lado}</div><div class="bas-ct2-card${S.basCtDir ? (S.basCtDir > 0 ? ' vem-d' : ' vem-e') : ''}" data-id="${esc(o.id)}">${basCartaoFace(o.id)}</div></div>
    <div class="bas-ct2-folha">
      <div class="bas-ct2-res"><div class="card bas-ct2-t g"><small>Gastou ${esc(basJanFrase())}</small><b>${basCent(tot)}</b><span>${pct(tot / (sai || 1))} de todos os seus gastos</span></div>
        <div class="card bas-ct2-t"><small>Maior gasto</small><b>${maior ? brl0(maior.valor) : '—'}</b><span>${maior ? esc(maior.nome || maior.area) : 'Nada ainda'}</span></div>
        <div class="card bas-ct2-t"><small>Lançamentos</small><b>${ents.length}</b><span>${la.length} ${la.length === 1 ? 'categoria' : 'categorias'}</span></div></div>
      ${la.length ? `<div class="card bas-ct2-cat"><span class="bas-onde-b" aria-hidden="true">${la.map(([n, v]) => `<i style="flex:${v.toFixed(2)};--bc:${cor(n)}"></i>`).join('')}</span><div class="bas-onde-l">${la.map(([n, v]) => `<button ${basIr('categoria', { area: n })}><i style="--bc:${cor(n)}"></i>${esc(n)} <b>${pct(v / (tot || 1))}</b></button>`).join('')}</div></div>` : ''}
      ${lis.length ? basSecao('Gastos do cartão', `<small class="bas-raio-t">${ents.length} ${ents.length === 1 ? 'item' : 'itens'}</small>`, `<ul class="bas-tx-l">${lis.join('')}</ul>`) : basCard(basVazio('Nenhum gasto neste cartão no período.'))}</div>`);
}
const I_LIMITE_IC = ic('<path d="M4.5 16a7.5 7.5 0 1 1 15 0"/><path d="M12 16l3.5-4.5"/>');

/* ---- rodada 6: investimento como no SaaS, meta e disponível premium, proventos interativos, alvos claros,
   para onde foi e limites por área em Gastos, e a análise da saúde financeira com o rostinho ---- */
const I_IMP = ic('<path d="M12 3.5v11m0 0-4-4m4 4 4-4"/><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>');
// investimento (o mesmo do Novo aporte do SaaS): aportar ou resgatar, ativo que já tenho ou novo, tipo, classe, mês e valor; e importar
// o ativo escolhido numa linha (Trocar abre a janela com busca, basInvLigar); a lista vai num template. ordem: por peso ou por proventos
function basAtPick(selId, porProv) {
  const p = S.plan; const { M } = cartAnalise(); const val = new Map(M.items.map((i) => [i.a.id, i.valor])); const pr = (a) => sum12(a.pr);
  const ord = p.ativos.slice().sort((x, y) => (porProv ? pr(y) - pr(x) : 0) || (val.get(y.id) || 0) - (val.get(x.id) || 0));
  const sel = (selId && p.ativos.find((x) => x.id === selId)) || ord[0]; if (!sel) return '';
  const classes = [...new Set(p.ativos.map((x) => x.classe || ''))]; const cor = (a) => BAS_CT_COR[classes.indexOf(a.classe || '') % BAS_CT_COR.length];
  const cara = (a) => `<span class="bas-ct-lg" style="--bc:${cor(a)}">${esc(basSigla(a.nome))}</span><span class="bas-ct-an"><b>${esc(a.nome)}</b><small>${esc(a.classe || 'Outros')}${porProv ? (pr(a) > 0 ? ` · ${brl0(pr(a))} no ano` : '') : val.get(a.id) > 0.005 ? ` · ${brl0(val.get(a.id))}` : ''}</small></span>`;
  const grupos = {}; ord.forEach((a) => { (grupos[a.classe || 'Outros'] = grupos[a.classe || 'Outros'] || []).push(a); });
  return `<input type="hidden" name="ativo" value="${esc(sel.id)}"><button type="button" class="card bas-inv-sel" data-inv-sel aria-label="Trocar o ativo">${cara(sel)}<em>Trocar</em></button>
    <template id="bas-inv-tpl"><ul class="bas-inv-ls">${Object.keys(grupos).map((c) => `<li class="bas-inv-g" data-q="${esc(c.toLowerCase())}">${esc(c)}</li>${grupos[c].map((a) => `<li data-q="${esc(`${a.nome} ${c}`.toLowerCase())}"><button type="button" class="bas-ct-at" data-inv-id="${esc(a.id)}">${cara(a)}</button></li>`).join('')}`).join('')}</ul></template>`;
}
const basMesFaixa = (m0) => `<div class="bas-inv-mes" role="radiogroup" aria-label="Mês">${MES.map((m, i) => `<label><input type="radio" name="mes" value="${i}" ${i === m0 ? 'checked' : ''}><span>${m}</span></label>`).join('')}</div>`;
function basTelaInvest(o) {
  const p = S.plan; const tem = p.ativos.length > 0;
  const classes = [...new Set(p.ativos.map((a) => a.classe).filter(Boolean))].concat(["CDB's", 'Tesouro Direto', 'Ações BR', 'Fundos Imobiliários', "ETF's", 'Criptoativos']).filter((c, i, l) => l.indexOf(c) === i);
  const op = o.op === '-1' ? '-1' : '1';
  return basForm('aporte', 'Investimento', `<div class="bas-inv-op" role="radiogroup" aria-label="O que você quer fazer">${[['1', 'Aplicar'], ['-1', 'Resgatar']].map(([v, l]) => `<label><input type="radio" name="op" value="${v}" ${v === op ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
    <div class="bas-inv-v">${basValor('valor', 0, 'Quanto?')}</div>
    <input type="hidden" name="modo" value="${tem ? 'ex' : 'novo'}">${tem ? `<p class="bas-inv-k">Em qual ativo</p>${basAtPick(o.ativo, false)}` : ''}
    <div class="bas-inv-novo" ${tem ? 'hidden' : ''}>${basCampo('nome', 'Nome do ativo', '', 'placeholder="Ex.: PETR4, CDB Banco X"')}
      ${basCampo('classe', 'Classe', '', 'list="bas-dl-classe" placeholder="Ex.: Ações, CDB, Fundos imobiliários"')}<datalist id="bas-dl-classe">${classes.map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist>
      ${basChips('tipo', [['RENDA FIXA', 'Renda fixa'], ['BOLSA DE VALORES', 'Bolsa']], 'BOLSA DE VALORES', 'Tipo')}</div>
    <p class="bas-inv-k">Mês</p>${basMesFaixa(S.mes)}
    <button type="button" class="bas-inv-imp" data-act="bas-importar">${I_IMP}<span>Importar da B3 ou de um extrato</span>${I.chev}</button>`, { ok: 'Registrar' });
}
// escolher o ativo numa janela com busca (ou "Ativo novo"), sem a lista longa na tela
function basInvLigar() {
  const bt = document.querySelector('[data-inv-sel]'); if (!bt || bt.dataset.lig) return; bt.dataset.lig = '1'; const f = bt.closest('form');
  const mes = f.querySelector('.bas-inv-mes input:checked'); if (mes) { const c = mes.parentElement.parentElement; c.scrollLeft = mes.parentElement.offsetLeft - c.clientWidth / 2 + mes.parentElement.offsetWidth / 2; }
  const novo = f.querySelector('.bas-inv-novo'); const modo = f.querySelector('[name="modo"]'); const at = f.querySelector('[name="ativo"]');
  bt.addEventListener('click', () => { const el = basUltPop('bas-inv-tpl', 'Escolha o ativo', 'Toque para escolher'); if (!el) return; const lis = [...el.querySelectorAll('.bas-pop-c li')];
    el.querySelector('.bas-pop-c').insertAdjacentHTML('beforebegin', `<div class="bas-mvp-f"><label class="bas-mvp-b"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input type="search" placeholder="Buscar ativo ou classe" aria-label="Buscar ativo"></label>
      ${novo ? `<button type="button" class="bas-inv-mais" data-inv-novo>${I.plus}<span>Ativo novo</span></button>` : ''}</div>`);
    el.querySelector('input').addEventListener('input', (e) => { const q = e.target.value.trim().toLowerCase(); lis.forEach((li) => { li.hidden = !!q && !li.dataset.q.includes(q); }); });
    const fecha = () => el.querySelector('[data-pop="x"]').click();
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-inv-id], [data-inv-novo]'); if (!b) return;
      if (b.dataset.invId) { at.value = b.dataset.invId; if (modo) modo.value = 'ex'; if (novo) novo.hidden = true; bt.innerHTML = `${b.innerHTML}<em>Trocar</em>`; }
      else { modo.value = 'novo'; novo.hidden = false; bt.innerHTML = `<span class="bas-ct-lg" style="--bc:var(--accent)">${I.plus}</span><span class="bas-ct-an"><b>Ativo novo</b><small>Preencha embaixo</small></span><em>Trocar</em>`; setTimeout(() => { const n = novo.querySelector('[name="nome"]'); if (n) n.focus(); }, 260); }
      fecha(); }); });
}
const sum12 = (a) => (a || []).reduce((s, v) => s + (+v || 0), 0);
// tela do ativo, no jeito de corretora: a posição (a custo) mês a mês desde o primeiro registro, em velas ou linha,
// seguindo o dedo; resumo, constância dos últimos 12 meses, as movimentações e a barra Resgatar | Aplicar embaixo
function basAtSerie(a0) {
  const nm = E.norm(a0.nome); const L = [];
  Object.keys(S.plans).map(Number).sort((x, y) => x - y).forEach((y) => { const pl = S.plans[y]; if (!pl || !pl.ativos || y > NOW_Y) return;
    const a = pl.ativos.find((x) => x.id === a0.id) || pl.ativos.find((x) => E.norm(x.nome) === nm); const fim = y < NOW_Y ? 11 : NOW_M;
    for (let m = 0; m <= fim; m++) L.push({ y, m, ap: a ? +a.ap[m] || 0 : 0, pr: a ? +(a.pr || [])[m] || 0 : 0 }); });
  const k = L.findIndex((p) => p.ap || p.pr); const R = k < 0 ? [] : L.slice(k); let pos = 0;
  R.forEach((p) => { p.o = pos; pos = Math.max(0, pos + p.ap); p.c = pos; }); return R;
}
const basAtMes = (p, longo) => `${longo ? MES_LONGO[p.m] : MES[p.m].toLowerCase()}${longo ? ' de ' : '/'}${longo ? p.y : String(p.y).slice(2)}`;
function basTelaAtivo(o) {
  const a = S.plan.ativos.find((x) => x.id === o.id); if (!a) return basSumiu();
  const L = basAtSerie(a); const ult = L[L.length - 1]; const pos = ult ? ult.c : 0; const i0 = S.plan.ativos.indexOf(a);
  const R = S.basAtR || '1A'; const vis = R === 'Tudo' ? L : L.slice(-(R === '6M' ? 6 : 12)); const velas = (S.basAtModo || 'velas') === 'velas';
  const ini = vis.length ? vis[0].o : 0; const dif = pos - ini; const pv = ini > 0 ? dif / ini : null; const up = dif >= 0;
  const quando = R === 'Tudo' ? 'desde o início' : R === '6M' ? 'em 6 meses' : 'em 12 meses';
  // gráfico: escala pela faixa visível (como numa corretora, não começa do zero)
  let lo = Math.min(...vis.map((p) => Math.min(p.o, p.c))); let hi = Math.max(...vis.map((p) => Math.max(p.o, p.c))); if (!(hi > lo)) { hi = lo + 1; }
  const pad = (hi - lo) * 0.12; lo = Math.max(0, lo - pad); hi += pad; const yy = (v) => ((hi - v) / (hi - lo)) * 100; const n = vis.length;
  const cx = (i) => ((i + 0.5) / n) * 84; // 16% à direita ficam para os valores da grade
  const grade = [0.25, 0.5, 0.75].map((f) => `<i class="bas-at-gl" style="top:${f * 100}%"><span>${brl0(hi - (hi - lo) * f)}</span></i>`).join('');
  const corpo = velas
    ? vis.map((p, i) => { const t = yy(Math.max(p.o, p.c)); const h = Math.max(0.8, Math.abs(yy(p.o) - yy(p.c))); const cl = p.ap > 0 ? 'sobe' : p.ap < 0 ? 'desce' : 'igual';
      return `<span class="bas-at-v ${cl}" style="left:${cx(i).toFixed(2)}%;top:${t.toFixed(2)}%;height:${h.toFixed(2)}%;--w:${Math.min(16, Math.max(4, 220 / n)).toFixed(1)}px;--d:${(i * 28).toFixed(0)}ms"></span>${p.pr > 0 ? `<b class="bas-at-pr" style="left:${cx(i).toFixed(2)}%;top:${Math.max(0, t - 9).toFixed(2)}%" aria-hidden="true"></b>` : ''}`; }).join('')
    : `<svg class="bas-at-ln" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bas-at-ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38D6FF" stop-opacity=".45"/><stop offset="1" stop-color="#38D6FF" stop-opacity="0"/></linearGradient></defs>
      <path class="a" d="M0 ${yy(vis[0] ? vis[0].o : 0).toFixed(2)} ${vis.map((p, i) => `L${cx(i).toFixed(2)} ${yy(p.c).toFixed(2)}`).join(' ')} L84 ${yy(pos).toFixed(2)} L84 100 L0 100 Z"/>
      <path class="l" d="M0 ${yy(vis[0] ? vis[0].o : 0).toFixed(2)} ${vis.map((p, i) => `L${cx(i).toFixed(2)} ${yy(p.c).toFixed(2)}`).join(' ')} L84 ${yy(pos).toFixed(2)}"/></svg>
      ${vis.map((p, i) => (p.pr > 0 ? `<b class="bas-at-pr" style="left:${cx(i).toFixed(2)}%;top:${Math.max(0, yy(p.c) - 12).toFixed(2)}%" aria-hidden="true"></b>` : '')).join('')}
      <span class="bas-at-fim" style="top:${yy(pos).toFixed(2)}%" aria-hidden="true"></span>`;
  const dd = vis.map((p) => [basAtMes(p, true), basCent(p.c), p.ap ? `${p.ap > 0 ? '+' : '−'}${brl(Math.abs(p.ap))} ${p.ap > 0 ? 'aplicado' : 'resgatado'}${p.pr > 0 ? ` · ${brl(p.pr)} de provento` : ''}` : p.pr > 0 ? `${brl(p.pr)} de provento` : 'sem movimento', p.ap > 0 ? 'sobe' : p.ap < 0 ? 'desce' : '']);
  const eixo = n ? [vis[0], vis[Math.floor((n - 1) / 2)], vis[n - 1]].map((p) => `<span>${basAtMes(p)}</span>`).join('') : '';
  const graf = n ? `<div class="bas-at-g" data-d="${esc(JSON.stringify(dd))}" role="img" aria-label="Posição de ${esc(a.nome)} mês a mês. Arraste para ver cada mês.">${grade}${corpo}<i class="bas-at-mira" aria-hidden="true"></i></div><div class="bas-at-eixo" aria-hidden="true">${eixo}</div>
    <div class="bas-at-ctl"><div class="bas-at-seg" role="group" aria-label="Período do gráfico">${['6M', '1A', 'Tudo'].map((r) => `<button class="${r === R ? 'on' : ''}" data-act="bas-at-r" data-v="${r}" aria-pressed="${r === R}">${r}</button>`).join('')}</div>
      <div class="bas-at-seg" role="group" aria-label="Tipo de gráfico"><button class="${velas ? 'on' : ''}" data-act="bas-at-modo" data-v="velas" aria-pressed="${velas}" aria-label="Velas">${'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M7 15v6M17 3v6M17 17v4"/><rect x="5" y="7" width="4" height="8" rx="1"/><rect x="15" y="9" width="4" height="8" rx="1"/></svg>'}</button><button class="${velas ? '' : 'on'}" data-act="bas-at-modo" data-v="linha" aria-pressed="${!velas}" aria-label="Linha">${'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l5-6 4 3 8-10"/></svg>'}</button></div></div>` : '';
  // números
  const soma = (f) => L.reduce((t, p) => t + f(p), 0); const apl = soma((p) => Math.max(0, p.ap)); const res = soma((p) => Math.max(0, -p.ap)); const prT = soma((p) => p.pr);
  const pr12 = L.slice(-12).reduce((t, p) => t + p.pr, 0); const tot = S.plan.ativos.reduce((t, x) => { const s = basAtSerie(x); return t + (s.length ? s[s.length - 1].c : 0); }, 0);
  const mesesAp = L.filter((p) => p.ap > 0).length;
  const k = (nome, v, sub) => `<span><small>${nome}</small><b>${v}</b>${sub ? `<em>${sub}</em>` : ''}</span>`;
  const resumo = `<div class="card bas-at-ks">${k('Aplicado', brl0(apl), res > 0 ? `${brl0(res)} resgatado` : '')}${k('Proventos', brl0(prT), pr12 > 0 && pos > 0 ? `${pct(pr12 / pos, 1)} em 12 meses` : '')}${k('Na carteira', tot > 0 ? pct(pos / tot, 1) : '–', 'do que você tem')}${k('Desde', L.length ? esc(basAtMes(L[0])) : '–', `${mesesAp} ${mesesAp === 1 ? 'mês' : 'meses'} com aporte`)}</div>`;
  const u12 = L.slice(-12); const cons = u12.length ? basSecao('Constância', `<small class="bas-pv2-q">${u12.filter((p) => p.ap > 0).length} de ${u12.length} meses</small>`, `<div class="card bas-at-cs">${u12.map((p) => `<span class="${p.ap > 0 ? 'on' : p.ap < 0 ? 'neg' : ''}" title="${esc(basAtMes(p, true))}"><i></i><b>${MES[p.m][0]}</b></span>`).join('')}</div>`) : '';
  // movimentações, da mais nova para a mais antiga (as deste ano abrem a edição daquele mês)
  const mov = []; L.slice().reverse().forEach((p) => { if (p.ap) mov.push({ p, t: p.ap > 0 ? 'ap' : 'rs', v: p.ap }); if (p.pr) mov.push({ p, t: 'pr', v: p.pr }); });
  const NOME = { ap: 'Aplicação', rs: 'Resgate', pr: 'Provento' }; const IC = { ap: '↑', rs: '↓', pr: '◆' };
  const linha = (x) => { const ed = x.t !== 'pr' && x.p.y === S.year && temRecurso('aporte_simples');
    return `<li><button class="bas-at-mv ${x.t}" ${ed ? basIr('aporte', { id: a.id, mes: x.p.m }) : 'disabled'}><span class="bas-at-mi" aria-hidden="true">${IC[x.t]}</span><span class="bas-pv2-n"><b>${NOME[x.t]}</b><small>${esc(basAtMes(x.p, true))}</small></span><b class="bas-at-mvv">${x.t === 'rs' ? '−' : '+'}${basCent(Math.abs(x.v))}</b></button></li>`; };
  // as 5 mais novas na tela; "Ver tudo" abre a janela com período e busca (basMovPop), sobre a lista inteira guardada num template
  const linhaT = (x) => linha(x).replace('<li>', `<li data-ym="${x.p.y * 12 + x.p.m}" data-q="${esc(`${NOME[x.t]} ${basAtMes(x.p, true)}`.toLowerCase())}">`);
  const movs = mov.length ? basSecao('Movimentações', mov.length > 5 ? `<button class="bas-ult-ver" data-act="bas-at-movs">Ver tudo</button>` : '', `<ul class="card bas-pv2-ls">${mov.slice(0, 5).map(linha).join('')}</ul>${mov.length > 5 ? `<template id="bas-mv-tpl"><ul class="bas-pv2-ls">${mov.map(linhaT).join('')}</ul></template>` : ''}`) : basCard(basVazio('Nenhuma movimentação ainda.'));
  const pode = temRecurso('aporte_simples');
  const bar = pode ? `<div class="bas-at-bar"><button class="bas-at-b rs" ${basIr('aporte', { modo: 'nova', op: '-1', ativo: a.id })}>Resgatar</button><button class="bas-at-b ap" ${basIr('aporte', { modo: 'nova', op: '1', ativo: a.id })}>Aplicar</button></div>` : '';
  return `<div class="bas-pg bas-pg-at"><div class="bas-gt-bg bas-pt-bg bas-at-bg">
    <header class="bas-pv2-h"><button class="bell bas-cal-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><b></b><span class="bas-noite-r"><button class="bell bas-cal-b" ${basIr('ativo-ed', { id: a.id })} aria-label="Editar ativo" title="Editar ativo">${I.edit}</button>${olhoHtml()}</span></header>
    <div class="bas-at-id"><span class="bas-at-logo" style="--bc:${PAL[i0 % 6]}" aria-hidden="true">${esc(/\s/.test(a.nome.trim()) ? basIniciais(a.nome) : a.nome.trim().slice(0, 4).toUpperCase())}</span><span><b>${esc(a.nome)}</b><small>${esc([a.classe, a.tipo === 'RENDA FIXA' ? 'Renda fixa' : a.tipo ? 'Bolsa' : ''].filter(Boolean).join(' · '))}</small></span></div>
    <small class="bas-pv2-k" data-at="k">Sua posição</small>
    <b class="bas-pv2-t" data-at="v">${basCent(pos)}</b>
    <p class="bas-pv2-var" data-at="s">${pv != null ? `<span class="bas-ev-pct${up ? '' : ' neg'}">${up ? '↑' : '↓'} ${pct(Math.abs(pv), 1)}</span>` : ''}<span>${dif ? `${up ? '+' : '−'}${brl0(Math.abs(dif))} ${quando}` : `sem mudança ${quando}`}</span></p>
    ${graf}
  </div><div class="bas-gt-folha">${resumo}${cons}${movs}<p class="bas-disc keep">Posição a custo: o que você aplicou menos o que resgatou, sem cotação de mercado.</p></div>${bar}</div>`;
}
function basAtLigar() {
  const g = document.querySelector('.bas-at-g[data-d]'); if (!g || g.dataset.on) return; g.dataset.on = '1';
  const dd = JSON.parse(g.dataset.d); const mira = g.querySelector('.bas-at-mira'); const k = document.querySelector('[data-at="k"]'); const v = document.querySelector('[data-at="v"]'); const s = document.querySelector('[data-at="s"]');
  const k0 = k.textContent; const v0 = v.innerHTML; const s0 = s.innerHTML; let ult = -1;
  const mover = (e) => { const r = g.getBoundingClientRect(); const i = Math.max(0, Math.min(dd.length - 1, Math.floor(((e.clientX - r.left) / (r.width * 0.84)) * dd.length))); if (i === ult) return; ult = i;
    mira.style.left = ((i + 0.5) / dd.length) * 84 + '%'; g.classList.add('arrasta'); g.querySelectorAll('.bas-at-v').forEach((x, n) => x.classList.toggle('sel', n === i));
    k.textContent = `Posição em ${dd[i][0]}`; v.innerHTML = dd[i][1]; s.innerHTML = `<span class="bas-at-mvs ${dd[i][3]}">${esc(dd[i][2])}</span>`; basSom('toque'); };
  const soltar = () => { g.classList.remove('arrasta'); ult = -1; k.textContent = k0; v.innerHTML = v0; s.innerHTML = s0; g.querySelectorAll('.bas-at-v.sel').forEach((x) => x.classList.remove('sel')); };
  g.addEventListener('pointerdown', (e) => { g.setPointerCapture(e.pointerId); mover(e); }); g.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'mouse') mover(e); });
  g.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') soltar(); }); g.addEventListener('pointercancel', soltar); g.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') soltar(); });
}
// meta (Quanto aportei) e disponível (Disponível para aportar), como no SaaS, redesenhados para o celular
function basMetaDispHtml() {
  const C = S.C; const j = basJan(); const D = E.disponivelAporte({ C, mes: j.de, ate: j.ate, metaMes: C.metaAporteMes });
  const A = E.analiseInvest({ C, itens: [], meses: j.ate + 1, metaAporte: +S.plan.settings.metaAporte || 0, de: j.de, ate: j.ate }).aporte; const f = D.meta > 0 ? D.aportado / D.meta : 0;
  const st = D.meta > 0 ? (D.acimaMeta > 0.005 ? `<em class="ok">+${brl(D.acimaMeta)} acima da meta</em>` : D.faltaMeta > 0.005 ? `<em>Faltam ${brl(D.faltaMeta)}</em>` : '<em class="ok">Meta batida</em>') : '<em>Sem meta definida</em>';
  const meta = `<section class="card bas-qa"><div class="bas-ch"><h2 class="bas-h2">Quanto aportei</h2><button class="lnk strong" ${basIr('meta')}>${D.meta > 0 ? 'Meta' : 'Definir meta'}</button></div>
    <div class="bas-qa-c">${basAnel(Math.min(1, f), 118, `<b>${D.meta > 0 ? pct(f) : '–'}</b><small>da meta</small>`, f >= 1 ? 'ok' : '')}<span class="bas-qa-t"><small>${esc(cap(basJanFrase()))}</small><b>${basCent(D.aportado)}</b><span>${D.meta > 0 ? `de ${brl(D.meta)}` : ''}</span>${st}</span></div>
    <div class="bas-qa-o"><span><i class="bolso"></i><small>Do seu bolso</small><b>${brl(A.doBolso)}</b></span><span><i class="div"></i><small>De dividendos</small><b>${brl(A.deDividendos)}</b></span></div>
    ${D.aportado > 0 ? `<span class="bas-qa-b" aria-hidden="true"><i class="bolso" style="flex:${Math.max(0, A.doBolso).toFixed(2)}"></i><i class="div" style="flex:${Math.max(0, A.deDividendos).toFixed(2)}"></i></span>` : ''}</section>`;
  const exc = D.excedente > 0.005; const tudo = !exc && D.disponivel < 0.005 && D.sobra > 0.005; const tot = Math.max(D.sobra, D.aportado, 1);
  // Disponível compacto: o valor, uma ação ou o estado ao lado, a barra e a conta numa linha só
  const acaoD = exc ? '<em class="bas-dp-tag neg">Além da sobra</em>' : tudo ? '<em class="bas-dp-tag ok">Tudo investido</em>' : D.disponivel > 0.005 ? `<button class="bas-dp-bt" ${basIrInv()}>Investir</button>` : '';
  const disp = `<section class="card bas-dp bas-dp2${tudo ? ' ok' : ''}${exc ? ' exc' : ''}"><div class="bas-dp2-t"><span class="bas-n"><small>Disponível para aportar</small><b class="bas-dp-v">${basCent(D.disponivel)}</b></span>${acaoD}</div>
    <span class="bas-dp-b" aria-hidden="true"><i class="inv" style="width:${(Math.min(D.aportado, D.sobra > 0 ? D.sobra : D.aportado) / tot * 100).toFixed(1)}%"></i><i class="liv" style="width:${(D.disponivel / tot * 100).toFixed(1)}%"></i>${exc ? `<i class="exc" style="width:${(D.excedente / tot * 100).toFixed(1)}%"></i>` : ''}</span>
    <p class="bas-dp2-s">Sobrou <b>${brl(D.sobra)}</b> · investido <b>${brl(D.aportado)}</b>${exc ? ` · <b class="neg">${brl(D.excedente)}</b> além` : ''}</p></section>`;
  return meta + disp;
}
// arco das fontes de renda (Entradas): uma fatia por fonte, como num gráfico de pizza; listrado = o que falta até o melhor mês.
// Tocar numa fatia ou na bolinha dela destaca a fonte; as setas passam de uma em uma.
// na conversa, o Cifrão de verdade fica ao lado da última resposta; a cada resposta nova ele vira bolinha, pula até ela e volta a ser o Cifrão
function basIaxPulo() {
  const ia = document.querySelector('.bas-iax'); if (!ia || ia.dataset.pulo) return; ia.dataset.pulo = '1';
  const log = ia.querySelector('.bas-iax-log'); const cif = ia.querySelector('.bas-iax-orb .cifrao'); if (!log || !cif) return;
  const av = document.createElement('span'); av.className = 'bas-iax-av'; av.setAttribute('aria-hidden', 'true'); let y = null; let casa = null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ajeita = () => {
    const ult = [...log.querySelectorAll('.ia-m.ia')].pop(); if (!ult) return;
    if (!av.isConnected) { log.prepend(av); casa = cif.parentElement; av.appendChild(cif); }
    const ny = ult.offsetTop; if (ny === y) return; const de = y; y = ny;
    if (de == null || quieto) { av.style.transform = `translateY(${ny}px)`; return; }
    try { window.Cifrao && window.Cifrao.forma(cif, 'moeda'); } catch (e) { /* ignora */ }
    const meio = Math.min(de, ny) - 46;
    const a = av.animate([{ transform: `translateY(${de}px) scale(1)` }, { transform: `translateY(${de + 6}px) scale(1.08, .86)`, offset: .14 }, { transform: `translateY(${meio}px) scale(.62)`, offset: .52 }, { transform: `translateY(${ny + 4}px) scale(1.1, .88)`, offset: .86 }, { transform: `translateY(${ny}px) scale(1)` }], { duration: 720, easing: 'cubic-bezier(.35, .1, .3, 1)' });
    av.style.transform = `translateY(${ny}px)`;
    a.finished.then(() => { try { window.Cifrao && window.Cifrao.forma(cif, 'cifrao'); } catch (e) { /* ignora */ } setTimeout(() => reage(ult), 380); }, () => {});
  };
  // reage ao que respondeu: comemora o que é bom, estranha o que passou do ponto, concorda no resto
  const reage = (m) => { const t = (m && m.textContent || '').toLowerCase(); const C = window.Cifrao; if (!C) return;
    const nome = /passou|além|estour|caiu|negativ|ainda não tem|cuidado|atenção|acima do/.test(t) ? (Math.random() < .5 ? 'confuso' : 'susto') : /sobr|parabéns|conclu|subiu|bateu|ótimo|dá para|disponíveis|livres|cresceu/.test(t) ? (Math.random() < .5 ? 'festa' : 'comemorando') : (Math.random() < .5 ? 'sim' : 'piscadela');
    try { C.expressao(cif, nome); } catch (e) { /* ignora */ } };
  // pensando enquanto a resposta não chega
  new MutationObserver(() => { if (log.querySelector('.ia-m.dig')) try { window.Cifrao && window.Cifrao.expressao(cif, 'calculando'); } catch (e) { /* ignora */ } }).observe(log, { childList: true, subtree: true });
  // no toque, às vezes vira uma das outras formas (moeda, cadeado, mais, seta) e volta sozinho
  cif.addEventListener('click', () => { if (Math.random() < .45) try { const F = ['moeda', 'cadeado', 'mais', 'seta']; window.Cifrao.forma(cif, F[Math.floor(Math.random() * F.length)]); } catch (e) { /* ignora */ } });
  // parado, de tempos em tempos ele faz um gesto pequeno para parecer vivo
  const vivo = setInterval(() => { if (!cif.isConnected) { clearInterval(vivo); return; } if (quieto || document.hidden || (cif.cifrao && cif.cifrao.seq)) return;
    const G = ['espiada', 'curioso', 'piscadela', 'animado', 'espiando', 'carinho', 'sim']; try { window.Cifrao.expressao(cif, G[Math.floor(Math.random() * G.length)]); } catch (e) { /* ignora */ } }, 3800);
  new MutationObserver(() => requestAnimationFrame(ajeita)).observe(log, { childList: true });
  ajeita();
}
function basArLigar() {
  const el = document.querySelector('.bas-gg[data-f]'); if (!el || el.dataset.on) return; el.dataset.on = '1';
  const F = JSON.parse(el.dataset.f); const q = el.dataset.q; const svg = el.querySelector('svg'); const NS = 'http://www.w3.org/2000/svg';
  // medidor: arco de 270° aberto embaixo; cada fonte é uma parte azul, separada da seguinte por um corte com um risquinho; depois, marquinhas até o melhor mês e o trilho escuro
  const CX = 170, CY = 158, R = 140, A0 = 225, SW = 270, W = 22, GAP = 6.4; const CAP = (W / 2 / R) * 180 / Math.PI;
  const ang = (f) => A0 - SW * f; const pt = (g, r) => [CX + r * Math.cos((g * Math.PI) / 180), CY - r * Math.sin((g * Math.PI) / 180)];
  const arc = (g0, g1) => { if (g0 - g1 < 0.3) return ''; const [x0, y0] = pt(g0, R), [x1, y1] = pt(g1, R); return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 ${g0 - g1 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
  const poe = (tag, at) => { const n = document.createElementNS(NS, tag); Object.entries(at).forEach(([a, b]) => n.setAttribute(a, b)); svg.appendChild(n); return n; };
  const wt = F.map((f) => Math.max(f[4], 0.12)); const sw = wt.reduce((x, y) => x + y, 0); const ini = [0]; wt.forEach((w, i) => ini.push(ini[i] + (sw > 1 ? w / sw : w))); const fim = ini[F.length];
  poe('path', { d: arc(A0, A0 - SW), style: `fill:none;stroke:rgba(255,255,255,.16);stroke-width:${W};stroke-linecap:round` });
  /* marquinhas finas e radiais logo depois da última parte, sumindo aos poucos */ if (F.length && fim < 0.99) { const g0 = ang(fim) - CAP - 2.2, g1 = Math.max(ang(1), g0 - 62); for (let g = g0, n = 0; g > g1; g -= 3.4, n++) { const [a1, b1] = pt(g, R - 7), [a2, b2] = pt(g, R + 7); poe('line', { x1: a1.toFixed(1), y1: b1.toFixed(1), x2: a2.toFixed(1), y2: b2.toFixed(1), style: `stroke:rgba(255,255,255,${(0.34 - 0.2 * ((g0 - g) / (g0 - g1))).toFixed(2)});stroke-width:1.8;stroke-linecap:round` }); } }
  const SG = F.map((_, i) => poe('path', { class: 'bas-gg-sg', d: arc(ang(ini[i]) - (i ? GAP : 0), ang(ini[i + 1]) + (i < F.length - 1 ? GAP : 0)), style: `fill:none;stroke:#FFFFFF;stroke-width:${W};stroke-linecap:round` }));
  ini.slice(1, F.length).forEach((v) => { const g = ang(v); const [x1, y1] = pt(g, R + 6), [x2, y2] = pt(g, R - 6); poe('line', { x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), style: 'stroke:rgba(255,255,255,.8);stroke-width:2;stroke-linecap:round' }); });
  if (!F.length) return;
  const k = el.querySelector('.bas-gg-k'), v = el.querySelector('.bas-gg-v'), s = el.querySelector('.bas-gg-s'); let sel = -1;
  const total = () => { sel = -1; SG.forEach((p) => p.classList.remove('apaga')); k.textContent = el.dataset.tk; v.textContent = el.dataset.t;
    s.textContent = F.length > 1 ? `${F.length} fontes · toque no arco` : `Tudo de ${F[0][0]}`; el.setAttribute('aria-valuenow', 0); };
  const escolhe = (i) => {
    i = (i + F.length) % F.length; sel = i; const f = F[i]; SG.forEach((p, j) => p.classList.toggle('apaga', j !== i));
    k.textContent = `${f[2]} do que entrou`; v.textContent = f[5];
    s.innerHTML = `${esc(f[0])}${f[3] == null || !q ? '' : f[3] === 0 ? `, igual a ${esc(q)}` : `, ${f[3] > 0 ? 'subiu' : 'caiu'} <b class="${f[3] > 0 ? 'up' : 'dn'}">${f[3] > 0 ? '↑' : '↓'} ${Math.abs(f[3])}%</b> contra ${esc(q)}`}`;
    el.setAttribute('aria-valuenow', i + 1); el.setAttribute('aria-valuetext', `${f[0]}, ${f[5]}, ${f[2]}`);
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(4); } catch (e) { /* ignora */ }
  };
  // toque numa parte mostra a fonte; tocar de novo nela, no meio ou fora do arco volta ao total
  const onde = (e) => { const r = svg.getBoundingClientRect(); const vx = ((e.clientX - r.left) / r.width) * 340, vy = ((e.clientY - r.top) / r.height) * 280;
    const d = Math.hypot(vx - CX, vy - CY); if (d < R - 42 || d > R + 42) return -1;
    let g = (Math.atan2(CY - vy, vx - CX) * 180) / Math.PI; if (g < A0 - 360) g += 360; const f = (A0 - g) / SW; if (f < 0 || f > fim + 0.02) return -1;
    let i = 0; while (i < F.length - 1 && ini[i + 1] < f) i++; return i; };
  el.addEventListener('click', (e) => { const i = onde(e); if (i < 0 || i === sel) total(); else escolhe(i); });
  el.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); escolhe(sel < 0 ? (e.key === 'ArrowLeft' ? F.length - 1 : 0) : sel + (e.key === 'ArrowLeft' ? -1 : 1)); } else if (e.key === 'Escape') total(); });
  total();
}
// roleta dos proventos: arrastar gira o arco (um traço por provento), solta com embalo e para no mais próximo; setas do teclado passam de um em um
function basRlLigar() {
  const el = document.querySelector('.bas-rl[data-e]'); if (!el || el.dataset.on) return; el.dataset.on = '1';
  const E = JSON.parse(el.dataset.e); const T = [...el.querySelectorAll('.bas-rl-arco i')]; const R = +el.dataset.r; const st = +el.dataset.s; const pill = document.querySelector('[data-rl-pill]');
  const L = T.map((t) => parseFloat(t.style.getPropertyValue('--l')) || 20); const px = (R * st * Math.PI) / 180; const n = E.length;
  const menos = matchMedia('(prefers-reduced-motion: reduce)').matches; let pos = Math.max(0, n - 1); let sel = -1; let raf = 0;
  // traços apagados antes do primeiro e depois do último: o arco fica cheio e gira junto
  const arco = el.querySelector('.bas-rl-arco'); const GH = []; for (let k = 1; k <= 16; k++) for (const i of [-k, Math.max(0, n) - 1 + k]) { const g = document.createElement('i'); g.className = 'g'; arco.appendChild(g); GH.push([g, i]); }
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const pinta = () => {
    T.forEach((t, i) => { const a = (pos - i) * st; const o = Math.abs(a) > 112 ? 0 : 1 - (Math.abs(a) / 112) ** 3; t.style.transform = `rotate(${a.toFixed(2)}deg) translateY(${R - L[i]}px)`; t.style.opacity = o.toFixed(3); });
    GH.forEach(([g, i]) => { const a = (pos - i) * st; const o = Math.abs(a) > 112 ? 0 : 1 - (Math.abs(a) / 112) ** 3; g.style.transform = `rotate(${a.toFixed(2)}deg) translateY(${R - 14}px)`; g.style.opacity = (o * 0.28).toFixed(3); });
    const k = n ? lim(Math.round(pos), 0, n - 1) : -1; if (k === sel) return; const pri = sel < 0; if (T[sel]) T[sel].classList.remove('on'); sel = k; if (T[k]) T[k].classList.add('on');
    if (k < 0) { pill.innerHTML = '<span class="bas-rl-p0">Nenhum provento neste período</span>'; return; }
    const e = E[k]; pill.innerHTML = `<span class="bas-pv2-ini" style="--bc:${PAL[k % 6]}">${esc(e[3])}</span><span class="bas-rl-pt"><b>${esc(e[0])}</b><small>${esc(e[1])}</small></span><b class="bas-rl-pv">${e[2]}</b>`;
    el.setAttribute('aria-valuenow', k + 1); el.setAttribute('aria-valuetext', `${e[0]}, ${e[1]}`);
    if (!pri) { try { if (navigator.vibrate && !menos && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(4); } catch (er) { /* ignora */ } }
  };
  const vai = (alvo) => { cancelAnimationFrame(raf); alvo = lim(alvo, 0, Math.max(0, n - 1)); if (menos) { pos = alvo; pinta(); return; }
    const anda = () => { pos += (alvo - pos) * 0.2; if (Math.abs(alvo - pos) < 0.003) { pos = alvo; pinta(); return; } pinta(); raf = requestAnimationFrame(anda); }; anda(); };
  let x0 = 0, p0 = 0, ux = 0, ut = 0, vel = 0, arr = false;
  el.addEventListener('pointerdown', (e) => { if (!n) return; arr = true; cancelAnimationFrame(raf); x0 = ux = e.clientX; ut = performance.now(); p0 = pos; vel = 0; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => { if (!arr) return; const t = performance.now(); vel = (e.clientX - ux) / Math.max(1, t - ut); ux = e.clientX; ut = t; pos = lim(p0 - (e.clientX - x0) / px, -0.45, n - 0.55); pinta(); });
  const solta = () => { if (!arr) return; arr = false; vai(Math.round(pos - (vel * 160) / px)); };
  el.addEventListener('pointerup', solta); el.addEventListener('pointercancel', solta);
  el.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); vai(sel + (e.key === 'ArrowLeft' ? -1 : 1)); } });
  pinta();
}
// proventos: o ano (fichas), importar e o gráfico mês a mês em que tocar num mês mostra quem pagou
// Proventos, refeito no jeito do Patrimônio (mas como subpágina): topo azul com voltar, calendário e olho; o recebido no período em destaque,
// a variação contra o período anterior e as barras do ano (o período aceso, o mês tocado com o valor); embaixo, Registrar e Importar
// e quem pagou no período, cada um com a sua parte.
function basTelaProventos() {
  const C = S.C; const vals = C.faturamento; const j = basJan(); const ult = S.year === NOW_Y ? NOW_M : 11; const sel = S.basProvMes != null ? S.basProvMes : j.ate;
  const soma = (de, ate) => { let t = 0; for (let m = Math.max(0, de); m <= Math.min(11, ate); m++) t += +vals[m] || 0; return t; };
  // mês tocado: o número grande, a variação e a frase passam a ser desse mês (contra o mês anterior)
  const um0 = S.basProvMes != null && S.basProvVis === 'hist'; const de0 = um0 ? sel : j.de; const ate0 = um0 ? sel : j.ate;
  const tot = soma(de0, ate0); const n = ate0 - de0 + 1; const ant = de0 - n >= 0 ? soma(de0 - n, de0 - 1) : null;
  const dif = ant != null ? tot - ant : null; const up = dif == null || dif >= 0; const pctv = ant > 0 ? Math.abs(dif) / ant : null;
  const mx = Math.max(1, ...vals);
  const barras = vals.map((v, i) => { const dentro = i >= j.de && i <= j.ate; return `<button class="${dentro ? 'in' : 'fora'}${i === sel ? ' on' : ''}${i > ult ? ' fut' : ''}" data-act="bas-prov-mes" data-m="${i}" style="--h:${v > 0 ? Math.max(6, (v / mx) * 78).toFixed(1) : 3}%" aria-label="${MES_LONGO[i]}: ${esc(brl(v))}" aria-pressed="${i === sel}">${i === sel && v > 0 ? `<small>${brl0(v)}</small>` : ''}<i></i><b>${MES[i][0]}</b></button>`; }).join('');
  // quem pagou no período: soma por ativo, com a parte de cada um
  // mês tocado: a lista mostra quem pagou naquele mês (tocar de novo volta ao período)
  const um = S.basProvMes != null && S.basProvVis === 'hist'; const ld = um ? sel : j.de; const la = um ? sel : j.ate; const tl = um ? soma(sel, sel) : tot; const frase = um ? `em ${MES_LONGO[sel]}` : basJanFrase();
  const L = S.plan.ativos.map((a) => { let t = 0; for (let m = ld; m <= la; m++) t += +a.pr[m] || 0; return { a, t }; }).filter((x) => Math.abs(x.t) > 0.005).sort((x, y) => y.t - x.t);
  // roleta (padrão): cada provento do período é um traço do arco; o total no centro; girar com o dedo passa de um em um
  const rlE = []; for (let m = j.de; m <= j.ate; m++) S.plan.ativos.map((a) => [a, +a.pr[m] || 0]).filter((x) => x[1] > 0.005).sort((x, y) => y[1] - x[1]).forEach(([a, v]) => rlE.push([a.nome, cap(MES_LONGO[m]), basCent(v), basIniciais(a.nome), v]));
  const rlMx = Math.max(1, ...rlE.map((e) => e[4])); const rlTot = soma(j.de, j.ate);
  const roleta = `<div class="bas-rl" tabindex="0" role="slider" aria-label="Proventos ${esc(basJanFrase())}. Arraste para os lados ou use as setas." aria-valuemin="1" aria-valuemax="${Math.max(1, rlE.length)}" data-r="150" data-s="9" data-ini="${rlE.length - 1}" data-e="${esc(JSON.stringify(rlE.map((e) => e.slice(0, 4))))}">
      <span class="bas-rl-luz" aria-hidden="true"></span>
      <div class="bas-rl-c"><small>Recebido ${esc(basJanFrase())}</small><b>${basCent(rlTot)}</b><em>${rlE.length ? `${rlE.length} ${rlE.length === 1 ? 'provento' : 'proventos'}` : 'Nenhum provento'}</em></div>
      <div class="bas-rl-arco" aria-hidden="true">${rlE.map((e) => `<i style="--l:${(16 + 22 * (e[4] / rlMx)).toFixed(1)}px"></i>`).join('')}</div>
      <span class="bas-rl-knob" aria-hidden="true"></span></div>
    <div class="bas-rl-pill" data-rl-pill aria-hidden="true"></div>`;
  const vis = S.basProvVis === 'hist' ? 'hist' : 'roleta';
  const seg = `<div class="bas-rl-seg" role="group" aria-label="Visualização">${[['roleta', 'Roleta'], ['hist', 'Evolução']].map(([v, t]) => `<button data-act="bas-prov-vis" data-v="${v}" aria-pressed="${vis === v}">${t}</button>`).join('')}</div>`;
  const linha = (x, i) => `<li><button class="bas-pv2-l" ${basIr('provento', { id: x.a.id })}><span class="bas-pv2-ini" style="--bc:${PAL[i % 6]}">${esc(basIniciais(x.a.nome))}</span><span class="bas-pv2-n"><b>${esc(x.a.nome)}</b><small>${esc(x.a.classe || 'Ativo')}</small><i style="--p:${tl > 0 ? Math.max(3, (x.t / tl) * 100).toFixed(1) : 0}%"></i></span><b class="bas-pv2-v">${basCent(x.t)}</b></button></li>`;
  return `<div class="bas-pg bas-pg-prov"><div class="bas-gt-bg bas-pt-bg bas-pv2-bg">
    <header class="bas-pv2-h"><button class="bell bas-cal-b" data-act="bas-voltar" aria-label="Voltar">${I_VOLTA}</button><b>Proventos</b><span class="bas-noite-r"><button class="bell bas-cal-b" ${basIr('periodo')} aria-label="Período: ${esc(basJanRot())}, ${S.year}">${I_CAL}</button>${olhoHtml()}</span></header>
    ${seg}${vis === 'roleta' ? roleta : `<small class="bas-pv2-k">Recebido ${um0 ? `em ${MES_LONGO[sel]}` : esc(basJanFrase())}</small>
    <b class="bas-pv2-t">${basCent(tot)}</b>
    <p class="bas-pv2-var">${pctv != null ? `<span class="bas-ev-pct${up ? '' : ' neg'}">${up ? '↑' : '↓'} ${pct(pctv, 1)}</span>` : ''}<span>${dif != null ? `${up ? '+' : '−'}${brl0(Math.abs(dif))} contra ${um0 ? (sel ? MES_LONGO[sel - 1] : 'o mês anterior') : 'o período anterior'}` : `${S.year}`}</span></p>
    <div class="bas-pv2-g" role="group" aria-label="Proventos mês a mês. Toque num mês.">${barras}</div>`}
  </div><div class="bas-gt-folha">
    <div class="bas-pg-per bas-gt-acoes">${S.plan.ativos.length ? `<button class="bas-inv-pl" ${basIr('provento')}>${I.plus}<span>Registrar</span></button>` : ''}<button class="bas-circ bas-en-bt" data-act="bas-importar">${I_IMP}<span>Importar</span></button></div>
    ${L.length ? basSecao(`Quem pagou ${frase}`, `<small class="bas-pv2-q">${L.length} ${L.length === 1 ? 'ativo' : 'ativos'} · ${brl0(tl)}</small>`, `<ul class="card bas-pv2-ls">${L.map(linha).join('')}</ul>`) : basCard(basVazio(`Nenhum provento ${frase}.`))}
  </div></div>`;
}
// alvos da carteira, refeitos no visual novo: no alto o total dos alvos com a barra por classe e os atalhos; cada classe num
// cartão com o alvo dela contra o de hoje; cada ativo com o alvo (− campo +) e uma régua com o hoje (traço) e o alvo (preenchido)
function basTelaAlvos() {
  const A = S.plan.ativos; if (!A.length) return basDet('Seus alvos', basCard(basVazio('Registre um investimento primeiro.')));
  const { M } = cartAnalise(); const pos = {}; M.items.forEach((i) => { pos[i.a.id] = i; }); const total = M.items.reduce((s, i) => s + i.valor, 0);
  const grupos = {}; A.forEach((a) => { (grupos[a.classe || 'Outros'] = grupos[a.classe || 'Outros'] || []).push(a); });
  const cls = Object.keys(grupos).sort((x, y) => grupos[y].reduce((s, a) => s + ((pos[a.id] || {}).valor || 0), 0) - grupos[x].reduce((s, a) => s + ((pos[a.id] || {}).valor || 0), 0));
  const cor = (k) => BAS_CT_COR[k % BAS_CT_COR.length];
  return basForm('alvos', 'Seus alvos', `<div class="bas-al-top card"><div class="bas-al-tot"><small>Total dos alvos</small><b data-al-tot>0%</b><span class="bas-al-st" data-al-st></span></div>
      <span class="bas-al-seg" aria-hidden="true">${cls.map((c, k) => `<i data-al-seg="${k}" style="--bc:${cor(k)}"></i>`).join('')}</span>
      <div class="bas-al-at"><button type="button" data-act="bas-al-igual">Dividir igual</button><button type="button" data-act="bas-al-100">Fechar 100%</button><button type="button" data-act="bas-al-zero">Zerar</button></div></div>
    ${cls.map((c, k) => { const hojeC = total > 0 ? grupos[c].reduce((s, a) => s + ((pos[a.id] || {}).valor || 0), 0) / total : 0;
      return `<section class="bas-al-g card"><header><i style="--bc:${cor(k)}"></i><b>${esc(c)}</b><small>hoje ${pct(hojeC)} · alvo <em data-al-cls="${k}">0%</em></small></header>
      ${grupos[c].map((a) => { const e = cartEntry(E.ativoKey(a), false); const it = pos[a.id] || { valor: 0 }; const atual = total > 0 ? it.valor / total : 0;
        return `<div class="bas-al-l" style="--h:${(atual * 100).toFixed(1)}%;--bc:${cor(k)}"><div class="bas-al-lt"><span class="bas-n"><b>${esc(a.nome)}</b><small>${brl0(it.valor)} · hoje ${pct(atual)}</small></span>
          <span class="bas-al-in"><button type="button" data-act="bas-al-passo" data-d="-5" aria-label="Menos 5%">−</button><input name="a:${esc(a.id)}" data-al="${k}" inputmode="decimal" value="${e && e.alvo ? esc(String(e.alvo).replace('.', ',')) : ''}" placeholder="0" aria-label="Alvo de ${esc(a.nome)} em %"><i>%</i><button type="button" data-act="bas-al-passo" data-d="5" aria-label="Mais 5%">+</button></span></div>
          <span class="bas-al-rg" aria-hidden="true"><i></i><b></b></span></div>`; }).join('')}</section>`; }).join('')}
    <p class="bas-p bas-al-dica">O traço mostra quanto cada ativo pesa hoje; a barra, o alvo. Combine os alvos com o ${esc(primeiroNome())}.</p>`);
}
function basAlSoma() {
  const f = document.querySelector('.bas-form[data-t="alvos"]'); if (!f) return; const ins = [...f.querySelectorAll('input[data-al]')]; const v = (x) => { const n = parseFloat(String(x.value).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  const tot = ins.reduce((s, x) => s + v(x), 0); const porC = {}; ins.forEach((x) => { porC[x.dataset.al] = (porC[x.dataset.al] || 0) + v(x); });
  f.querySelector('[data-al-tot]').textContent = `${tot.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`; const b = f.querySelector('[data-al-bar]'); if (b) b.style.width = Math.min(100, tot) + '%';
  const ok = Math.abs(tot - 100) < 0.05; const st = f.querySelector('[data-al-st]'); st.textContent = ok ? 'Fechou 100%' : tot > 100 ? `${(tot - 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% a mais` : tot > 0 ? `Faltam ${(100 - tot).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : 'Comece pelo mais importante';
  f.querySelector('.bas-al-top').className = `bas-al-top card ${ok ? 'ok' : tot > 100 ? 'neg' : ''}`;
  Object.keys(porC).forEach((k) => { const el = f.querySelector(`[data-al-cls="${k}"]`); if (el) el.textContent = `${porC[k].toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`; const sg = f.querySelector(`[data-al-seg="${k}"]`); if (sg) sg.style.flexGrow = porC[k]; });
  ins.forEach((x) => { const row = x.closest('.bas-al-l'); if (row) row.style.setProperty('--p', Math.min(100, v(x)) + '%'); });
}
function basAlAcao(act, el) {
  const f = document.querySelector('.bas-form[data-t="alvos"]'); if (!f) return; const ins = [...f.querySelectorAll('input[data-al]')]; const v = (x) => { const n = parseFloat(String(x.value).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  const pr = (n) => (Math.round(n * 10) / 10).toLocaleString('pt-BR');
  if (act === 'bas-al-passo') { const x = el.parentElement.querySelector('input'); x.value = pr(Math.max(0, Math.min(100, v(x) + +el.dataset.d))); }
  else if (act === 'bas-al-igual') ins.forEach((x) => { x.value = pr(100 / ins.length); });
  else if (act === 'bas-al-zero') ins.forEach((x) => { x.value = ''; });
  else { const t = ins.reduce((s, x) => s + v(x), 0); if (t > 0) ins.forEach((x) => { x.value = v(x) ? pr((v(x) / t) * 100) : ''; }); }
  // o arredondamento a uma casa pode sobrar ou faltar 0,1: a diferença vai para o maior, para fechar 100%
  if (act === 'bas-al-igual' || act === 'bas-al-100') { const d = Math.round((100 - ins.reduce((s, x) => s + v(x), 0)) * 10) / 10; const m = ins.reduce((a, x) => (v(x) > v(a) ? x : a), ins[0]); if (d && m && v(m)) m.value = pr(v(m) + d); }
  basSom('toque'); basAlSoma();
}
document.addEventListener('input', (e) => { if (e.target.matches && e.target.matches('input[data-al]')) basAlSoma(); });
// Gastos: para onde foi o dinheiro (fixas e variáveis, e as áreas contra a média) e limites por área (em segmentos), como no SaaS
// "Para onde foi o dinheiro": a barra do topo mostra as categorias nas mesmas cores das linhas; cada linha tem
// as iniciais, quantos lançamentos e a parte do total, e a barra dela (ou o uso do limite, na cor da situação)
function basOndeHtml() {
  const j = basJan(); const G = basAnalise(j.n === 1 ? j.de : -1, j.de, j.ate); const m = j.ate;
  const g = E.gastosAreaMes(S.plan, E.carryItems(S.plans, S.year), m); const L = E.analiseLimites(S.plan.settings.limites || {}, g); const limDe = (a) => L.find((x) => E.norm(x.area) === E.norm(a));
  const areas = (G.porArea || []).filter((a, i) => a.total > 0 && (i < 6 || limDe(a.nome))); if (!areas.length) return '';
  const mx = areas[0].total; const tot = areas.reduce((s, a) => s + a.total, 0);
  const semLim = Object.keys(g).sort((a, b) => g[b] - g[a]).filter((a) => !limDe(a)).slice(0, 4);
  return basSecao('Para onde foi o dinheiro', '', `<div class="card bas-onde bas-onde2"><span class="bas-onde-b" aria-hidden="true">${areas.map((a, i) => `<i style="flex:${a.total.toFixed(2)};--bc:${PAL[i % 6]}"></i>`).join('')}</span>
    ${areas.map((a, i) => { const l = limDe(a.nome); const c = PAL[i % 6];
      return `<button class="bas-onde-a${l ? ' ' + l.sit : ''}" ${basIr('categoria', { area: a.nome })}><span class="bas-ini bas-catic-i" aria-hidden="true" style="--bc:${c}">${basCatIc(a.nome)}</span><span class="bas-n"><span class="bas-onde-h"><b>${esc(a.nome)}</b><b>${brl0(a.total)}</b></span>
        ${l ? `<small class="bas-onde-s">${brl0(l.gasto)} de ${brl0(l.limite)} · ${l.sit === 'passou' ? `passou ${brl0(-l.falta)}` : `cabem ${brl0(l.falta)}`}</small><span class="bas-onde-t lim"><i style="width:${(Math.min(1, l.uso) * 100).toFixed(1)}%"></i></span>`
          : `<small class="bas-onde-s">${a.qtd} ${a.qtd === 1 ? 'lançamento' : 'lançamentos'} · ${pct(a.total / tot)} do total</small><span class="bas-onde-t"><i style="width:${((a.total / mx) * 100).toFixed(1)}%;--bc:${c}"></i></span>`}</span></button>`; }).join('')}
    ${semLim.length ? `<div class="bas-lim-add"><small>Pôr limite em</small>${semLim.map((a) => `<button ${basIr('limite', { area: a })}>${I.plus}${esc(a)}</button>`).join('')}</div>` : ''}</div>`);
}
function basLimitesHtml() {
  const j = basJan(); const m = j.ate; const lim = S.plan.settings.limites || {}; const g = E.gastosAreaMes(S.plan, E.carryItems(S.plans, S.year), m); const L = E.analiseLimites(lim, g);
  const top = Object.keys(g).sort((a, b) => g[b] - g[a]).filter((a) => !L.some((x) => E.norm(x.area) === E.norm(a))).slice(0, 4);
  const seg = (u, sit) => `<span class="bas-lim-seg ${sit}" aria-hidden="true">${Array.from({ length: 10 }, (_, k) => `<i class="${u * 10 > k + 0.001 ? 'on' : ''}"></i>`).join('')}</span>`;
  return basSecao(`Limites de ${MES_LONGO[m]}`, '', `<div class="card bas-lim">${L.length ? L.map((x) => `<button class="bas-lim-l ${x.sit}" ${basIr('limite', { area: x.area })}><span class="bas-lim-h"><b>${esc(x.area)}</b><span>${brl0(x.gasto)} <small>de ${brl0(x.limite)}</small></span></span>${seg(Math.min(1, x.uso), x.sit)}<small class="bas-lim-s">${x.sit === 'passou' ? `Passou ${brl0(-x.falta)}` : x.sit === 'perto' ? `Perto do limite · cabem ${brl0(x.falta)}` : `Cabem ${brl0(x.falta)}`}</small></button>`).join('') : '<p class="bas-p bas-p0">Defina quanto gastar no máximo em uma categoria e acompanhe aqui, com aviso perto do limite.</p>'}
    ${top.length ? `<div class="bas-lim-add"><small>Pôr limite em</small>${top.map((a) => `<button ${basIr('limite', { area: a })}>${I.plus}${esc(a)}</button>`).join('')}</div>` : ''}</div>`);
}
// saúde financeira: o rostinho minimalista que muda com a nota (olhos piscam, a boca sorri ou se preocupa)
// o rosto da saúde: esfera de vidro na cor da nota (vermelho, âmbar, verde: os tons vivos `--bas-noite-*`, iguais nos dois temas, misturados), boca e olhos que mudam aos poucos com a nota,
// pisca, olha em volta, segue o dedo ou o mouse e dá um pulinho ao toque
function basRosto(nota, tam) {
  const sem = nota == null; const n = sem ? 60 : Math.max(0, Math.min(100, nota)); const cls = sem ? 'sem' : n >= 80 ? 'ok' : n >= 60 ? 'atencao' : 'baixo';
  const cor = sem ? 'var(--ink-3)' : n >= 60 ? `color-mix(in oklab, var(--bas-noite-pos) ${Math.round(((n - 60) / 40) * 100)}%, var(--bas-noite-warn))` : `color-mix(in oklab, var(--bas-noite-warn) ${Math.round((n / 60) * 100)}%, var(--bas-noite-neg))`;
  const k = sem ? 0 : n >= 55 ? (n - 55) * 0.3 : (n - 55) * 0.2; // curva da boca: de -11 (triste) a +13,5 (feliz)
  const y = k < 0 ? 66 : 64;
  const boca = k >= 8 ? `<path class="bas-rosto-b cheia" d="M35 61 Q50 ${(61 + k * 1.45).toFixed(1)} 65 61 Q50 ${(61 + k * 0.5).toFixed(1)} 35 61Z"/>` : `<path class="bas-rosto-b" d="M37 ${y} Q50 ${(y + k).toFixed(1)} 63 ${y}"/>`;
  const ry = n < 40 ? 4.4 : 5.4;
  const olhos = n >= 90 && !sem ? '<path class="bas-rosto-arc" d="M31 46 Q37 39.5 43 46M57 46 Q63 39.5 69 46"/>' : `<ellipse cx="37" cy="44" rx="3.6" ry="${ry}"/><ellipse cx="63" cy="44" rx="3.6" ry="${ry}"/>`;
  const sob = !sem && n < 45 ? '<path class="bas-rosto-s" d="M30 37.5 Q35.5 36.5 41 33.5M70 37.5 Q64.5 36.5 59 33.5"/>' : '';
  return `<span class="bas-rosto ${cls}" style="--t:${tam || 96}px;--c:${cor}" aria-hidden="true"><i class="bas-rosto-esf"></i><svg viewBox="0 0 100 100"><ellipse class="bas-rosto-luz" cx="38" cy="25" rx="17" ry="8.5"/><circle class="bas-rosto-aro" cx="50" cy="50" r="41.2"/>
    <g class="bas-rosto-m"><g class="bas-rosto-o">${olhos}</g>${sob}<g class="bas-rosto-bw">${boca}</g></g></svg></span>`;
}
// o rosto acompanha o dedo ou o mouse (olhos até 3 unidades, cabeça até 6°); um quadro por vez, parado com "reduzir movimento"
let basRostoQ = 0;
document.addEventListener('pointermove', (e) => {
  if (basRostoQ || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  basRostoQ = requestAnimationFrame(() => {
    basRostoQ = 0;
    document.querySelectorAll('.bas-rosto').forEach((r) => {
      const b = r.getBoundingClientRect(); if (!b.width) return;
      const dx = Math.max(-1, Math.min(1, (e.clientX - b.left - b.width / 2) / 220)); const dy = Math.max(-1, Math.min(1, (e.clientY - b.top - b.height / 2) / 220));
      r.style.setProperty('--ox', (dx * 3).toFixed(2) + 'px'); r.style.setProperty('--oy', (dy * 2.5).toFixed(2) + 'px'); r.style.setProperty('--rz', (dx * 6).toFixed(1) + 'deg');
    });
  });
}, { passive: true });
document.addEventListener('pointerdown', (e) => {
  const r = e.target.closest && e.target.closest('.bas-sd-r, .bas-sdx-scan'); const f = r && r.querySelector('.bas-rosto'); if (!f) return;
  f.classList.remove('pulo'); void f.offsetWidth; f.classList.add('pulo');
}, { passive: true });
function basSaudeResumo(H) {
  const frase = H.nota == null ? voz('bas_vazio') : voz(H.nota >= 80 ? 'bas_saude_bom' : H.nota >= 60 ? 'bas_saude_med' : 'bas_saude_baixo');
  return basSecao('Sua saúde financeira', '', `<button class="card bas-sd-r" ${basIr('saude')}>${basRosto(H.nota, 76)}<span class="bas-n"><b>${H.nota == null ? 'Sem nota ainda' : `${H.nota} de 100`}</b><small>${frase}</small><span class="bas-sd-ver">Ver a análise completa ${I.chev}</span></span></button>`);
}
const BAS_SD_DICA = {
  reserva: { ok: 'Sua reserva cobre imprevistos com folga. O que passar disso pode ir para objetivos de prazo maior.', atencao: 'Faltam alguns meses para a reserva ideal. Priorize completá-la antes de investir em algo mais arriscado.', baixo: 'A reserva ainda é curta. Separe um valor fixo todo mês só para ela.' },
  poupanca: { ok: 'Você guarda uma boa parte do que entra. Mantenha o hábito.', atencao: 'Sobra um pouco a cada mês. Procure os gastos que mais cresceram na aba Gastos.', baixo: 'Está sobrando pouco. Um limite por categoria ajuda a enxergar onde cortar.' },
  fixos: { ok: 'As contas fixas deixam espaço para o resto da vida.', atencao: 'Boa parte da renda já tem destino todo mês. Reveja assinaturas e parcelas.', baixo: 'As contas fixas pesam muito. Renegociar uma delas libera fôlego todo mês.' },
  sonho: { ok: 'O sonho principal está no ritmo certo.', atencao: 'No ritmo de hoje o sonho atrasa. O simulador mostra quanto a mais resolve.', baixo: 'Com o ritmo atual o sonho fica fora de alcance. Vale rever o valor, o prazo ou o aporte.' },
};
function basTelaSaude() {
  const ult = S.year === NOW_Y ? NOW_M : 11; const H = basSaude(ult); const passos = ['Lendo suas entradas e gastos', 'Medindo a reserva', 'Calculando quanto sobra', 'Pesando as contas fixas', 'Conferindo o sonho principal'];
  const nomes = { reserva: 'Reserva', poupanca: 'Sobra do ano', fixos: 'Contas fixas', sonho: 'Sonho principal' }; const val = { reserva: (x) => `${x.valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} meses`, poupanca: (x) => pct(x.valor), fixos: (x) => pct(x.valor), sonho: (x) => pct(x.valor) };
  const ir = { reserva: 'data-act="bas-aba" data-v="investir"', poupanca: 'data-act="bas-aba" data-v="gastos"', fixos: 'data-act="bas-aba" data-v="gastos"', sonho: basIr('sonhos') };
  const metaF = { reserva: (x) => Math.min(1, (x.valor || 0) / 6), poupanca: (x) => Math.min(1, Math.max(0, (x.valor || 0) / 0.3)), fixos: (x) => Math.min(1, Math.max(0, 1 - (x.valor || 0))), sonho: (x) => Math.min(1, x.valor || 0) };
  return basDet('Saúde financeira', `<section class="bas-sdx"><div class="bas-sdx-scan">${basRosto(H.nota, 132)}<span class="bas-sdx-luz" aria-hidden="true"></span></div>
      <ol class="bas-sdx-p">${passos.map((t, i) => `<li style="--i:${i}"><i aria-hidden="true">${I.check}</i>${t}</li>`).join('')}</ol>
      <div class="bas-sdx-n" style="--i:${passos.length}"><b>${H.nota == null ? '–' : H.nota}</b><small>de 100</small><p>${H.nota == null ? voz('bas_vazio') : voz(H.nota >= 80 ? 'bas_saude_bom' : H.nota >= 60 ? 'bas_saude_med' : 'bas_saude_baixo')}</p></div></section>
    ${H.itens.map((x, i) => `<button class="card bas-sdx-i ${x.sit}" ${ir[x.id]} style="--i:${passos.length + 1 + i}"><span class="bas-sdx-ih"><b>${nomes[x.id]}</b><em>${BAS_SIT[x.sit]}</em></span>
      <span class="bas-sdx-iv">${x.valor == null ? '–' : val[x.id](x)}</span><span class="bas-sdx-g" aria-hidden="true"><i style="width:${x.valor == null ? 0 : (metaF[x.id](x) * 100).toFixed(1)}%"></i></span>
      <small>${x.sit === 'sem' ? 'Anote entradas e gastos para medir.' : esc((BAS_SD_DICA[x.id] || {})[x.sit === 'ok' ? 'ok' : x.sit] || '')}</small><span class="bas-sd-ver">Agir agora ${I.chev}</span></button>`).join('')}
    <p class="bas-disc keep">Uma leitura simples dos seus números, não uma recomendação de investimento.</p>`);
}

/* ---- Planejamento: metas, ponto de partida, limites, minhas instituições e anos (o grupo Planejamento do SaaS, no jeito de celular) ---- */
const I_PLANO = ic('<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>');
function basTelaPlanejamento() {
  const st = S.plan.settings; const lim = st.limites || {}; const areas = Object.keys(lim).filter((a) => +lim[a] > 0); const livres = BAS_AREAS.filter((a) => !areas.includes(a));
  const tile = (t, ic0, nome, v, vazio) => `<button class="bas-pj-t" ${basIr(t)}><span class="bas-pj-ic" aria-hidden="true">${ic0}</span><small>${nome}</small>${v != null && v > 0 ? `<b>${brl0(v)}</b>` : `<b class="vz">${vazio}</b>`}</button>`;
  const metas = `<div class="bas-pj-g">${tile('meta', I.inv, 'Investir por mês', +st.metaAporte, 'Definir')}${tile('limite', I.despesas, 'Gastar no máximo', +st.orcPadrao, 'Definir')}
    ${tile('ponto', I_META, `Meta de ${S.year}`, +st.metaInvAno, 'Soma dos meses')}${tile('ponto', I.cart, 'Patrimônio inicial', st.patrimonioInicial, 'Automático')}</div>`;
  const limites = `<div class="card bas-pj-lim">${areas.length ? `<ul class="bas-ativ">${areas.map((a) => basRow(basIr('limite', { area: a }), esc(a.slice(0, 1)), esc(a), `${brl(+lim[a])} por mês`, I.chev)).join('')}</ul>` : '<p class="bas-p">Nenhuma categoria com limite. O app avisa a 80% e quando passar.</p>'}
    ${livres.length ? `<div class="bas-lim-add"><small>Pôr limite em</small>${livres.map((a) => `<button ${basIr('limite', { area: a })}>${I.plus}${esc(a)}</button>`).join('')}</div>` : ''}</div>`;
  const e = S.profile.instEstilo || 'auto';
  const inst = `<div class="card bas-pj-inst"><div class="bas-pj-ig">${INSTITUICOES.map(([id, nome]) => `<label class="bas-pj-i"><input type="checkbox" data-bas-inst="${id}" ${instMinhas().includes(id) ? 'checked' : ''}>${instIcone(id)}<span>${esc(nome)}</span><i class="bas-pj-ok" aria-hidden="true">${I.check}</i></label>`).join('')}</div>
</div>`;
  const n = instMinhas().length;
  return basDet('Planejamento', `<p class="bas-p">Metas, limites e o que o app usa para fazer as contas de ${S.year}.</p>${basSecao('Metas', '', metas)}${basSecao('Limites por categoria', '', limites)}
    ${basSecao('Minhas instituições', `<small class="bas-pj-n">${n ? `${n} ${n === 1 ? 'marcada' : 'marcadas'}` : 'Nenhuma'}</small>`, `<p class="bas-p">Marque os bancos e cartões que você usa. Só eles aparecem ao lançar um gasto.</p>${inst}`)}
    ${basSecao('Mais', '', `<ul class="bas-ativ">${basRow(basIr('sonhos'), I_META, 'Meus sonhos', `${objLista().length} ${objLista().length === 1 ? 'sonho' : 'sonhos'}`, I.chev)}${basRow(basIr('ano'), I.relatorio, 'Anos do planejamento', `Aberto: ${S.year}`, I.chev)}</ul>`)}`);
}
// excluir a conta: pede para escrever EXCLUIR; a gravação chama excluirConta (core.js), que apaga no banco e neste aparelho
const basTelaExcluir = () => basForm('excluir', 'Excluir minha conta', `<p class="bas-p">Isso apaga o cadastro, o perfil, o diagnóstico, todos os anos de planejamento e a assinatura. Não dá para desfazer.</p>
  <p class="bas-p">Quer guardar uma cópia? Use antes “Baixar meus dados”, no Perfil.</p>${basCampo('conf', 'Para confirmar, escreva EXCLUIR', '', 'autocomplete="off" autocapitalize="characters" data-foco')}`, { ok: 'Excluir para sempre' });
function basTelaPonto() {
  const st = S.plan.settings;
  return basForm('ponto', 'Ponto de partida', `${basValor('patr', st.patrimonioInicial, `Quanto você tinha investido no início de ${S.year}?`)}<p class="bas-p">Deixe vazio para o app calcular sozinho: o patrimônio informado mais os aportes dos anos anteriores.</p>
    ${basValor('anual', +st.metaInvAno || 0, `Meta de investimento de ${S.year}`)}<p class="bas-p">Opcional. Vazio, vale a soma das metas de cada mês.</p>`);
}
// o consultor abre a tela Clientes do SaaS, como é, pelo fim do Perfil
const basTelaClientes = () => basDet('Clientes', `<div class="bas-clientes">${viewClientes()}</div>`);
document.addEventListener('change', (e) => { const t = e.target; if (!t.matches || !t.matches('input[data-bas-inst]')) return; instMinhaAlternar(t.dataset.basInst, t.checked); basSom('toque');
  const n = instMinhas().length; const c = document.querySelector('.bas-pj-n'); if (c) c.textContent = n ? `${n} ${n === 1 ? 'marcada' : 'marcadas'}` : 'Nenhuma'; });
/* ================= Configurações (engrenagem do Perfil) ================= */
// preferências do jeito de app em prefs.cf: tamanho do texto e cantos (atributos no <html>), vibração (filtra navigator.vibrate), notificações
const BAS_TEXTO = [['p', 'Pequeno', 14], ['m', 'Padrão', 16], ['g', 'Grande', 18.5], ['xg', 'Enorme', 21]];
const BAS_CANTOS = [['redondo', 'Arredondado'], ['suave', 'Suave'], ['reto', 'Reto']];
const BAS_AVISOS = [['contas', 'Contas a vencer', 'Um dia antes do vencimento', '#FF9F43', '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>'],
  ['resumo', 'Resumo do mês', 'Quanto entrou, saiu e sobrou', '#3EA6FF', '<path d="M5 19V11M12 19V5M19 19v-6"/>'],
  ['prov', 'Proventos', 'Quando um dividendo cair', '#2FD4C0', '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.2c0-1.2 1.1-1.8 2.5-1.8s2.5.6 2.5 1.7c0 2.6-5 1.2-5 3.8 0 1.1 1.1 1.7 2.5 1.7s2.5-.6 2.5-1.8"/>'],
  ['dicas', 'Dicas do assistente', 'O que ele notou nos seus gastos', '#B79CFF', '<path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>']];
const I_ENG = ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>');
const I_CF = { ap: ic('<path d="M14.5 4.5l5 5L10 19H5v-5z"/><path d="M12.5 6.5l5 5"/>'), id: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/>'),
  voz: ic('<path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h0A2 2 0 0 1 5 14z"/>'), not: ic('<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>'),
  priv: ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'), seg: ic('<path d="M12 3l7 3v5.5c0 4.3-3 7.6-7 9.5-4-1.9-7-5.2-7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  vib: ic('<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M4 9v6M20 9v6"/>'), baixa: ic('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>'), doc: ic('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>'),
  sair: ic('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10"/>'), lixo: ic('<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>'), sol: ic('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
  lua: ic('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'), ok: ic('<path d="m6 12.5 4 4 8-9"/>') };
function basCf() {
  const p = S.profile.prefs; p.cf = Object.assign({ texto: 'm', cantos: 'redondo', topo: 'azul', vibrar: true, push: false }, p.cf);
  p.cf.avisos = Object.assign({ contas: true, resumo: true, prov: true, dicas: false }, p.cf.avisos); return p.cf;
}
function basAplicarAp() {
  if (!S.profile || !S.profile.prefs) return; const c = basCf(); const h = document.documentElement;
  if (h.dataset.texto !== c.texto) h.dataset.texto = c.texto; if (h.dataset.cantos !== c.cantos) h.dataset.cantos = c.cantos; if (h.dataset.topo !== c.topo) h.dataset.topo = c.topo;
  // vibração desligada: um filtro único em navigator.vibrate vale para todos os toques do app
  try { if (navigator.vibrate && !navigator.vibrate.basCf) { const v = navigator.vibrate.bind(navigator); const f = (x) => (S.profile && S.profile.prefs.cf && S.profile.prefs.cf.vibrar === false ? false : v(x)); f.basCf = 1; navigator.vibrate = f; } } catch (e) { /* ignora */ }
}
const basEscuro = () => { const p = S.profile.prefs; const t = p.tema || 'auto'; return t === 'auto' ? escuroAgora() : t === 'oled' || (t === 'custom' && !!p.custom && p.custom.base === 'oled'); };
const basCfSw = (act, on, rot, extra) => `<button class="bas-cf-sw" role="switch" aria-checked="${!!on}" aria-label="${esc(rot)}" data-act="${act}"${extra || ''}><i>${I_CF.ok}</i></button>`;
// linha da lista: ícone num quadrado colorido, nome e resumo; à direita a seta (linha que abre) ou um controle (linha fixa)
const basCfLi = (abre, cor, icone, nome, sub, dir) => { const tag = abre ? 'button' : 'div'; return `<li><${tag} class="bas-cf-li" ${abre || ''}><span class="bas-cf-ic" style="--c:${cor}" aria-hidden="true">${icone}</span><span class="bas-cf-nm"><b>${nome}</b>${sub ? `<small>${sub}</small>` : ''}</span>${dir == null ? I.chev : dir}</${tag}></li>`; };
const basCfH = (t, dir) => `<div class="bas-cf-hh"><h3 class="bas-cf-h">${t}</h3>${dir ? `<span>${dir}</span>` : ''}</div>`;
const basCfPg = (cls, tit, sub, hero, folha) => basPgAzul(`bas-pg-cf ${cls}`, tit, `<p class="bas-cf-sub">${sub}</p>${hero}`, folha);
// o céu do modo: sol e nuvens de dia, lua e estrelas à noite (a troca anima antes de redesenhar)
const basCeu = (noite) => `<span class="bas-cf-ceu${noite ? ' noite' : ''}" aria-hidden="true"><i class="e1"></i><i class="e2"></i><i class="e3"></i><i class="n1"></i><i class="n2"></i><i class="astro"></i></span>`;
function basTelaConfig() {
  const p = S.profile.prefs; const c = basCf(); const t = p.tema || 'auto'; const noite = basEscuro(); const k = typeof temaCustom === 'function' ? temaCustom() : { cor: '' };
  const cor = (t === 'custom' || (t === 'auto' && p.manual === 'custom')) && k.cor ? ((CORES_DESTAQUE.find(([x]) => x.toLowerCase() === k.cor.toLowerCase()) || [])[1] || 'Sua cor') : 'Azul Cifrão';
  const nAv = Object.values(c.avisos).filter(Boolean).length;
  const hero = `<button class="bas-cf-modo" data-act="bas-cf-modo" role="switch" aria-checked="${noite}" aria-label="Modo escuro"><span class="bas-cf-mic" aria-hidden="true">${noite ? I_CF.lua : I_CF.sol}</span>
    <span class="bas-cf-mt"><b>${noite ? 'Modo escuro' : 'Modo claro'}</b><small>${t === 'auto' ? 'Automático, segue o celular' : noite ? 'Toque para o claro' : 'Toque para o escuro'}</small></span>${basCeu(noite)}</button>`;
  const folha = `${basCfH('Personalização')}<ul class="card bas-cf-l">${basCfLi(basIr('config-ap'), '#8B7CFF', I_CF.ap, 'Aparência', `${c.topo === 'tema' ? 'Topo na cor do tema' : 'Topo azul'} · Texto ${BAS_TEXTO.find((x) => x[0] === c.texto)[1].toLowerCase()} · ${BAS_CANTOS.find((x) => x[0] === c.cantos)[1]}`)}
      ${basCfLi(basIr('config-id'), '#3EA6FF', I_CF.id, 'Idioma', `<span translate="no">${esc((IDIOMAS.find((x) => x[0] === idiomaAtual()) || IDIOMAS[0])[1])}</span>`)}</ul>
    ${basCfH('Alertas')}<ul class="card bas-cf-l">${basCfLi(basIr('config-not'), '#FF9F43', I_CF.not, 'Notificações', c.push ? `${nAv} ${nAv === 1 ? 'aviso ligado' : 'avisos ligados'}` : 'Pausadas')}</ul>
    ${basCfH('Privacidade e segurança')}<ul class="card bas-cf-l">${basCfLi(basIr('config-priv'), '#34C759', I_CF.priv, 'Privacidade', S.privado ? 'Valores escondidos · Seus dados' : 'Valores à mostra · Seus dados')}
      ${basCfLi(basIr('config-seg'), '#5B8CFF', I_CF.seg, 'Segurança', 'Sessão e conta')}</ul>`;
  return basCfPg('', 'Configurações', 'Deixe o Cifrão com a sua cara.', hero, folha);
}
function basTelaConfigAp() {
  const p = S.profile.prefs; const c = basCf(); const t = p.tema || 'auto'; const k = typeof temaCustom === 'function' ? temaCustom() : { cor: '' }; const custom = t === 'custom' || (t === 'auto' && p.manual === 'custom');
  const tm = (v) => (t === 'custom' ? (p.custom && p.custom.base === 'oled' ? 'oled' : 'light') : t) === v;
  const hero = `<div class="bas-ap-prev" aria-hidden="true"><span class="bas-ap-pk">Entrou em novembro</span><b>R$ 13.237<span>,00</span></b><span class="bas-ap-pg"><i style="--h:40%"></i><i style="--h:62%"></i><i style="--h:48%"></i><i class="on" style="--h:88%"></i><i style="--h:30%"></i></span><span class="bas-ap-pb">Nova entrada</span></div>`;
  const ti = Math.max(0, ['auto', 'light', 'oled'].findIndex(tm));
  // tema: uma pílula com a marca que desliza até a opção; cor do topo: o degradê azul ou a cor do tema (um tom acima do fundo)
  const folha = `${basCfH('Tema', t === 'auto' ? 'Automático' : basEscuro() ? 'Escuro' : 'Claro')}<div class="bas-ap-seg" role="radiogroup" aria-label="Tema" style="--i:${ti}"><span class="bas-ap-th" aria-hidden="true"></span>${[['auto', 'Automático', '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'], ['light', 'Claro', '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'], ['oled', 'Escuro', '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>']].map(([v, n, d], i) => `<button role="radio" data-act="bas-ap-tema" data-v="${v}" data-i="${i}" aria-checked="${i === ti}">${ic(d)}<span>${n}</span></button>`).join('')}</div>
    ${basCfH('Cor do topo', c.topo === 'tema' ? 'Cor do tema' : 'Azul Cifrão')}<div class="bas-ap-op bas-ap-topo" role="group" aria-label="Cor do topo">${[['azul', 'Azul Cifrão'], ['tema', 'Cor do tema']].map(([v, n]) => `<button data-act="bas-cf" data-k="topo" data-v="${v}" aria-pressed="${c.topo === v}"><span class="bas-ap-tp ${v}" aria-hidden="true"><i></i><i></i><b></b></span>${n}</button>`).join('')}</div>
    ${basCfH('Tamanho do texto', BAS_TEXTO.find((x) => x[0] === c.texto)[1])}<div class="bas-ap-tx" role="group" aria-label="Tamanho do texto">${BAS_TEXTO.map(([v, n, px]) => `<button data-act="bas-cf" data-k="texto" data-v="${v}" aria-label="${n}" aria-pressed="${c.texto === v}"><span style="font-size:${px}px">Aa</span></button>`).join('')}</div>
    ${basCfH('Estilo', BAS_CANTOS.find((x) => x[0] === c.cantos)[1])}<div class="bas-ap-op" role="group" aria-label="Estilo dos cantos">${BAS_CANTOS.map(([v, n]) => `<button data-act="bas-cf" data-k="cantos" data-v="${v}" aria-pressed="${c.cantos === v}"><span class="bas-ap-mk st ${v}" aria-hidden="true"><i class="ac"></i></span>${n}</button>`).join('')}</div>`;
  return basCfPg('bas-pg-ap', 'Aparência', 'O app muda na hora, enquanto você escolhe.', hero, folha);
}
function basTelaConfigId() {
  // cada idioma aparece no próprio nome (não se traduz) e, embaixo, no idioma atual do app; tocar troca e recarrega
  const cur = idiomaAtual();
  const hero = `<div class="bas-id-hero"><b translate="no">${esc(OLA[cur] || 'Olá')}</b><small>O app inteiro muda para o idioma escolhido.</small></div>`;
  const folha = `${basCfH('Todos os idiomas')}<ul class="card bas-cf-l bas-id-l">${IDIOMAS.map(([c, n]) => `<li><button class="bas-cf-li" data-act="bas-idioma" data-v="${c}" aria-pressed="${c === cur}"><span class="bas-cf-nm"><b translate="no">${esc(n)}</b><small translate="no">${esc(idiomaNome(c))}</small></span>${c === cur ? `<span class="bas-id-ok" aria-label="Escolhido">${I_CF.ok}</span>` : ''}</button></li>`).join('')}</ul>`;
  return basCfPg('bas-pg-id', 'Idioma', 'A língua em que o app fala com você.', hero, folha);
}
function basTelaConfigNot() {
  const c = basCf(); const nega = typeof Notification !== 'undefined' && Notification.permission === 'denied';
  // prévia na tela de bloqueio: os avisos ligados aparecem empilhados, com o ícone do app; pausadas, o aviso some e fica o convite
  const EX = { contas: ['Conta de luz vence amanhã', 'R$ 182,40 no débito automático.'], resumo: ['Novembro fechou no azul', 'Sobraram R$ 4.924 para investir.'], prov: ['MXRF11 pagou proventos', 'Caíram R$ 38,20 na sua conta.'], dicas: ['O assistente notou algo', 'O delivery subiu 18% este mês.'] };
  const on = BAS_AVISOS.map((a) => a[0]).filter((k) => c.avisos[k]); const vivo = c.push && on.length; const ag = new Date();
  const icone = '<img class="bas-nt-ico" src="assets/img/icon-192.png" alt="">';
  const pilha = vivo ? on.slice(0, 3).map((k, i) => `<div class="bas-nt-n" style="--i:${i}">${icone}<span class="bas-nt-tx"><b>Cifrão<small>${i ? `há ${i * 12} min` : 'agora'}</small></b><em>${EX[k][0]}</em><span>${EX[k][1]}</span></span></div>`).join('')
    : `<div class="bas-nt-zz">${icone}<span class="bas-nt-tx"><b>Notificações pausadas</b><span>${c.push ? 'Ligue ao menos um aviso abaixo.' : 'Ligue abaixo para o Cifrão avisar você.'}</span></span></div>`;
  const hero = `<div class="bas-nt-ls${vivo ? '' : ' off'}" aria-hidden="true"><span class="bas-nt-hora">${String(ag.getHours()).padStart(2, '0')}:${String(ag.getMinutes()).padStart(2, '0')}</span><span class="bas-nt-dia">${esc(ag.toLocaleDateString(document.documentElement.lang || 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))}</span>
    <div class="bas-nt-pilha">${pilha}</div></div>`;
  const folha = `<ul class="card bas-cf-l">${basCfLi('', '#FF9F43', I_CF.not, 'Notificações no celular', c.push ? 'Ligadas neste aparelho' : nega ? 'Bloqueadas nos ajustes do celular' : 'Pausadas. Você não recebe nenhum aviso.', basCfSw('bas-cf-push', c.push, 'Notificações no celular'))}</ul>
    ${basCfH('Me avise sobre')}<ul class="card bas-cf-l${c.push ? '' : ' apagada'}">${BAS_AVISOS.map(([k, n, s, cor, d]) => basCfLi('', cor, ic(d), n, s, basCfSw('bas-cf-sw', c.avisos[k], n, ` data-k="avisos.${k}"`))).join('')}</ul>
    ${basCfH('Toque')}<ul class="card bas-cf-l">${basCfLi('', '#5B8CFF', I_CF.vib, 'Vibração', 'Um toque leve a cada ação', basCfSw('bas-cf-sw', c.vibrar, 'Vibração', ' data-k="vibrar"'))}</ul>`;
  return basCfPg('bas-pg-not', 'Notificações', 'Escolha o que merece um aviso.', hero, folha);
}
function basTelaConfigPriv() {
  const hero = `<div class="bas-sg-hero"><span class="bas-sg-ic" aria-hidden="true">${I_CF.priv}</span><span><b>Seus dados são só seus</b><small>Guardados na sua conta, com acesso só seu. Nada é vendido.</small></span></div>`;
  const folha = `<ul class="card bas-cf-l">${basCfLi('', '#34C759', I_CF.priv, 'Esconder valores', 'Os valores aparecem como •••• até você tocar no olho', basCfSw('bas-cf-priv', S.privado, 'Esconder valores'))}</ul>
    ${basCfH('Seus dados')}<ul class="card bas-cf-l">${basCfLi('data-act="backup"', '#3EA6FF', I_CF.baixa, 'Baixar meus dados', 'Uma cópia de tudo, em arquivo')}${basCfLi(basIr('privacidade'), '#8B7CFF', I_CF.doc, 'Privacidade e termos', 'O que fazemos com os seus dados')}</ul>`;
  return basCfPg('bas-pg-priv', 'Privacidade', 'Você decide o que aparece e o que fica guardado.', hero, folha);
}
function basTelaConfigSeg() {
  const e = S.profile.email || (S.user && S.user.email) || '';
  const hero = `<div class="bas-sg-hero"><span class="bas-sg-ic" aria-hidden="true">${I_CF.seg}</span><span><b>Conta protegida</b><small>${e ? `Entrada pelo e-mail ${esc(e)}` : 'Entrada pelo seu e-mail'}</small></span></div>`;
  const folha = `${basCfH('Sessão')}<ul class="card bas-cf-l">${basCfLi('data-act="bas-sair"', '#5B8CFF', I_CF.sair, 'Sair deste aparelho', 'Você entra de novo com o seu e-mail')}</ul>
    ${basCfH('Zona de cuidado')}<ul class="card bas-cf-l bas-cf-perigo">${basCfLi(basIr('excluir'), '#FF453A', I_CF.lixo, 'Excluir minha conta', 'Apaga a conta e todos os dados, sem volta')}</ul>`;
  return basCfPg('bas-pg-seg', 'Segurança', 'Quem entra na sua conta e como.', hero, folha);
}
// seu plano no Perfil: o nome em destaque e, abaixo, o próximo passo (o que o plano de cima libera) ou o que o seu já tem
function basPlanoCard() {
  const id = planoAtual(); const ped = pendente(); const demo = Store.mode === 'local'; const topo = id === 'completo'; const prox = id === 'gratis' ? 'investidor' : 'completo';
  const st = demo ? 'Demonstração' : S.isAdmin ? 'Acesso total' : ped ? `${nomePlano(ped)} em análise` : 'Ativo';
  const itens = (topo ? infoPlano('completo').itens.slice(1, 4) : infoPlano(prox).itens.slice(1, 4));
  const it = (x) => `<li><span aria-hidden="true">${topo ? I_CF.ok : I.plus}</span>${esc(x)}</li>`;
  return `<section class="bas-pl" aria-label="Seu plano"><div class="bas-pl-in"><span class="bas-pl-luz" aria-hidden="true"></span>
    <div class="bas-pl-t"><span>Seu plano</span><span class="bas-pl-st${ped ? ' esp' : ''}"><i></i>${esc(st)}</span></div>
    <b class="bas-pl-n">${esc(nomePlano(id))}</b><p class="bas-pl-r">${topo ? 'Tudo liberado. É isto que você tem:' : `Com o ${esc(nomePlano(prox))}, você também tem:`}</p>
    <ul class="bas-pl-it">${itens.map(it).join('')}</ul>
    ${topo ? `<button class="bas-pl-bt sec" data-act="contact">Falar com o ${esc(primeiroNome())}</button>` : ped ? '' : `<button class="bas-pl-bt" data-act="upgrade" data-plano="${prox}"><span>Conhecer o ${esc(nomePlano(prox))}</span><small>${esc(precoTxt(prox))}${precoPlano(prox) > 0 ? '/mês' : ''}</small></button>`}</div></section>`;
}

const BAS_TELAS = { importar: basTelaImportar, gasto: basTelaGasto, conta: basTelaConta, 'conta-f': basTelaContaF, entrada: basTelaEntrada, aporte: basTelaAporte, meta: basTelaMeta,
  objetivos: basTelaObjetivos, objetivo: basTelaObjetivo, 'sonho-novo': basTelaSonhoNovo, voz: basTelaVoz, categoria: basTelaCategoria, perfil: basTelaPerfil, config: basTelaConfig, 'config-ap': basTelaConfigAp, 'config-id': basTelaConfigId, 'config-not': basTelaConfigNot, 'config-priv': basTelaConfigPriv, 'config-seg': basTelaConfigSeg, contato: basTelaContato, ano: basTelaAno, 'ano-hist': basTelaAnoHist, ia: basTelaIa, saude: basTelaSaude, periodo: basTelaPeriodo, organizar: basTelaOrganizar, entradas: basTelaEntradas, sonhos: basTelaSonhos, 'sonho-det': basTelaSonhoDet, 'sonho-ed': basTelaSonhoEd, cartoes: basTelaCartoes, 'avisos-tela': basTelaAvisosNova, 'gasto-ver': basTelaGastoVer, 'cartao-novo': basTelaCartaoNovo, 'perfil-inv': basTelaPerfilInv, duvidas: () => basDet('Dúvidas', basDuvidasHtml()).replace(olhoHtml(), ''), cartao: basTelaCartao, retro: basTelaRetro, conquista: basTelaConquista, sequencia: basTelaSequencia, constelacao: basTelaConstelacao, 'cartao-estilo': basTelaCartaoEstilo, historico: basTelaHistorico, raiox: basTelaRaioX, resumo: basTelaResumo, limite: basTelaLimite, avisos: basTelaAvisos, simular: basTelaSimular, alvos: basTelaAlvos, ativo: basTelaAtivo, 'ativo-ed': basTelaAtivoEd, aportar: basTelaOndeInvestir, proventos: basTelaProventos, provento: basTelaProvento, carteira: basTelaCarteira, planejamento: basTelaPlanejamento, privacidade: () => basDet('Privacidade e termos', `<div class="card bas-pol">${politicaHtml(CFG, Store.mode === 'cloud')}</div>`), excluir: basTelaExcluir, ponto: basTelaPonto, clientes: basTelaClientes };

/* ================= gravação (no mesmo formato do Completo) ================= */
function basErro(f, msg) { const e = f.querySelector('.bas-err'); e.textContent = msg; e.hidden = false; return false; }
function basSalvar(f) {
  const t = basTopoPilha(); if (!t || t.t !== f.dataset.t) return;
  const d = Object.fromEntries(new FormData(f)); const p = S.plan; const m = S.mes; const val = (k) => parseReais(d[k] || '');
  { const ar = (d.areaNova || '').trim(); if (d.areaIc && ar) basCatIcGrava(ar, d.areaIc); } // ícone só para categoria nova
  const ok = (msg) => { basRetorno(t.t === 'aporte' || t.t === 'provento' ? 'pago' : 'ok'); touch(['perfil', 'objetivo', 'alvos'].includes(t.t) ? 'profile' : 'plan'); basFechar();
    // gasto ou investimento novo ganha a tela de sucesso; edições e o resto seguem no aviso
    const festa = ['gasto', 'conta', 'conta-f'].includes(t.t) && msg && !/atualizado/.test(msg) ? 'gasto' : t.t === 'aporte' && /^Aporte registrado em/.test(msg || '') ? 'inv' : '';
    if (festa) { const v = val(t.t === 'conta-f' && d.modo === 'parc' ? 'total' : 'valor'); const onde = (d.desc || d.nome || d.area || '').trim();
      basFesta(festa, festa === 'inv' ? 'Investimento registrado' : onde ? `Gasto anotado em ${onde}` : 'Gasto anotado', festa === 'inv' || msg !== 'Gasto anotado.' ? msg : '', v > 0 ? v : 0); } else if (msg) toast(msg); };
  switch (t.t) {
    case 'gasto': case 'conta': return basSalvarGasto(f, d, t, ok);
    case 'ativo-ed': return basSalvarAtivoEd(f, d, t, ok);
    case 'conta-f': {
      const it = t.id ? p.despesas.find((x) => x.id === t.id) : null; const nome = (d.nome || '').trim(); if (!nome) return basErro(f, 'Diga com o quê, como Aluguel.');
      const area = d.area || 'Contas';
      if (!it && d.modo === 'parc') { const total = val('total'); const n = parseInt(d.n, 10); if (!(total > 0)) return basErro(f, 'Informe o valor total da compra.'); if (!(n >= 1 && n <= 120)) return basErro(f, 'Informe de 1 a 120 parcelas.');
        p.despesas.push({ id: uid(), cat: basCat(false), area, sub: '', nome, inst: d.inst || '', valores: z12(), parcel: { total: E.r2(total), n, ano: S.year, mes: m } }); ok('Compra parcelada anotada.'); return; }
      // gasto de todo mês
      const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe o valor por mês.');
      const alvo = it || { id: uid(), cat: basCat(true), sub: '', inst: d.inst || '', valores: z12() }; Object.assign(alvo, { nome, area }); fillFrom(alvo.valores, E.r2(v), m); if (!it) p.despesas.push(alvo);
      ok(it ? 'Gasto atualizado.' : 'Gasto anotado todo mês até dezembro.'); return;
    }
    case 'entrada': {
      const r = t.id ? p.rendas.find((x) => x.id === t.id) : null; const v = val('valor'); const nome = (d.nome || '').trim();
      if (Number.isNaN(v) || v < 0 || (!r && !(v > 0))) return basErro(f, 'Informe quanto entrou, como 2.500,00.'); if (!nome) return basErro(f, 'Diga de onde veio, como Salário.');
      if (!p.rendaCats.length) p.rendaCats.push(...E.CATS_RENDA());
      const alvo = r || { id: uid(), cat: p.rendaCats[0].id, fonte: '', valores: z12() }; alvo.nome = nome; if (BAS_REN_IC[d.rendaIc]) alvo.icone = d.rendaIc; if (d.cat && p.rendaCats.some((c) => c.id === d.cat)) alvo.cat = d.cat; if (d.todo) fillFrom(alvo.valores, E.r2(v), m); else alvo.valores[m] = E.r2(v); if (!r) p.rendas.push(alvo);
      // só para gastos (benefício): guarda o cartão e põe ele nas Minhas instituições, para aparecer em "Pago com"
      if (d.uso === 'gasto') { alvo.soGasto = true; alvo.inst = instDe(d.inst) ? d.inst : 'ifood'; if (!instMinhas().includes(alvo.inst)) instMinhaAlternar(alvo.inst, true); } else { delete alvo.soGasto; delete alvo.inst; }
      ok(r ? 'Entrada atualizada.' : 'Entrada anotada.'); return;
    }
    case 'aporte': {
      if (!temRecurso('aporte_simples')) return false;
      const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe o valor, como 500,00.'); const sinal = d.op === '-1' ? -1 : 1;
      let a = t.id ? p.ativos.find((x) => x.id === t.id) : null;
      if (a) { a.ap[t.mes != null && t.mes !== '' ? +t.mes : m] = E.r2(sinal * v); ok('Registro atualizado.'); return; }
      // mesma regra do Novo aporte do SaaS: ativo que já tenho ou ativo novo (nome, tipo e classe), mês e valor somado ao do mês
      const mm = d.mes != null && d.mes !== '' ? Math.max(0, Math.min(11, +d.mes)) : m;
      if (d.modo === 'novo' || !p.ativos.length) { const tipo = d.tipo === 'RENDA FIXA' ? 'RENDA FIXA' : 'BOLSA DE VALORES'; const classe = matchCase(d.classe, suggest('classe', { tipo })); const nome = (d.nome || '').trim();
        if (!nome || !classe) return basErro(f, 'Preencha o nome e a classe do ativo novo.'); a = ativoInserir({ tipo, classe, grupo: null, subgrupo: null, nome }); }
      else { a = p.ativos.find((x) => x.id === d.ativo); if (!a) return basErro(f, 'Escolha o ativo.'); }
      a.ap[mm] = E.r2((+a.ap[mm] || 0) + sinal * v); const gS = sinal > 0 ? objFoco(objAnalise()) : null; ok(`${sinal > 0 ? 'Aporte' : 'Resgate'} registrado em ${a.nome}, ${MES_LONGO[mm]}.${gS ? ` Um passo a mais rumo a “${objNomeDe(gS)}”.` : ''}`); return;
    }
    case 'limite': {
      const v = d.valor && d.valor.trim() ? val('valor') : 0; if (Number.isNaN(v) || v < 0) return basErro(f, 'Informe um valor, como 3.000,00.'); const st = p.settings;
      if (t.area) { const lim = (st.limites = st.limites || {}); const k = Object.keys(lim).find((x) => E.norm(x) === E.norm(t.area)) || t.area; if (v > 0) lim[k] = E.r2(v); else delete lim[k]; }
      else { st.orcPadrao = E.r2(v); p.orcamento = new Array(12).fill(null); } // como o "aplicar a todos os meses" do SaaS
      ok(v > 0 ? 'Limite salvo.' : 'Limite tirado.'); return;
    }
    case 'alvos': {
      for (const a of p.ativos) { const raw = String(d['a:' + a.id] || '').trim(); const v = raw ? parseFloat(raw.replace(',', '.')) : 0; if (Number.isNaN(v) || v < 0 || v > 100) return basErro(f, `Alvo inválido em ${a.nome}. Use um número de 0 a 100.`); }
      p.ativos.forEach((a) => { const raw = String(d['a:' + a.id] || '').trim(); const v = raw ? parseFloat(raw.replace(',', '.')) : 0; const e = cartEntry(E.ativoKey(a), v > 0); if (e) e.alvo = E.r2(v); });
      ok('Alvos salvos.'); return;
    }
    case 'provento': {
      if (!temRecurso('proventos')) return false;
      const v = val('valor'); if (Number.isNaN(v) || v < 0 || (!t.id && !(v > 0))) return basErro(f, 'Informe o valor, como 35,20.');
      if (t.id) { const a = p.ativos.find((x) => x.id === t.id); if (a) a.pr[m] = E.r2(v); ok('Provento atualizado.'); return; }
      const a = p.ativos.find((x) => x.id === d.ativo); if (!a) return basErro(f, 'Escolha de qual investimento.'); const mm = d.mes != null && d.mes !== '' ? Math.max(0, Math.min(11, +d.mes)) : m;
      a.pr[mm] = E.r2((+a.pr[mm] || 0) + v); ok(`Provento de ${a.nome} registrado em ${MES_LONGO[mm]}.`); return;
    }
    case 'excluir': { if (String(d.conf || '').trim().toUpperCase() !== 'EXCLUIR') return basErro(f, 'Escreva EXCLUIR para confirmar.');
      basLimpar(); excluirConta().catch((e) => toast(e && e.amigavel ? e.message : 'Não foi possível excluir a conta agora.')); return; }
    case 'ponto': { const vp = d.patr && d.patr.trim() ? val('patr') : null; const va = d.anual && d.anual.trim() ? val('anual') : 0;
      if ((vp != null && (Number.isNaN(vp) || vp < 0)) || Number.isNaN(va) || va < 0) return basErro(f, 'Informe valores como 50.000,00.');
      p.settings.patrimonioInicial = vp == null ? null : E.r2(vp); p.settings.metaInvAno = E.r2(va); ok('Ponto de partida salvo.'); return; }
    case 'meta': { const v = d.valor && d.valor.trim() ? val('valor') : 0; if (Number.isNaN(v) || v < 0) return basErro(f, 'Informe um valor, como 500,00.');
      const ms = []; for (let m = 0; m < 12; m++) { const raw = String(d['m' + m] || '').trim(); const x = raw ? parseReais(raw) : null; if (x != null && (Number.isNaN(x) || x < 0)) return basErro(f, `Confira a meta de ${MES_LONGO[m]}.`); ms.push(x == null ? null : E.r2(x)); }
      p.settings.metaAporte = E.r2(v); p.metasAporte = ms; ok('Metas salvas.'); return; }
    case 'objetivo': {
      const L = objLista(); const g = t.id ? L.find((x) => x.id === t.id) : null; const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe quanto custa o objetivo.');
      const ano = d.ano && d.ano.trim() ? parseInt(d.ano, 10) : null; if (ano != null && !(ano >= NOW_Y && ano <= 2100)) return basErro(f, `Informe um ano a partir de ${NOW_Y}.`);
      const dados = { tipo: d.tipo || 'outro', nome: (d.nome || '').trim(), valor: E.r2(v), ano }; if (dados.tipo === 'outro' && d.icone) dados.icone = d.icone;
      // o primeiro separa todo o patrimônio (fatia de 100%); os seguintes só pedem que o patrimônio chegue ao valor (marco)
      const alvo = g || Object.assign({ id: uid() }, L.length ? { modo: 'marco', pct: 0 } : { modo: 'fatia', pct: 100 }); Object.assign(alvo, dados); if (!g) L.push(alvo);
      if (d.foco || L.length === 1) S.profile.objetivoFoco = alvo.id; objSalvar(); ok(g ? 'Objetivo atualizado.' : 'Objetivo criado.'); return;
    }
    case 'perfil': { const nome = (d.nome || '').trim(); if (!nome) return basErro(f, 'Informe o seu nome.'); S.profile.nome = nome.slice(0, 80); S.profile.apelido = (d.apelido || '').trim().slice(0, 80); ['profissao', 'cidade'].forEach((k) => { S.profile[k] = (d[k] || '').trim().slice(0, 60); }); S.profile.whatsapp = (d.whatsapp || '').replace(/[^\d()+\- ]/g, '').trim().slice(0, 20); ok('Dados salvos.'); return; }
    default: return false;
  }
}
// excluir (segundo toque confirma)
function basExcluir(el) {
  if (!el.dataset.ok) { el.dataset.ok = '1'; el.textContent = 'Toque de novo para excluir'; return; }
  const t = basTopoPilha(); const p = S.plan; const m = S.mes;
  if (t.t === 'gasto') { const l = p.lancamentos.find((x) => x.id === t.id); if (l) { desfazerBaixa(l); p.lancamentos = p.lancamentos.filter((x) => x !== l); }
    // a tela do gasto (embaixo da edição) sai junto: ao fechar, volta direto para a lista
    const pl = basPilha(); const ant = pl[pl.length - 2]; if (ant && ant.t === 'gasto-ver' && ant.id === t.id) pl.splice(pl.length - 2, 1); }
  else if (t.t === 'conta') { p.lancamentos.forEach((l) => { if (l.itemId === t.id) delete l.itemId; }); p.despesas = p.despesas.filter((x) => x.id !== t.id); }
  else if (t.t === 'entrada') p.rendas = p.rendas.filter((x) => x.id !== t.id);
  else if (t.t === 'ativo-ed') { p.ativos = p.ativos.filter((x) => x.id !== t.id); const pl = basPilha(); const ant = pl[pl.length - 2]; if (ant && ant.t === 'ativo' && ant.id === t.id) pl.splice(pl.length - 2, 1); }
  else if (t.t === 'aporte') { const a = p.ativos.find((x) => x.id === t.id); if (a) a.ap[t.mes != null && t.mes !== '' ? +t.mes : m] = 0; }
  else if (t.t === 'provento') { const a = p.ativos.find((x) => x.id === t.id); if (a) a.pr[m] = 0; }
  else if (t.t === 'limite') { if (t.area) { const lim = p.settings.limites || {}; Object.keys(lim).filter((x) => E.norm(x) === E.norm(t.area)).forEach((x) => delete lim[x]); } else { p.settings.orcPadrao = 0; p.orcamento = new Array(12).fill(null); } }
  else if (t.t === 'objetivo') { const pr = S.profile; pr.objetivos = objLista().filter((x) => x.id !== t.id); if (pr.objetivoFoco === t.id) pr.objetivoFoco = pr.objetivos[0] ? pr.objetivos[0].id : null; objSalvar(); basRetorno('apaga'); basFechar(); toast('Objetivo excluído.'); return; }
  touch('plan'); basRetorno('apaga'); basFechar(); toast('Excluído.');
}
// conta paga: um gasto real do mês, ligado à conta (baixa), como no Completo
function basPagar() {
  const t = basTopoPilha(); const p = S.plan; const m = S.mes; const it = p.despesas.find((x) => x.id === t.id); if (!it) return;
  const x = basContas(m).itens.find((i) => i.id === it.id); if (!x || x.pago) return;
  const l = { id: uid(), origem: 'manual', data: basDataMes(m), desc: it.nome, valor: x.valor, cat: it.cat, area: it.area || 'Outros', sub: it.sub || '', inst: it.inst || '', itemId: it.id };
  p.lancamentos.push(l); it.baixas = Object.assign({}, it.baixas, { [S.year + '-' + m]: l.id }); touch('plan'); basRetorno('pago'); render(); toast('Conta marcada como paga.');
}

// escolha da versão no painel administrativo (Personalizar o painel) e no fim do diagnóstico
function basAdmHtml() {
  const op = (v, n, d) => `<button class="ap-voz" data-act="bas-ui" data-v="${v}" aria-pressed="${basInterface() === v}"><b>${n}</b><small>${d}</small></button>`;
  const corpo = basEscolhe() ? `<div class="ap-vozes">${op('basico', BAS_NOMES.basico, 'No jeito de celular, como um app de banco: o mês, os gastos, o sonho e quanto dá para investir.')}${op('completo', BAS_NOMES.completo, 'O painel completo: todas as telas, gráficos, planilhas e análises.')}</div>`
    : `<p class="mmsg">Você está no ${BAS_NOMES.basico}. O ${BAS_NOMES.completo} e o ${BAS_NOMES.basico} completo vêm com o plano ${esc(nomePlano('investidor'))}.</p><div class="btn-row"><button class="btn" data-act="upgrade" data-plano="investidor">Conhecer o plano ${esc(nomePlano('investidor'))}</button></div>`;
  return `<section class="dr-sec"><h3>Versão do Cifrão</h3>${corpo}</section>`;
}
function basObHtml() { return basEscolhe() ? `<div class="bas-ob"><p class="qn">Como você quer usar o Cifrão?</p>${basAdmHtml().replace(/<\/?section[^>]*>|<h3>.*?<\/h3>/g, '')}</div>` : ''; }

// ações data-act do modo Básico (chamadas pelo default do onClick em main.js)
function basAcao(act, ds, el) {
  switch (act) {
    case 'bas-aba': if (!modoBasico()) { basLimpar(); S.basAba = ds.v; S.view = { inicio: 'geral', gastos: 'despesas', investir: 'inv', perfil: 'perfil' }[ds.v] || 'geral'; render(); window.scrollTo(0, 0); return true; } // SaaS: a aba do App vira a aba do topo
    { if (ds.v === 'perfil' && S.basAba !== 'perfil') S.basAbaAntes = S.basAba; const l = document.querySelector('.bas-tab-lente'); if (l && l.style.transform) S.basTabX = parseFloat(l.style.transform.slice(11)) || S.basTabX; }
      if (S.basAba !== ds.v || basPilha().length) basSom('toque'); basTransicao('aba', () => { basLimpar(); S.basAba = ds.v; render(); window.scrollTo(0, 0); }); return true;
    case 'bas-mes': S.mes = Math.max(0, Math.min(11, S.mes + +ds.d)); render(); return true;
    case 'bas-oi-reg': basOiRegistrar(); return true;
    case 'bas-cart-vis': S.basCartVis = ds.v; S.basCartAbre = null; render(); return true;
    case 'bas-at-movs': basMovPop(); return true;
    case 'bas-cart-todos': basUltPop('bas-ct-tpl', 'Todos os ativos'); return true;
    case 'bas-cart-cl': S.basCartAbre = S.basCartAbre === ds.v ? null : ds.v; basSom('toque'); render(); return true;
    case 'bas-at-r': S.basAtR = ds.v; render(); return true;
    case 'bas-at-modo': S.basAtModo = ds.v; render(); return true;
    case 'bas-abrir': basAbrir(ds.t, { id: ds.id, area: ds.area, op: ds.op, modo: ds.modo, mes: ds.mes, ativo: ds.ativo }); return true;
    case 'bas-rolar': { const a = document.getElementById(ds.alvo); if (a) a.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return true; }
    case 'bas-tema-ciclo': { const ord = ['auto', 'light', 'oled']; const v = ord[(ord.indexOf(S.profile.prefs.tema) + 1) % 3]; if (v !== 'auto') S.profile.prefs.tema = v; definirTema(v === 'auto' ? 'auto-on' : v); render(); toast(`Tema: ${{ auto: 'automático', light: 'claro', oled: 'escuro' }[v]}.`); return true; }
    case 'bas-voltar': basFechar(); return true;
    case 'bas-sq-dia': { const w = el.closest('.bas-sq-fila'); if (w) { w.querySelectorAll('.bas-sq-dia').forEach((b) => b.classList.toggle('sel', b === el)); w.querySelector('.bas-sq-fila-r').textContent = el.dataset.r; basSom('toque'); } return true; }
    case 'bas-gx': { const id = el.getAttribute('aria-controls'); const w = document.getElementById(id); if (w) { S.basFech = S.basFech || {}; const f = S.basFech[id] = !S.basFech[id]; w.classList.toggle('fechada', f); el.setAttribute('aria-expanded', String(!f)); el.setAttribute('aria-label', `${f ? 'Expandir' : 'Recolher'} ${ds.nome}`); basSom('toque'); } return true; }
    case 'bas-cs-ir': { const t = basTopoPilha(); if (t && t.t === 'constelacao') { t.id = String((+t.id || 0) + +ds.d); basSom('toque'); render(); } return true; }
    case 'bas-an-mes': { const w = el.closest('.bas-pm'); if (w) { w.querySelectorAll('.bas-pm-g button').forEach((p) => p.classList.toggle('sel', p === el)); w.querySelector('.bas-an-r').textContent = el.dataset.r; basSom('toque'); } return true; }
    case 'bas-sq-astro': { const a = document.querySelector('.bas-sqx-astro'); if (a && !matchMedia('(prefers-reduced-motion: reduce)').matches) { a.classList.remove('festa'); void a.offsetWidth; a.classList.add('festa'); basVibra(12); basSom('ok'); } return true; }
    case 'bas-wr': { const w = el.closest('.bas-wr'); if (w) { basWrIr(w, (+w.dataset.i || 0) + (+ds.d || 1)); basSom('toque'); } return true; }
    case 'bas-retro-share': { const m = +ds.m; basFechar(); setTimeout(() => basAbrir('resumo', { id: m }), 320); return true; }
    case 'bas-rs-modo': { const op = basRsOp(); if (ds.v !== 'pct' && ds.v !== 'val') return true; op.modo = ds.v; touch('profile'); basSom('toque'); render(); return true; }
    case 'bas-rs-it': { const op = basRsOp(); if (!BAS_RS_ITENS.some((x) => x[0] === ds.k)) return true; op.it[ds.k] = op.it[ds.k] ? 0 : 1; touch('profile'); basSom('toque'); render(); return true; }
    case 'bas-cq-share': basConquistaPng(+ds.q).then((b) => basEnviaPng(b, `${(CFG.marca || 'aven').toLowerCase()}-conquista-${ds.q}-meses.png`, 'Minha conquista')); return true;
    case 'bas-cc-mod': if (instDe(ds.id) && CC_MODELOS.some((x) => x[0] === ds.m)) basCcGrava(ds.id, 'm', ds.m); return true;
    case 'bas-cat-ed': basUltPop('bas-catic-tpl', 'Ícone da categoria', 'Escolha como ela aparece'); return true;
    case 'bas-cat-ic': basCatIcGrava(ds.area, ds.v); basSom('toque'); render(); return true;
    case 'bas-ccn-banco': if (instDe(ds.v)) { S.basCcNovo = ds.v; basSom('toque'); render(); } return true;
    case 'bas-ccn-ok': if (instDe(ds.id)) { instMinhaAlternar(ds.id, true); S.basCcNovo = null; basRetorno('ok'); basFechar(); toast(`Cartão ${instDe(ds.id)[1]} adicionado.`); } return true;
    case 'bas-gp-fechar': basGastoFechar(); return true;
    case 'bas-cc-band': if (instDe(ds.id) && CC_BAND[ds.v]) basCcGrava(ds.id, 'b', ds.v); return true;
    case 'bas-cc-cor': if (instDe(ds.id) && /^#[0-9a-f]{6}$/i.test(ds.v || '')) basCcGrava(ds.id, 'c', ds.v); return true;
    case 'bas-gasto-rec': { const f = el.closest('form'); const x = basMemGastos().get(ds.k); if (f && x) { f.querySelector('[name="desc"]').value = x.desc; basGastoLembra(f, x, true); basSom('toque'); } return true; }
    case 'bas-sn2-ir': { const st = S.basSn2; if (!st) return true; st.p = Math.max(0, Math.min(2, +ds.p)); basSom('toque'); render(); setTimeout(() => { const i = document.querySelector('[data-sn2]'); if (i && st.p === 1) i.focus(); }, 60); return true; }
    case 'bas-sn2-ano': { const st = S.basSn2; if (!st) return true;
      st.ano = ds.v != null ? null : Math.max(NOW_Y + 1, Math.min(NOW_Y + 40, (st.ano || NOW_Y) + (+ds.d || 0)));
      const b = document.querySelector('[data-sn2-ano]'); const sm = document.querySelector('[data-sn2-anos]'); const n = st.ano ? st.ano - NOW_Y : 0;
      if (b) b.textContent = st.ano || 'Sem prazo'; if (sm) sm.textContent = st.ano ? `daqui a ${n} ${n === 1 ? 'ano' : 'anos'}` : 'você pode definir depois';
      document.querySelector('.bas-sn2-semp')?.classList.toggle('on', !st.ano); basSom('toque'); basVibra(6); return true; }
    case 'bas-sn2-criar': basSn2Criar(); return true;
    case 'bas-sne-tipo': { const st = S.basSn2; if (!st || !OBJETIVOS.some((x) => x[0] === ds.v)) return true; st.tipo = ds.v; basSom('toque'); basVibra(6); render(); return true; }
    case 'bas-sn2-del': { const st = S.basSn2; if (!st || !st.ed) return true; if (!el.dataset.ok) { el.dataset.ok = '1'; el.textContent = 'Toque de novo para excluir'; return true; }
      const pr = S.profile; pr.objetivos = objLista().filter((x) => x.id !== st.ed); if (pr.objetivoFoco === st.ed) pr.objetivoFoco = pr.objetivos[0] ? pr.objetivos[0].id : null; objSalvar();
      const pl = basPilha(); const ant = pl[pl.length - 2]; if (ant && ant.t === 'sonho-det') pl.splice(pl.length - 2, 1); basRetorno('apaga'); basFechar(); toast('Sonho excluído.'); return true; }
    case 'bas-sn2-ver': { const id = ds.id; basFechar(); setTimeout(() => basAbrir('sonho-det', { id }), 380); return true; }
    case 'bas-ah-mes': S.basAhMes = S.basAhMes === +ds.m ? null : +ds.m; basSom('toque'); render(); return true;
    case 'bas-ah-ano': { const t = basTopoPilha(); if (t && t.t === 'ano-hist') { t.id = String(ds.y); S.basAhMes = null; basSom('toque'); render(); } return true; }
    case 'bas-prov-mes': S.basProvMes = S.basProvMes === +ds.m ? null : +ds.m; basSom('toque'); render(); return true;
    case 'bas-prov-vis': S.basProvVis = ds.v; S.basProvMes = null; basSom('toque'); render(); return true;
    case 'bas-prov-ano': if (+ds.y !== S.year && S.plans[+ds.y]) { S.basProvMes = null; switchYear(+ds.y); } return true;
    case 'bas-al-passo': case 'bas-al-igual': case 'bas-al-100': case 'bas-al-zero': basAlAcao(act, el); return true;
    case 'bas-cores': S.basCores = !S.basCores; basSom('toque'); render(); return true;
    case 'bas-ia-avisos': S.basIaAba = 'avisos'; basAbrir('ia', {}); return true;
    case 'bas-dia': { const w = el.closest('.bas-w-cal'); if (w) { w.querySelectorAll('.bas-cal-d.sel').forEach((x) => x.classList.remove('sel')); el.classList.add('sel'); w.querySelector('.bas-cal-sel').textContent = el.dataset.r; basSom('toque'); } return true; }
    case 'bas-foco': { if (!objLista().some((x) => x.id === ds.id)) return true; S.profile.objetivoFoco = ds.id; objSalvar(); basRetorno('ok'); if (ds.volta) basFechar(); else render(); toast('Sonho principal trocado.'); return true; }
    case 'bas-en-vis': S.basEnVis = ds.v; basSom('toque'); render(); return true;
    case 'bas-en-mes': S.basPer = null; S.mes = Math.max(0, Math.min(11, +ds.m)); basSom('toque'); render(); return true;
    case 'bas-per-at': { const n = +ds.n; const ref = S.year === NOW_Y ? NOW_M : 11; S.basPerIni = null;
      if (n <= 1) { S.basPer = null; S.mes = ref; } else if (n >= 12) { S.basPer = { de: 0, ate: 11 }; S.mes = ref; } else { S.basPer = { de: Math.max(0, ref - n + 1), ate: ref }; S.mes = ref; }
      if (document.querySelector('.bas-pp')) { basPeriodoFechar(); render(); } else basFechar(); return true; }
    case 'bas-per-mes': { const m = +ds.m; const pop = !!document.querySelector('.bas-pp'); if (S.basPerIni == null) { S.basPerIni = m; basSom('toque'); if (pop) basPeriodoRepinta(); else render(); return true; }
      const de = Math.min(S.basPerIni, m); const ate = Math.max(S.basPerIni, m); S.basPerIni = null; S.basPer = de === ate ? null : { de, ate }; S.mes = ate; if (pop) { basPeriodoFechar(); render(); } else basFechar(); return true; }
    case 'bas-pp-fechar': basPeriodoFechar(); return true;
    case 'bas-ord': case 'bas-ord-vis': case 'bas-ord-pad': basOrdAcao(act, ds); return true;
    case 'bas-arco': basArco(el); return true;
    case 'bas-ccv': basCcVer(); return true;
    case 'bas-ult-todos': basUltPop(); return true;
    case 'bas-ia-fab': { if (Date.now() - (S.basCifEm || 0) < 800) return true; const fora = document.querySelector('.bas-cif-solto') && S.basCifVolta; S.basCifPasseio = false; basAbrir('ia');
      // o Cifrão que estava passeando voa até o selo do assistente e só então aparece lá dentro
      if (fora) { const pousa = (n) => { const o = document.querySelector('.bas-iax-orb'); if (!o && n < 20) { setTimeout(() => pousa(n + 1), 40); return; } if (o) o.classList.add('espera'); S.basCifVolta(o && o.querySelector('.cifrao')); }; setTimeout(() => pousa(0), 80); }
      return true; }
    case 'bas-ev-jan': S.basEvJan = +ds.v; basSom('toque'); render(); return true;
    case 'bas-arco-abrir': { const b = document.querySelector('.bas-roda'); if (b && b.dataset.sel) basAbrir('categoria', { area: b.dataset.sel }); return true; }
    case 'bas-ia-aba': S.basIaAba = ['avisos', 'duvidas'].includes(ds.v) ? ds.v : 'conversa'; basSom('toque'); render(); return true;
    case 'bas-guia': basGuiaIniciar(ds.id); return true;
    case 'bas-virar': S.basVirado = !S.basVirado; el.classList.toggle('virado', S.basVirado); basSom('toque'); return true;
    case 'bas-partilhar': basSom('toque'); basPartilhar(ds.m != null ? +ds.m : undefined); return true;
    case 'bas-rec-aplicar': basRecAplicar(el); return true;
    case 'bas-sons': S.profile.prefs.sons = !basSomLigado(); touch('profile'); if (basSomLigado()) basSom('ok'); return true;
    case 'bas-importar': basIngAbrir(); return true;
    case 'bas-ig-t': case 'bas-ig-todos': case 'bas-ig-ok': case 'bas-ig-avancado': basIgAcao(act, ds); return true;
    case 'bas-avisos-lidos': notifMarcar('lidas', notifLista().filter((n) => !n.lida).map((n) => n.id)); render(); return true;
    case 'bas-aviso': { const n = notifLista().find((x) => x.id === ds.id); if (!n) return true; notifMarcar('lidas', [n.id]); const c = n.cta;
      if (!c) { render(); return true; }
      if (c.acao === 'objetivos') { basFechar(); basAbrir('objetivos', {}); return true; }
      if (c.acao === 'ingest') { basFechar(); if (typeof abrirIngestao === 'function') abrirIngestao(); return true; }
      basLimpar(); S.basAba = c.acao === 'nav' ? ({ despesas: 'gastos', inv: 'investir', pro: 'investir', cart: 'investir' }[c.view] || 'inicio') : 'inicio'; if (c.mes != null) S.mes = +c.mes; render(); window.scrollTo(0, 0); return true; }
    case 'bas-mes-ir': S.mes = Math.max(0, Math.min(11, +ds.m)); render(); return true;
    case 'bas-cor': definirCor('cor', ds.v); render(); return true;
    case 'bas-globo': if (typeof aberturaAbrir === 'function') aberturaAbrir(); return true;
    case 'ia-ir': { if (!modoBasico()) return false; // atalhos das respostas do assistente levam às telas do Simples
      const msg = iaEstado().msgs[+ds.i]; const c = msg && msg.r && msg.r.cta; if (!c) return true;
      if (c.acao === 'objetivos') { basAbrir('objetivos', {}); return true; }
      if (c.acao === 'ingest') { basAbrir('gasto', {}); return true; }
      basLimpar(); S.basAba = c.acao === 'nav' ? ({ despesas: 'gastos', inv: 'investir', pro: 'investir', cart: 'investir' }[c.view] || 'inicio') : 'inicio'; if (c.mes != null) S.mes = +c.mes; render(); window.scrollTo(0, 0); return true; }
    case 'ia-comecar': if (!modoBasico()) return false; S.iaComecou = true; render(); { const i = document.querySelector('.bas-ia .ia-f input'); if (i) i.focus({ preventScroll: true }); } return true;
    case 'bas-excluir': basExcluir(el); return true;
    case 'bas-pagar': basPagar(); return true;
    case 'bas-ano': { const y = +ds.y; basLimpar(); if (S.plans[y]) { if (y !== S.year) switchYear(y); else render(); } else createPlan(y, S.plan); return true; }
    case 'bas-ap-tema': { const g = el.parentElement; g.style.setProperty('--i', ds.i); g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === el)));
      setTimeout(() => { if (ds.v !== 'auto') S.profile.prefs.tema = ds.v; definirTema(ds.v === 'auto' ? 'auto-on' : ds.v); render(); }, 140); return true; }
    case 'bas-idioma': trocarIdioma(ds.v); return true;
    case 'bas-cf': { const c = basCf(); if (['texto', 'cantos', 'topo'].includes(ds.k)) c[ds.k] = ds.v; touch('profile'); basAplicarAp(); render(); return true; }
    // chaves: a bolinha corre antes, e a tela se redesenha depois (a animação aparece)
    case 'bas-cf-sw': { const c = basCf(); const [a, b] = String(ds.k).split('.'); const o = b ? c[a] : c; const kk = b || a; o[kk] = !o[kk]; touch('profile'); el.setAttribute('aria-checked', String(o[kk])); setTimeout(render, 260); return true; }
    case 'bas-cf-push': { const c = basCf(); const liga = () => { c.push = true; touch('profile'); render(); };
      if (c.push) { c.push = false; touch('profile'); el.setAttribute('aria-checked', 'false'); setTimeout(render, 260); return true; }
      el.setAttribute('aria-checked', 'true'); if (typeof Notification === 'undefined' || Notification.permission === 'granted') { setTimeout(liga, 260); return true; }
      Notification.requestPermission().then((r) => { if (r === 'granted') liga(); else { toast('O celular não deixou. Libere as notificações do Cifrão nos ajustes dele.'); render(); } }, () => render()); return true; }
    case 'bas-cf-priv': el.setAttribute('aria-checked', String(!S.privado)); setTimeout(alternarPrivado, 260); return true;
    case 'bas-cf-modo': { const noite = !basEscuro(); el.setAttribute('aria-checked', String(noite)); const ceu = el.querySelector('.bas-cf-ceu'); if (ceu) ceu.classList.toggle('noite', noite);
      setTimeout(() => { const p = S.profile.prefs; if (p.tema === 'custom' || (p.tema === 'auto' && p.manual === 'custom')) { p.tema = 'custom'; definirCor('base', noite ? 'oled' : 'light'); } else definirTema(noite ? 'oled' : 'light'); render(); }, 0); return true; }
    case 'bas-sair': if (!el.dataset.ok) { el.dataset.ok = '1'; el.querySelector('b').textContent = 'Toque de novo para sair'; return true; } basLimpar(); sair(); return true;
    case 'bas-tema': if (ds.v !== 'auto') S.profile.prefs.tema = ds.v; definirTema(ds.v === 'auto' ? 'auto-on' : ds.v); render(); return true;
    case 'bas-ui': try { localStorage.setItem('fp:interface', ds.v === 'basico' ? 'basico' : 'completo'); } catch (e) { S.profile.interface = ds.v === 'basico' ? 'basico' : 'completo'; touch('profile'); } basLimpar(); if (S.screen === 'app') { closeAdmin(); S.basAba = 'inicio'; window.scrollTo(0, 0); } render(); toast(`${BAS_NOMES[ds.v === 'basico' ? 'basico' : 'completo']} ligado.`); return true;
    default: return false;
  }
}

// importar extrato no App, numa tela própria (não o modal do SaaS): escolher o arquivo, uma análise animada e uma prévia
// simples (tocar no lançamento tira ou põe; a pílula troca a categoria ou o tipo); um botão só para importar.
// Usa o mesmo motor (ingLer, FPIngest, ingDefinir, aplicarIngestao); o ingest-ui.js chama renderIng, que aqui desenha a tela.
const I_DOC = ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>');
const I_CADEADO = ic('<rect x="5" y="11" width="14" height="9.5" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>');
const BAS_IG_PASSOS = ['Lendo o arquivo', 'Reconhecendo as categorias', 'Procurando o que já foi importado', 'Separando gastos, entradas e investimentos'];
function basIngAbrir() { if (!S.plan) { toast('Crie o planejamento do ano primeiro.'); return; } S.ingModo = 'banco'; S.ing = { estado: 'inicio' }; S.basIngOk = null; basAbrir('importar'); }
const basIgArq = () => `<input id="bas-ig-f" type="file" accept=".csv,.ofx,.qfx,.txt,.xlsx,.xls${temRecurso('ia_pdf') ? ',.pdf' : ''}" hidden>`;
function basTelaImportar() { return basDet('Importar extrato', `<div id="bas-ig" class="bas-ig">${basIgHtml()}</div>${basIgArq()}`); }
function basIgHtml(passo) {
  const g = S.ing || { estado: 'inicio' }; const ok = S.basIngOk;
  if (ok) return `<div class="bas-ig-fim"><span class="bas-ig-ok" aria-hidden="true">${I.check}</span><b>Pronto!</b><p>${esc(ok)}</p><button class="btn primary lg bas-cta" data-act="bas-voltar">Concluir</button></div>`;
  if (g.estado === 'inicio') return `<div class="bas-ig-hero"><span class="bas-ig-ic" aria-hidden="true">${I_DOC}<i></i><i></i></span>
      <b>Traga seu extrato</b><p>Gastos, entradas e investimentos entram sozinhos, já com categoria. Você confere antes.</p></div>
    <label class="btn primary lg bas-cta bas-ig-esc" for="bas-ig-f">Escolher arquivo</label>
    <ol class="bas-ig-como"><li><i>1</i><span>No app do banco, exporte o extrato em <b>OFX</b> ou <b>CSV</b>. Da B3, o relatório em Excel.</span></li><li><i>2</i><span>Escolha o arquivo aqui.</span></li><li><i>3</i><span>Confira a lista e importe.</span></li></ol>
    <p class="bas-ig-priv">${I_CADEADO}O arquivo é lido só no seu aparelho.</p>`;
  if (g.estado === 'lendo' || passo != null) { const n = passo || 0; const fim = n >= BAS_IG_PASSOS.length && g.resumo;
    return `<div class="bas-ia-an" role="status" aria-live="polite"><div class="bas-ia-doc" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b class="bas-ia-scan"></b></div>
      <b class="bas-ia-t">${fim ? `${g.resumo.total} ${g.resumo.total === 1 ? 'lançamento encontrado' : 'lançamentos encontrados'}` : 'Analisando seu extrato'}</b><small>${esc(g.nome || '')}</small>
      <ol>${BAS_IG_PASSOS.map((p, i) => `<li class="${i < n ? 'ok' : i === n ? 'vai' : ''}"><span aria-hidden="true">${i < n ? '✓' : ''}</span>${p}</li>`).join('')}</ol></div>`; }
  if (g.estado !== 'pronto') { const msg = g.estado === 'bloqueado' ? 'A leitura de PDF faz parte de outro plano. Exporte o extrato em OFX ou CSV no app do seu banco.' : g.msg || 'Não foi possível ler esse arquivo.';
    return `<div class="bas-ig-hero erro"><span class="bas-ig-ic" aria-hidden="true">${I_DOC}</span><b>Não deu para ler</b><p>${esc(msg)}</p></div>
      <label class="btn primary lg bas-cta bas-ig-esc" for="bas-ig-f">Escolher outro arquivo</label>${g.estado === 'mapear' ? '<button class="bas-ig-lnk" data-act="bas-ig-avancado">Ajustar as colunas do arquivo</button>' : ''}`; }
  // prévia
  const rows = g.rows.filter((t) => !t.duplicado); const dup = g.rows.length - rows.length; const R = g.resumo;
  const areas = [...new Set(BAS_AREAS.concat((S.plan.lancamentos || []).map((x) => x.area), g.rows.map((x) => x.area)).filter(Boolean))];
  const TIPOS = [['renda', 'Entrada'], ['investimento', 'Aporte ou resgate'], ['provento', 'Provento'], ['ignorar', 'Não importar']];
  const rot = (t) => (t.destino === 'despesa' ? t.area || 'Sem categoria' : (TIPOS.find((x) => x[0] === t.destino) || [0, ''])[1]);
  const pilula = (t) => `<label class="bas-ig-pl ${t.destino}"><span>${esc(rot(t))}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
    <select data-ig-cat="${t.idx}" aria-label="Categoria de ${esc(t.descricao)}" ${t.bloqueado ? 'disabled' : ''}><optgroup label="Gasto">${areas.map((a) => `<option value="a:${esc(a)}" ${t.destino === 'despesa' && t.area === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}</optgroup>
      <optgroup label="Não é gasto">${TIPOS.map(([v, l]) => `<option value="d:${v}" ${t.destino === v ? 'selected' : ''}>${l}</option>`).join('')}</optgroup></select></label>`;
  const linha = (t) => `<li class="${t.incluir ? 'on' : ''}${t.bloqueado ? ' bloq' : ''}"><button class="bas-ig-ck" data-act="bas-ig-t" data-ig-t="${t.idx}" aria-pressed="${!!t.incluir}" aria-label="${t.incluir ? 'Tirar' : 'Incluir'} ${esc(t.descricao)}" ${t.bloqueado ? 'disabled' : ''}><i aria-hidden="true">${I.check}</i></button>
    <span class="bas-ig-tx"><b>${esc(t.descricao)}</b><small>${esc(dataBR(t.data).slice(0, 5))}${t.bloqueado ? ` · ${esc(t.bloqueado)}` : ''}</small>${pilula(t)}</span><b class="bas-ig-v${t.valor > 0 ? ' in' : ''}">${t.valor > 0 ? '+' : '−'}${basCent(Math.abs(t.valor))}</b></li>`;
  const tot = (d) => R.porDestino[d] || { n: 0, valor: 0 }; const n = R.incluidas;
  const st = [['despesa', 'Gastos', ''], ['renda', 'Entradas', 'in'], ['investimento', 'Investimentos', ''], ['provento', 'Proventos', 'in']].filter(([d]) => tot(d).n);
  return `<div class="card bas-ig-res"><div class="bas-ig-arq"><span aria-hidden="true">${I_DOC}</span><b>${esc(g.nome)}</b><label for="bas-ig-f">Trocar</label></div>
      <p class="bas-ig-n"><b>${rows.length}</b> ${rows.length === 1 ? 'lançamento novo' : 'lançamentos novos'}</p>
      ${st.length ? `<div class="bas-ig-st">${st.map(([d, l, c]) => `<span><small>${l}</small><b class="${c}">${basCent(Math.abs(tot(d).valor))}</b></span>`).join('')}</div>` : ''}
      ${dup ? `<p class="bas-ig-dup">${dup} ${dup === 1 ? 'já estava' : 'já estavam'} no app e ${dup === 1 ? 'fica' : 'ficam'} de fora.</p>` : ''}</div>
    ${rows.length ? `<div class="bas-ch bas-ch-f"><h2 class="bas-h2">Confira</h2><button class="bas-ult-ver" data-act="bas-ig-todos">${rows.every((t) => t.incluir || t.bloqueado) ? 'Tirar todos' : 'Incluir todos'}</button></div>
    <p class="bas-ig-dica">Toque no círculo para tirar ou incluir. Na pílula, troque a categoria.</p><ul class="card bas-ig-ls">${rows.slice().sort((a, b) => (b.data > a.data ? 1 : -1)).map(linha).join('')}</ul>` : ''}
    <div class="bas-ig-bar"><button class="btn primary lg bas-cta" data-act="bas-ig-ok" ${n ? '' : 'disabled'}>${n ? `Importar ${n} ${n === 1 ? 'lançamento' : 'lançamentos'}` : 'Nada para importar'}</button></div>`;
}
// redesenha só a tela de importar; a análise animada roda uma vez por arquivo (sem ela com "reduzir movimento")
function basIgRepinta() {
  const box = document.getElementById('bas-ig'); if (!box) return false; const g = S.ing || {};
  if (g.estado === 'pronto' && !g.basVisto && !matchMedia('(prefers-reduced-motion: reduce)').matches) { g.basVisto = true; let n = 0;
    const anda = () => { if (S.ing !== g || !box.isConnected) return; if (n <= BAS_IG_PASSOS.length) { box.innerHTML = basIgHtml(n); if (n === BAS_IG_PASSOS.length) basRetorno('ok'); n++; setTimeout(anda, n > BAS_IG_PASSOS.length ? 750 : 480); } else { box.innerHTML = basIgHtml(); box.classList.add('chega'); } };
    anda(); return true; }
  box.innerHTML = basIgHtml(); return true;
}
const basIngOrig = typeof renderIng === 'function' ? renderIng : null;
if (basIngOrig) renderIng = function () { if (document.body.dataset.ui === 'basico' && !document.getElementById('ing-root') && basIgRepinta()) return; return basIngOrig(); };
function basIgLigar() {
  if (document.body.dataset.igLig) return; document.body.dataset.igLig = '1';
  document.addEventListener('change', (e) => { const el = e.target;
    if (el.id === 'bas-ig-f') { const f = el.files && el.files[0]; el.value = ''; if (f) { S.basIngOk = null; ingLer(f); } return; }
    if (el.dataset && el.dataset.igCat != null) { const t = S.ing && S.ing.rows[+el.dataset.igCat]; if (!t) return; const [k, v] = [el.value.slice(0, 2), el.value.slice(2)];
      if (k === 'a:') { if (t.destino !== 'despesa') ingDefinir(t, 'destino', 'despesa'); ingDefinir(t, 'area', v); } else ingDefinir(t, 'destino', v);
      S.ing.resumo = FPIngest.resumir(S.ing.rows); basIgRepinta(); basSom('toque'); } });
}
function basIgAcao(act, ds) {
  const g = S.ing;
  if (act === 'bas-ig-t') { const t = g && g.rows[+ds.igT]; if (!t || t.bloqueado) return; ingDefinir(t, 'incluir', null, !t.incluir); g.resumo = FPIngest.resumir(g.rows); basIgRepinta(); if (typeof basVibra === 'function') basVibra(6); return; }
  if (act === 'bas-ig-todos') { const rows = g.rows.filter((t) => !t.duplicado && !t.bloqueado); const liga = !rows.every((t) => t.incluir); rows.forEach((t) => { t.incluir = liga && t.destino !== 'ignorar'; }); g.resumo = FPIngest.resumir(g.rows); basIgRepinta(); return; }
  if (act === 'bas-ig-ok') { if (!g || !g.resumo || !g.resumo.incluidas) return; const R = g.resumo; const n = R.incluidas;
    aplicarIngestao(); S.basIngOk = `${n} ${n === 1 ? 'lançamento entrou' : 'lançamentos entraram'} no seu ${S.year}. Se algo não ficou certo, toque em Desfazer no aviso.`; basRetorno('pago'); basIgRepinta(); return; }
  if (act === 'bas-ig-avancado') { openModal({ title: 'Ajustar o arquivo', ok: 'Importar', wide: true, body: '<div id="ing-root" class="ing"></div>', onOk: () => { if (!S.ing || !S.ing.resumo || !S.ing.resumo.incluidas) return false; aplicarIngestao(); return true; } }); basIngOrig(); }
}

// Novo gasto: categoria e banco numa linha cada (como o ativo no Investimento); tocar abre a janela com a grade para escolher.
// Os rádios de antes continuam no formulário (escondidos), então lembrar o último gasto, "Nova" categoria e a gravação seguem iguais.
function basGfPickLigar() {
  const f = document.querySelector('.bas-form [data-gf-pick]') && document.querySelector('[data-gf-pick]').closest('form'); if (!f || f.dataset.pick) return; f.dataset.pick = '1';
  const conteudo = (r) => { const sp = r && r.parentElement.querySelector('span'); if (!sp) return ['', 'Escolha']; const i = sp.querySelector('i, .inst-ic, svg, img'); const ic = i ? (i.tagName === 'I' ? i.innerHTML : i.outerHTML) : ''; return [ic, sp.textContent.trim()]; };
  const pinta = () => f.querySelectorAll('[data-gf-pick]').forEach((b) => { const k = b.dataset.gfPick; const r = f.querySelector(`[name="${k}"]:checked`); const [ic, nome] = conteudo(r);
    b.innerHTML = `<span class="bas-ct-lg bas-gf-lg${k === 'inst' && r && r.value ? ' banco' : ''}" style="--bc:var(--accent)">${ic || (k === 'inst' ? I_CARTAO_GF : I.plus)}</span><span class="bas-ct-an"><b>${esc(nome || 'Escolha')}</b></span><em>Trocar</em>`; });
  f.addEventListener('change', pinta); f.addEventListener('input', () => requestAnimationFrame(pinta)); pinta();
  f.addEventListener('click', (e) => { const b = e.target.closest('[data-gf-pick]'); if (!b) return; const k = b.dataset.gfPick; const rs = [...f.querySelectorAll(`[name="${k}"]`)];
    let tpl = document.getElementById('bas-gf-tpl'); if (!tpl) { tpl = document.createElement('template'); tpl.id = 'bas-gf-tpl'; document.body.appendChild(tpl); }
    tpl.innerHTML = `<div class="bas-gf-grid${k === 'inst' ? ' bancos' : ''}">${rs.map((r, i) => { const [ic, nome] = conteudo(r); return `<button type="button" class="bas-gf-op${r.checked ? ' on' : ''}" data-gf-i="${i}"><span class="bas-gf-oi${k === 'inst' && r.value ? ' banco' : ''}">${ic || (k === 'inst' ? I_CARTAO_GF : I.plus)}</span><b>${esc(nome)}</b></button>`; }).join('')}</div>`;
    const el = basUltPop('bas-gf-tpl', k === 'area' ? 'Categoria' : 'Pago com', k === 'area' ? 'Onde esse gasto entra' : 'Banco ou cartão do pagamento'); if (!el) return;
    el.addEventListener('click', (ev) => { const o = ev.target.closest('[data-gf-i]'); if (!o) return; const r = rs[+o.dataset.gfI]; r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
      pinta(); basSom('toque'); el.querySelector('[data-pop="x"]').click(); if (k === 'area' && !r.value) setTimeout(() => { const n = f.querySelector('[name="areaNova"], [name="nova"], [data-blk="nova"] input'); if (n) n.focus(); }, 260); }); });
}
const I_CARTAO_GF = ic('<rect x="3" y="6" width="18" height="12.5" rx="2.5"/><path d="M3 10.5h18"/>');

// limite da categoria num cartão de vidro sobre o azul: o limite com o lápis ao lado, a barra e, embaixo, o usado e o que ainda cabe
function basCatLim(area, tot) {
  const lim = S.plan.settings.limites || {}; const L = E.analiseLimites(lim, { [area]: tot })[0];
  if (!(L && E.norm(L.area) === E.norm(area))) return `<button class="bas-cat-lim vazio" ${basIr('limite', { area })}>${I_LIMITE_IC}<span>Definir um limite por mês</span>${I.chev}</button>`;
  const passou = L.sit === 'passou'; const uso = Math.max(0, Math.min(1, L.uso || 0));
  return `<div class="bas-cat-lim${passou ? ' passou' : ''}"><div class="bas-cat-lh"><span><small>Limite do mês</small><b>${brl0(L.limite)}</b></span><button class="bas-cat-ed" ${basIr('limite', { area })} aria-label="Mudar o limite"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/></svg></button></div>
    <span class="bas-cat-bar" aria-hidden="true"><i style="width:${(uso * 100).toFixed(1)}%"></i></span>
    <div class="bas-cat-lr"><span><small>Usado</small><b>${pct(L.uso || 0)}</b></span><span><small>${passou ? 'Passou' : 'Ainda cabe'}</small><b>${brl(Math.abs(L.falta))}</b></span></div></div>`;
}

// vidro vivo, como o Liquid Glass do iPhone: ao segurar, o botão de vidro cresce com mola e acende onde está o dedo;
// ao arrastar, estica para o lado do dedo (o brilho acompanha); ao soltar, volta quicando. Só nos botões de vidro dos fundos azuis
const BAS_VV_SEL = '.bas-gt-bg :is(.olho, .bell, .bas-circ, .bas-per, .bas-gt-chip, .bas-ct2-b, .bas-var-p, .bas-cat-ed, .bas-ev-pct, .bas-ah2-anos button), .bas-noite :is(.olho, .bell, .bas-var-p, .bas-noite-par > *)';
(function basVidroVivo() {
  if (typeof document === 'undefined') return;
  let el = null; let x0 = 0; let y0 = 0; let r0 = null; let raf = 0; let ult = null;
  const solta = () => { if (!el) return; const b = el; el = null; cancelAnimationFrame(raf); b.classList.remove('vv-on'); ['--vx', '--vy', '--sx', '--sy', '--lx', '--ly'].forEach((k) => b.style.removeProperty(k)); };
  const pinta = () => { raf = 0; if (!el || !ult) return; const dx = ult.x - x0; const dy = ult.y - y0; const d = Math.hypot(dx, dy) || 1; const k = Math.min(1, d / 70);
    const sx = 1.12 + 0.14 * k * (Math.abs(dx) / d) - 0.06 * k * (Math.abs(dy) / d); const sy = 1.12 + 0.14 * k * (Math.abs(dy) / d) - 0.06 * k * (Math.abs(dx) / d);
    const mola = (v) => 10 * Math.tanh(v / 30);
    el.style.setProperty('--vx', `${mola(dx).toFixed(1)}px`); el.style.setProperty('--vy', `${mola(dy).toFixed(1)}px`);
    el.style.setProperty('--sx', sx.toFixed(3)); el.style.setProperty('--sy', sy.toFixed(3));
    el.style.setProperty('--lx', `${Math.max(0, Math.min(100, ((ult.x - r0.left) / r0.width) * 100)).toFixed(0)}%`); el.style.setProperty('--ly', `${Math.max(0, Math.min(100, ((ult.y - r0.top) / r0.height) * 100)).toFixed(0)}%`); };
  document.addEventListener('pointerdown', (e) => {
    if (document.body.dataset.ui !== 'basico' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const b = e.target.closest && e.target.closest(BAS_VV_SEL); if (!b) return;
    solta(); el = b; x0 = e.clientX; y0 = e.clientY; r0 = b.getBoundingClientRect(); ult = { x: x0, y: y0 }; pinta(); b.classList.add('vv-on');
  }, { passive: true });
  document.addEventListener('pointermove', (e) => { if (!el) return; if (!el.isConnected) { solta(); return; } ult = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(pinta); }, { passive: true });
  ['pointerup', 'pointercancel', 'blur'].forEach((t) => window.addEventListener(t, solta, { passive: true }));
})();
// iPhone: quando o teclado fecha, a barra de abas fixa às vezes fica parada no meio da tela até rolar; um empurrão de rolagem a recoloca no pé
document.addEventListener('focusout', (e) => { if (!e.target.matches || !e.target.matches('input, textarea, select')) return; setTimeout(() => { const a = document.activeElement; if (a && a.matches && a.matches('input, textarea, select')) return; window.scrollBy(0, 1); window.scrollBy(0, -1); }, 150); });

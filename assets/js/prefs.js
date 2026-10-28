/* Personalização: temas visuais e voz (tom de comunicação) das orientações financeiras.
   Temas = variáveis CSS (assets/css/app.css) escolhidas por data-theme no <html>.
   Voz   = catálogo de frases com marcadores {assim}; o app inteiro fala pela função voz(). */
'use strict';
const TEMAS = {
  auto: { nome: 'Automático', desc: 'Segue o aparelho: claro de dia, escuro à noite.' },
  light: { nome: 'Claro', desc: 'Vidro claro sobre luz azul.', sw: ['#F5F6F9', '#0A84FF'] },
  oled: { nome: 'Dark OLED', desc: 'Preto verdadeiro, econômico em telas OLED.', sw: ['#000000', '#3D9DFF'] },
  custom: { nome: 'Personalizado', desc: 'Você escolhe o fundo e a cor de destaque.' },
};
// cores de destaque do tema Personalizado (o contraste é ajustado sozinho para o fundo escolhido)
// cores bem distintas entre si (matizes espaçados no círculo de cores), para cada tema personalizado ter cara própria
const CORES_DESTAQUE = [['#0A84FF', 'Azul AVEN'], ['#7C3AED', 'Violeta'], ['#D946EF', 'Magenta'], ['#F43F5E', 'Rubi'], ['#FF6B2C', 'Tangerina'], ['#F5B700', 'Âmbar'], ['#84CC16', 'Lima'], ['#10B981', 'Esmeralda'], ['#06B6D4', 'Ciano'], ['#64748B', 'Grafite']];
// matiz (0–360) e saturação (0–1) de um #rrggbb, e o caminho de volta
const hexHs = (hex) => { const [r, g, b] = hexRgb(hex).map((v) => v / 255); const mx = Math.max(r, g, b); const d = mx - Math.min(r, g, b); const l = mx - d / 2;
  const h = !d ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, d ? Math.min(1, d / (1 - Math.abs(2 * l - 1))) : 0]; };
const hslHex = (h, s, l) => { const a = s * Math.min(l, 1 - l); const f = (n) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); }; return `#${f(0)}${f(8)}${f(4)}`; };
// na roda: ângulo = matiz (0° no topo, sentido horário), distância do centro = saturação (12% a 94% do raio)
const rodaPos = (c) => { const [h, s] = hexHs(c); const a = (h * Math.PI) / 180; const r = 0.12 + 0.82 * s; return `left:${(50 + 50 * r * Math.sin(a)).toFixed(1)}%;top:${(50 - 50 * r * Math.cos(a)).toFixed(1)}%`; };
function rodaCor(el, e) {
  const b = el.getBoundingClientRect(); const x = e.clientX - b.left - b.width / 2; const y = e.clientY - b.top - b.height / 2; const d = Math.hypot(x, y) / (b.width / 2);
  return d > 1 ? null : hslHex(((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360, Math.min(1, Math.max(0, (d - 0.12) / 0.82)), 0.52);
}
const COR_BARRA ={ light: '#F5F6F9', oled: '#000000' };
const mqEscuro = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const escuroAgora = () => !!(mqEscuro && mqEscuro.matches);

/* contraste: a cor escolhida vira três tons legíveis (texto e destaque, preenchimento com texto branco e brilho) */
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(String(h).slice(i, i + 2), 16) || 0);
const rgbHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const luminancia = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const contraste = (a, b) => { const x = luminancia(a); const y = luminancia(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
function corLegivel(cor, fundo, para) { const c0 = hexRgb(cor); const f = hexRgb(fundo); let c = c0; for (let t = 0.05; t <= 1.001 && contraste(c, f) < 4.5; t += 0.05) c = c0.map((v, i) => v + (para[i] - v) * t); return rgbHex(c); }
function coresDestaque(cor, base) {
  const escuro = base === 'oled';
  const acc = escuro ? corLegivel(cor, '#0F0F11', [255, 255, 255]) : corLegivel(cor, '#FFFFFF', [0, 0, 0]);
  const fill = corLegivel(cor, '#FFFFFF', [0, 0, 0]); const g = hexRgb(acc);
  // cor: o tom escolhido, para gradientes e fundos; mono: a seta do logo acompanha as letras quando a cor não é o azul da marca
  return { base: escuro ? 'oled' : 'light', acc, fill, glow: `rgba(${g.join(', ')}, .36)`, cor, mono: cor.toLowerCase() !== '#0a84ff' };
}
const temaCustom = () => { const c = (typeof S !== 'undefined' && S.profile && S.profile.prefs && S.profile.prefs.custom) || {}; return { base: c.base === 'oled' ? 'oled' : 'light', cor: /^#[0-9a-f]{6}$/i.test(c.cor || '') ? c.cor : '#0A84FF' }; };
/* prefs.tema: 'auto' | 'light' | 'oled' | 'custom'. prefs.manual guarda o último tema escolhido à mão.
   Com o Automático ligado e o Personalizado escolhido, a cor fica e o fundo segue o aparelho. */
function aplicarTema(pref, animar) {
  pref = TEMAS[pref] ? pref : pref === 'midnight' ? 'oled' : 'auto'; const h = document.documentElement;
  const manual = typeof S !== 'undefined' && S.profile && S.profile.prefs ? S.profile.prefs.manual : null;
  const custom = pref === 'custom' || (pref === 'auto' && manual === 'custom');
  if (animar) { h.classList.add('tema-anim'); setTimeout(() => h.classList.remove('tema-anim'), 650); }
  let r = pref === 'light' || pref === 'oled' ? pref : pref === 'custom' ? temaCustom().base : escuroAgora() ? 'oled' : 'light';
  if (custom) {
    const k = temaCustom(); const cs = coresDestaque(k.cor, r); r = cs.base;
    h.dataset.custom = '1'; h.style.setProperty('--u-acc', cs.acc); h.style.setProperty('--u-fill', cs.fill); h.style.setProperty('--u-glow', cs.glow); h.style.setProperty('--u-cor', cs.cor);
    if (cs.mono) h.dataset.mono = '1'; else delete h.dataset.mono;
    try { localStorage.setItem('fp:temaCustom', JSON.stringify(cs)); } catch (e) { /* ignora */ }
  } else {
    delete h.dataset.custom; delete h.dataset.mono; ['--u-acc', '--u-fill', '--u-glow', '--u-cor'].forEach((v) => h.style.removeProperty(v));
    try { localStorage.removeItem('fp:temaCustom'); } catch (e) { /* ignora */ }
  }
  h.dataset.theme = r; h.dataset.themePref = pref;
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', COR_BARRA[r]);
  try { localStorage.setItem('fp:tema', pref); } catch (e) { /* ignora */ }
}
if (mqEscuro && mqEscuro.addEventListener) mqEscuro.addEventListener('change', () => { if ((document.documentElement.dataset.themePref || 'auto') === 'auto') aplicarTema('auto', true); });

/* ---------------- voz ---------------- */
// três vozes; cada uma também define o visual do card do objetivo na Visão geral (VISUAL_VOZ)
const VOZES = {
  consultivo: { nome: 'Consultivo', desc: 'Equilibrado, como o seu assessor. Objetivo com foto.' },
  direto: { nome: 'Direto', desc: 'Curto e objetivo. Visual limpo, sem fotos.' },
  acolhedor: { nome: 'Acolhedor', desc: 'Caloroso e encorajador. Objetivo em 3D.' },
};
const VOZ = {
  consultivo: {
    deficit: 'Em {ano}, os gastos superaram as entradas registradas em {valor}. Falta registrar alguma renda?',
    saudacao: '{saud}, {nome}.', titulo: 'Seu planejamento de {ano}, em um relance.',
    orc_ok: 'Você usou {pct} do orçamento de {mes}. Ainda restam {restante}.',
    orc_estourou: 'Você passou do orçamento de {mes} em {valor}. Vale rever os gastos do mês.',
    orc_definir: 'Defina um orçamento para {mes} e acompanhe quanto ainda pode gastar.',
    poupanca: 'Em {ano}, {pct} da sua renda sobrou para investir ({valor}).',
    aporte_mes: 'Em {mes} você aportou {valor}, {pct} da meta mensal de {meta}.',
    carteira_desvio: '{ativo} está {pp} p.p. abaixo do alvo. O próximo aporte deve priorizá-lo.',
    sem_dados: 'Comece registrando suas rendas e seus gastos, ou importe um extrato. Em poucos minutos o painel mostra para onde vai o seu dinheiro.',
    ingest_ok: 'Importação concluída: {resumo}.', mes_vazio: 'Nenhum lançamento neste mês ainda. Importe um extrato ou adicione o primeiro gasto.',
    exemplo: 'Você usou 78% do orçamento de março. Ainda restam R$ 1.320.',
  },
  direto: {
    deficit: 'Gastos {valor} acima das entradas em {ano}. Falta lançar renda?',
    saudacao: 'Olá, {nome}.', titulo: '{ano}: onde você está.',
    orc_ok: '{pct} do orçamento de {mes} usado. Restam {restante}.', orc_estourou: 'Estourou {valor} em {mes}. Reveja os gastos.',
    orc_definir: 'Sem orçamento em {mes}. Defina um.', poupanca: '{pct} da renda sobrou em {ano} ({valor}).',
    aporte_mes: '{mes}: {valor} aportados, {pct} da meta de {meta}.', carteira_desvio: '{ativo}: {pp} p.p. abaixo do alvo. Priorize no aporte.',
    sem_dados: 'Sem dados. Importe um extrato ou lance rendas e gastos.', ingest_ok: 'Importado: {resumo}.', mes_vazio: 'Mês vazio. Importe ou lance.',
    exemplo: '78% do orçamento de março usado. Restam R$ 1.320.',
  },
  acolhedor: {
    deficit: 'Em {ano}, os gastos passaram das entradas registradas em {valor}. Será que falta lançar alguma renda?',
    saudacao: '{saud}, {nome}! Que bom ter você aqui.', titulo: 'Vamos ver como está o seu {ano}?',
    orc_ok: 'Tudo certo por aqui: você usou {pct} do orçamento de {mes} e ainda tem {restante} disponíveis.',
    orc_estourou: 'O orçamento de {mes} passou em {valor}. Acontece! Que tal olhar com calma onde dá para ajustar?',
    orc_definir: 'Que tal definir um orçamento para {mes}? Ele ajuda a saber quanto ainda cabe no mês.',
    poupanca: 'Boa notícia: {pct} da sua renda de {ano} sobrou para investir ({valor}).',
    aporte_mes: 'Em {mes} você aportou {valor}, {pct} da sua meta de {meta}. Cada aporte conta!',
    carteira_desvio: '{ativo} está {pp} p.p. abaixo do alvo. No próximo aporte, ele merece um carinho extra.',
    sem_dados: 'Vamos começar? Registre suas rendas e gastos ou importe um extrato, e o painel mostra para onde vai o seu dinheiro.',
    ingest_ok: 'Pronto! {resumo}.', mes_vazio: 'Este mês ainda está em branco. Importe um extrato ou adicione o primeiro gasto.',
    exemplo: 'Tudo certo: você usou 78% do orçamento de março e ainda tem R$ 1.320.',
  },
};
// a antiga voz Executivo ('formal') passou a ser Direto
const tomAtual = () => { const v = typeof S !== 'undefined' && S.profile && S.profile.prefs ? S.profile.prefs.voz : null; return v === 'formal' ? 'direto' : VOZ[v] ? v : 'consultivo'; };
// card do objetivo: Consultivo com a foto, Direto sem foto (vidro azul-noite limpo), Acolhedor com o objeto 3D (obj3d.js)
const VISUAL_VOZ = { consultivo: 'foto', direto: 'limpo', acolhedor: '3d' };
const visualAtual = () => VISUAL_VOZ[tomAtual()] || 'foto';
function voz(chave, vars) {
  const t = VOZ[tomAtual()][chave] != null ? VOZ[tomAtual()][chave] : VOZ.consultivo[chave] || '';
  return t.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));
}
const saudacaoHora = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

/* ---------------- ações e interface de preferências ---------------- */
function definirTema(pref) {
  if (!S.profile) return; const p = S.profile.prefs;
  if (pref === 'auto-on') p.tema = 'auto';
  else if (pref === 'auto-off') p.tema = p.manual || (escuroAgora() ? 'oled' : 'light');
  else if (TEMAS[pref] && pref !== 'auto') { p.manual = pref; if (p.tema !== 'auto') p.tema = pref; else if (pref !== 'custom') p.tema = pref; }
  touch('profile'); aplicarTema(p.tema, true); if (S.adminOpen) renderAdmin();
}
function definirCor(campo, valor) {
  if (!S.profile) return; const p = S.profile.prefs; p.custom = Object.assign({ base: 'light', cor: '#0A84FF' }, p.custom);
  // escolher uma cor estando no Claro ou no Escuro já leva para o Personalizado com o mesmo fundo
  if (campo === 'cor' && p.manual !== 'custom') p.custom.base = (p.tema === 'auto' ? escuroAgora() : p.tema === 'oled') ? 'oled' : 'light';
  if (campo === 'base') p.custom.base = valor === 'oled' ? 'oled' : 'light'; else if (/^#[0-9a-f]{6}$/i.test(valor || '')) p.custom.cor = valor;
  p.manual = 'custom'; if (p.tema !== 'auto') p.tema = 'custom'; touch('profile'); aplicarTema(p.tema, true); if (S.adminOpen) renderAdmin();
}
// fundo atrás do vidro no SaaS, no computador (CSS em .fundo-vivo, nas cores do tema; parado com "reduzir movimento"); vazio = só o fundo do tema;
// "objetivo" usa a foto do objetivo em foco (assets/img/objetivos/<tipo>.jpg, com endereço completo: url() numa variável é lido a partir do CSS); a transparência do vidro (0 a 100) vai em --vt
const FUNDOS = [['', 'Nenhum'], ['horizonte', 'Horizonte'], ['ondas', 'Ondas'], ['aurora', 'Aurora'], ['particulas', 'Partículas'], ['objetivo', 'Seu objetivo']];
const FUNDO_FOTOS = ['imovel', 'carro', 'viagem', 'filhos', 'casamento', 'negocio', 'aposentadoria', 'educacao', 'reserva', 'independencia', 'outro'];
function aplicarFundo() {
  const p = S.profile && S.profile.prefs ? S.profile.prefs : {}; const v = p.fundo; const h = document.documentElement;
  if (v && FUNDOS.some((f) => f[0] === v)) h.dataset.fundo = v; else delete h.dataset.fundo;
  if (v === 'objetivo') { const os = (S.profile && S.profile.objetivos) || []; const o = os.find((x) => x.id === S.profile.objetivoFoco) || os[0]; const t = o && FUNDO_FOTOS.includes(o.tipo) ? o.tipo : 'outro'; h.style.setProperty('--fundo-img', `url("${new URL(`assets/img/objetivos/${t}.jpg`, document.baseURI).href}")`); }
  h.style.setProperty('--vt', p.vidro == null ? 40 : Math.max(0, Math.min(100, +p.vidro || 0)));
}
function definirFundo(v) { if (!S.profile || !FUNDOS.some((f) => f[0] === v)) return; S.profile.prefs.fundo = v; touch('profile'); aplicarFundo(); if (S.adminOpen) renderAdmin(); }
// transparência do vidro: enquanto arrasta só troca a variável; ao soltar grava no perfil
function definirVidro(n, salvar) { if (!S.profile) return; S.profile.prefs.vidro = Math.max(0, Math.min(100, Math.round(+n || 0))); aplicarFundo(); if (salvar) touch('profile'); }
// troca de aparência (tema, cor, fundo): o visual novo se espalha pela página num círculo que nasce de onde o cliente tocou (View Transitions)
let apPonto = null;
document.addEventListener('pointerdown', (e) => { apPonto = [e.clientX, e.clientY]; }, true);
function aparenciaTroca(fn) {
  const h = document.documentElement;
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { fn(); return; }
  const [x, y] = apPonto || [innerWidth / 2, innerHeight / 2]; const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  h.classList.add('vt-ap');
  const t = document.startViewTransition(() => { fn(); });
  t.ready.then(() => { h.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 780, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' }); }).catch(() => {});
  t.finished.finally(() => h.classList.remove('vt-ap'));
}
function definirVoz(v) { if (!S.profile || !VOZ[v]) return; S.profile.prefs.voz = v; touch('profile'); render(); if (S.adminOpen) renderAdmin(); toast('Voz alterada: ' + VOZES[v].nome + '.'); }
function prefsHtml() {
  const p = S.profile.prefs; const auto = p.tema === 'auto'; const escolhido = auto ? p.manual || null : p.tema; const k = temaCustom();
  const amostra = (id) => `<span class="ap-sw" aria-hidden="true">${(id === 'custom' ? [k.base === 'oled' ? '#000000' : '#F5F6F9', k.cor] : TEMAS[id].sw).map((c) => `<i style="background:${c}"></i>`).join('')}</span>`;
  const opcoes = ['light', 'oled', 'custom'].map((id) => `<button class="ap-op" data-act="tema" data-tema="${id}" aria-pressed="${escolhido === id}">${amostra(id)}<span><b>${TEMAS[id].nome}</b><small>${TEMAS[id].desc}</small></span></button>`).join('');
  const fundo = [['light', 'Claro'], ['oled', 'Escuro']].map(([v, l]) => `<button class="${k.base === v ? 'on' : ''}" data-act="tema-cor" data-campo="base" data-v="${v}" aria-pressed="${k.base === v}"${auto ? ' disabled' : ''}>${l}</button>`).join('');
  // roda de cores: cada sugestão fica no seu tom (ângulo) e intensidade (distância do centro); tocar em qualquer ponto escolhe aquele tom
  const pre = CORES_DESTAQUE.find(([c]) => c.toLowerCase() === k.cor.toLowerCase());
  const cores = CORES_DESTAQUE.map(([c, n]) => `<button class="ap-cor" style="--c:${c};${rodaPos(c)}" data-act="tema-cor" data-campo="cor" data-v="${c}" aria-pressed="${escolhido === 'custom' && pre && pre[0] === c}" aria-label="${n}" title="${n}"></button>`).join('');
  const marca = escolhido === 'custom' && !pre ? `<i class="ap-roda-m" style="--c:${k.cor};${rodaPos(k.cor)}" aria-hidden="true"></i>` : '';
  // "Outra cor" abre o seletor do aparelho (e serve a quem usa teclado); o contraste é ajustado sozinho
  const livre = `<label class="ap-cor ap-livre" title="Outra cor" style="--c:${k.cor}"><input type="color" data-tema-livre value="${k.cor}" aria-label="Escolher outra cor de destaque"></label>`;
  const custom = `<div class="ap-custom"><div class="ap-linha"><span>Cor de destaque</span><div class="ap-rodabox"><div class="ap-roda" data-act="tema-roda" role="group" aria-label="Roda de cores">${cores}${marca}</div>
      <div class="ap-roda-t"><b>${escolhido !== 'custom' ? 'Escolha uma cor' : pre ? pre[1] : 'Cor própria'}</b><small>Em volta da roda muda o tom; do centro para a borda, a intensidade. Toque em qualquer ponto.</small><span class="ap-roda-o">${livre}<small>Outra cor</small></span></div></div></div>
    ${escolhido === 'custom' ? `<div class="ap-linha"><span>Fundo${auto ? ' <small>(segue o aparelho)</small>' : ''}</span><div class="seg" role="group" aria-label="Fundo do tema personalizado">${fundo}</div></div>` : ''}</div>`;
  const vozes = Object.keys(VOZES).map((v) => `<button class="ap-voz" data-act="voz" data-voz="${v}" aria-pressed="${tomAtual() === v}"><b>${VOZES[v].nome}</b><small>${VOZES[v].desc}</small></button>`).join('');
  // dentro da página "Personalizar o painel" (admin.js): cada uma vira um título com setinha (admAcordeao)
  return `<section class="dr-sec"><h3>Aparência</h3>
      <label class="ap-auto"><span><b>Automático</b><small>Claro de dia, escuro à noite, como o aparelho.</small></span><span class="wg-sw"><input type="checkbox" data-tema-auto ${auto ? 'checked' : ''} aria-label="Tema automático"><span></span></span></label>
      <div class="ap-ops" role="group" aria-label="Tema">${opcoes}</div>${custom}
      <div class="ap-linha ap-fundo"><span>Fundo <small>(no computador)</small></span><div class="seg" role="group" aria-label="Fundo">${FUNDOS.map(([v, l]) => `<button class="${(p.fundo || '') === v ? 'on' : ''}" data-act="fundo" data-v="${v}" aria-pressed="${(p.fundo || '') === v}">${l}</button>`).join('')}</div></div>
      <label class="ap-linha ap-vidro"><span>Transparência do vidro <small>(no computador)</small></span><span class="ap-vidro-c"><small>Sólido</small><input type="range" min="0" max="100" step="5" value="${p.vidro == null ? 40 : p.vidro}" data-vidro aria-label="Transparência do vidro"><small>Transparente</small></span></label></section>
    <section class="dr-sec"><h3>Voz do painel</h3><div class="ap-vozes">${vozes}</div></section>`;
}

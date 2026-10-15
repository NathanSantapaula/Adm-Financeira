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
const CORES_DESTAQUE = [['#0A84FF', 'Azul AVEN'], ['#5E5CE6', 'Índigo'], ['#10B981', 'Esmeralda'], ['#14B8A6', 'Turquesa'], ['#E8436F', 'Rosa'], ['#F97316', 'Laranja'], ['#D4A017', 'Dourado'], ['#64748B', 'Grafite']];
const COR_BARRA = { light: '#F5F6F9', oled: '#000000' };
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
const VOZES = {
  consultivo: { nome: 'Consultivo', desc: 'Equilibrado, como o seu assessor.' },
  formal: { nome: 'Executivo', desc: 'Formal, como um relatório.' },
  direto: { nome: 'Direto', desc: 'Curto e objetivo.' },
  acolhedor: { nome: 'Acolhedor', desc: 'Caloroso e encorajador.' },
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
  formal: {
    deficit: 'No exercício de {ano}, os gastos superaram as entradas registradas em {valor}. Verifique se há rendas não lançadas.',
    saudacao: '{saud}, {nome}.', titulo: 'Posição consolidada de {ano}.',
    orc_ok: 'O orçamento de {mes} foi utilizado em {pct}, restando {restante}.',
    orc_estourou: 'O orçamento de {mes} foi excedido em {valor}. Recomenda-se revisar os gastos do período.',
    orc_definir: 'Não há orçamento definido para {mes}. Recomenda-se estabelecê-lo para acompanhamento.',
    poupanca: 'No exercício de {ano}, {pct} da renda foi destinada à poupança ({valor}).',
    aporte_mes: 'Em {mes}, os aportes somaram {valor}, equivalentes a {pct} da meta mensal de {meta}.',
    carteira_desvio: '{ativo} encontra-se {pp} p.p. abaixo da alocação-alvo. Sugere-se priorizá-lo no próximo aporte.',
    sem_dados: 'Não há lançamentos registrados. Registre rendas e gastos ou importe um extrato para iniciar a análise.',
    ingest_ok: 'Importação concluída: {resumo}.', mes_vazio: 'Não há lançamentos registrados neste mês.',
    exemplo: 'O orçamento de março foi utilizado em 78%, restando R$ 1.320.',
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
const tomAtual = () => (typeof S !== 'undefined' && S.profile && S.profile.prefs && VOZ[S.profile.prefs.voz] ? S.profile.prefs.voz : 'consultivo');
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
  if (campo === 'base') p.custom.base = valor === 'oled' ? 'oled' : 'light'; else if (/^#[0-9a-f]{6}$/i.test(valor || '')) p.custom.cor = valor;
  p.manual = 'custom'; if (p.tema !== 'auto') p.tema = 'custom'; touch('profile'); aplicarTema(p.tema, true); if (S.adminOpen) renderAdmin();
}
function definirVoz(v) { if (!S.profile || !VOZ[v]) return; S.profile.prefs.voz = v; touch('profile'); render(); if (S.adminOpen) renderAdmin(); toast('Voz alterada: ' + VOZES[v].nome + '.'); }
function prefsHtml() {
  const p = S.profile.prefs; const auto = p.tema === 'auto'; const escolhido = auto ? p.manual || null : p.tema; const k = temaCustom();
  const amostra = (id) => `<span class="ap-sw" aria-hidden="true">${(id === 'custom' ? [k.base === 'oled' ? '#000000' : '#F5F6F9', k.cor] : TEMAS[id].sw).map((c) => `<i style="background:${c}"></i>`).join('')}</span>`;
  const opcoes = ['light', 'oled', 'custom'].map((id) => `<button class="ap-op" data-act="tema" data-tema="${id}" aria-pressed="${escolhido === id}">${amostra(id)}<span><b>${TEMAS[id].nome}</b><small>${TEMAS[id].desc}</small></span></button>`).join('');
  const fundo = [['light', 'Claro'], ['oled', 'Escuro']].map(([v, l]) => `<button class="${k.base === v ? 'on' : ''}" data-act="tema-cor" data-campo="base" data-v="${v}" aria-pressed="${k.base === v}"${auto ? ' disabled' : ''}>${l}</button>`).join('');
  const cores = CORES_DESTAQUE.map(([c, n]) => `<button class="ap-cor" style="--c:${c}" data-act="tema-cor" data-campo="cor" data-v="${c}" aria-pressed="${k.cor.toLowerCase() === c.toLowerCase()}" aria-label="${n}" title="${n}"></button>`).join('');
  const custom = escolhido === 'custom' ? `<div class="ap-custom"><div class="ap-linha"><span>Fundo${auto ? ' <small>(segue o aparelho)</small>' : ''}</span><div class="seg" role="group" aria-label="Fundo do tema personalizado">${fundo}</div></div>
    <div class="ap-linha"><span>Cor de destaque</span><div class="ap-cores" role="group" aria-label="Cor de destaque">${cores}</div></div></div>` : '';
  const vozes = Object.keys(VOZES).map((v) => `<button class="ap-voz" data-act="voz" data-voz="${v}" aria-pressed="${p.voz === v}"><b>${VOZES[v].nome}</b><small>${VOZES[v].desc}</small></button>`).join('');
  // dentro da página "Personalizar o painel" (admin.js): cada uma vira um título com setinha (admAcordeao)
  return `<section class="dr-sec"><h3>Aparência</h3>
      <label class="ap-auto"><span><b>Automático</b><small>Claro de dia, escuro à noite, como o aparelho.</small></span><span class="wg-sw"><input type="checkbox" data-tema-auto ${auto ? 'checked' : ''} aria-label="Tema automático"><span></span></span></label>
      <div class="ap-ops" role="group" aria-label="Tema">${opcoes}</div>${custom}</section>
    <section class="dr-sec"><h3>Voz do painel</h3><div class="ap-vozes">${vozes}</div></section>`;
}

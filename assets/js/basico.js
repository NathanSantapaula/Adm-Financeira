/* Modo Básico: a segunda interface, para quem está começando. Jeito de app de celular: números grandes, pouco texto,
   uma ação principal por tela e abas embaixo; no computador fica centralizado como um app.
   Mesmos dados (S.plan, S.profile) e os mesmos cálculos do engine; só a tela muda. Escolha em S.profile.interface.
   Telas próprias, sem modais nem painéis do Completo: cada aba, detalhe e formulário entra numa pilha (S.basPilha),
   com voltar pelo botão, pelo Esc e pelo voltar do celular (history). */
'use strict';
const BASICO_PAGANTES = true; // pagantes podem trocar para o Básico; false = Básico só no plano gratuito
const modoBasico = () => S.screen === 'app' && !!S.profile && !S.isAdmin && E.interfaceDe(planoAtual(), S.profile.interface, BASICO_PAGANTES) === 'basico';
const basEscolhe = () => BASICO_PAGANTES && !S.isAdmin && planoAtual() !== 'gratis'; // só pagantes escolhem a versão
const BAS_NOMES = { basico: 'Simples', completo: 'Completo' }; // nomes dos dois modos na tela (troque aqui, por exemplo, por "SaaS")
// seletor dos dois modos: Perfil do Simples, página inicial do painel e o Mais do celular no Completo (só para quem pode escolher)
const basTrocaHtml = () => { const v = E.interfaceDe(planoAtual(), S.profile.interface, BASICO_PAGANTES);
  return `<div class="seg bas-troca" role="group" aria-label="Modo do app">${['basico', 'completo'].map((k) => `<button${v === k ? ' class="on"' : ''} data-act="bas-ui" data-v="${k}" aria-pressed="${v === k}">${BAS_NOMES[k]}</button>`).join('')}</div>`; };
const BAS_ABAS = [['inicio', 'Início', I.geral], ['gastos', 'Gastos', I.despesas], ['investir', 'Investir', I.inv], ['perfil', 'Perfil', I.user]];
const BAS_FORMS = new Set(['gasto', 'conta-f', 'entrada', 'aporte', 'meta', 'objetivo', 'perfil', 'provento']); // telas de formulário escondem as abas
const BAS_AREAS = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Compras', 'Contas', 'Educação'];
// onde o dinheiro foi investido: rótulo, tipo e classe do ativo (os mesmos campos do Completo)
const BAS_ONDE = [['Poupança', 'RENDA FIXA', 'Poupança'], ['CDB', 'RENDA FIXA', "CDB's"], ['Tesouro Direto', 'RENDA FIXA', 'Tesouro Direto'], ['LCI ou LCA', 'RENDA FIXA', 'LCI/LCA'],
  ['Ações', 'BOLSA DE VALORES', 'Ações BR'], ['Fundos imobiliários', 'BOLSA DE VALORES', 'Fundos Imobiliários'], ['Outro', 'OUTROS', 'Outros']];
const I_VOLTA = ic('<path d="m15 6-6 6 6 6"/>');

// textos de orientação nas três vozes (os números nunca mudam com a voz)
const BAS_VOZ = {
  consultivo: { bas_disp_sim: 'É o que sobrou e ainda não foi investido.', bas_disp_tudo: 'Tudo o que sobrou já foi investido.', bas_disp_nao: 'Este mês ainda não sobrou dinheiro para investir.',
    bas_vazio: 'Anote o que entrou e o que saiu, e o painel mostra quanto sobra.', bas_meta_ok: 'Meta do mês cumprida.', bas_meta_sem: 'Defina quanto quer investir por mês.' },
  direto: { bas_disp_sim: 'Sobrou e não foi investido.', bas_disp_tudo: 'Sobra toda investida.', bas_disp_nao: 'Sem sobra este mês.',
    bas_vazio: 'Anote entradas e gastos para ver a sobra.', bas_meta_ok: 'Meta cumprida.', bas_meta_sem: 'Defina a meta mensal.' },
  acolhedor: { bas_disp_sim: 'Esse dinheiro sobrou e está esperando por você.', bas_disp_tudo: 'Tudo o que sobrou já está investido. Que orgulho!', bas_disp_nao: 'Este mês ainda não sobrou. Tudo bem, um passo de cada vez.',
    bas_vazio: 'Vamos começar? Anote o que entrou e o que saiu e eu mostro quanto sobra.', bas_meta_ok: 'Você cumpriu a meta do mês!', bas_meta_sem: 'Que tal definir quanto quer investir por mês?' },
};
Object.keys(BAS_VOZ).forEach((t) => { if (VOZ[t]) Object.assign(VOZ[t], BAS_VOZ[t]); });

/* ---------- peças de tela ---------- */
const basAba = () => (BAS_ABAS.some((a) => a[0] === S.basAba) ? S.basAba : 'inicio');
const basPilha = () => (S.basPilha = S.basPilha || []);
const basTopoPilha = () => basPilha()[basPilha().length - 1] || null;
const basBarra = (f) => `<span class="bas-bar" aria-hidden="true"><i style="width:${(Math.max(0, Math.min(1, f)) * 100).toFixed(1)}%"></i></span>`;
const basCard = (corpo, cls) => `<section class="card bas-card${cls ? ' ' + cls : ''}">${corpo}</section>`;
const basVazio = (t) => `<p class="bas-vz">${t}</p>`;
const basIr = (t, o) => `data-act="bas-abrir" data-t="${t}"${['id', 'area', 'op', 'modo'].map((k) => (o && o[k] != null ? ` data-${k}="${esc(o[k])}"` : '')).join('')}`;
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
  document.body.dataset.basFolha = t && BAS_FORMS.has(t.t) ? '1' : '';
  $('#tabbar').innerHTML = `<div class="bas-tabs">${BAS_ABAS.map(([k, l, i]) => `<button data-act="bas-aba" data-v="${k}" ${a === k ? 'aria-current="page"' : ''}>${i}<span>${l}</span></button>`).join('')}</div>`;
}
// cabeçalho das telas empilhadas: voltar (ou cancelar, nos formulários) e o título grande
const basNav = (titulo, form) => `<header class="bas-nav"><button type="button" class="bas-voltar" data-act="bas-voltar">${form ? 'Cancelar' : I_VOLTA + '<span>Voltar</span>'}</button>${form ? '' : olhoHtml()}</header><h1 class="bas-tit">${titulo}</h1>`;
const basDet = (titulo, corpo) => `${basNav(titulo)}${corpo}`;
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
  basPilha().push(Object.assign({ t, volta: window.scrollY }, o)); history.pushState({ bas: basPilha().length }, '');
  render(); window.scrollTo(0, 0); const f = $('#view [data-foco]'); if (f && matchMedia('(pointer: coarse)').matches === false) f.focus({ preventScroll: true });
}
function basFechar() {
  const t = basPilha().pop(); render(); window.scrollTo(0, t ? t.volta || 0 : 0);
  if (history.state && history.state.bas) history.back(); // o popstate vê a pilha já menor e não faz nada
}
function basLimpar() { const n = basPilha().length; S.basPilha = []; if (n && history.state && history.state.bas) history.go(-Math.min(n, history.state.bas)); }
window.addEventListener('popstate', (e) => { // voltar do celular ou do navegador
  const n = (e.state && e.state.bas) || 0; if (!modoBasico() || n >= basPilha().length) return;
  const t = basPilha()[n]; S.basPilha.length = n; if ($('#modal').open) $('#modal').close(); render(); window.scrollTo(0, t.volta || 0);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modoBasico() && basPilha().length && !$('#modal').open) { e.preventDefault(); basFechar(); } });
document.addEventListener('submit', (e) => { const f = e.target; if (f.dataset.form !== 'bas') return; e.preventDefault(); basSalvar(f); });

function basicoHtml() {
  if (!S.plan) return `<div class="bas">${basCard(`<h2 class="bas-h2">Vamos começar</h2><p class="bas-p">${voz('bas_vazio')}</p><button class="btn primary lg bas-cta" data-act="create-plan">Começar ${S.year || NOW_Y}</button>`)}</div>`;
  const t = basTopoPilha();
  if (t) { const f = BAS_TELAS[t.t]; return `<div class="bas bas-tela" data-t="${t.t}">${f ? f(t) : basSumiu()}</div>`; }
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
const basIrInv = () => (temRecurso('aporte_simples') ? basIr('aporte') : `data-act="upgrade" data-plano="${planoMinimoDe('aporte_simples')}"`);

/* painel escuro de cada aba (o mesmo desenho nas quatro, cada uma com o seu número e as suas ações):
   o = { topo (html à esquerda), mes (seletor de mês), k (rótulo), v (valor), neg, sub (html), par [[rótulo, html, attrs]], acoes [[attrs, ícone, rótulo]], extra (html) } */
function basNoite(o) {
  const m = S.mes; const seta = (d, l, ok) => `<button class="bas-seta" data-act="bas-mes" data-d="${d}" aria-label="${l}"${ok ? '' : ' disabled'}>${d < 0 ? I_VOLTA : I.chev}</button>`;
  const acao = ([attrs, icone, rot]) => `<button class="bas-ac" ${attrs}><span class="bas-ac-c" aria-hidden="true">${icone}</span><span>${rot}</span></button>`;
  const par = (o.par || []).map(([rot, v, attrs]) => (attrs ? `<button ${attrs}><small>${rot}</small><b>${v}</b></button>` : `<span><small>${rot}</small><b>${v}</b></span>`)).join('');
  return `<section class="bas-noite">
    <header class="bas-noite-h">${o.topo}${olhoHtml()}</header>
    ${o.mes ? `<div class="bas-mes bas-mes-n">${seta(-1, 'Mês anterior', m > 0)}<b>${cap(MES_LONGO[m])}${S.year !== NOW_Y ? ' ' + S.year : ''}</b>${seta(1, 'Próximo mês', m < 11)}</div>` : ''}
    ${o.k ? `<small class="bas-noite-k">${o.k}</small><b class="bas-noite-v${o.neg ? ' neg' : ''}">${o.v}</b>` : ''}${o.sub || ''}${o.extra || ''}
    ${par ? `<div class="bas-noite-par">${par}</div>` : ''}
    ${o.acoes ? `<div class="bas-acs" style="--n:${o.acoes.length}">${o.acoes.map(acao).join('')}</div>` : ''}</section>`;
}
const basTituloNoite = (t) => `<h1 class="bas-noite-t">${t}</h1>`;
// variação contra o mês anterior (E.variacao, como as fichas do Completo); null sem base
const basVar = (arr, m, bom) => { const va = m > 0 ? E.variacao(arr[m], arr[m - 1]) : null; if (va == null) return '';
  const ok = bom ? va >= 0 : va <= 0; return `<p class="bas-noite-s"><em class="${ok ? 'pos' : 'neg'}">${va >= 0 ? '↗ +' : '↘ −'}${pct(Math.abs(va), 1)}</em> contra ${MES_LONGO[m - 1]}</p>`; };
// cartão sólido que sobe por cima do painel
const basSobre = (attrs, corpo) => `<button class="card bas-sonho" ${attrs}>${corpo}</button>`;
// linhas no jeito de extrato: círculo à esquerda, nome e detalhe, valor à direita
const basRow = (attrs, ini, nome, sub, dir, cor) => `<li><button ${attrs}><span class="bas-ini" aria-hidden="true"${cor ? ` style="--bc:${cor}"` : ''}>${ini}</span>${basNome(nome, sub)}${dir}</button></li>`;
const basSecao = (titulo, link, corpo) => `<div class="bas-ch bas-ch-f"><h2 class="bas-h2">${titulo}</h2>${link || ''}</div>${corpo}`;

/* ---- Início: o que sobrou, as ações do dia a dia, o sonho, o disponível e a atividade ---- */
function basInicio(m) {
  const C = S.C; const p = S.plan; const pr = S.profile; const ent = C.receita[m]; const sai = C.despesas[m]; const sob = C.investAlocado[m];
  const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes });
  const nome = (pr.apelido || pr.nome || '').split(/\s+/)[0];
  const hero = basNoite({ topo: `<button class="bas-eu-m" ${basIr('perfil')} aria-label="Meu perfil">${avatarHtml(pr)}<span><small>${esc(saudacaoHora())}</small><b>${esc(nome || 'Olá')}</b></span></button>`, mes: true,
    k: 'Sobrou no mês', v: basCent(sob), neg: sob < -0.005, sub: basVar(C.investAlocado, m, true),
    par: [['Entrou', basCent(ent)], ['Saiu', basCent(sai), 'data-act="bas-aba" data-v="gastos"']],
    acoes: [[basIr('gasto'), I_GASTO, 'Gasto'], [basIr('entrada'), I_ENTRADA, 'Entrada'], [basIrInv(), I.inv, 'Investir'], [basIr('conta-f'), I_CONTA, 'Conta']] });
  const g = objFoco(objAnalise());
  const sonho = basSobre(g ? basIr('objetivo', { id: g.id }) : basIr('objetivo'), g ? `<span class="bas-sonho-l">${objIcone(g, 0)}${basNome(esc(objNomeDe(g)), `${brl0(g.saldo)} de ${brl0(g.valor)}`)}<b class="bas-pct">${pct(g.progresso)}</b></span>${basBarra(g.progresso)}`
    : `<span class="bas-sonho-l"><span class="obj-ic" aria-hidden="true">${I.plus}</span>${basNome('Qual é o seu sonho?', 'Dê um nome e acompanhe quanto falta')}${I.chev}</span>`);
  const disp = basCard(`<div class="bas-disp"><span class="bas-n"><small class="bas-k">Dá para investir</small><b class="bas-big md">${basCent(D.disponivel)}</b></span>${D.disponivel > 0.005 ? `<button class="btn primary bas-cta" data-act="bas-aba" data-v="investir">Investir</button>` : ''}</div>
    <p class="bas-p">${voz(D.disponivel > 0.005 ? 'bas_disp_sim' : D.sobra > 0.005 ? 'bas_disp_tudo' : !(ent > 0) && !(sai > 0) ? 'bas_vazio' : 'bas_disp_nao')}</p>`);
  const ents = p.rendas.filter((r) => +r.valores[m] > 0.005).map((r) => basRow(basIr('entrada', { id: r.id }), I_ENTRADA, esc(r.nome), `Entrada · ${MES_LONGO[m]}`, `<b class="pos">+${basCent(r.valores[m])}</b>`));
  const ativ = ents.concat(basLancMes(m).slice(0, 6).map(basLancLinha)).slice(0, 7);
  return `${hero}${sonho}${disp}${basSecao('Atividade do mês', '<button class="lnk strong" data-act="bas-aba" data-v="gastos">Ver tudo</button>', ativ.length ? `<ul class="bas-ativ">${ativ.join('')}</ul>` : basCard(basVazio(voz('bas_vazio'))))}`;
}

/* ---- Gastos: quanto saiu e o limite, as ações, as contas por cima, as categorias e os últimos gastos ---- */
const basContas = (m) => E.contasMes({ despesas: S.plan.despesas, carry: E.carryItems(S.plans, S.year), ano: S.year, mes: m });
const basContaLinha = (x) => basRow(basIr('conta', { id: x.id }), x.inst ? instIcone(x.inst) : I_CONTA, esc(x.nome), x.parcela ? `parcela ${x.parcela.i} de ${x.parcela.n}` : 'todo mês',
  `<span class="bas-v"><b>${basCent(x.valor)}</b><em class="bas-st${x.pago ? ' ok' : ''}">${x.pago ? 'Pago' : 'A pagar'}</em></span>`);
const basLancLinha = (l) => { const d = E.parseDataISO(l.data);
  return basRow(basIr('gasto', { id: l.id }), l.inst ? instIcone(l.inst) : esc(basIniciais(l.desc || l.area)), esc(l.desc || l.area), `${esc(l.area)} · ${pad2(d.dia)}/${pad2(d.mes + 1)}`, `<b${l.valor < 0 ? ' class="pos"' : ''}>${l.valor < 0 ? '+' : '−'}${basCent(Math.abs(l.valor))}</b>`); };
function basGastos(m) {
  const C = S.C; const sai = C.despesas[m]; const orc = C.orcamento[m];
  const areas = E.gastosAreaMes(S.plan, E.carryItems(S.plans, S.year), m); const lista = Object.keys(areas).map((k) => [k, areas[k]]).filter((x) => x[1] > 0.005).sort((x, y) => y[1] - x[1]);
  const tot = lista.reduce((s, x) => s + x[1], 0) || 1; const K = basContas(m); const lanc = basLancMes(m).slice(0, 8);
  const lim = orc > 0 ? `<div class="bas-noite-lim${sai > orc ? ' over' : ''}">${basBarra(sai / orc)}<p class="bas-noite-s">${sai <= orc ? `Ainda cabe <b>${brl(orc - sai)}</b> no limite de ${brl(orc)}` : `<em class="neg">Passou ${brl(sai - orc)}</em> do limite de ${brl(orc)}`}</p></div>` : '';
  const hero = basNoite({ topo: basTituloNoite('Gastos'), mes: true, k: `Gastou em ${MES_LONGO[m]}`, v: basCent(sai), sub: basVar(C.despesas, m, false), extra: lim,
    par: [['Lançamentos', String(basLancMes(m).length)], ['Contas pagas', `${K.itens.filter((x) => x.pago).length} de ${K.itens.length}`]],
    acoes: [[basIr('gasto'), I.plus, 'Gasto'], [basIr('conta-f'), I_CONTA, 'Conta'], [basIr('conta-f', { modo: 'parc' }), I_PARC, 'Parcelado']] });
  // por cima do painel: as contas do mês, o que já foi pago
  const sobre = K.itens.length ? basSobre('data-act="bas-rolar" data-alvo="bas-contas"', `<span class="bas-sonho-l"><span class="bas-ini" aria-hidden="true">${I_CONTA}</span>${basNome('Contas do mês', `${brl(K.pago)} de ${brl(K.total)} pagos`)}<b class="bas-pct">${pct(K.total > 0 ? K.pago / K.total : 0)}</b></span>${basBarra(K.total > 0 ? K.pago / K.total : 0)}`)
    : basSobre(basIr('conta-f'), `<span class="bas-sonho-l"><span class="bas-ini" aria-hidden="true">${I_CONTA}</span>${basNome('Contas do mês', 'Aluguel, internet, parcelas: anote o que se repete')}${I.chev}</span>`);
  const cats = lista.length ? `<ul class="bas-ativ">${lista.map(([n, v], i) => basRow(basIr('categoria', { area: n }), esc(basIniciais(n)), esc(n), `${pct(v / tot)} do mês`, `<b>${basCent(v)}</b>`, PAL[i % 6])).join('')}</ul>` : basCard(basVazio('Nenhum gasto neste mês.'));
  const contas = K.itens.length ? `<div id="bas-contas">${basSecao('Contas do mês', `<button class="lnk strong" ${basIr('conta-f')}>Nova</button>`, `<ul class="bas-ativ">${K.itens.map(basContaLinha).join('')}</ul>`)}</div>` : '';
  const ult = lanc.length ? basSecao('Últimos gastos', '', `<ul class="bas-ativ">${lanc.map(basLancLinha).join('')}</ul>`) : '';
  return `${hero}${sobre}${basSecao('Por categoria', '', cats)}${contas}${ult}`;
}

/* ---- Investir: patrimônio, as ações, a meta por cima, o disponível, proventos, carteira e o sonho ---- */
function basInvestir(m) {
  const C = S.C; const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes }); const pode = temRecurso('aporte_simples');
  const acoes = [[basIrInv(), I.plus, 'Investir'], [pode ? basIr('aporte', { op: '-1' }) : basIrInv(), I_RESGATE, 'Resgatar']]
    .concat(temRecurso('proventos') ? [[basIr('proventos'), I_PROV, 'Proventos']] : [[basIr('meta'), I_META, 'Meta']])
    .concat(temRecurso('carteira') ? [[basIr('carteira'), I_CART, 'Carteira']] : [[basIr('objetivos'), OBJ_ICONES.independencia || I_META, 'Sonhos']]);
  const hero = basNoite({ topo: basTituloNoite('Investir'), mes: true, k: `Patrimônio em ${MES_LONGO[m]}`, v: basCent(C.patrimonio[m]), sub: basVar(C.patrimonio, m, true),
    par: [['Investido no mês', basCent(D.aportado)], ['Dá para investir', basCent(D.disponivel)]], acoes });
  const f = D.meta > 0 ? D.aportado / D.meta : 0;
  const sobre = basSobre(basIr('meta'), D.meta > 0 ? `<span class="bas-sonho-l"><span class="bas-ini" aria-hidden="true">${I_META}</span>${basNome(`Meta de ${MES_LONGO[m]}`, `${brl(D.aportado)} de ${brl(D.meta)}`)}<b class="bas-pct">${pct(Math.min(1, f))}</b></span>${basBarra(f)}
    <p class="bas-p bas-p-s">${f >= 1 ? voz('bas_meta_ok') : `Faltam <b>${brl(D.faltaMeta)}</b> para a meta.`}</p>` : `<span class="bas-sonho-l"><span class="bas-ini" aria-hidden="true">${I_META}</span>${basNome('Meta de investimento', voz('bas_meta_sem'))}${I.chev}</span>`);
  const ativos = S.plan.ativos.filter((a) => Math.abs(+a.ap[m] || 0) > 0.005);
  const feitos = ativos.length ? basSecao(`Investido em ${MES_LONGO[m]}`, '', `<ul class="bas-ativ">${ativos.map((a, i) => basRow(pode ? basIr('aporte', { id: a.id }) : 'disabled', esc(basIniciais(a.nome)), esc(a.nome), a.ap[m] < 0 ? 'Resgate' : E.norm(a.classe) === E.norm(a.nome) ? '' : esc(a.classe || ''), `<b class="${a.ap[m] < 0 ? 'neg' : 'pos'}">${a.ap[m] < 0 ? '−' : '+'}${basCent(Math.abs(a.ap[m]))}</b>`, PAL[i % 6])).join('')}</ul>`) : '';
  const extras = [temRecurso('proventos') ? basRow(basIr('proventos'), I_PROV, 'Proventos', `${brl(C.T.faturamento)} em ${S.year}`, `<b class="pos">${basCent(C.faturamento[m])}</b>`) : '',
    temRecurso('carteira') ? basRow(basIr('carteira'), I_CART, 'Minha carteira', 'Divisão e onde investir agora', I.chev) : ''].filter(Boolean);
  const g = objFoco(objAnalise());
  const sonho = basSecao('Meu sonho', `<button class="lnk strong" ${g ? basIr('objetivos') : basIr('objetivo')}>${g ? 'Ver todos' : 'Criar'}</button>`,
    g ? basCard(`<button class="bas-obj" ${basIr('objetivo', { id: g.id })}>${objIcone(g, 0)}${basNome(esc(objNomeDe(g)), `${brl0(g.saldo)} de ${brl0(g.valor)}${g.ano ? ' até ' + g.ano : ''}`)}<b class="bas-pct">${pct(g.progresso)}</b></button>${basBarra(g.progresso)}<p class="bas-p">${esc(objFrase(g))}</p>`)
      : basCard('<p class="bas-p bas-p0">Uma viagem, uma reserva, a casa própria: dê um nome ao seu sonho e acompanhe quanto falta.</p>'));
  return `${hero}${sobre}${extras.length ? basSecao('Acompanhar', '', `<ul class="bas-ativ">${extras.join('')}</ul>`) : ''}${feitos}${sonho}<p class="bas-disc keep">Projeção ilustrativa, sem promessa de rentabilidade.</p>`;
}

/* ---- Perfil: quem é, atalhos em círculos, o modo do app por cima e os ajustes em linhas ---- */
function basPerfil() {
  const p = S.profile; const t = p.prefs.tema; const temaNome = { auto: 'Automático', light: 'Claro', oled: 'Escuro' }[t] || 'Personalizado';
  const hero = basNoite({ topo: basTituloNoite('Perfil'), extra: `<div class="bas-noite-eu">${avatarHtml(p, 'lg')}<b>${esc(p.nome || 'Minha conta')}</b><span class="bas-noite-tag">${esc(planLabel())}</span></div>`,
    acoes: [[basIr('ano'), I.relatorio, String(S.year)], ['data-act="bas-tema-ciclo"', I_TEMA, temaNome], [basIr('objetivos'), I_META, 'Sonhos'], [basIr('contato'), I.chat, 'Assessor']] });
  const sobre = basEscolhe() ? `<div class="card bas-sonho bas-sonho-modo"><span class="bas-sonho-l">${basNome('Modo do app', `${BAS_NOMES.basico}: direto ao ponto. ${BAS_NOMES.completo}: todas as telas.`)}</span>${basTrocaHtml()}</div>`
    : planoAtual() === 'gratis' && !S.isAdmin ? basSobre('data-act="upgrade" data-plano="investidor"', `<span class="bas-sonho-l"><span class="bas-ini" aria-hidden="true">${I.inv}</span>${basNome(`Conhecer o plano ${esc(nomePlano('investidor'))}`, `O modo ${BAS_NOMES.completo}, com proventos e carteira.`)}${I.chev}</span>`) : '';
  const linhas = [basRow(basIr('perfil'), I.user, 'Meu perfil', 'Nome e como prefere ser chamado', I.chev), basRow(basIr('meta'), I_META, 'Meta de investimento', +S.plan.settings.metaAporte > 0 ? `${brl(S.plan.settings.metaAporte)} por mês` : 'Quanto investir por mês', I.chev),
    basRow(basIr('objetivos'), OBJ_ICONES.viagem || I_META, 'Meus objetivos', `${objLista().length} ${objLista().length === 1 ? 'objetivo' : 'objetivos'}`, I.chev), basRow(basIr('ano'), I.relatorio, 'Ano do planejamento', String(S.year), I.chev),
    basRow(basIr('contato'), I.chat, `Falar com o ${esc(primeiroNome())}`, 'Dúvidas sobre o seu dinheiro', I.chev)];
  return `${hero}${sobre}${basSecao('Ajustes', '', `<ul class="bas-ativ">${linhas.join('')}</ul>`)}<ul class="bas-ativ bas-sair"><li><button data-act="bas-sair">${basNome('Sair')}</button></li></ul>`;
}

/* ================= telas empilhadas ================= */
// gasto do dia (novo ou editar)
function basTelaGasto(o) {
  const p = S.plan; const l = o.id ? p.lancamentos.find((x) => x.id === o.id) : null; if (o.id && !l) return basSumiu();
  const a0 = l ? l.area : o.area || ''; const usadas = p.despesas.map((x) => x.area).concat(p.lancamentos.map((x) => x.area));
  const areas = [...new Set(BAS_AREAS.concat(usadas, a0 ? [a0] : []).filter(Boolean))].slice(0, 16);
  return basForm('gasto', l ? 'Editar gasto' : 'Novo gasto', `${basValor('valor', l ? Math.abs(l.valor) : 0, 'Quanto foi?')}
    ${basCampo('desc', 'Com o quê?', l ? l.desc : '', 'placeholder="Ex.: Mercado"')}
    ${basChips('area', areas.map((a) => [a, a]), a0, 'Categoria')}${basCampo('areaNova', 'Ou escreva outra categoria', '', 'placeholder="Ex.: Pets"')}
    <label class="bas-fl"><span>Quando</span><input type="date" name="data" value="${esc(l ? l.data : basDataMes(S.mes))}" min="${S.year}-01-01" max="${S.year}-12-31"></label>
    ${l ? '' : basSw('repetir', 'Repete todo mês', 'Vira uma conta do mês até dezembro.')}`, { excluir: l ? 'Excluir gasto' : '' });
}
// conta do mês: gasto fixo ou parcela
function basTelaConta(o) {
  const p = S.plan; const m = S.mes; const x = basContas(m).itens.find((i) => i.id === o.id); if (!x) return basSumiu();
  const it = p.despesas.find((i) => i.id === o.id); const lid = it && it.baixas && it.baixas[S.year + '-' + m]; const pg = lid && p.lancamentos.find((l) => l.id === lid);
  const acoes = it ? `${!x.pago ? `<button class="btn primary lg bas-cta bas-add" data-act="bas-pagar">${I.check}Marcar como paga</button>` : pg ? `<button class="btn lg bas-cta bas-add" ${basIr('gasto', { id: pg.id })}>Ver o pagamento</button>` : ''}
    ${it.parcel ? '' : `<button class="btn lg bas-cta bas-add" ${basIr('conta-f', { id: it.id })}>Editar conta</button>`}<button class="btn lg bas-cta bas-add bas-del" data-act="bas-excluir">Excluir conta</button>` : `<p class="bas-p">Parcela de uma compra de ${x.herdado}. Ela é editada no planejamento daquele ano.</p>`;
  return basDet(esc(x.nome), basCard(`<small class="bas-k">${x.parcela ? `Parcela ${x.parcela.i} de ${x.parcela.n}` : 'Todo mês'} · ${MES_LONGO[m]}</small><b class="bas-big">${brl(x.valor)}</b>
    <p class="bas-p"><em class="bas-st${x.pago ? ' ok' : ''}">${x.pago ? 'Pago' : 'A pagar'}</em>${x.area ? ' · ' + esc(x.area) : ''}</p>${acoes}`, 'bas-hero'));
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
function basTelaEntrada(o) {
  const r = o.id ? S.plan.rendas.find((x) => x.id === o.id) : null; if (o.id && !r) return basSumiu();
  return basForm('entrada', r ? 'Editar entrada' : 'Nova entrada', `${basValor('valor', r ? +r.valores[S.mes] || 0 : 0, `Quanto entrou em ${MES_LONGO[S.mes]}?`)}
    ${basCampo('nome', 'De onde veio?', r ? r.nome : '', 'placeholder="Ex.: Salário, Freela"')}
    ${basSw('todo', r ? 'Usar este valor até dezembro' : 'Entra todo mês', r ? `Troca o valor de ${MES_LONGO[S.mes]} em diante.` : `De ${MES_LONGO[S.mes]} até dezembro.`, !r)}`, { excluir: r ? 'Excluir entrada' : '' });
}
// registrar investimento (ou corrigir o valor de um ativo no mês)
function basTelaAporte(o) {
  const p = S.plan; const a = o.id ? p.ativos.find((x) => x.id === o.id) : null; if (o.id && !a) return basSumiu(); const m = S.mes;
  if (a) return basForm('aporte', esc(a.nome), `${basValor('valor', Math.abs(+a.ap[m] || 0), `Quanto em ${MES_LONGO[m]}?`)}${basChips('op', [['1', 'Investi'], ['-1', 'Resgatei']], a.ap[m] < 0 ? '-1' : '1', 'O que foi')}`, { excluir: `Apagar o registro de ${MES_LONGO[m]}` });
  const meus = p.ativos.map((x) => [x.id, x.nome]);
  return basForm('aporte', 'Registrar investimento', `${basValor('valor', 0, 'Quanto?')}${basChips('op', [['1', 'Investi'], ['-1', 'Resgatei']], o.op === '-1' ? '-1' : '1', 'O que foi')}
    ${meus.length ? basChips('onde', meus.concat([['novo', '+ Outro lugar']]), meus[0][0], 'Onde') : '<input type="hidden" name="onde" value="novo">'}
    <div class="bas-blk" data-blk="novo">${basChips('tipo', BAS_ONDE.map((x, i) => [i, x[0]]), 1, 'Em quê')}${basCampo('nome', 'Nome (opcional)', '', 'placeholder="Ex.: CDB do Banco X"')}</div>
    <p class="bas-p">Fica registrado em ${MES_LONGO[m]} de ${S.year}.</p>`, { ok: 'Registrar' });
}
function basTelaMeta() {
  return basForm('meta', 'Meta de investimento', `${basValor('valor', +S.plan.settings.metaAporte || 0, 'Quanto quer investir por mês?')}<p class="bas-p">Comece com um valor que caiba no bolso. Vale para todos os meses.</p>`);
}
function basTelaObjetivos() {
  const A = objAnalise(); const foco = S.profile.objetivoFoco;
  return basDet('Meus objetivos', `${A.itens.length ? basCard(`<ul class="bas-l">${A.itens.map((g, i) => `<li><button ${basIr('objetivo', { id: g.id })}>${objIcone(g, i)}<span class="bas-cl">${basNome(esc(objNomeDe(g)) + (g.id === foco ? ' <em class="bas-tag">Principal</em>' : ''), `${brl0(g.saldo)} de ${brl0(g.valor)}${g.ano ? ' até ' + g.ano : ''}`)}<b>${pct(g.progresso)}</b>${basBarra(g.progresso).replace('bas-bar', 'bas-bar fina')}</span>${I.chev}</button></li>`).join('')}</ul>`) : basCard(basVazio('Nenhum objetivo ainda.'))}
    <button class="btn primary lg bas-cta bas-add" ${basIr('objetivo')}>${I.plus}Novo objetivo</button><p class="bas-disc keep">Projeção ilustrativa, sem promessa de rentabilidade.</p>`);
}
function basTelaObjetivo(o) {
  const g = o.id ? objLista().find((x) => x.id === o.id) : null; if (o.id && !g) return basSumiu();
  return basForm('objetivo', g ? 'Editar objetivo' : 'Novo objetivo', `${basChips('tipo', OBJETIVOS.map((x) => [x[0], x[1]]), g ? g.tipo : 'viagem', 'Qual é o sonho?')}
    ${basCampo('nome', 'Nome (opcional)', g ? g.nome : '', 'placeholder="Ex.: Viagem ao Japão"')}${basValor('valor', g ? g.valor : 0, 'Quanto custa?')}
    ${basCampo('ano', 'Até quando? (ano)', g && g.ano ? g.ano : '', `inputmode="numeric" maxlength="4" placeholder="Ex.: ${NOW_Y + 3}"`)}
    ${basSw('foco', 'Meu objetivo principal', 'Aparece na aba Investir.', !g || g.id === S.profile.objetivoFoco)}`, { excluir: g ? 'Excluir objetivo' : '' });
}
function basTelaCategoria(o) {
  const m = S.mes; const area = o.area; const tot = E.gastosAreaMes(S.plan, E.carryItems(S.plans, S.year), m)[area] || 0;
  const contas = basContas(m).itens.filter((x) => (x.area || 'Outros') === area); const lanc = basLancMes(m).filter((l) => (l.area || 'Outros') === area);
  return basDet(esc(area), `${basCard(`<small class="bas-k">${cap(MES_LONGO[m])}</small><b class="bas-big">${brl(tot)}</b><button class="btn primary lg bas-cta bas-add" ${basIr('gasto', { area })}>${I.plus}Gasto em ${esc(area)}</button>`, 'bas-hero')}
    ${contas.length ? basSecao('Contas', '', `<ul class="bas-ativ">${contas.map(basContaLinha).join('')}</ul>`) : ''}
    ${lanc.length ? basSecao('Gastos', '', `<ul class="bas-ativ">${lanc.map(basLancLinha).join('')}</ul>`) : ''}`);
}
function basTelaPerfil() {
  const p = S.profile;
  return basForm('perfil', 'Meu perfil', `<div class="bas-av">${avatarHtml(p, 'lg')}</div>${basCampo('nome', 'Nome', p.nome, 'autocomplete="name" data-foco')}${basCampo('apelido', 'Como prefere ser chamado (opcional)', p.apelido)}
    <p class="bas-p">E-mail: ${esc(p.email || '–')}</p>`);
}
const basTelaContato = () => basDet(`Falar com o ${esc(primeiroNome())}`, basCard(`<p class="bas-p bas-p0">${esc(CFG.consultor)} atende você direto. Escolha o canal.</p><div class="bas-contato">${contactButtons()}</div>`));
function basTelaAno() {
  const ys = Object.keys(S.plans).map(Number).sort(); const prox = Math.max(...ys, NOW_Y) + (S.plans[NOW_Y] ? 1 : 0);
  return basDet('Ano do planejamento', `${basCard(`<ul class="bas-l">${ys.map((y) => `<li><button data-act="bas-ano" data-y="${y}">${basNome(String(y), y === S.year ? 'Aberto agora' : '')}${y === S.year ? I.check : I.chev}</button></li>`).join('')}</ul>`)}
    ${S.plans[prox] ? '' : `<button class="btn lg bas-cta bas-add" data-act="bas-ano" data-y="${prox}">${I.plus}Começar ${prox}</button><p class="bas-p">Entradas, contas e investimentos vêm com valores zerados. Parcelas em andamento aparecem sozinhas.</p>`}`);
}
// proventos do mês: o que cada ativo pagou; tocar corrige o valor
function basTelaProventos() {
  const m = S.mes; const C = S.C; const L = S.plan.ativos.filter((a) => Math.abs(+a.pr[m] || 0) > 0.005).sort((x, y) => y.pr[m] - x.pr[m]);
  return basDet('Proventos', `${basCard(`<small class="bas-k">Recebido em ${MES_LONGO[m]}</small><b class="bas-big">${brl(C.faturamento[m])}</b><p class="bas-p">${brl(C.T.faturamento)} no ano. Dividendo reinvestido conta como investimento.</p>
    ${S.plan.ativos.length ? `<button class="btn primary lg bas-cta bas-add" ${basIr('provento')}>${I.plus}Registrar provento</button>` : '<p class="bas-p">Registre um investimento primeiro: o provento é sempre de um deles.</p>'}`, 'bas-hero')}
    ${L.length ? basCard(`<div class="bas-ch"><h2 class="bas-h2">Quem pagou</h2></div><ul class="bas-l">${L.map((a) => basLinha(basIr('provento', { id: a.id }), basNome(esc(a.nome), esc(a.classe || '')), `<b class="pos">${brl(a.pr[m])}</b>`)).join('')}</ul>`) : basCard(basVazio(`Nenhum provento em ${MES_LONGO[m]}.`))}`);
}
function basTelaProvento(o) {
  const p = S.plan; const m = S.mes; const a = o.id ? p.ativos.find((x) => x.id === o.id) : null; if (o.id && !a) return basSumiu();
  if (a) return basForm('provento', esc(a.nome), basValor('valor', +a.pr[m] || 0, `Quanto pagou em ${MES_LONGO[m]}?`), { excluir: `Apagar o provento de ${MES_LONGO[m]}` });
  return basForm('provento', 'Registrar provento', `${basValor('valor', 0, 'Quanto recebeu?')}${basChips('ativo', p.ativos.map((x) => [x.id, x.nome]), (p.ativos[0] || {}).id, 'De qual investimento')}<p class="bas-p">Fica registrado em ${MES_LONGO[m]} de ${S.year}.</p>`, { ok: 'Registrar' });
}
// carteira: divisão por classe e, com alvos definidos, onde colocar o disponível do mês (E.analiseCarteira via cartAnalise)
function basTelaCarteira() {
  const { M, K } = cartAnalise(); const total = K.classes.reduce((t, c) => t + c.valor, 0); const comAlvo = K.itens.some((i) => i.w > 0);
  const sug = K.itens.filter((i) => i.sug > 0.004).sort((a, b) => b.sug - a.sug);
  return basDet('Minha carteira', `${basCard(`<small class="bas-k">Total na carteira</small><b class="bas-big">${brl(total)}</b>${total > 0 ? `<ul class="bas-l bas-cats">${K.classes.slice().sort((a, b) => b.valor - a.valor).map((c, i) => `<li><span class="bas-cl bas-li">${basNome(esc(c.classe || 'Outros'), comAlvo ? `alvo ${pct(c.alvo / 100)}` : '')}<b>${pct(c.atual / 100)}</b><span class="bas-bar fina" aria-hidden="true"><i style="width:${Math.min(100, c.atual).toFixed(1)}%;--bc:${PAL[i % 6]}"></i></span></span></li>`).join('')}</ul>` : basVazio('Registre um investimento para ver a divisão.')}`, 'bas-hero')}
    ${basCard(`<div class="bas-ch"><h2 class="bas-h2">Onde investir agora</h2></div>${!comAlvo ? `<p class="bas-p bas-p0">Combine com o ${esc(primeiroNome())} quanto quer em cada investimento e o app mostra onde colocar cada aporte.</p><button class="btn lg bas-cta bas-add" ${basIr('contato')}>Falar com o ${esc(primeiroNome())}</button>`
      : sug.length ? `<p class="bas-p bas-p0">Para deixar a carteira mais perto do combinado com ${brl(M.aporte)} disponíveis:</p><ul class="bas-l">${sug.map((i) => `<li><span class="bas-cl bas-li">${basNome(esc(i.nome), esc(i.classe || ''))}<b class="pos">${brl(i.sug)}</b></span></li>`).join('')}</ul>` : basVazio('Sem valor disponível para investir neste mês.')}`)}
    <p class="bas-disc keep">Sugestão de divisão pelo alvo combinado, sem indicação de ativos nem promessa de rentabilidade.</p>`);
}
const BAS_TELAS = { gasto: basTelaGasto, conta: basTelaConta, 'conta-f': basTelaContaF, entrada: basTelaEntrada, aporte: basTelaAporte, meta: basTelaMeta,
  objetivos: basTelaObjetivos, objetivo: basTelaObjetivo, categoria: basTelaCategoria, perfil: basTelaPerfil, contato: basTelaContato, ano: basTelaAno, proventos: basTelaProventos, provento: basTelaProvento, carteira: basTelaCarteira };

/* ================= gravação (no mesmo formato do Completo) ================= */
function basErro(f, msg) { const e = f.querySelector('.bas-err'); e.textContent = msg; e.hidden = false; return false; }
function basSalvar(f) {
  const t = basTopoPilha(); if (!t || t.t !== f.dataset.t) return;
  const d = Object.fromEntries(new FormData(f)); const p = S.plan; const m = S.mes; const val = (k) => parseReais(d[k] || '');
  const ok = (msg) => { touch(t.t === 'perfil' || t.t === 'objetivo' ? 'profile' : 'plan'); basFechar(); if (msg) toast(msg); };
  switch (t.t) {
    case 'gasto': {
      const l = t.id ? p.lancamentos.find((x) => x.id === t.id) : null; const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe quanto foi, como 25,90.');
      const dt = E.parseDataISO(d.data); if (!dt || dt.ano !== S.year) return basErro(f, `Escolha uma data de ${S.year}.`);
      const area = (d.areaNova || '').trim() || d.area || 'Outros'; const desc = (d.desc || '').trim() || area;
      if (l) { if (l.itemId && basMesDe(l.data) !== dt.mes) { desfazerBaixa(l); delete l.itemId; } Object.assign(l, { data: d.data, desc, area, valor: E.r2(l.valor < 0 ? -v : v) }); S.mes = dt.mes; ok('Gasto atualizado.'); return; }
      const nl = { id: uid(), origem: 'manual', data: d.data, desc, valor: E.r2(v), cat: basCat(false), area, sub: '', inst: '' }; p.lancamentos.push(nl); let msg = 'Gasto anotado.';
      // o mesmo cuidado do Completo: cumpre a conta fixa do mês (não conta duas vezes) ou vira conta até dezembro
      const fx = E.acharFixo(p.despesas, desc, dt.ano, dt.mes); if (fx) { nl.itemId = fx.id; nl.cat = fx.cat; fx.baixas = Object.assign({}, fx.baixas, { [dt.ano + '-' + dt.mes]: nl.id }); msg = `Conta “${fx.nome}” marcada como paga.`; }
      else if (d.repetir && dt.mes < 11) { p.despesas.push({ id: uid(), cat: basCat(true), area, sub: '', nome: desc, inst: '', valores: E.repetirValores(nl.valor, dt.mes) }); msg = `“${desc}” vai se repetir todo mês até dezembro.`; }
      S.mes = dt.mes; ok(msg); return;
    }
    case 'conta-f': {
      const it = t.id ? p.despesas.find((x) => x.id === t.id) : null; const nome = (d.nome || '').trim(); if (!nome) return basErro(f, 'Dê um nome à conta, como Aluguel.');
      const area = d.area || 'Contas';
      if (!it && d.modo === 'parc') { const total = val('total'); const n = parseInt(d.n, 10); if (!(total > 0)) return basErro(f, 'Informe o valor total da compra.'); if (!(n >= 1 && n <= 120)) return basErro(f, 'Informe de 1 a 120 parcelas.');
        p.despesas.push({ id: uid(), cat: basCat(false), area, sub: '', nome, inst: '', valores: z12(), parcel: { total: E.r2(total), n, ano: S.year, mes: m } }); ok('Compra parcelada anotada.'); return; }
      const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe o valor por mês.');
      const alvo = it || { id: uid(), cat: basCat(true), sub: '', inst: '', valores: z12() }; Object.assign(alvo, { nome, area }); fillFrom(alvo.valores, E.r2(v), m); if (!it) p.despesas.push(alvo);
      ok(it ? 'Conta atualizada.' : 'Conta anotada até dezembro.'); return;
    }
    case 'entrada': {
      const r = t.id ? p.rendas.find((x) => x.id === t.id) : null; const v = val('valor'); const nome = (d.nome || '').trim();
      if (Number.isNaN(v) || v < 0 || (!r && !(v > 0))) return basErro(f, 'Informe quanto entrou, como 2.500,00.'); if (!nome) return basErro(f, 'Diga de onde veio, como Salário.');
      if (!p.rendaCats.length) p.rendaCats.push(...E.CATS_RENDA());
      const alvo = r || { id: uid(), cat: p.rendaCats[0].id, fonte: '', valores: z12() }; alvo.nome = nome; if (d.todo) fillFrom(alvo.valores, E.r2(v), m); else alvo.valores[m] = E.r2(v); if (!r) p.rendas.push(alvo);
      ok(r ? 'Entrada atualizada.' : 'Entrada anotada.'); return;
    }
    case 'aporte': {
      if (!temRecurso('aporte_simples')) return false;
      const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe o valor, como 500,00.'); const sinal = d.op === '-1' ? -1 : 1;
      let a = t.id ? p.ativos.find((x) => x.id === t.id) : null;
      if (a) { a.ap[m] = E.r2(sinal * v); ok('Registro atualizado.'); return; }
      if (d.onde && d.onde !== 'novo') a = p.ativos.find((x) => x.id === d.onde);
      if (!a) { const k = BAS_ONDE[+d.tipo] || BAS_ONDE[BAS_ONDE.length - 1]; const nome = (d.nome || '').trim() || k[0];
        a = p.ativos.find((x) => E.norm(x.nome) === E.norm(nome)) || ativoInserir({ tipo: k[1], classe: k[2], grupo: null, subgrupo: null, nome }); }
      a.ap[m] = E.r2((+a.ap[m] || 0) + sinal * v); ok(`${sinal > 0 ? 'Investimento' : 'Resgate'} registrado em ${a.nome}.`); return;
    }
    case 'provento': {
      if (!temRecurso('proventos')) return false;
      const v = val('valor'); if (Number.isNaN(v) || v < 0 || (!t.id && !(v > 0))) return basErro(f, 'Informe o valor, como 35,20.');
      if (t.id) { const a = p.ativos.find((x) => x.id === t.id); if (a) a.pr[m] = E.r2(v); ok('Provento atualizado.'); return; }
      const a = p.ativos.find((x) => x.id === d.ativo); if (!a) return basErro(f, 'Escolha de qual investimento.'); a.pr[m] = E.r2((+a.pr[m] || 0) + v); ok(`Provento de ${a.nome} registrado.`); return;
    }
    case 'meta': { const v = d.valor && d.valor.trim() ? val('valor') : 0; if (Number.isNaN(v) || v < 0) return basErro(f, 'Informe um valor, como 500,00.'); p.settings.metaAporte = E.r2(v); ok('Meta salva.'); return; }
    case 'objetivo': {
      const L = objLista(); const g = t.id ? L.find((x) => x.id === t.id) : null; const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe quanto custa o objetivo.');
      const ano = d.ano && d.ano.trim() ? parseInt(d.ano, 10) : null; if (ano != null && !(ano >= NOW_Y && ano <= 2100)) return basErro(f, `Informe um ano a partir de ${NOW_Y}.`);
      const dados = { tipo: d.tipo || 'outro', nome: (d.nome || '').trim(), valor: E.r2(v), ano };
      // o primeiro separa todo o patrimônio (fatia de 100%); os seguintes só pedem que o patrimônio chegue ao valor (marco)
      const alvo = g || Object.assign({ id: uid() }, L.length ? { modo: 'marco', pct: 0 } : { modo: 'fatia', pct: 100 }); Object.assign(alvo, dados); if (!g) L.push(alvo);
      if (d.foco || L.length === 1) S.profile.objetivoFoco = alvo.id; objSalvar(); ok(g ? 'Objetivo atualizado.' : 'Objetivo criado.'); return;
    }
    case 'perfil': { const nome = (d.nome || '').trim(); if (!nome) return basErro(f, 'Informe o seu nome.'); S.profile.nome = nome.slice(0, 80); S.profile.apelido = (d.apelido || '').trim().slice(0, 80); ok('Perfil salvo.'); return; }
    default: return false;
  }
}
// excluir (segundo toque confirma)
function basExcluir(el) {
  if (!el.dataset.ok) { el.dataset.ok = '1'; el.textContent = 'Toque de novo para excluir'; return; }
  const t = basTopoPilha(); const p = S.plan; const m = S.mes;
  if (t.t === 'gasto') { const l = p.lancamentos.find((x) => x.id === t.id); if (l) { desfazerBaixa(l); p.lancamentos = p.lancamentos.filter((x) => x !== l); } }
  else if (t.t === 'conta') p.despesas = p.despesas.filter((x) => x.id !== t.id);
  else if (t.t === 'entrada') p.rendas = p.rendas.filter((x) => x.id !== t.id);
  else if (t.t === 'aporte') { const a = p.ativos.find((x) => x.id === t.id); if (a) a.ap[m] = 0; }
  else if (t.t === 'provento') { const a = p.ativos.find((x) => x.id === t.id); if (a) a.pr[m] = 0; }
  else if (t.t === 'objetivo') { const pr = S.profile; pr.objetivos = objLista().filter((x) => x.id !== t.id); if (pr.objetivoFoco === t.id) pr.objetivoFoco = pr.objetivos[0] ? pr.objetivos[0].id : null; objSalvar(); basFechar(); toast('Objetivo excluído.'); return; }
  touch('plan'); basFechar(); toast('Excluído.');
}
// conta paga: um gasto real do mês, ligado à conta (baixa), como no Completo
function basPagar() {
  const t = basTopoPilha(); const p = S.plan; const m = S.mes; const it = p.despesas.find((x) => x.id === t.id); if (!it) return;
  const x = basContas(m).itens.find((i) => i.id === it.id); if (!x || x.pago) return;
  const l = { id: uid(), origem: 'manual', data: basDataMes(m), desc: it.nome, valor: x.valor, cat: it.cat, area: it.area || 'Outros', sub: it.sub || '', inst: it.inst || '', itemId: it.id };
  p.lancamentos.push(l); it.baixas = Object.assign({}, it.baixas, { [S.year + '-' + m]: l.id }); touch('plan'); render(); toast('Conta marcada como paga.');
}

// escolha da versão no painel administrativo (Personalizar o painel) e no fim do diagnóstico
function basAdmHtml() {
  if (S.isAdmin) return '';
  const op = (v, n, d) => `<button class="ap-voz" data-act="bas-ui" data-v="${v}" aria-pressed="${E.interfaceDe(planoAtual(), S.profile.interface, BASICO_PAGANTES) === v}"><b>${n}</b><small>${d}</small></button>`;
  const corpo = basEscolhe() ? `<div class="ap-vozes">${op('basico', BAS_NOMES.basico, 'Como um app de banco: o mês, os gastos e quanto dá para investir.')}${op('completo', BAS_NOMES.completo, 'Todas as telas, gráficos e análises.')}</div>`
    : `<p class="mmsg">Você está no modo ${BAS_NOMES.basico}. O ${BAS_NOMES.completo} vem com o plano ${esc(nomePlano('investidor'))}.</p><div class="btn-row"><button class="btn" data-act="upgrade" data-plano="investidor">Conhecer o plano ${esc(nomePlano('investidor'))}</button></div>`;
  return `<section class="dr-sec"><h3>Modo do app</h3>${corpo}</section>`;
}
function basObHtml() { return basEscolhe() ? `<div class="bas-ob"><p class="qn">Como você quer ver o painel?</p>${basAdmHtml().replace(/<\/?section[^>]*>|<h3>.*?<\/h3>/g, '')}</div>` : ''; }

// ações data-act do modo Básico (chamadas pelo default do onClick em main.js)
function basAcao(act, ds, el) {
  switch (act) {
    case 'bas-aba': basLimpar(); S.basAba = ds.v; render(); window.scrollTo(0, 0); return true;
    case 'bas-mes': S.mes = Math.max(0, Math.min(11, S.mes + +ds.d)); render(); return true;
    case 'bas-abrir': basAbrir(ds.t, { id: ds.id, area: ds.area, op: ds.op, modo: ds.modo }); return true;
    case 'bas-rolar': { const a = document.getElementById(ds.alvo); if (a) a.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return true; }
    case 'bas-tema-ciclo': { const ord = ['auto', 'light', 'oled']; const v = ord[(ord.indexOf(S.profile.prefs.tema) + 1) % 3]; if (v !== 'auto') S.profile.prefs.tema = v; definirTema(v === 'auto' ? 'auto-on' : v); render(); toast(`Tema: ${{ auto: 'automático', light: 'claro', oled: 'escuro' }[v]}.`); return true; }
    case 'bas-voltar': basFechar(); return true;
    case 'bas-excluir': basExcluir(el); return true;
    case 'bas-pagar': basPagar(); return true;
    case 'bas-ano': { const y = +ds.y; basLimpar(); if (S.plans[y]) { if (y !== S.year) switchYear(y); else render(); } else createPlan(y, S.plan); return true; }
    case 'bas-sair': if (!el.dataset.ok) { el.dataset.ok = '1'; el.querySelector('b').textContent = 'Toque de novo para sair'; return true; } basLimpar(); sair(); return true;
    case 'bas-tema': if (ds.v !== 'auto') S.profile.prefs.tema = ds.v; definirTema(ds.v === 'auto' ? 'auto-on' : ds.v); render(); return true;
    case 'bas-ui': S.profile.interface = ds.v === 'basico' ? 'basico' : 'completo'; touch('profile'); basLimpar(); if (S.screen === 'app') { closeAdmin(); S.basAba = 'inicio'; window.scrollTo(0, 0); } render(); toast(`Modo ${BAS_NOMES[ds.v === 'basico' ? 'basico' : 'completo']} ligado.`); return true;
    default: return false;
  }
}

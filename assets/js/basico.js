/* Modo Básico: a segunda interface, para quem está começando. Jeito de app de celular: números grandes, pouco texto,
   uma ação principal por tela e abas embaixo; no computador fica centralizado como um app.
   Mesmos dados (S.plan, S.profile) e os mesmos cálculos do engine; só a tela muda. Escolha por aparelho em localStorage fp:interface (padrão: S.profile.interface).
   Telas próprias, sem modais nem painéis do Completo: cada aba, detalhe e formulário entra numa pilha (S.basPilha),
   com voltar pelo botão, pelo Esc e pelo voltar do celular (history). */
'use strict';
const BASICO_PAGANTES = true; // pagantes podem trocar para o Básico; false = Básico só no plano gratuito
// a versão escolhida vale só neste aparelho (localStorage); sem escolha aqui, vale a do perfil. Trocar no celular não muda o computador.
const basUiLocal = () => { try { const v = localStorage.getItem('fp:interface'); return v === 'basico' || v === 'completo' ? v : null; } catch (e) { return null; } };
const basInterface = () => E.interfaceDe(planoAtual(), basUiLocal() || S.profile.interface, BASICO_PAGANTES);
const modoBasico = () => S.screen === 'app' && !!S.profile && basInterface() === 'basico';
const basEscolhe = () => BASICO_PAGANTES && planoAtual() !== 'gratis'; // pagantes e o consultor escolhem a versão
const BAS_NOMES = { basico: 'App', completo: 'SaaS' }; // nomes das duas versões na tela: App (celular; no gratuito, a única) e SaaS (o painel completo)
// seletor dos dois modos: Perfil do Simples, página inicial do painel e o Mais do celular no Completo (só para quem pode escolher)
const basTrocaHtml = () => { const v = basInterface();
  return `<div class="seg bas-troca" role="group" aria-label="Versão do AVEN">${['basico', 'completo'].map((k) => `<button${v === k ? ' class="on"' : ''} data-act="bas-ui" data-v="${k}" aria-pressed="${v === k}">${BAS_NOMES[k]}</button>`).join('')}</div>`; };
const BAS_ABAS = [['inicio', 'Início', I.geral], ['gastos', 'Gastos', I.despesas], ['investir', 'Investir', I.inv], ['perfil', 'Perfil', I.user]];
const BAS_FORMS = new Set(['gasto', 'conta', 'conta-f', 'entrada', 'aporte', 'meta', 'objetivo', 'perfil', 'provento', 'limite', 'alvos', 'ponto', 'excluir', 'retro']); // telas de formulário (e a retrospectiva, em tela cheia) escondem as abas
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
const basAba = () => (basAbas().some((a) => a[0] === S.basAba) ? S.basAba : 'inicio');
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
  $('#tabbar').innerHTML = `<div class="bas-tabs">${basAbas().map(([k, l, i]) => `<button data-act="bas-aba" data-v="${k}" ${a === k ? 'aria-current="page"' : ''}>${i}<span>${l}</span></button>`).join('')}</div>`;
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
  basPilha().push(Object.assign({ t, volta: window.scrollY }, o)); history.pushState({ bas: basPilha().length }, ''); basSom('toque');
  basTransicao('vai', () => { render(); window.scrollTo(0, 0); const f = $('#view [data-foco]'); if (f && matchMedia('(pointer: coarse)').matches === false) f.focus({ preventScroll: true }); });
}
function basFechar() {
  const t = basPilha().pop(); basSom('volta'); basTransicao('volta', () => { render(); window.scrollTo(0, t ? t.volta || 0 : 0); });
  if (history.state && history.state.bas) history.back(); // o popstate vê a pilha já menor e não faz nada
}
function basLimpar() { const n = basPilha().length; S.basPilha = []; if (n && history.state && history.state.bas) history.go(-Math.min(n, history.state.bas)); }
window.addEventListener('popstate', (e) => { // voltar do celular ou do navegador
  const n = (e.state && e.state.bas) || 0; if (!modoBasico() || n >= basPilha().length) return;
  const t = basPilha()[n]; S.basPilha.length = n; if ($('#modal').open) $('#modal').close(); basSom('volta'); basTransicao('volta', () => { render(); window.scrollTo(0, t.volta || 0); });
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
const I_APLICAR = ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>');
const I_ORDEM = ic('<path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/>');
const basIrInv = (o) => (temRecurso('aporte_simples') ? basIr('aporte', o) : `data-act="upgrade" data-plano="${planoMinimoDe('aporte_simples')}"`);
const basRow = (attrs, ini, nome, sub, dir, cor) => `<li><button ${attrs}><span class="bas-ini" aria-hidden="true"${cor ? ` style="--bc:${cor}"` : ''}>${ini}</span>${basNome(nome, sub)}${dir}</button></li>`;
const basSecao = (titulo, link, corpo) => `<div class="bas-ch bas-ch-f"><h2 class="bas-h2">${titulo}</h2>${link || ''}</div>${corpo}`;
const basCab = (titulo, extra) => `<header class="bas-cab"><h1>${titulo}</h1><div class="bas-cab-r">${extra || ''}${olhoHtml()}</div></header>`;
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
const basVarPatr = (C) => { const j = basJan(); const base = j.de > 0 ? C.patrimonio[j.de - 1] : C.patrimonioBase; const fim = C.patrimonio[j.ate]; const va = E.variacao(fim, base); return { dif: fim - base, va }; };
function basTelaPeriodo() {
  const anos = Object.keys(S.plans).map(Number).sort(); const j = basJan(); const ini = S.basPerIni; const ref = S.year === NOW_Y ? NOW_M : 11;
  const ats = [[1, 'Este mês'], [3, '3 meses'], [6, '6 meses'], [12, 'Ano todo']].map(([n, l]) => { const on = ini == null && (n === 12 ? j.n === 12 : n === 1 ? j.n === 1 && j.de === ref : j.n === n && j.ate === ref); return `<button class="${on ? 'on' : ''}" data-act="bas-per-at" data-n="${n}" aria-pressed="${on}">${l}</button>`; }).join('');
  const meses = MES.map((m, i) => { const c = ini != null ? (i === ini ? ' ponta' : '') : (i === j.de || i === j.ate ? ' ponta' : i > j.de && i < j.ate ? ' in' : ''); return `<button class="bas-per-m${c}${S.year === NOW_Y && i > NOW_M ? ' fut' : ''}" data-act="bas-per-mes" data-m="${i}" aria-pressed="${!!c}">${m}</button>`; }).join('');
  return basDet('Período', `${basSecao('Ano', '', `<div class="bas-per-anos">${anos.map((y) => `<button class="${y === S.year ? 'on' : ''}" data-act="bas-ano" data-y="${y}" aria-pressed="${y === S.year}">${y}</button>`).join('')}${S.plans[Math.max(...anos) + 1] ? '' : `<button data-act="bas-ano" data-y="${Math.max(...anos) + 1}" aria-label="Abrir ${Math.max(...anos) + 1}">+</button>`}</div>`)}
    ${basSecao('Atalhos', '', `<div class="seg bas-per-at">${ats}</div>`)}
    ${basSecao('No calendário', '', `<div class="card bas-per-cal"><div class="bas-per-grade">${meses}</div><p class="bas-p">${ini != null ? `Início em ${MES_LONGO[ini]}. Toque no mês final, ou de novo em ${MES_LONGO[ini]} para ver só ele.` : 'Toque no mês inicial e depois no final. Para um mês só, toque nele duas vezes.'}</p></div>`)}`);
}

/* ---- blocos que o cliente organiza (ordem e quais aparecem), salvos no perfil ---- */
const BAS_SECS = {
  inicio: [['sonho', 'Meu sonho'], ['disp', 'Dá para investir'], ['sequencia', 'Sequência de meses'], ['historico', 'Patrimônio ano a ano'], ['aviso', 'O que o assistente notou'], ['ritmo', 'Ritmo do mês'], ['seuano', 'Seu ano'], ['resumo', 'Resumo do mês'], ['atividade', 'Atividade'], ['calendario', 'Mês dia a dia', 0], ['semana', 'Dia que mais gasta', 0], ['maior', 'Maior gasto', 0], ['globo', 'Seu universo', 0], ['saude', 'Saúde financeira', 0], ['contas', 'Contas a pagar', 0], ['limite', 'Limite do mês', 0], ['meta', 'Meta de investimento', 0], ['cartoes', 'Seus cartões', 0], ['proventos', 'Proventos', 0]],
  gastos: [['anel', 'Gastos por categoria'], ['onde', 'Para onde foi o dinheiro'], ['limites', 'Limites por área'], ['cartoes', 'Seus cartões'], ['ultimos', 'Últimos gastos']],
  investir: [['patr', 'Evolução do patrimônio'], ['meta', 'Meta e disponível'], ['sonhos', 'Seus sonhos'], ['comp', 'Como está dividido'], ['feitos', 'Investido no período']],
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
  return basDet('Organizar a tela', `<p class="bas-p">Arraste pela alça para mudar a ordem. Toque em + para colocar um widget na tela de ${esc({ inicio: 'Início', gastos: 'Gastos', investir: 'Investir' }[aba])}.</p>
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
    <header class="bas-noite-h"><button class="bas-eu-m" ${basIr('perfil')} aria-label="Meu perfil">${avatarHtml(pr)}<span class="bas-eu-t"><small>${esc(saudacaoHora())},</small><b>${esc(nome || 'você')}${basPago() ? `<em class="bas-plano-chip">${esc(nomePlano(planoAtual()))}</em>` : ''}</b></span></button>
      <span class="bas-noite-r"><button class="bell ia-btn${basAvisoNivel()} humor-${humor}" ${basIr('ia')} aria-label="Assistente${av ? `: ${av} avisos novos` : ''}" title="Assistente">${IA_ICONE}${av ? `<span class="bell-n" aria-hidden="true">${av > 9 ? '9+' : av}</span>` : ''}</button>${typeof aberturaPode === 'function' && aberturaPode() ? `<button class="bell bas-globo-btn" data-act="bas-globo" aria-label="Abrir o globo do patrimônio" title="Seu universo">${I_GLOBO}</button>` : ''}${olhoHtml()}</span></header>
    <div class="bas-noite-p">${basPerPill(true)}</div>
    <small class="bas-noite-k">Patrimônio total</small><b class="bas-noite-v brilha${rec ? ' recorde' : ''}${brl(C.patrimonio[j.ate]).length > 13 ? ' longo' : ''}" data-conta="${C.patrimonio[j.ate]}">${basCent(C.patrimonio[j.ate])}</b>
    ${V.va != null ? `<p class="bas-noite-s"><em class="${V.dif >= 0 ? 'pos' : 'neg'}">${V.dif >= 0 ? '↗ +' : '↘ −'}${brl0(Math.abs(V.dif))} (${pct(Math.abs(V.va), 1)})</em> ${basJanFrase()}${rec ? ' <span class="bas-rec-t">· seu maior patrimônio</span>' : ''}</p>` : ''}
    <div class="bas-noite-par"><button ${basIr('entradas')}><small>Entrou</small><b>${basCent(ent)}</b></button><button data-act="bas-aba" data-v="gastos"><small>Saiu</small><b>${basCent(sai)}</b></button></div>
    <div class="bas-bts"><button class="bas-bt" ${basIr('gasto')}><span class="bas-bt-ic" aria-hidden="true">${I.despesas}</span><span class="bas-bt-t"><b>Novo gasto</b><small>O que saiu</small></span></button><button class="bas-bt prim" ${basIrInv()}><span class="bas-bt-ic" aria-hidden="true">${I.inv}</span><span class="bas-bt-t"><b>Investimento</b><small>Aplicar, resgatar</small></span></button></div></section>`;
  const g = objFoco(objAnalise());
  secs.sonho = `<button class="card bas-sonho" ${basIr('sonhos')}>${g ? `<span class="bas-sonho-l">${objIcone(g, 0)}${basNome(esc(objNomeDe(g)), `${brl0(g.saldo)} de ${brl0(g.valor)}`)}<b class="bas-pct">${pct(g.progresso)}</b></span>${basBarra(g.progresso)}`
    : `<span class="bas-sonho-l"><span class="obj-ic" aria-hidden="true">${I.plus}</span>${basNome('Qual é o seu sonho?', 'Dê um nome e acompanhe quanto falta')}${I.chev}</span>`}</button>`;
  secs.sequencia = basSequenciaHtml();
  secs.disp = basCard(`<div class="bas-disp"><span class="bas-n"><small class="bas-k">Dá para investir ${j.n > 1 ? basJanFrase() : 'agora'}</small><b class="bas-big md">${basCent(D.disponivel)}</b></span>${D.disponivel > 0.005 ? `<button class="btn primary bas-cta" ${basIrInv()}>Aplicar</button>` : ''}</div>
    <p class="bas-p">${voz(D.disponivel > 0.005 ? 'bas_disp_sim' : D.sobra > 0.005 ? 'bas_disp_tudo' : !(ent > 0) && !(sai > 0) ? 'bas_vazio' : 'bas_disp_nao')}</p>`);
  const ents = j.n === 1 ? p.rendas.filter((r) => +r.valores[j.de] > 0.005).map((r) => basRow(basIr('entrada', { id: r.id }), I_ENTRADA, esc(r.nome), `Entrada · ${MES_LONGO[j.de]}`, `<b class="pos">+${basCent(r.valores[j.de])}</b>`)) : [];
  const ativ = ents.concat(basLancJan().slice(0, 6).map(basLancLinha)).slice(0, 7);
  secs.atividade = basSecao(j.n === 1 ? 'Atividade do mês' : 'Atividade do período', '<button class="lnk strong" data-act="bas-aba" data-v="gastos">Ver tudo</button>', ativ.length ? `<ul class="bas-ativ">${ativ.join('')}</ul>` : basCard(basVazio(voz('bas_vazio'))));
  basExtrasInicio(secs); basWidgetsInicio(secs);
  const sobe = ['sonho', 'disp', 'sequencia', 'saude', 'globo', 'limite', 'meta', 'historico', 'aviso', 'ritmo', 'maior', 'seuano', 'resumo'].includes(basOrdemDe('inicio').find((id) => !basOculto('inicio', id)));
  return `${hero.replace('class="bas-noite"', `class="bas-noite${sobe ? ' sobe' : ''}"`)}<div class="bas-secs${sobe ? ' sobe' : ''}">${basOrdenar('inicio', secs)}</div>${basOrganizarBtn('inicio')}`;
}
// entradas do período: lista e a nova entrada (o botão Entrou do Início abre aqui)
// Entradas: o total do período, o mês a mês, o que é previsível, a renda passiva, cada fonte com a sua parte e leituras automáticas
// (E.analiseRenda, a mesma análise da aba Rendas do SaaS); tocar numa fonte edita, e o + cria
function basTelaEntradas() {
  const j = basJan(); const C = S.C; const p = S.plan; const R = E.analiseRenda({ C, de: j.de, ate: j.ate, meses: Math.max(j.ate + 1, 1), rendas: p.rendas, rendaCats: p.rendaCats });
  const tot = basSomaJ(C.receita); const mx = Math.max(1, ...C.receita); const ult = S.year === NOW_Y ? NOW_M : 11;
  const fontes = p.rendas.map((r) => [r, (r.valores || []).slice(j.de, j.ate + 1).reduce((a, v) => a + (+v || 0), 0)]).filter((x) => x[1] > 0.005).sort((a, b) => b[1] - a[1]);
  const totF = fontes.reduce((a, x) => a + x[1], 0) || 1;
  // recorrente pelo ano até agora (não só pelo período escolhido): entrou em pelo menos 60% dos meses e em 3 ou mais
  const recDe = (id) => { const r = p.rendas.find((x) => x.id === id); const nM = ((r && r.valores) || []).slice(0, ult + 1).filter((v) => +v > 0).length; return nM >= Math.min(3, ult + 1) && nM / (ult + 1) >= 0.6; };
  const prev = fontes.reduce((a, [r, v]) => a + (recDe(r.id) ? v : 0), 0) / totF; const prevMes = fontes.reduce((a, [r]) => a + (recDe(r.id) ? +((r.valores || [])[ult]) || 0 : 0), 0);
  const prov = basSomaJ(C.faturamento); const futuro = S.year === NOW_Y ? p.rendas.reduce((a, r) => a + (r.valores || []).slice(NOW_M + 1).reduce((b, v) => b + (+v || 0), 0), 0) : 0;
  // leituras: só as que fazem sentido com os números
  const fr = [];
  if (R.pesoMaior != null && R.pesoMaior >= 0.7 && R.maior && fontes.length) fr.push(['info', `<b>${pct(R.pesoMaior)}</b> do que entra vem de ${esc(R.maior.nome)}. Uma segunda fonte deixa o mês mais seguro.`]);
  if (fontes.length) fr.push([prev >= 0.8 ? 'pos' : 'info', `<b>${pct(prev)}</b> das suas entradas se repetem todo mês${prev >= 0.8 ? ': dá para planejar com calma.' : '. Conte com a parte fixa para as contas.'}`]);
  if (prov > 0 && R.coberturaPassiva != null && R.coberturaPassiva >= 0.01) fr.push(['pos', `Os proventos (${brl0(prov)}) já cobrem <b>${pct(Math.min(1, R.coberturaPassiva))}</b> dos seus gastos.`]);
  if (R.comprometimento != null && R.comprometimento >= 0.05) fr.push([R.comprometimento > 0.6 ? 'neg' : 'pos', `As contas fixas levam <b>${pct(R.comprometimento)}</b> da renda que se repete.`]);
  if (futuro > 0) fr.push(['inv', `Até dezembro ainda estão previstos <b>${brl0(futuro)}</b> em entradas.`]);
  const barras = C.receita.map((v, m) => `<span class="${m >= j.de && m <= j.ate ? 'on' : ''}${m > ult ? ' fut' : ''}"><i style="--h:${Math.max(3, (v / mx) * 100).toFixed(1)}%"></i><b>${MES[m][0]}</b></span>`).join('');
  const tile = (n, v, sub) => `<span class="bas-en-k"><small>${n}</small><b>${v}</b>${sub ? `<em>${sub}</em>` : ''}</span>`;
  return basDet('Entradas', `<section class="bas-en-hero"><div class="bas-en-h"><span><small>Entrou ${esc(basJanFrase())}</small><b>${basCent(tot)}</b></span><button class="bas-inv-pl" ${basIr('entrada')} aria-label="Nova entrada">${I.plus}<span>Entrada</span></button></div>
      <div class="bas-en-g" aria-hidden="true">${barras}</div></section>
    <div class="bas-en-ks">${tile('Média por mês', brl0(R.mediaMes))}${tile('Previsível', fontes.length ? pct(prev) : '–', `${brl0(prevMes)} por mês`)}
      ${tile('Renda passiva', R.passiva != null ? pct(R.passiva) : '–', prov > 0 ? `${brl0(prov)} em proventos` : 'Ainda sem proventos')}${tile('Guardou', R.poupanca != null ? pct(R.poupanca) : '–', `${brl0(R.sobraMes)} por mês`)}</div>
    ${fontes.length ? basSecao('De onde vem', `<small class="bas-raio-t">${fontes.length} ${fontes.length === 1 ? 'fonte' : 'fontes'}</small>`, `<div class="card bas-en-f">${fontes.map(([r, v], i) => `<button class="bas-en-fo" ${basIr('entrada', { id: r.id })}>
        <span class="bas-en-av" style="--bc:${PAL[i % 6]}" aria-hidden="true">${esc(basIniciais(r.nome))}</span><span class="bas-n"><b>${esc(r.nome)}</b><small>${esc(((p.rendaCats || []).find((c) => c.id === r.cat) || {}).nome || 'Renda')} · ${recDe(r.id) ? 'todo mês' : 'pontual'}</small><span class="bas-en-b"><i style="width:${((v / totF) * 100).toFixed(1)}%;--bc:${PAL[i % 6]}"></i></span></span>
        <span class="bas-v"><b class="pos">+${brl0(v)}</b><em>${pct(v / totF)}</em></span></button>`).join('')}</div>`) : basCard(basVazio('Nenhuma entrada neste período. Toque em + Entrada para anotar.'))}
    ${fr.length ? basSecao('O que os números dizem', '', `<ul class="bas-ah-fr">${fr.map(([t, x]) => `<li class="${t}">${x}</li>`).join('')}</ul>`) : ''}`);
}

/* ---- peças compartilhadas pelas listas ---- */
const basContas = (m) => E.contasMes({ despesas: S.plan.despesas, carry: E.carryItems(S.plans, S.year), ano: S.year, mes: m });
const basContaLinha = (x) => basRow(basIr('conta', { id: x.id }), x.inst ? instIcone(x.inst) : I_CONTA, esc(x.nome), x.parcela ? `parcela ${x.parcela.i} de ${x.parcela.n}` : 'todo mês',
  `<span class="bas-v"><b>${basCent(x.valor)}</b><em class="bas-st${x.pago ? ' ok' : ''}">${x.pago ? 'Pago' : 'A pagar'}</em></span>`);
const basLancLinha = (l) => { const d = E.parseDataISO(l.data);
  return basRow(basIr('gasto', { id: l.id }), l.inst ? instIcone(l.inst) : esc(basIniciais(l.desc || l.area)), esc(l.desc || l.area), `${esc(l.area)} · ${pad2(d.dia)}/${pad2(d.mes + 1)}`, `<b${l.valor < 0 ? ' class="pos"' : ''}>${l.valor < 0 ? '+' : '−'}${basCent(Math.abs(l.valor))}</b>`); };

/* ---- Gastos: "Para onde foi". Anel interativo (tocar destaca a categoria e mostra o valor; tocar de novo abre),
   anel fino de fora com o uso do limite, cartões por banco, contas numa linha do tempo e o + flutuante ---- */
function basGastos() {
  const C = S.C; const j = basJan(); const sai = basSomaJ(C.despesas); const orc = basSomaJ(C.orcamento); const carry = E.carryItems(S.plans, S.year);
  const areas = E.gastosAreaPeriodo(S.plan, carry, j.de, j.ate); const lista = Object.keys(areas).map((k) => [k, areas[k]]).filter((x) => x[1] > 0.005).sort((x, y) => y[1] - x[1]);
  const tot = lista.reduce((s, x) => s + x[1], 0); const secs = {};
  const R = 92; const CC = 2 * Math.PI * R; let off = 0;
  const arcos = tot > 0 ? lista.map(([n, v], i) => { const len = (v / tot) * CC; const gap = lista.length > 1 ? Math.min(3.5, len * 0.35) : 0; const L = Math.max(0.6, len - gap);
    const el = `<circle class="bas-arco" cx="120" cy="120" r="${R}" stroke="${PAL[i % 6]}" style="--i:${i};--len:${L.toFixed(1)};--cc:${CC.toFixed(1)};--c:${PAL[i % 6]}" stroke-dasharray="${L.toFixed(1)} ${CC.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" data-act="bas-arco" data-area="${esc(n)}" data-v="${esc(brl(v))}" data-p="${esc(pct(v / tot))}"><title>${esc(n)}</title></circle>`; off += len; return el; }).join('') : '';
  const uso = orc > 0 ? sai / orc : null; const R2 = 112; const C2 = 2 * Math.PI * R2;
  const limite = uso != null ? `<circle class="bas-lim-f" cx="120" cy="120" r="${R2}"/><circle class="bas-lim-v${uso > 1 ? ' neg' : uso >= 0.8 ? ' warn' : ''}" cx="120" cy="120" r="${R2}" stroke-dasharray="${(C2 * Math.min(1, uso)).toFixed(1)} ${C2.toFixed(1)}"/>` : '';
  secs.anel = `<div class="bas-roda" data-sel=""><svg viewBox="0 0 240 240" role="img" aria-label="Gastos por categoria ${esc(basJanFrase())}"><circle class="bas-anel-f" cx="120" cy="120" r="${R}"/>${limite}${arcos}</svg>
    <div class="bas-roda-c"><div class="bas-roda-tot"><small>Gastou ${esc(basJanFrase())}</small><b>${basCent(sai)}</b>${uso != null ? `<button class="bas-roda-lim${uso > 1 ? ' neg' : uso >= 0.8 ? ' warn' : ''}" ${basIr('limite')}>${pct(uso)} do limite</button>` : `<button class="bas-roda-lim def" ${basIr('limite')}>Definir limite</button>`}</div>
      <div class="bas-roda-cat" aria-live="polite"><small data-r="n"></small><b data-r="v"></b><span data-r="p"></span><button class="bas-roda-lim def" data-act="bas-arco-abrir">Ver detalhes</button></div></div></div>
    ${lista.length ? `<div class="bas-leg">${lista.map(([n, v], i) => `<button data-act="bas-arco" data-area="${esc(n)}" data-v="${esc(brl(v))}" data-p="${esc(pct(v / (tot || 1)))}"><i style="--bc:${PAL[i % 6]}"></i>${esc(n)}<b>${pct(v / (tot || 1))}</b></button>`).join('')}</div>` : `<p class="bas-p bas-centro">${voz('bas_vazio')}</p>`}`;
  secs.cartoes = basCartoesHtml();
  secs.onde = basOndeHtml(); secs.limites = basLimitesHtml();
  const lanc = basLancJan().slice(0, 8);
  secs.ultimos = lanc.length ? basSecao('Últimos gastos', '', `<ul class="bas-ativ">${lanc.map(basLancLinha).join('')}</ul>`) : '';
  return `<div class="bas-pg bas-pg-g">${basCab('Gastos', `<button class="bell" data-act="bas-importar" aria-label="Importar extrato do banco" title="Importar extrato">${I_IMPORTAR}</button><button class="bas-inv-pl" ${basIr('gasto')} aria-label="Novo gasto">${I.plus}<span>Gasto</span></button>`)}<div class="bas-pg-per">${basPerPill()}<button class="bas-rx" ${basPago() ? basIr('raiox') : 'data-act="upgrade" data-plano="investidor"'}><span class="bas-rx-ic" aria-hidden="true">${I_RAIOX}</span>Raio-X${basPago() ? '' : I.lock}</button><button class="bas-circ" ${basIr('entradas')} aria-label="Entradas" title="Entradas">${I_ENTRADA}</button></div>
    ${basOrdenar('gastos', secs)}${basOrganizarBtn('gastos')}</div>`;
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
  const ult = S.year === NOW_Y ? NOW_M : 11; const serie = C.patrimonio.slice(0, ult + 1); const mn = Math.min(...serie); const mx = Math.max(...serie); const W = 320; const H = 150; const P = 12;
  const xs = (i) => (serie.length > 1 ? P + (i / (serie.length - 1)) * (W - 2 * P) : W / 2); const ys = (v) => (mx > mn ? H - 18 - ((v - mn) / (mx - mn)) * (H - 46) : H / 2);
  const pts = serie.map((v, i) => [xs(i), ys(v)]);
  // curva suave (Catmull-Rom para Bézier), a área com degradê e a faixa do período escolhido
  const curva = basCurva(pts);
  const fx = Math.min(j.ate, ult); const fai = j.n > 1 && j.de <= ult ? `<rect class="bas-ev-faixa" x="${(xs(j.de) - 8).toFixed(1)}" y="0" width="${(xs(fx) - xs(j.de) + 16).toFixed(1)}" height="${H}" rx="10"/>` : '';
  const dados = serie.map((v, i) => [MES_LONGO[i], brl(v)]); const sel = Math.min(j.ate, ult);
  secs.patr = `<section class="bas-ev" data-pts='${esc(JSON.stringify(pts.map((p) => [+p[0].toFixed(1), +p[1].toFixed(1)])))}' data-d='${esc(JSON.stringify(dados))}' data-w="${W}" data-h="${H}">
    <div class="bas-ev-h"><small class="bas-ev-k" data-ev="k">Patrimônio em ${MES_LONGO[sel]}</small><b class="bas-ev-v" data-ev="v">${basCent(C.patrimonio[sel])}</b>
      ${V.va != null ? `<p class="bas-noite-s"><em class="${V.dif >= 0 ? 'pos' : 'neg'}">${V.dif >= 0 ? '↗ +' : '↘ −'}${brl0(Math.abs(V.dif))} (${pct(Math.abs(V.va), 1)})</em> ${basJanFrase()}</p>` : ''}</div>
    <div class="bas-ev-g" role="img" aria-label="Evolução do patrimônio em ${S.year}. Arraste o dedo para ver cada mês."><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bas-ev-ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      ${fai}<path class="bas-ev-a" d="${curva} L${xs(serie.length - 1).toFixed(1)} ${H} L${xs(0).toFixed(1)} ${H} Z"/><path class="bas-ev-l" d="${curva}"/></svg>
      <span class="bas-ev-guia" aria-hidden="true"></span><span class="bas-ev-p" aria-hidden="true" style="left:${((pts[sel][0] / W) * 100).toFixed(2)}%;top:${((pts[sel][1] / H) * 100).toFixed(2)}%"></span></div>
    <div class="bas-barras-m bas-ev-m" aria-hidden="true">${MES.slice(0, ult + 1).map((m, i) => `<span${i >= j.de && i <= j.ate ? ' class="on"' : ''}>${m[0]}</span>`).join('')}</div>
    <div class="bas-noite-par bas-tres"><span><small>Investido</small><b>${basCent(D.aportado)}</b></span><span><small>Proventos</small><b>${basCent(basSomaJ(C.faturamento))}</b></span><span><small>Disponível</small><b>${basCent(D.disponivel)}</b></span></div></section>`;
  const f = D.meta > 0 ? D.aportado / D.meta : 0;
  secs.meta = basMetaDispHtml();
  // seus sonhos também em Investir: cada aporte aproxima um deles; tocar abre os detalhes
  const As = objAnalise(); const gF = objFoco(As);
  secs.sonhos = basSecao('Seus sonhos', `<button class="lnk strong" ${basIr('sonhos')}>Ver todos</button>`, `<div class="bas-sn-c">${As.itens.map((x, i) => `<button class="bas-sn${gF && x.id === gF.id ? ' on' : ''}" ${basIr('sonho-det', { id: x.id })}>${basAnel(x.progresso, 54, objIcone(x, i))}<b>${esc(objNomeDe(x))}</b><small>${pct(x.progresso)}</small></button>`).join('')}<button class="bas-sn novo" ${basIr('objetivo')}><span class="bas-sn-mais" aria-hidden="true">${I.plus}</span><b>Novo sonho</b><small>Dê um nome</small></button></div>`);
  if (temRecurso('carteira')) { const { K } = cartAnalise(); const tt = K.classes.reduce((t, c) => t + c.valor, 0);
    if (tt > 0) { const cls = K.classes.slice().sort((a, b) => b.valor - a.valor);
      secs.comp = basSecao('Como está dividido', `<button class="lnk strong" ${basIr('carteira')}>Carteira</button>`, `<div class="card bas-comp"><div class="bas-comp-b" aria-hidden="true">${cls.map((c, i) => `<i style="flex:${c.valor.toFixed(2)};--bc:${PAL[i % 6]}"></i>`).join('')}</div>
        <ul class="bas-comp-l">${cls.map((c, i) => `<li><i style="--bc:${PAL[i % 6]}"></i><span>${esc(c.classe || 'Outros')}</span><b>${pct(c.valor / tt)}</b></li>`).join('')}</ul></div>`); } }
  // acompanhar: botões redondos só com o ícone, ao lado do período (o nome fica no aria-label e no title)
  const atalho = (attrs, ic0, nome) => `<button class="bas-circ" ${attrs} aria-label="${nome}" title="${nome}">${ic0}</button>`;
  const extras = [temRecurso('proventos') ? atalho(basIr('proventos'), I_PROV, 'Proventos') : '', temRecurso('carteira') ? atalho(basIr('carteira'), I_CART, 'Minha carteira') : '',
    temRecurso('carteira_recomendada') && S.recomendacao && (S.recomendacao.carteira || []).length ? atalho(basIr('carteira'), I_REC, `Recomendação do ${esc(primeiroNome())}`) : ''].filter(Boolean).join('');
  const ativos = S.plan.ativos.map((a) => [a, (a.ap || []).slice(j.de, j.ate + 1).reduce((s, v) => s + (+v || 0), 0)]).filter((x) => Math.abs(x[1]) > 0.005);
  secs.feitos = ativos.length ? basSecao(`Investido ${esc(basJanFrase())}`, '', `<ul class="bas-ativ">${ativos.map(([a, v], i) => basRow(pode && j.n === 1 ? basIr('aporte', { id: a.id }) : 'disabled', esc(basIniciais(a.nome)), esc(a.nome), v < 0 ? 'Resgate' : E.norm(a.classe) === E.norm(a.nome) ? '' : esc(a.classe || ''), `<b class="${v < 0 ? 'neg' : 'pos'}">${v < 0 ? '−' : '+'}${basCent(Math.abs(v))}</b>`, PAL[i % 6])).join('')}</ul>`) : '';
  // Investimento: pílula compacta na linha do período (aportar, resgatar ou importar ficam na tela que ela abre)
  const acoes = `<button class="bas-inv-pl" ${basIrInv()} aria-label="Investimento: aportar, resgatar ou importar">${I.plus}<span>Investir</span></button>`;
  return `<div class="bas-pg bas-pg-i">${basCab('Investir', acoes)}<div class="bas-pg-per">${basPerPill()}${extras}</div>${basOrdenar('investir', secs)}${basOrganizarBtn('investir')}<p class="bas-disc keep">Valores a custo, sem cotação de mercado. Sem promessa de rentabilidade.</p></div>`;
}
// o gráfico do patrimônio segue o dedo (manipulação direta): o mês mais perto do toque aparece em cima, sem redesenhar
function basEvLigar() {
  const ev = document.querySelector('.bas-ev'); if (!ev || ev.dataset.on) return; ev.dataset.on = '1';
  const g = ev.querySelector('.bas-ev-g'); const pts = JSON.parse(ev.dataset.pts); const dd = JSON.parse(ev.dataset.d); const W = +ev.dataset.w; const H = +ev.dataset.h;
  const ponto = ev.querySelector('.bas-ev-p'); const guia = ev.querySelector('.bas-ev-guia'); const k = ev.querySelector('[data-ev="k"]'); const v = ev.querySelector('[data-ev="v"]');
  const k0 = k.textContent; const v0 = v.innerHTML; let ult = -1; const topo = pts.reduce((b, p, n) => (p[1] < pts[b][1] ? n : b), 0);
  const mover = (e) => { const r = g.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W; let i = 0; pts.forEach((p, n) => { if (Math.abs(p[0] - x) < Math.abs(pts[i][0] - x)) i = n; });
    if (i === ult) return; ult = i; const L = (pts[i][0] / W) * 100; ponto.style.left = L + '%'; ponto.style.top = (pts[i][1] / H) * 100 + '%'; guia.style.left = L + '%'; ev.classList.add('arrasta');
    k.textContent = `Patrimônio em ${dd[i][0]}`; v.textContent = dd[i][1]; basSom('toque'); ponto.classList.toggle('topo', i === topo); if (i === topo) basVibra(14); };
  const soltar = () => { ev.classList.remove('arrasta'); ult = -1; k.textContent = k0; v.innerHTML = v0; };
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
  const modo = basEscolhe() ? basCard(`<div class="bas-op">${basNome('Versão do AVEN', `${BAS_NOMES.basico}: no jeito de celular. ${BAS_NOMES.completo}: o painel completo, com todas as telas.`)}${basTrocaHtml()}</div>`)
    : planoAtual() === 'gratis' && !S.isAdmin ? `<ul class="bas-ativ">${basRow('data-act="upgrade" data-plano="investidor"', I.inv, `Conhecer o plano ${esc(nomePlano('investidor'))}`, `O ${BAS_NOMES.basico} completo e o ${BAS_NOMES.completo}, com proventos, carteira e simulador.`, I.chev)}</ul>` : '';
  const st = S.plan.settings; const plano = `<button class="card bas-pj-bt" ${basIr('planejamento')}><span class="bas-pj-bic" aria-hidden="true">${I_PLANO}</span><span class="bas-n"><b>Planejamento</b><small>Metas, limites, minhas instituições e anos</small></span>${I.chev}
    <span class="bas-pj-res"><span><small>Investir</small><b>${+st.metaAporte > 0 ? brl0(st.metaAporte) : '–'}</b></span><span><small>Gastar até</small><b>${+st.orcPadrao > 0 ? brl0(st.orcPadrao) : '–'}</b></span><span><small>Instituições</small><b>${instMinhas().length}</b></span></span></button>`;
  const cli = S.isAdmin && Store.mode === 'cloud' ? basSecao('Consultor', '', `<ul class="bas-ativ">${basRow(basIr('clientes'), I.clientes, 'Clientes', 'Cadastros e planos', I.chev)}</ul>`) : '';
  return `<div class="bas-pg bas-pg-p">${basCab('Perfil')}${membro}
    ${basSecao('Sua cor', `<button class="bas-tg" data-act="bas-cores" aria-expanded="${!!S.basCores}" aria-label="${S.basCores ? 'Recolher' : 'Abrir'} as cores">${I.down}</button>`, !S.basCores ? '' : `<div class="card bas-aparencia">${cores}<div class="seg bas-temas" role="group" aria-label="Tema">${temas}</div><label class="bas-op bas-sw">${basNome('Sons', 'Um toque curto ao salvar, pagar e trocar de tela.')}<span class="wg-sw"><input type="checkbox" data-act="bas-sons" ${basSomLigado() ? 'checked' : ''} aria-label="Sons"><span></span></span></label></div>`)}
    ${plano}${conq}
    ${basSecao('Jeito de falar', '', `<div class="bas-vozes">${vozes}</div>`)}${modo ? basSecao('Versão', '', modo) : ''}
    ${cli}${basSecao('Seus dados', '', `<ul class="bas-ativ">${basRow('data-act="backup"', I_IMPORTAR, 'Baixar meus dados', 'Uma cópia de tudo, em arquivo', I.chev)}${basRow(basIr('privacidade'), I.lock, 'Privacidade e termos', 'O que fazemos com os seus dados', I.chev)}${basRow(basIr('excluir'), I.x, 'Excluir minha conta', 'Apaga a conta e todos os dados', I.chev)}</ul>`)}<ul class="bas-ativ bas-sair"><li><button data-act="bas-sair">${basNome('Sair')}</button></li></ul></div>`;
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
  { id: 'cor', t: 'Como mudo a cor, o tema ou o jeito de falar?', k: ['cor', 'tema', 'modo escuro', 'modo claro', 'aparencia', 'jeito de falar', 'voz'], passos: [
    { ir: basGuiaIr('perfil'), s: '[data-act="bas-cores"]', t: 'Sua cor', d: 'Escolha a cor de destaque do app.' },
    { s: '.bas-voz', t: 'Jeito de falar', d: 'Consultivo, Direto ou Acolhedor. Muda os textos; os números são sempre os mesmos.' }] },
  { id: 'saude', t: 'O que é a saúde financeira?', k: ['saude', 'nota', 'rostinho', 'reserva de emergencia', 'estou bem'], passos: [
    { ir: basGuiaIr('perfil'), s: '.bas-sd-r', t: 'Saúde financeira', d: 'Uma nota de 0 a 100 pela reserva, pela sobra do ano, pelas contas fixas e pelo seu sonho. Toque para ver cada ponto e o que fazer.' }] },
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
    { ir: basGuiaIr('perfil'), s: '[data-act="backup"]', t: 'Baixar meus dados', d: 'Uma cópia de tudo, num arquivo.' },
    { s: '[data-t="privacidade"]', t: 'Privacidade e termos', d: 'O que fazemos com os seus dados.' },
    { s: '[data-t="excluir"]', t: 'Excluir minha conta', d: 'Apaga a conta e todos os dados, depois de confirmar.' }] },
];
const basGuias = () => BAS_GUIAS.filter((g) => !g.pago || basPago());
const basSemAcento = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// pergunta de ajuda sobre o app ("como", "onde", "o que é"...) vira o guia de mais palavras em comum
function basGuiaAchar(q) {
  const t = basSemAcento(q); if (!/\b(como|onde|cade|o que e|pra que|para que|nao (sei|acho|consigo)|ajuda|consigo|da pra|tem como|mostra)\b/.test(t)) return null;
  let melhor = null; let max = 0; basGuias().forEach((g) => { const n = g.k.filter((k) => new RegExp(`\\b${k}`).test(t)).length; if (n > max) { max = n; melhor = g; } });
  return melhor;
}
function basGuiaIniciar(id) {
  const g = basGuias().find((x) => x.id === id); if (!g || typeof tourIniciar !== 'function') return; basSom('toque');
  tourIniciar(g.passos.map((p) => Object.assign({}, p)), 'Entendi');
}
function basDuvidasHtml() {
  return `<div class="card bas-dv"><label class="bas-dv-b">${typeof I_LUPA !== 'undefined' ? I_LUPA : ''}<input type="search" placeholder="Qual é a sua dúvida?" aria-label="Procurar uma dúvida" data-bas-dv></label>
    <p class="bas-p bas-dv-p">Escolha uma e eu mostro o caminho na tela, passo a passo.</p>
    <ul class="bas-ativ bas-dv-l">${basGuias().map((g) => `<li data-k="${esc(basSemAcento(g.t + ' ' + g.k.join(' ')))}"><button data-act="bas-guia" data-id="${g.id}"><span class="bas-ini" aria-hidden="true">${g.passos.length}</span><span class="bas-n"><b>${esc(g.t)}</b><small>${g.passos.length === 1 ? '1 passo' : `${g.passos.length} passos`}</small></span>${I.chev}</button></li>`).join('')}</ul>
    <p class="bas-p bas-dv-nada" hidden>Nada com esse nome. Tente outra palavra ou pergunte na Conversa.</p></div>`;
}
// filtra a lista de dúvidas enquanto digita (sem render)
function basDvLigar() {
  const i = document.querySelector('[data-bas-dv]'); if (!i || i.dataset.lig) return; i.dataset.lig = '1';
  i.addEventListener('input', () => { const ws = basSemAcento(i.value).trim().split(/\s+/).filter(Boolean); let n = 0;
    document.querySelectorAll('.bas-dv-l li').forEach((li) => { const ok = ws.every((w) => li.dataset.k.includes(w)); li.hidden = !ok; if (ok) n++; }); document.querySelector('.bas-dv-nada').hidden = !!n; });
}
function basTelaIa() {
  const aba = ['avisos', 'duvidas'].includes(S.basIaAba) ? S.basIaAba : 'conversa'; const av = basAvisosNovos();
  const abas = `<div class="seg bas-ia-abas" role="tablist">${[['conversa', 'Conversa'], ['duvidas', 'Dúvidas'], ['avisos', `Avisos${av ? ` <em>${av}</em>` : ''}`]].map(([v, l]) => `<button role="tab" class="${aba === v ? 'on' : ''}" data-act="bas-ia-aba" data-v="${v}" aria-selected="${aba === v}">${l}</button>`).join('')}</div>`;
  return basDet(`Assistente ${esc(CFG.marca || '')}`, `${abas}${aba === 'avisos' ? basAvisosLista() : aba === 'duvidas' ? basDuvidasHtml() : `<section class="card ia-card bas-ia">${S.iaComecou ? `${iaConversaHtml('b')}<p class="ia-disc disc">Respostas automáticas a partir do seu planejamento, sem indicação de investimentos.</p>` : iaIntroHtml()}</section>`}`);
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
  const n = basSeqDados().Q.atual; const marco = BAS_SEQ_MARCOS.filter((x) => x[0] <= n).pop();
  if (marco && marco[0] > (+S.profile.seqCelebrado || 0)) { S.profile.seqCelebrado = marco[0]; touch('profile'); setTimeout(() => basAbrir('conquista', { id: marco[0] }), 900); }
}
function basDesenhar() {
  const st = document.getElementById('bas-o3');
  if (st) { const falhou = () => st.classList.add('sem-3d'); if (typeof o3Ligar === 'function') o3Ligar(st, st.dataset.tipo, falhou); else falhou(); }
  basEvLigar(); basOrgLigar(); basAlSoma(); basHlLigar(); basContar(); basCartoes3d(); basMedalhaLigar(); basDvLigar();
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
function basTelaGasto(o, it) {
  const p = S.plan; const l = !it && o.id ? p.lancamentos.find((x) => x.id === o.id) : null; if (o.id && !l && !it) return basSumiu();
  const a0 = l ? l.area : it ? it.area : o.area || ''; const usadas = p.despesas.map((x) => x.area).concat(p.lancamentos.map((x) => x.area));
  const areas = [...new Set(BAS_AREAS.concat(usadas, a0 ? [a0] : []).filter(Boolean))].slice(0, 16);
  // um gasto só: uma vez (com data), todo mês (até dezembro) ou parcelado; os dois últimos são gravados como no SaaS (previsto em plan.despesas)
  const tipo = it ? (it.parcel ? 'parc' : 'mes') : o.modo === 'parc' || o.modo === 'mes' ? o.modo : 'uma';
  // inteligente: o último banco usado já vem marcado e o nome conhecido lembra categoria e banco
  const mem = basMemGastos(); const pc = it && it.parcel; const ini = pc ? { ano: pc.ano, mes: pc.mes } : { ano: S.year, mes: S.mes };
  const i0 = l ? l.inst || '' : it ? it.inst || '' : ([...(p.lancamentos || [])].reverse().find((x) => x.inst && instMinhas().includes(x.inst)) || {}).inst || '';
  return basForm(it ? 'conta' : 'gasto', l || it ? 'Editar gasto' : 'Novo gasto', `${l ? '' : basChips('tipo', [['uma', 'Uma vez'], ['mes', 'Todo mês'], ['parc', 'Parcelado']], tipo, 'Como é o gasto')}
    <div class="bas-blk" data-blk="val">${basValor('valor', l ? Math.abs(l.valor) : it && !pc ? +it.valores[S.mes] || 0 : 0, it && !pc ? `Quanto foi? Vale de ${MES_LONGO[S.mes]} em diante` : 'Quanto foi?')}</div>
    ${l ? '' : `<div class="bas-blk" data-blk="parc">${basValor('total', pc ? pc.total : 0, 'Valor total da compra')}${basCampo('n', 'Em quantas vezes?', pc ? pc.n : 10, 'inputmode="numeric" maxlength="3"')}<p class="bas-p">A primeira parcela cai em ${MES_LONGO[ini.mes]} de ${ini.ano}.</p></div>`}
    ${basCampo('desc', 'Com o quê?', l ? l.desc : it ? it.nome : '', 'placeholder="Ex.: Mercado, Aluguel, Celular" list="bas-dl-desc" autocomplete="off"')}<datalist id="bas-dl-desc">${[...mem.values()].map((x) => `<option value="${esc(x.desc)}">`).join('')}</datalist>
    <p class="bas-p bas-lembra" aria-live="polite" hidden></p>
    ${basChips('area', areas.map((a) => [a, a]), a0, 'Categoria')}${basCampo('areaNova', 'Ou escreva outra categoria', '', 'placeholder="Ex.: Pets"')}
    <fieldset class="bas-fs"><legend>Pago com</legend><div class="bas-chips bas-inst">${['', ...new Set(instMinhas().concat(i0 ? [i0] : []))].filter((v) => !v || instDe(v)).map((v) => `<label class="bas-chip"><input type="radio" name="inst" value="${v}" ${v === i0 ? 'checked' : ''}><span>${v ? instIcone(v) + esc(instDe(v)[1]) : 'Não informar'}</span></label>`).join('')}<button type="button" class="bas-chip-add" ${basIr('planejamento')}>${I.plus}${instMinhas().length ? 'Bancos' : 'Escolher bancos'}</button></div></fieldset>
    <label class="bas-fl bas-blk" data-blk="data"><span>Quando</span><input type="date" name="data" value="${esc(l ? l.data : basDataMes(S.mes))}" min="${S.year}-01-01" max="${S.year}-12-31"></label>
    ${l ? '' : `<p class="bas-p bas-blk" data-blk="mesp">Vale de ${MES_LONGO[S.mes]} até dezembro. Quando você anotar o pagamento, ele é marcado como pago, sem contar duas vezes.</p>`}`, { excluir: l || it ? 'Excluir gasto' : '' });
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
function basTelaEntrada(o) {
  const r = o.id ? S.plan.rendas.find((x) => x.id === o.id) : null; if (o.id && !r) return basSumiu();
  return basForm('entrada', r ? 'Editar entrada' : 'Nova entrada', `${basValor('valor', r ? +r.valores[S.mes] || 0 : 0, `Quanto entrou em ${MES_LONGO[S.mes]}?`)}
    ${basCampo('nome', 'De onde veio?', r ? r.nome : '', 'placeholder="Ex.: Salário, Freela"')}
    ${basChips('cat', (S.plan.rendaCats && S.plan.rendaCats.length ? S.plan.rendaCats : E.CATS_RENDA()).map((c) => [c.id, c.nome]), r ? r.cat : 'fixa', 'Tipo de renda')}
    ${basSw('todo', r ? 'Usar este valor até dezembro' : 'Entra todo mês', r ? `Troca o valor de ${MES_LONGO[S.mes]} em diante.` : `De ${MES_LONGO[S.mes]} até dezembro.`, !r)}`, { excluir: r ? 'Excluir entrada' : '' });
}
// registrar investimento (ou corrigir o valor de um ativo no mês)
function basTelaAporte(o) {
  const p = S.plan; const a = o.id ? p.ativos.find((x) => x.id === o.id) : null; if (o.id && !a) return basSumiu(); const m = S.mes;
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
  return basDet('Meus objetivos', `${A.itens.length ? basCard(`<ul class="bas-l">${A.itens.map((g, i) => `<li><button ${basIr('objetivo', { id: g.id })}>${objIcone(g, i)}<span class="bas-cl">${basNome(esc(objNomeDe(g)) + (g.id === foco ? ' <em class="bas-tag">Principal</em>' : ''), `${brl0(g.saldo)} de ${brl0(g.valor)}${g.ano ? ' até ' + g.ano : ''}`)}<b>${pct(g.progresso)}</b>${basBarra(g.progresso).replace('bas-bar', 'bas-bar fina')}</span>${I.chev}</button></li>`).join('')}</ul>`) : basCard(basVazio('Nenhum objetivo ainda.'))}
    <button class="btn primary lg bas-cta bas-add" ${basIr('objetivo')}>${I.plus}Novo objetivo</button><p class="bas-disc keep">Projeção ilustrativa, sem promessa de rentabilidade.</p>`);
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
  return basDet(esc(area), `${basCard(`<small class="bas-k">${cap(MES_LONGO[m])}</small><b class="bas-big">${brl(tot)}</b>${basLimArea(area, tot)}<button class="btn primary lg bas-cta bas-add" ${basIr('gasto', { area })}>${I.plus}Gasto em ${esc(area)}</button>`, 'bas-hero')}
    ${contas.length + lanc.length ? basSecao('Gastos', '', `<ul class="bas-ativ">${contas.filter((x) => !x.pago).map(basContaLinha).join('')}${lanc.map(basLancLinha).join('')}</ul>`) : ''}`);
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
    ${basCard(`<div class="bas-ch"><h2 class="bas-h2">Onde investir agora</h2><button class="lnk strong" ${basIr('alvos')}>Alvos</button></div>${!comAlvo ? `<p class="bas-p bas-p0">Diga quanto quer em cada investimento (combine com o ${esc(primeiroNome())}) e o app mostra onde colocar cada aporte.</p><button class="btn primary lg bas-cta bas-add" ${basIr('alvos')}>Definir os alvos</button>`
      : sug.length ? `<p class="bas-p bas-p0">Para deixar a carteira mais perto do combinado com ${brl(M.aporte)} disponíveis:</p><ul class="bas-l">${sug.map((i) => `<li><span class="bas-cl bas-li">${basNome(esc(i.nome), esc(i.classe || ''))}<b class="pos">${brl(i.sug)}</b></span></li>`).join('')}</ul>` : basVazio('Sem valor disponível para investir neste mês.')}`)}
    ${basRecHtml()}<p class="bas-disc keep">Sugestão de divisão pelo alvo combinado, sem indicação de ativos nem promessa de rentabilidade.</p>`);
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
function basTelaSimular(o) {
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
function basTelaAnoResumo() {
  const C = S.C; const T = C.T; const ult = S.year === NOW_Y ? NOW_M : 11; const sob = C.investAlocado.slice(0, ult + 1);
  const melhor = sob.reduce((b, v, i) => (v > sob[b] ? i : b), 0); const pior = sob.reduce((b, v, i) => (v < sob[b] ? i : b), 0);
  return basDet(`Seu ${S.year}`, `${basCard(`<small class="bas-k">Sobrou no ano</small><b class="bas-big">${basCent(T.investAlocado)}</b><p class="bas-p">${T.poupanca != null ? `Você guardou <b>${pct(T.poupanca)}</b> do que entrou.` : 'Anote as entradas para ver quanto guardou.'}</p>
      ${basBarras(C.investAlocado, S.mes)}`, 'bas-hero')}
    <div class="bas-dupla"><div class="card bas-tile"><small class="bas-k">Melhor mês</small><b>${cap(MES_LONGO[melhor])}</b><span class="pos">${basCent(sob[melhor] || 0)}</span></div><div class="card bas-tile"><small class="bas-k">Mês mais apertado</small><b>${cap(MES_LONGO[pior])}</b><span class="${sob[pior] < 0 ? 'neg' : ''}">${basCent(sob[pior] || 0)}</span></div></div>
    ${basSecao('No ano', '', `<ul class="bas-ativ">${[['Entrou', T.receita, 'pos', I_ENTRADA], ['Saiu', T.despesas, '', I_GASTO], ['Investido', T.aplicado, 'pos', I.inv], ['Proventos', T.faturamento, 'pos', I_PROV]].map(([n, v, c, i0]) => basRow('disabled', i0, n, '', `<b class="${c}">${basCent(v)}</b>`)).join('')}</ul>`)}`);
}
// Histórico: patrimônio no fim de cada ano e o crescimento (E.historico, o mesmo da linha do tempo do SaaS)
function basTelaHistorico() {
  const H = histDados(); const anos = H.anos || []; const mx = Math.max(1, ...anos.map((l) => l.patrimonioFim)); const t = H.totais || {};
  return basDet('Histórico', `${basCard(`<small class="bas-k">Patrimônio hoje</small><b class="bas-big">${basCent(t.patrimonioAtual || 0)}</b><p class="bas-p">${t.crescimento ? `${t.crescimento >= 0 ? 'Cresceu' : 'Caiu'} <b>${brl(Math.abs(t.crescimento))}</b>${t.crescimentoPct != null ? ` (${pct(t.crescimentoPct)})` : ''} desde ${anos[0] ? anos[0].ano : ''}.` : 'O histórico cresce a cada ano planejado.'}</p>`, 'bas-hero')}
    ${anos.length ? `<ul class="bas-hist">${anos.slice().reverse().map((l) => `<li><span class="bas-hist-a">${l.ano}${l.parcial ? '<small>até agora</small>' : ''}</span><span class="bas-hist-b"><i style="width:${((l.patrimonioFim / mx) * 100).toFixed(1)}%"></i></span><span class="bas-hist-v"><b>${brl0(l.patrimonioFim)}</b>${l.variacaoPct != null ? `<small class="${l.variacao >= 0 ? 'pos' : 'neg'}">${l.variacao >= 0 ? '+' : '−'}${pct(Math.abs(l.variacaoPct))}</small>` : ''}</span></li>`).join('')}</ul>` : basCard(basVazio('Ainda sem anos com dados.'))}`);
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
// Resumo do mês: um cartão bonito e um texto para mandar a quem quiser (compartilhar do aparelho ou copiar)
function basTelaResumo() {
  const m = S.mes; const C = S.C; const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes }); const g = objFoco(objAnalise());
  const lin = (n, v, c) => `<li><span>${n}</span><b class="${c || ''}">${basCent(v)}</b></li>`;
  return basDet('Resumo do mês', `<div class="bas-story"><span class="bas-story-m" aria-hidden="true">${LOGO}</span><small>${esc(cap(MES_LONGO[m]))} de ${S.year}</small><b class="bas-story-v">${basCent(C.investAlocado[m])}</b><span class="bas-story-k">sobraram no mês</span>
      <ul>${lin('Entrou', C.receita[m], 'pos')}${lin('Saiu', C.despesas[m])}${lin('Investido', D.aportado, 'pos')}${C.faturamento[m] > 0 ? lin('Proventos', C.faturamento[m], 'pos') : ''}</ul>
      ${g ? `<div class="bas-story-g"><span>${esc(objNomeDe(g))}</span>${basBarra(g.progresso)}<b>${pct(g.progresso)}</b></div>` : ''}</div>
    <button class="btn primary lg bas-cta bas-add" data-act="bas-partilhar">${I_PARTILHA}Compartilhar imagem</button><p class="bas-disc keep">${oculto() ? 'Com o olho fechado, a imagem vai sem os valores.' : 'A imagem leva os valores do mês. Feche o olho para mandar sem eles.'}</p>`);
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
const basSomLigado = () => !!(S.profile && S.profile.prefs && S.profile.prefs.sons !== false);
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
function basExtrasInicio(secs) {
  const C = S.C; const j = basJan(); const D = E.disponivelAporte({ C, mes: j.de, ate: j.ate, metaMes: C.metaAporteMes });
  if (typeof aberturaPode === 'function' && aberturaPode()) secs.globo = `<button class="card bas-w-globo" data-act="bas-globo"><span class="bas-w-orb" aria-hidden="true"></span>${basNome('Seu universo financeiro', 'O seu patrimônio como um globo vivo')}${I.chev}</button>`;
  const H = basSaude(j.ate); const cls = H.nota == null ? '' : H.nota >= 80 ? 'ok' : H.nota >= 60 ? 'atencao' : 'baixo';
  secs.saude = `<button class="card bas-w-saude" data-act="bas-aba" data-v="perfil">${basAnel(H.nota == null ? 0 : H.nota / 100, 72, `<b>${H.nota == null ? '–' : H.nota}</b>`, cls)}${basNome('Saúde financeira', H.nota == null ? voz('bas_vazio') : voz(H.nota >= 80 ? 'bas_saude_bom' : H.nota >= 60 ? 'bas_saude_med' : 'bas_saude_baixo'))}${I.chev}</button>`;
  const K = basContas(j.ate); const pend = K.itens.filter((x) => !x.pago).slice(0, 3);
  secs.contas = basSecao(`A pagar em ${MES_LONGO[j.ate]}`, `<button class="lnk strong" data-act="bas-aba" data-v="gastos">Todas</button>`, pend.length ? `<ul class="bas-ativ">${pend.map(basContaLinha).join('')}</ul>` : basCard(basVazio(K.itens.length ? 'Tudo pago neste mês.' : 'Nenhuma conta do mês anotada.')));
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
  const C = S.C; const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes }); const g = objFoco(objAnalise());
  const cs = getComputedStyle(document.documentElement); const acc = cs.getPropertyValue('--accent').trim() || '#0A84FF'; const acc2 = cs.getPropertyValue('--accent-2').trim() || '#5E5CE6';
  const fonte = getComputedStyle(document.body).fontFamily; const W = 1080; const H = 1350; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#0E0F13'; x.fillRect(0, 0, W, H);
  const brilho = (cx, cy, r, cor, a) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, cor); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a; x.fillStyle = gr; x.fillRect(0, 0, W, H); x.globalAlpha = 1; };
  brilho(W * 0.5, -60, 760, acc, 0.75); brilho(W * 0.5, H + 120, 760, acc2, 0.5);
  x.fillStyle = 'rgba(255,255,255,0.10)'; for (let yy = 30; yy < 620; yy += 36) for (let xx = 30; xx < W; xx += 36) { x.globalAlpha = 0.9 * (1 - yy / 620); x.fillRect(xx, yy, 2.5, 2.5); } x.globalAlpha = 1;
  const txt = (t, px, peso, cor, y, al) => { x.font = `${peso} ${px}px ${fonte}`; x.fillStyle = cor; x.textAlign = al || 'center'; x.fillText(t, al === 'left' ? 96 : al === 'right' ? W - 96 : W / 2, y); };
  txt(CFG.marca || 'AVEN', 54, 800, '#ffffff', 150); txt(`${cap(MES_LONGO[m])} de ${S.year}`, 38, 500, 'rgba(245,245,247,0.7)', 225);
  const v = brl(C.investAlocado[m]); txt(v, v.length > 14 ? 104 : 124, 800, '#ffffff', 390); txt('sobraram no mês', 38, 500, 'rgba(245,245,247,0.7)', 455);
  const linhas = [['Entrou', brl(C.receita[m]), '#30D158'], ['Saiu', brl(C.despesas[m]), '#ffffff'], ['Investido', brl(D.aportado), '#30D158']].concat(C.faturamento[m] > 0 ? [['Proventos', brl(C.faturamento[m]), '#30D158']] : []);
  linhas.forEach(([n, val, cor], i) => { const y = 540 + i * 118; x.fillStyle = 'rgba(255,255,255,0.07)'; x.beginPath(); x.roundRect(80, y, W - 160, 96, 28); x.fill(); txt(n, 38, 500, 'rgba(245,245,247,0.7)', y + 61, 'left'); txt(val, 42, 700, cor, y + 62, 'right'); });
  if (g) { const y = 540 + linhas.length * 118 + 40; txt(`${objNomeDe(g)} · ${pct(g.progresso)} do caminho`, 36, 600, '#ffffff', y, 'left'); x.fillStyle = 'rgba(255,255,255,0.14)'; x.beginPath(); x.roundRect(96, y + 30, W - 192, 22, 11); x.fill();
    const gr = x.createLinearGradient(96, 0, W - 96, 0); gr.addColorStop(0, acc2); gr.addColorStop(1, acc); x.fillStyle = gr; x.beginPath(); x.roundRect(96, y + 30, Math.max(22, (W - 192) * Math.min(1, g.progresso)), 22, 11); x.fill(); }
  txt(`Feito com ${CFG.marca || 'AVEN'}`, 30, 500, 'rgba(245,245,247,0.5)', H - 70);
  return new Promise((ok) => cv.toBlob((b) => ok(b), 'image/png'));
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
function basTelaAnoHist(o) {
  const H = histDados(); const anos = (H.anos || []).filter((l) => l.preenchido); const ano = +o.id || S.year; const k = anos.findIndex((l) => l.ano === ano); if (k < 0) return basSumiu();
  const L = anos[k]; const A = k > 0 ? anos[k - 1] : null; const ser = (H.serie || []).filter((p0) => p0.ano === ano);
  // gráfico: patrimônio mês a mês (linha e área) e, embaixo, entradas e gastos de cada mês
  const W = 320; const Hh = 120; const vs = ser.map((p0) => p0.patrimonio); const mn = Math.min(...vs, L.patrimonioInicio); const mx = Math.max(...vs); const fg = (mx - mn) * 0.1 || 1;
  const x = (m) => ((m + 0.5) / 12) * W; const y = (v) => Hh - 8 - ((v - (mn - fg)) / ((mx + fg) - (mn - fg))) * (Hh - 20);
  const lin = ser.map((p0, i) => `${i ? 'L' : 'M'}${x(p0.mes).toFixed(1)} ${y(p0.patrimonio).toFixed(1)}`).join(' '); const fim = ser[ser.length - 1];
  const mxB = Math.max(1, ...ser.map((p0) => Math.max(p0.entradas, p0.gastos)));
  // comparação com o ano anterior: seta e percentual, verde quando é bom (gastos: bom é cair)
  const cmp = (atual, ant, bomSobe, pontos) => { if (!A || ant == null || atual == null) return ''; if (pontos) { const d = (atual - ant) * 100; return Math.abs(d) < 0.5 ? '' : `<em class="${(d > 0) === bomSobe ? 'pos' : 'neg'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(0)} p.p.</em>`; }
    if (!(ant > 0)) return ''; const d = atual / ant - 1; return Math.abs(d) < 0.005 ? '' : `<em class="${(d > 0) === bomSobe ? 'pos' : 'neg'}">${d > 0 ? '▲' : '▼'} ${pct(Math.abs(d))}</em>`; };
  const kpi = (n, v, ex) => `<span class="bas-ah-k"><small>${n}</small><b>${v}</b>${ex || ''}</span>`;
  const apl = L.aplicado != null ? L.aplicado : L.aportes; const aplA = A ? (A.aplicado != null ? A.aplicado : A.aportes) : null;
  // frases de leitura: só as que fazem sentido com os números do ano
  const fr = []; const varP = L.patrimonioFim - (A ? A.patrimonioFim : L.patrimonioInicio); const baseP = A ? A.patrimonioFim : L.patrimonioInicio;
  fr.push(['inv', `Seu patrimônio foi de <b>${brl0(baseP)}</b> para <b>${brl0(L.patrimonioFim)}</b>${baseP > 0 ? `, ${varP >= 0 ? 'alta' : 'queda'} de <b>${pct(Math.abs(varP / baseP))}</b>` : ''}.`]);
  if (L.poupanca != null) fr.push([L.poupanca >= 0.2 ? 'pos' : L.poupanca >= 0.1 ? 'info' : 'neg', `Você guardou <b>${pct(L.poupanca)}</b> do que entrou${A && A.poupanca != null ? `, ${Math.abs(L.poupanca - A.poupanca) < 0.005 ? 'como' : `${Math.abs((L.poupanca - A.poupanca) * 100).toFixed(0)} pontos ${L.poupanca > A.poupanca ? 'a mais' : 'a menos'} que`} em ${A.ano}` : ''}.`]);
  if (L.sobra > 0 && apl > 0) fr.push(['inv', `Dos <b>${brl0(L.sobra)}</b> que sobraram, você investiu <b>${pct(Math.min(1, apl / L.sobra))}</b>.`]);
  if (A && A.gastos > 0 && L.gastos > 0 && !L.parcial) { const d = L.gastos / A.gastos - 1; if (Math.abs(d) >= 0.01) fr.push([d > 0 ? 'neg' : 'pos', `Gastou <b>${pct(Math.abs(d))}</b> ${d > 0 ? 'a mais' : 'a menos'} que em ${A.ano}.`]); }
  if (L.proventos > 0) fr.push(['pos', L.gastos > 0 ? `Os proventos (${brl0(L.proventos)}) pagaram <b>${pct(Math.min(1, L.proventos / L.gastos))}</b> dos seus gastos.` : `Você recebeu <b>${brl0(L.proventos)}</b> em proventos.`]);
  const deltas = ser.map((p0, i) => [p0.mes, p0.patrimonio - (i ? ser[i - 1].patrimonio : L.patrimonioInicio)]); const top = deltas.reduce((b, d0) => (d0[1] > b[1] ? d0 : b), [0, -Infinity]);
  if (deltas.length > 1 && top[1] > 0) fr.push(['info', `Seu melhor mês foi <b>${MES_LONGO[top[0]]}</b>, com <b>+${brl0(top[1])}</b> no patrimônio.`]);
  const D = H.destaques || {}; if (D.melhorPoupanca && D.melhorPoupanca.ano === ano && anos.length > 1) fr.push(['pos', 'Foi o ano em que você mais guardou do que entrou.']);
  return basDet(`Seu ${ano}`, `<div class="bas-ah-anos" role="group" aria-label="Escolher o ano">${anos.map((l) => `<button class="${l.ano === ano ? 'on' : ''}" data-act="bas-ah-ano" data-y="${l.ano}" aria-pressed="${l.ano === ano}">${l.ano}</button>`).join('')}</div>
    <section class="card bas-ah-hero"><small class="bas-k">Patrimônio ${L.parcial ? `até ${MES_LONGO[L.meses - 1]}` : `no fim de ${ano}`}</small><b class="bas-big">${basCent(L.patrimonioFim)}</b>
      ${baseP > 0 ? `<span class="bas-ah-var ${varP >= 0 ? 'pos' : 'neg'}">${varP >= 0 ? '↗ +' : '↘ −'}${brl0(Math.abs(varP))} (${pct(Math.abs(varP / baseP))}) no ano</span>` : ''}
      <svg class="bas-ah-g" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bas-ahg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="h0"/><stop offset="1" class="h1"/></linearGradient></defs>
        ${ser.length > 1 ? `<path class="bas-ah-a" d="${lin} L${x(fim.mes).toFixed(1)} ${Hh} L${x(ser[0].mes).toFixed(1)} ${Hh} Z" fill="url(#bas-ahg)"/><path class="bas-ah-l" d="${lin}"/>` : ''}${fim ? `<circle class="bas-ah-p" cx="${x(fim.mes).toFixed(1)}" cy="${y(fim.patrimonio).toFixed(1)}" r="4.5"/>` : ''}</svg>
      <div class="bas-ah-b" aria-hidden="true">${MES.map((n, m) => { const p0 = ser.find((q) => q.mes === m); return `<span class="${p0 ? '' : 'fut'}"><i class="e" style="--h:${p0 ? ((p0.entradas / mxB) * 100).toFixed(1) : 0}%"></i><i class="g" style="--h:${p0 ? ((p0.gastos / mxB) * 100).toFixed(1) : 0}%"></i><b>${n[0]}</b></span>`; }).join('')}</div>
      <p class="bas-ah-leg"><span><i class="e"></i>Entradas</span><span><i class="g"></i>Gastos</span></p></section>
    ${basSecao(A ? `Números de ${ano} <small class="bas-ah-cmp">contra ${A.ano}</small>` : `Números de ${ano}`, '', `<div class="bas-ah-ks">${kpi('Entradas', brl0(L.entradas), cmp(L.entradas, A && A.entradas, true))}${kpi('Gastos', brl0(L.gastos), cmp(L.gastos, A && A.gastos, false))}${kpi('Sobra', brl0(L.sobra), cmp(L.sobra, A && A.sobra, true))}
      ${kpi('Guardou', L.poupanca != null ? pct(L.poupanca) : '–', cmp(L.poupanca, A && A.poupanca, true, true))}${kpi('Investido', brl0(apl), cmp(apl, aplA, true))}${kpi('Proventos', brl0(L.proventos), cmp(L.proventos, A && A.proventos, true))}</div>`)}
    ${basSecao('O que os números dizem', '', `<ul class="bas-ah-fr">${fr.map(([t, x0]) => `<li class="${t}">${x0}</li>`).join('')}</ul>`)}
    ${L.parcial ? `<p class="bas-disc keep">${ano} em andamento: valores até ${MES_LONGO[L.meses - 1]}. As comparações com ${A ? A.ano : 'o ano anterior'} usam o ano dele inteiro.</p>` : ''}<p class="bas-disc keep">Patrimônio a custo: o que você informou ajustado pelos aportes, sem a variação de mercado.</p>`);
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
    `<small>Seu patrimônio</small><b class="bas-wr-v">${basCent(C.patrimonio[m])}</b><p>${Math.abs(dp) >= 1 ? `${dp > 0 ? 'Cresceu' : 'Caiu'} <em>${brl0(Math.abs(dp))}</em> no mês.` : 'Ficou estável no mês.'}</p><button class="bas-dp-bt" data-act="bas-retro-share" data-m="${m}">Compartilhar o mês</button>`,
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
  const borda = `${info ? `CONQUISTADA EM ${MES[info.fim.mes].slice(0, 3).toUpperCase()} DE ${info.fim.ano}` : `${q} MESES SEGUIDOS`} · ${(CFG.marca || 'AVEN').toUpperCase()} ·`;
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
  txt(`Feito com ${CFG.marca || 'AVEN'}`, 30, 500, 'rgba(245,245,247,0.5)', H - 70);
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
  const texto = `${cap(M[1] || '').toUpperCase()} · ${q} MESES · ${(CFG.marca || 'AVEN').toUpperCase()} ·`;
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
  const anosH = (H.anos || []).filter((l) => l.preenchido).slice(-4); const anosK = anosH.map((l) => l.ano);
  const serieH = (H.serie || []).filter((p0) => anosK.includes(p0.ano)); const usaS = anosH.length > 1 && serieH.length > 1;
  const pts0 = usaS ? serieH.map((p0) => ({ ano: p0.ano, mes: p0.mes, v: p0.patrimonio, e: p0.entradas, g: p0.gastos })) : C.patrimonio.slice(0, ult + 1).map((v, m) => ({ ano: S.year, mes: m, v }));
  const anosV = usaS ? anosK : [S.year]; const nA = anosV.length; const WH = 320; const HH = 150; const SW = WH / nA;
  const vs = pts0.map((p0) => p0.v); const mn = Math.min(...vs); const mx = Math.max(...vs); const folga = (mx - mn) * 0.12 || mx * 0.05 || 1;
  const xH = (p0) => anosV.indexOf(p0.ano) * SW + ((p0.mes + 0.5) / 12) * SW; const yH = (v) => HH - 10 - ((v - (mn - folga)) / ((mx + folga) - (mn - folga))) * (HH - 26);
  const P = pts0.map((p0) => [xH(p0), yH(p0.v)]); const linhaH = P.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
  const tips = pts0.map((p0, i) => { const ant = i ? pts0[i - 1].v : null; const dv = ant != null ? p0.v - ant : null;
    return `<b>${cap(MES_LONGO[p0.mes])} de ${p0.ano}</b><span>${brl0(p0.v)}</span>${dv != null ? `<em class="${dv >= 0 ? 'pos' : 'neg'}">${dv >= 0 ? '+' : '−'}${brl0(Math.abs(dv))} no mês</em>` : ''}`; });
  const fimDe = (a) => { const l = anosH.find((x) => x.ano === a); return l ? l.patrimonioFim : C.patrimonio[ult]; };
  const varDe = (a) => { const l = anosH.find((x) => x.ano === a); return l && l.variacaoPct != null ? l.variacaoPct : null; };
  const ult0 = P[P.length - 1];
  secs.historico = `<section class="card bas-w-hist bas-w-hl2"><div class="bas-w-hist-h">${basNome('Patrimônio ano a ano', anosH.length > 1 && t.crescimento ? `${t.crescimento >= 0 ? '+' : '−'}${brl0(Math.abs(t.crescimento))} desde ${anosH[0].ano}` : `${brl0(C.patrimonio[ult])} agora`)}<button class="lnk strong" ${basIr('historico')}>Detalhes</button></div>
    <div class="bas-hl-g" data-pts='${esc(JSON.stringify(P.map((q) => [+q[0].toFixed(1), +q[1].toFixed(1)])))}' data-w="${WH}" data-h="${HH}" role="img" aria-label="Patrimônio mês a mês. Arraste o dedo para ver cada mês.">
      <svg viewBox="0 0 ${WH} ${HH}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bas-hg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="h0"/><stop offset="1" class="h1"/></linearGradient></defs>
        ${anosV.map((a, k) => `<rect class="bas-hl-sec${a === S.year ? ' on' : ''}" x="${(k * SW + 2).toFixed(1)}" y="0" width="${(SW - 4).toFixed(1)}" height="${HH}" rx="12"/>`).join('')}
        ${anosV.slice(1).map((a, k) => `<line class="bas-hl-div" x1="${((k + 1) * SW).toFixed(1)}" x2="${((k + 1) * SW).toFixed(1)}" y1="6" y2="${HH - 6}"/>`).join('')}
        ${P.length > 1 ? `<path class="bas-hl-a" d="${linhaH} L${ult0[0].toFixed(1)} ${HH} L${P[0][0].toFixed(1)} ${HH} Z" fill="url(#bas-hg2)"/><path class="bas-hl-l" d="${linhaH}" pathLength="1"/>` : ''}</svg>
      ${P.map((q, i) => `<i class="bas-hl-d${i === P.length - 1 ? ' fim' : ''}" style="left:${((q[0] / WH) * 100).toFixed(2)}%;top:${((q[1] / HH) * 100).toFixed(2)}%"></i>`).join('')}
      <span class="bas-hl-guia" aria-hidden="true"></span><span class="bas-hl-tip" aria-live="polite" hidden></span>
      <template class="bas-hl-tips">${tips.map((x) => `<div>${x}</div>`).join('')}</template></div>
    <div class="bas-hl-anos" role="group" aria-label="Escolha um ano" style="--n:${nA}">${anosV.map((a) => { const vp = varDe(a); return `<button class="${a === S.year ? 'on' : ''}" ${basIr('ano-hist', { id: a })} aria-label="Análise de ${a}"><b>${a}</b><span>${brl0(fimDe(a))}</span>${vp != null ? `<em class="${vp >= 0 ? 'pos' : 'neg'}">${vp >= 0 ? '+' : '−'}${pct(Math.abs(vp))}</em>` : '<em>&nbsp;</em>'}</button>`; }).join('')}</div><p class="bas-hl-dica">Toque num ano para ver a análise completa.</p></section>`;
  // Seu ano: a sobra de cada mês numa fileira de 12 cápsulas de luz (verde quando sobra, vermelho quando falta; os meses que vêm, apagados)
  const sobA = C.investAlocado; const mxA = Math.max(1, ...sobA.slice(0, ult + 1).map((v) => Math.abs(v)));
  secs.seuano = `<button class="card bas-w-ano" ${basIr('ano-resumo')}><span class="bas-w-ano-luz" aria-hidden="true"></span><span class="bas-w-ano-h"><small>Seu ${S.year}</small><b>${basCent(C.T.investAlocado)}</b><span>sobraram no ano${C.T.poupanca != null ? `, <em>${pct(C.T.poupanca)}</em> do que entrou` : ''}</span></span>
    <span class="bas-w-ano-g" aria-hidden="true">${sobA.map((v, i) => `<span class="${i > ult ? 'fut' : v < 0 ? 'neg' : 'pos'}${i === ult ? ' on' : ''}" style="--h:${i > ult ? 8 : Math.max(10, (Math.abs(v) / mxA) * 100).toFixed(1)}%;--i:${i}"><i></i><b>${MES[i][0]}</b></span>`).join('')}</span></button>`;
  // Resumo do mês: um story em miniatura, inclinado e brilhando, pronto para compartilhar
  const mR = S.mes; const Dr = E.disponivelAporte({ C, mes: mR, metaMes: C.metaAporteMes }); const topR = Math.max(1, C.receita[mR], C.despesas[mR], Dr.aportado);
  secs.resumo = `<div class="card bas-w-res"><div class="bas-w-res-t"><small>Resumo de ${MES_LONGO[mR]}</small><b>Seu mês num story</b><span>Uma imagem com o que entrou, saiu e foi investido.</span>
      <span class="bas-w-res-bts"><button class="bas-sn-bt prim" data-act="bas-partilhar">${I_PARTILHA}Compartilhar</button><button class="bas-sn-bt" ${basIr('resumo')}>Ver</button>${S.year === NOW_Y && NOW_M > 0 ? `<button class="bas-sn-bt" ${basIr('retro', { id: NOW_M - 1 })}>Retrospectiva</button>` : ''}</span></div>
    <button class="bas-w-res-s" ${basIr('resumo')} aria-label="Ver o resumo de ${MES_LONGO[mR]}"><span class="bas-w-res-m" aria-hidden="true">${LOGO}</span><small>${cap(MES_LONGO[mR])}</small><b>${brl0(C.investAlocado[mR])}</b><em>sobraram</em>
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
      <div class="bas-cal">${BAS_SEM.map((s) => `<span class="bas-cal-s">${s[0]}</span>`).join('')}${'<span></span>'.repeat(ini)}${dia.map((v, d) => `<button class="bas-cal-d${R.diaAtual === d + 1 ? ' hoje' : ''}${R.diaAtual && d + 1 > R.diaAtual ? ' fut' : ''}" style="--a:${v > 0 ? (0.18 + 0.82 * Math.sqrt(v / mxD)).toFixed(2) : 0}" data-act="bas-dia" data-r="${d + 1} de ${MES_LONGO[m]}: ${esc(v > 0 ? brl(v) : 'sem gastos')}">${d + 1}</button>`).join('')}</div>`, 'bas-w-cal'); }
  // em que dia da semana mais gasta (no período)
  const Gp = j.n === 1 ? G : basAnalise(-1); const sem = Gp.semana || []; const mxS = Math.max(1, ...sem); const top = sem.indexOf(Math.max(...sem));
  if (sem.some((v) => v > 0)) secs.semana = basCard(`<div class="bas-ch"><h2 class="bas-h2">Dia que mais gasta</h2><small>${BAS_SEM[top]}</small></div><div class="bas-w-sem">${sem.map((v, i) => `<span class="${i === top ? 'on' : ''}" style="--h:${Math.max(4, (v / mxS) * 100).toFixed(1)}%"><i></i><b>${BAS_SEM[i][0]}</b></span>`).join('')}</div>`);
  // o maior gasto do período
  const maior = basLancJan().filter((l) => l.valor > 0).sort((a, b) => b.valor - a.valor)[0];
  if (maior) secs.maior = `<button class="card bas-w-maior" ${basIr('gasto', { id: maior.id })}><small class="bas-k">Maior gasto ${esc(basJanFrase())}</small><b class="bas-big md">${basCent(maior.valor)}</b><span class="bas-p bas-p0">${esc(maior.desc || maior.area)} · ${esc(maior.area)}</span></button>`;
}
const r2Bas = (v) => Math.round((+v || 0) * 100) / 100;
// Meus sonhos: escolher o principal tocando no carrossel; o palco mostra o principal; os detalhes ficam num toque
function basTelaSonhos() {
  const A = objAnalise(); const g = objFoco(A); const tipo = g ? obj3dDe(g) : 'diamante';
  const carrossel = A.itens.length ? `<div class="bas-sn-c" role="radiogroup" aria-label="Escolher o sonho principal">${A.itens.map((x, i) => `<button class="bas-sn${g && x.id === g.id ? ' on' : ''}" data-act="bas-foco" data-id="${esc(x.id)}" role="radio" aria-checked="${!!(g && x.id === g.id)}">${basAnel(x.progresso, 54, objIcone(x, i))}<b>${esc(objNomeDe(x))}</b><small>${pct(x.progresso)}</small></button>`).join('')}<button class="bas-sn novo" ${basIr('objetivo')}><span class="bas-sn-mais" aria-hidden="true">${I.plus}</span><b>Novo</b><small>sonho</small></button></div>` : '';
  const palco = `<div class="bas-palco bas-palco-sn">
    <div class="bas-o3" id="bas-o3" data-tipo="${esc(tipo)}">${basAnel(g ? g.progresso : 0, 236, '', 'bas-anel-palco')}${obj3dHtml(tipo)}<span class="bas-o3-ic" aria-hidden="true">${g ? objIcone(g, 0) : ''}</span></div>
    ${g ? `<span class="bas-palco-pct">${pct(g.progresso)}</span><b class="bas-palco-n">${esc(objNomeDe(g))}</b><span class="bas-palco-s">${brl0(g.saldo)} de ${brl0(g.valor)}${g.ano ? ' · até ' + g.ano : ''}</span>
      <span class="bas-sn-st ${BAS_SN_COR[g.status] || ''}">${esc(cap(BAS_OBJ_ST[g.status] || ''))}</span>
      <span class="bas-sn-bts"><button class="bas-sn-bt" ${basIr('sonho-det', { id: g.id })}>Detalhes</button>${basPago() ? `<button class="bas-sn-bt prim" ${basIr('simular', { id: g.id })}>E se eu investir mais?</button>` : ''}</span>`
      : `<b class="bas-palco-n">Qual é o seu sonho?</b><span class="bas-palco-s">Dê um nome a ele e veja quanto falta, mês a mês.</span><span class="bas-sn-bts"><button class="bas-sn-bt prim" ${basIr('objetivo')}>Criar o meu sonho</button></span>`}</div>`;
  return basDet('Meus sonhos', `${carrossel ? `<p class="bas-sn-dica">Toque num sonho para torná-lo o principal.</p>${carrossel}` : ''}${palco}<p class="bas-disc keep">Projeção ilustrativa, sem promessa de rentabilidade.</p>`);
}
const BAS_SN_COR = { concluido: 'ok', 'no-prazo': 'ok', atrasado: 'atencao', fora: 'baixo', 'sem-prazo': '', 'sem-divisao': 'atencao', 'sem-valor': '' };
function basTelaSonhoDet(o) {
  const A = objAnalise(); const g = A.itens.find((x) => x.id === o.id); if (!g) return basSumiu(); const principal = g.id === S.profile.objetivoFoco;
  const st = (n, v) => `<span><small>${n}</small><b>${v}</b></span>`;
  return basDet(esc(objNomeDe(g)), `${basCard(`<div class="bas-sd-top">${basAnel(g.progresso, 96, `<b>${pct(g.progresso)}</b>`, BAS_SN_COR[g.status] || '')}<span class="bas-n"><small class="bas-k">${esc(cap(BAS_OBJ_ST[g.status] || ''))}</small><b class="bas-big md">${basCent(g.saldo)}</b><small>de ${brl(g.valor)}</small></span></div>`, 'bas-hero')}
    <div class="bas-sd-st card">${st('Falta', brl0(g.falta))}${st('Prazo', g.ano || '–')}${st('Previsto para', g.previsto ? `${MES[g.previsto.mes]}/${g.previsto.ano}` : '–')}${st('Vai por mês', brl0(g.aporte))}${g.necessario != null ? st('Precisa por mês', brl0(g.necessario)) : ''}${st('Do patrimônio', g.modo === 'marco' ? 'todo' : `${g.pct}%`)}</div>
    ${basCard(`<p class="bas-p bas-p0">${esc(objFrase(g))}</p>`)}
    <div class="bas-salvar bas-sd-acoes">${principal ? '' : `<button class="btn primary lg bas-cta" data-act="bas-foco" data-id="${esc(g.id)}" data-volta="1">Tornar o principal</button>`}${basPago() ? `<button class="btn lg bas-cta" ${basIr('simular', { id: g.id })}>E se eu investir mais?</button>` : ''}<button class="btn lg bas-cta" ${basIr('objetivo', { id: g.id })}>Editar sonho</button></div>`);
}
// cada cartão: os gastos daquele banco no período, por categoria, e a lista
function basTelaCartaoEstilo(o) {
  const i = instDe(o.id); if (!i) return basSumiu(); const E0 = basCcEstilo(o.id);
  const mini = (m, n) => `<button class="bas-ccm${m === E0.m ? ' on' : ''}" data-act="bas-cc-mod" data-id="${esc(o.id)}" data-m="${m}" aria-pressed="${m === E0.m}"><span class="bas-cc-c bas-cc-mini" data-m="${m}" style="--cb:${E0.c};--cf:${i[3]}" aria-hidden="true"><span class="bas-cc-nfc">${CC_NFC}</span></span><small>${n}</small></button>`;
  const cores = [[i[2], `Cor do ${i[1]}`]].concat(CORES_DESTAQUE);
  return basDet('Personalizar cartão', `<div class="bas-cc-c bas-cc-big bas-cc-prev" ${E0.attr}><span class="bas-cc-t"><span class="bas-cc-nfc" aria-hidden="true">${CC_NFC}</span>${instIcone(o.id)}</span><span class="bas-cc-n">${esc(i[1])}</span><span class="bas-cc-v"><small>${esc(cap(basJanFrase()))}</small><b>${esc(S.profile.nome || '')}</b></span></div>
    ${basSecao('Modelo', '', `<div class="bas-ccms">${CC_MODELOS.map(([m, n]) => mini(m, n)).join('')}</div>`)}
    ${basSecao('Cor', '', `<div class="card bas-aparencia"><div class="bas-cores" role="group" aria-label="Cor do cartão">${cores.map(([c, n]) => `<button style="--c:${c}" data-act="bas-cc-cor" data-id="${esc(o.id)}" data-v="${c}" aria-label="${esc(n)}" aria-pressed="${c.toLowerCase() === E0.c.toLowerCase()}"></button>`).join('')}</div><p class="bas-p bas-p0">A cor vale nos modelos Do banco, Vidro e Grafite aurora.</p></div>`)}`);
}
// escolha do modelo ou da cor: grava no perfil e troca só a prévia e as miniaturas, sem redesenhar
function basCcGrava(k, campo, v) {
  const est = Object.assign({}, S.profile.cartaoEstilo || {}); est[k] = Object.assign({}, est[k], { [campo]: v }); S.profile.cartaoEstilo = est; touch('profile');
  const E0 = basCcEstilo(k); const pv = document.querySelector('.bas-cc-prev'); if (pv) { pv.dataset.m = E0.m; pv.style.setProperty('--cb', E0.c); }
  document.querySelectorAll('.bas-ccm').forEach((b) => { const on = b.dataset.m === E0.m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); const mm = b.querySelector('.bas-cc-mini'); if (mm) mm.style.setProperty('--cb', E0.c); });
  document.querySelectorAll('[data-act="bas-cc-cor"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v.toLowerCase() === E0.c.toLowerCase()));
  basSom('toque');
}
function basTelaCartao(o) {
  const i = instDe(o.id); if (!i) return basSumiu(); const j = basJan(); const ents = []; for (let m = j.de; m <= j.ate; m++) entradasMes(m).forEach((e) => { if ((e.inst || '') === o.id && +e.valor > 0) { e.m = m; ents.push(e); } });
  const tot = ents.reduce((s, e) => s + +e.valor, 0); const sai = basSomaJ(S.C.despesas); const areas = {}; ents.forEach((e) => { areas[e.area] = (areas[e.area] || 0) + +e.valor; });
  const la = Object.keys(areas).map((k) => [k, areas[k]]).sort((a, b) => b[1] - a[1]); const mx = la.length ? la[0][1] : 1;
  const linhas = ents.slice().sort((a, b) => b.m - a.m || b.dia - a.dia).map((e) => basRow(e.tipo === 'real' ? basIr('gasto', { id: e.id }) : basIr('conta', { id: e.id }), esc(basIniciais(e.nome || e.area)), esc(e.nome || e.area), `${esc(e.area)} · ${e.dia ? `${pad2(e.dia)}/${pad2(e.m + 1)}` : `${MES[e.m]}, ${e.parcela ? 'parcela ' + e.parcela : 'conta do mês'}`}`, `<b>−${basCent(e.valor)}</b>`));
  return basDet(esc(i[1]), `<div class="bas-pg-per">${basPerPill()}</div><div class="bas-cc-c bas-cc-big" ${basCcEstilo(o.id).attr}><span class="bas-cc-t"><span class="bas-cc-nfc" aria-hidden="true">${CC_NFC}</span>${instIcone(o.id)}</span><span class="bas-cc-n">${esc(i[1])}</span><span class="bas-cc-v"><small>${esc(cap(basJanFrase()))}</small><b>${basCent(tot)}</b></span><span class="bas-cc-p">${pct(tot / (sai || 1))} dos gastos</span></div>
    ${la.length ? basSecao('Por categoria', '', `<div class="card bas-raio-a">${la.map(([n, v], k) => `<button ${basIr('categoria', { area: n })}><span>${esc(n)}</span><span class="bas-raio-b"><i style="width:${((v / mx) * 100).toFixed(1)}%;--bc:${PAL[k % 6]}"></i></span><b>${brl0(v)}</b></button>`).join('')}</div>`) : ''}
    ${linhas.length ? basSecao(`Gastos no ${esc(i[1])}`, `<small class="bas-raio-t">${linhas.length} ${linhas.length === 1 ? 'item' : 'itens'}</small>`, `<ul class="bas-ativ">${linhas.join('')}</ul>`) : basCard(basVazio('Nenhum gasto neste cartão no período.'))}`, `<button class="bell bas-gear" ${basIr('cartao-estilo', { id: o.id })} aria-label="Personalizar o cartão" title="Personalizar o cartão">${I_ENGRENAGEM}</button>`);
}

/* ---- rodada 6: investimento como no SaaS, meta e disponível premium, proventos interativos, alvos claros,
   para onde foi e limites por área em Gastos, e a análise da saúde financeira com o rostinho ---- */
const I_IMP = ic('<path d="M12 3.5v11m0 0-4-4m4 4 4-4"/><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/>');
// investimento (o mesmo do Novo aporte do SaaS): aportar ou resgatar, ativo que já tenho ou novo, tipo, classe, mês e valor; e importar
function basTelaInvest(o) {
  const p = S.plan; const tem = p.ativos.length > 0; const grupos = {}; p.ativos.forEach((a) => { (grupos[a.classe || 'Outros'] = grupos[a.classe || 'Outros'] || []).push(a); });
  const tipos = [['RENDA FIXA', 'Renda fixa'], ['BOLSA DE VALORES', 'Bolsa de valores']];
  const classes = [...new Set(p.ativos.map((a) => a.classe).filter(Boolean))].slice(0, 10);
  return basForm('aporte', 'Investimento', `<button type="button" class="bas-imp" data-act="bas-importar">${I_IMP}<span class="bas-n"><b>Importar da B3 ou do extrato</b><small>Traz aportes, resgates e proventos de um arquivo</small></span>${I.chev}</button>
    ${basChips('op', [['1', 'Aportar'], ['-1', 'Resgatar']], o.op === '-1' ? '-1' : '1', 'O que você quer fazer')}
    ${tem ? basChips('modo', [['ex', 'Ativo que já tenho'], ['novo', 'Ativo novo']], 'ex', 'Onde') : '<input type="hidden" name="modo" value="novo">'}
    ${tem ? `<div class="bas-blk" data-blk="ex"><fieldset class="bas-fs"><legend>Ativo</legend><div class="bas-ativos">${Object.keys(grupos).map((c) => `<p class="bas-ativos-c">${esc(c)}</p>${grupos[c].map((a, i) => `<label class="bas-ativo"><input type="radio" name="ativo" value="${esc(a.id)}" ${a === p.ativos[0] ? 'checked' : ''}><span class="bas-ini" aria-hidden="true">${esc(basIniciais(a.nome))}</span>${basNome(esc(a.nome), `${brl0(sum12(a.ap))} aplicados em ${S.year}`)}<i class="bas-ativo-ok" aria-hidden="true">${I.check}</i></label>`).join('')}`).join('')}</div></fieldset></div>` : ''}
    <div class="bas-blk" data-blk="novo">${basCampo('nome', 'Nome do ativo (código, banco ou título)', '', 'placeholder="Ex.: PETR4, CDB Banco X"')}${basChips('tipo', tipos, 'BOLSA DE VALORES', 'Tipo')}
      ${basCampo('classe', 'Classe', '', 'list="bas-dl-classe" placeholder="Ex.: Ações, CDB, Fundos imobiliários"')}<datalist id="bas-dl-classe">${classes.concat(["CDB's", 'Tesouro Direto', 'Ações BR', 'Fundos Imobiliários', "ETF's", 'Criptoativos']).map((c) => `<option value="${esc(c)}"></option>`).join('')}</datalist></div>
    <fieldset class="bas-fs"><legend>Mês</legend><div class="bas-meses-f">${MES.map((m, i) => `<label class="bas-chip"><input type="radio" name="mes" value="${i}" ${i === S.mes ? 'checked' : ''}><span>${m}</span></label>`).join('')}</div></fieldset>
    ${basValor('valor', 0, 'Valor')}<p class="bas-p">O valor é somado ao que o ativo já tem no mês, em ${S.year}.</p>`, { ok: 'Registrar' });
}
const sum12 = (a) => (a || []).reduce((s, v) => s + (+v || 0), 0);
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
// proventos: o ano (fichas), importar e o gráfico mês a mês em que tocar num mês mostra quem pagou
function basTelaProventos() {
  const C = S.C; const anos = Object.keys(S.plans).map(Number).sort(); const sel = S.basProvMes != null ? S.basProvMes : S.mes;
  const vals = C.faturamento; const mx = Math.max(1, ...vals); const ult = S.year === NOW_Y ? NOW_M : 11; const meses = vals.filter((v, i) => i <= ult && v > 0).length;
  const L = S.plan.ativos.filter((a) => Math.abs(+a.pr[sel] || 0) > 0.005).sort((x, y) => y.pr[sel] - x.pr[sel]);
  const barras = `<div class="bas-pv-g" role="group" aria-label="Proventos mês a mês. Toque num mês.">${vals.map((v, i) => `<button class="${i === sel ? 'on' : ''}${i > ult ? ' fut' : ''}" data-act="bas-prov-mes" data-m="${i}" style="--h:${v > 0 ? Math.max(5, (v / mx) * 100).toFixed(1) : 2}%;--i:${i}" aria-label="${MES_LONGO[i]}: ${esc(brl(v))}" aria-pressed="${i === sel}">${i === sel && v > 0 ? `<small>${brl0(v)}</small>` : ''}<i></i><b>${MES[i][0]}</b></button>`).join('')}</div>`;
  return basDet('Proventos', `<div class="bas-pv-anos">${anos.map((y) => `<button class="${y === S.year ? 'on' : ''}" data-act="bas-prov-ano" data-y="${y}" aria-pressed="${y === S.year}">${y}</button>`).join('')}</div>
    <section class="bas-ev bas-pv-card"><small class="bas-ev-k">Recebido em ${S.year}</small><b class="bas-ev-v">${basCent(C.T.faturamento)}</b><p class="bas-noite-s">${meses ? `Média de ${brl0(C.T.faturamento / Math.max(1, meses))} nos ${meses} ${meses === 1 ? 'mês que pagou' : 'meses que pagaram'}` : 'Ainda sem proventos neste ano'}</p>${barras}
      <div class="bas-noite-par"><span><small>${cap(MES_LONGO[sel])}</small><b>${basCent(vals[sel])}</b></span><span><small>Pagadores</small><b>${L.length}</b></span></div></section>
    <div class="bas-dupla bas-pv-acoes">${S.plan.ativos.length ? `<button class="btn primary bas-cta" ${basIr('provento')}>${I.plus}Registrar</button>` : ''}<button class="btn bas-cta" data-act="bas-importar">${I_IMP}Importar</button></div>
    ${L.length ? basSecao(`Quem pagou em ${MES_LONGO[sel]}`, '', `<ul class="bas-ativ">${L.map((a, i) => basRow(basIr('provento', { id: a.id }), esc(basIniciais(a.nome)), esc(a.nome), esc(a.classe || ''), `<b class="pos">${basCent(a.pr[sel])}</b>`, PAL[i % 6])).join('')}</ul>`) : basCard(basVazio(`Nenhum provento em ${MES_LONGO[sel]}.`))}`);
}
// alvos da carteira, refeitos: por classe, com o valor e o % de hoje, um campo claro por ativo, o total ao vivo e atalhos
function basTelaAlvos() {
  const A = S.plan.ativos; if (!A.length) return basDet('Alvos da carteira', basCard(basVazio('Registre um investimento primeiro.')));
  const { M } = cartAnalise(); const pos = {}; M.items.forEach((i) => { pos[i.a.id] = i; }); const total = M.items.reduce((s, i) => s + i.valor, 0);
  const grupos = {}; A.forEach((a) => { (grupos[a.classe || 'Outros'] = grupos[a.classe || 'Outros'] || []).push(a); });
  const cls = Object.keys(grupos);
  return basForm('alvos', 'Alvos da carteira', `<div class="bas-al-top card"><div class="bas-al-tot"><small>Total dos alvos</small><b data-al-tot>0%</b><span class="bas-al-st" data-al-st></span></div><span class="bas-al-bar" aria-hidden="true"><i data-al-bar></i></span>
      <div class="bas-al-at"><button type="button" class="bas-sn-bt" data-act="bas-al-igual">Dividir igual</button><button type="button" class="bas-sn-bt" data-act="bas-al-100">Ajustar para 100%</button><button type="button" class="bas-sn-bt" data-act="bas-al-zero">Zerar</button></div></div>
    <p class="bas-p">Diga quanto de cada investimento você quer ter. Combine com o ${esc(primeiroNome())}. O app usa isso para mostrar onde colocar cada aporte.</p>
    ${cls.map((c, k) => `<section class="bas-al-g"><header><i style="--bc:${PAL[k % 6]}"></i><b>${esc(c)}</b><small data-al-cls="${k}">0%</small></header>
      ${grupos[c].map((a) => { const e = cartEntry(E.ativoKey(a), false); const it = pos[a.id] || { valor: 0 }; const atual = total > 0 ? it.valor / total : 0;
        return `<div class="bas-al-l"><span class="bas-n"><b>${esc(a.nome)}</b><small>${brl0(it.valor)} · hoje ${pct(atual)}</small></span><span class="bas-al-in"><button type="button" data-act="bas-al-passo" data-d="-5" aria-label="Menos 5%">−</button><input name="a:${esc(a.id)}" data-al="${k}" inputmode="decimal" value="${e && e.alvo ? esc(String(e.alvo).replace('.', ',')) : ''}" placeholder="0" aria-label="Alvo de ${esc(a.nome)} em %"><i>%</i><button type="button" data-act="bas-al-passo" data-d="5" aria-label="Mais 5%">+</button></span></div>`; }).join('')}</section>`).join('')}`);
}
function basAlSoma() {
  const f = document.querySelector('.bas-form[data-t="alvos"]'); if (!f) return; const ins = [...f.querySelectorAll('input[data-al]')]; const v = (x) => { const n = parseFloat(String(x.value).replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  const tot = ins.reduce((s, x) => s + v(x), 0); const porC = {}; ins.forEach((x) => { porC[x.dataset.al] = (porC[x.dataset.al] || 0) + v(x); });
  f.querySelector('[data-al-tot]').textContent = `${tot.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`; const b = f.querySelector('[data-al-bar]'); b.style.width = Math.min(100, tot) + '%';
  const ok = Math.abs(tot - 100) < 0.05; const st = f.querySelector('[data-al-st]'); st.textContent = ok ? 'Fechou 100%' : tot > 100 ? `${(tot - 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% a mais` : tot > 0 ? `Faltam ${(100 - tot).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : 'Comece pelo mais importante';
  f.querySelector('.bas-al-top').className = `bas-al-top card ${ok ? 'ok' : tot > 100 ? 'neg' : ''}`;
  Object.keys(porC).forEach((k) => { const el = f.querySelector(`[data-al-cls="${k}"]`); if (el) el.textContent = `${porC[k].toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`; });
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
function basOndeHtml() {
  const j = basJan(); const G = basAnalise(j.n === 1 ? j.de : -1, j.de, j.ate); const cats = (G.porCat || []).filter((c) => c.total > 0); const areas = (G.porArea || []).slice(0, 6); const mx = areas.length ? areas[0].total : 1;
  if (!areas.length) return '';
  return basSecao('Para onde foi o dinheiro', '', `<div class="card bas-onde">${cats.length ? `<span class="bas-onde-b" aria-hidden="true">${cats.map((c, i) => `<i style="flex:${c.total.toFixed(2)};--bc:${PAL[i % 6]}"></i>`).join('')}</span><div class="bas-onde-l">${cats.map((c, i) => `<span><i style="--bc:${PAL[i % 6]}"></i>${esc(c.nome)} <b>${pct(c.pct)}</b></span>`).join('')}</div>` : ''}
    ${areas.map((a, i) => { const d = a.media > 0 ? a.total / a.media - 1 : null; return `<button class="bas-onde-a" ${basIr('categoria', { area: a.nome })}><span class="bas-ini" aria-hidden="true" style="--bc:${PAL[i % 6]}">${esc(basIniciais(a.nome))}</span><span class="bas-n"><b>${esc(a.nome)}</b><small>${esc(a.catNome || '')} · ${a.qtd} ${a.qtd === 1 ? 'lançamento' : 'lançamentos'}</small><span class="bas-onde-t"><i style="width:${((a.total / mx) * 100).toFixed(1)}%;--bc:${PAL[i % 6]}"></i></span></span><span class="bas-v"><b>${brl0(a.total)}</b>${d != null && Math.abs(d) >= 0.05 ? `<em class="${d > 0 ? 'neg' : 'pos'}">${d > 0 ? '↑' : '↓'} ${pct(Math.abs(d))} da média</em>` : `<em>${pct(a.pct)}</em>`}</span></button>`; }).join('')}</div>`);
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
  const ir = { reserva: 'data-act="bas-aba" data-v="investir"', poupanca: basPago() ? basIr('ano-resumo') : 'data-act="bas-aba" data-v="gastos"', fixos: 'data-act="bas-aba" data-v="gastos"', sonho: basIr('sonhos') };
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
    <small class="bas-pj-n">Estilo dos ícones</small><div class="seg bas-temas bas-pj-est" role="group" aria-label="Estilo dos ícones">${INST_ESTILOS.map(([v, l]) => `<button class="${e === v ? 'on' : ''}" data-act="inst-estilo" data-v="${v}" aria-pressed="${e === v}">${l}</button>`).join('')}</div></div>`;
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
const BAS_TELAS = { gasto: basTelaGasto, conta: basTelaConta, 'conta-f': basTelaContaF, entrada: basTelaEntrada, aporte: basTelaAporte, meta: basTelaMeta,
  objetivos: basTelaObjetivos, objetivo: basTelaObjetivo, categoria: basTelaCategoria, perfil: basTelaPerfil, contato: basTelaContato, ano: basTelaAno, ia: basTelaIa, saude: basTelaSaude, periodo: basTelaPeriodo, organizar: basTelaOrganizar, entradas: basTelaEntradas, sonhos: basTelaSonhos, 'sonho-det': basTelaSonhoDet, cartao: basTelaCartao, retro: basTelaRetro, conquista: basTelaConquista, sequencia: basTelaSequencia, constelacao: basTelaConstelacao, 'ano-hist': basTelaAnoHist, 'cartao-estilo': basTelaCartaoEstilo, 'ano-resumo': basTelaAnoResumo, historico: basTelaHistorico, raiox: basTelaRaioX, resumo: basTelaResumo, limite: basTelaLimite, avisos: basTelaAvisos, simular: basTelaSimular, alvos: basTelaAlvos, proventos: basTelaProventos, provento: basTelaProvento, carteira: basTelaCarteira, planejamento: basTelaPlanejamento, privacidade: () => basDet('Privacidade e termos', `<div class="card bas-pol">${politicaHtml(CFG, Store.mode === 'cloud')}</div>`), excluir: basTelaExcluir, ponto: basTelaPonto, clientes: basTelaClientes };

/* ================= gravação (no mesmo formato do Completo) ================= */
function basErro(f, msg) { const e = f.querySelector('.bas-err'); e.textContent = msg; e.hidden = false; return false; }
function basSalvar(f) {
  const t = basTopoPilha(); if (!t || t.t !== f.dataset.t) return;
  const d = Object.fromEntries(new FormData(f)); const p = S.plan; const m = S.mes; const val = (k) => parseReais(d[k] || '');
  const ok = (msg) => { basRetorno(t.t === 'aporte' || t.t === 'provento' ? 'pago' : 'ok'); touch(['perfil', 'objetivo', 'alvos'].includes(t.t) ? 'profile' : 'plan'); basFechar(); if (msg) toast(msg); };
  switch (t.t) {
    case 'gasto': if (!t.id && (d.tipo === 'mes' || d.tipo === 'parc')) { d.nome = (d.desc || '').trim(); d.modo = d.tipo; d.area = (d.areaNova || '').trim() || d.area; } else {
      const l = t.id ? p.lancamentos.find((x) => x.id === t.id) : null; const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe quanto foi, como 25,90.');
      const dt = E.parseDataISO(d.data); if (!dt || dt.ano !== S.year) return basErro(f, `Escolha uma data de ${S.year}.`);
      const area = (d.areaNova || '').trim() || d.area || 'Outros'; const desc = (d.desc || '').trim() || area;
      if (l) { if (l.itemId && basMesDe(l.data) !== dt.mes) { desfazerBaixa(l); delete l.itemId; } Object.assign(l, { data: d.data, desc, area, inst: d.inst || '', valor: E.r2(l.valor < 0 ? -v : v) }); S.mes = dt.mes; ok('Gasto atualizado.'); return; }
      const nl = { id: uid(), origem: 'manual', data: d.data, desc, valor: E.r2(v), cat: basCat(false), area, sub: '', inst: d.inst || '' }; p.lancamentos.push(nl); let msg = 'Gasto anotado.';
      // o mesmo cuidado do Completo: cumpre a conta fixa do mês (não conta duas vezes) ou vira conta até dezembro
      const fx = E.acharFixo(p.despesas, desc, dt.ano, dt.mes); if (fx) { nl.itemId = fx.id; nl.cat = fx.cat; fx.baixas = Object.assign({}, fx.baixas, { [dt.ano + '-' + dt.mes]: nl.id }); msg = `Conta “${fx.nome}” marcada como paga.`; }
      S.mes = dt.mes; ok(msg); return;
    } // todo mês e parcelado seguem para a gravação da conta, logo abaixo
    case 'conta': {
      const it = p.despesas.find((x) => x.id === t.id); if (!it) { basFechar(); return; }
      const nome = (d.desc || '').trim(); const area = (d.areaNova || '').trim() || d.area || it.area || 'Contas'; if (!nome) return basErro(f, 'Diga com o quê, como Aluguel.');
      if (d.tipo === 'uma') { // vira um gasto só: sai a conta, os pagamentos já anotados continuam como gastos comuns
        const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe quanto foi, como 25,90.'); const dt = E.parseDataISO(d.data); if (!dt || dt.ano !== S.year) return basErro(f, `Escolha uma data de ${S.year}.`);
        p.lancamentos.forEach((l) => { if (l.itemId === it.id) delete l.itemId; }); p.despesas = p.despesas.filter((x) => x !== it);
        p.lancamentos.push({ id: uid(), origem: 'manual', data: d.data, desc: nome, valor: E.r2(v), cat: basCat(false), area, sub: '', inst: d.inst || '' }); S.mes = dt.mes; ok('Gasto atualizado.'); return; }
      Object.assign(it, { nome, area, inst: d.inst || '' });
      if (d.tipo === 'parc') { const total = val('total'); const n = parseInt(d.n, 10); if (!(total > 0)) return basErro(f, 'Informe o valor total da compra.'); if (!(n >= 1 && n <= 120)) return basErro(f, 'Informe de 1 a 120 parcelas.');
        it.parcel = Object.assign({ ano: S.year, mes: m }, it.parcel, { total: E.r2(total), n }); it.valores = z12(); ok('Gasto atualizado.'); return; }
      const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe o valor por mês.');
      if (it.parcel) { delete it.parcel; it.valores = z12(); } fillFrom(it.valores, E.r2(v), m); ok('Gasto atualizado.'); return;
    }
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
      const alvo = r || { id: uid(), cat: p.rendaCats[0].id, fonte: '', valores: z12() }; alvo.nome = nome; if (d.cat && p.rendaCats.some((c) => c.id === d.cat)) alvo.cat = d.cat; if (d.todo) fillFrom(alvo.valores, E.r2(v), m); else alvo.valores[m] = E.r2(v); if (!r) p.rendas.push(alvo);
      ok(r ? 'Entrada atualizada.' : 'Entrada anotada.'); return;
    }
    case 'aporte': {
      if (!temRecurso('aporte_simples')) return false;
      const v = val('valor'); if (!(v > 0)) return basErro(f, 'Informe o valor, como 500,00.'); const sinal = d.op === '-1' ? -1 : 1;
      let a = t.id ? p.ativos.find((x) => x.id === t.id) : null;
      if (a) { a.ap[m] = E.r2(sinal * v); ok('Registro atualizado.'); return; }
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
      const a = p.ativos.find((x) => x.id === d.ativo); if (!a) return basErro(f, 'Escolha de qual investimento.'); a.pr[m] = E.r2((+a.pr[m] || 0) + v); ok(`Provento de ${a.nome} registrado.`); return;
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
    case 'perfil': { const nome = (d.nome || '').trim(); if (!nome) return basErro(f, 'Informe o seu nome.'); S.profile.nome = nome.slice(0, 80); S.profile.apelido = (d.apelido || '').trim().slice(0, 80); ok('Perfil salvo.'); return; }
    default: return false;
  }
}
// excluir (segundo toque confirma)
function basExcluir(el) {
  if (!el.dataset.ok) { el.dataset.ok = '1'; el.textContent = 'Toque de novo para excluir'; return; }
  const t = basTopoPilha(); const p = S.plan; const m = S.mes;
  if (t.t === 'gasto') { const l = p.lancamentos.find((x) => x.id === t.id); if (l) { desfazerBaixa(l); p.lancamentos = p.lancamentos.filter((x) => x !== l); } }
  else if (t.t === 'conta') { p.lancamentos.forEach((l) => { if (l.itemId === t.id) delete l.itemId; }); p.despesas = p.despesas.filter((x) => x.id !== t.id); }
  else if (t.t === 'entrada') p.rendas = p.rendas.filter((x) => x.id !== t.id);
  else if (t.t === 'aporte') { const a = p.ativos.find((x) => x.id === t.id); if (a) a.ap[m] = 0; }
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
  return `<section class="dr-sec"><h3>Versão do AVEN</h3>${corpo}</section>`;
}
function basObHtml() { return basEscolhe() ? `<div class="bas-ob"><p class="qn">Como você quer usar o AVEN?</p>${basAdmHtml().replace(/<\/?section[^>]*>|<h3>.*?<\/h3>/g, '')}</div>` : ''; }

// ações data-act do modo Básico (chamadas pelo default do onClick em main.js)
function basAcao(act, ds, el) {
  switch (act) {
    case 'bas-aba': if (S.basAba !== ds.v || basPilha().length) basSom('toque'); basTransicao('aba', () => { basLimpar(); S.basAba = ds.v; render(); window.scrollTo(0, 0); }); return true;
    case 'bas-mes': S.mes = Math.max(0, Math.min(11, S.mes + +ds.d)); render(); return true;
    case 'bas-abrir': basAbrir(ds.t, { id: ds.id, area: ds.area, op: ds.op, modo: ds.modo }); return true;
    case 'bas-rolar': { const a = document.getElementById(ds.alvo); if (a) a.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return true; }
    case 'bas-tema-ciclo': { const ord = ['auto', 'light', 'oled']; const v = ord[(ord.indexOf(S.profile.prefs.tema) + 1) % 3]; if (v !== 'auto') S.profile.prefs.tema = v; definirTema(v === 'auto' ? 'auto-on' : v); render(); toast(`Tema: ${{ auto: 'automático', light: 'claro', oled: 'escuro' }[v]}.`); return true; }
    case 'bas-voltar': basFechar(); return true;
    case 'bas-sq-dia': { const w = el.closest('.bas-sq-fila'); if (w) { w.querySelectorAll('.bas-sq-dia').forEach((b) => b.classList.toggle('sel', b === el)); w.querySelector('.bas-sq-fila-r').textContent = el.dataset.r; basSom('toque'); } return true; }
    case 'bas-gx': { const id = el.getAttribute('aria-controls'); const w = document.getElementById(id); if (w) { S.basFech = S.basFech || {}; const f = S.basFech[id] = !S.basFech[id]; w.classList.toggle('fechada', f); el.setAttribute('aria-expanded', String(!f)); el.setAttribute('aria-label', `${f ? 'Expandir' : 'Recolher'} ${ds.nome}`); basSom('toque'); } return true; }
    case 'bas-cs-ir': { const t = basTopoPilha(); if (t && t.t === 'constelacao') { t.id = String((+t.id || 0) + +ds.d); basSom('toque'); render(); } return true; }
    case 'bas-an-mes': { const w = el.closest('.bas-pm'); if (w) { w.querySelectorAll('.bas-pm-g button').forEach((p) => p.classList.toggle('sel', p === el)); w.querySelector('.bas-an-r').textContent = el.dataset.r; basSom('toque'); } return true; }
    case 'bas-sq-astro': { const a = document.querySelector('.bas-sqx-astro'); if (a && !matchMedia('(prefers-reduced-motion: reduce)').matches) { a.classList.remove('festa'); void a.offsetWidth; a.classList.add('festa'); basVibra(12); basSom('ok'); } return true; }
    case 'bas-wr': { const w = el.closest('.bas-wr'); if (w) { basWrIr(w, (+w.dataset.i || 0) + (+ds.d || 1)); basSom('toque'); } return true; }
    case 'bas-retro-share': basPartilhar(+ds.m); return true;
    case 'bas-cq-share': basConquistaPng(+ds.q).then((b) => basEnviaPng(b, `${(CFG.marca || 'aven').toLowerCase()}-conquista-${ds.q}-meses.png`, 'Minha conquista')); return true;
    case 'bas-ah-ano': { const t = basTopoPilha(); if (t && t.t === 'ano-hist') { t.id = String(ds.y); basSom('toque'); render(); } return true; }
    case 'bas-cc-mod': if (instDe(ds.id) && CC_MODELOS.some((x) => x[0] === ds.m)) basCcGrava(ds.id, 'm', ds.m); return true;
    case 'bas-cc-cor': if (instDe(ds.id) && /^#[0-9a-f]{6}$/i.test(ds.v || '')) basCcGrava(ds.id, 'c', ds.v); return true;
    case 'bas-gasto-rec': { const f = el.closest('form'); const x = basMemGastos().get(ds.k); if (f && x) { f.querySelector('[name="desc"]').value = x.desc; basGastoLembra(f, x, true); basSom('toque'); } return true; }
    case 'bas-prov-mes': S.basProvMes = +ds.m; basSom('toque'); render(); return true;
    case 'bas-prov-ano': if (+ds.y !== S.year && S.plans[+ds.y]) { S.basProvMes = null; switchYear(+ds.y); } return true;
    case 'bas-al-passo': case 'bas-al-igual': case 'bas-al-100': case 'bas-al-zero': basAlAcao(act, el); return true;
    case 'bas-cores': S.basCores = !S.basCores; basSom('toque'); render(); return true;
    case 'bas-ia-avisos': S.basIaAba = 'avisos'; basAbrir('ia', {}); return true;
    case 'bas-dia': { const w = el.closest('.bas-w-cal'); if (w) { w.querySelectorAll('.bas-cal-d.sel').forEach((x) => x.classList.remove('sel')); el.classList.add('sel'); w.querySelector('.bas-cal-sel').textContent = el.dataset.r; basSom('toque'); } return true; }
    case 'bas-foco': { if (!objLista().some((x) => x.id === ds.id)) return true; S.profile.objetivoFoco = ds.id; objSalvar(); basRetorno('ok'); if (ds.volta) basFechar(); else render(); toast('Sonho principal trocado.'); return true; }
    case 'bas-per-at': { const n = +ds.n; const ref = S.year === NOW_Y ? NOW_M : 11; S.basPerIni = null;
      if (n <= 1) { S.basPer = null; S.mes = ref; } else if (n >= 12) { S.basPer = { de: 0, ate: 11 }; S.mes = ref; } else { S.basPer = { de: Math.max(0, ref - n + 1), ate: ref }; S.mes = ref; }
      basFechar(); return true; }
    case 'bas-per-mes': { const m = +ds.m; if (S.basPerIni == null) { S.basPerIni = m; basSom('toque'); render(); return true; }
      const de = Math.min(S.basPerIni, m); const ate = Math.max(S.basPerIni, m); S.basPerIni = null; S.basPer = de === ate ? null : { de, ate }; S.mes = ate; basFechar(); return true; }
    case 'bas-ord': case 'bas-ord-vis': case 'bas-ord-pad': basOrdAcao(act, ds); return true;
    case 'bas-arco': basArco(el); return true;
    case 'bas-arco-abrir': { const b = document.querySelector('.bas-roda'); if (b && b.dataset.sel) basAbrir('categoria', { area: b.dataset.sel }); return true; }
    case 'bas-ia-aba': S.basIaAba = ['avisos', 'duvidas'].includes(ds.v) ? ds.v : 'conversa'; basSom('toque'); render(); return true;
    case 'bas-guia': basGuiaIniciar(ds.id); return true;
    case 'bas-virar': S.basVirado = !S.basVirado; el.classList.toggle('virado', S.basVirado); basSom('toque'); return true;
    case 'bas-partilhar': basSom('toque'); basPartilhar(); return true;
    case 'bas-rec-aplicar': basRecAplicar(el); return true;
    case 'bas-sons': S.profile.prefs.sons = !basSomLigado(); touch('profile'); if (basSomLigado()) basSom('ok'); return true;
    case 'bas-importar': if (typeof abrirIngestao === 'function') abrirIngestao(); return true;
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
    case 'bas-sair': if (!el.dataset.ok) { el.dataset.ok = '1'; el.querySelector('b').textContent = 'Toque de novo para sair'; return true; } basLimpar(); sair(); return true;
    case 'bas-tema': if (ds.v !== 'auto') S.profile.prefs.tema = ds.v; definirTema(ds.v === 'auto' ? 'auto-on' : ds.v); render(); return true;
    case 'bas-ui': try { localStorage.setItem('fp:interface', ds.v === 'basico' ? 'basico' : 'completo'); } catch (e) { S.profile.interface = ds.v === 'basico' ? 'basico' : 'completo'; touch('profile'); } basLimpar(); if (S.screen === 'app') { closeAdmin(); S.basAba = 'inicio'; window.scrollTo(0, 0); } render(); toast(`${BAS_NOMES[ds.v === 'basico' ? 'basico' : 'completo']} ligado.`); return true;
    default: return false;
  }
}

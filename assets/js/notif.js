/* Central de notificações: sino com contador, lista flutuante e ações diretas.
   As regras (gatilhos) ficam em E.notificacoes, no engine.js, e são testadas no Node.
   Aqui só montamos o contexto do ano corrente, aplicamos a voz escolhida e guardamos o que foi lido ou dispensado
   (em S.profile.notif, que acompanha a conta em qualquer aparelho). Nada exige configuração do cliente. */
'use strict';

/* ---------- textos ---------- */
const NOTIF_TIT = {
  n_comecar: 'Vamos começar o seu planejamento',
  n_lim_passou: '{area} passou do limite', n_lim_perto: '{area} perto do limite',
  n_orc_estouro: 'Orçamento de {mes} estourado', n_orc_90: 'Orçamento de {mes} quase no limite', n_orc_ritmo: 'Gastos acima do ritmo do mês',
  n_orc_75: '{pct} do orçamento de {mes} usado', n_orc_definir: 'Defina o orçamento de {mes}', n_area_alta: 'Gasto fora do padrão em {area}',
  n_entradas_falta: 'Hora de registrar as entradas', n_entradas_conferir: 'Confira as entradas de {mes}', n_extrato: 'Importe o extrato de {mes}',
  n_fechamento: 'Fechamento de {mes} chegando', n_fechamento_livre: 'Fechamento de {mes} chegando',
  n_resumo_sobra: '{MesAnt} fechou no azul', n_resumo_deficit: '{MesAnt} fechou no vermelho',
  n_aporte: 'Lembrete de aporte', n_aporte_meta: 'Lembrete de aporte', n_aporte_sobra: 'Sobra pronta para investir', n_aporte_falta: 'Falta pouco para a meta de aporte',
  n_meta_batida: 'Meta de aporte batida', n_proventos: 'Proventos de {mes}',
  n_cart_sem_alvo: 'Defina o alvo da sua carteira', n_cart_alvo: 'Alvos da carteira somam {soma}', n_cart_abaixo: 'Oportunidade em {ativo}', n_cart_abaixo_sug: 'Oportunidade em {ativo}', n_cart_acima: '{ativo} acima do alvo',
};
const NOTIF_VOZ = {
  consultivo: {
    n_comecar: 'Importe o extrato do banco ou cadastre suas rendas. A partir daí eu acompanho orçamento, aportes e carteira e aviso você por aqui.',
    n_lim_passou: 'Os gastos com {area} em {mes} passaram do limite de {limite} em {valor}. Vale ver o que dá para segurar até o fim do mês.',
    n_lim_perto: 'Você já usou {pct} do limite de {area} em {mes}. Restam {restante}.',
    n_orc_estouro: 'Os gastos de {mes} passaram do orçamento em {valor} ({pct} usado). Vale olhar onde dá para segurar até o fim do mês.',
    n_orc_90: 'Você já usou {pct} do orçamento de {mes}. Restam {restante}, e {prazo}.',
    n_orc_ritmo: 'No ritmo atual, {mes} fecharia em {projecao}, {excesso} acima do orçamento. Para ficar no limite, o ideal é gastar até {porDia} por dia.',
    n_orc_75: 'Restam {restante} do orçamento de {mes}, e {prazo}.',
    n_orc_definir: 'Já há gastos em {mes}, mas nenhum orçamento definido. Com um limite, eu aviso antes de ele estourar.',
    n_area_alta: '{area} somou {valor} em {mes}, {pct} acima da sua média de {media}. Foi algo pontual?',
    n_entradas_falta: 'Já passamos do dia 5 e não há entradas registradas em {mes}. Registre salário e outras rendas para eu calcular a sua sobra.',
    n_entradas_conferir: 'Há {valor} em entradas registradas em {mes}. Confira se bate com o que caiu na conta.',
    n_extrato: 'Ainda não há lançamentos em {mes}. Importe o extrato e eu separo os gastos por categoria.',
    n_fechamento: '{Prazo} para fechar {mes}. Restam {restante} do orçamento, cerca de {porDia} por dia.',
    n_fechamento_livre: '{Prazo} para fechar {mes}, e os gastos somam {valor}. Com um orçamento, eu acompanho o ritmo por você.',
    n_resumo_sobra: '{MesAnt} fechou com {valor} de sobra ({pct} das entradas). Bom momento para decidir o destino desse valor.',
    n_resumo_deficit: '{MesAnt} fechou com {valor} de gastos acima das entradas. Vale revisar o mês com calma.',
    n_aporte: 'Ainda não há aporte registrado em {mes}. Já investiu? Registre para acompanhar o patrimônio.',
    n_aporte_meta: 'Sua meta é aportar {meta} por mês, e {mes} ainda está sem aporte registrado.',
    n_aporte_sobra: '{MesAnt} deixou {sobra} de sobra e {mes} ainda não tem aporte. Que tal colocar esse dinheiro para trabalhar?',
    n_aporte_falta: 'Você aportou {valor} em {mes}. Faltam {falta} para a meta de {meta}.',
    n_meta_batida: 'Você aportou {valor} em {mes} e bateu a meta de {meta}. É a constância que constrói patrimônio.',
    n_proventos: 'Seus investimentos pagaram {valor} em proventos em {mes}.',
    n_cart_sem_alvo: 'Defina o percentual-alvo de cada ativo e eu indico onde investir a cada aporte.',
    n_cart_alvo: 'Os alvos da carteira somam {soma}. Ajuste para 100% e as sugestões de aporte ficam precisas.',
    n_cart_abaixo: '{ativo} está {pp} abaixo do alvo. O próximo aporte deve priorizá-lo.',
    n_cart_abaixo_sug: '{ativo} está {pp} abaixo do alvo. No próximo aporte, a sugestão é colocar {valor} nele.',
    n_cart_acima: '{ativo} está {pp} acima do alvo. Sem vender nada: direcione os próximos aportes para os demais ativos.',
  },
  direto: {
    n_comecar: 'Importe o extrato ou cadastre rendas. O resto eu acompanho.',
    n_lim_passou: '{area}: {valor} acima do limite de {limite}.',
    n_lim_perto: '{area}: {pct} do limite usado. Restam {restante}.',
    n_orc_estouro: '{mes}: {valor} acima do orçamento. Segure os gastos.',
    n_orc_90: '{pct} do orçamento de {mes} usado. Restam {restante}.',
    n_orc_ritmo: 'Nesse ritmo, {mes} fecha em {projecao} ({excesso} acima). Limite: {porDia} por dia.',
    n_orc_75: 'Restam {restante} em {mes}.',
    n_orc_definir: 'Gastos em {mes} sem orçamento. Defina um.',
    n_area_alta: '{area}: {valor} em {mes}, {pct} acima da média.',
    n_entradas_falta: 'Sem entradas em {mes}. Registre.',
    n_entradas_conferir: '{valor} de entradas em {mes}. Confira com o banco.',
    n_extrato: '{mes} sem lançamentos. Importe o extrato.',
    n_fechamento: '{Prazo} para fechar {mes}. Restam {restante} ({porDia} por dia).',
    n_fechamento_livre: '{Prazo} para fechar {mes}. Gastos: {valor}.',
    n_resumo_sobra: '{MesAnt}: sobra de {valor}.',
    n_resumo_deficit: '{MesAnt}: {valor} no vermelho.',
    n_aporte: 'Sem aporte em {mes}. Registre.',
    n_aporte_meta: 'Meta: {meta}. {mes} sem aporte.',
    n_aporte_sobra: '{sobra} sobraram em {mesAnt}. Invista.',
    n_aporte_falta: 'Faltam {falta} para a meta de {meta}.',
    n_meta_batida: 'Meta batida: {valor} em {mes}.',
    n_proventos: '{valor} em proventos em {mes}.',
    n_cart_sem_alvo: 'Defina o alvo da carteira.',
    n_cart_alvo: 'Alvos somam {soma}. Ajuste para 100%.',
    n_cart_abaixo: '{ativo}: {pp} abaixo do alvo. Priorize.',
    n_cart_abaixo_sug: '{ativo}: {pp} abaixo do alvo. Aporte {valor} nele.',
    n_cart_acima: '{ativo}: {pp} acima do alvo. Aporte nos outros.',
  },
  acolhedor: {
    n_comecar: 'Vamos começar? Importe o extrato ou cadastre suas rendas e, daqui em diante, eu fico de olho em tudo para você.',
    n_lim_passou: '{area} passou um pouco do combinado: {valor} acima do limite de {limite}. Sem culpa, dá para equilibrar nas próximas semanas.',
    n_lim_perto: 'Só um toque: {area} já está em {pct} do limite deste mês. Ainda há {restante}.',
    n_orc_estouro: 'O orçamento de {mes} passou em {valor}. Acontece! Vamos olhar juntos onde dá para ajustar até o fim do mês?',
    n_orc_90: 'Atenção carinhosa: {pct} do orçamento de {mes} já foi usado. Ainda há {restante}, e {prazo}.',
    n_orc_ritmo: 'Se o ritmo continuar, {mes} fecharia em {projecao}, {excesso} acima do planejado. Gastando até {porDia} por dia, você chega lá tranquilo.',
    n_orc_75: 'Tudo sob controle: ainda há {restante} no orçamento de {mes}, e {prazo}.',
    n_orc_definir: 'Que tal definir um orçamento para {mes}? Assim eu aviso você antes de qualquer aperto.',
    n_area_alta: '{area} somou {valor} em {mes}, {pct} acima da sua média de {media}. Foi algo especial?',
    n_entradas_falta: 'Seu salário já caiu? Registre as entradas de {mes} para eu calcular quanto vai sobrar.',
    n_entradas_conferir: 'Já há {valor} em entradas em {mes}. Que tal conferir se está tudo certinho com o banco?',
    n_extrato: '{mes} ainda está em branco. Importe o extrato e eu organizo tudo por categoria para você.',
    n_fechamento: '{Prazo} para fechar {mes}. Ainda há {restante} no orçamento, cerca de {porDia} por dia. Você está indo bem!',
    n_fechamento_livre: '{Prazo} para fechar {mes}. Os gastos somam {valor}. Um orçamento ajudaria a acompanhar com mais tranquilidade.',
    n_resumo_sobra: 'Parabéns! {MesAnt} fechou com {valor} de sobra ({pct} das entradas).',
    n_resumo_deficit: '{MesAnt} fechou {valor} no vermelho. Sem drama: vamos revisar juntos e ajustar o próximo mês.',
    n_aporte: '{mes} ainda está sem aporte registrado. Cada aporte, mesmo pequeno, faz diferença!',
    n_aporte_meta: 'Sua meta é aportar {meta} por mês. Que tal registrar o aporte de {mes}?',
    n_aporte_sobra: '{MesAnt} deixou {sobra} de sobra! Que tal colocar esse dinheiro para trabalhar por você?',
    n_aporte_falta: 'Você já aportou {valor} em {mes}. Faltam só {falta} para a meta de {meta}!',
    n_meta_batida: 'Que orgulho! Você aportou {valor} em {mes} e bateu a meta de {meta}.',
    n_proventos: 'Seus investimentos trabalharam por você: {valor} em proventos em {mes}!',
    n_cart_sem_alvo: 'Vamos definir o alvo de cada ativo? Assim eu mostro onde investir a cada aporte.',
    n_cart_alvo: 'Os alvos somam {soma}. Um ajuste para 100% e as sugestões ficam certinhas.',
    n_cart_abaixo: '{ativo} está {pp} abaixo do alvo. No próximo aporte, ele merece uma atenção especial.',
    n_cart_abaixo_sug: '{ativo} está {pp} abaixo do alvo. No próximo aporte, a sugestão é colocar {valor} nele.',
    n_cart_acima: '{ativo} está {pp} acima do alvo. Sem precisar vender nada, é só direcionar os próximos aportes para os outros ativos.',
  },
};
Object.keys(NOTIF_VOZ).forEach((t) => { if (VOZ[t]) Object.assign(VOZ[t], NOTIF_VOZ[t]); });

const NOTIF_GRUPOS = {
  orcamento: { nome: 'Orçamento', ic: ic('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M16 13.5h.01"/>') },
  lembrete: { nome: 'Lembrete', ic: ic('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16M9 14h2"/>') },
  oportunidade: { nome: 'Oportunidade', ic: ic('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r=".6"/>') },
  conquista: { nome: 'Conquista', ic: ic('<path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.3l-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z"/>') },
};
const NOTIF_FILTROS = [['todas', 'Todas'], ['orcamento', 'Orçamento'], ['lembrete', 'Lembretes'], ['oportunidade', 'Carteira']];
const I_SINO = ic('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>');
const NOTIF_MOEDA = ['limite', 'valor', 'restante', 'projecao', 'excesso', 'media', 'meta', 'falta', 'sobra', 'porDia', 'aporte'];

/* ---------- estado (lido, dispensado) ---------- */
const hojeISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function notifEstado() {
  const p = S.profile; if (!p.notif || typeof p.notif !== 'object') p.notif = { lidas: {}, ocultas: {} };
  return p.notif;
}
function notifMarcar(campo, ids) {
  const st = notifEstado(); const d = hojeISO(); let mudou = false;
  ids.forEach((id) => { if (!st[campo][id]) { st[campo][id] = d; mudou = true; } });
  if (mudou) { podarNotif(st); touch('profile'); }
}
// guarda no máximo 300 marcações por tipo, mantendo as mais recentes (os ids têm o mês, então os antigos deixam de importar)
function podarNotif(st) { ['lidas', 'ocultas'].forEach((k) => { const e = Object.entries(st[k]); if (e.length > 300) st[k] = Object.fromEntries(e.sort((a, b) => (a[1] < b[1] ? 1 : -1)).slice(0, 300)); }); }

/* ---------- contexto do ano corrente e geração ---------- */
function notifContexto() {
  const hoje = new Date(); const ano = hoje.getFullYear(); const plan = S.plans && S.plans[ano];
  if (!plan || !S.profile) return null;
  const ctx = planCtx(ano); const C = S.year === ano && S.C ? S.C : E.compute(plan, ctx);
  let carteira = null;
  if (temRecurso('carteira') && (plan.ativos || []).length) {
    try {
      const m = hoje.getMonth();
      const M = cartModel({ plan, C, mes: m, aporte: E.disponivelAporte({ C, mes: m }).disponivel });
      carteira = { somaAlvo: M.sumAlvo, aporte: M.aporte, itens: M.items.map((i) => ({ nome: i.a.nome, pctAtual: i.pctAtual, pctAlvo: i.pctAlvo, sug: i.sug })) };
    } catch (e) { carteira = null; }
  }
  return { C, plan, carry: ctx.carry, hoje, carteira, recursos: { investimentos: temRecurso('investimentos'), carteira: temRecurso('carteira') } };
}
function notifVars(v) {
  const o = {};
  Object.keys(v).forEach((k) => {
    const x = v[k];
    if (NOTIF_MOEDA.includes(k)) o[k] = brl0(x);
    else if (k === 'pct') o[k] = pct(x);
    else if (k === 'pp') o[k] = (+x).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' p.p.';
    else if (k === 'soma') o[k] = (+x).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
    else o[k] = x;
  });
  if (v.mesAnt) o.MesAnt = v.mesAnt.charAt(0).toUpperCase() + v.mesAnt.slice(1);
  if (v.dias != null) { const d = v.dias; o.prazo = d <= 0 ? 'hoje é o último dia' : d === 1 ? 'falta 1 dia' : `faltam ${d} dias`; o.Prazo = o.prazo.charAt(0).toUpperCase() + o.prazo.slice(1); }
  return o;
}
const preencher = (t, vars) => String(t || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));

// Gera a lista atual (chamada a cada renderização: os avisos acompanham os dados em tempo real)
function notifLista() {
  if (S.screen !== 'app' || !S.profile) return [];
  const ctx = notifContexto(); if (!ctx) return [];
  const st = notifEstado(); const abas = navItems().map((i) => i[0]);
  return E.notificacoes(ctx).filter((n) => !st.ocultas[n.id]).map((n) => {
    const vars = notifVars(n.vars);
    const cta = n.cta && (n.cta.acao !== 'nav' || abas.includes(n.cta.view)) ? n.cta : null;
    return Object.assign({}, n, { lida: !!st.lidas[n.id], titulo: preencher(NOTIF_TIT[n.chave], vars), texto: voz(n.chave, vars), cta, ano: ctx.hoje.getFullYear() });
  });
}

/* ---------- interface ---------- */
function sinoHtml() {
  const lista = notifLista(); S.notifs = lista;
  const novas = lista.filter((n) => !n.lida); const qtd = novas.length;
  // pulso discreto quando surge um aviso novo durante a sessão (não na primeira carga)
  const vistos = S.notifVistos; let pulso = false;
  if (vistos) novas.forEach((n) => { if (!vistos.has(n.id)) pulso = true; });
  S.notifVistos = new Set(lista.map((n) => n.id).concat(vistos ? [...vistos] : []));
  const rotulo = qtd ? `Notificações: ${qtd} ${qtd === 1 ? 'não lida' : 'não lidas'}` : 'Notificações';
  const grave = novas.some((n) => n.nivel === 'critico') ? ' crit' : '';
  return `<div class="notif"><button class="bell${pulso ? ' pulso' : ''}" data-act="notif-toggle" aria-haspopup="dialog" aria-expanded="${!!S.notifOpen}" aria-label="${rotulo}" title="${rotulo}">${I_SINO}${qtd ? `<span class="bell-n${grave}" aria-hidden="true">${qtd > 9 ? '9+' : qtd}</span>` : ''}</button>${S.notifOpen ? notifPopover(lista) : ''}</div>`;
}
function notifPopover(lista) {
  const f = S.notifFiltro || 'todas'; const vis = f === 'todas' ? lista : lista.filter((n) => n.grupo === f || (f === 'lembrete' && n.grupo === 'conquista'));
  const novas = lista.filter((n) => !n.lida).length;
  const chips = NOTIF_FILTROS.map(([k, l]) => { const c = k === 'todas' ? lista.length : lista.filter((n) => n.grupo === k || (k === 'lembrete' && n.grupo === 'conquista')).length; return `<button class="np-chip" data-act="notif-filtro" data-f="${k}" aria-pressed="${f === k}">${l}${c ? `<em>${c}</em>` : ''}</button>`; }).join('');
  const item = (n) => { const g = NOTIF_GRUPOS[n.grupo] || NOTIF_GRUPOS.lembrete;
    return `<li class="ni ${n.nivel}${n.lida ? '' : ' nova'}"><span class="ni-ic" aria-hidden="true">${g.ic}</span>
      <div class="ni-b" data-act="notif-ler" data-id="${esc(n.id)}"><div class="ni-t"><b>${esc(n.titulo)}</b>${n.lida ? '' : '<i class="ni-dot" title="Não lida"></i>'}</div><p>${esc(n.texto)}</p>
      <div class="ni-a">${n.cta ? `<button class="btn sm${n.nivel === 'critico' || n.nivel === 'alerta' || n.nivel === 'oportunidade' ? ' primary' : ''}" data-act="notif-go" data-id="${esc(n.id)}">${esc(n.cta.rotulo)}</button>` : ''}<span class="ni-m">${esc(g.nome)} · ${esc(MES_LONGO[+n.periodo.slice(5) - 1])}</span></div></div>
      <button class="icon-btn sm ni-x" data-act="notif-ocultar" data-id="${esc(n.id)}" aria-label="Dispensar: ${esc(n.titulo)}" title="Dispensar">${I.x}</button></li>`; };
  const vazio = lista.length ? '<p class="np-vazio">Nada nesta categoria agora.</p>'
    : `<div class="np-vazio"><span class="np-ok" aria-hidden="true">${I.check}</span><b>Tudo em dia</b><p>Eu acompanho o seu planejamento e aviso por aqui sobre orçamento, entradas, aportes e oportunidades na carteira.</p></div>`;
  return `<div class="popover npop${S.notifAnim ? ' entra' : ''}" role="dialog" aria-label="Central de notificações" tabindex="-1">
    <div class="np-h"><div><b>Central de notificações</b><small>Seu assistente financeiro · ${esc(CFG.consultor)}</small></div><div class="np-h-a">${novas ? '<button class="lnk" data-act="notif-todas">Marcar como lidas</button>' : ''}<button class="icon-btn np-x" data-act="notif-fechar" aria-label="Fechar notificações">${I.x}</button></div></div>
    ${lista.length > 1 ? `<div class="np-chips" role="group" aria-label="Filtrar avisos">${chips}</div>` : ''}
    ${vis.length ? `<ul class="np-l">${vis.map(item).join('')}</ul>` : vazio}
    <p class="np-foot">Avisos automáticos, calculados a partir do seu planejamento de ${new Date().getFullYear()}.</p></div>`;
}

/* ---------- ações ---------- */
const notifPorId = (id) => (S.notifs || []).find((n) => n.id === id);
async function notifIr(id) {
  const n = notifPorId(id); if (!n) return;
  notifMarcar('lidas', [id]); S.notifOpen = false;
  const c = n.cta; if (!c) { render(); return; }
  if (c.acao === 'ingest') { render(); abrirIngestao(); return; }
  if (c.acao !== 'nav') { render(); return; }
  if (S.year !== n.ano && S.plans[n.ano]) await switchYear(n.ano);
  S.view = c.view; S.maisOpen = false; if (typeof closeAdmin === 'function') closeAdmin();
  if (c.mes != null) { if (c.view === 'despesas') gIrMes(c.mes); else S.mes = c.mes; }
  render();
}
// Atualiza só o sino e a lista, sem redesenhar a página (a tela não "pisca" a cada clique na central)
function notifRefresh(foco) {
  document.querySelectorAll('.notif').forEach((el) => { el.outerHTML = sinoHtml(); });
  notifTitulo(); S.notifAnim = false;
  if (foco) { const el = document.querySelector(foco); if (el) el.focus(); }
}
function notifAcao(act, ds) {
  switch (act) {
    case 'notif-toggle': {
      const abrir = !S.notifOpen; S.notifOpen = abrir; S.notifAnim = abrir;
      if (S.yearOpen) { S.yearOpen = false; render(); } else notifRefresh(abrir ? '.npop' : '.bell');
      return true;
    }
    case 'notif-fechar': S.notifOpen = false; notifRefresh('.bell'); return true;
    case 'notif-go': notifIr(ds.id); return true;
    case 'notif-ler': notifMarcar('lidas', [ds.id]); notifRefresh(); return true;
    case 'notif-todas': notifMarcar('lidas', (S.notifs || []).map((n) => n.id)); notifRefresh('.npop'); return true;
    case 'notif-filtro': S.notifFiltro = ds.f; notifRefresh(`.np-chip[data-f="${ds.f}"]`); return true;
    case 'notif-ocultar': {
      const id = ds.id; notifMarcar('ocultas', [id]); notifRefresh('.npop');
      toastAcao('Aviso dispensado. Ele volta se a situação mudar.', 'Desfazer', () => { delete notifEstado().ocultas[id]; touch('profile'); notifRefresh(); });
      return true;
    }
    default: return false;
  }
}
// contador no título da aba (útil com a aba em segundo plano)
function notifTitulo() {
  const base = document.title.replace(/^\(\d+\+?\)\s*/, '');
  const q = S.screen === 'app' ? (S.notifs || []).filter((n) => !n.lida).length : 0;
  document.title = q ? `(${q > 9 ? '9+' : q}) ${base}` : base;
}

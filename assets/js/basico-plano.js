/* Planejamento, refeito: topo com o plano do mês (entra, gasta, investe, sobra) e cartões por grupo. Usa as mesmas ações (meta, limite, ponto, ano, data-bas-inst) */
function basTelaPlano() {
  const st = S.plan.settings; const C = S.C; const m = basJan().ate; const MS = esc(MES_LONGO[m]);
  const meta = +st.metaAporte || 0; const orc = +st.orcPadrao || 0; const metaAno = +st.metaInvAno || meta * 12;
  const ent = +((C.rendas || [])[m]) || 0; const sai = +((C.despesas || [])[m]) || 0; const K = basContas(m);
  const gasta = orc || sai; const sobra = ent - gasta - meta;
  const cab = (ic0, t, sub, link) => `<div class="bpl-ch"><span class="bpl-ic" aria-hidden="true">${ic0}</span><span class="bas-n"><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</span>${link || ''}</div>`;
  const lnk = (attrs, t) => `<button class="lnk strong" ${attrs}>${t}</button>`;
  const cta = (attrs, t) => `<button class="btn bas-cta bas-add bpl-cta" ${attrs}>${I.plus}${t}</button>`;
  const card = (i, corpo, cls) => `<section class="card bpl-card${cls ? ' ' + cls : ''}" style="--i:${i}">${corpo}</section>`;
  // topo: a renda do mês dividida em gastos, investimento e sobra (barra empilhada)
  const base = Math.max(ent, gasta + meta); const fat = (v) => (base > 0 ? Math.max(0, Math.min(1, v / base)) * 100 : 0).toFixed(1);
  const topo = `<section class="card bas-hero bpl-topo" style="--i:0"><small class="bpl-k">Plano de ${MS} · ${S.year}</small>
    ${ent > 0 ? `<b class="bpl-big ${sobra < 0 ? 'neg' : ''}">${brl0(sobra)}</b><p class="bpl-sub">${sobra >= 0 ? 'devem sobrar livres no fim do mês' : 'é o que falta para fechar o mês'}</p>
      <span class="bpl-pilha" aria-hidden="true"><i class="g" style="width:${fat(gasta)}%"></i><i class="v" style="width:${fat(meta)}%"></i><i class="s" style="width:${fat(Math.max(0, sobra))}%"></i></span>`
      : `<b class="bpl-big vz">Comece pela renda</b><p class="bpl-sub">Anote quanto entra no mês e o app mostra quanto sobra.</p>${cta(basIr('entradas'), 'Anotar entradas')}`}
    <div class="bpl-tr">
      <button ${basIr('entradas')}><small><i class="e"></i>Entra</small><b>${ent ? brl0(ent) : '–'}</b></button>
      <button ${basIr('limite')}><small><i class="g"></i>${orc ? 'Limite' : 'Gasta'}</small><b>${gasta ? brl0(gasta) : 'Definir'}</b></button>
      <button ${basIr('meta')}><small><i class="v"></i>Investe</small><b>${meta ? brl0(meta) : 'Definir'}</b></button>
    </div></section>`;
  // metas: investir por mês, limite do mês e a meta do ano
  const fM = meta > 0 ? Math.min(1, (+((C.investAlocado || [])[m]) || 0) / meta) : 0; const fL = orc > 0 ? sai / orc : 0;
  const metas = card(1, `${cab(I.inv, 'Metas', 'O que você quer fazer com o dinheiro')}
    <div class="bpl-g2">
      <button class="bpl-t" ${basIr('meta')}><small>Investir por mês</small>${meta ? `<b>${brl0(meta)}</b>${basBarra(fM)}<em>${pct(fM)} feito em ${MS}</em>` : '<b class="vz">Definir</b><em>Comece com um valor que caiba no bolso</em>'}</button>
      <button class="bpl-t ${fL > 1 ? 'passou' : fL >= 0.8 ? 'perto' : ''}" ${basIr('limite')}><small>Gastar no máximo</small>${orc ? `<b>${brl0(orc)}</b>${basBarra(fL)}<em>${fL > 1 ? `Passou ${brl0(sai - orc)}` : `Cabem ${brl0(orc - sai)}`}</em>` : '<b class="vz">Definir</b><em>O app avisa perto do limite</em>'}</button>
    </div>
    <ul class="bas-ativ">${basRow(basIr('ponto'), I_META, `Meta de ${S.year}`, st.metaInvAno ? 'Valor definido por você' : 'Soma das metas de cada mês', `<b class="bpl-v">${metaAno ? brl0(metaAno) : '–'}</b>${I.chev}`)}</ul>`);
  // limites por categoria com o uso do mês
  const lim = st.limites || {}; const g = E.gastosAreaMes(S.plan, E.carryItems(S.plans, S.year), m); const L = E.analiseLimites(lim, g);
  const tem = (a) => L.some((x) => E.norm(x.area) === E.norm(a));
  const livres = Object.keys(g).sort((a, b) => g[b] - g[a]).concat(BAS_AREAS).filter((a, i, arr) => !tem(a) && arr.findIndex((b) => E.norm(b) === E.norm(a)) === i);
  const limites = card(2, `${cab(I.despesas, 'Limites por categoria', L.length ? `Uso em ${MS}` : 'Avisa a 80% e quando passar')}
    ${L.length ? `<div class="bpl-lims">${L.map((x) => `<button class="bpl-lim ${x.sit}" ${basIr('limite', { area: x.area })}><span class="bas-ini bas-catic-i" aria-hidden="true">${basCatIc(x.area)}</span>
      <span class="bpl-lim-c"><span class="bpl-lim-h"><b>${esc(x.area)}</b><span>${brl0(x.gasto)} <small>de ${brl0(x.limite)}</small></span></span>${basBarra(x.uso)}
      <small>${x.sit === 'passou' ? `Passou ${brl0(-x.falta)}` : x.sit === 'perto' ? `Perto · cabem ${brl0(x.falta)}` : `Cabem ${brl0(x.falta)}`}</small></span></button>`).join('')}</div>`
      : basVazio('Nenhuma categoria com limite ainda. Escolha uma abaixo.')}
    ${livres.length ? `<div class="bas-lim-add"><small>Pôr limite em</small>${livres.map((a) => `<button ${basIr('limite', { area: a })}>${I.plus}${esc(a)}</button>`).join('')}</div>` : ''}`);
  // rendas e contas fixas do mês
  const pagas = K.itens.filter((x) => x.pago).length;
  const fixas = card(3, `${cab(I.rendas, 'Rendas e contas', `Entradas e contas de ${MS}`)}
    <ul class="bas-ativ">${basRow(basIr('entradas'), I.rendas, 'Entradas do mês', ent ? brl(ent) : 'Nada anotado ainda', I.chev)}
    ${basRow('data-act="bas-aba" data-v="gastos"', I.relatorio, 'Contas do mês', K.itens.length ? `${brl(K.total)} · ${pagas} de ${K.itens.length} pagas` : 'Nenhuma conta anotada', I.chev)}</ul>
    ${ent && K.total ? `<p class="bas-p bpl-nota">As contas levam <b>${pct(K.total / ent)}</b> do que entra. Até 50% é o ideal.</p>` : ''}`);
  // sonhos ligados ao plano
  const A = objAnalise(); const sn = A.itens.slice(0, 3);
  const sonhos = card(4, `${cab(I_META, 'Sonhos', sn.length ? `${A.itens.length} ${A.itens.length === 1 ? 'sonho' : 'sonhos'} no plano` : 'Para onde vai o que você investe', A.itens.length ? lnk(basIr('sonhos'), 'Todos') : '')}
    ${sn.length ? `<div class="bpl-sns">${sn.map((x, i) => `<button class="bpl-sn" ${basIr('sonho-det', { id: x.id })}>${objIcone(x, i)}<span class="bpl-lim-c"><span class="bpl-lim-h"><b>${esc(objNomeDe(x))}</b><span>${pct(x.progresso)}</span></span>${basBarra(x.progresso)}<small>${brl0(x.saldo)} de ${brl0(x.valor)}${x.ano ? ` · até ${x.ano}` : ''}</small></span></button>`).join('')}</div>`
      : basVazio('Dê um nome ao seu sonho e veja quanto falta, mês a mês.')}
    ${cta(basIr('sonho-novo'), 'Novo sonho')}`);
  // atalhos para as leituras do app
  const at = (attrs, ic0, t, s) => `<button class="bpl-at" ${attrs}><span class="bpl-ic" aria-hidden="true">${ic0}</span><b>${t}</b><small>${s}</small></button>`;
  const atalhos = card(5, `${cab(I.cart, 'Como está indo', 'Leituras feitas com o seu plano')}
    <div class="bpl-g2">${at(basIr('saude'), I.pro, 'Saúde financeira', 'Sua nota de 0 a 100')}${at(basIr('resumo', { id: m }), I.relatorio, 'Resumo do mês', cap(MES_LONGO[m]))}
    ${at(basIr('retro'), I.geral, 'Retrospectiva', 'O mês que passou')}${at(basIr('ia'), I.chat, 'Assistente', 'Pergunte sobre o plano')}</div>`, 'bpl-ats');
  // instituições (mesmo input data-bas-inst e contador .bas-pj-n que o basico.js atualiza)
  const n = instMinhas().length;
  const inst = card(6, `${cab(I.despesas, 'Minhas instituições', 'Só elas aparecem ao lançar um gasto', `<small class="bas-pj-n">${n ? `${n} ${n === 1 ? 'marcada' : 'marcadas'}` : 'Nenhuma'}</small>`)}
    <div class="bas-pj-ig">${INSTITUICOES.map(([id, nome]) => `<label class="bas-pj-i"><input type="checkbox" data-bas-inst="${id}" ${instMinhas().includes(id) ? 'checked' : ''}>${instIcone(id)}<span>${esc(nome)}</span><i class="bas-pj-ok" aria-hidden="true">${I.check}</i></label>`).join('')}</div>`);
  // ano aberto e ponto de partida
  const anos = card(7, `${cab(I_PLANO, 'Ano e ponto de partida', 'A base das contas do ano')}
    <ul class="bas-ativ">${basRow(basIr('ano'), I.relatorio, 'Ano do planejamento', `Aberto: ${S.year}`, I.chev)}
    ${basRow(basIr('ponto'), I.cart, `Patrimônio no início de ${S.year}`, +st.patrimonioInicial > 0 ? brl(+st.patrimonioInicial) : 'Calculado pelo app', I.chev)}</ul>`);
  return basDet('Planejamento', `<div class="bpl">${topo}${metas}${limites}${fixas}${sonhos}${atalhos}${inst}${anos}</div>`);
}
BAS_TELAS.planejamento = basTelaPlano;

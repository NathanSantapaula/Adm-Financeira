/* Investimentos, Proventos e Carteira (alocação-alvo e onde investir a cada aporte). */
'use strict';
function assetRows(nodes, kind, field, flt, depth) {
  let h = '';
  for (const n of nodes) {
    if (n.leaf) {
      if (flt && !n.label.toLowerCase().includes(flt)) continue;
      const ri = RI++;
      h += `<tr><td class="lab"><div class="in" style="--d:${depth}"><span class="chev-sp"></span><button class="lnk" data-act="edit-ativo" data-id="${n.asset.id}">${esc(n.label)}</button></div></td>${cells(n.v, { k: field, id: n.asset.id, ri })}</tr>`;
    } else {
      const inner = assetRows(n.children, kind, field, flt, depth + 1);
      if (flt && !inner) continue;
      const open = flt ? true : !S.closed[kind].has(n.key);
      h += groupRow({ label: n.label, depth, v: n.v, kind, key: n.key, open }) + (open ? inner : '');
    }
  }
  return h;
}
function groupKeys(nodes, out) { for (const n of nodes) if (!n.leaf) { out.push(n.key); groupKeys(n.children, out); } return out; }

/* ---------- Investimentos e Proventos: painel de estudo + planilha recolhível ---------- */
const PAL = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
const SOBRA_COR = 'color-mix(in srgb, var(--accent) 18%, transparent)';
const mesesDecorridos =() => (S.year === NOW_Y ? NOW_M + 1 : 12);
function analiseAtual() {
  const M = cartModel();
  return E.analiseInvest({ C: S.C, ...perJanela(), metaAporte: +S.plan.settings.metaAporte || 0, metaMes: S.C.metaAporteMes,
    itens: M.items.map((i) => ({ nome: i.a.nome, tipo: i.a.tipo, classe: i.a.classe, valor: i.valor, ap: i.a.ap, pr: i.a.pr })) });
}
const kpi = (rot, val, sub, extra, cls) => `<section class="kpi${cls ? ' ' + cls : ''}"><small class="kpi-k">${rot}</small><div class="kpi-v">${val}</div>${extra || ''}<p class="kpi-s">${sub}</p></section>`;
const barra = (f, tom) => `<span class="kbar${tom ? ' ' + tom : ''}" aria-hidden="true"><i style="width:${(Math.max(0, Math.min(1, f || 0)) * 100).toFixed(1)}%"></i></span>`;
const legenda = (itens) => `<ul class="leg">${itens.map(([c, l]) => `<li><i style="background:${c}"></i>${esc(l)}</li>`).join('')}</ul>`;
const ateMes = () => (S.year === NOW_Y && !S.periodo ? ` até ${MES_LONGO[NOW_M]}` : ''); // com período, o texto já diz quais meses (perFrase)
const fmt1 = (v) => (+v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function planilhaHtml(kind) {
  const p = S.plan; const C = S.C; const field = kind === 'inv' ? 'ap' : 'pr'; const flt = (S.filter[kind] || '').trim().toLowerCase();
  const tree = E.buildAssetTree(p.ativos, field); RI = 0; FIRST_ED = true; let b = '';
  if (kind === 'inv') b += labRow('Sobra do mês (entradas menos gastos)', C.investAlocado, { cls: 'r-note' });
  const rows = assetRows(tree, kind, field, flt, 0); b += rows;
  if (flt && !rows) b += `<tr class="r-note"><td class="lab" colspan="14"><div class="in"><span>Nenhum ativo encontrado para “${esc(S.filter[kind])}”.</span></div></td></tr>`;
  if (kind === 'inv') {
    b += labRow('Do bolso', C.aportes, { cls: 'r-g' }) + labRow('Dividendos reinvestidos', C.dividendos, { cls: 'r-g' }) + labRow('Total aplicado no mês', C.aplicado, { cls: 'r-total' })
      + labRow('Diferença (sobra do mês menos o aplicado)', C.diferenca, { cls: 'r-g' }) + labRow('Meta de aporte do mês', C.meta, { cls: 'r-total' });
  } else b += labRow('Rentabilidade da renda fixa', C.rentab, { cls: 'r-g' }) + labRow('Dividendos', C.dividendos, { cls: 'r-g' }) + labRow('Total de proventos', C.faturamento, { cls: 'r-total' });
  const aberto = !!S.planilha[kind];
  const tools = `<div class="sheet-tools"><input class="search" type="search" data-filter="${kind}" placeholder="Buscar ativo" value="${esc(S.filter[kind])}" aria-label="Buscar ativo"><button class="btn sm" data-act="expand-all" data-kind="${kind}">Expandir</button><button class="btn sm" data-act="collapse-all" data-kind="${kind}">Recolher</button></div>`;
  return `<section class="sheet-sec" data-open="${aberto}"><button class="sheet-tg" data-act="planilha-toggle" data-kind="${kind}" aria-expanded="${aberto}"><span class="macc-ch">${I.chev}</span><span><b>Planilha mês a mês</b><small>${kind === 'inv' ? 'Aportes e resgates de cada ativo. Valores negativos são resgates.' : 'Proventos de cada ativo. Em renda fixa, o valor conta como rentabilidade.'}</small></span></button>
    ${aberto ? `${tools}<div class="tablewrap"><table class="grid">${headRow('Tipo, classe e ativo')}<tbody>${b}</tbody></table></div>` : ''}</section>`;
}

function vazioInvest(kind) {
  return `<section class="cc-empty"><div class="cc-empty-ic" aria-hidden="true">${I[kind === 'inv' ? 'inv' : 'pro']}</div><div class="cc-empty-tx"><h3>${kind === 'inv' ? 'Traga sua carteira em um minuto' : 'Seus proventos aparecem aqui'}</h3>
    <p>${kind === 'inv' ? 'Baixe o extrato de movimentação na Área do Investidor da B3 e solte aqui: aportes, resgates e proventos de todas as corretoras entram de uma vez.' : 'Importe o extrato de movimentação da B3 para trazer dividendos, JCP e rendimentos de cada ativo, mês a mês.'}</p></div>
    <div class="cc-empty-acts"><button class="btn primary lg" data-act="ingest-open" data-modo="corretora">Importar da corretora</button><button class="btn ghost" data-act="${kind === 'inv' ? 'aporte-novo' : 'add-ativo'}">${kind === 'inv' ? 'Novo aporte manual' : 'Adicionar ativo manualmente'}</button></div></section>`;
}

/* widgets organizáveis de Investimentos e Proventos (mesmo sistema da Visão geral; ver telaWidgetsHtml) */
const INV_WIDGETS = [
  { id: 'indicadores', nome: () => 'Indicadores dos investimentos', desc: 'Aportado no ano, ritmo da meta, constância e diversificação.', tam: 6, tams: [6], padrao: () => true },
  { id: 'aportes', nome: () => 'Aportes mês a mês', desc: 'O gráfico principal: quanto foi aportado em cada mês, com os valores à vista, a meta e a sobra que ficou parada.', tam: 6, tams: [4, 6], padrao: () => true },
  { id: 'quanto', nome: () => 'Quanto aportei', desc: 'Aportado no ano contra a meta, com a meta mensal editável ali mesmo.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'disponivel', nome: () => 'Disponível para aportar', desc: 'Sobra do mês menos o que já foi aportado, com atalho para o novo aporte.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'onde', nome: () => 'Onde está o dinheiro', desc: 'Composição da carteira por classe e por ativo (a mesma da Carteira) e renda fixa contra o perfil.', tam: 2, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'destino', nome: () => 'Para onde foram os aportes', desc: 'Quanto você aportou em cada classe no ano.', tam: 3, tams: [2, 3, 4, 6], padrao: () => false },
  { id: 'posicoes', nome: () => 'Maiores posições', desc: 'Os ativos com mais dinheiro, a custo.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'estudar', nome: () => 'Para estudar', desc: 'Concentração, desvio do perfil, projeção ilustrativa e meses sem aporte.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
];
const PRO_WIDGETS = [
  { id: 'indicadores', nome: () => 'Indicadores dos proventos', desc: 'Recebido no ano, média por mês, retorno em proventos e cobertura dos gastos.', tam: 6, tams: [6], padrao: () => true },
  { id: 'mensal', nome: () => 'Proventos mês a mês', desc: 'Dividendos e renda fixa de cada mês.', tam: 4, tams: [3, 4, 6], padrao: () => true },
  { id: 'independencia', nome: () => 'Número da independência', desc: 'Quanto precisaria estar investido para os proventos pagarem seus gastos.', tam: 2, tams: [2, 3, 4], padrao: () => true },
  { id: 'pagadores', nome: () => 'Quem mais paga', desc: 'Ranking dos ativos que mais pagaram proventos no ano.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'calendario', nome: () => 'Calendário de pagamentos', desc: 'Em que meses cada ativo pagou.', tam: 3, tams: [3, 4, 6], padrao: () => true },
];
function painelInvest(A) {
  const ap = A.aporte; const ca = A.carteira; const pr = S.profile; const ret = +pr.retornoAnual || 0;
  const fB = ap.ateAgora > 0 ? (ap.doBolso / ap.ateAgora) * 100 : 0;
  const k1 = kpi('De onde veio o aporte', `<span class="num">${brl(ap.ateAgora)}</span>${varChip('aplicado', 1)}`, ap.ateAgora > 0 ? `${brl(ap.doBolso)} do seu bolso e ${brl(ap.deDividendos)} de dividendos reinvestidos ${perFrase()}${ateMes()}.` : 'Nenhum aporte registrado ainda.', ap.ateAgora > 0 ? `<span class="kbar dup" aria-hidden="true"><i style="width:${fB.toFixed(1)}%"></i><i class="dv" style="width:${(100 - fB).toFixed(1)}%"></i></span>` : '');
  const k2 = kpi('Da renda para investimentos', ap.taxaRenda == null ? '–' : pct(ap.taxaRenda), ap.taxaRenda == null ? 'Aparece quando houver entradas registradas em Rendas.' : `das entradas ${perFrase()} viraram aporte.`, ap.taxaRenda == null ? '' : barra(ap.taxaRenda, ap.taxaRenda >= 0.2 ? 'ok' : ''));
  const JN = perJanela(); const dots = `<span class="dots" aria-hidden="true">${MES.map((m, i) => `<i class="${ap.porMes[i] ? 'on' : i < JN.de || i >= JN.meses ? 'fut' : ''}" title="${m}"></i>`).join('')}</span>`;
  const k3 = kpi('Constância', `${ap.mesesComAporte} <small>de ${ap.meses} meses</small>`, 'com aporte. Aportar todo mês pesa mais que acertar o momento.', dots);
  const k4 = ca.n ? kpi('Diversificação', `≈ ${fmt1(ca.nEfetivo)} <small>${ca.nEfetivo < 1.5 ? 'ativo' : 'ativos'}</small>`, `de peso igual equivalem à sua carteira de ${ca.n}. Maior posição: ${esc(ca.maior.nome)} (${pct(ca.maior.peso)}).`)
    : kpi('Diversificação', '–', 'Sem posições ainda.');
  const leg = legenda([...(ap.metaAte > 0 ? [['var(--pos)', 'Na meta']] : []), ['var(--accent)', ap.metaAte > 0 ? 'Abaixo da meta' : 'Aportado'], [SOBRA_COR, 'Sobra que ficou parada'], ...(ap.metaAte > 0 ? [['var(--c4)', 'Meta']] : [])]);
  const naMeta = S.C.aplicado.slice(JN.de, JN.meses).filter((v, k) => { const mt = S.C.metaAporteMes[JN.de + k]; return mt > 0 && v >= mt - 0.005; }).length; // cada mês contra a meta dele
  const [qDe, qAte] = perIntervalo(); const umMes = S.periodo && qDe === qAte ? qDe : null; const mm = S.C.metaAporteMes; const proprio = umMes != null && S.plan.metasAporte[umMes] != null; const nProp = S.plan.metasAporte.filter((v) => v != null).length;
  const metaMesEd = umMes == null ? '' : `<span class="ed iq-meta${mm[umMes] > 0 ? '' : ' z'}" data-k="mam" data-m="${umMes}" data-ri="-1" data-v="${mm[umMes]}" data-custom="${proprio ? 1 : 0}" data-fmt="brl" tabindex="0" title="Toque para mudar a meta de ${MES_LONGO[umMes]}">${mm[umMes] > 0 ? brl(mm[umMes]) : 'Definir'}</span>`;
  const metaEd = `<span class="ed iq-meta${ap.meta > 0 ? '' : ' z'}" data-k="ma" data-m="0" data-ri="-1" data-v="${ap.meta}" data-fmt="brl" tabindex="0" title="Toque para mudar a meta mensal de aportes">${ap.meta > 0 ? brl(ap.meta) : 'Definir'}</span>`;
  const anelC = 326.73; const anel = `<svg class="iq-anel" viewBox="0 0 120 120" aria-hidden="true"><circle class="iq-tr" r="52" cx="60" cy="60"/><circle class="iq-pg${ap.ritmo >= 1 ? ' ok' : ''}" r="52" cx="60" cy="60" stroke-dasharray="${(Math.min(1, ap.ritmo || 0) * anelC).toFixed(1)} ${anelC}" transform="rotate(-90 60 60)"/></svg>`;
  const iqSub = ap.metaAte > 0 ? `${ap.ritmo >= 1 ? `${brl(ap.ateAgora - ap.metaAte)} acima da meta` : `Faltam ${brl(ap.faltaMeta)} para a meta`}${ateMes()}. Média de ${brl(ap.mediaMes)} por mês.` : 'Defina a meta mensal para acompanhar o ritmo.'; // a parte dos dividendos já está em "De onde veio o aporte"
  const [dDe, dAte] = S.periodo ? perIntervalo() : [S.mes, S.mes]; const dRot = dDe === dAte ? 'em ' + MES_LONGO[dDe] : perFrase(); const dDiv = S.C.dividendos.slice(dDe, dAte + 1).reduce((a, v) => a + v, 0); // segue o período escolhido
  const D = E.disponivelAporte({ C: S.C, mes: dDe, ate: dAte, metaMes: S.C.metaAporteMes });
  const redondo = D.sobra > 0.005 && Math.abs(D.sobra - D.aportado) < 0.005; const exc = D.excedente >= 0.005; /* comparação ao centavo */ const dMx = Math.max(D.aportado + D.disponivel, 1); const w = (v) => `${((Math.max(0, v) / dMx) * 100).toFixed(1)}%`;
  const { K } = cartAnalise(); const dst = ap.porClasse; const dstMx = dst.length ? dst[0].value : 1;
  const perfil = pr.perfilInvestidor && E.PERFIS[pr.perfilInvestidor.resultado];
  const rfBar = ca.total > 0 ? `<div class="rfbv"><div class="rfbv-l"><span>Renda fixa <b>${pct(ca.pesoRF)}</b></span><span>Renda variável <b>${pct(ca.pesoBolsa)}</b></span></div><span class="rfbv-t"><i style="width:${(ca.pesoRF * 100).toFixed(1)}%"></i>${perfil ? `<em style="left:${perfil.alvo.rendaFixa}%" title="Referência do perfil ${esc(perfil.nome)}"></em>` : ''}</span>${perfil ? `<small>Marca: referência do perfil ${esc(perfil.nome)} (${perfil.alvo.rendaFixa}% em renda fixa).</small>` : ''}</div>` : '';
  const top = ca.posicoes.slice(0, 8);
  const ins = [];
  if (ca.maior) ins.push(ca.maior.peso > 0.25 ? ['warn', `<b>${esc(ca.maior.nome)}</b> concentra ${pct(ca.maior.peso)} da carteira. Se ele cair 20%, a carteira inteira cai ${pct(ca.maior.peso * 0.2, 1)}.`] : ['ok', `Nenhum ativo passa de 25% da carteira: o risco de um único ativo está diluído.`]);
  if (perfil && ca.total > 0) { const dif = (ca.pesoRF * 100) - perfil.alvo.rendaFixa; ins.push([Math.abs(dif) > 10 ? 'warn' : 'ok', `Perfil ${esc(perfil.nome)}: referência de ${perfil.alvo.rendaFixa}% em renda fixa. Você está com ${pct(ca.pesoRF)}${Math.abs(dif) > 10 ? `, ${fmt1(Math.abs(dif))} pontos percentuais ${dif > 0 ? 'acima' : 'abaixo'}. A aba Carteira mostra onde colocar o próximo aporte para reequilibrar.` : ', dentro da faixa.'}`]); }
  if (ap.mediaMes > 0) { const fv = E.projetar(ca.total, ap.mediaMes, ret, 120).pop(); ins.push(['info', `Mantendo ${brl0(ap.mediaMes)} por mês e retorno hipotético de ${fmt1(ret)}% ao ano, a carteira chegaria a <b>${brl0(fv)}</b> em 10 anos, sendo ${brl0(ca.total + ap.mediaMes * 120)} de dinheiro aportado. O resto é efeito dos juros compostos. Ilustração, não promessa.`]); }
  if (ap.meses - ap.mesesComAporte >= 2) ins.push(['info', `${ap.meses - ap.mesesComAporte} meses sem aporte ${perFrase()}. Um aporte automático no dia do salário costuma resolver.`]);
  return telaWidgetsHtml('invest', {
    indicadores: `<div class="kpis">${k1}${k2}${k3}${k4}</div>`,
    quanto: `<section class="card iq"><div class="c-h"><h3>Quanto aportei</h3></div><div class="iq-b"><div class="iq-g">${anel}<div class="iq-c"><b>${ap.metaAte > 0 ? pct(ap.ritmo) : '–'}</b><small>da meta</small></div></div>
      <div class="iq-t"><small>Aportado ${perFrase()}${ateMes()}</small><div class="iq-v num">${brl(ap.ateAgora)}</div><div class="iq-m">${umMes != null ? `Meta de ${MES_LONGO[umMes]}: ${metaMesEd}${proprio ? `<button class="lnk" data-act="meta-padrao" data-m="${umMes}">Usar a padrão (${brl(ap.meta)})</button>` : ''}` : `Meta mensal padrão: ${metaEd}`}</div>${umMes != null ? '' : `<p class="cap iq-dica">${nProp ? `${nProp} ${nProp === 1 ? 'mês tem' : 'meses têm'} meta própria. ` : ''}Escolha um mês no calendário para dar a ele uma meta diferente.</p>`}<small class="iq-s">${iqSub}</small></div></div></section>`,
    disponivel: `<section class="card idp${redondo ? ' redondo' : ''}"><div class="c-h"><h3>Disponível para aportar ${dRot}</h3></div>${redondo ? `<div class="idp-v ok">${I.check}Tudo investido</div><p class="idp-ok" role="status">A sobra ${dRot} foi investida por inteiro: entradas, gastos e aportes fecham certinho.</p>` : `<div class="idp-v num">${brl(D.disponivel)}</div>`}${exc ? `<p class="idp-alerta" role="status">Você investiu mais do que sobrou ${dRot}: veio de reservas ou de entradas não registradas.</p>` : ''}
      <span class="idp-b" aria-hidden="true"><i class="a" style="width:${w(D.aportado - D.excedente)}"></i><i class="x" style="width:${w(D.excedente)}"></i><i class="d" style="width:${w(D.disponivel)}"></i></span>
      <ul class="idp-l"><li><i class="a"></i>Já investido<b>${brl(D.aportado)}</b></li>${D.disponivel >= 0.005 ? `<li><i class="d"></i>Ainda disponível<b>${brl(D.disponivel)}</b></li>` : ''}${exc ? `<li class="neg"><i class="x"></i>Passou da sobra<b>${brl(D.excedente)}</b></li>` : ''}${D.acimaMeta >= 0.005 ? `<li class="idp-meta ok">Acima da meta<b>${brl(D.acimaMeta)}</b></li>` : D.faltaMeta >= 0.005 ? `<li class="idp-meta">Falta para a meta<b>${brl(D.faltaMeta)}</b></li>` : ''}</ul>
      <p class="cap${D.sobra < 0 ? ' keep' : ''}">${D.sobra < 0 ? `Os gastos ${dRot} passaram das entradas em ${brl(-D.sobra)}.` : `Sobra de ${brl(D.sobra)} (entradas menos gastos ${dDe === dAte ? 'do mês' : 'do período'}) menos o que já foi investido${dDiv > 0 ? `, incluindo ${brl(dDiv)} de dividendos reinvestidos` : ''}.`}</p>
      <div class="btn-row"><button class="btn primary sm" data-act="aporte-novo">${I.plus}Novo aporte</button>${temRecurso('carteira') ? '<button class="btn sm" data-act="nav" data-view="cart">Onde investir</button>' : ''}</div></section>`,
    aportes: `<section class="card"><div class="c-h"><h3>Aportes mês a mês</h3>${ap.metaAte > 0 ? `<small class="c-note">${naMeta} de ${ap.meses} ${ap.meses === 1 ? 'mês' : 'meses'} na meta</small>` : ''}</div>
      ${leg}<div class="chart ia-chart" id="inv-aportes"></div></section>`,
    onde: `<section class="card cart-exp-card" data-exp="composicao"><div class="c-h"><h3>Onde está o dinheiro</h3>${cartExpBtn('composicao')}</div>${cartComposicaoHtml(K)}${rfBar}</section>`,
    destino: `<section class="card"><div class="c-h"><h3>Para onde foram os aportes</h3><small class="c-note">${perFrase()}</small></div>${dst.length ? `<ul class="rank">${dst.map((c, n) => `<li><span class="rk-n">${n + 1}</span><span class="rk-l"><b title="${esc(c.label)}">${esc(c.label)}</b></span><span class="rk-t"><i style="width:${((c.value / dstMx) * 100).toFixed(1)}%;--bc:${PAL[n % 6]}"></i></span><span class="rk-v">${brl0(c.value)}<small>${pct(ap.ano > 0 ? c.value / ap.ano : 0)}</small></span></li>`).join('')}</ul>` : `<p class="empty-s">Nenhum aporte registrado em ${S.year}.</p>`}</section>`,
    posicoes: `<section class="card"><div class="c-h"><h3>Maiores posições</h3><small class="c-note">a custo</small></div>${top.length ? `<ul class="rank">${top.map((i, n) => `<li><span class="rk-n">${n + 1}</span><span class="rk-l"><b title="${esc(i.nome)}">${esc(i.nome)}</b><small>${esc(i.classe)}</small></span><span class="rk-t"><i style="width:${((i.valor / top[0].valor) * 100).toFixed(1)}%;--bc:${PAL[ca.porClasse.findIndex((c) => c.label === i.classe) % 6]}"></i></span><span class="rk-v">${brl0(i.valor)}<small>${pct(i.peso, 1)}</small></span></li>`).join('')}</ul>` : '<p class="empty-s">Sem posições.</p>'}</section>`,
    estudar: `<section class="card study"><div class="c-h"><h3>Para estudar</h3></div><ul class="insights">${ins.map(([t, x]) => `<li class="${t}">${x}</li>`).join('')}</ul></section>`,
  });
}

/* Calendário de proventos: todos os pagadores (antes eram só os 10 maiores). Quanto mais forte o quadrado, maior o valor.
   Tocar num quadrado mostra o valor num balão sobre ele (provCalSel), sem render() e sem mudar o tamanho do widget. */
const provCor = (p) => (p.tipo === 'RENDA FIXA' ? 'var(--c1)' : 'var(--c3)');
function provCalHtml(pv) {
  const ps = pv.pagadores; const max = Math.max(1, ...ps.flatMap((p) => p.pr));
  return `<div class="pcal"><div class="heat" role="table" aria-label="Calendário de proventos por ativo"><div class="heat-r heat-h" role="row"><span role="columnheader"></span>${MES.map((m) => `<span role="columnheader">${m[0]}</span>`).join('')}</div>
    ${ps.map((p) => `<div class="heat-r" role="row" style="--cor:${provCor(p)}"><span class="heat-n" role="rowheader" title="${esc(p.nome)}">${esc(p.nome)}</span>${p.pr.map((v, m) => { const t = `${esc(p.nome)} · ${MES[m]}: ${v > 0 ? brl(v) : 'sem pagamento'}`;
      return `<span role="cell" class="heat-c${v > 0 ? ' on' : ''}" data-act="prov-cel" data-t="${t}" aria-label="${t}" style="--a:${v > 0 ? (0.25 + 0.75 * (v / max)).toFixed(2) : 0}"></span>`; }).join('')}</div>`).join('')}
  </div></div><p class="cap">Toque num quadrado para ver o valor. Quanto mais forte, maior o valor. FIIs costumam pagar todo mês; ações concentram em poucos meses.</p>`;
}
function provCalSel(el) {
  const box = el.closest('.pcal'); const velho = box.querySelector('.heat-c.sel'); const tip = box.querySelector('.pcal-tip'); if (tip) tip.remove();
  if (velho) velho.classList.remove('sel'); if (velho === el) return; // tocar de novo fecha
  el.classList.add('sel'); const b = document.createElement('span'); b.className = 'pcal-tip'; b.setAttribute('role', 'status'); b.textContent = el.dataset.t; box.appendChild(b);
  const r = el.getBoundingClientRect(); const R = box.getBoundingClientRect(); const w = b.offsetWidth;
  b.style.left = `${Math.max(0, Math.min(R.width - w, r.left - R.left + r.width / 2 - w / 2))}px`; const y = r.top - R.top - b.offsetHeight - 6;
  b.style.top = `${y >= 0 ? y : r.bottom - R.top + 6}px`; // na primeira linha, o balão vai para baixo
}

function painelProventos(A) {
  const pv = A.proventos; const ca = A.carteira; const ap = A.aporte; const ret = +S.profile.retornoAnual || 0;
  const k1 = kpi(`Recebido ${perFrase()}`, `<span class="num">${brl0(pv.ano)}</span>${varChip('faturamento', 1)}`, `Dividendos ${brl0(pv.dividendos)} · Renda fixa ${brl0(pv.rentab)}.`);
  const k2 = kpi('Média por mês', `<span class="num">${brl0(pv.mediaMes)}</span>`, `Cerca de ${brl(pv.porDia)} por dia. ${pv.mesesComProvento} de ${ap.meses} meses com proventos.`);
  const k3 = kpi('Retorno em proventos', pv.yoc == null ? '–' : pct(pv.yoc, 1), pv.yoc == null ? 'Aparece quando houver aportes e proventos.' : 'ao ano, sobre o valor investido (a custo).');
  const k4 = kpi('Cobertura dos gastos', pv.cobertura == null ? '–' : pct(pv.cobertura, 1), pv.cobertura == null ? 'Registre gastos na aba Gastos para comparar.' : `dos seus gastos médios (${brl0(pv.gastoMedio)} por mês) já são pagos pelos proventos.`, pv.cobertura == null ? '' : barra(pv.cobertura, pv.cobertura >= 1 ? 'ok' : ''));
  const top = pv.pagadores.slice(0, 8);
  const rank = top.length ? `<ul class="rank">${top.map((p, n) => `<li><span class="rk-n">${n + 1}</span><span class="rk-l"><b title="${esc(p.nome)}">${esc(p.nome)}</b><small>Pagou em ${p.mesesPagos} ${p.mesesPagos === 1 ? 'mês' : 'meses'}${p.yoc != null ? ` · yield ${pct(p.yoc, 1)}` : ''}</small></span><span class="rk-t"><i style="width:${((p.recebido / top[0].recebido) * 100).toFixed(1)}%;--bc:${p.tipo === 'RENDA FIXA' ? 'var(--c1)' : 'var(--c3)'}"></i></span><span class="rk-v">${brl0(p.recebido)}<small>${pct(pv.ano > 0 ? p.recebido / pv.ano : 0)}</small></span></li>`).join('')}</ul>` : '<p class="empty-s">Nenhum provento registrado neste ano.</p>';
  let lib = '';
  if (pv.capitalLiberdade) {
    const f = ca.total / pv.capitalLiberdade; const n = ap.mediaMes > 0 ? E.mesesAteMeta(ca.total, ap.mediaMes, ret, pv.capitalLiberdade, 1200) : null;
    lib = `<section class="card lib"><div class="c-h"><h3>Seu número da independência</h3></div><div class="lib-v num">${brl0(pv.capitalLiberdade)}</div>${barra(f, f >= 1 ? 'ok' : '')}
      <p>Você tem ${brl0(ca.total)} (${pct(f, 1)}).${ap.mediaMes > 0 && f < 1 ? ` No ritmo atual, levaria ${n == null ? '<b>mais de 100 anos</b>' : `cerca de <b>${fmt1(n / 12)} anos</b>`}.` : ''}</p>
      <p class="cap">Valor investido para os proventos pagarem seus gastos médios de ${brl0(pv.gastoMedio)} por mês, com o retorno em proventos atual de ${pct(pv.yoc, 1)} ao ano.${ap.mediaMes > 0 && f < 1 ? ` O prazo supõe aportes de ${brl0(ap.mediaMes)} por mês e retorno hipotético de ${fmt1(ret)}% ao ano.` : ''} Estudo ilustrativo: supõe gastos constantes, sem inflação e sem promessa de rentabilidade.</p></section>`;
  }
  return telaWidgetsHtml('proventos', {
    indicadores: `<div class="kpis">${k1}${k2}${k3}${k4}</div>`,
    mensal: `<section class="card"><div class="c-h"><h3>Proventos mês a mês</h3>${legenda([['var(--c3)', 'Dividendos e rendimentos'], ['var(--c1)', 'Renda fixa']])}</div><div class="chart" id="pro-mes"></div></section>`,
    independencia: lib || `<section class="card"><div class="c-h"><h3>Seu número da independência</h3></div><p class="empty-s">Aparece quando houver proventos, posições e gastos registrados: mostra quanto você precisaria investido para os proventos pagarem seus gastos.</p></section>`,
    pagadores: `<section class="card"><div class="c-h"><h3>Quem mais paga</h3></div>${rank}</section>`,
    calendario: `<section class="card"><div class="c-h"><h3>Calendário de pagamentos</h3></div>${pv.pagadores.length ? provCalHtml(pv) : '<p class="empty-s">O calendário aparece quando houver proventos registrados.</p>'}</section>`,
  });
}

function viewAssets(kind) {
  const rec = kind === 'inv' ? 'investimentos' : 'proventos';
  const title = kind === 'inv' ? 'Investimentos' : 'Proventos';
  if (!temRecurso(rec)) return `${pageHead(title, kind === 'inv' ? 'Quanto você aplica em cada ativo.' : 'Dividendos e rendimentos recebidos.')}${lockedHtml(rec)}`;
  const sub = kind === 'inv' ? 'Quanto você investe, onde está o dinheiro e se o ritmo leva ao seu objetivo.' : 'Quanto os seus investimentos devolvem em caixa, de quem e quando.';
  const acts = `<button class="btn primary" data-act="ingest-open" data-modo="corretora">${I.plus}Importar da corretora</button>${kind === 'inv' ? '<button class="btn" data-act="aporte-novo">Novo aporte</button>' : '<button class="btn" data-act="add-ativo">Adicionar ativo</button>'}`;
  if (!S.plan.ativos.length) return `${pageHead(title, sub)}${vazioInvest(kind)}`;
  const A = analiseAtual();
  return `${pageHead(title, sub, acts)}${kind === 'inv' ? painelInvest(A) : painelProventos(A)}${planilhaHtml(kind)}`;
}
/* Aportes mês a mês: barras no mesmo estilo dos outros gráficos, com o valor escrito em cada barra (na vertical quando
   o mês fica estreito), verde quando bate a meta daquele mês, a sobra parada em tom claro e a meta de cada mês como traço. */
function invAportesChart(el) {
  const C = S.C; const mm = C.metaAporteMes || new Array(12).fill(0); const ap = C.aplicado; /* aportado = bolso + dividendos reinvestidos */ const cur = S.year === NOW_Y ? NOW_M : -1; const lim = S.year === NOW_Y ? NOW_M : 11;
  const ids = perIds(); const nb = ids.length; const W = Math.max(280, Math.floor(el.clientWidth || 640)); const deitado = (W - 24) / nb >= 46; // só os meses do período
  const m = { t: deitado ? 24 : 44, r: 6, b: 24, l: 6 }; const H = Math.max(240, Math.min(360, altura(el))); const ih = H - m.t - m.b; const band = (W - m.l - m.r) / nb;
  const sob = C.investAlocado.map((v) => Math.max(0, v)); const hi = Math.max(100, ...ids.map((i) => Math.max(ap[i], sob[i], mm[i] * 1.08))); const lo = Math.min(0, ...ids.map((i) => ap[i]));
  const y = (v) => m.t + (ih * (hi - v)) / (hi - lo); const bw = Math.min(34, band * 0.6); const bate = (i) => mm[i] > 0 && ap[i] >= mm[i] - 0.005; const y0 = y(0);
  let g = ''; let mk = '';
  for (let j = 0; j < nb; j++) {
    const i = ids[j]; const cx = m.l + band * (j + 0.5); const x = (cx - bw / 2).toFixed(1); const v = ap[i]; const fut = i > lim ? ' fut' : '';
    if (sob[i] > Math.max(0, v) + 0.5) g += `<rect class="ia-sob" x="${x}" y="${y(sob[i]).toFixed(1)}" width="${bw.toFixed(1)}" height="${(y0 - y(sob[i])).toFixed(1)}" rx="4"/>`;
    if (Math.abs(v) > 0.005) { const y1 = v > 0 ? y(v) : y0; const hh = Math.abs(y(v) - y0);
      g += `<rect class="ia-bar${v < 0 ? ' neg' : bate(i) ? ' ok' : ''}${fut}" x="${x}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, hh).toFixed(1)}" rx="4"/>`;
      const ly = (v > 0 ? y(v) : y0) - 6; const t = escSvg(tickFmt(Math.round(v))); const cls = `ia-v${bate(i) ? ' ok' : ''}${fut}`;
      g += deitado ? `<text class="${cls}" x="${cx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${t}</text>` : `<text class="${cls}" transform="translate(${(cx + 4).toFixed(1)} ${ly.toFixed(1)}) rotate(-90)">${t}</text>`; }
    if (mm[i] > 0) mk += `<line class="ia-meta" x1="${(cx - bw / 2 - 4).toFixed(1)}" x2="${(cx + bw / 2 + 4).toFixed(1)}" y1="${y(mm[i]).toFixed(1)}" y2="${y(mm[i]).toFixed(1)}"/>`;
    g += `<text class="ia-m${i === cur ? ' cur' : ''}" x="${cx.toFixed(1)}" y="${H - 6}" text-anchor="middle">${MES[i]}</text>`;
  }
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Aportes de cada mês, em verde os meses que bateram a meta do mês, com a sobra que ficou parada">
    <line class="ia-zero" x1="${m.l}" x2="${W - m.r}" y1="${y0.toFixed(1)}" y2="${y0.toFixed(1)}"/>${g}${mk}<rect class="ia-hv" x="0" y="${m.t}" width="${band.toFixed(1)}" height="${ih}" opacity="0" pointer-events="none"/></svg>`;
  const svg = el.firstChild; const hv = svg.querySelector('.ia-hv');
  const mostra = (e) => { const b = svg.getBoundingClientRect(); const j = Math.floor((e.clientX - b.left - m.l) / band); const i = ids[j]; if (j < 0 || j >= nb) { hideTip(); hv.setAttribute('opacity', '0'); return; }
    hv.setAttribute('x', (m.l + band * j).toFixed(1)); hv.setAttribute('opacity', '1'); const v = ap[i];
    const dv = Math.min(+C.dividendos[i] || 0, Math.max(0, v));
    showTip(`<b>${MES_LONGO[i]}</b><br>${v < 0 ? `Resgate: ${brl(-v)}` : `Aportado: ${brl(v)}${dv > 0 ? ` (${brl(v - dv)} do bolso e ${brl(dv)} de dividendos)` : ''}`}<br>Sobra do mês: ${brl(C.investAlocado[i])}${mm[i] > 0 ? `<br>Meta do mês: ${brl(mm[i])} · ${bate(i) ? 'bateu a meta' : `faltaram ${brl(mm[i] - Math.max(0, v))}`}` : ''}`, e.clientX, e.clientY); };
  svg.addEventListener('pointermove', mostra); svg.addEventListener('click', mostra);
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hideTip(); hv.setAttribute('opacity', '0'); } });
}
const altura = (el) => { const c = el && el.closest('.card'); return c ? Math.max(210, Math.min(360, c.clientHeight - 96)) : 210; };
function drawAssets() {
  if (S.screen !== 'app' || !S.plan || !S.C) return; drawCart(); const C = S.C; const cur = S.year === NOW_Y ? NOW_M : -1;
  if (S.view === 'inv' && $('#inv-aportes')) invAportesChart($('#inv-aportes'));
  if (S.view === 'inv' && $('.cmp')) cmpLigar();
  if (S.view === 'pro' && $('#pro-mes')) chartBarsPer($('#pro-mes'), { labels: MES, cur, height: altura($('#pro-mes')), aria: 'Proventos por mês: dividendos e renda fixa', bars: [{ color: 'var(--c3)', values: C.dividendos }, { color: 'var(--c1)', values: C.rentab }],
    tip: (i) => `<b>${MES_LONGO[i]}</b><br>Dividendos e rendimentos: ${brl0(C.dividendos[i])}<br>Renda fixa: ${brl0(C.rentab[i])}<br>Total: ${brl0(C.faturamento[i])}` });
}

/* ---------- Carteira ---------- */
function positions() { return posicoesDe(S.plans); }
function cartModel(opt) { // opt (opcional): { plan, C, mes, aporte } para calcular fora da tela (ex.: notificações)
  opt = opt || {}; const p = opt.plan || S.plan; const Cc = opt.C || S.C; const pos = positions();
  const items = p.ativos.map((a) => {
    const k = E.ativoKey(a); const e = S.profile.carteira.find((x) => x.k === k) || {}; const manual = e.valor != null;
    return { a, k, alvo: +e.alvo || 0, valor: manual ? Math.max(0, +e.valor) : Math.max(0, pos[k] || 0), auto: !manual, preco: e.preco > 0 ? +e.preco : null };
  });
  const sumAlvo = items.reduce((s, i) => s + i.alvo, 0); const total = items.reduce((s, i) => s + i.valor, 0);
  const mes = opt.mes != null ? opt.mes : S.cart.mes == null ? S.mes : S.cart.mes; const D = E.disponivelAporte({ C: Cc, mes, metaMes: Cc.metaAporteMes });
  const aporte = opt.aporte != null ? opt.aporte : S.cart.aporte != null ? S.cart.aporte : D.disponivel;
  const rb = E.rebalance(items.map((i) => ({ w: i.alvo, v: i.valor })), aporte);
  items.forEach((i, n) => {
    i.sug = rb.alloc[n]; i.pctAtual = total > 0 ? (i.valor / total) * 100 : 0; i.pctAlvo = rb.W > 0 ? (i.alvo / rb.W) * 100 : 0; i.desvio = i.pctAtual - i.pctAlvo;
    i.cotas = i.preco && i.sug > 0 ? Math.floor(i.sug / i.preco + 1e-9) : null;
  });
  return { items, sumAlvo, total, mes, D, aporte, rb };
}
/* Carteira: widgets organizáveis (mesmo sistema da Visão geral) sobre E.analiseCarteira.
   O editor de alvos é visual (controle deslizante e campos por ativo) e grava no perfil (S.profile.carteira). */
const CART_WIDGETS = [
  { id: 'assessor', nome: () => `Carteira recomendada pelo ${primeiroNome()}`, desc: 'Aparece quando o seu assessor enviar uma carteira recomendada.', tam: 6, tams: [6], padrao: () => true },
  { id: 'alvos', nome: () => 'Alvos e quanto você tem', desc: 'Ajuste o alvo de cada investimento e quanto você tem hoje nele.', tam: 6, tams: [4, 6], padrao: () => true },
  { id: 'aporte', nome: () => 'Onde investir este mês', desc: 'Quanto colocar em cada ativo para voltar ao alvo, sem vender nada.', tam: 4, tams: [3, 4, 6], padrao: () => true },
  { id: 'composicao', nome: () => 'Composição da carteira', desc: 'Peso de cada classe. Passe o mouse para ver os números e toque numa classe para ver os ativos dela.', tam: 2, tams: [2, 3, 4, 6], padrao: () => true },
  { id: 'ativos', nome: () => 'Cada investimento', desc: 'Um cartão por ativo: quanto tem, quanto pesa contra o alvo e quanto recebe neste aporte.', tam: 6, tams: [4, 6], padrao: () => true },
  { id: 'classes', nome: () => 'Equilíbrio por classe', desc: 'Cada classe hoje, no alvo e depois do aporte.', tam: 3, tams: [3, 4, 6], padrao: () => true },
  { id: 'desvios', nome: () => 'Mais longe do alvo', desc: 'Os ativos que mais fugiram do alvo e quanto falta em cada um.', tam: 3, tams: [2, 3, 4, 6], padrao: () => true },
];
const fmtPpS = (v) => `${v >= 0 ? '+' : '−'}${fmt1(Math.abs(v))} p.p.`;
const semAlvoMsg = '<p class="empty-s">Aparece quando houver alvos definidos.</p>';
function cartAnalise() {
  const M = cartModel();
  const K = E.analiseCarteira({ aporte: M.aporte, itens: M.items.map((i) => ({ nome: i.a.nome, classe: i.a.classe, tipo: i.a.tipo, alvo: i.alvo, valor: i.valor, preco: i.preco, k: i.k, auto: i.auto })) });
  return { M, K };
}
const barraCart = (hoje, depois, alvo, mx, cor) => `<span class="cart-m" aria-hidden="true"><i class="d" style="width:${((depois / mx) * 100).toFixed(1)}%${cor ? ';background:' + cor : ''}"></i><i class="h" style="width:${((hoje / mx) * 100).toFixed(1)}%"></i><b style="left:${((alvo / mx) * 100).toFixed(1)}%"></b></span>`;

/* ---- editor visual: alvo (%) e quanto tem hoje, ativo por ativo, em grupos por classe que abrem com a seta ---- */
const cedAberto = (classe) => !!(S.cedAberto && S.cedAberto[classe]);
function cedAlternar(btn, abrir) {
  const g = btn.closest('.ced-g'); if (!g) return; const ab = abrir == null ? !g.classList.contains('on') : abrir;
  S.cedAberto = S.cedAberto || {}; S.cedAberto[g.dataset.cedG] = ab;
  g.classList.toggle('on', ab); btn.setAttribute('aria-expanded', ab); const l = g.querySelector('.ced-lista'); if (l) l.hidden = !ab;
}
// leva ao ativo no editor: abre a classe dele, rola até a linha e foca o controle do alvo
function cedIrAtivo(k) {
  const r = [...document.querySelectorAll('.ced input[type="range"][data-cartv="alvo"]')].find((x) => x.dataset.k === k); if (!r) return;
  const g = r.closest('.ced-g'); if (g) cedAlternar(g.querySelector('.ced-gh'), true);
  const li = r.closest('.ced-l'); const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  li.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'center' }); li.classList.remove('ced-pulso'); void li.offsetWidth; li.classList.add('ced-pulso');
  setTimeout(() => r.focus({ preventScroll: true }), suave ? 350 : 0);
}
function cartSomaHtml(soma) {
  const ok = Math.abs(soma - 100) < 0.05; const tom = soma <= 0 ? '' : ok ? 'ok' : soma > 100 ? 'neg' : 'warn';
  return `<div class="ced-soma ${tom}"><div class="ced-soma-t"><b>Alvos somam <span id="ced-soma-v">${soma > 0.004 ? fmtPct(soma) : '0%'}</span></b><small>${soma <= 0 ? 'Comece pela referência do seu perfil ou distribua igualmente.' : ok ? 'Tudo certo: a carteira está 100% definida.' : soma > 100 ? `Passou ${fmtPct(soma - 100)} do total. Normalize ou reduza algum alvo.` : `Faltam ${fmtPct(100 - soma)} para completar. Normalize ou aumente algum alvo.`}</small></div>
    <span class="ced-soma-b" aria-hidden="true"><i style="width:${Math.min(100, soma).toFixed(1)}%"></i></span></div>`;
}
function cartEditorHtml(M, K) {
  const perfil = S.profile.perfilInvestidor && S.profile.perfilInvestidor.resultado ? E.PERFIS[S.profile.perfilInvestidor.resultado] : null;
  const grupos = []; K.itens.forEach((i) => { let g = grupos.find((x) => x.classe === i.classe && x.tipo === i.tipo); if (!g) { g = { classe: i.classe, tipo: i.tipo, itens: [] }; grupos.push(g); } g.itens.push(i); });
  const linha = (i) => { const id = 'ced-' + E.norm(i.k).replace(/[^a-z0-9]+/g, '-');
    return `<li class="ced-l"><div class="ced-n"><b>${esc(i.nome)}</b><small>hoje ${fmtPct(i.pctAtual)} da carteira${i.desvio <= -0.5 ? ` · <em class="under">${fmtPpS(i.desvio)}</em>` : i.desvio >= 0.5 ? ` · <em class="over">${fmtPpS(i.desvio)}</em>` : ''}</small></div>
      <div class="ced-alvo"><label class="sr" for="${id}-r">Alvo de ${esc(i.nome)}</label><input id="${id}-r" type="range" min="0" max="100" step="0.5" value="${i.w}" data-cartv="alvo" data-k="${esc(i.k)}" style="--f:${(i.w / 100).toFixed(4)}" aria-label="Alvo de ${esc(i.nome)} em porcentagem">
        <span class="ced-pct"><input class="in-s" inputmode="decimal" value="${String(i.w).replace('.', ',')}" data-cartv="alvo" data-k="${esc(i.k)}" aria-label="Alvo de ${esc(i.nome)} em porcentagem"><span aria-hidden="true">%</span></span></div>
      <div class="ced-val"><label><small>Tenho hoje${i.auto ? ' <em>(soma dos aportes)</em>' : ''}</small><input class="in-s" inputmode="decimal" data-cartv="valor" data-k="${esc(i.k)}"${oculto() ? ' placeholder="Valor oculto"' : ''} value="${oculto() ? '' : nf.format(i.v)}" aria-label="Quanto você tem hoje em ${esc(i.nome)}, em reais"></label>${i.auto ? '' : `<button class="lnk ced-auto" data-act="cart-valor-auto" data-k="${esc(i.k)}" title="Voltar a usar a soma dos aportes">Usar soma dos aportes</button>`}</div>
      <div class="ced-pre"><label><small>Preço da cota</small><input class="in-s" inputmode="decimal" data-cartv="preco" data-k="${esc(i.k)}" placeholder="opcional" value="${i.preco ? nf.format(i.preco) : ''}" aria-label="Preço da cota de ${esc(i.nome)}, opcional"></label></div></li>`; };
  const ini = S.profile.patrimonioInicial; const aviso = ini > M.total + 1 ? `<div class="notice">Você informou ${brl0(ini)} de patrimônio inicial, mas só ${brl0(M.total)} estão distribuídos nos ativos. Ajuste o "Tenho hoje" de cada ativo para um rebalanceamento preciso.</div>` : '';
  return `<section class="card ced" id="cart-alvos"><div class="c-h"><h3>Alvos e quanto você tem</h3></div>
    ${cartSomaHtml(K.somaAlvo)}
    <div class="btn-row ced-acts">${perfil ? `<button class="btn sm${K.somaAlvo <= 0 ? ' primary' : ''}" data-act="cart-perfil">Usar a alocação do perfil ${esc(perfil.nome.toLowerCase())}</button>` : ''}<button class="btn sm" data-act="cart-equal">Distribuir igualmente</button>${Math.abs(K.somaAlvo - 100) >= 0.05 && K.somaAlvo > 0 ? '<button class="btn sm" data-act="cart-norm">Normalizar para 100%</button>' : ''}<button class="btn ghost sm" data-act="cart-clear">Zerar alvos</button></div>
    ${aviso}<div class="ced-gs">${grupos.map((g, n) => { const ab = cedAberto(g.classe); const alvo = g.itens.reduce((s, i) => s + i.w, 0); const hoje = g.itens.reduce((s, i) => s + i.pctAtual, 0); const mx = Math.max(alvo, hoje, 1);
      return `<div class="ced-g${ab ? ' on' : ''}" data-ced-g="${esc(g.classe)}"><button class="ced-gh" data-act="ced-g" aria-expanded="${ab}" aria-controls="ced-g-${n}">
        <i class="ced-dot" style="background:${PAL[n % 6]}" aria-hidden="true"></i><span class="ced-gn"><b>${esc(g.classe)}</b><small>${g.itens.length} ${g.itens.length === 1 ? 'ativo' : 'ativos'} · hoje ${fmtPct(hoje)}</small></span>
        <span class="ced-gb" aria-hidden="true"><i class="h" style="width:${((hoje / mx) * 100).toFixed(1)}%"></i><i class="a" style="width:${((alvo / mx) * 100).toFixed(1)}%;--bc:${PAL[n % 6]}"></i></span>
        <span class="ced-ga" data-ced-ga>${fmtPct(alvo)}<small>alvo</small></span><span class="ced-chev" aria-hidden="true">${I.chev}</span></button>
        <ul class="ced-lista" id="ced-g-${n}"${ab ? '' : ' hidden'}>${g.itens.map(linha).join('')}</ul></div>`; }).join('')}</div>
    <p class="cap">Toque numa classe para abrir os ativos dela. Arraste o controle ou digite o alvo. "Tenho hoje" começa pela soma dos aportes de todos os anos; digite o valor atual se ele mudou. O preço da cota é opcional e serve para estimar quantas cotas comprar.</p></section>`;
}

/* ---- composição interativa: um anel por classe; tocar numa fatia entra na classe e mostra os ativos de dentro.
   Dentro da classe, tocar num ativo leva ao alvo dele no editor. Estado só da sessão em S.cmpClasse. ---- */
let CMP_SEGS = []; // fatias desenhadas agora: { nome, valor, sub, k? }
function cartComposicaoHtml(K, mini) { // mini: versão compacta da Visão geral (anel menor e as 5 primeiras linhas; o resto ao expandir)
  if (!(K.total > 0)) return '<p class="empty-s">A composição aparece depois do primeiro aporte.</p>';
  const temAlvo = K.somaAlvo > 0; const nc = K.classes.findIndex((c) => c.classe === S.cmpClasse); const cls = nc >= 0 ? K.classes[nc] : null;
  if (!cls) S.cmpClasse = null;
  const tons = (n, m) => (m <= 1 ? [PAL[n % 6]] : Array.from({ length: m }, (_, j) => `color-mix(in srgb, ${PAL[n % 6]} ${Math.round(100 - (j * 55) / (m - 1))}%, var(--surface))`));
  let fatias;
  if (cls) {
    const its = K.itens.filter((i) => i.classe === cls.classe && i.v > 0).sort((x, y) => y.v - x.v); const cores = tons(nc, its.length);
    fatias = its.map((i, j) => ({ nome: i.nome, valor: i.v, pct: cls.valor > 0 ? (i.v / cls.valor) * 100 : 0, cor: cores[j], k: i.k,
      sub: `${fmtPct(cls.valor > 0 ? (i.v / cls.valor) * 100 : 0)} da classe · ${fmtPct(i.pctAtual)} da carteira${temAlvo ? ` · alvo ${fmtPct(i.pctAlvo)}` : ''}`,
      li: `${fmtPct(cls.valor > 0 ? (i.v / cls.valor) * 100 : 0)}`, liSub: temAlvo ? `${fmtPct(i.pctAtual)} da carteira · alvo ${fmtPct(i.pctAlvo)}` : `${fmtPct(i.pctAtual)} da carteira` }));
  } else {
    fatias = K.classes.map((c, n) => { const d = c.atual - c.alvo;
      return { nome: c.classe, valor: c.valor, pct: c.atual, cor: PAL[n % 6], li: fmtPct(c.atual), liSub: temAlvo ? `alvo ${fmtPct(c.alvo)}` : '',
        sub: temAlvo ? `${fmtPct(c.atual)} hoje · ${fmtPct(c.alvo)} alvo${Math.abs(d) >= 0.05 ? ` (${fmtPpS(d)})` : ''}` : `${fmtPct(c.atual)} da carteira` }; });
  }
  CMP_SEGS = fatias;
  const C = 2 * Math.PI * 76; let ac = 0; const gap = fatias.filter((f) => f.pct > 0.3).length > 1 ? 2.5 : 0;
  const segs = fatias.map((f, n) => { const l = (f.pct / 100) * C; const out = l > 0.5 ? `<circle class="cmp-seg" data-cseg="${n}" r="76" cx="100" cy="100" stroke="${f.cor}" stroke-dasharray="${Math.max(0.01, l - gap).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-ac).toFixed(2)}" style="--i:${n};--bc:${f.cor}"><title>${esc(f.nome)}</title></circle>` : ''; ac += l; return out; }).join('');
  const total = cls ? cls.valor : K.total; const rotulo = cls ? cls.classe : 'Total hoje';
  const subTotal = cls ? `${fmtPct(cls.atual)} da carteira${temAlvo ? ` · alvo ${fmtPct(cls.alvo)}` : ''}` : `${K.classes.length} ${K.classes.length === 1 ? 'classe' : 'classes'} · toque para abrir`;
  const lista = fatias.map((f, n) => `<li><button class="cmp-li" data-act="cart-seg" data-cseg="${n}"${f.k ? ` data-k="${esc(f.k)}"` : ''}><i style="background:${f.cor}"></i><span>${esc(f.nome)}</span><b>${f.li}</b>${f.liSub ? `<small>${f.liSub}</small>` : ''}<span class="cmp-ir" aria-hidden="true">${I.chev}</span></button></li>`).join('');
  const mais = mini && fatias.length > 5 ? `<li class="cmp-mais"><button class="lnk strong" data-act="cart-expandir" data-w="composicao">Ver ${cls ? 'todos os ' + fatias.length + ' ativos' : 'as ' + fatias.length + ' classes'}</button></li>` : '';
  return `<div class="cmp${cls ? ' dentro' : ''}${mini ? ' mini' : ''}" data-cmp-total="${esc(brl0(total))}" data-cmp-rot="${esc(rotulo)}" data-cmp-sub="${esc(subTotal)}">
    ${cls ? `<button class="btn ghost sm cmp-volta" data-act="cart-cmp-volta">${I.chev} Todas as classes</button>` : ''}
    <div class="cmp-g"><svg viewBox="0 0 200 200" role="img" aria-label="${cls ? `Ativos de ${esc(cls.classe)}` : 'Composição da carteira por classe'}"><circle class="cmp-trilho" r="76" cx="100" cy="100"/><g transform="rotate(-90 100 100)">${segs}</g></svg>
      <div class="cmp-c" aria-live="polite"><small id="cmp-c-k">${esc(rotulo)}</small><b id="cmp-c-v">${brl0(total)}</b><span id="cmp-c-s">${subTotal}</span></div></div>
    <ul class="cmp-l">${lista}${mais}</ul></div>`;
}
// destaca uma fatia (ou volta ao total quando n é null), sem redesenhar
function cartSeg(n) {
  const raiz = document.querySelector('.cmp'); if (!raiz) return; const f = n == null ? null : CMP_SEGS[n];
  raiz.classList.toggle('foco', !!f);
  raiz.querySelectorAll('[data-cseg]').forEach((e) => e.classList.toggle('on', !!f && +e.dataset.cseg === +n));
  const k = document.getElementById('cmp-c-k'); const v = document.getElementById('cmp-c-v'); const s = document.getElementById('cmp-c-s'); if (!k) return;
  if (!f) { k.textContent = raiz.dataset.cmpRot; v.textContent = raiz.dataset.cmpTotal; s.textContent = raiz.dataset.cmpSub; return; }
  k.textContent = f.nome; v.textContent = brl0(f.valor); s.textContent = f.sub;
}
// tocar numa fatia: fora de uma classe, entra nela; dentro, leva ao ativo no editor
function cartCmpAbrir(n) {
  const f = CMP_SEGS[n]; if (!f) return;
  if (f.k) { if (document.querySelector('.ced')) cedIrAtivo(f.k); else { S.view = 'cart'; render(); setTimeout(() => cedIrAtivo(f.k), 60); } return; } // na Visão geral, o ativo leva à Carteira
  S.cmpClasse = f.nome; cartCmpTrocar();
}
function cartCmpTrocar() {
  const velho = document.querySelector('.cmp'); if (!velho) return; const { K } = cartAnalise();
  const t = document.createElement('div'); t.innerHTML = cartComposicaoHtml(K, velho.classList.contains('mini')); const novo = t.firstElementChild; novo.classList.add('troca');
  velho.replaceWith(novo); cmpLigar(); const foco = novo.querySelector('.cmp-volta') || novo.querySelector('.cmp-li'); if (foco) foco.focus({ preventScroll: true });
}

function viewCart() {
  if (gated('cart')) return `${pageHead('Carteira', 'Alvo da carteira e onde investir a cada aporte.')}${lockedHtml('cart')}`;
  const p = S.plan;
  if (!p.ativos.length) return `${pageHead('Carteira', 'Alvo da carteira e onde investir a cada aporte.')}<div class="empty-state"><h2>Cadastre seus ativos primeiro</h2><p>A Carteira usa os ativos da aba Investimentos. Adicione-os lá ou importe a planilha com a carteira que o seu assessor montou.</p><div class="btn-row"><button class="btn primary" data-act="nav" data-view="inv">Ir para Investimentos</button><button class="btn" data-act="admin-open">Importar planilha</button></div></div>`;
  const { M, K } = cartAnalise(); const semAlvo = K.somaAlvo <= 0;
  const html = {};
  const rec = recPainelHtml(); if (rec) html.assessor = rec;
  html.alvos = cartEditorHtml(M, K);
  // onde investir este mês
  const cm = K.itens.filter((i) => i.sug > 0.004).sort((a, b) => b.sug - a.sug);
  const mesSel = `<select data-cart="mes" aria-label="Mês do aporte">${MES.map((m, i) => `<option value="${i}" ${M.mes === i ? 'selected' : ''}>${m}</option>`).join('')}</select>`;
  const entrada = `<div class="cart-in2"><label class="fld"><span>Mês</span>${mesSel}</label><label class="fld"><span>Valor do aporte <small>${S.cart.aporte == null ? '(disponível no mês)' : '(digitado)'}</small></span><input class="in-s" data-cart="aporte" inputmode="decimal"${oculto() ? ' placeholder="Valor oculto"' : ''} value="${oculto() ? '' : nf.format(M.aporte)}" aria-label="Valor do aporte em reais"></label>${S.cart.aporte != null ? '<button class="btn sm" data-act="cart-auto">Usar o disponível</button>' : ''}</div>
    <p class="cap">Disponível: sobra de ${brl0(M.D.sobra)} (entradas menos gastos de ${MES_LONGO[M.mes]}) menos ${brl0(M.D.aportado)} já investidos${M.D.faltaMeta == null ? '' : M.D.faltaMeta > 0 ? `. Faltam ${brl0(M.D.faltaMeta)} para a meta de ${brl0(M.D.meta)}` : `. Meta de ${brl0(M.D.meta)} batida`}.</p>`;
  const lista = semAlvo ? '<p class="empty-s">Defina os alvos acima (ou use a alocação do seu perfil) para ver onde investir.</p>' : M.aporte <= 0 ? `<p class="empty-s">${S.cart.aporte == null ? `Nada disponível em ${MES_LONGO[M.mes]}: a sobra do mês já foi aportada ou os gastos passaram das entradas. Digite um valor para simular.` : 'Informe um valor de aporte maior que zero.'}</p>`
    : `<ol class="cart-sug">${cm.map((i) => { const mx = Math.max(i.pctAlvo, i.pctDepois, i.pctAtual, 1) * 1.15;
        return `<li><span class="cart-sug-n"><b>${esc(i.nome)}</b><small>${esc(i.classe)} · hoje ${fmtPct(i.pctAtual)}, depois ${fmtPct(i.pctDepois)}, alvo ${fmtPct(i.pctAlvo)}</small>${barraCart(i.pctAtual, i.pctDepois, i.pctAlvo, mx)}</span>
          <span class="cart-sug-v"><b>${brl(i.sug)}</b>${i.cotas != null ? `<small>≈ ${i.cotas} ${i.cotas === 1 ? 'cota' : 'cotas'}</small>` : ''}</span></li>`; }).join('')}</ol>
      <div class="cart-sug-f"><button class="btn primary" data-act="cart-register">Registrar em Investimentos (${MES[M.mes]})</button><p class="cap">O aporte vai primeiro para o que está mais abaixo do alvo, sem vender nada. Barra clara: hoje; escura: depois do aporte; traço: alvo.</p></div>`;
  html.aporte = `<section class="card cart-exp-card" data-exp="aporte"><div class="c-h"><h3>Onde investir${M.aporte > 0 ? ' ' + brl(M.aporte) : ''} em ${MES_LONGO[M.mes]}</h3>${cartExpBtn('aporte')}</div>${entrada}${lista}</section>`;
  html.composicao = `<section class="card cart-exp-card" data-exp="composicao"><div class="c-h"><h3>Composição da carteira</h3>${cartExpBtn('composicao')}</div>${cartComposicaoHtml(K)}</section>`;
  // cada investimento
  const tile = (i) => { const prog = i.pctAlvo > 0 ? Math.min(1, i.pctAtual / i.pctAlvo) : 0; const d = i.desvio;
    const st = semAlvo ? '' : i.pctAlvo <= 0 ? '<span class="ca-st">Sem alvo</span>' : Math.abs(d) < 0.5 ? '<span class="ca-st ok">No alvo</span>' : d < 0 ? `<span class="ca-st under">${fmtPpS(d)} abaixo</span>` : `<span class="ca-st over">${fmtPpS(d)} acima</span>`;
    return `<li class="ca"><div class="ca-h"><b>${esc(i.nome)}</b><small>${esc(i.classe)}</small></div><b class="ca-v">${brl0(i.v)}</b>
      <div class="ca-p"><span>${fmtPct(i.pctAtual)} <small>hoje</small></span>${semAlvo ? '' : `<span>${fmtPct(i.pctAlvo)} <small>alvo</small></span>`}</div>
      ${semAlvo ? '' : `<span class="ca-bar" aria-hidden="true"><i style="width:${(prog * 100).toFixed(1)}%"></i></span>`}<div class="ca-f">${st}${i.sug > 0.004 ? `<span class="ca-sug">+${brl0(i.sug)} neste aporte</span>` : ''}</div></li>`; };
  html.ativos = `<section class="card"><div class="c-h"><h3>Cada investimento</h3><small class="c-note">${K.itens.length} ${K.itens.length === 1 ? 'ativo' : 'ativos'}</small></div><ul class="ca-grid">${K.itens.slice().sort((a, b) => b.v - a.v).map(tile).join('')}</ul></section>`;
  // equilíbrio por classe
  const mxC = Math.max(1, ...K.classes.map((c) => Math.max(c.atual, c.alvo, c.depois))) * 1.1;
  html.classes = `<section class="card"><div class="c-h"><h3>Equilíbrio por classe</h3></div>${semAlvo ? semAlvoMsg : `<ul class="cart-cls">${K.classes.map((c, n) => { const d = c.atual - c.alvo;
      return `<li><div class="cart-cls-h"><b>${esc(c.classe)}</b><span>${fmtPct(c.atual)} <small>hoje</small> · ${fmtPct(c.alvo)} <small>alvo</small></span></div>${barraCart(c.atual, c.depois, c.alvo, mxC, PAL[n % 6])}
      <small class="cart-cls-d ${d < -0.05 ? 'under' : d > 0.05 ? 'over' : ''}">${Math.abs(d) < 0.05 ? 'No alvo' : fmtPpS(d) + (d < 0 ? ' abaixo do alvo' : ' acima do alvo')}${c.sug > 0 ? ` · recebe ${brl0(c.sug)} neste aporte` : ''}</small></li>`; }).join('')}</ul>`}</section>`;
  // mais longe do alvo
  html.desvios = `<section class="card"><div class="c-h"><h3>Mais longe do alvo</h3></div>${semAlvo ? semAlvoMsg : K.maisLonge.length ? `<ul class="g-lista">${K.maisLonge.map((i) => `<li><div class="g-li"><span><b>${esc(i.nome)}</b><small>${esc(i.classe)} · hoje ${fmtPct(i.pctAtual)}, alvo ${fmtPct(i.pctAlvo)}</small></span><span class="g-li-v"><b class="${i.desvio < 0 ? 'under' : 'over'}">${fmtPpS(i.desvio)}</b><small>${i.desvio < 0 ? (i.falta > 0 ? `faltam ${brl0(i.falta)} depois deste aporte` : 'chega ao alvo com este aporte') : 'sem novos aportes por enquanto'}</small></span></div></li>`).join('')}</ul>` : '<p class="empty-s">Todos os ativos estão a menos de meio ponto do alvo.</p>'}</section>`;
  return `${pageHead('Carteira', 'Defina o alvo de cada investimento e veja, a cada aporte, onde investir para manter tudo equilibrado.')}${telaWidgetsHtml('carteira', html)}
    <p class="cap disc">Ferramenta de organização. As sugestões seguem os percentuais-alvo definidos por você e não constituem recomendação individual de investimento.</p>`;
}

/* campos do editor: o alvo acompanha o dedo sem redesenhar; ao soltar (change), grava e atualiza a tela */
function cartCampoVivo(t) {
  if (t.dataset.cartv !== 'alvo') return;
  const v = t.type === 'range' ? +t.value : E.parseValor(t.value); if (Number.isNaN(v)) return;
  const linha = t.closest('.ced-l'); if (linha) { const r = linha.querySelector('input[type="range"]'); const n = linha.querySelector('.ced-pct input');
    if (r && r !== t) { r.value = v; } if (r) r.style.setProperty('--f', (Math.max(0, Math.min(100, v)) / 100).toFixed(4)); if (n && n !== t) n.value = String(v).replace('.', ','); }
  // soma ao vivo: todos os alvos do editor
  let soma = 0; document.querySelectorAll('.ced input[type="range"][data-cartv="alvo"]').forEach((r) => { soma += +r.value || 0; });
  const sv = document.getElementById('ced-soma-v'); if (sv) sv.textContent = soma > 0.004 ? fmtPct(soma) : '0%';
  const sb = document.querySelector('.ced-soma-b i'); if (sb) sb.style.width = Math.min(100, soma).toFixed(1) + '%';
  const g = t.closest('.ced-g'); const ga = g && g.querySelector('[data-ced-ga]');
  if (ga) { let sg = 0; g.querySelectorAll('input[type="range"][data-cartv="alvo"]').forEach((r) => { sg += +r.value || 0; }); ga.firstChild.textContent = fmtPct(sg); }
}
function cartCampoGravar(t) {
  const e = cartEntry(t.dataset.k, true); const campo = t.dataset.cartv; const txt = String(t.value || '').trim();
  if (campo === 'alvo') { const v = t.type === 'range' ? +t.value : E.parseValor(txt); if (Number.isNaN(v) || v < 0 || v > 100) { toast('Informe um alvo entre 0 e 100%.'); render(); return; } e.alvo = E.r2(v); }
  else if (campo === 'valor') { if (oculto() && !txt) return; if (!txt) { e.valor = null; } else { const v = parseReais(txt); if (Number.isNaN(v) || v < 0) { toast('Valor inválido. Use números como 1.234,56'); render(); return; } e.valor = E.r2(v); } }
  else if (campo === 'preco') { if (!txt) e.preco = null; else { const v = parseReais(txt); if (Number.isNaN(v) || v < 0) { toast('Preço inválido.'); render(); return; } e.preco = v > 0 ? E.r2(v) : null; } }
  touch('profile'); renderLater();
}
/* expandir "Onde investir" e "Composição" na tela: o cartão vai para uma camada por cima da página (#cart-exp),
   fora da grade de widgets (que tem contenção de layout). Cada desenho recoloca o cartão novo lá; fechar volta ao normal. */
const CART_I_EXP = ic('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>');
const cartExpBtn = (id) => { const on = S.cartExp === id;
  return `<button type="button" class="icon-btn cart-exp" data-act="cart-expandir" data-w="${id}" aria-label="${on ? 'Fechar' : 'Expandir na tela'}" title="${on ? 'Fechar' : 'Expandir na tela'}">${on ? I.x : CART_I_EXP}</button>`; };
function cartExpandir(id) { S.cartExp = S.cartExp === id ? null : id; render(); const b = document.querySelector(`.cart-exp[data-w="${id}"]`); if (b) b.focus({ preventScroll: true }); }
function cartExpFechar() { if (!S.cartExp) return; const id = S.cartExp; S.cartExp = null; render(); const b = document.querySelector(`.cart-exp[data-w="${id}"]`); if (b) b.focus({ preventScroll: true }); }
function cartExpAplica() {
  const velho = document.getElementById('cart-exp'); const ativo = !!S.cartExp && (S.view === 'cart' || S.view === 'geral' || S.view === 'inv') && S.screen === 'app';
  const card = ativo ? document.querySelector(`#view [data-exp="${S.cartExp}"]`) : null;
  // atualização parcial (ex.: entrar numa classe da composição): o cartão já está na camada e a página não foi redesenhada
  if (ativo && !card && velho && velho.querySelector(`[data-exp="${S.cartExp}"]`)) return;
  if (velho) velho.remove();
  document.documentElement.classList.toggle('sem-rolagem', !!card || (typeof AB !== 'undefined' && !!AB)); /* o globo aberto também trava a rolagem */ if (!card) { S.cartExp = null; return; }
  const host = document.createElement('div'); host.id = 'cart-exp'; host.className = 'cart-exp-host'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true');
  host.setAttribute('aria-label', card.querySelector('h3') ? card.querySelector('h3').textContent : 'Cartão expandido');
  host.addEventListener('click', (e) => { if (e.target === host) cartExpFechar(); });
  const lugar = document.createElement('div'); lugar.className = 'cart-exp-lugar'; lugar.style.height = card.offsetHeight + 'px'; card.replaceWith(lugar); // segura o espaço na grade
  card.classList.add('expandido'); host.appendChild(card); document.body.appendChild(host);
}
function drawCart() {
  cartExpAplica();
  if (S.view !== 'cart' || !S.plan || !S.plan.ativos.length || gated('cart')) return;
  cmpLigar();
}
// liga as interações da composição (Carteira e o widget da Visão geral usam a mesma)
function cmpLigar() {
  const raiz = document.querySelector('.cmp'); if (!raiz || raiz.dataset.ligado) return; raiz.dataset.ligado = '1';
  // passar o mouse ou focar uma fatia (ou a linha da legenda) mostra os números dela no centro
  raiz.addEventListener('pointerover', (ev) => { const s = ev.target.closest && ev.target.closest('[data-cseg]'); if (s && ev.pointerType === 'mouse') cartSeg(+s.dataset.cseg); });
  raiz.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') cartSeg(null); });
  raiz.addEventListener('focusin', (ev) => { const s = ev.target.closest('[data-cseg]'); if (s) cartSeg(+s.dataset.cseg); });
  raiz.addEventListener('focusout', (ev) => { if (!raiz.contains(ev.relatedTarget)) cartSeg(null); });
  // toque ou clique numa fatia do gráfico: entra na classe (ou leva ao ativo, quando já está dentro dela)
  raiz.querySelector('svg').addEventListener('click', (ev) => { const s = ev.target.closest('[data-cseg]'); if (s) cartCmpAbrir(+s.dataset.cseg); });
}
function cartNormalize() {
  const items = cartModel().items; const s = items.reduce((a, i) => a + i.alvo, 0); if (s <= 0) { toast('Defina ao menos um alvo antes de normalizar.'); return; }
  items.forEach((i) => { if (i.alvo > 0) cartEntry(i.k, true).alvo = E.r2((i.alvo / s) * 100); });
  const rest = items.map((i) => cartEntry(i.k, false)).filter((e) => e && e.alvo > 0); const diff = E.r2(100 - rest.reduce((a, e) => a + e.alvo, 0));
  if (rest.length && diff) rest[rest.length - 1].alvo = E.r2(rest[rest.length - 1].alvo + diff);
  touch('profile'); render();
}
function setAlvos(map) { cartModel().items.forEach((i) => { cartEntry(i.k, true).alvo = map(i); }); touch('profile'); render(); }
function cartEqual() { const n = S.plan.ativos.length; if (!n) return; let acc = 0; let idx = 0; setAlvos(() => { idx++; const v = idx === n ? E.r2(100 - acc) : E.r2(100 / n); acc += v; return v; }); }
function cartClear() { S.profile.carteira.forEach((e) => { e.alvo = 0; }); touch('profile'); render(); }
function cartPerfil() {
  const r = S.profile.perfilInvestidor && S.profile.perfilInvestidor.resultado; if (!r) return;
  const al = E.PERFIS[r].alvo; const ativos = S.plan.ativos; const nRf = ativos.filter((a) => a.tipo === 'RENDA FIXA').length; const nRv = ativos.length - nRf;
  let wRf = nRf ? al.rendaFixa : 0; let wRv = nRv ? al.bolsa : 0; const t = wRf + wRv; wRf = (wRf / t) * 100; wRv = (wRv / t) * 100;
  const apply = () => { const seen = { rf: 0, rv: 0 }; setAlvos((i) => { const rf = i.a.tipo === 'RENDA FIXA'; const n = rf ? nRf : nRv; seen[rf ? 'rf' : 'rv']++; const w = rf ? wRf : wRv; return seen[rf ? 'rf' : 'rv'] === n ? E.r2(w - E.r2(w / n) * (n - 1)) : E.r2(w / n); }); toast('Alvos preenchidos com a alocação do seu perfil. Ajuste como preferir.'); };
  if (S.profile.carteira.some((e) => e.alvo > 0)) confirmBox('Substituir os alvos atuais?', 'Os percentuais-alvo serão recalculados com base no seu perfil de investidor, dividindo igualmente entre os ativos de cada tipo.', 'Substituir', apply); else apply();
}
function cartRegister() {
  const M = cartModel(); const list = M.items.filter((i) => i.sug > 0.004); if (!list.length) return;
  confirmBox(`Registrar aportes de ${MES_LONGO[M.mes]}?`, `Os ${list.length} valores sugeridos (${brl(list.reduce((a, i) => a + i.sug, 0))}) serão somados aos aportes de ${MES_LONGO[M.mes]} na aba Investimentos.`, 'Registrar', () => {
    list.forEach((i) => { i.a.ap[M.mes] = E.r2((+i.a.ap[M.mes] || 0) + i.sug); }); S.cart.aporte = null; touch('plan'); render(); toast('Aportes registrados em Investimentos.');
  });
}

/* ---------- modal de ativo ---------- */
function suggest(level, a) {
  const own = new Set(); const T = E.TAXONOMIA;
  if (level === 'tipo') Object.keys(T).forEach((k) => own.add(k));
  if (level === 'classe' && T[a.tipo]) Object.keys(T[a.tipo]).forEach((k) => own.add(k));
  if (level === 'grupo' && T[a.tipo] && T[a.tipo][a.classe] && !Array.isArray(T[a.tipo][a.classe])) Object.keys(T[a.tipo][a.classe]).forEach((k) => own.add(k));
  if (level === 'subgrupo' && T[a.tipo] && T[a.tipo][a.classe] && Array.isArray(T[a.tipo][a.classe][a.grupo])) T[a.tipo][a.classe][a.grupo].forEach((k) => own.add(k));
  S.plan.ativos.forEach((x) => {
    if (level === 'tipo') own.add(x.tipo); else if (x.tipo === a.tipo && level === 'classe') own.add(x.classe);
    else if (x.tipo === a.tipo && x.classe === a.classe && level === 'grupo' && x.grupo) own.add(x.grupo);
    else if (x.tipo === a.tipo && x.classe === a.classe && x.grupo === a.grupo && level === 'subgrupo' && x.subgrupo) own.add(x.subgrupo);
  });
  return [...own];
}
// Novo aporte: num ativo que já existe ou num ativo novo, cadastrado aqui mesmo; o valor soma ao mês escolhido na planilha do ano
function openAporte() {
  const p = S.plan; const grupos = {}; p.ativos.forEach((a) => { (grupos[a.classe] = grupos[a.classe] || []).push(a); }); const tem = p.ativos.length > 0;
  const form = openModal({ title: 'Novo aporte', ok: 'Registrar',
    body: `${tem ? '<div class="seg ap-modo" role="radiogroup" aria-label="Onde aplicar"><label><input type="radio" name="modo" value="ex" checked><span>Ativo que já tenho</span></label><label><input type="radio" name="modo" value="novo"><span>Ativo novo</span></label></div>' : '<input type="hidden" name="modo" value="novo">'}
      <div data-modo="ex"${tem ? '' : ' hidden'}><label class="fld"><span>Ativo</span><select name="ativo">${Object.keys(grupos).map((c) => `<optgroup label="${esc(c)}">${grupos[c].map((a) => `<option value="${esc(a.id)}">${esc(a.nome)}</option>`).join('')}</optgroup>`).join('')}</select></label></div>
      <div data-modo="novo"${tem ? ' hidden' : ''}><label class="fld"><span>Nome do ativo <small>(código, banco ou título)</small></span><input name="nome" autocomplete="off" placeholder="Ex.: PETR4, CDB Banco X"></label>
        <div class="fld-2"><label class="fld"><span>Tipo</span><input name="tipo" list="dl-tipo" value="BOLSA DE VALORES"></label><label class="fld"><span>Classe</span><input name="classe" list="dl-classe" placeholder="Ex.: Ações"></label></div></div>
      <div class="fld-2"><label class="fld"><span>Operação</span><select name="op"><option value="1">Aporte</option><option value="-1">Resgate</option></select></label><label class="fld"><span>Mês</span><select name="mes">${MES_LONGO.map((m, i) => `<option value="${i}"${i === S.mes ? ' selected' : ''}>${m}</option>`).join('')}</select></label></div>
      <label class="fld"><span>Valor (R$)</span><input name="valor" inputmode="decimal" placeholder="0,00" autocomplete="off"></label>
      <p class="mmsg small">O valor é somado ao que o ativo já tem no mês, em ${S.year}.</p><datalist id="dl-tipo"></datalist><datalist id="dl-classe"></datalist>`,
    onOk: (d, err) => {
      const v = parseReais(d.valor || ''); const m = +d.mes; let a;
      if (d.modo === 'novo') {
        const tipo = matchCase(d.tipo, suggest('tipo', {})).toUpperCase(); const classe = matchCase(d.classe, suggest('classe', { tipo })); const nome = (d.nome || '').trim();
        if (!tipo || !classe || !nome) return bad(err, 'Preencha nome, tipo e classe do ativo novo.');
        if (!(v > 0)) return bad(err, 'Informe um valor maior que zero, como 1.500,00.');
        a = ativoInserir({ tipo, classe, grupo: null, subgrupo: null, nome });
      } else {
        a = p.ativos.find((x) => x.id === d.ativo); if (!a) return bad(err, 'Escolha o ativo.');
        if (!(v > 0)) return bad(err, 'Informe um valor maior que zero, como 1.500,00.');
      }
      a.ap[m] = E.r2((+a.ap[m] || 0) + v * +d.op); commit(); toast(`${+d.op > 0 ? 'Aporte' : 'Resgate'} registrado em ${a.nome}, ${MES_LONGO[m]}.`);
    } });
  const fill = (id, arr) => { $('#' + id).innerHTML = arr.map((x) => `<option value="${esc(x)}"></option>`).join(''); };
  const sync = () => { const novo = form.elements.modo.value === 'novo'; form.querySelector('[data-modo="ex"]').hidden = novo; form.querySelector('[data-modo="novo"]').hidden = !novo;
    fill('dl-tipo', suggest('tipo', {})); fill('dl-classe', suggest('classe', { tipo: matchCase(form.elements.tipo.value, suggest('tipo', {})) })); };
  form.addEventListener('input', sync); sync();
}
// insere o ativo junto dos parecidos (mesmo tipo, classe, grupo e subgrupo), como no cadastro
function ativoInserir(a) {
  const p = S.plan; const na = Object.assign({ id: uid(), ap: z12(), pr: z12() }, a); const same = (x, lv) => lv.every((k) => (x[k] || null) === (na[k] || null)); let at = -1;
  for (const lv of [['tipo', 'classe', 'grupo', 'subgrupo'], ['tipo', 'classe', 'grupo'], ['tipo', 'classe'], ['tipo']]) { for (let i = p.ativos.length - 1; i >= 0; i--) if (same(p.ativos[i], lv)) { at = i; break; } if (at >= 0) break; }
  p.ativos.splice(at >= 0 ? at + 1 : p.ativos.length, 0, na); return na;
}
const matchCase = (val, list) => { const t = (val || '').trim(); const f = list.find((x) => x.toLowerCase() === t.toLowerCase()); return f || t; };
function openAtivo(id) {
  const p = S.plan; const a0 = id ? p.ativos.find((x) => x.id === id) : null;
  const form = openModal({
    title: a0 ? 'Editar ativo' : 'Novo ativo',
    body: `<div class="fld-2"><label class="fld"><span>Tipo</span><input name="tipo" list="dl-tipo" value="${esc(a0 ? a0.tipo : 'BOLSA DE VALORES')}"></label><label class="fld"><span>Classe</span><input name="classe" list="dl-classe" value="${esc(a0 ? a0.classe : '')}"></label></div>
      <div class="fld-2"><label class="fld"><span>Grupo <small>(opcional)</small></span><input name="grupo" list="dl-grupo" value="${esc(a0 && a0.grupo ? a0.grupo : '')}"></label><label class="fld"><span>Subgrupo <small>(opcional)</small></span><input name="subgrupo" list="dl-sub2" value="${esc(a0 && a0.subgrupo ? a0.subgrupo : '')}"></label></div>
      <label class="fld"><span>Nome do ativo <small>(código, banco ou título)</small></span><input name="nome" value="${esc(a0 ? a0.nome : '')}"></label>
      <p class="mmsg small">Em renda fixa, os valores de Proventos contam como rentabilidade; nos demais tipos, como dividendos.</p>
      <datalist id="dl-tipo"></datalist><datalist id="dl-classe"></datalist><datalist id="dl-grupo"></datalist><datalist id="dl-sub2"></datalist>`,
    danger: a0 ? 'Excluir' : null,
    onDanger: () => { confirmBox('Excluir ativo?', `“${a0.nome}” e seus valores de investimentos e proventos serão removidos.`, 'Excluir', () => { p.ativos = p.ativos.filter((x) => x.id !== a0.id); commit(); }); return false; },
    onOk: (d, err) => {
      const tipo = matchCase(d.tipo, suggest('tipo', {})).toUpperCase(); const a = { tipo };
      a.classe = matchCase(d.classe, suggest('classe', a)); a.grupo = d.grupo && d.grupo.trim() ? matchCase(d.grupo, suggest('grupo', a)) : null;
      a.subgrupo = d.subgrupo && d.subgrupo.trim() ? matchCase(d.subgrupo, suggest('subgrupo', Object.assign({}, a))) : null;
      const nome = (d.nome || '').trim();
      if (!tipo || !a.classe || !nome) return bad(err, 'Preencha tipo, classe e nome do ativo.');
      if (a.subgrupo && !a.grupo) return bad(err, 'Para usar um subgrupo, informe também o grupo.');
      if (a0) Object.assign(a0, a, { nome });
      else ativoInserir(Object.assign(a, { nome }));
      commit();
    },
  });
  const refresh = () => {
    const g = (n) => form.elements[n].value.trim(); const a = { tipo: matchCase(g('tipo'), suggest('tipo', {})) };
    a.classe = matchCase(g('classe'), suggest('classe', a)); a.grupo = matchCase(g('grupo'), suggest('grupo', Object.assign({}, a)));
    const fill = (id, arr) => { $('#' + id).innerHTML = arr.map((x) => `<option value="${esc(x)}"></option>`).join(''); };
    fill('dl-tipo', suggest('tipo', {})); fill('dl-classe', suggest('classe', a)); fill('dl-grupo', suggest('grupo', a)); fill('dl-sub2', suggest('subgrupo', a));
  };
  form.addEventListener('input', refresh); refresh();
}

/* Assistente do painel: conversa local, sem modelo de linguagem e sem mandar dados para fora.
   A pergunta vira uma intenção (E.iaIntencao) e a resposta sai das análises que já existem (E.iaResponder, testado).
   Aqui ficam os textos nas três vozes, o símbolo, o widget da Visão geral e o painel do topo (no lugar do sino: conversa e avisos).
   A conversa vale só na sessão (S.ia). Cada resposta guarda a chave e os números, e o texto é montado a cada desenho,
   então o olho oculto (S.privado) mascara também as respostas antigas. */
'use strict';

const IA_VOZ = {
  consultivo: {
    ia_boas: 'Eu acompanho o seu planejamento e respondo perguntas sobre gastos, orçamento, aportes, carteira e objetivos. Pergunte do seu jeito ou toque numa sugestão.',
    ia_boas_av: 'Você tem {n} avisos novos. Pergunte "Tenho avisos?" ou abra a aba Avisos.',
    ia_oi: '{saud}, {nome}! Em que posso ajudar com o seu planejamento hoje?',
    ia_obrigado: 'Por nada! Se quiser, sigo com outra análise do seu mês.',
    ia_ajuda: 'Eu leio os números do seu planejamento e respondo sobre o mês: quanto entrou, quanto gastou e onde, o orçamento, a sobra, quanto dá para aportar, a carteira contra o alvo, proventos, patrimônio, objetivos e avisos. Não indico ativos: isso é com o seu assessor.',
    ia_assessor: 'O {consultor} acompanha o seu planejamento. Fale direto com ele pelo canal que preferir.',
    ia_nao_recomendo: 'Não indico ativos nem faço previsão de rentabilidade: isso depende do seu perfil e é uma conversa para ter com o {consultor}. O que posso mostrar é como a sua carteira está em relação ao alvo que você definiu.',
    ia_avisos: 'Você tem {n} avisos novos. Os principais estão aqui embaixo.',
    ia_avisos_zero: 'Nenhum aviso novo. Orçamento, entradas, aportes e carteira estão sob acompanhamento.',
    ia_nao_entendi: 'Ainda não sei responder isso. Tente perguntar sobre gastos, orçamento, aportes, carteira, proventos ou objetivos.',
    ia_plano: 'Essa análise faz parte de outro plano. No seu, posso falar de rendas, gastos, orçamento e sobra.',
    ia_sem_dados: 'Ainda não há dados neste ano. Importe o extrato ou cadastre suas rendas e eu começo a responder com os seus números.',
    ia_resumo: 'Em {mes}, entraram {receita} e saíram {gasto}. Sobraram {sobra} até agora.',
    ia_resumo_neg: 'Em {mes}, entraram {receita} e saíram {gasto}: {sobra} a mais do que entrou. Vale conferir se falta registrar alguma renda.',
    ia_orc_sem: '{Mes} ainda não tem orçamento. Com um limite definido, eu mostro quanto ainda cabe no mês.',
    ia_orc_passou: 'O orçamento de {mes} passou em {valor} ({pct} usado). Vale ver o que dá para segurar até o fim do mês.',
    ia_orc_ok: 'Você usou {pct} do orçamento de {mes}. Ainda restam {restante}, cerca de {porDia} por dia até o fim do mês.',
    ia_gastos_vazio: 'Não há gastos em {mes} ainda. Importe o extrato e eu separo tudo por categoria.',
    ia_gastos: 'Os gastos de {mes} somam {gasto}. A maior área é {area}, com {areaValor} ({pctArea} do total).',
    ia_gastos_sem_area: 'Os gastos de {mes} somam {gasto}.',
    ia_renda: 'Em {mes}, as entradas somam {receita}. No ano, {noAno}.',
    ia_renda_vazio: 'Não há entradas registradas em {mes}. Registre salário e outras rendas para eu calcular a sua sobra.',
    ia_sobra: '{Mes} tem {sobra} de sobra até agora, {pct} das entradas.',
    ia_deficit: 'Em {mes}, os gastos passaram das entradas em {valor}. Falta registrar alguma renda?',
    ia_disp: 'Você tem {valor} disponíveis para aportar em {mes}, já descontado o que aplicou ({aportado}).',
    ia_disp_acima: 'Em {mes}, você aplicou {valor} além da sobra do mês. Confira se os gastos estão todos registrados.',
    ia_disp_tudo: 'A sobra de {mes} já foi toda investida: {aportado} aplicados. Muito bem.',
    ia_disp_zero: '{Mes} ainda não tem sobra para aportar. Ela aparece quando as entradas passam dos gastos.',
    ia_meta_sem: 'Você ainda não definiu uma meta de aporte. Com ela, eu acompanho o ritmo mês a mês.',
    ia_meta_batida: 'Meta batida: você aplicou {aportado} em {mes}, para uma meta de {meta}.',
    ia_meta_falta: 'Você aplicou {aportado} em {mes}, {pct} da meta de {meta}. Faltam {falta}.',
    ia_cart_vazia: 'A sua carteira ainda não tem ativos. Registre os aportes em Investimentos e eu acompanho o equilíbrio.',
    ia_cart_sem_alvo: 'Defina o percentual-alvo de cada ativo e eu mostro onde o próximo aporte equilibra melhor a carteira.',
    ia_cart_sug: 'Pelo alvo que você definiu, {ativo} é o que está mais abaixo. Dos {aporte} disponíveis, {valor} iriam para ele, sem vender nada.',
    ia_cart_desvio: '{ativo} está {pp} abaixo do alvo. O próximo aporte deve priorizá-lo.',
    ia_cart_ok: 'A carteira está {pct} aderente ao alvo. Siga aportando no ritmo de sempre.',
    ia_prov_vazio: 'Ainda não há proventos registrados neste ano.',
    ia_prov: 'Seus investimentos pagaram {valor} em {mes} e {noAno} no ano.',
    ia_patr_vazio: 'Ainda não há patrimônio registrado. Os aportes em Investimentos formam esse número.',
    ia_patr: 'O patrimônio estimado em {mes} é de {valor}, a custo. Neste ano, você aplicou {aportado}.',
    ia_reserva_geral: 'Uma referência comum é guardar de 6 a 12 meses de gastos numa aplicação de resgate rápido. Registre seus gastos e eu calculo o seu número.',
    ia_reserva: 'Pela sua média de {media} por mês em gastos, a referência de reserva fica entre {alvo} (6 meses) e {ate} (12 meses). O tipo de aplicação vale conversar com o seu assessor.',
    ia_obj_vazio: 'Você ainda não tem objetivos. Cadastre um, como uma viagem ou a aposentadoria, e eu mostro quando ele chega.',
    ia_obj_ok: '{nome} já foi alcançado. Que tal definir o próximo?',
    ia_obj_prazo: '{nome} está {pct} concluído e dentro do prazo. Faltam {falta}.',
    ia_obj_atraso: '{nome} está {pct} concluído, mas fora do prazo. Para chegar a tempo, seriam {extra} a mais por mês.',
    ia_obj_quando: '{nome} está {pct} concluído. No ritmo atual, chega em {quando}.',
    ia_obj_geral: '{nome} está {pct} concluído. Faltam {falta}.',
    ia_dica_orc: 'O orçamento de {mes} passou em {valor}. A primeira sugestão é segurar os gastos variáveis até o fim do mês.',
    ia_dica_deficit: 'Os gastos passaram das entradas em {valor}. Comece revisando as maiores áreas de gasto.',
    ia_dica_aporte: 'Há {valor} parados que podem ir para os seus objetivos. Registrar o aporte mantém a constância.',
    ia_dica_area: '{area} leva {pct} dos seus gastos do mês. Um limite para essa área ajuda a acompanhar.',
    ia_dica_orc_sem: 'Defina um orçamento para o mês. É o jeito mais simples de saber quanto ainda cabe.',
    ia_dica_geral: 'O mês está equilibrado. Uma boa próxima etapa é revisar a reserva de emergência e os objetivos.',
  },
  direto: {
    ia_boas: 'Pergunte sobre gastos, orçamento, aportes, carteira ou objetivos.',
    ia_boas_av: '{n} avisos novos.',
    ia_oi: 'Olá, {nome}. O que quer saber?',
    ia_obrigado: 'Disponha.',
    ia_ajuda: 'Respondo sobre entradas, gastos, orçamento, sobra, aporte, carteira, proventos, patrimônio, objetivos e avisos. Não indico ativos.',
    ia_assessor: 'Fale com o {consultor}.',
    ia_nao_recomendo: 'Não indico ativos nem prevejo rentabilidade. Fale com o {consultor}. Posso mostrar a carteira contra o alvo.',
    ia_avisos: '{n} avisos novos:',
    ia_avisos_zero: 'Sem avisos novos.',
    ia_nao_entendi: 'Não entendi. Pergunte sobre gastos, orçamento, aportes ou objetivos.',
    ia_plano: 'Fora do seu plano.',
    ia_sem_dados: 'Sem dados. Importe o extrato.',
    ia_resumo: '{Mes}: entradas {receita}, gastos {gasto}, sobra {sobra}.',
    ia_resumo_neg: '{Mes}: entradas {receita}, gastos {gasto}. {sobra} no vermelho.',
    ia_orc_sem: '{Mes} sem orçamento. Defina um.',
    ia_orc_passou: 'Orçamento estourado em {valor} ({pct}).',
    ia_orc_ok: '{pct} usado. Restam {restante} ({porDia} por dia).',
    ia_gastos_vazio: 'Sem gastos em {mes}.',
    ia_gastos: 'Gastos: {gasto}. Maior área: {area}, {areaValor} ({pctArea}).',
    ia_gastos_sem_area: 'Gastos: {gasto}.',
    ia_renda: 'Entradas: {receita} no mês, {noAno} no ano.',
    ia_renda_vazio: 'Sem entradas em {mes}. Registre.',
    ia_sobra: 'Sobra: {sobra} ({pct} das entradas).',
    ia_deficit: '{valor} no vermelho em {mes}.',
    ia_disp: 'Disponível para aportar: {valor}.',
    ia_disp_acima: '{valor} aplicados além da sobra. Confira os gastos.',
    ia_disp_tudo: 'Sobra toda investida: {aportado}.',
    ia_disp_zero: 'Sem sobra para aportar em {mes}.',
    ia_meta_sem: 'Sem meta de aporte. Defina uma.',
    ia_meta_batida: 'Meta batida: {aportado} de {meta}.',
    ia_meta_falta: '{aportado} de {meta}. Faltam {falta}.',
    ia_cart_vazia: 'Carteira vazia.',
    ia_cart_sem_alvo: 'Defina o alvo da carteira.',
    ia_cart_sug: 'Pelo seu alvo: {valor} em {ativo}.',
    ia_cart_desvio: '{ativo}: {pp} abaixo do alvo. Priorize.',
    ia_cart_ok: 'Carteira {pct} aderente ao alvo.',
    ia_prov_vazio: 'Sem proventos no ano.',
    ia_prov: 'Proventos: {valor} no mês, {noAno} no ano.',
    ia_patr_vazio: 'Sem patrimônio registrado.',
    ia_patr: 'Patrimônio: {valor} (a custo). Aplicado no ano: {aportado}.',
    ia_reserva_geral: 'Referência: 6 a 12 meses de gastos, com resgate rápido.',
    ia_reserva: 'Reserva de referência: {alvo} a {ate} (6 a 12 meses de {media}).',
    ia_obj_vazio: 'Sem objetivos. Cadastre um.',
    ia_obj_ok: '{nome}: concluído.',
    ia_obj_prazo: '{nome}: {pct}, no prazo. Faltam {falta}.',
    ia_obj_atraso: '{nome}: {pct}, atrasado. Mais {extra} por mês.',
    ia_obj_quando: '{nome}: {pct}. Chega em {quando}.',
    ia_obj_geral: '{nome}: {pct}. Faltam {falta}.',
    ia_dica_orc: 'Estourou {valor}. Segure os variáveis.',
    ia_dica_deficit: '{valor} no vermelho. Corte nas maiores áreas.',
    ia_dica_aporte: '{valor} parados. Aporte.',
    ia_dica_area: '{area}: {pct} dos gastos. Crie um limite.',
    ia_dica_orc_sem: 'Defina o orçamento do mês.',
    ia_dica_geral: 'Mês equilibrado. Revise reserva e objetivos.',
  },
  acolhedor: {
    ia_boas: 'Estou aqui para conversar sobre o seu dinheiro: gastos, orçamento, aportes, carteira e objetivos. Pode perguntar do seu jeito!',
    ia_boas_av: 'Separei {n} avisos novos para você. É só perguntar "Tenho avisos?".',
    ia_oi: '{saud}, {nome}! Que bom ver você por aqui. Como posso ajudar?',
    ia_obrigado: 'Imagina! Conte comigo sempre que quiser.',
    ia_ajuda: 'Eu olho os números do seu planejamento com você: entradas, gastos, orçamento, sobra, aportes, carteira, proventos, patrimônio, objetivos e avisos. Só não indico ativos: essa conversa é com o seu assessor.',
    ia_assessor: 'O {consultor} está pertinho para ajudar. Fale com ele pelo canal que preferir!',
    ia_nao_recomendo: 'Essa eu deixo para o {consultor}: indicar ativos depende do seu perfil, e ninguém consegue prever rentabilidade. Mas posso mostrar com carinho como a sua carteira está em relação ao alvo!',
    ia_avisos: 'Você tem {n} avisos novos. Olha só os principais:',
    ia_avisos_zero: 'Nada novo por aqui. Pode ficar tranquilo, eu sigo de olho em tudo!',
    ia_nao_entendi: 'Hum, essa eu ainda não sei. Que tal perguntar sobre gastos, orçamento, aportes ou objetivos?',
    ia_plano: 'Essa análise faz parte de outro plano. Mas posso conversar sobre rendas, gastos, orçamento e sobra!',
    ia_sem_dados: 'Vamos começar? Importe o extrato ou cadastre suas rendas, e eu passo a responder com os seus números.',
    ia_resumo: 'Em {mes}, entraram {receita} e saíram {gasto}. Já sobraram {sobra}. Você está indo bem!',
    ia_resumo_neg: 'Em {mes}, entraram {receita} e saíram {gasto}, {sobra} a mais do que entrou. Sem drama: será que falta lançar alguma renda?',
    ia_orc_sem: '{Mes} ainda está sem orçamento. Que tal definir um? Assim eu mostro quanto ainda cabe no mês.',
    ia_orc_passou: 'O orçamento de {mes} passou um pouquinho: {valor} além ({pct} usado). Acontece! Vamos ajustar até o fim do mês?',
    ia_orc_ok: 'Tudo certo: você usou {pct} do orçamento de {mes} e ainda tem {restante}, cerca de {porDia} por dia.',
    ia_gastos_vazio: '{Mes} ainda está em branco. Importe o extrato e eu organizo tudo para você.',
    ia_gastos: 'Os gastos de {mes} somam {gasto}. {area} é a área que mais pesa: {areaValor} ({pctArea} do total).',
    ia_gastos_sem_area: 'Os gastos de {mes} somam {gasto}.',
    ia_renda: 'Em {mes} entraram {receita}. No ano, já são {noAno}!',
    ia_renda_vazio: 'Seu salário já caiu? Registre as entradas de {mes} para eu calcular quanto vai sobrar.',
    ia_sobra: 'Boa notícia: {mes} tem {sobra} de sobra, {pct} das entradas!',
    ia_deficit: 'Em {mes}, os gastos passaram das entradas em {valor}. Vamos olhar juntos?',
    ia_disp: 'Você tem {valor} prontos para trabalhar por você em {mes}! Já aplicou {aportado}.',
    ia_disp_acima: 'Você aplicou {valor} além da sobra de {mes}. Vale conferir se todos os gastos foram registrados.',
    ia_disp_tudo: 'Que orgulho! A sobra de {mes} já foi toda investida: {aportado}.',
    ia_disp_zero: '{Mes} ainda não tem sobra para aportar, e tudo bem. Ela aparece quando as entradas passam dos gastos.',
    ia_meta_sem: 'Que tal definir uma meta de aporte? Assim eu comemoro cada mês com você.',
    ia_meta_batida: 'Meta batida! Você aplicou {aportado} em {mes}, para uma meta de {meta}. Parabéns!',
    ia_meta_falta: 'Você já aplicou {aportado} em {mes}, {pct} da meta de {meta}. Faltam só {falta}!',
    ia_cart_vazia: 'Sua carteira ainda está vazia. Registre os aportes em Investimentos e eu acompanho com você.',
    ia_cart_sem_alvo: 'Vamos definir o alvo de cada ativo? Assim eu mostro onde cada aporte equilibra melhor a carteira.',
    ia_cart_sug: 'Pelo alvo que você escolheu, {ativo} é o que mais precisa de atenção: dos {aporte} disponíveis, {valor} iriam para ele, sem vender nada.',
    ia_cart_desvio: '{ativo} está {pp} abaixo do alvo. No próximo aporte, ele merece um carinho extra.',
    ia_cart_ok: 'A carteira está {pct} aderente ao alvo. Lindo de ver!',
    ia_prov_vazio: 'Ainda não há proventos neste ano. Eles aparecem aqui assim que forem registrados.',
    ia_prov: 'Seus investimentos trabalharam por você: {valor} em {mes} e {noAno} no ano!',
    ia_patr_vazio: 'Ainda não há patrimônio registrado. Cada aporte em Investimentos vai construindo esse número.',
    ia_patr: 'Seu patrimônio estimado em {mes} é de {valor}, a custo. Só neste ano, você aplicou {aportado}!',
    ia_reserva_geral: 'Uma referência comum é guardar de 6 a 12 meses de gastos num lugar de resgate rápido. Registre seus gastos e eu calculo o seu número.',
    ia_reserva: 'Com gastos médios de {media} por mês, a sua reserva de referência fica entre {alvo} (6 meses) e {ate} (12 meses). Onde guardar, vale conversar com o seu assessor.',
    ia_obj_vazio: 'Qual é o seu próximo sonho? Cadastre um objetivo e eu mostro quando ele chega.',
    ia_obj_ok: '{nome} já foi alcançado! Que tal sonhar o próximo?',
    ia_obj_prazo: '{nome} está {pct} concluído e no prazo. Faltam {falta}. Continue assim!',
    ia_obj_atraso: '{nome} está {pct} concluído. Para chegar no prazo, seriam {extra} a mais por mês. Dá para ajustar com calma.',
    ia_obj_quando: '{nome} está {pct} concluído. No ritmo de hoje, chega em {quando}!',
    ia_obj_geral: '{nome} está {pct} concluído. Faltam {falta}.',
    ia_dica_orc: 'O orçamento de {mes} passou {valor}. Uma ideia: segurar os gastos variáveis até o mês virar.',
    ia_dica_deficit: 'Os gastos passaram das entradas em {valor}. Vamos começar pelas maiores áreas?',
    ia_dica_aporte: 'Você tem {valor} esperando para trabalhar pelos seus objetivos. Que tal registrar o aporte?',
    ia_dica_area: '{area} leva {pct} dos gastos do mês. Um limite para essa área ajuda a acompanhar sem sustos.',
    ia_dica_orc_sem: 'Que tal definir um orçamento para o mês? É o jeito mais leve de saber quanto ainda cabe.',
    ia_dica_geral: 'Seu mês está equilibrado! Um bom próximo passo é olhar a reserva de emergência e os objetivos.',
  },
};
Object.keys(IA_VOZ).forEach((t) => { if (VOZ[t]) Object.assign(VOZ[t], IA_VOZ[t]); });

const IA_MOEDA = ['receita', 'gasto', 'sobra', 'valor', 'restante', 'porDia', 'aportado', 'meta', 'falta', 'areaValor', 'noAno', 'alvo', 'ate', 'media', 'extra', 'aporte'];
const IA_PCT = ['pct', 'pctArea'];
// símbolo do assistente: uma estrela de quatro pontas dentro de uma órbita (o "universo financeiro" do globo)
const IA_SIMBOLO = ic('<g class="ia-orbita"><ellipse cx="12" cy="12" rx="10.5" ry="4" transform="rotate(-28 12 12)"/><circle cx="20.6" cy="7.4" r="1.5" class="ia-estrela"/></g><path d="M11 2.5c.7 4.6 2.6 7 6.6 8.2-4 1.2-5.9 3.6-6.6 8.2-.7-4.6-2.6-7-6.6-8.2 4-1.2 5.9-3.6 6.6-8.2z" class="ia-estrela"/>');
const iaOrb = (cls) => `<span class="ia-orb${cls ? ' ' + cls : ''}" aria-hidden="true"><i></i><i></i><i></i><b>${IA_SIMBOLO}</b></span>`;
const IA_ENVIAR = ic('<path d="M12 19V5M6 11l6-6 6 6"/>');

const iaEstado = () => { if (!S.ia) S.ia = { msgs: [], pend: false }; return S.ia; };
function iaVars(v) {
  const o = { nome: iaNome(), consultor: CFG.consultor, saud: saudacaoHora() };
  Object.keys(v || {}).forEach((k) => { const x = v[k];
    o[k] = IA_MOEDA.includes(k) ? brl0(x) : IA_PCT.includes(k) ? pct(x) : k === 'pp' ? (+x).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' p.p.' : x; });
  if (o.mes) o.Mes = o.mes.charAt(0).toUpperCase() + o.mes.slice(1);
  return o;
}
const iaNome = () => String((S.profile && S.profile.nome) || '').trim().split(/\s+/)[0] || 'tudo bem';

// dados do ano corrente para o assistente, montados com as mesmas análises das telas (e o mesmo contexto dos avisos)
function iaDados() {
  const hoje = new Date(); const m = hoje.getMonth(); const ctx = notifContexto();
  const d = { mes: m, dia: hoje.getDate(), meses: m + 1, recursos: ctx ? ctx.recursos : {}, avisos: (S.notifs || []).filter((n) => !n.lida).length };
  if (!ctx) return d;
  const C = ctx.C; d.C = C; d.disp = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes }); d.areas = E.gastosAreaMes(ctx.plan, ctx.carry, m);
  if (ctx.recursos.carteira && (ctx.plan.ativos || []).length) {
    try { const M = cartModel({ plan: ctx.plan, C, mes: m, aporte: d.disp.disponivel });
      d.cart = E.analiseCarteira({ aporte: M.aporte, itens: M.items.map((i) => ({ nome: i.a.nome, classe: i.a.classe, tipo: i.a.tipo, alvo: i.alvo, valor: i.valor, preco: i.preco })) }); } catch (e) { d.cart = null; }
  }
  try { d.obj = objAnalise(); } catch (e) { d.obj = null; }
  return d;
}

/* ---------- conversa ---------- */
const iaRapido = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function iaEnviar(q) {
  const st = iaEstado(); q = String(q || '').trim().slice(0, 300); if (!q || st.pend) return;
  st.msgs.push({ de: 'eu', txt: q }); st.pend = true; iaRefresh();
  setTimeout(() => {
    const id = E.iaIntencao(q); const r = E.iaResponder(id, iaDados());
    if (id === 'avisos') r.avisos = (S.notifs || []).filter((n) => !n.lida).slice(0, 3).map((n) => n.id);
    st.pend = false; st.msgs.push({ de: 'ia', r }); if (st.msgs.length > 40) st.msgs.splice(0, st.msgs.length - 40);
    iaRefresh();
  }, iaRapido() ? 0 : 480 + Math.min(500, q.length * 8));
}
function iaCta(c, i) {
  if (!c) return '';
  if (c.acao === 'contact') return `<button class="btn sm" data-act="contact">${esc(c.rotulo)}</button>`;
  if (c.acao === 'planos') return `<button class="btn sm" data-act="upgrade" data-plano="investidor">${esc(c.rotulo)}</button>`;
  if (c.acao === 'nav' && !navItems().some((n) => n[0] === c.view)) return '';
  return `<button class="btn sm" data-act="ia-ir" data-i="${i}">${esc(c.rotulo)}</button>`;
}
function iaMsgHtml(m, i) {
  if (m.de === 'eu') return `<div class="ia-m eu"><p>${esc(m.txt)}</p></div>`;
  const r = m.r; const avs = (r.avisos || []).map((id) => (S.notifs || []).find((n) => n.id === id)).filter(Boolean);
  return `<div class="ia-m ia"><p>${esc(voz(r.chave, iaVars(r.vars)))}</p>${avs.length ? `<ul class="ia-av">${avs.map((n) => `<li class="${n.nivel}"><b>${esc(n.titulo)}</b><span>${esc(n.texto)}</span></li>`).join('')}</ul>` : ''}${iaCta(r.cta, i)}</div>`;
}
// boas-vindas: no widget, junto com o que o painel está vendo no mês (insights); no topo, só o resumo dos avisos
function iaBoasHtml(comDestaques) {
  const n = (S.notifs || []).filter((x) => !x.lida).length; const ins = comDestaques && S.C ? insights() : [];
  return `<div class="ia-m ia"><p>${esc(voz('ia_oi', iaVars({})))} ${esc(voz('ia_boas'))}</p>${n ? `<p class="ia-nota">${esc(voz('ia_boas_av', { n }))}</p>` : ''}
    ${ins.length ? `<ul class="ins ia-ins">${ins.map((x) => `<li class="${x.t}"><i></i><span>${esc(x.x)}${x.a ? ' ' + btnAcao(x.a) : ''}</span></li>`).join('')}</ul>` : ''}</div>`;
}
function iaLogHtml(onde) {
  const st = iaEstado(); const lim = onde === 'w' ? 6 : 40; const ini = Math.max(0, st.msgs.length - lim);
  const msgs = st.msgs.slice(ini).map((m, k) => iaMsgHtml(m, ini + k)).join('');
  return (st.msgs.length <= lim ? iaBoasHtml(onde === 'w') : '') + msgs + (st.pend ? '<div class="ia-m ia dig" aria-label="Digitando"><p><i></i><i></i><i></i></p></div>' : '');
}
function iaFichasHtml() {
  const st = iaEstado(); const ult = st.msgs.slice().reverse().find((m) => m.de === 'ia'); const rec = { investimentos: temRecurso('investimentos'), carteira: temRecurso('carteira') };
  const base = ['resumo', 'orcamento', 'aporte', 'carteira', 'objetivos', 'avisos'].filter((s) => (s !== 'aporte' || rec.investimentos) && (s !== 'carteira' || rec.carteira));
  const ids = ult && ult.r.sug.length ? ult.r.sug : base;
  return ids.slice(0, 4).map((id) => `<button class="np-chip ia-ficha" data-act="ia-perg" data-q="${esc(E.IA_FICHAS[id])}">${esc(E.IA_FICHAS[id])}</button>`).join('');
}
const iaFormHtml = (onde) => `<form class="ia-f" data-form="ia" autocomplete="off"><input name="q" maxlength="300" placeholder="Pergunte sobre o seu dinheiro" aria-label="Pergunta para o assistente" enterkeyhint="send"><button class="ia-env" aria-label="Enviar pergunta">${IA_ENVIAR}</button></form>`;
const iaConversaHtml = (onde) => `<div class="ia-log" data-ia-log="${onde}" role="log" aria-live="polite">${iaLogHtml(onde)}</div><div class="ia-fichas" data-ia-fichas role="group" aria-label="Sugestões de perguntas">${iaFichasHtml()}</div>${iaFormHtml(onde)}`;

// widget da Visão geral (mesmo id "destaques" do antigo "O que o painel está vendo", para quem já personalizou)
function iaWidgetHtml() {
  return `<section class="card ia-card"><div class="c-h ia-h">${iaOrb()}<div><h3>Assistente ${esc(CFG.marca || '')}</h3><p class="keep">Converse sobre o seu mês, a carteira e os objetivos</p></div></div>${iaConversaHtml('w')}<p class="ia-disc disc">Respostas automáticas a partir do seu planejamento, sem indicação de investimentos.</p></section>`;
}
// painel do topo (no lugar da central de notificações): abas Conversa e Avisos
function iaPainelHtml(lista) {
  const aba = S.iaAba || 'conversa'; const novas = lista.filter((n) => !n.lida).length;
  const tab = (k, l) => `<button class="np-chip" role="tab" data-act="ia-aba" data-aba="${k}" aria-selected="${aba === k}" aria-pressed="${aba === k}">${l}</button>`;
  return `<div class="popover npop iap${S.notifAnim ? ' entra' : ''}" role="dialog" aria-label="Assistente" tabindex="-1">
    <div class="np-h ia-h">${iaOrb()}<div class="ia-h-t"><b>Assistente ${esc(CFG.marca || '')}</b><small>Seu planejamento, em conversa · ${esc(CFG.consultor)}</small></div><div class="np-h-a">${aba === 'avisos' && novas ? '<button class="lnk" data-act="notif-todas">Marcar como lidas</button>' : ''}<button class="icon-btn np-x" data-act="notif-fechar" aria-label="Fechar o assistente">${I.x}</button></div></div>
    <div class="np-chips ia-tabs" role="tablist">${tab('conversa', 'Conversa')}${tab('avisos', `Avisos${novas ? `<em>${novas}</em>` : ''}`)}</div>
    ${aba === 'avisos' ? notifCorpo(lista) : `<div class="iap-c">${iaConversaHtml('p')}</div>`}</div>`;
}

// atualiza só a conversa e as fichas (sem render(), sem perder o que está digitado)
function iaRefresh() {
  document.querySelectorAll('[data-ia-log]').forEach((el) => { el.innerHTML = iaLogHtml(el.dataset.iaLog); });
  document.querySelectorAll('[data-ia-fichas]').forEach((el) => { el.innerHTML = iaFichasHtml(); });
  iaRolar();
}
// a conversa sempre mostra a última mensagem (também depois de um render())
const iaRolar = () => document.querySelectorAll('[data-ia-log]').forEach((el) => { el.scrollTop = el.scrollHeight; });
function iaAcao(act, ds) {
  switch (act) {
    case 'ia-perg': iaEnviar(ds.q); return true;
    case 'ia-aba': S.iaAba = ds.aba; notifRefresh(`.ia-tabs [data-aba="${ds.aba}"]`); iaRefresh(); return true;
    case 'ia-ir': {
      const m = iaEstado().msgs[+ds.i]; const c = m && m.r && m.r.cta; if (!c) return true;
      if (c.acao === 'avisos') { S.notifOpen = true; S.iaAba = 'avisos'; notifRefresh('.npop'); return true; }
      S.notifOpen = false; S.maisOpen = false;
      if (c.acao === 'ingest') { render(); abrirIngestao(); return true; }
      if (c.acao === 'objetivos') { render(); objAcao('objetivos-abrir', {}); return true; }
      if (c.acao === 'nav') { if (typeof closeAdmin === 'function') closeAdmin(); S.view = c.view; render(); }
      return true;
    }
    default: return false;
  }
}
function iaSubmit(f) { const inp = f.elements.q; const q = inp.value; inp.value = ''; iaEnviar(q); }

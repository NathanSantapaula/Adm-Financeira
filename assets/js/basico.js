/* Modo Básico: a segunda interface, para quem está começando. Jeito de app de celular: números grandes, pouco texto,
   uma ação principal por tela e abas embaixo; no computador fica centralizado como um app.
   Mesmos dados (S.plan, S.profile) e os mesmos cálculos do engine; só a tela muda. Escolha em S.profile.interface. */
'use strict';
const BASICO_PAGANTES = true; // pagantes podem trocar para o Básico; false = Básico só no plano gratuito
const modoBasico = () => S.screen === 'app' && !!S.profile && !S.isAdmin && E.interfaceDe(planoAtual(), S.profile.interface, BASICO_PAGANTES) === 'basico';
const basEscolhe = () => BASICO_PAGANTES && !S.isAdmin && planoAtual() !== 'gratis'; // só pagantes escolhem a versão
const BAS_ABAS = [['inicio', 'Início', I.geral], ['gastos', 'Gastos', I.despesas], ['investir', 'Investir', I.inv], ['perfil', 'Perfil', I.user]];

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

const basAba = () => (BAS_ABAS.some((a) => a[0] === S.basAba) ? S.basAba : 'inicio');
const basBarra = (f) => `<span class="bas-bar" aria-hidden="true"><i style="width:${(Math.max(0, Math.min(1, f)) * 100).toFixed(1)}%"></i></span>`;
const basCard = (corpo, cls) => `<section class="card bas-card${cls ? ' ' + cls : ''}">${corpo}</section>`;
const basVazio = (t) => `<p class="bas-vz">${t}</p>`;

// abas embaixo (no lugar do menu lateral e do topo)
function basicoBarra() {
  $('#topo').innerHTML = ''; $('#side').innerHTML = ''; const a = basAba();
  $('#tabbar').innerHTML = `<div class="bas-tabs">${BAS_ABAS.map(([k, l, i]) => `<button data-act="bas-aba" data-v="${k}" ${a === k ? 'aria-current="page"' : ''}>${i}<span>${l}</span></button>`).join('')}</div>`;
}
function basTopo(titulo, semMes) {
  const m = S.mes; const seta = (d, l, ok) => `<button class="bas-seta" data-act="bas-mes" data-d="${d}" aria-label="${l}"${ok ? '' : ' disabled'}>${d < 0 ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>' : I.chev}</button>`;
  return `<header class="bas-top"><h1>${titulo}</h1><div class="bas-top-r">${semMes ? '' : `<div class="bas-mes">${seta(-1, 'Mês anterior', m > 0)}<b>${cap(MES_LONGO[m])}${S.year !== NOW_Y ? ' ' + S.year : ''}</b>${seta(1, 'Próximo mês', m < 11)}</div>`}${olhoHtml()}</div></header>`;
}

function basicoHtml() {
  if (!S.plan) return `<div class="bas">${basCard(`<h2 class="bas-h2">Vamos começar</h2><p class="bas-p">${voz('bas_vazio')}</p><button class="btn primary lg bas-cta" data-act="create-plan">Começar ${S.year || NOW_Y}</button>`)}</div>`;
  const a = basAba(); const m = S.mes;
  return `<div class="bas" data-aba="${a}">${a === 'gastos' ? basGastos(m) : a === 'investir' ? basInvestir(m) : a === 'perfil' ? basPerfil() : basInicio(m)}</div>`;
}

/* ---- Início: saldo do mês e quanto dá para investir ---- */
function basInicio(m) {
  const C = S.C; const ent = C.receita[m]; const sai = C.despesas[m]; const sob = C.investAlocado[m];
  const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes });
  const nome = (S.profile.apelido || S.profile.nome || '').split(/\s+/)[0];
  const vazio = !(ent > 0) && !(sai > 0);
  const rendas = S.plan.rendas.filter((r) => +r.valores[m] > 0.005).sort((x, y) => y.valores[m] - x.valores[m]);
  const hero = basCard(`<small class="bas-k">Sobrou em ${MES_LONGO[m]}</small><b class="bas-big${sob < -0.005 ? ' neg' : ''}">${brl(sob)}</b>
    <div class="bas-par"><div><small>Entrou</small><b class="pos">${brl(ent)}</b></div><div><small>Saiu</small><b>${brl(sai)}</b></div></div>
    ${vazio ? `<p class="bas-p">${voz('bas_vazio')}</p>` : ''}
    <div class="bas-acoes"><button class="btn primary bas-cta" data-act="add-lanc" data-mes="${m}">${I.plus}Gasto</button><button class="btn bas-cta" data-act="bas-renda">${I.plus}Entrada</button></div>`, 'bas-hero');
  const disp = basCard(`<small class="bas-k">Dá para investir</small><b class="bas-big md">${brl(D.disponivel)}</b>
    <p class="bas-p">${voz(D.disponivel > 0.005 ? 'bas_disp_sim' : D.sobra > 0.005 ? 'bas_disp_tudo' : 'bas_disp_nao')}</p>
    ${D.disponivel > 0.005 ? '<button class="btn bas-cta" data-act="bas-aba" data-v="investir">Ver onde investir</button>' : ''}`);
  const ents = basCard(`<div class="bas-ch"><h2 class="bas-h2">Entradas</h2></div>${rendas.length ? `<ul class="bas-l">${rendas.map((r) => `<li><button data-act="edit-item" data-kind="renda" data-id="${esc(r.id)}"><span class="bas-n"><b>${esc(r.nome)}</b>${r.fonte ? `<small>${esc(r.fonte)}</small>` : ''}</span><b class="pos">${brl(r.valores[m])}</b></button></li>`).join('')}</ul>` : basVazio('Nenhuma entrada neste mês.')}`);
  return `${basTopo(nome ? 'Olá, ' + esc(nome) : 'Início')}${hero}${disp}${ents}`;
}

/* ---- Gastos: total, por categoria, botão de adicionar e as contas do mês ---- */
function basGastos(m) {
  const C = S.C; const p = S.plan; const carry = E.carryItems(S.plans, S.year); const sai = C.despesas[m]; const orc = C.orcamento[m];
  const areas = E.gastosAreaMes(p, carry, m); const lista = Object.keys(areas).map((k) => [k, areas[k]]).filter((x) => x[1] > 0.005).sort((x, y) => y[1] - x[1]);
  const mx = lista.length ? lista[0][1] : 1; const tot = lista.reduce((s, x) => s + x[1], 0) || 1;
  const K = E.contasMes({ despesas: p.despesas, carry, ano: S.year, mes: m });
  const lanc = p.lancamentos.filter((l) => { const d = E.parseDataISO(l.data); return d && d.ano === S.year && d.mes === m; }).sort((x, y) => (x.data < y.data ? 1 : -1)).slice(0, 8);
  const hero = basCard(`<small class="bas-k">Gastou em ${MES_LONGO[m]}</small><b class="bas-big">${brl(sai)}</b>
    ${orc > 0 ? `${basBarra(sai / orc)}<p class="bas-p">${sai <= orc ? `Ainda cabe <b>${brl(orc - sai)}</b> no limite de ${brl(orc)}.` : `Passou <b class="neg">${brl(sai - orc)}</b> do limite de ${brl(orc)}.`}</p>` : ''}
    <button class="btn primary lg bas-cta bas-add" data-act="add-lanc" data-mes="${m}">${I.plus}Adicionar gasto</button>`, 'bas-hero');
  const cats = basCard(`<div class="bas-ch"><h2 class="bas-h2">Por categoria</h2></div>${lista.length ? `<ul class="bas-cats">${lista.map(([n, v], i) => `<li><span class="bas-n"><b>${esc(n)}</b><small>${pct(v / tot)}</small></span><b>${brl(v)}</b><span class="bas-bar fina" aria-hidden="true"><i style="width:${((v / mx) * 100).toFixed(1)}%;--bc:${PAL[i % 6]}"></i></span></li>`).join('')}</ul>` : basVazio('Nenhum gasto neste mês.')}`);
  const contas = basCard(`<div class="bas-ch"><h2 class="bas-h2">Contas do mês</h2>${K.itens.length ? `<small>${brl(K.pago)} de ${brl(K.total)} pagos</small>` : ''}</div>
    ${K.itens.length ? `${basBarra(K.total > 0 ? K.pago / K.total : 0)}<ul class="bas-l">${K.itens.map((x) => `<li><button ${x.herdado ? 'disabled' : `data-act="edit-item" data-kind="desp" data-id="${esc(x.id)}"`}>${x.inst ? instIcone(x.inst) : ""}<span class="bas-n"><b>${esc(x.nome)}</b><small>${x.parcela ? `parcela ${x.parcela.i} de ${x.parcela.n}` : 'todo mês'}</small></span><span class="bas-v"><b>${brl(x.valor)}</b><em class="bas-st${x.pago ? ' ok' : ''}">${x.pago ? 'Pago' : 'A pagar'}</em></span></button></li>`).join('')}</ul>` : basVazio('Conta que se repete todo mês ou compra parcelada aparece aqui. Use “Todo mês” ou “Parcelado” ao adicionar o gasto.')}`);
  const ult = lanc.length ? basCard(`<div class="bas-ch"><h2 class="bas-h2">Últimos gastos</h2></div><ul class="bas-l">${lanc.map((l) => { const d = E.parseDataISO(l.data);
    return `<li><button data-act="edit-lanc" data-id="${esc(l.id)}">${l.inst ? instIcone(l.inst) : ""}<span class="bas-n"><b>${esc(l.desc || l.area)}</b><small>${pad2(d.dia)}/${pad2(d.mes + 1)} · ${esc(l.area)}</small></span><b${l.valor < 0 ? ' class="pos"' : ''}>${brl(Math.abs(l.valor))}</b></button></li>`; }).join('')}</ul>`) : '';
  return `${basTopo('Gastos')}${hero}${cats}${contas}${ult}`;
}

/* ---- Investir: patrimônio, meta de aporte do mês e o objetivo principal ---- */
function basInvestir(m) {
  const C = S.C; const D = E.disponivelAporte({ C, mes: m, metaMes: C.metaAporteMes });
  const pode = temRecurso('aporte_simples');
  const hero = basCard(`<small class="bas-k">Seu patrimônio</small><b class="bas-big">${brl(C.patrimonio[m])}</b><p class="bas-p">O que você já tinha mais tudo o que investiu até ${MES_LONGO[m]}.</p>
    ${pode ? '<button class="btn primary lg bas-cta bas-add" data-act="aporte-novo">' + I.plus + 'Registrar investimento</button>' : `<button class="btn primary lg bas-cta bas-add" data-act="upgrade" data-plano="${planoMinimoDe('aporte_simples')}">Registrar investimento</button>`}`, 'bas-hero');
  const f = D.meta > 0 ? D.aportado / D.meta : 0;
  const meta = basCard(`<div class="bas-ch"><h2 class="bas-h2">Meta de ${MES_LONGO[m]}</h2><button class="lnk strong" data-act="bas-meta">${D.meta > 0 ? 'Mudar' : 'Definir'}</button></div>
    ${D.meta > 0 ? `<b class="bas-big md">${brl(D.aportado)} <small>de ${brl(D.meta)}</small></b>${basBarra(f)}<p class="bas-p">${f >= 1 ? voz('bas_meta_ok') : `Faltam <b>${brl(D.faltaMeta)}</b> para a meta.`}</p>` : `<p class="bas-p">${voz('bas_meta_sem')}</p>`}
    <div class="bas-linha"><span>Dá para investir agora</span><b>${brl(D.disponivel)}</b></div>`);
  const g = objFoco(objAnalise());
  const obj = basCard(`<div class="bas-ch"><h2 class="bas-h2">Meu objetivo</h2><button class="lnk strong" data-act="bas-objetivos">${g ? 'Ver todos' : 'Criar'}</button></div>
    ${g ? `<div class="bas-obj">${objIcone(g, 0)}<span class="bas-n"><b>${esc(objNomeDe(g))}</b><small>${brl0(g.saldo)} de ${brl0(g.valor)}${g.ano ? ' até ' + g.ano : ''}</small></span><b class="bas-pct">${pct(g.progresso)}</b></div>${basBarra(g.progresso)}<p class="bas-p">${esc(objFrase(g))}</p>` : '<p class="bas-p">Uma viagem, uma reserva, a casa própria: dê um nome ao seu sonho e acompanhe quanto falta.</p>'}`);
  return `${basTopo('Investir')}${hero}${meta}${obj}<p class="bas-disc keep">Projeção ilustrativa, sem promessa de rentabilidade.</p>`;
}

/* ---- Perfil: olho, tema, versão do painel e o resto ---- */
function basPerfil() {
  const p = S.profile; const t = p.prefs.tema;
  const temas = [['auto', 'Automático'], ['light', 'Claro'], ['oled', 'Escuro']].map(([v, l]) => `<button${t === v ? ' class="on"' : ''} data-act="bas-tema" data-v="${v}" aria-pressed="${t === v}">${l}</button>`).join('');
  const versao = basEscolhe() ? `<button class="bas-op" data-act="bas-ui" data-v="completo">${I.relatorio}<span class="bas-n"><b>Usar a versão Completa</b><small>Todas as telas, gráficos e análises.</small></span>${I.chev}</button>`
    : planoAtual() === 'gratis' && !S.isAdmin ? `<button class="bas-op" data-act="upgrade" data-plano="investidor">${I.inv}<span class="bas-n"><b>Conhecer o plano ${esc(nomePlano('investidor'))}</b><small>A versão Completa, com investimentos e carteira.</small></span>${I.chev}</button>` : '';
  return `${basTopo('Perfil', true)}
    ${basCard(`<button class="bas-eu" data-act="perfil-abrir">${avatarHtml(p, 'lg')}<span class="bas-n"><b>${esc(p.nome || 'Minha conta')}</b><small>${esc(planLabel())}</small></span>${I.chev}</button>`)}
    ${basCard(`<label class="bas-op"><span class="bas-n"><b>Esconder valores</b><small>Troca os valores por ••••.</small></span><span class="wg-sw"><input type="checkbox" data-act="privado" ${S.privado ? 'checked' : ''} aria-label="Esconder valores"><span></span></span></label>
      <div class="bas-op"><span class="bas-n"><b>Tema</b></span><div class="seg" role="group" aria-label="Tema">${temas}</div></div>`)}
    ${basCard(`${versao}<button class="bas-op" data-act="ingest-open">${I.rendas}<span class="bas-n"><b>Importar extrato do banco</b><small>Traz os gastos de um arquivo CSV ou OFX.</small></span>${I.chev}</button>
      <button class="bas-op" data-act="contact">${I.chat}<span class="bas-n"><b>Falar com o ${esc(primeiroNome())}</b><small>Dúvidas sobre o seu dinheiro.</small></span>${I.chev}</button>
      <button class="bas-op" data-act="admin-open">${I.edit}<span class="bas-n"><b>Mais ajustes</b><small>Metas, objetivos, backup e anos.</small></span>${I.chev}</button>
      <button class="bas-op neg" data-act="sair"><span class="bas-n"><b>Sair</b></span></button>`)}`;
}

// escolha da versão no painel administrativo (Personalizar o painel) e no fim do diagnóstico
function basAdmHtml() {
  if (S.isAdmin) return '';
  const op = (v, n, d) => `<button class="ap-voz" data-act="bas-ui" data-v="${v}" aria-pressed="${E.interfaceDe(planoAtual(), S.profile.interface, BASICO_PAGANTES) === v}"><b>${n}</b><small>${d}</small></button>`;
  const corpo = basEscolhe() ? `<div class="ap-vozes">${op('basico', 'Básico', 'Simples, como um app: o mês, os gastos e quanto dá para investir.')}${op('completo', 'Completo', 'Todas as telas, gráficos e análises.')}</div>`
    : `<p class="mmsg">Você está na versão Básica. A Completa vem com o plano ${esc(nomePlano('investidor'))}.</p><div class="btn-row"><button class="btn" data-act="upgrade" data-plano="investidor">Conhecer o plano ${esc(nomePlano('investidor'))}</button></div>`;
  return `<section class="dr-sec"><h3>Versão do painel</h3>${corpo}</section>`;
}
function basObHtml() { return basEscolhe() ? `<div class="bas-ob"><p class="qn">Como você quer ver o painel?</p>${basAdmHtml().replace(/<\/?section[^>]*>|<h3>.*?<\/h3>/g, '')}</div>` : ''; }

// ações data-act do modo Básico (chamadas pelo default do onClick em main.js)
function basAcao(act, ds) {
  switch (act) {
    case 'bas-aba': S.basAba = ds.v; render(); window.scrollTo(0, 0); return true;
    case 'bas-mes': S.mes = Math.max(0, Math.min(11, S.mes + +ds.d)); render(); return true;
    case 'bas-tema': if (ds.v !== 'auto') S.profile.prefs.tema = ds.v; definirTema(ds.v === 'auto' ? 'auto-on' : ds.v); render(); return true;
    case 'bas-ui': S.profile.interface = ds.v === 'basico' ? 'basico' : 'completo'; touch('profile'); if (S.screen === 'app') { closeAdmin(); S.basAba = 'inicio'; window.scrollTo(0, 0); } render(); toast(ds.v === 'basico' ? 'Versão Básica ligada.' : 'Versão Completa ligada.'); return true;
    case 'bas-renda': openItem('renda', null, { mes: S.mes }); return true;
    case 'bas-objetivos': openAdmin('objetivos'); return true;
    case 'bas-meta': { const v0 = S.plan.settings.metaAporte;
      openModal({ title: 'Quanto quer investir por mês?', ok: 'Salvar', body: `<label class="fld"><span>Meta mensal (R$)</span><input name="meta" inputmode="decimal" placeholder="Ex.: 500,00" value="${v0 ? nf.format(v0) : ''}" autocomplete="off"></label><p class="mmsg small">Vale para todos os meses. Comece com um valor que caiba no bolso.</p>`,
        onOk: (d, err) => { const v = parseReais(d.meta || ''); if (Number.isNaN(v) || v < 0) return bad(err, 'Informe um valor, como 500,00.'); S.plan.settings.metaAporte = v; commit(); } });
      return true; }
    default: return false;
  }
}

/* Página inicial: página de produto em vidro e gradiente. As prévias são fragmentos do próprio painel com valores
   ilustrativos; a parte viva é o simulador de onde vai o próximo aporte (E.rebalance, o mesmo cálculo da aba Carteira). */
'use strict';

/* carteira de exemplo do simulador: participação de cada ativo dentro da sua classe */
const LP_ATIVOS = [
  { n: 'Tesouro Selic', c: 'Renda fixa', k: 'rf', p: 0.45 },
  { n: 'CDB pós-fixado', c: 'Renda fixa', k: 'rf', p: 0.30 },
  { n: 'Tesouro IPCA+', c: 'Renda fixa', k: 'rf', p: 0.25 },
  { n: 'Fundo de índice de ações', c: 'Renda variável', k: 'rv', p: 0.60 },
  { n: 'Fundo imobiliário', c: 'Renda variável', k: 'rv', p: 0.40 },
];
const LP_HOJE = { rf: { rf: 0.85, rv: 0.15 }, rv: { rf: 0.45, rv: 0.55 } }; // carteira atual de R$ 60.000
const lpEstado = () => (S.lp = S.lp || { aporte: 5000, perfil: 'moderado', hoje: 'rf', ok: false, nome: '' });
const lpPct = (x) => Math.round(x * 100) + '%';

function lpCalculo() {
  const st = lpEstado(); const alvo = E.PERFIS[st.perfil].alvo; const hoje = LP_HOJE[st.hoje]; const total = 60000;
  const items = LP_ATIVOS.map((a) => ({ ...a, w: a.p * (a.k === 'rf' ? alvo.rendaFixa : alvo.bolsa), v: total * hoje[a.k] * a.p }));
  const r = E.rebalance(items, st.aporte);
  const linhas = items.map((a, i) => ({ ...a, val: r.alloc[i] })).filter((a) => a.val >= 0.5).sort((a, b) => b.val - a.val);
  const rfDepois = items.reduce((s, a, i) => s + (a.k === 'rf' ? a.v + r.alloc[i] : 0), 0) / (total + st.aporte);
  return { st, alvo, linhas, rfHoje: hoje.rf, rfDepois };
}

/* prévia "Onde investir", igual à aba Carteira */
function lpOndeHtml() {
  const { st, alvo, linhas, rfHoje, rfDepois } = lpCalculo();
  return `<div class="hp-onde-h"><b>Onde investir ${brl(st.aporte)}</b><span>Perfil ${esc(E.PERFIS[st.perfil].nome.toLowerCase())}</span></div>
    <ol class="hp-onde-l">${linhas.map((a) => `<li><span>${esc(a.n)}<small>${esc(a.c)}</small></span><b>${brl(a.val)}</b></li>`).join('')}</ol>
    <div class="hp-rf"><div class="hp-rf-t"><span>Renda fixa</span><span>${lpPct(rfHoje)} hoje · ${lpPct(rfDepois)} depois · alvo ${alvo.rendaFixa}%</span></div>
      <div class="hp-rf-bar" role="img" aria-label="Renda fixa: ${lpPct(rfDepois)} depois do aporte, alvo ${alvo.rendaFixa}%"><i style="width:${(rfDepois * 100).toFixed(1)}%"></i><b style="left:${alvo.rendaFixa}%"></b></div></div>
    <p class="hp-onde-n">Carteira de exemplo de ${brl(60000)}. Valores ilustrativos, não é recomendação.</p>`;
}

/* um lançamento importado do extrato; o do meio confirma de verdade */
function lpLanc(estado, vivo) {
  const feito = estado === 'pronto';
  const nomeL = vivo ? (feito ? 'Posto Avenida' : 'POSTO AVENIDA 2210') : feito ? 'Supermercado Boa Vista' : 'FARMACIA CENTRAL 88';
  const sub = feito ? (vivo ? `Baixa em Transporte de outubro: ${brl(410)} de ${brl(620)}` : `Baixa em Mercado de outubro: ${brl(764)} de ${brl(1150)}`) : 'Importado do extrato de outubro';
  const catN = vivo ? 'Transporte' : feito ? 'Mercado' : 'Saúde';
  const cat = feito ? `<span class="hp-tag ok">${catN}</span>` : `<span class="hp-tag"><i aria-hidden="true"></i>${catN}, sugerido</span>`;
  const acao = vivo ? (feito ? '<button class="hp-mini lnk" type="button" data-act="lp-confirma">Desfazer</button>' : '<button class="hp-mini" type="button" data-act="lp-confirma">Confirmar</button>') : '';
  return `<li class="hp-lanc${feito ? ' feito' : ''}${vivo ? ' vivo' : ''}"><span class="hp-lanc-n"><b>${nomeL}</b><small>${sub}</small></span>
    <span class="hp-lanc-v">−${brl(vivo ? 210 : feito ? 386.4 : 92.9)}</span>${cat}${acao}</li>`;
}

function landingHtml() {
  const logged = !!S.user; const nome = primeiroNome(); const st = lpEstado();
  const rf = (k) => E.PERFIS[k].alvo;
  const perfil = (k) => `<article class="hp-card hp-perfil" data-rv><h3>${E.PERFIS[k].nome}</h3><p>${E.PERFIS[k].desc}</p>
    <div class="hp-pbar" role="img" aria-label="Referência: ${rf(k).rendaFixa}% renda fixa e ${rf(k).bolsa}% renda variável"><i style="width:${rf(k).rendaFixa}%"></i><b style="width:${rf(k).bolsa}%"></b></div>
    <div class="hp-pleg"><span><i class="d1"></i>Renda fixa ${rf(k).rendaFixa}%</span><span><i class="d2"></i>Renda variável ${rf(k).bolsa}%</span></div></article>`;
  const plano = (id) => { const i = infoPlano(id); const d = id === 'completo'; const txt = id !== 'gratis' && precoPlano(id) <= 0;
    return `<article class="hp-card hp-plano${d ? ' rec' : ''}" data-rv>${d ? `<span class="hp-selo">Com o ${esc(nome)}</span>` : ''}
      <h3>${esc(nomePlano(id))}</h3><p class="hp-plano-r">${esc(i.resumo)}</p>
      <p class="hp-preco${txt ? ' txt' : ''}">${esc(precoTxt(id))}</p><p class="hp-plano-n">${d && CFG.precoRegular ? `Condição de lançamento. Valor regular ${brl(CFG.precoRegular)}.` : '&nbsp;'}</p>
      <ul>${i.itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <button class="hp-btn${d ? '' : ' vidro'}" data-act="go-auth" data-mode="signup" data-plano="${id}">${id === 'gratis' ? 'Começar grátis' : id === 'investidor' ? (txt ? 'Quero saber mais' : 'Quero o Investidor') : 'Quero a assessoria'}</button></article>`; };
  const faq = [
    ['O que é o diagnóstico?', 'É uma etapa guiada logo após o cadastro: você informa seu patrimônio atual, responde a sete perguntas de perfil de investidor e define seus objetivos. Com isso o painel já nasce personalizado.'],
    ['Onde ficam os meus dados?', `Seus lançamentos ficam em servidor protegido por login e só você acessa. ${esc(CFG.consultor)} vê apenas seu nome, contato e o resultado do diagnóstico, a menos que você contrate a Assessoria.`],
    ['Como funciona a importação do extrato?', 'Você exporta o extrato ou a fatura em CSV ou OFX no aplicativo do banco e envia o arquivo. O sistema lê no seu aparelho, sugere a categoria de cada lançamento, ignora o que já foi importado e mostra tudo para você conferir antes de gravar.'],
    ['Como ativo a Assessoria?', `Depois do cadastro, você faz o pagamento e envia o comprovante. O ${esc(nome)} confirma e libera o plano na sua conta.`],
    ['O assessor vê os meus lançamentos?', `No Organização e no Investidor, não: o ${esc(nome)} vê nome, contato e o resultado do diagnóstico. Na Assessoria ele também acompanha o planejamento, para orientar você.`],
    ['Posso levar meus dados embora?', 'Sim. A qualquer momento você baixa um backup completo e pode restaurá-lo depois.'],
  ];
  const ve = (s) => `<span class="${s ? 'hp-ve' : 'hp-nve'}">${s ? 'Vê' : 'Não vê'}</span>`;
  const priv = [['Nome e contato', 1, 1], ['Resultado do diagnóstico', 1, 1], ['Orçamento e lançamentos', 0, 1], ['Investimentos e carteira', 0, 1]];
  const cta = logged ? 'Abrir meu painel' : 'Fazer meu diagnóstico gratuito';

  return `<div class="hp">
  <header class="hp-nav"><div class="hp-w hp-nav-in">
    <a class="hp-marca" href="#topo" data-act="scroll" data-to="topo">${logoMarca()}</a>
    <nav class="hp-links" aria-label="Seções"><button data-act="scroll" data-to="produto">Produto</button><button data-act="scroll" data-to="simulador">Simulador</button><button data-act="scroll" data-to="assessoria">Assessoria</button><button data-act="scroll" data-to="planos">Planos</button><button data-act="scroll" data-to="duvidas">Dúvidas</button></nav>
    <div class="hp-nav-a">${logged ? '<button class="hp-btn sm" data-act="open-app">Abrir meu painel</button>' : '<button class="hp-btn sm ghost" data-act="go-auth" data-mode="login">Entrar</button><button class="hp-btn sm" data-act="go-auth" data-mode="signup">Fazer diagnóstico</button>'}</div>
  </div></header>

  <section class="hp-hero" id="topo"><div class="hp-w">
    <p class="hp-pill hp-in">Planejamento financeiro com assessoria de ${esc(CFG.consultor)}</p>
    <h1 class="hp-h1 hp-in">Seu patrimônio,<br><span class="hp-grad">sob controle.</span></h1>
    <p class="hp-sub hp-in">Importe o extrato, veja para onde vai cada real e saiba exatamente onde investir a cada aporte. Em minutos você descobre seu perfil e recebe um diagnóstico do seu momento financeiro.</p>
    <div class="hp-ctas hp-in"><button class="hp-btn lg" data-act="go-auth" data-mode="signup">${cta}</button><button class="hp-lnk" data-act="contact">Falar com o ${esc(nome)} ${I.chev}</button></div>
    <div class="hp-device hp-in" aria-label="Prévia ilustrativa do painel">
      <div class="hp-device-bar" aria-hidden="true"><i></i><i></i><i></i><span>Visão geral</span></div>
      <div class="hp-dash">
        <div class="hp-tile hp-t-patr"><small>Patrimônio estimado</small><b class="hp-num">R$ 487.320</b><span class="hp-pos">+ R$ 74.900 no ano</span><div class="chart" id="hp-line"></div></div>
        <div class="hp-tile hp-t-donut"><small>Composição da carteira</small><div class="donut" id="hp-donut"></div></div>
        <div class="hp-tile hp-t-ring"><small>Objetivo: independência financeira</small><div class="hp-ring-w"><div id="hp-ring"></div><span>Previsto para 2038</span></div></div>
        <div class="hp-tile hp-t-orc"><small>Orçamento de outubro</small><b class="hp-num sm">R$ 4.680 <em>de R$ 6.000</em></b><div class="hp-bar"><i style="width:78%"></i></div><span class="hp-pos">Restam R$ 1.320</span></div>
      </div>
    </div>
    <p class="hp-cap">Prévia ilustrativa, com valores fictícios.</p>
  </div></section>

  <section class="hp-sec" id="produto"><div class="hp-w">
    <div class="hp-head" data-rv><h2 class="hp-h2">Tudo o que importa,<br>em uma única tela.</h2><p class="hp-lead">Patrimônio, orçamento, metas e carteira conectados. Sem planilhas soltas, sem adivinhar.</p></div>
    <div class="hp-feat" data-rv>
      <div class="hp-feat-t"><h3>Um orçamento que você cumpre.</h3><p>Defina quanto pode gastar em cada mês e acompanhe quanto já foi, quanto resta e quanto sobra para investir. Cada categoria mostra para onde o dinheiro está indo.</p></div>
      <div class="hp-card hp-vis"><small>Outubro</small><b class="hp-num">R$ 4.680 <em>de R$ 6.000</em></b><div class="hp-bar lg"><i style="width:78%"></i></div>
        <ul class="hp-cats">${[['Moradia', 100, 2200], ['Alimentação', 52, 1150], ['Transporte', 28, 620], ['Lazer', 20, 430]].map((c) => `<li><span>${c[0]}</span><span class="hp-cat-t"><i style="width:${c[1]}%"></i></span><b>${brl(c[2])}</b></li>`).join('')}</ul></div>
    </div>
    <div class="hp-feat inv" data-rv>
      <div class="hp-feat-t"><h3>Do extrato ao mês, sem digitar.</h3><p>Envie o extrato em CSV ou OFX. Cada lançamento chega com uma categoria sugerida e dá baixa no que você planejou. Nada é gravado sem você conferir: experimente confirmar o do meio.</p></div>
      <div class="hp-card hp-vis"><small>Importação de outubro</small><ul class="hp-lancs">${lpLanc('chega')}</ul><ul class="hp-lancs" id="lp-vivo-w">${lpLanc(st.ok ? 'pronto' : 'chega', true)}</ul><ul class="hp-lancs">${lpLanc('pronto')}</ul></div>
    </div>
    <div class="hp-feat" data-rv>
      <div class="hp-feat-t"><h3>Seu futuro, em números.</h3><p>Projete o patrimônio até o seu objetivo, seja aposentadoria, imóvel ou independência financeira, e veja o efeito de cada aporte no prazo.</p></div>
      <div class="hp-card hp-vis"><small>Projeção ilustrativa</small><div class="chart" id="hp-proj"></div></div>
    </div>
  </div></section>

  <section class="hp-sec" id="simulador"><div class="hp-w">
    <div class="hp-sim hp-dark" data-rv>
      <div class="hp-sim-c">
        <h2 class="hp-h2">Onde vai o<br>próximo aporte?</h2>
        <p class="hp-lead">O aporte vai primeiro para o que está abaixo do alvo do seu perfil. Ninguém vende nada.</p>
        <div class="hp-ctl"><label for="lp-ap">Aporte do mês</label><output id="lp-ap-o">${brl(st.aporte)}</output><input id="lp-ap" type="range" min="500" max="20000" step="500" value="${st.aporte}" data-lp="aporte"></div>
        <div class="hp-ctl"><span class="hp-ctl-l" id="hp-perfil-l">Seu perfil</span><div class="hp-seg" role="group" aria-labelledby="hp-perfil-l">${['conservador', 'moderado', 'agressivo'].map((k) => `<button type="button" data-act="lp-set" data-k="perfil" data-v="${k}" aria-pressed="${st.perfil === k}">${E.PERFIS[k].nome}</button>`).join('')}</div></div>
        <div class="hp-ctl"><span class="hp-ctl-l" id="hp-hoje-l">Sua carteira hoje</span><div class="hp-seg" role="group" aria-labelledby="hp-hoje-l"><button type="button" data-act="lp-set" data-k="hoje" data-v="rf" aria-pressed="${st.hoje === 'rf'}">Mais renda fixa</button><button type="button" data-act="lp-set" data-k="hoje" data-v="rv" aria-pressed="${st.hoje === 'rv'}">Mais ações</button></div></div>
      </div>
      <div class="hp-card hp-onde" id="lp-onde" aria-live="polite">${lpOndeHtml()}</div>
    </div>
  </div></section>

  <section class="hp-sec hp-alt"><div class="hp-w">
    <div class="hp-head" data-rv><h2 class="hp-h2">Qual é o seu perfil<br>de investidor?</h2><p class="hp-lead">Sete perguntas rápidas no diagnóstico mostram como o seu perfil se traduz em uma alocação de referência.</p></div>
    <div class="hp-grid3">${['conservador', 'moderado', 'agressivo'].map(perfil).join('')}</div>
    <div class="hp-center" data-rv><button class="hp-btn lg" data-act="go-auth" data-mode="signup">Descobrir meu perfil</button></div>
  </div></section>

  <section class="hp-sec hp-dark hp-asses" id="assessoria"><div class="hp-w">
    <div class="hp-asses-g">
      <div data-rv><h2 class="hp-h2">Método,<br>não achismo.</h2>
        <p class="hp-lead">${esc(CFG.bio || `Sou ${CFG.consultor}, assessor de investimentos vinculado à XP Inc. Acompanho meus clientes com planejamento financeiro completo e carteira assessorada.`)}</p>
        ${(CFG.credenciais || []).length ? `<ul class="hp-creds">${CFG.credenciais.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        <div class="hp-contato">${contactButtons(baseMsg(`Vi o ${CFG.marca} e gostaria de conversar sobre assessoria.`))}</div></div>
      <ol class="hp-passos">
        <li class="hp-card" data-rv><b>1</b><div><h3>Diagnóstico</h3><p>Entendo seu patrimônio, seu perfil e seus objetivos antes de qualquer recomendação.</p></div></li>
        <li class="hp-card" data-rv><b>2</b><div><h3>Carteira assessorada</h3><p>Montamos juntos a carteira certa para o seu perfil, com alvo claro para cada ativo.</p></div></li>
        <li class="hp-card" data-rv><b>3</b><div><h3>Revisão mensal</h3><p>Todo mês você sabe o que fazer com o próximo aporte e se está no caminho do objetivo.</p></div></li>
      </ol>
    </div>
    <div class="hp-card hp-priv" data-rv><h3>O que o ${esc(nome)} vê, em cada plano</h3>
      <div class="hp-priv-s"><table><thead><tr><th scope="col"><span class="hp-sr">Informação</span></th><th scope="col">Organização e Investidor</th><th scope="col">Assessoria</th></tr></thead>
        <tbody>${priv.map((p) => `<tr><th scope="row">${p[0]}</th><td>${ve(p[1])}</td><td>${ve(p[2])}</td></tr>`).join('')}</tbody></table></div></div>
    ${(CFG.depoimentos || []).length ? `<div class="hp-grid3 hp-depos">${CFG.depoimentos.map((d) => `<figure class="hp-card" data-rv><blockquote>${esc(d.texto)}</blockquote><figcaption>${esc(d.nome)}</figcaption></figure>`).join('')}</div>` : ''}
  </div></section>

  <section class="hp-sec" id="planos"><div class="hp-w">
    <div class="hp-head" data-rv><h2 class="hp-h2">Escolha como começar.</h2><p class="hp-lead">Comece grátis e mude de plano quando quiser.</p></div>
    <div class="hp-grid3 hp-planos">${['gratis', 'investidor', 'completo'].map(plano).join('')}</div>
    <p class="hp-cap">Depois do cadastro, você conclui o pagamento e o ${esc(nome)} confirma a ativação do plano na sua conta.</p>
  </div></section>

  <section class="hp-sec hp-alt" id="duvidas"><div class="hp-w hp-estreito">
    <div class="hp-head" data-rv><h2 class="hp-h2">Perguntas frequentes</h2></div>
    <div class="hp-card hp-faq" data-rv>${faq.map((q) => `<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}</div>
  </div></section>

  <section class="hp-sec"><div class="hp-w">
    <div class="hp-fim hp-dark" data-rv>
      <h2 class="hp-h2">Comece pelo<br>diagnóstico.</h2><p class="hp-lead">Leva poucos minutos e o painel já nasce com a sua cara.</p>
      <form class="hp-fim-f" id="lp-comeco"><label class="hp-sr" for="hp-nome">Como devemos chamar você?</label>
        <input id="hp-nome" name="nome" autocomplete="given-name" placeholder="Como devemos chamar você?" value="${esc(st.nome)}" data-lp="nome">
        <button class="hp-btn lg" type="submit">${logged ? 'Abrir meu painel' : 'Começar agora'}</button></form>
      <p class="hp-fim-n">Grátis no plano Organização.</p>
    </div>
  </div></section>

  <footer class="hp-foot"><div class="hp-w">
    <div class="hp-foot-t">${logoMarca()}<div class="hp-foot-c">${CFG.whatsapp ? `<a href="${esc(waLink(baseMsg()))}" ${ext}>WhatsApp ${esc(CFG.whatsapp)}</a>` : ''}${CFG.email ? `<a href="${esc(mailLink(CFG.marca, baseMsg()))}">${esc(CFG.email)}</a>` : ''}<button class="hp-lnk" data-act="terms">Termos e privacidade</button></div></div>
    <p>O ${esc(CFG.marca)} é uma ferramenta de organização financeira e não constitui oferta ou recomendação de investimento. Rentabilidade passada não garante resultados futuros. O questionário de perfil é simplificado e não substitui a análise de adequação da assessoria.</p>
    <p>© ${NOW_Y} ${esc(CFG.consultor)}. ${esc(CFG.marca)} ${esc(CFG.submarca || '')}.</p>
  </div></footer></div>`;
}

function drawLanding() {
  const meses = MES; const patr = [412, 418, 425, 431, 440, 446, 455, 461, 470, 476, 482, 487].map((x) => x * 1000);
  chartLine($('#hp-line'), { height: 170, zoom: true, labels: meses, aria: 'Evolução ilustrativa do patrimônio', series: [{ color: 'var(--c1)', values: patr, area: true }], tip: (i) => `<b>${meses[i]}</b><br>${brl0(patr[i])}` });
  chartDonut($('#hp-donut'), { aria: 'Composição ilustrativa da carteira', title: '4 classes', sub: 'diversificada', items: [{ label: 'Renda fixa', value: 54, color: 'var(--c1)' }, { label: 'Ações', value: 28, color: 'var(--c2)' }, { label: 'Fundos imobiliários', value: 18, color: 'var(--c3)' }] });
  const ringEl = $('#hp-ring'); if (ringEl) ringEl.innerHTML = ring(0.62, { size: 104, stroke: 10, label: '62%', aria: '62% do objetivo' });
  const proj = E.projetar(180000, 4500, 10, 120); const lab = proj.map((_, i) => (i % 12 === 11 ? String(NOW_Y + Math.floor(i / 12) + 1) : ''));
  chartLine($('#hp-proj'), { height: 220, labels: lab, aria: 'Projeção ilustrativa do patrimônio até o objetivo', goal: 1000000, goalLabel: 'Objetivo: R$ 1 milhão', series: [{ color: 'var(--c1)', values: proj, area: true }], tip: (i) => `<b>${NOW_Y + Math.floor(i / 12)}</b><br>${brl0(proj[i])}` });
}

/* parte viva: atualiza só o trecho, sem redesenhar a página */
function lpAtualiza() { const o = $('#lp-onde'); if (o) o.innerHTML = lpOndeHtml(); const ap = $('#lp-ap-o'); if (ap) ap.textContent = brl(lpEstado().aporte); }
function lpInput(t) {
  const st = lpEstado(); const k = t.dataset.lp;
  if (k === 'aporte') { st.aporte = +t.value || 0; lpAtualiza(); } else if (k === 'nome') st.nome = t.value;
}
function lpAcao(act, el) {
  const st = lpEstado();
  if (act === 'lp-confirma') { st.ok = !st.ok; const w = $('#lp-vivo-w'); if (w) { w.innerHTML = lpLanc(st.ok ? 'pronto' : 'chega', true); const b = w.querySelector('button'); if (b) b.focus(); } return true; }
  if (act === 'lp-set') { st[el.dataset.k] = el.dataset.v; el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === el)); lpAtualiza(); return true; }
  return false;
}
function lpComecar() {
  const st = lpEstado();
  if (S.user) { S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); return; }
  S.authMode = 'signup'; S.authPlano = 'gratis'; S.authErr = ''; S.authDraft = { nome: String(st.nome || '').trim() }; S.screen = 'auth'; render();
}

/* entradas: cada bloco sobe uma vez ao aparecer, em sequência curta. Sem script ou com movimento reduzido, tudo já aparece. */
function initReveal() {
  const raiz = $('.hp'); if (!raiz) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  raiz.classList.add('rv-on');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const irmaos = [...e.target.parentElement.children].filter((x) => x.hasAttribute('data-rv'));
    e.target.style.transitionDelay = Math.min(3, Math.max(0, irmaos.indexOf(e.target))) * 80 + 'ms'; e.target.classList.add('in');
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  raiz.querySelectorAll('[data-rv]').forEach((e) => io.observe(e));
}

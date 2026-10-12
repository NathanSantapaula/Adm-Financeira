/* Página inicial: vende o produto com prévias gráficas do próprio painel. */
'use strict';
function landingHtml() {
  const logged = !!S.user;
  const rf = (k) => E.PERFIS[k].alvo;
  const perfCard = (k) => `<article class="pcard reveal"><h3>${E.PERFIS[k].nome}</h3><p>${E.PERFIS[k].desc}</p>
      <div class="pbar" role="img" aria-label="Referência: ${rf(k).rendaFixa}% renda fixa e ${rf(k).bolsa}% renda variável"><i style="width:${rf(k).rendaFixa}%"></i><b style="width:${rf(k).bolsa}%"></b></div>
      <div class="pleg"><span><i class="d1"></i>Renda fixa ${rf(k).rendaFixa}%</span><span><i class="d2"></i>Renda variável ${rf(k).bolsa}%</span></div></article>`;
  const proof = (CFG.credenciais || []).length ? `<ul class="creds">${CFG.credenciais.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : '';
  const depo = (CFG.depoimentos || []).length ? `<div class="depos">${CFG.depoimentos.map((d) => `<figure class="reveal"><blockquote>${esc(d.texto)}</blockquote><figcaption>${esc(d.nome)}</figcaption></figure>`).join('')}</div>` : '';
  return `<div class="land">
  <header class="lnav"><div class="lnav-in"><a class="lbrand" href="#topo" data-act="scroll" data-to="topo">${LOGO}<span>${esc(CFG.marca)}</span></a>
    <nav class="llinks" aria-label="Seções"><button data-act="scroll" data-to="produto">Produto</button><button data-act="scroll" data-to="assessoria">Assessoria</button><button data-act="scroll" data-to="planos">Planos</button></nav>
    <div class="lcta">${logged ? '<button class="btn primary sm" data-act="open-app">Abrir meu painel</button>' : '<button class="btn ghost sm" data-act="go-auth" data-mode="login">Entrar</button><button class="btn primary sm" data-act="go-auth" data-mode="signup">Fazer diagnóstico</button>'}</div></div></header>

  <section class="hero" id="topo"><div class="hero-in">
    <p class="pill-note reveal">Planejamento financeiro com assessoria de ${esc(CFG.consultor)}</p>
    <h1 class="reveal">Seu patrimônio,<br><span>sob controle.</span></h1>
    <p class="hero-sub reveal">Veja para onde vai cada real, defina metas e saiba exatamente onde investir a cada aporte. Em minutos você descobre seu perfil de investidor e recebe um diagnóstico do seu momento financeiro.</p>
    <div class="hero-cta reveal"><button class="btn primary lg" data-act="go-auth" data-mode="signup">${logged ? 'Abrir meu painel' : 'Fazer meu diagnóstico gratuito'}</button><button class="lnk-arrow" data-act="contact">Falar com o ${esc(primeiroNome())} ${I.chev}</button></div>
    <div class="mock reveal" aria-label="Prévia ilustrativa do painel"><div class="mock-bar"><i></i><i></i><i></i><span>Visão geral</span></div>
      <div class="mock-grid">
        <div class="m-card m-wide"><div class="m-k">Patrimônio estimado</div><div class="m-v">R$ 487.320</div><div class="m-d">+ R$ 74.900 no ano</div><div class="chart" id="lp-line"></div></div>
        <div class="m-card m-donut"><div class="m-k">Composição da carteira</div><div class="donut" id="lp-donut"></div></div>
        <div class="m-card m-ring"><div class="m-k">Objetivo: independência financeira</div><div id="lp-ring"></div><div class="m-d">Previsto para 2038</div></div>
        <div class="m-card m-orc"><div class="m-k">Orçamento de outubro</div><div class="m-v sm">R$ 4.680 <small>de R$ 6.000</small></div><div class="bar"><i style="width:78%"></i></div><div class="m-d">Restam R$ 1.320</div></div>
      </div></div>
    <p class="cap center">Prévia ilustrativa, com valores fictícios.</p></div></section>

  <section class="sec" id="produto"><div class="wrap"><h2 class="h2 reveal">Tudo o que importa,<br>em uma única tela.</h2><p class="lead reveal">Patrimônio, orçamento, metas e carteira conectados. Sem planilhas soltas, sem adivinhar.</p>
    <div class="feat reveal"><div class="feat-txt"><h3>Um orçamento que você realmente cumpre.</h3><p>Defina quanto pode gastar no mês e acompanhe, em tempo real, quanto já foi, quanto resta e quanto sobra para investir. Parcelamentos entram como um único item e se distribuem pelos meses sozinhos.</p></div>
      <div class="feat-vis"><div class="vcard"><div class="v-k">Outubro</div><div class="v-big">R$ 4.680 <small>de R$ 6.000</small></div><div class="bar"><i style="width:78%"></i></div>
        <ul class="hbars"><li><span class="hb-l">Moradia</span><span class="hb-t"><i style="width:100%"></i></span><span class="hb-v">R$ 2.200</span></li><li><span class="hb-l">Alimentação</span><span class="hb-t"><i style="width:52%"></i></span><span class="hb-v">R$ 1.150</span></li><li><span class="hb-l">Transporte</span><span class="hb-t"><i style="width:28%"></i></span><span class="hb-v">R$ 620</span></li><li><span class="hb-l">Lazer</span><span class="hb-t"><i style="width:20%"></i></span><span class="hb-v">R$ 430</span></li></ul></div></div></div>
    <div class="feat flip reveal"><div class="feat-txt"><h3>Uma carteira que se mantém no rumo.</h3><p>Defina a alocação ideal e, a cada aporte, o sistema mostra exatamente onde investir para voltar ao alvo, sem precisar vender nada.</p></div>
      <div class="feat-vis"><div class="vcard"><div class="v-k">Onde investir R$ 5.000</div>
        <ol class="alloc"><li><span class="a-n">Tesouro Selic<small>Renda fixa</small></span><span class="a-v">R$ 2.350</span></li><li><span class="a-n">CDB Banco Exemplo<small>Renda fixa</small></span><span class="a-v">R$ 1.650</span></li><li><span class="a-n">WXYZ11<small>Fundos imobiliários</small></span><span class="a-v">R$ 1.000</span></li></ol>
        <div class="meters"><div><span>Renda fixa</span><div class="meter"><i style="width:54%"></i><b style="left:60%"></b></div></div><div><span>Ações</span><div class="meter"><i style="width:28%"></i><b style="left:25%"></b></div></div><div><span>Fundos imobiliários</span><div class="meter"><i style="width:18%"></i><b style="left:15%"></b></div></div></div></div></div></div>
    <div class="feat reveal"><div class="feat-txt"><h3>Seu futuro, em números.</h3><p>Projete o patrimônio até o seu objetivo, seja aposentadoria, imóvel ou independência financeira, e veja o efeito de cada aporte no prazo.</p></div>
      <div class="feat-vis"><div class="vcard"><div class="v-k">Projeção ilustrativa</div><div class="chart" id="lp-proj"></div></div></div></div></div></section>

  <section class="sec alt"><div class="wrap"><h2 class="h2 reveal">Qual é o seu perfil de investidor?</h2><p class="lead reveal">Responda a sete perguntas rápidas no seu diagnóstico e veja como seu perfil se traduz em uma alocação de referência.</p>
    <div class="profiles">${['conservador', 'moderado', 'agressivo'].map(perfCard).join('')}</div>
    <div class="center reveal" style="margin-top:34px"><button class="btn primary lg" data-act="go-auth" data-mode="signup">Descobrir meu perfil</button></div></div></section>

  <section class="sec dark" id="assessoria"><div class="wrap"><div class="about"><div><h2 class="h2 reveal">Método, não achismo.</h2>
    <p class="lead reveal">${esc(CFG.bio || `Sou ${CFG.consultor}. Acompanho meus clientes com planejamento financeiro completo e carteira de investimentos assessorada, via XP Inc.`)}</p>${proof}
    <div class="reveal" style="margin-top:22px">${contactButtons(baseMsg('Vi o Financial planning e gostaria de conversar sobre assessoria.'))}</div></div>
    <div class="pillars"><div class="pillar reveal"><b>1</b><div><h3>Diagnóstico</h3><p>Entendo seu patrimônio, seu perfil e seus objetivos antes de qualquer recomendação.</p></div></div>
      <div class="pillar reveal"><b>2</b><div><h3>Carteira assessorada</h3><p>Montamos juntos a carteira certa para o seu perfil, com alvo claro para cada ativo.</p></div></div>
      <div class="pillar reveal"><b>3</b><div><h3>Revisão mensal</h3><p>Todo mês você sabe o que fazer com o próximo aporte e se está no caminho do objetivo.</p></div></div></div></div>${depo}</div></section>

  <section class="sec" id="planos"><div class="wrap"><h2 class="h2 center reveal">Escolha como começar.</h2>
    <div class="plans2">
      <article class="plan2 reveal"><h3>Organização</h3><p class="pd">Para colocar a casa em ordem.</p><div class="price2"><b>R$ 0</b></div>
        <ul><li>Diagnóstico de perfil e patrimônio</li><li>Rendas, conta corrente, investimentos e proventos</li><li>Orçamento mensal e metas de aportes</li><li>Backup completo dos seus dados</li></ul>
        <button class="btn lg" data-act="go-auth" data-mode="signup">Começar pelo diagnóstico</button></article>
      <article class="plan2 feat-plan reveal"><h3>Assessoria</h3><p class="pd">Planejamento completo com ${esc(CFG.consultor)}.</p><div class="price2"><b>${brl(CFG.precoPor)}</b></div><p class="launch">Condição de lançamento. Valor regular ${brl(CFG.precoRegular)}.</p>
        <ul><li>Tudo do plano de Organização</li><li>Assessoria exclusiva com ${esc(CFG.consultor)}, via XP Inc.</li><li>Planejamento financeiro completo, com carteira de investimentos assessorada</li><li>Aba Carteira: onde investir a cada aporte</li><li>Importação de planilhas .xlsx</li></ul>
        <button class="btn primary lg" data-act="go-auth" data-mode="signup" data-plano="completo">Quero a assessoria</button></article></div>
    <p class="cap center">Depois do cadastro, você conclui o pagamento e o ${esc(primeiroNome())} confirma a ativação do plano completo.</p></div></section>

  <section class="sec alt"><div class="wrap narrow"><h2 class="h2 center reveal">Perguntas frequentes</h2>
    <details class="reveal"><summary>O que é o diagnóstico?</summary><p>É uma etapa guiada logo após o cadastro: você informa seu patrimônio atual, responde ao questionário de perfil de investidor e define seu objetivo. Com isso o painel já nasce personalizado.</p></details>
    <details class="reveal"><summary>Onde ficam os meus dados?</summary><p>Seus lançamentos ficam em servidor protegido por login e só você acessa. ${esc(CFG.consultor)} vê apenas seu nome, contato e o resultado do diagnóstico.</p></details>
    <details class="reveal"><summary>Como ativo o plano de assessoria?</summary><p>Depois do cadastro, você faz o pagamento e envia o comprovante. O ${esc(primeiroNome())} confirma e libera o plano completo na sua conta.</p></details>
    <details class="reveal"><summary>Posso levar meus dados embora?</summary><p>Sim. Em qualquer momento você baixa um backup completo e pode restaurá-lo depois.</p></details></div></section>

  <section class="sec closing"><div class="wrap center"><h2 class="h2 reveal">Comece pelo diagnóstico.<br>Leva poucos minutos.</h2><div class="reveal" style="margin-top:26px"><button class="btn primary lg" data-act="go-auth" data-mode="signup">Fazer meu diagnóstico gratuito</button></div></div></section>

  <footer class="lfoot"><div class="wrap"><p>© ${NOW_Y} ${esc(CFG.consultor)}. ${esc(CFG.marca)}.</p>
    <p>O ${esc(CFG.marca)} é uma ferramenta de organização financeira e não constitui oferta ou recomendação de investimento. Rentabilidade passada não garante resultados futuros. O questionário de perfil é simplificado e não substitui a análise de adequação da assessoria.</p>
    <p><button class="lnk" data-act="terms">Termos e privacidade</button></p></div></footer></div>`;
}

function drawLanding() {
  const meses = MES; const patr = [412, 418, 425, 431, 440, 446, 455, 461, 470, 476, 482, 487].map((x) => x * 1000);
  chartLine($('#lp-line'), { height: 250, zoom: true, labels: meses, aria: 'Evolução ilustrativa do patrimônio', series: [{ color: 'var(--c1)', values: patr, area: true }], tip: (i) => `<b>${meses[i]}</b><br>${brl0(patr[i])}` });
  chartDonut($('#lp-donut'), { aria: 'Composição ilustrativa da carteira', title: '4 classes', sub: 'diversificada', items: [{ label: 'Renda fixa', value: 54, color: 'var(--c1)' }, { label: 'Ações', value: 28, color: 'var(--c2)' }, { label: 'Fundos imobiliários', value: 18, color: 'var(--c3)' }] });
  const ringEl = $('#lp-ring'); if (ringEl) ringEl.innerHTML = ring(0.62, { size: 110, stroke: 10, label: '62%', aria: '62% do objetivo' });
  const proj = E.projetar(180000, 4500, 10, 120); const lab = proj.map((_, i) => (i % 12 === 11 ? String(NOW_Y + Math.floor(i / 12) + 1) : ''));
  chartLine($('#lp-proj'), { height: 220, labels: lab, aria: 'Projeção ilustrativa do patrimônio até o objetivo', goal: 1000000, goalLabel: 'Objetivo: R$ 1 milhão', series: [{ color: 'var(--c1)', values: proj, area: true }], tip: (i) => `<b>${NOW_Y + Math.floor(i / 12)}</b><br>${brl0(proj[i])}` });
}

function initReveal() {
  const els = $$('.reveal:not(.in)');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}

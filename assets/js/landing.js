/* Página inicial: montada como um relatório impresso. Os "quadros" são fragmentos da própria interface (data-ui),
   com valores ilustrativos; a parte viva é o cálculo de onde vai o próximo aporte (E.rebalance, o mesmo da aba Carteira). */
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
const lpEstado = () => (S.lp = S.lp || { aporte: 5000, perfil: 'moderado', hoje: 'rf', ve: false, ok: false, nome: 'Mariana', plano: 'completo' });

function lpCalculo() {
  const st = lpEstado(); const alvo = E.PERFIS[st.perfil].alvo; const hoje = LP_HOJE[st.hoje]; const total = 60000;
  const items = LP_ATIVOS.map((a) => ({ ...a, w: a.p * (a.k === 'rf' ? alvo.rendaFixa : alvo.bolsa), v: total * hoje[a.k] * a.p }));
  const r = E.rebalance(items, st.aporte);
  const linhas = items.map((a, i) => ({ ...a, val: r.alloc[i] })).filter((a) => a.val >= 0.5).sort((a, b) => b.val - a.val);
  const rfDepois = items.reduce((s, a, i) => s + (a.k === 'rf' ? a.v + r.alloc[i] : 0), 0) / (total + st.aporte);
  return { st, alvo, linhas, rfHoje: hoje.rf, rfDepois };
}
const lpPct = (x) => Math.round(x * 100) + '%';

/* fragmento: "Onde investir", igual à aba Carteira */
function lpOndeHtml() {
  const { st, alvo, linhas, rfHoje, rfDepois } = lpCalculo();
  return `<div class="lp-ui lp-onde" data-ui><div class="lp-ui-h"><b>Onde investir ${brl(st.aporte)}</b><span>Perfil ${esc(E.PERFIS[st.perfil].nome.toLowerCase())}</span></div>
    <ol class="lp-onde-l">${linhas.map((a) => `<li><span>${esc(a.n)}<small>${esc(a.c)}</small></span><b>${brl(a.val)}</b></li>`).join('')}</ol>
    <div class="lp-onde-rf"><div class="lp-onde-rf-t"><span>Renda fixa</span><span>${lpPct(rfHoje)} hoje · ${lpPct(rfDepois)} depois · alvo ${alvo.rendaFixa}%</span></div>
      <div class="lp-onde-bar" role="img" aria-label="Renda fixa: ${lpPct(rfDepois)} depois do aporte, alvo ${alvo.rendaFixa}%"><i style="width:${(rfDepois * 100).toFixed(1)}%"></i><b style="left:${alvo.rendaFixa}%"></b></div></div>
    ${st.ve ? `<p class="lp-onde-ve">Visível para ${esc(CFG.consultor)} no plano Assessoria, para montar a carteira recomendada com você.</p>` : ''}
    <p class="lp-onde-n">Carteira de exemplo de ${brl(60000)}. Valores ilustrativos; nada aqui é recomendação.</p></div>`;
}

/* fragmento: um lançamento importado do extrato, em três momentos */
function lpLanc(estado, vivo) {
  const feito = estado === 'pronto';
  const cat = feito ? '<span class="lp-chip ok">Mercado</span>' : '<span class="lp-chip"><i class="lp-conf" aria-hidden="true"></i>Mercado, sugerido</span>';
  const acoes = estado === 'confere' ? `<div class="lp-lanc-a"><label class="lp-sel"><span class="sr">Categoria</span><select aria-label="Categoria"><option>Mercado</option><option>Restaurantes</option><option>Casa</option></select></label>
      <label class="lp-chk"><input type="checkbox" checked> Lembrar para este estabelecimento</label>
      <button class="lp-ui-btn" type="button" ${vivo ? 'data-act="lp-confirma"' : 'tabindex="-1"'}>Confirmar</button></div>` : '';
  const desfaz = feito && vivo ? '<button class="lp-ui-lnk" type="button" data-act="lp-confirma">Desfazer</button>' : '';
  return `<div class="lp-ui lp-lanc${estado === 'confere' ? ' sob' : ''}${feito ? ' feito' : ''}" data-ui${vivo ? ' id="lp-vivo"' : ''}>
    <span class="lp-lanc-d">12 out</span>
    <span class="lp-lanc-n"><b>${feito ? 'Supermercado Boa Vista' : 'SUPERMERCADO BOA VISTA 0412'}</b><small>${feito ? `Baixa em Mercado de outubro: ${brl(764)} de ${brl(1150)}` : 'Importado do extrato de outubro'}</small></span>
    ${cat}<span class="lp-lanc-v">−${brl(386.4)}</span>${desfaz}${acoes}</div>`;
}
function lpVivoHtml() { return lpLanc(lpEstado().ok ? 'pronto' : 'confere', true); }

function landingHtml() {
  const logged = !!S.user; const st = lpEstado(); const nome = primeiroNome();
  const linha = (t) => `<span class="lp-ln"><span>${t}</span></span>`;
  const sim = (txt) => `<span class="lp-v">${txt}</span>`; const nao = '<span class="lp-v nao">Não incluído</span>';
  const planos = ['gratis', 'investidor', 'completo'];
  const linhasPlano = [
    ['Para quem é', planos.map((id) => `<span class="lp-v">${esc(infoPlano(id).resumo)}</span>`)],
    ['Orçamento, conta corrente e extratos', planos.map(() => sim('Incluído'))],
    ['Investimentos, proventos e carteira', [nao, sim('Incluído'), sim('Incluído')]],
    ['Onde investir a cada aporte', [nao, sim('Incluído'), sim('Incluído')]],
    [`Carteira recomendada pelo ${esc(nome)}`, [nao, nao, sim('Incluído')]],
    [`O ${esc(nome)} acompanha o seu planejamento`, [sim('Não'), sim('Não'), sim('Sim, todo mês')]],
  ];
  const botaoPlano = (id) => `<button class="lp-btn${id === 'completo' ? ' inv' : ' sec'}" data-act="go-auth" data-mode="signup" data-plano="${id}">${id === 'gratis' ? 'Começar grátis' : id === 'investidor' ? (precoPlano(id) > 0 ? 'Quero o Investidor' : 'Quero saber mais') : 'Quero a assessoria'}</button>`;
  const faq = [
    ['O que é o diagnóstico?', 'É uma etapa guiada logo após o cadastro: você informa seu patrimônio atual, responde a sete perguntas de perfil de investidor e define seus objetivos. Com isso o painel já nasce personalizado.'],
    ['Onde ficam os meus dados?', `Seus lançamentos ficam em servidor protegido por login e só você acessa. ${esc(CFG.consultor)} vê apenas seu nome, contato e o resultado do diagnóstico, a menos que você contrate a Assessoria.`],
    ['Como funciona a importação do extrato?', 'Você exporta o extrato ou a fatura em CSV ou OFX no aplicativo do banco e envia o arquivo. O sistema lê no seu aparelho, sugere a categoria de cada lançamento, ignora o que já foi importado e mostra tudo para você conferir antes de gravar.'],
    ['Como ativo a Assessoria?', `Depois do cadastro, você faz o pagamento e envia o comprovante. O ${esc(nome)} confirma e libera o plano na sua conta.`],
    ['O assessor vê os meus lançamentos?', `No Organização e no Investidor, não: o ${esc(nome)} vê nome, contato e o resultado do diagnóstico. Na Assessoria ele também acompanha o planejamento, para orientar você.`],
    ['Posso levar meus dados embora?', 'Sim. A qualquer momento você baixa um backup completo e pode restaurá-lo depois.'],
  ];
  const ve = (s) => `<span class="lp-pv-v${s ? '' : ' nao'}">${s ? 'Vê' : 'Não vê'}</span>`;
  const privacidade = [['Nome e contato', 1, 1], ['Resultado do diagnóstico', 1, 1], ['Orçamento e lançamentos', 0, 1], ['Investimentos e carteira', 0, 1]];
  const email = String(CFG.email || ''); const arroba = email.indexOf('@');
  return `<div class="lp">
  <header class="lp-top"><a class="lp-marca" href="#topo" data-act="scroll" data-to="topo">${logoMarca()}</a>
    <nav class="lp-links" aria-label="Seções"><button data-act="scroll" data-to="produto">Produto</button><button data-act="scroll" data-to="aporte">Simulador</button><button data-act="scroll" data-to="assessoria">Assessoria</button><button data-act="scroll" data-to="planos">Planos</button></nav>
    <div class="lp-acao">${logged ? '<button class="lp-btn" data-act="open-app">Abrir meu painel</button>' : '<button class="lp-lnk" data-act="go-auth" data-mode="login">Entrar</button><button class="lp-btn" data-act="go-auth" data-mode="signup">Fazer diagnóstico</button>'}</div></header>

  <section class="lp-hero" id="topo">
    <div class="lp-mosaico" aria-label="Fragmentos do painel, com valores ilustrativos">
      <div class="lp-t t-navy t-alta"></div>
      <div class="lp-q q-patr"><div class="lp-ui" data-ui><small>Patrimônio estimado</small><b class="lp-fig">R$ 487.320</b><span class="lp-pos">+ R$ 74.900 no ano</span><div class="chart" id="lp-line"></div></div></div>
      <div class="lp-t t-azul"></div>
      <div class="lp-q q-obj"><div class="lp-ui" data-ui><small>Independência financeira</small><div id="lp-ring"></div><span>Previsto para 2038</span></div></div>
      <div class="lp-t t-claro"></div>
      <div class="lp-t t-claro q-m"></div>
      <div class="lp-q q-orc"><div class="lp-ui" data-ui><small>Orçamento de outubro</small><b class="lp-fig">R$ 4.680</b><span>de R$ 6.000 · restam R$ 1.320</span><div class="lp-ui-bar"><i style="width:78%"></i></div></div></div>
      <div class="lp-q q-onde"><div class="lp-ui" data-ui><small>Onde investir R$ 5.000</small><ol class="lp-mini"><li><span>Tesouro Selic</span><b>R$ 2.350</b></li><li><span>CDB pós-fixado</span><b>R$ 1.650</b></li><li><span>Fundo imobiliário</span><b>R$ 1.000</b></li></ol></div></div>
      <div class="lp-t t-tinta"></div>
    </div>
    <p class="lp-nota">Fragmentos do painel com valores ilustrativos.</p>
    <div class="lp-hero-txt">
      <div class="lp-hero-l"><p class="lp-stand">Orçamento, carteira e o próximo aporte no mesmo lugar, revisados todo mês com o ${esc(nome)}.</p>
        <div class="lp-hero-a"><button class="lp-btn" data-act="go-auth" data-mode="signup">${logged ? 'Abrir meu painel' : 'Fazer meu diagnóstico gratuito'}</button><button class="lp-lnk" data-act="contact">Falar com o ${esc(nome)}</button></div></div>
      <h1 class="lp-titulo">${linha('Seu dinheiro,')}${linha('com método.')}</h1>
    </div>
  </section>

  <section class="lp-sec lp-show" id="produto">
    <h2 class="lp-h" data-rv>Do extrato ao mês.</h2>
    <p class="lp-show-p" data-rv>O extrato entra, cada lançamento ganha uma categoria e dá baixa no que você planejou. Nada é gravado sem você conferir.</p>
    <div class="lp-estados">
      <div class="lp-estado" data-rv><span class="lp-estado-w">Chega</span>${lpLanc('chega')}</div>
      <div class="lp-estado" data-rv><span class="lp-estado-w">Você confere</span><div id="lp-vivo-w">${lpVivoHtml()}</div></div>
      <div class="lp-estado" data-rv><span class="lp-estado-w">Pronto</span>${lpLanc('pronto')}</div>
    </div>
  </section>

  <section class="lp-sec lp-etapas">
    <h2 class="lp-h lp-h-xl" data-rv>Do cadastro<br>à revisão do mês.</h2>
    <div class="lp-barra" data-ui data-rv>
      <div class="lp-seg s1" style="flex-grow:4"><h3>Dois minutos</h3><p>Primeiro, o cadastro: nome, e-mail e plano.</p></div>
      <div class="lp-seg s2" style="flex-grow:10"><h3>Dez minutos</h3><p>Depois, o diagnóstico: patrimônio, perfil e objetivos.</p></div>
      <div class="lp-seg s3" style="flex-grow:30"><h3>Trinta dias</h3><p>Em seguida, o primeiro mês: o extrato entra e o orçamento se ajusta.</p></div>
      <div class="lp-seg s4" style="flex-grow:26"><h3>Todo mês</h3><p>Por fim, a revisão: onde vai o próximo aporte, com o ${esc(nome)}.</p></div>
    </div>
  </section>

  <section class="lp-aporte" id="aporte">
    <div class="lp-aporte-f"><div class="lp-aporte-o" id="lp-onde" aria-live="polite">${lpOndeHtml()}</div></div>
    <div class="lp-aporte-c">
      <h2 class="lp-h">Onde vai o próximo aporte.</h2>
      <div class="lp-bloco"><p class="lp-frase">Diga quanto vai investir.</p><p>O valor costuma sair da sobra do orçamento do mês. Mude e veja a divisão mudar.</p>
        <div class="lp-ctl"><label for="lp-ap">Aporte do mês</label><output id="lp-ap-o">${brl(st.aporte)}</output><input id="lp-ap" type="range" min="500" max="20000" step="500" value="${st.aporte}" data-lp="aporte"></div></div>
      <div class="lp-bloco"><p class="lp-frase">Escolha o seu perfil.</p><p>O diagnóstico define a referência entre renda fixa e renda variável. Troque para comparar.</p>
        <div class="lp-seg-c" role="group" aria-label="Perfil">${['conservador', 'moderado', 'agressivo'].map((k) => `<button type="button" data-act="lp-set" data-k="perfil" data-v="${k}" aria-pressed="${st.perfil === k}">${E.PERFIS[k].nome}</button>`).join('')}</div></div>
      <div class="lp-bloco"><p class="lp-frase">Comece de onde você está.</p><p>O aporte vai primeiro para o que está abaixo do alvo. Ninguém vende nada.</p>
        <div class="lp-seg-c" role="group" aria-label="Carteira de hoje"><button type="button" data-act="lp-set" data-k="hoje" data-v="rf" aria-pressed="${st.hoje === 'rf'}">Mais renda fixa</button><button type="button" data-act="lp-set" data-k="hoje" data-v="rv" aria-pressed="${st.hoje === 'rv'}">Mais ações</button></div></div>
      <div class="lp-bloco"><p class="lp-frase">Leve para a reunião.</p><p>Na Assessoria, o ${esc(nome)} vê esta mesma conta e monta a carteira recomendada com você.</p>
        <label class="lp-tog"><input type="checkbox" data-lp="ve" ${st.ve ? 'checked' : ''}><span aria-hidden="true"></span>Mostrar o que o ${esc(nome)} vê</label></div>
    </div>
  </section>

  <section class="lp-sec lp-sobre" id="assessoria">
    <div class="lp-sobre-r">
      <dl class="lp-fatos" data-rv><div><dt>Assessor</dt><dd>${esc(CFG.consultor)}</dd></div><div><dt>Vínculo</dt><dd>XP Inc.</dd></div><div><dt>Atendimento</dt><dd>WhatsApp, e-mail e reunião agendada</dd></div></dl>
      <div class="lp-sobre-t" data-rv><p class="lp-par">${esc(CFG.bio || `Sou ${CFG.consultor}, assessor de investimentos vinculado à XP Inc. Primeiro entendo seu patrimônio, seu perfil e seus objetivos. Depois montamos juntos a carteira, com um alvo claro para cada ativo. E todo mês revisamos onde vai o próximo aporte.`)}</p>
        ${(CFG.credenciais || []).length ? `<ul class="lp-creds">${CFG.credenciais.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        <div class="lp-contato">${contactButtons(baseMsg(`Vi o ${CFG.marca} e gostaria de conversar sobre assessoria.`))}</div></div>
    </div>
    <div class="lp-sobre-r lp-pv" data-rv>
      <p class="lp-pv-w">O que o ${esc(nome)} vê</p>
      <div class="lp-pv-c"><p class="lp-pv-h">Organização e Investidor</p><ul>${privacidade.map((x) => `<li><span>${x[0]}</span>${ve(x[1])}</li>`).join('')}</ul></div>
      <div class="lp-pv-c"><p class="lp-pv-h">Assessoria</p><ul>${privacidade.map((x) => `<li><span>${x[0]}</span>${ve(x[2])}</li>`).join('')}</ul></div>
    </div>
    ${(CFG.depoimentos || []).length ? `<div class="lp-depos">${CFG.depoimentos.map((d) => `<figure data-rv><blockquote>${esc(d.texto)}</blockquote><figcaption>${esc(d.nome)}</figcaption></figure>`).join('')}</div>` : ''}
  </section>

  <section class="lp-sec lp-planos" id="planos">
    <table class="lp-tab" data-rv>
      <colgroup><col>${planos.map((id) => `<col${id === "completo" ? " class=\"rec\"" : ""}>`).join("")}</colgroup>
      <thead><tr><th scope="col" class="lp-tab-h"><h2 class="lp-h">Escolha como começar.</h2></th>${planos.map((id) => `<th scope="col" class="${id === 'completo' ? 'rec' : ''}"><span class="lp-pn">${esc(nomePlano(id))}</span><span class="lp-pp">${esc(precoTxt(id))}</span>${id === 'completo' && CFG.precoRegular ? `<small>Condição de lançamento. Valor regular ${brl(CFG.precoRegular)}.</small>` : ''}</th>`).join('')}</tr></thead>
      <tbody>${linhasPlano.map((l) => `<tr><th scope="row">${l[0]}</th>${l[1].map((c, i) => `<td class="${planos[i] === 'completo' ? 'rec' : ''}">${c}</td>`).join('')}</tr>`).join('')}
        <tr class="lp-tab-b"><th scope="row"><span class="sr">Contratar</span></th>${planos.map((id) => `<td class="${id === 'completo' ? 'rec' : ''}">${botaoPlano(id)}</td>`).join('')}</tr></tbody>
    </table>
    <div class="lp-planos-m">${planos.map((id) => `<article class="lp-pm${id === 'completo' ? ' rec' : ''}"><h3><span>${esc(nomePlano(id))}</span><span>${esc(precoTxt(id))}</span></h3>${id === 'completo' && CFG.precoRegular ? `<p class="lp-pm-n">Condição de lançamento. Valor regular ${brl(CFG.precoRegular)}.</p>` : ''}
      <dl>${linhasPlano.map((l) => `<div><dt>${l[0]}</dt><dd>${l[1][planos.indexOf(id)]}</dd></div>`).join('')}</dl>${botaoPlano(id)}</article>`).join('')}</div>
    <p class="lp-planos-n">Depois do cadastro, você conclui o pagamento e o ${esc(nome)} confirma a ativação do plano na sua conta.</p>
  </section>

  <section class="lp-faq" aria-labelledby="lp-faq-h">
    <div class="lp-faq-t"><h2 class="lp-h lp-h-xl" id="lp-faq-h" data-rv>Perguntas<br>frequentes.</h2></div>
    ${faq.map((q) => `<div class="lp-faq-b"><h3 data-rv>${q[0]}</h3><p data-rv>${q[1]}</p></div>`).join('')}
  </section>

  <section class="lp-fim">
    <div class="lp-fim-t"><h2 class="lp-h lp-h-xl" data-rv>Comece<br>por você.</h2><p data-rv>O botão cria sua conta com este nome e abre o diagnóstico. Leva uns dez minutos.</p></div>
    <form class="lp-ui lp-dlg" data-ui id="lp-comeco" data-rv>
      <p class="lp-dlg-t">Vamos começar por você.</p>
      <label class="lp-dlg-f"><span>Como devemos chamar você?</span><input name="nome" autocomplete="given-name" value="${esc(st.nome)}" data-lp="nome"></label>
      <div class="lp-dlg-f"><span id="lp-plano-l">Plano</span><div class="lp-seg-c claro" role="group" aria-labelledby="lp-plano-l"><button type="button" data-act="lp-set" data-k="plano" data-v="gratis" aria-pressed="${st.plano === 'gratis'}">Organização</button><button type="button" data-act="lp-set" data-k="plano" data-v="completo" aria-pressed="${st.plano === 'completo'}">Assessoria</button></div></div>
      <button class="lp-ui-btn lg" type="submit">${logged ? 'Abrir meu painel' : 'Criar conta e fazer o diagnóstico'}</button>
    </form>
  </section>

  <footer class="lp-rodape">
    <div class="lp-rodape-top"><div class="lp-rodape-n"><span class="lp-rodape-m">${logoMarca()}</span><p>Planejamento financeiro com assessoria de ${esc(CFG.consultor)}, via XP Inc.</p>${CFG.whatsapp ? `<p>WhatsApp <a href="${esc(waLink(baseMsg()))}" ${ext}>${esc(CFG.whatsapp)}</a></p>` : ''}</div>
      <button class="lp-lnk" data-act="scroll" data-to="topo">Voltar ao topo</button></div>
    ${email ? `<a class="lp-email" href="${esc(mailLink(CFG.marca, baseMsg()))}"><span>${esc(email.slice(0, arroba))}</span><span>${esc(email.slice(arroba))}</span></a>` : ''}
    <p class="lp-legal">O ${esc(CFG.marca)} é uma ferramenta de organização financeira e não constitui oferta ou recomendação de investimento. Rentabilidade passada não garante resultados futuros. O questionário de perfil é simplificado e não substitui a análise de adequação da assessoria.</p>
    <div class="lp-meta"><button class="lp-lnk" data-act="terms">Termos e privacidade</button><span>© ${NOW_Y} ${esc(CFG.consultor)}</span><span>${esc(CFG.marca)} ${esc(CFG.submarca || '')}</span></div>
  </footer></div>`;
}

function drawLanding() {
  const patr = [412, 418, 425, 431, 440, 446, 455, 461, 470, 476, 482, 487].map((x) => x * 1000);
  chartLine($('#lp-line'), { height: 92, labels: MES.map(() => ''), aria: 'Evolução ilustrativa do patrimônio', series: [{ color: 'var(--accent)', values: patr, area: false }], tip: (i) => `<b>${MES[i]}</b><br>${brl0(patr[i])}` });
  const ringEl = $('#lp-ring'); if (ringEl) ringEl.innerHTML = ring(0.62, { size: 84, stroke: 8, label: '62%', aria: '62% do objetivo' });
}

/* parte viva: atualiza só o fragmento, sem redesenhar a página */
function lpAtualiza() { const o = $('#lp-onde'); if (o) o.innerHTML = lpOndeHtml(); const ap = $('#lp-ap-o'); if (ap) ap.textContent = brl(lpEstado().aporte); }
function lpInput(t) {
  const st = lpEstado(); const k = t.dataset.lp;
  if (k === 'aporte') { st.aporte = +t.value || 0; lpAtualiza(); }
  else if (k === 've') { st.ve = t.checked; lpAtualiza(); }
  else if (k === 'nome') st.nome = t.value;
}
function lpAcao(act, el) {
  const st = lpEstado();
  if (act === 'lp-confirma') { st.ok = !st.ok; const w = $('#lp-vivo-w'); if (w) { w.innerHTML = lpVivoHtml(); const b = w.querySelector('button'); if (b) b.focus(); } return true; }
  if (act === 'lp-set') {
    st[el.dataset.k] = el.dataset.v;
    el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === el));
    if (el.dataset.k !== 'plano') lpAtualiza(); return true;
  }
  return false;
}
function lpComecar() {
  const st = lpEstado();
  if (S.user) { S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); return; }
  S.authMode = 'signup'; S.authPlano = st.plano === 'completo' ? 'completo' : 'gratis'; S.authErr = ''; S.authDraft = { nome: String(st.nome || '').trim() };
  S.screen = 'auth'; render();
}

/* entradas: cada parte de uma seção sobe uma vez ao aparecer, em sequência curta. O conteúdo já é visível sem script. */
function initReveal() {
  const raiz = $('.lp'); if (!raiz) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  raiz.classList.add('rv-on');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const irmaos = [...e.target.parentElement.querySelectorAll(':scope > [data-rv], :scope > * > [data-rv]')];
    e.target.style.transitionDelay = Math.min(4, Math.max(0, irmaos.indexOf(e.target))) * 70 + 'ms'; e.target.classList.add('in');
  }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  raiz.querySelectorAll('[data-rv]').forEach((e) => io.observe(e));
}

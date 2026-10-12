/* Login, cadastro, onboarding (diagnóstico) e checkout. */
'use strict';
const OBJETIVOS = [['independencia', 'Independência financeira'], ['aposentadoria', 'Aposentadoria'], ['imovel', 'Compra de imóvel'], ['reserva', 'Reserva de emergência'], ['educacao', 'Educação'], ['outro', 'Outro objetivo']];
const objNome = (t) => (OBJETIVOS.find((o) => o[0] === t) || OBJETIVOS[5])[1];

/* ---------- autenticação ---------- */
function authHtml() {
  const m = S.authMode; const demo = Store.mode === 'local';
  const err = S.authErr ? `<div class="merr show" role="alert">${esc(S.authErr)}</div>` : '<div class="merr" role="alert"></div>';
  const note = demo ? '<div class="notice">Modo demonstração: os dados ficam apenas neste navegador. Para ativar login e nuvem, configure o Supabase (veja o README).</div>' : '';
  const back = '<button class="btn ghost back" data-act="goto-landing">Voltar</button>';
  let body = '';
  if (m === 'verify') {
    return `<div class="auth">${back}<div class="auth-card"><h2>Confirme seu e-mail</h2><p class="sub">Enviamos um link de confirmação para <b>${esc(S.authMsg)}</b>. Depois de confirmar, volte aqui e entre com seu e-mail e senha.</p><div class="btn-row"><button class="btn primary" data-act="auth-mode" data-mode="login">Já confirmei, quero entrar</button></div></div></div>`;
  }
  if (m === 'reset') {
    body = `<h2>Recuperar senha</h2><p class="sub">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>${S.authMsg ? `<div class="notice">${esc(S.authMsg)}</div>` : ''}
      <form id="f-auth" novalidate><label class="fld"><span>E-mail</span><input name="email" type="email" autocomplete="email"></label>${err}<button class="btn primary lg" type="submit">Enviar link</button></form>
      <p class="cap"><button class="lnk strong" data-act="auth-mode" data-mode="login">Voltar para o login</button></p>`;
  } else if (m === 'recovery') {
    body = `<h2>Nova senha</h2><p class="sub">Escolha uma nova senha para a sua conta.</p>
      <form id="f-auth" novalidate><label class="fld"><span>Nova senha <small>(mínimo de 8 caracteres)</small></span><input name="password" type="password" autocomplete="new-password"></label>${err}<button class="btn primary lg" type="submit">Salvar nova senha</button></form>`;
  } else if (m === 'signup') {
    const pl = S.authPlano === 'completo';
    body = `<h2>Criar sua conta</h2><p class="sub">Em seguida você faz o diagnóstico: patrimônio, perfil de investidor e objetivo.</p>${note}
      <form id="f-auth" novalidate>
        <label class="fld"><span>Nome completo</span><input name="nome" autocomplete="name" value="${esc(S.authDraft && S.authDraft.nome || '')}"></label>
        <label class="fld"><span>E-mail</span><input name="email" type="email" autocomplete="email" value="${esc(S.authDraft && S.authDraft.email || '')}"></label>
        <label class="fld"><span>WhatsApp <small>(opcional)</small></span><input name="whatsapp" inputmode="tel" autocomplete="tel" value="${esc(S.authDraft && S.authDraft.whatsapp || '')}"></label>
        ${demo ? '' : '<label class="fld"><span>Senha <small>(mínimo de 8 caracteres)</small></span><input name="password" type="password" autocomplete="new-password"></label>'}
        <fieldset class="plan-pick"><legend>Plano</legend>
          <label class="pick"><input type="radio" name="plano" value="gratis" ${pl ? '' : 'checked'}><span><b>Organização</b><small>Diagnóstico e planejamento financeiro</small></span><em>R$ 0</em></label>
          <label class="pick"><input type="radio" name="plano" value="completo" ${pl ? 'checked' : ''}><span><b>Assessoria</b><small>Com ${esc(CFG.consultor)}, via XP Inc., e carteira assessorada</small></span><em>${brl(CFG.precoPor)}</em></label></fieldset>
        <label class="chk"><input type="checkbox" name="termos"><span>Li e aceito os <button type="button" class="lnk strong" data-act="terms">termos e a política de privacidade</button>, inclusive o compartilhamento do resultado do diagnóstico com ${esc(CFG.consultor)}.</span></label>
        ${err}<button class="btn primary lg" type="submit">Criar conta e começar</button></form>
      <p class="cap">Já tem conta? <button class="lnk strong" data-act="auth-mode" data-mode="login">Entrar</button></p>`;
  } else {
    body = `<h2>Entrar</h2><p class="sub">Acesse o seu planejamento.</p>${note}
      <form id="f-auth" novalidate><label class="fld"><span>E-mail</span><input name="email" type="email" autocomplete="email" value="${esc(S.authDraft && S.authDraft.email || '')}"></label>
        ${demo ? '' : '<label class="fld"><span>Senha</span><input name="password" type="password" autocomplete="current-password"></label>'}
        ${err}<button class="btn primary lg" type="submit">Entrar</button></form>
      ${demo ? '' : '<p class="cap"><button class="lnk strong" data-act="auth-mode" data-mode="reset">Esqueci minha senha</button></p>'}
      <p class="cap">Ainda não tem conta? <button class="lnk strong" data-act="auth-mode" data-mode="signup">Criar conta</button></p>`;
  }
  return `<div class="auth">${back}<div class="auth-card">${body}</div></div>`;
}

async function submitAuth(f) {
  const d = Object.fromEntries(new FormData(f).entries()); const m = S.authMode; const demo = Store.mode === 'local';
  const fail = (msg) => { S.authErr = msg; S.authDraft = { nome: d.nome, email: d.email, whatsapp: d.whatsapp }; render(); };
  const email = String(d.email || '').trim(); const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  S.authErr = '';
  const btn = $('button[type=submit]', f); if (btn) btn.disabled = true;
  try {
    if (m === 'recovery') {
      if (String(d.password || '').length < 8) return fail('Use uma senha com pelo menos 8 caracteres.');
      await Store.updatePassword(d.password); S.authMode = 'login'; toast('Senha atualizada.');
      if (S.recoveryUser) { await entrar(S.recoveryUser); } render(); return;
    }
    if (m === 'signup' && String(d.nome || '').trim().length < 2) return fail('Informe seu nome completo.');
    if (!emailOk) return fail('Informe um e-mail válido.');
    if (m === 'reset') { await Store.resetPassword(email); S.authMsg = 'Se esse e-mail tiver conta, o link já está a caminho.'; render(); return; }
    if (m === 'login') {
      if (!demo && !d.password) return fail('Informe a sua senha.');
      const { user } = await Store.signIn({ email, password: d.password }); await entrar(user); render(); return;
    }
    // signup
    const nome = String(d.nome || '').trim();
    if (nome.length < 2) return fail('Informe seu nome completo.');
    if (!demo && String(d.password || '').length < 8) return fail('Use uma senha com pelo menos 8 caracteres.');
    if (!d.termos) return fail('Aceite os termos e a política de privacidade para continuar.');
    const plano = d.plano === 'completo' ? 'completo' : null;
    const r = await Store.signUp({ nome, email, whatsapp: String(d.whatsapp || '').trim(), password: d.password });
    if (r.needsVerify) { try { if (plano) localStorage.setItem('fp:plano', plano); } catch (e) { /* ignora */ } S.authMode = 'verify'; S.authMsg = email; render(); return; }
    await entrar(r.user);
    S.profile.nome = nome; S.profile.whatsapp = String(d.whatsapp || '').trim(); S.profile.consentimento = true; S.profile.planoSolicitado = plano; touch('profile');
    S.ob.nome = nome; render();
  } catch (e) { fail(e && e.amigavel ? e.message : 'Não foi possível concluir agora. Tente novamente.'); }
}

/* ---------- onboarding: diagnóstico ---------- */
const OB_STEPS = ['voce', 'partida', 'perfil', 'resultado', 'metas', 'diagnostico'];
function onboardingHtml() {
  const o = S.ob; const st = OB_STEPS[o.step];
  const dots = `<div class="ob-dots" aria-label="Etapa ${o.step + 1} de ${OB_STEPS.length}">${OB_STEPS.map((_, i) => `<i class="${i === o.step ? 'on' : i < o.step ? 'ok' : ''}"></i>`).join('')}</div>`;
  const err = '<div class="merr" id="oerr" role="alert"></div>';
  const nav = (next, label) => `<div class="btn-row center">${o.step > 0 ? '<button class="btn lg" type="button" data-act="ob-back">Voltar</button>' : ''}<button class="btn primary lg" type="submit">${label || 'Continuar'}</button></div>`;
  let body = '';
  if (st === 'voce') {
    body = `<h2>Vamos começar por você.</h2><p class="sub">Leva poucos minutos e deixa o painel com a sua cara.</p>
      <form id="f-ob" novalidate><label class="fld"><span>Como devemos chamar você?</span><input name="nome" autocomplete="name" value="${esc(o.nome)}"></label>
      <label class="fld"><span>Ano do planejamento <small>você pode trocar ou criar outros anos quando quiser</small></span><input name="anoRef" inputmode="numeric" maxlength="4" value="${esc(o.anoRef)}"></label>${err}${nav()}</form>`;
  } else if (st === 'partida') {
    body = `<h2>Seu ponto de partida.</h2><p class="sub">Quanto você já tem investido hoje? Somando renda fixa, ações, fundos e reserva. Uma estimativa serve.</p>
      <form id="f-ob" novalidate><label class="fld"><span>Patrimônio financeiro atual (R$)</span><input name="patrimonio" inputmode="decimal" placeholder="Ex.: 150.000,00" value="${o.patrimonio ? esc(nf.format(+o.patrimonio)) : ''}"></label>
      <label class="fld"><span>Renda mensal líquida (R$) <small>opcional, ajuda a sugerir suas metas</small></span><input name="renda" inputmode="decimal" placeholder="Ex.: 12.000,00" value="${o.renda ? esc(nf.format(+o.renda)) : ''}"></label>${err}${nav()}</form>`;
  } else if (st === 'perfil') {
    const q = E.QUIZ[o.q]; const cur = o.resp[o.q];
    body = `<p class="qn">Pergunta ${o.q + 1} de ${E.QUIZ.length}</p><h2 class="qh">${esc(q.q)}</h2>
      <div class="qopts">${q.o.map(([t], i) => `<button type="button" class="qopt${cur === i ? ' on' : ''}" data-act="quiz-pick" data-i="${i}">${esc(t)}</button>`).join('')}</div>
      <div class="btn-row center"><button class="btn" type="button" data-act="ob-back">Voltar</button></div>`;
  } else if (st === 'resultado') {
    const pf = E.PERFIS[o.perfil.resultado];
    body = `<p class="qn">Seu perfil de investidor</p><h2 class="big-h">${pf.nome}</h2><p class="sub">${pf.desc}</p>
      <div class="pbar big" role="img" aria-label="Alocação de referência: ${pf.alvo.rendaFixa}% renda fixa e ${pf.alvo.bolsa}% renda variável"><i style="width:${pf.alvo.rendaFixa}%"></i><b style="width:${pf.alvo.bolsa}%"></b></div>
      <div class="pleg"><span><i class="d1"></i>Renda fixa ${pf.alvo.rendaFixa}%</span><span><i class="d2"></i>Renda variável ${pf.alvo.bolsa}%</span></div>
      <p class="cap">Alocação de referência, apenas ilustrativa. O questionário é simplificado e não substitui a análise de adequação feita na assessoria. A aba Carteira usa esse ponto de partida e você ajusta como quiser.</p>
      <form id="f-ob" novalidate>${nav()}</form>`;
  } else if (st === 'metas') {
    const sugest = +o.renda > 0 ? Math.round(+o.renda * 0.2) : '';
    body = `<h2>Seu objetivo e suas metas.</h2><p class="sub">O painel usa esses números para mostrar se você está no caminho.</p>
      <form id="f-ob" novalidate><label class="fld"><span>Objetivo principal</span>${sel('objTipo', OBJETIVOS, o.objTipo)}</label>
      <div class="fld-2"><label class="fld"><span>Valor do objetivo (R$)</span><input name="objValor" inputmode="decimal" placeholder="Ex.: 1.000.000,00" value="${o.objValor ? esc(nf.format(+o.objValor)) : ''}"></label>
      <label class="fld"><span>Até que ano</span><input name="objAno" inputmode="numeric" maxlength="4" value="${esc(o.objAno)}"></label></div>
      <label class="fld"><span>Meta de aportes mensais (R$)</span><input name="metaAporte" inputmode="decimal" placeholder="${sugest ? 'Sugestão: ' + nf.format(sugest) : 'Ex.: 3.000,00'}" value="${o.metaAporte ? esc(nf.format(+o.metaAporte)) : ''}"></label>
      <label class="fld"><span>Meta de investimento do ano (R$) <small>opcional</small></span><input name="metaInvAno" inputmode="decimal" value="${o.metaInvAno ? esc(nf.format(+o.metaInvAno)) : ''}"></label>${err}${nav('', 'Ver meu diagnóstico')}</form>`;
  } else {
    const pf = E.PERFIS[o.perfil.resultado]; const ret = E.RETORNO_PADRAO[o.perfil.resultado]; const meses = E.mesesAteMeta(+o.patrimonio || 0, +o.metaAporte || 0, ret, +o.objValor || 0);
    const quando = meses === 0 ? 'Você já está acima do valor do objetivo.' : meses == null ? (+o.objValor > 0 ? 'Com esse aporte, o objetivo não é alcançado em até 100 anos. Vale revisar valor, prazo ou aporte.' : 'Defina o valor do objetivo para ver a projeção.') : `No ritmo atual, com retorno hipotético de ${ret}% ao ano, o objetivo seria alcançado em cerca de ${Math.floor(meses / 12)} anos${meses % 12 ? ' e ' + (meses % 12) + ' meses' : ''} (${NOW_Y + Math.floor((NOW_M + meses) / 12)}).`;
    const pend = S.profile.planoSolicitado === 'completo' && !hasFull();
    body = `<h2>Seu diagnóstico.</h2><div class="diag">
      <div class="dg"><small>Patrimônio hoje</small><b>${brl0(+o.patrimonio || 0)}</b></div><div class="dg"><small>Perfil</small><b>${pf.nome}</b></div>
      <div class="dg"><small>Objetivo</small><b>${esc(objNome(o.objTipo))}</b><span>${+o.objValor ? brl0(+o.objValor) : 'sem valor definido'} até ${esc(o.objAno)}</span></div><div class="dg"><small>Aporte mensal</small><b>${+o.metaAporte ? brl0(+o.metaAporte) : 'a definir'}</b></div></div>
      <p class="sub">${quando}</p><p class="cap">Projeção ilustrativa, baseada em uma hipótese de retorno, e não uma promessa de rentabilidade.</p>
      <div class="btn-row center"><button class="btn primary lg" data-act="ob-finish">${pend ? 'Abrir meu painel' : 'Abrir meu painel'}</button>${pend ? '<button class="btn lg" data-act="ob-finish-pay">Concluir assinatura da assessoria</button>' : `<button class="btn lg" data-act="ob-finish-talk">Revisar com o ${esc(primeiroNome())}</button>`}</div>`;
  }
  return `<div class="ob">${dots}<div class="ob-card">${body}</div></div>`;
}

function readOb(f) {
  const d = new FormData(f); const o = S.ob; const st = OB_STEPS[o.step];
  const err = (m) => { const e = $('#oerr'); if (e) { e.textContent = m; e.classList.add('show'); } return false; };
  const num = (k) => { const raw = String(d.get(k) || ''); return raw.trim() === '' ? 0 : E.parseValor(raw); };
  if (st === 'voce') {
    const nome = String(d.get('nome') || '').trim(); const ano = parseInt(d.get('anoRef'), 10);
    if (nome.length < 2) return err('Informe seu nome.'); if (!anoValido(ano)) return err('Informe um ano entre 1990 e 2100.');
    o.nome = nome; o.anoRef = ano;
  } else if (st === 'partida') {
    const p = num('patrimonio'); const r = num('renda');
    if (Number.isNaN(p) || Number.isNaN(r) || p < 0 || r < 0) return err('Confira os valores: use números como 1.234,56.');
    o.patrimonio = p; o.renda = r;
  } else if (st === 'metas') {
    const ov = num('objValor'); const ma = num('metaAporte'); const mi = num('metaInvAno'); const oa = parseInt(d.get('objAno'), 10);
    if ([ov, ma, mi].some((v) => Number.isNaN(v) || v < 0)) return err('Confira os valores: use números como 1.234,56.');
    if (!anoValido(oa)) return err('Informe o ano do objetivo.');
    Object.assign(o, { objTipo: String(d.get('objTipo')), objValor: ov, objAno: oa, metaAporte: ma, metaInvAno: mi });
  }
  return true;
}

function obNext() { S.ob.step = Math.min(OB_STEPS.length - 1, S.ob.step + 1); render(); }
function obBack() {
  const o = S.ob;
  if (OB_STEPS[o.step] === 'perfil' && o.q > 0) o.q -= 1;
  else if (OB_STEPS[o.step] === 'resultado') { o.step -= 1; o.q = E.QUIZ.length - 1; }
  else o.step = Math.max(0, o.step - 1);
  render();
}
function quizPick(i) {
  const o = S.ob; o.resp[o.q] = i;
  if (o.q < E.QUIZ.length - 1) o.q += 1; else { o.perfil = E.scorePerfil(o.resp); o.step += 1; }
  render();
}

/* ---------- checkout da assessoria ---------- */
function iniciarCompleto() {
  if (S.profile && S.profile.planoSolicitado !== 'completo') { S.profile.planoSolicitado = 'completo'; touch('profile'); }
  closeAdmin(); S.screen = 'checkout'; render();
}
function checkoutHtml() {
  const p = S.profile; const ativo = hasFull();
  const msgPago = baseMsg(`Escolhi a assessoria do Financial planning (${brl(CFG.precoPor)}) e estou enviando o comprovante. Meu e-mail: ${p.email || '(informar)'}.`);
  const pay = CFG.paymentUrl ? `<a class="btn primary lg" href="${esc(CFG.paymentUrl)}" ${ext}>Pagar ${brl(CFG.precoPor)}</a>` : `<p class="mmsg">O link de pagamento ainda não foi configurado. Combine o pagamento diretamente com o ${esc(primeiroNome())}.</p>`;
  const steps = ativo
    ? `<div class="step done"><h3>Assessoria ativa</h3><p class="mmsg">Tudo liberado: aba Carteira, importação de planilhas e a assessoria do ${esc(primeiroNome())}.</p><div class="btn-row"><button class="btn primary" data-act="checkout-back">Voltar ao painel</button></div></div>`
    : `<div class="step"><h3><span>1</span>Faça o pagamento</h3>${pay}</div>
       <div class="step"><h3><span>2</span>Envie o comprovante</h3><p class="mmsg">Pelo canal que preferir.</p>${contactButtons(msgPago, 'Comprovante: assessoria', { semXp: true })}</div>
       <div class="step"><h3><span>3</span>Aguarde a confirmação</h3><p class="mmsg">O ${esc(primeiroNome())} confirma o pagamento e libera o plano na sua conta. Você já pode usar o painel enquanto isso.</p><div class="btn-row"><button class="btn" data-act="checkout-back">Ir para o meu painel</button></div></div>`;
  return `<div class="auth wide"><button class="btn ghost back" data-act="checkout-back">${p.onboarded ? 'Voltar' : 'Pular por enquanto'}</button>
    <div class="co-grid"><div class="co-sum"><h2>Assessoria</h2><p class="sub">Planejamento completo com ${esc(CFG.consultor)}.</p>
      <div class="price2"><b>${brl(CFG.precoPor)}</b></div><p class="launch">Condição de lançamento. Valor regular ${brl(CFG.precoRegular)}.</p>
      <ul><li>Assessoria exclusiva com ${esc(CFG.consultor)}, via XP Inc.</li><li>Planejamento financeiro completo, com carteira assessorada</li><li>Aba Carteira: onde investir a cada aporte</li><li>Importação de planilhas .xlsx</li></ul></div>
      <div class="co-steps">${steps}</div></div></div>`;
}

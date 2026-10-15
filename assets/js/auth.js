/* Login, cadastro, onboarding (diagnóstico) e checkout. */
'use strict';
const OBJETIVOS = E.OBJ_TIPOS; // catálogo de tipos de objetivo (engine.js)
const objNome = (t) => (OBJETIVOS.find((o) => o[0] === t) || OBJETIVOS.find((o) => o[0] === 'outro'))[1];

/* ---------- autenticação ---------- */
function authHtml() {
  const m = S.authMode; const demo = Store.mode === 'local';
  // quando o e-mail de confirmação não sai, o cliente ainda pode falar com o assessor (o contato não se perde)
  const ajuda = S.authErrEmail ? `<div class="auth-ajuda">${contactButtons(`Olá, ${primeiroNome()}! Tentei criar minha conta no ${CFG.marca}, mas o e-mail de confirmação não chegou.${S.authDraft && S.authDraft.email ? ` Meu e-mail: ${S.authDraft.email}.` : ''}`, `Cadastro no ${CFG.marca}`, { semXp: true })}</div>` : '';
  const err = S.authErr ? `<div class="merr show" role="alert">${esc(S.authErr)}</div>${ajuda}` : '<div class="merr" role="alert"></div>';
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
    body = `<h2>Criar sua conta</h2><p class="sub">${S.authPagar ? 'Em seguida você vai direto para o pagamento. O diagnóstico fica para depois.' : 'Em seguida você faz o diagnóstico: patrimônio, perfil de investidor e objetivo.'}</p>${note}
      <form id="f-auth" novalidate>
        <label class="fld"><span>Nome completo</span><input name="nome" autocomplete="name" value="${esc(S.authDraft && S.authDraft.nome || '')}"></label>
        <label class="fld"><span>E-mail</span><input name="email" type="email" autocomplete="email" value="${esc(S.authDraft && S.authDraft.email || '')}"></label>
        <label class="fld"><span>WhatsApp <small>(opcional)</small></span><input name="whatsapp" inputmode="tel" autocomplete="tel" value="${esc(S.authDraft && S.authDraft.whatsapp || '')}"></label>
        ${demo ? '' : '<label class="fld"><span>Senha <small>(mínimo de 8 caracteres)</small></span><input name="password" type="password" autocomplete="new-password"></label>'}
        <fieldset class="plan-pick"><legend>Plano</legend>${['gratis', 'investidor', 'completo'].map((id) => `<label class="pick"><input type="radio" name="plano" value="${id}" ${S.authPlano === id || (!S.authPlano && id === 'gratis') ? 'checked' : ''}><span><b>${esc(nomePlano(id))}</b><small>${esc(infoPlano(id).resumo)}</small></span><em>${esc(precoTxt(id))}</em></label>`).join('')}</fieldset>
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
  const fail = (msg, ehEmail) => { S.authErr = msg; S.authErrEmail = !!ehEmail; S.authDraft = { nome: d.nome, email: d.email, whatsapp: d.whatsapp }; render(); };
  const email = String(d.email || '').trim(); const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  S.authErr = ''; S.authErrEmail = false;
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
      const { user } = await Store.signIn({ email, password: d.password }); await entrar(user);
      if (S.authPagar && S.authPlano && !S.isAdmin) { S.authPagar = false; iniciarCheckout(S.authPlano); return; } render(); return;
    }
    // signup
    const nome = String(d.nome || '').trim();
    if (nome.length < 2) return fail('Informe seu nome completo.');
    if (!demo && String(d.password || '').length < 8) return fail('Use uma senha com pelo menos 8 caracteres.');
    if (!d.termos) return fail('Aceite os termos e a política de privacidade para continuar.');
    const plano = d.plano === 'completo' || d.plano === 'investidor' ? d.plano : null;
    const r = await Store.signUp({ nome, email, whatsapp: String(d.whatsapp || '').trim(), password: d.password });
    const pagar = !!(S.authPagar && plano); S.authPagar = false;
    if (r.needsVerify) { try { if (plano) localStorage.setItem('fp:plano', plano); if (pagar) localStorage.setItem('fp:pagar', '1'); } catch (e) { /* ignora */ } S.authMode = 'verify'; S.authMsg = email; render(); return; }
    await entrar(r.user);
    S.profile.nome = nome; S.profile.whatsapp = String(d.whatsapp || '').trim(); S.profile.consentimento = true; S.profile.planoSolicitado = plano; touch('profile');
    S.ob.nome = nome; if (pagar) { iniciarCheckout(plano); return; } render();
  } catch (e) { fail(e && e.amigavel ? e.message : 'Não foi possível concluir agora. Tente novamente.', !!(e && e.email)); }
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
    const linha = (g, i) => `<div class="obr" data-i="${i}">${objIcone(g, i)}
      <label class="fld"><span>Objetivo</span>${sel('ot-' + i, OBJETIVOS, g.tipo).replace('<select', `<select data-obr="tipo"`)}</label>
      <label class="fld"><span>Valor alvo (R$)</span><input name="ov-${i}" data-obr="valor" inputmode="decimal" placeholder="Ex.: ${g.tipo === 'carro' ? '90.000,00' : g.tipo === 'viagem' ? '25.000,00' : g.tipo === 'imovel' ? '600.000,00' : '1.000.000,00'}" value="${g.valor ? esc(nf.format(+g.valor)) : ''}"></label>
      <label class="fld"><span>Até</span><input name="oa-${i}" data-obr="ano" inputmode="numeric" maxlength="4" value="${esc(g.ano || '')}" aria-label="Ano limite"></label>
      ${o.objs.length > 1 ? `<button type="button" class="icon-btn sm danger obr-x" data-act="ob-obj-del" data-i="${i}" aria-label="Remover objetivo">${I.x}</button>` : '<span class="obr-x"></span>'}</div>`;
    const usados = o.objs.map((g) => g.tipo); const atalhos = ['imovel', 'carro', 'viagem', 'filhos', 'reserva', 'aposentadoria'].filter((t) => !usados.includes(t)).slice(0, 4);
    body = `<h2>Seus objetivos e suas metas.</h2><p class="sub">Cadastre tudo o que você quer conquistar, com valor e prazo. O painel acompanha cada objetivo separadamente.</p>
      <form id="f-ob" novalidate><div class="obrs">${o.objs.map(linha).join('')}</div>
      ${o.objs.length < 8 ? `<div class="obr-add"><button type="button" class="btn sm" data-act="ob-obj-add">${I.plus}Adicionar objetivo</button>${atalhos.map((t) => `<button type="button" class="np-chip" data-act="ob-obj-add" data-tipo="${t}">+ ${esc(objNome(t))}</button>`).join('')}</div>` : ''}
      <label class="fld"><span>Meta de aportes mensais (R$)</span><input name="metaAporte" inputmode="decimal" placeholder="${sugest ? 'Sugestão: ' + nf.format(sugest) : 'Ex.: 3.000,00'}" value="${o.metaAporte ? esc(nf.format(+o.metaAporte)) : ''}"></label>
      <label class="fld"><span>Meta de investimento do ano (R$) <small>opcional</small></span><input name="metaInvAno" inputmode="decimal" value="${o.metaInvAno ? esc(nf.format(+o.metaInvAno)) : ''}"></label>${err}${nav('', 'Ver meu diagnóstico')}</form>`;
  } else {
    const pf = E.PERFIS[o.perfil.resultado]; const ret = E.RETORNO_PADRAO[o.perfil.resultado];
    const finais = obObjetivosFinais(o, ret); const A = E.analiseObjetivos({ objetivos: finais, patrimonio: +o.patrimonio || 0, aporte: +o.metaAporte || 0, retorno: ret, hoje: new Date() });
    const lista = A.itens.length ? `<ul class="ob-objs">${A.itens.map((g, i) => `<li>${objIcone(g, i)}<div><b>${esc(objNomeDe(g))}</b><small>${brl0(g.valor)} até ${g.ano || '–'}${A.itens.length > 1 ? ` · fatia de ${g.pct}%` : ''}</small><p>${esc(objFrase(g))}</p></div></li>`).join('')}</ul>` : '';
    const quando = !A.itens.length ? 'Defina o valor de pelo menos um objetivo para ver a projeção. Você pode cadastrar e editar objetivos a qualquer momento no painel.'
      : `Projeção com retorno hipotético de ${ret}% ao ano.${A.itens.length > 1 ? ' O patrimônio e o aporte foram divididos entre os objetivos pelo prazo de cada um; você ajusta as fatias no painel, em Meus objetivos.' : ''}`;
    const pend = pendente();
    body = `<h2>Seu diagnóstico.</h2><div class="diag">
      <div class="dg"><small>Patrimônio hoje</small><b>${brl0(+o.patrimonio || 0)}</b></div><div class="dg"><small>Perfil</small><b>${pf.nome}</b></div>
      <div class="dg"><small>Objetivos</small><b>${A.itens.length || 'a definir'}</b><span>${A.itens.length ? brl0(A.valorTotal) + ' no total' : 'cadastre no painel'}</span></div><div class="dg"><small>Aporte mensal</small><b>${+o.metaAporte ? brl0(+o.metaAporte) : 'a definir'}</b></div></div>
      ${lista}<p class="sub">${quando}</p><p class="cap">Projeção ilustrativa, baseada em uma hipótese de retorno, e não uma promessa de rentabilidade.</p>
      <div class="btn-row center"><button class="btn primary lg" data-act="ob-finish">Abrir meu painel</button>${pend ? `<button class="btn lg" data-act="ob-finish-pay">Concluir assinatura do plano ${esc(nomePlano(pend))}</button>` : `<button class="btn lg" data-act="ob-finish-talk">Revisar com o ${esc(primeiroNome())}</button>`}</div>`;
  }
  return `<div class="ob">${dots}<div class="ob-card">${body}</div></div>`;
}

/* Objetivos no diagnóstico: as linhas do formulário viram S.ob.objs (sem validar, para não perder o que foi digitado) */
function obCapturarObjs(f) {
  const o = S.ob; if (!f) return;
  o.objs = $$('.obr', f).map((row) => { const v = (k) => { const el = row.querySelector(`[data-obr="${k}"]`); return el ? el.value : ''; };
    const raw = String(v('valor')).trim(); return { tipo: v('tipo') || 'outro', nome: '', valor: raw === '' ? '' : parseReais(raw), ano: parseInt(v('ano'), 10) || '' }; });
}
function obObjAcao(act, ds) {
  const o = S.ob; const f = $('#f-ob'); obCapturarObjs(f);
  if (act === 'ob-obj-add') { const t = ds.tipo || 'outro'; o.objs.push({ tipo: t, nome: '', valor: '', ano: NOW_Y + (OBJ_PRAZO[t] || 5) }); }
  else if (act === 'ob-obj-del') { o.objs.splice(+ds.i, 1); if (!o.objs.length) o.objs.push({ tipo: 'independencia', nome: '', valor: '', ano: NOW_Y + 20 }); }
  render();
  if (act === 'ob-obj-add') { const n = o.objs.length - 1; const el = document.querySelector(`[name="ov-${n}"]`); if (el) el.focus(); }
}
// objetivos com valor viram a lista final, com fatias: 100% se for um só, ou divididas pelo prazo
function obObjetivosFinais(o, ret) {
  const L = (o.objs || []).filter((g) => +g.valor > 0).map((g) => ({ id: uid(), tipo: g.tipo, nome: g.nome || '', valor: +g.valor, ano: +g.ano || null, pct: 0 }));
  if (L.length === 1) L[0].pct = 100; else if (L.length > 1) { const sug = E.sugerirDivisao({ objetivos: L, retorno: ret, hoje: new Date() }); L.forEach((g) => { g.pct = sug[g.id]; }); }
  return E.normObjetivos({ objetivos: L }, uid);
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
    const ma = num('metaAporte'); const mi = num('metaInvAno'); obCapturarObjs(f);
    if ([ma, mi].some((v) => Number.isNaN(v) || v < 0) || o.objs.some((g) => Number.isNaN(+g.valor) || +g.valor < 0)) return err('Confira os valores: use números como 1.234,56.');
    const semAno = o.objs.find((g) => +g.valor > 0 && !anoValido(+g.ano)); if (semAno) return err(`Informe o ano de ${objNome(semAno.tipo).toLowerCase()}.`);
    if (o.objs.some((g) => +g.valor > 0 && +g.ano < NOW_Y)) return err(`O ano de cada objetivo precisa ser ${NOW_Y} ou depois.`);
    Object.assign(o, { metaAporte: ma, metaInvAno: mi });
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

/* ---------- checkout (Investidor ou Assessoria) ---------- */
function checkoutHtml() {
  const p = S.profile; const id = S.checkoutPlano === 'investidor' ? 'investidor' : 'completo'; const nome = nomePlano(id); const info = infoPlano(id); const ativo = PLANOS[planoAtual()].rank >= PLANOS[id].rank;
  const preco = precoPlano(id); const link = id === 'completo' ? CFG.paymentUrl : (CFG.paymentUrlInvestidor || '');
  const msgPago = baseMsg(`Escolhi o plano ${nome} do ${CFG.marca}${preco > 0 ? ` (${brl(preco)})` : ''} e estou enviando o comprovante. Meu e-mail: ${p.email || '(informar)'}.`);
  const pay = preco <= 0 ? `<p class="mmsg">O valor do plano ${esc(nome)} é combinado diretamente com o ${esc(primeiroNome())}.</p>${contactButtons(baseMsg(`Quero saber sobre o plano ${nome} do ${CFG.marca}.`), 'Plano ' + nome, { semXp: true })}`
    : link ? `<a class="btn primary lg" href="${esc(link)}" ${ext}>Pagar ${brl(preco)}</a>` : `<p class="mmsg">O link de pagamento ainda não foi configurado. Combine o pagamento diretamente com o ${esc(primeiroNome())}.</p>`;
  const steps = ativo
    ? `<div class="step done"><h3>Plano ${esc(nome)} ativo</h3><p class="mmsg">Tudo liberado. Obrigado pela confiança!</p><div class="btn-row"><button class="btn primary" data-act="checkout-back">Voltar ao painel</button></div></div>`
    : `<div class="step"><h3><span>1</span>Faça o pagamento</h3>${pay}</div>
       <div class="step"><h3><span>2</span>Envie o comprovante</h3><p class="mmsg">Pelo canal que preferir.</p>${contactButtons(msgPago, 'Comprovante: plano ' + nome, { semXp: true })}</div>
       <div class="step"><h3><span>3</span>Aguarde a confirmação</h3><p class="mmsg">O ${esc(primeiroNome())} confirma o pagamento e libera o plano na sua conta. Você já pode usar o painel enquanto isso.</p><div class="btn-row"><button class="btn" data-act="checkout-back">Ir para o meu painel</button></div></div>`;
  return `<div class="auth wide"><button class="btn ghost back" data-act="checkout-back">${p.onboarded ? 'Voltar' : 'Pular por enquanto'}</button>
    <div class="co-grid"><div class="co-sum"><h2>Plano ${esc(nome)}</h2><p class="sub">${esc(info.resumo)}</p>
      <div class="price2">${id === 'completo' && CFG.precoRegular > precoPlano(id) ? `<s class="hp-antes"><span class="hp-sr">De </span>${esc(brl(CFG.precoRegular))}</s>` : ''}<b>${esc(precoTxt(id))}</b></div>${id === 'completo' ? '<p class="launch">Condição de lançamento.</p>' : ''}
      <ul>${info.itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${id === 'completo' ? `<p class="cap">Na Assessoria, o ${esc(primeiroNome())} passa a ver o seu planejamento para acompanhar você. Os termos explicam isso.</p>` : ''}</div>
      <div class="co-steps">${steps}</div></div></div>`;
}

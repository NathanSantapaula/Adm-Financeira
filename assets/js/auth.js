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
  const note = demo ? '<p class="as-demo">Demonstração: os dados ficam só neste aparelho.</p>' : '';
  const back = `<button class="btn ghost back" data-act="goto-landing"><span class="back-seta" aria-hidden="true">${I.chev}</span>Voltar</button>`;
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
    // cadastro: à esquerda o assessor (foto, frase, três passos e o vídeo de boas-vindas, se houver); à direita o passo a passo
    // (1 Seus dados, 2 Acesso; o 3 é o diagnóstico, que vem depois de criar a conta)
    const v = (k) => esc(S.authDraft && S.authDraft[k] || ''); const passo = S.asPasso === 2 ? 2 : 1;
    const campo = (rot, inp, ico) => `<label class="fld"><span>${rot}</span><span class="as-in">${inp}${ico}</span></label>`;
    const trilha = [['Seus dados', 'Nome e contato'], ['Acesso', 'E-mail e senha'], ['Diagnóstico', 'Patrimônio, perfil e objetivos']].map(([t, d], k) => `<li class="${k + 1 === passo ? 'on' : k + 1 < passo ? 'ok' : ''}"><i>${k + 1 < passo ? I.check : k + 1}</i><span><b>${t}</b></span></li>`).join('');
    const corpo = passo === 1
      ? `<h2>Como podemos te chamar?</h2>
        <form id="f-auth" novalidate>${campo('Nome completo', `<input name="nome" autocomplete="name" placeholder="Seu nome" value="${v('nome')}">`, I.user)}
          ${campo('WhatsApp', `<input name="whatsapp" inputmode="tel" autocomplete="tel" placeholder="(11) 99999-9999" value="${v('whatsapp')}">`, I.tel)}
          ${err}<button class="btn primary lg as-cta" type="submit">Continuar ${I.chev}</button></form>${note}`
      : `<h2>Agora, o seu acesso</h2><p class="sub">${S.authPagar ? 'Em seguida você vai direto para o pagamento. O diagnóstico fica para depois.' : ''}</p>${note}
        <form id="f-auth" novalidate><input type="hidden" name="nome" value="${v('nome')}"><input type="hidden" name="whatsapp" value="${v('whatsapp')}">
          ${campo('E-mail', `<input name="email" type="email" autocomplete="email" placeholder="voce@email.com" value="${v('email')}">`, I.mail)}
          ${demo ? '' : campo('Senha <small>(mínimo de 8 caracteres)</small>', '<input name="password" type="password" autocomplete="new-password" placeholder="Crie uma senha">', I.lock)}
          ${S.authPagar && S.authPlano ? `<input type="hidden" name="plano" value="${esc(S.authPlano)}">` : ''}
          <label class="chk"><input type="checkbox" name="termos"><span>Li e aceito os <button type="button" class="lnk strong" data-act="terms">termos e a política de privacidade</button>.</span></label>
          ${err}<div class="cad-bts"><button class="btn lg" type="button" data-act="as-passo" data-p="1">Voltar</button><button class="btn primary lg as-cta" type="submit">Criar conta ${I.chev}</button></div></form>`;
    return `<div class="auth cad"><aside class="cad-ass">${cadAssessorHtml()}</aside>
      <section class="cad-form"><header class="cad-top">${back}</header>${cadFaixaHtml()}
        <div class="cad-meio"><ol class="cad-trilha">${trilha}</ol><div class="cad-prog"><span>Passo ${passo} de 3</span><i><b style="width:${passo * 33.4}%"></b></i></div>${corpo}
          <p class="cap cad-entrar">Já tem conta? <button class="lnk strong" data-act="auth-mode" data-mode="login">Entrar</button></p></div></section></div>`;
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

/* computador: à esquerda o título, o vídeo do app numa janela (CFG.cadastroVideo, um .mp4 do próprio site; sem vídeo, a capa
   assets/img/tour-capa.jpg ou CFG.cadastroVideoCapa) e o assessor num bloquinho */
function cadAssessorHtml() {
  const capa = CFG.cadastroVideoCapa || 'assets/img/tour-capa.jpg';
  const tela = CFG.cadastroVideo ? `<video src="${esc(CFG.cadastroVideo)}" poster="${esc(capa)}" controls preload="metadata" playsinline></video>` : `<img src="${esc(capa)}" alt="O painel do ${esc(CFG.marca || 'AVEN')}">`;
  return `${logoMarca()}<div class="cad-ass-c"><h1>Seu dinheiro inteiro,<br><em>numa tela só.</em></h1><p class="cad-lead">Gastos, investimentos e objetivos se conectando sozinhos.${CFG.cadastroVideo ? ' Dê o play e veja.' : ''}</p>
    <figure class="cad-jan"><header aria-hidden="true"><i></i><i></i><i></i><span>${esc((CFG.marca || 'aven').toLowerCase())}.app</span></header>${tela}</figure>
    ${cadBlocoHtml('“Eu acompanho o seu plano com você, mês a mês.”')}</div>`;
}
const cadFoto = () => (CFG.foto ? `<img src="${esc(CFG.foto)}" alt="">` : `<span>${esc(lpIniciais(CFG.consultor))}</span>`);
const cadBlocoHtml = (frase) => `<div class="cad-bloco"><span class="cad-foto">${cadFoto()}</span><div><b>${esc(CFG.consultor)}</b><small>${esc(CFG.consultorCargo || 'Assessor de investimentos · XP')}</small>${frase ? `<p>${frase}</p>` : ''}</div></div>`;
// celular: faixa escura curta com o logo, o assessor e a chamada; o formulário sobe num cartão por cima (sem vídeo)
const cadFaixaHtml = () => `<div class="cad-faixa">${logoMarca()}<div class="cad-faixa-q"><span class="cad-foto">${cadFoto()}</span><span><b>${esc(CFG.consultor)}</b><small>Seu assessor · XP</small></span></div><h2>Seu planejamento financeiro começa aqui.</h2></div>`;

async function submitAuth(f) {
  const d = Object.fromEntries(new FormData(f).entries()); const m = S.authMode; const demo = Store.mode === 'local';
  const fail = (msg, ehEmail) => { S.authErr = msg; S.authErrEmail = !!ehEmail; S.authDraft = Object.assign({}, S.authDraft); ['nome', 'email', 'whatsapp'].forEach((k) => { if (d[k] != null) S.authDraft[k] = d[k]; }); render(); };
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
    // cadastro, passo 1: só nome e WhatsApp; guarda e segue para o acesso
    if (m === 'signup' && S.asPasso !== 2) {
      if (!/^\d{10,13}$/.test(String(d.whatsapp || '').replace(/\D/g, ''))) return fail('Informe seu WhatsApp com DDD.');
      S.authDraft = Object.assign({}, S.authDraft, { nome: String(d.nome).trim(), whatsapp: String(d.whatsapp).trim() }); S.asPasso = 2; render();
      const e = document.querySelector('#f-auth input[name="email"]'); if (e) e.focus(); return;
    }
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
    if (!/^\d{10,13}$/.test(String(d.whatsapp || '').replace(/\D/g, ''))) return fail('Informe seu WhatsApp com DDD.');
    if (!demo && String(d.password || '').length < 8) return fail('Use uma senha com pelo menos 8 caracteres.');
    if (!d.termos) return fail('Aceite os termos e a política de privacidade para continuar.');
    const plano = d.plano === 'completo' || d.plano === 'investidor' ? d.plano : null;
    const r = await Store.signUp({ nome, email, whatsapp: String(d.whatsapp || '').trim(), password: d.password });
    const pagar = !!(S.authPagar && plano); S.authPagar = false;
    if (r.needsVerify) { try { if (plano) localStorage.setItem('fp:plano', plano); if (pagar) localStorage.setItem('fp:pagar', '1'); } catch (e) { /* ignora */ } S.authMode = 'verify'; S.authMsg = email; render(); return; }
    await entrar(r.user);
    S.profile.nome = nome; S.profile.whatsapp = String(d.whatsapp || '').trim(); S.profile.consentimento = { versao: POLITICA_VERSAO, em: new Date().toISOString() }; S.profile.politicaVista = POLITICA_VERSAO; S.profile.planoSolicitado = plano; touch('profile');
    S.ob.nome = nome; if (pagar) { iniciarCheckout(plano); return; } render();
  } catch (e) { fail(e && e.amigavel ? e.message : 'Não foi possível concluir agora. Tente novamente.', !!(e && e.email)); }
}

/* ---------- onboarding: diagnóstico em conversa ----------
   O assistente faz uma pergunta por vez (OB_CONV); cada resposta desbloqueia um pedaço do painel já com os números da pessoa
   (cartões de obPremio e as conquistas no topo). Grava nos mesmos campos de S.ob que finishOb (core.js) já usava. */
const OB_STEPS = ['conversa']; // compatibilidade: o diagnóstico virou um passo só, a conversa
const obPn = (o) => String(o.nome || '').trim().split(/\s+/)[0] || '';
const obObj = (o) => (o.objs[0] = o.objs[0] || { tipo: 'independencia', nome: '', valor: '', ano: NOW_Y + 20 });
// "150.000", "150 mil" e "10k" valem
const obNum = (v) => { const raw = String(v == null ? '' : v).trim(); if (raw === '') return 0; if (/mil|k\b/i.test(raw)) { const n = E.iaValor(raw); return n == null ? NaN : n; } return parseReais(raw); };
const OB_VALOR_SUG = { independencia: [1000000, 2000000, 5000000], aposentadoria: [1000000, 2000000, 3000000], imovel: [300000, 600000, 1000000], carro: [60000, 100000, 180000], viagem: [10000, 25000, 50000],
  filhos: [100000, 300000, 500000], educacao: [50000, 120000, 250000], reserva: [20000, 50000, 100000], casamento: [40000, 80000, 150000], negocio: [50000, 150000, 400000], outro: [10000, 50000, 100000] };
const brlCurto = (v) => (S.privado ? brl0(v) : v >= 1e6 ? 'R$ ' + String(+(v / 1e6).toFixed(1)).replace('.', ',') + ' mi' : v >= 1000 ? 'R$ ' + Math.round(v / 1000) + ' mil' : brl0(v));
const OB_CONV = [
  { id: 'nome', tipo: 'texto', ph: 'Seu nome ou apelido', p: () => `Oi! Em poucas perguntas, seu painel fica pronto. Como posso te chamar?`,
    ok: (o, v) => { v = String(v || '').trim(); if (v.length < 2) return 'Me diga pelo menos duas letras.'; o.nome = v; return ''; }, r: (o) => o.nome },
  { id: 'patrimonio', tipo: 'valor', ph: 'Ex.: 150.000', chips: () => [['Ainda não invisto', '0'], ['Uns R$ 10 mil', '10000'], ['Uns R$ 100 mil', '100000']],
    p: (o) => `Prazer, ${obPn(o)}! Quanto você já tem guardado ou investido hoje? Somando reserva, renda fixa, ações e fundos. Uma estimativa serve.`,
    ok: (o, v) => { const n = obNum(v); if (Number.isNaN(n) || n < 0) return 'Use um número, como 150.000 ou 150 mil.'; o.patrimonio = n; return ''; }, r: (o) => (+o.patrimonio ? brl0(+o.patrimonio) : 'Ainda não invisto') },
  { id: 'renda', tipo: 'valor', ph: 'Ex.: 8.000', chips: () => [['Prefiro não dizer', '-']],
    p: () => 'E quanto entra por mês, já líquido? É opcional, mas me ajuda a sugerir quanto guardar.',
    ok: (o, v) => { if (v === '-') { o.renda = 0; return ''; } const n = obNum(v); if (Number.isNaN(n) || n < 0) return 'Use um número, como 8.000.'; o.renda = n; return ''; }, r: (o) => (+o.renda ? brl0(+o.renda) + ' por mês' : 'Prefiro não dizer') },
  { id: 'objetivo', tipo: 'chips', grade: true, chips: () => E.OBJ_TIPOS.filter(([k]) => k !== 'outro').map(([k, n]) => [n, k, k]),
    p: () => 'Agora a parte boa. Qual é o seu maior objetivo com o dinheiro?',
    ok: (o, v) => { const g = obObj(o); if (g.tipo !== v) { g.tipo = v; g.valor = ''; g.ano = NOW_Y + (OBJ_PRAZO[v] || 5); } return ''; }, r: (o) => objNome(obObj(o).tipo) },
  { id: 'valor', tipo: 'valor', ph: 'Ex.: 500.000', chips: (o) => (OB_VALOR_SUG[obObj(o).tipo] || OB_VALOR_SUG.outro).map((v) => [brlCurto(v), String(v)]),
    p: (o) => `Ótima escolha. Quanto você imagina para ${objNome(obObj(o).tipo).toLowerCase()}?`,
    ok: (o, v) => { const n = obNum(v); if (!(n > 0)) return 'Me diga um valor, como 500.000 ou 500 mil.'; obObj(o).valor = n; return ''; }, r: (o) => brl0(+obObj(o).valor) },
  { id: 'ano', tipo: 'ano', ph: 'Ano, ex.: ' + (NOW_Y + 10), chips: () => [2, 5, 10, 20].map((n) => [`${NOW_Y + n} · ${n} anos`, String(NOW_Y + n)]),
    p: () => 'Para quando?',
    ok: (o, v) => { const n = parseInt(v, 10); if (!anoValido(n) || n < NOW_Y) return `Escolha um ano a partir de ${NOW_Y}.`; obObj(o).ano = n; return ''; }, r: (o) => String(obObj(o).ano) },
  { id: 'aporte', tipo: 'valor', ph: 'Ex.: 2.000',
    chips: (o) => (+o.renda ? [10, 20, 30].map((p) => [`${brl0(Math.round((+o.renda * p) / 100))} · ${p}%`, String(Math.round((+o.renda * p) / 100))]) : [500, 1000, 3000].map((v) => [brl0(v), String(v)])),
    p: (o) => `E quanto você consegue investir por mês para chegar lá?${+o.renda ? ` Quem guarda uns 20% da renda costuma andar bem: seriam ${brl0(Math.round(+o.renda * 0.2))}.` : ''}`,
    ok: (o, v) => { const n = obNum(v); if (Number.isNaN(n) || n < 0) return 'Use um número, como 2.000.'; o.metaAporte = n; return ''; }, r: (o) => (+o.metaAporte ? brl0(+o.metaAporte) + ' por mês' : 'Por enquanto, nada') },
].concat(E.QUIZ.map((q, k) => ({ id: 'q' + k, tipo: 'chips', lista: true, chips: () => q.o.map(([t], i) => [t, String(i)]),
  p: (o) => (k === 0 ? `Falta pouco, ${obPn(o)}. São ${E.QUIZ.length} perguntas rápidas para eu entender o seu perfil de investidor. ` : '') + q.q,
  ok: (o, v) => { o.resp[k] = +v; if (k === E.QUIZ.length - 1) o.perfil = E.scorePerfil(o.resp); return ''; }, r: (o) => (q.o[o.resp[k]] || [''])[0] })));
const OB_PREMIO_DE = { nome: 'painel', patrimonio: 'partida', renda: 'guardar', ano: 'objetivo', aporte: 'chegada', ['q' + (E.QUIZ.length - 1)]: 'perfil' };
const OB_PREMIOS = [['painel', 'Seu painel'], ['partida', 'Ponto de partida'], ['guardar', 'Quanto guardar'], ['objetivo', 'Seu objetivo'], ['chegada', 'Quando chega'], ['perfil', 'Seu perfil']];
function obAnalise(o) {
  const pf = (o.perfil && o.perfil.resultado) || 'moderado'; const ret = E.RETORNO_PADRAO[pf];
  return { ret, A: E.analiseObjetivos({ objetivos: obObjetivosFinais(o, ret), patrimonio: +o.patrimonio || 0, aporte: +o.metaAporte || 0, retorno: ret, hoje: new Date() }) };
}
// cartão que aparece na conversa logo depois da resposta que o desbloqueia
function obPremio(o, k) {
  const cab = (t) => `<span class="obc-pr-k"><i aria-hidden="true">✦</i>Desbloqueado · ${t}</span>`;
  if (k === 'painel') return `<div class="obc-pr">${cab('Seu painel')}<div class="obc-pr-row"><span class="obc-av">${esc(lpIniciais(o.nome))}</span><span><b>Painel de ${esc(obPn(o))}</b><small>${esc(CFG.marca)} ${esc(CFG.submarca || '')} · ${NOW_Y}</small></span></div></div>`;
  if (k === 'partida') return `<div class="obc-pr">${cab('Ponto de partida')}<b class="obc-big">${brl0(+o.patrimonio || 0)}</b><small>${+o.patrimonio ? 'É daqui que o gráfico do seu patrimônio começa.' : 'Todo patrimônio começa no zero. O primeiro aporte já conta.'}</small></div>`;
  if (k === 'guardar') { if (!(+o.renda > 0)) return ''; const g = Math.round(+o.renda * 0.2);
    return `<div class="obc-pr">${cab('Quanto guardar')}<b class="obc-big">${brl0(g)}<em>/mês</em></b><small>20% da sua renda. Em um ano, ${brl0(g * 12)} só de aportes.</small><span class="obc-barra"><i style="width:20%"></i></span></div>`; }
  if (k === 'objetivo') { const g = obObj(o); const n = Math.max(0, g.ano - NOW_Y);
    return `<div class="obc-pr">${cab('Seu objetivo')}<div class="obc-pr-row">${objIcone(g, 0)}<span><b>${esc(objNome(g.tipo))}</b><small>${brl0(+g.valor)} até ${g.ano}${n ? ` · daqui a ${n} ${n === 1 ? 'ano' : 'anos'}` : ''}</small></span></div></div>`; }
  if (k === 'chegada') { const { ret, A } = obAnalise(o); const g = A.itens[0]; if (!g) return '';
    const pct = Math.round((g.progresso || 0) * 100); const prev = g.previsto ? `${MES_LONGO[g.previsto.mes].toLowerCase()} de ${g.previsto.ano}` : '';
    const frase = g.status === 'concluido' ? 'Você já tem o suficiente. Agora é proteger e fazer render.' : g.status === 'no-prazo' ? `No prazo, com ${g.folga} ${g.folga === 1 ? 'mês' : 'meses'} de folga.`
      : g.status === 'atrasado' ? `Passa ${g.atraso} ${g.atraso === 1 ? 'mês' : 'meses'} do prazo. Com ${brl0(g.necessario)} por mês, chega em ${g.ano}.` : 'Com algum aporte por mês, eu calculo quando você chega lá.';
    return `<div class="obc-pr obc-hero">${cab('Quando chega')}<div class="obc-pr-row"><span class="obc-ring" style="--p:${pct}"><b>${pct}%</b></span><span><small>No seu ritmo, você chega em</small><b class="obc-big">${prev ? esc(prev) : 'defina um aporte'}</b></span></div><small>${esc(frase)}</small><small class="obc-leg">Simulação com retorno hipotético de ${ret}% ao ano, não é promessa de rentabilidade.</small></div>`; }
  if (k === 'perfil') { const pf = E.PERFIS[o.perfil.resultado];
    return `<div class="obc-pr">${cab('Seu perfil')}<b class="obc-big">${esc(pf.nome)}</b><small>${esc(pf.desc)}</small>
      <div class="pbar big" role="img" aria-label="Referência: ${pf.alvo.rendaFixa}% renda fixa e ${pf.alvo.bolsa}% renda variável"><i style="width:${pf.alvo.rendaFixa}%"></i><b style="width:${pf.alvo.bolsa}%"></b></div>
      <div class="pleg"><span><i class="d1"></i>Renda fixa ${pf.alvo.rendaFixa}%</span><span><i class="d2"></i>Renda variável ${pf.alvo.bolsa}%</span></div><small class="obc-leg">Questionário simplificado; não substitui a análise de adequação da assessoria.</small></div>`; }
  return '';
}
function onboardingHtml() {
  const o = S.ob; const N = OB_CONV.length; o.i = Math.max(0, Math.min(N, o.i || 0)); const fim = o.i >= N;
  const orb = typeof iaOrb === 'function' ? iaOrb('obc-orb') : '<span class="obc-orb" aria-hidden="true"></span>';
  const fala = (t, novo) => `<div class="obc-a${novo ? ' novo' : ''}">${orb}<p><span class="obc-dig" aria-hidden="true"><i></i><i></i><i></i></span><span class="obc-t">${esc(t)}</span></p></div>`;
  let hist = '';
  OB_CONV.slice(0, o.i).forEach((p) => { hist += fala(p.p(o)) + `<div class="obc-u"><p>${esc(p.r(o))}</p></div>`; const pr = OB_PREMIO_DE[p.id]; if (pr) hist += obPremio(o, pr); });
  let atual;
  if (!fim) {
    const p = OB_CONV[o.i]; const chips = p.chips ? p.chips(o) : [];
    const ch = chips.length ? `<div class="obc-chips${p.grade ? ' grade' : ''}${p.lista ? ' lista' : ''}">${chips.map(([t, v, ic]) => `<button type="button" class="obc-chip" data-act="ob-cv" data-v="${esc(v)}">${ic && OBJ_ICONES[ic] ? `<span class="obc-chip-ic" aria-hidden="true">${OBJ_ICONES[ic]}</span>` : ''}${esc(t)}</button>`).join('')}</div>` : '';
    const campo = p.tipo === 'chips' ? '' : `<form id="f-ob" class="obc-in" novalidate autocomplete="off"><label class="hp-sr" for="obc-v">Sua resposta</label>
      <input id="obc-v" name="v" ${p.tipo === 'texto' ? 'autocomplete="given-name"' : 'inputmode="decimal"'} placeholder="${esc(p.ph || '')}" value="${p.id === 'nome' ? esc(o.nome || '') : ''}">
      <button type="submit" aria-label="Enviar">${I.chev}</button></form>`;
    atual = fala(p.p(o), true) + `<div class="obc-resp">${ch}${campo}<div class="merr" id="oerr" role="alert"></div></div>`;
  } else {
    const { ret, A } = obAnalise(o); const pf = E.PERFIS[o.perfil.resultado];
    atual = fala(`Pronto, ${obPn(o)}. Seu diagnóstico está completo e o seu painel já nasce com tudo isso.`, true) + `<div class="obc-fim">
      <div class="diag"><div class="dg"><small>Patrimônio hoje</small><b>${brl0(+o.patrimonio || 0)}</b></div><div class="dg"><small>Perfil</small><b>${pf.nome}</b></div>
      <div class="dg"><small>Objetivo</small><b>${A.itens.length ? brlCurto(A.valorTotal) : 'a definir'}</b></div><div class="dg"><small>Aporte mensal</small><b>${+o.metaAporte ? brl0(+o.metaAporte) : 'a definir'}</b></div></div>
      <p class="cap">Projeção com retorno hipotético de ${ret}% ao ano, não é promessa de rentabilidade. Você ajusta objetivos e metas no painel quando quiser.</p>
      ${typeof basObHtml === 'function' ? basObHtml() : ''}${obPlanosHtml(o, A)}</div>`;
  }
  const pct = Math.round((o.i / N) * 100);
  return `<div class="obc"><header class="obc-top"><div class="obc-top-in">
      <button type="button" class="obc-volta" data-act="ob-back"${o.i ? '' : ' disabled'} aria-label="Voltar uma pergunta">${I.chev}</button>
      <div class="obc-prog"><div class="obc-prog-t"><b>Seu diagnóstico</b><span>${fim ? 'Completo' : `${o.i} de ${N} · cada resposta desbloqueia algo`}</span></div>
        <span class="obc-barra" role="progressbar" aria-label="Progresso do diagnóstico" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></span></div></div></header>
    <div class="obc-chat" aria-live="polite">${hist}${atual}</div></div>`;
}
// leva a conversa até a pergunta nova e põe o cursor no campo (só com mouse: no celular o teclado cobriria a conversa)
function obFoco() {
  requestAnimationFrame(() => { const n = document.querySelector('.obc-a.novo'); if (n) n.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const i = $('#obc-v'); if (i && matchMedia('(pointer: fine)').matches) i.focus({ preventScroll: true }); });
}
function obResponder(v) {
  const o = S.ob; const p = OB_CONV[o.i]; if (!p) return;
  const e = p.ok(o, v); if (e) { const el = $('#oerr'); if (el) { el.textContent = e; el.classList.add('show'); } return; }
  o.i += 1; render(); obFoco();
}
function obBack() { const o = S.ob; o.i = Math.max(0, (o.i || 0) - 1); render(); obFoco(); }

// objetivos com valor viram a lista final, com fatias: 100% se for um só, ou divididas pelo prazo
function obObjetivosFinais(o, ret) {
  const L = (o.objs || []).filter((g) => +g.valor > 0).map((g) => ({ id: uid(), tipo: g.tipo, nome: g.nome || '', valor: +g.valor, ano: +g.ano || null, pct: 0 }));
  if (L.length === 1) L[0].pct = 100; else if (L.length > 1) { const sug = E.sugerirDivisao({ objetivos: L, retorno: ret, hoje: new Date() }); L.forEach((g) => { g.pct = sug[g.id]; }); }
  return E.normObjetivos({ objetivos: L }, uid);
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

// escolha do plano no fim do diagnóstico (saiu do cadastro): logo depois do resultado, com o plano que combina com ele em destaque
function obPlanoRec(o, A) { const pat = +o.patrimonio || 0; return pat >= 300000 ? 'completo' : (A.itens.length || +o.metaAporte || pat > 0) ? 'investidor' : 'gratis'; }
function obPlanosHtml(o, A) {
  const rec = obPlanoRec(o, A); const sel = o.plano || rec;
  const motivo = { completo: 'Seu patrimônio pede acompanhamento de perto, com carteira recomendada e revisão com o assessor.', investidor: 'Você já investe ou quer investir: acompanhe aportes, proventos e a carteira no mesmo lugar.', gratis: 'Comece organizando rendas e gastos. Dá para mudar de plano quando quiser.' }[rec];
  const card = (id) => `<button type="button" class="ob-pl-c${id === sel ? ' on' : ''}" data-act="ob-plano" data-plano="${id}" aria-pressed="${id === sel}">${id === rec ? '<em class="ob-rec">Recomendado para você</em>' : ''}<b>${esc(nomePlano(id))}</b><small>${esc(infoPlano(id).resumo)}</small><span>${esc(precoTxt(id))}</span></button>`;
  return `<section class="ob-planos"><h3>Escolha como continuar</h3><p class="sub">${esc(motivo)}</p><div class="ob-pl">${['gratis', 'investidor', 'completo'].map(card).join('')}</div></section>
    <div class="btn-row center">${sel === 'gratis' ? '<button class="btn primary lg" data-act="ob-finish">Abrir meu painel</button>' : `<button class="btn primary lg" data-act="ob-finish-pay" data-plano="${sel}">Assinar o ${esc(nomePlano(sel))}</button><button class="btn lg" data-act="ob-finish">Começar no gratuito por enquanto</button>`}<button class="btn ghost lg" data-act="ob-finish-talk">Revisar com o ${esc(primeiroNome())}</button></div>`;
}

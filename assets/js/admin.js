/* Painel administrativo lateral, backup completo, importação .xlsx, anos e área do consultor. */
'use strict';
function openAdmin(pagina) { if (S.screen !== 'app' || !S.profile) return; S.adminOpen = true; S.adminPage = pagina === 'perfil' || pagina === 'objetivos' || pagina === 'painel' || /^grupo:/.test(pagina || '') ? pagina : 'inicio'; renderAdmin(true); const d = $('#admin'); if (!d.open) d.showModal(); }
/* painel em duas camadas: a página inicial lista os grupos (Planejamento, Personalizar o painel, Backup e planilhas) e cada um
   abre uma página própria, como "Meu perfil". Lá, cada título vira um bloco que abre e fecha pela setinha (todos começam fechados);
   o estado fica em S.admSec durante a sessão e sobrevive aos redesenhos do painel */
const ADM_GRUPOS = [
  { id: 'planejamento', nome: 'Planejamento', desc: 'Metas, ponto de partida, objetivos e anos.', ic: 'M4 19V9M10 19V5M16 19v-7M22 19H2' },
  { id: 'personalizar', nome: 'Personalizar o painel', desc: 'Telas, abas do menu, aparência e voz.', ic: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4' },
  { id: 'dados', nome: 'Backup e planilhas', desc: 'Salve, restaure ou importe seus dados.', ic: 'M12 3v12M7 10l5 5 5-5M4 19h16' },
];
const admGrupo = () => (/^grupo:/.test(S.adminPage || '') ? ADM_GRUPOS.find((g) => 'grupo:' + g.id === S.adminPage) : null);
// descrição curta de cada título, visível mesmo fechado
const ADM_DESC = {
  'metas-e-ponto-de-partida': 'Meta de aportes, patrimônio inicial e seus objetivos.',
  'anos-de-planejamento': 'Abra, crie ou exclua anos.',
  telas: 'Escolha e organize os widgets de cada tela.',
  'abas-do-menu': 'Quais abas aparecem no menu.',
  aparencia: 'Tema e cor do painel.',
  'voz-do-painel': 'O tom dos destaques e avisos.',
  'backup-completo': 'Baixe ou restaure todos os seus dados.',
  'importar-planilha-xlsx-': 'Traga dados de uma planilha, inclusive a carteira do assessor.',
};
const ADM_FIXAS = new Set(['plano', 'sessao']); // sempre abertas
function admAcordeao(d) {
  d.querySelectorAll('.dr-body > section.dr-sec').forEach((sec) => {
    const h = sec.querySelector(':scope > h3'); if (!h) return;
    const id = E.norm(h.textContent).replace(/[^a-z0-9]+/g, '-'); if (ADM_FIXAS.has(id)) return;
    const aberto = !!(S.admSec && S.admSec[id]);
    const p0 = h.nextElementSibling && h.nextElementSibling.matches('p.mmsg') ? h.nextElementSibling : null;
    const desc = p0 ? p0.innerHTML : ADM_DESC[id] ? esc(ADM_DESC[id]) : ''; if (p0) p0.remove();
    const corpo = document.createElement('div'); corpo.className = 'dr-acc-b'; corpo.id = 'adm-' + id;
    [...sec.childNodes].filter((n) => n !== h).forEach((n) => corpo.appendChild(n));
    const t = document.createElement('h3'); t.className = 'dr-acc-t';
    t.innerHTML = `<button class="dr-acc-h" data-act="adm-sec" data-id="${id}" aria-expanded="${aberto}" aria-controls="adm-${id}"><span class="dr-acc-n"><span>${h.innerHTML}</span>${desc ? `<small class="dr-acc-d keep">${desc}</small>` : ''}</span><span class="macc-ch">${I.chev}</span></button>`;
    sec.replaceChildren(t, corpo); sec.classList.add('dr-acc'); sec.dataset.open = aberto;
  });
}
function closeAdmin() { S.adminOpen = false; const d = $('#admin'); if (d && d.open) d.close(); }

function abrirAno(y) {
  if (!anoValido(y)) { toast('Informe um ano entre 1990 e 2100.'); return; }
  if (S.plans[y]) { switchYear(y); return; }
  closeAdmin();
  openModal({ title: `Criar o planejamento de ${y}?`, ok: 'Criar',
    body: `<label class="chk"><input type="checkbox" name="copiar" checked><span><b>Copiar a estrutura de ${S.year}</b><small>Categorias, rendas, gastos e ativos entram com valores zerados. Parcelas em andamento aparecem automaticamente.</small></span></label>`,
    onOk: (d) => { createPlan(y, d.copiar ? S.plan : null); } });
}

/* ---------- painel ---------- */
/* objetivos: a lista completa fica na tela "Meus objetivos" (objetivos.js); aqui só o atalho */

function adminHtml() {
  const p = S.profile; const pl = S.plan; const years = Object.keys(S.plans).map(Number).sort(); const cloud = Store.mode === 'cloud';
  const ob = p.perfilInvestidor && p.perfilInvestidor.resultado ? E.PERFIS[p.perfilInvestidor.resultado].nome : 'não definido';
  const abas = ABAS.concat(S.isAdmin && cloud ? [['clientes', 'Clientes', 'Painel do consultor: cadastros e planos.']] : []).filter((a) => a[0] !== 'clientes');
  let plano; const pend = pendente(); const nPl = nomePlano(planoAtual());
  if (Store.mode === 'local') plano = '<div class="plan-badge on">Modo demonstração</div><p class="mmsg">Todos os recursos estão liberados. Os dados ficam apenas neste navegador.</p>';
  else if (S.isAdmin) plano = `<div class="plan-badge on">Consultor</div><p class="mmsg">Você está logado como ${esc(CFG.consultor)}, com todos os recursos e a área de clientes.</p>`;
  else plano = `<div class="plan-badge${planoAtual() !== 'gratis' ? ' on' : ''}">Plano ${esc(nPl)}</div>${pend ? `<p class="mmsg">Você pediu o plano ${esc(nomePlano(pend))}. Assim que o ${esc(primeiroNome())} confirmar o pagamento, ele é liberado na sua conta.</p><div class="btn-row"><button class="btn" data-act="upgrade" data-plano="${pend}">Ver como pagar</button></div>` : planoAtual() !== 'completo' ? `<p class="mmsg">${planoAtual() === 'gratis' ? 'Evolua para o Investidor (investimentos, proventos, patrimônio e carteira) ou para a Assessoria (com o ' + esc(primeiroNome()) + ').' : 'Evolua para a Assessoria: carteira recomendada, relatórios avançados e acompanhamento do ' + esc(primeiroNome()) + '.'}</p><div class="btn-row">${planoAtual() === 'gratis' ? '<button class="btn" data-act="upgrade" data-plano="investidor">Plano Investidor</button>' : ''}<button class="btn primary" data-act="upgrade" data-plano="completo">Plano Assessoria</button></div>` : `<p class="mmsg">Você conta com a assessoria exclusiva do ${esc(primeiroNome())}, a carteira recomendada, os relatórios avançados e todos os recursos.</p>`}`;
  const importBlock = gated('importar') ? lockedHtml('importar') : importHtml();
  const sub = [p.perfilInvestidor && p.perfilInvestidor.resultado ? 'Perfil ' + ob : '', planLabel()].filter(Boolean).join(' · ');
  const G = admGrupo();
  if (G && G.id === 'planejamento') return `<section class="dr-sec"><h3>Metas e ponto de partida</h3>
      ${pl ? `<div class="field-row"><div>Meta de aportes mensais<small>A meta de cada mês soma os dividendos recebidos.</small></div><input class="in-s" data-setting="metaAporte" inputmode="decimal" value="${pl.settings.metaAporte ? nf.format(pl.settings.metaAporte) : ''}" placeholder="0,00" aria-label="Meta de aportes mensais"></div>
      <div class="field-row"><div>Meta de investimento de ${pl.year}<small>Opcional. Se vazio, soma as metas mensais.</small></div><input class="in-s" data-setting="metaInvAno" inputmode="decimal" value="${pl.settings.metaInvAno ? nf.format(pl.settings.metaInvAno) : ''}" placeholder="—" aria-label="Meta de investimento do ano"></div>
      <div class="field-row"><div>Patrimônio inicial de ${pl.year}<small>O que você tinha investido no início deste ano. Vazio = automático (patrimônio informado mais os aportes dos anos anteriores).</small></div><input class="in-s" data-setting="patrimonioInicial" inputmode="decimal" value="${pl.settings.patrimonioInicial != null ? nf.format(pl.settings.patrimonioInicial) : ''}" placeholder="0,00" aria-label="Patrimônio inicial do ano"></div>` : ''}
      ${objetivosLinkHtml()}</section>
    <section class="dr-sec"><h3>Anos de planejamento</h3><ul class="yrs">${years.map((y) => `<li><b>${y}</b>${years.length > 1 ? `<button class="btn sm danger" data-act="del-year" data-year="${y}">Excluir</button>` : ''}</li>`).join('')}</ul>
      <form data-form="year" class="yr-new"><label class="pop-t" for="yr-adm">Adicionar ou abrir outro ano</label><div class="act-row"><input id="yr-adm" name="ano" class="in-s left" inputmode="numeric" maxlength="4" placeholder="Ex.: ${NOW_Y + 1}" autocomplete="off"><button class="btn primary" type="submit">Abrir</button></div></form></section>`;
  if (G && G.id === 'personalizar') return `<section class="dr-sec"><h3>Telas</h3>${['geral', 'gastos', 'rendas', 'invest', 'proventos', 'carteira'].filter((k) => !PAINEIS[k].recurso || temRecurso(PAINEIS[k].recurso)).map(painelLinkHtml).join('')}</section>
    <section class="dr-sec"><h3>Abas do menu</h3><div class="abas">${abas.map(([k, l, d]) => `<label class="chk aba"><input type="checkbox" data-aba="${k}" ${p.abas.includes(k) ? 'checked' : ''} ${k === 'geral' ? 'disabled' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div></section>
    ${aberturaAdmHtml()}
    ${prefsHtml()}`;
  if (G && G.id === 'dados') return `<section class="dr-sec"><h3>Backup completo</h3><div class="btn-row"><button class="btn primary" data-act="backup">Baixar backup</button><label class="btn" for="bk-file">Restaurar backup</label><input id="bk-file" type="file" accept=".json,application/json" hidden></div>${bkHtml()}</section>
    <section class="dr-sec"><h3>Importar planilha (.xlsx)</h3>${importBlock}</section>`;
  // página inicial: perfil, os três grupos (cada um abre a sua página), plano e sessão
  const grupos = ADM_GRUPOS.map((g) => `<button class="pf-card adm-grupo" data-act="adm-grupo" data-g="${g.id}"><span class="adm-gi" aria-hidden="true">${ic(`<path d="${g.ic}"/>`)}</span><span class="pf-t"><b>${esc(g.nome)}</b><small>${esc(g.desc)}</small></span><span class="pf-go">${I.chev}</span></button>`).join('');
  return `<button class="pf-card" data-act="perfil-abrir">${avatarHtml(p, 'lg')}<span class="pf-t"><b>${esc(p.nome || 'Minha conta')}</b><small>${esc(p.email || '')}</small><small>${esc(sub)}</small></span><span class="pf-go">Meu perfil${I.chev}</span></button>
    <div class="adm-grupos">${grupos}</div>
    <section class="dr-sec"><h3>Plano</h3>${plano}<div class="btn-row"><button class="btn" data-act="contact">Falar com o ${esc(primeiroNome())}</button></div></section>
    <section class="dr-sec"><h3>Sessão</h3><div class="btn-row"><button class="btn" data-act="goto-landing">Ver página inicial</button><button class="btn" data-act="terms">Termos e privacidade</button><button class="btn danger" data-act="sair">Sair</button></div></section>`;
}
function renderAdmin(topo) {
  const d = $('#admin'); if (!d || !S.profile) return;
  const ae = document.activeElement; let foco = null;
  if (!topo && ae && d.contains(ae) && ae.dataset) { const at = ['act', 'id', 'd', 'tam', 'painelOn', 'objf'].filter((k) => ae.dataset[k] != null).map((k) => `[data-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}="${CSS.escape(ae.dataset[k])}"]`).join(''); if (at) foco = at; }
  const sc = topo ? 0 : $('.dr-body', d) ? $('.dr-body', d).scrollTop : 0; const perfil = S.adminPage === 'perfil'; const objs = S.adminPage === 'objetivos'; const pnl = S.adminPage === 'painel'; const G = admGrupo();
  const head = G
    ? `<div class="dr-head"><div class="dr-back"><button class="btn ghost sm" data-act="adm-voltar" aria-label="Voltar ao painel"><span class="flip">${I.chev}</span>Painel</button><h2>${esc(G.nome)}</h2></div><button class="btn ghost" data-act="admin-close" aria-label="Fechar painel">${I.x}</button></div>`
    : pnl
    ? `<div class="dr-head"><div class="dr-back"><button class="btn ghost sm" data-act="painel-voltar" aria-label="Voltar ao painel"><span class="flip">${I.chev}</span>Painel</button><h2>Personalizar ${nomeTela(alvoAtual())}</h2></div><button class="btn ghost" data-act="admin-close" aria-label="Fechar painel">${I.x}</button></div>`
    : objs
    ? `<div class="dr-head"><div class="dr-back"><button class="btn ghost sm" data-act="objetivos-voltar" aria-label="Voltar ao painel"><span class="flip">${I.chev}</span>Painel</button><h2>Meus objetivos</h2></div><button class="btn ghost" data-act="admin-close" aria-label="Fechar painel">${I.x}</button></div>`
    : perfil
    ? `<div class="dr-head"><div class="dr-back"><button class="btn ghost sm" data-act="perfil-voltar" aria-label="Voltar ao painel"><span class="flip">${I.chev}</span>Painel</button><h2>Meu perfil</h2></div><button class="btn ghost" data-act="admin-close" aria-label="Fechar painel">${I.x}</button></div>`
    : `<div class="dr-head"><div><h2>Painel administrativo</h2><p>${esc(S.profile.nome || 'Minha conta')}, ${esc(planLabel().toLowerCase())}</p></div><button class="btn ghost" data-act="admin-close" aria-label="Fechar painel">${I.x}</button></div>`;
  const tst = $('#toast'); // o aviso pode estar dentro deste painel (ver toastHost): não deixa ele sumir no redesenho
  d.innerHTML = `${head}<div class="dr-body${perfil ? ' pf-page' : objs ? ' obj-page' : pnl ? ' wg-page' : G ? ' adm-gpage' : ''}">${pnl ? painelEditorHtml() : objs ? objetivosHtml() : perfil ? perfilHtml() : adminHtml()}</div>`;
  if (!pnl && !objs && !perfil) admAcordeao(d);
  if (tst && !tst.isConnected) d.appendChild(tst);
  $('.dr-body', d).scrollTop = sc;
  // o painel pode ser redesenhado por trás (salvamento, Visão geral): devolve o foco ao mesmo controle
  if (foco) { const n = d.querySelector(foco); if (n && n !== document.activeElement) n.focus({ preventScroll: true }); }
}

/* ---------- Meu perfil: foto ou avatar, dados pessoais e perfil de investidor ---------- */
function perfilHtml() {
  const p = S.profile; const cloud = Store.mode === 'cloud'; const a = p.avatar;
  const res = p.perfilInvestidor && p.perfilInvestidor.resultado; const PF = res ? E.PERFIS[res] : null;
  const col = avColecao(); const sug = AV_GRUPOS.find((g) => g.perfil === res);
  const grupos = (sug ? [sug].concat(AV_GRUPOS.filter((g) => g !== sug)) : AV_GRUPOS);
  const marcado = (id) => a && a.tipo === 'preset' && a.id === id;
  const card = (it) => `<button class="av-opt" data-act="avatar" data-av="${esc(it.id)}" aria-pressed="${marcado(it.id)}" title="${esc(it.nome)}">${it.src ? `<span class="av img"><img src="${esc(it.src)}" alt=""></span>` : `<span class="av preset">${avSvg(it.id, p.nome || p.email)}</span>`}<small>${esc(it.nome)}</small></button>`;
  const galeria = grupos.map((g) => { const its = col.filter((x) => x.grupo === g.id); if (!its.length) return '';
    return `<div class="av-grp"><div class="av-grp-h"><b>${esc(g.nome)}</b>${g === sug ? '<span class="pill ok">Sugerido para o seu perfil</span>' : ''}<small>${esc(g.desc)}</small></div><div class="av-grid">${its.map(card).join('')}</div></div>`; }).join('');
  const temFoto = a && a.tipo === 'foto';
  return `<section class="pf-hero">${avatarHtml(p, 'xl')}<div class="pf-hero-t"><b>${esc(p.apelido || p.nome || 'Seu nome')}</b><small>${a ? (temFoto ? 'Foto enviada por você' : 'Avatar ' + esc((col.find((x) => x.id === a.id) || {}).nome || '')) : 'Sem foto: mostramos a sua inicial'}</small>
      <div class="btn-row"><label class="btn primary sm" for="av-file">${temFoto ? 'Trocar foto' : 'Enviar foto'}</label><input id="av-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>${a ? '<button class="btn sm" data-act="avatar-remover">Remover</button>' : ''}</div><small class="pf-note">JPG, PNG ou WebP. A foto é recortada em quadrado e reduzida no seu aparelho antes de salvar.</small></div></section>
    <section class="dr-sec"><h3>Ou escolha um avatar</h3><p class="mmsg">Uma coleção criada para cada perfil de investidor.</p>${galeria}</section>
    <section class="dr-sec"><h3>Seus dados</h3>
      <label class="fld"><span>Nome completo</span><input data-pf="nome" value="${esc(p.nome)}" autocomplete="name"></label>
      <label class="fld"><span>Como prefere ser chamado</span><input data-pf="apelido" value="${esc(p.apelido)}" placeholder="${esc((p.nome || '').split(' ')[0] || 'Ex.: Ana')}" maxlength="40" autocomplete="nickname"></label>
      <label class="fld"><span>E-mail</span><input data-pf="email" type="email" value="${esc(p.email)}" ${cloud ? 'readonly' : ''} autocomplete="email">${cloud ? '<small class="pf-note">O e-mail é o seu login e não pode ser trocado aqui.</small>' : ''}</label>
      <label class="fld"><span>WhatsApp</span><input data-pf="whatsapp" value="${esc(p.whatsapp)}" inputmode="tel" autocomplete="tel"></label>
      <div class="fld-2"><label class="fld"><span>Profissão</span><input data-pf="profissao" value="${esc(p.profissao)}" maxlength="60" autocomplete="organization-title"></label><label class="fld"><span>Cidade</span><input data-pf="cidade" value="${esc(p.cidade)}" maxlength="60" autocomplete="address-level2"></label></div></section>
    <section class="dr-sec"><h3>Perfil de investidor</h3>${PF ? `<div class="pf-inv"><span class="pill">${esc(PF.nome)}</span><p class="mmsg">${esc(PF.desc)}</p><small class="pf-note">Referência: ${PF.alvo.rendaFixa}% em renda fixa e ${PF.alvo.bolsa}% em renda variável.</small></div>` : '<p class="mmsg">Você ainda não respondeu o questionário.</p>'}<div class="btn-row"><button class="btn" data-act="refazer-perfil">${PF ? 'Refazer questionário' : 'Responder questionário'}</button></div></section>
    <p class="pf-note">Seu nome, contato, foto ou avatar e o perfil de investidor ficam visíveis para o ${esc(primeiroNome())}, para ele poder atender você.</p>`;
}
function definirAvatar(av) {
  S.profile.avatar = av; touch('profile'); render(); renderAdmin();
  toast(av ? (av.tipo === 'foto' ? 'Foto de perfil atualizada.' : 'Avatar atualizado.') : 'Foto removida.');
}
async function enviarFoto(file) {
  try { const data = await fotoParaAvatar(file); definirAvatar({ tipo: 'foto', data }); }
  catch (e) { toast(e && e.message === 'tipo' ? 'Use uma imagem JPG, PNG ou WebP.' : e && e.message === 'grande' ? 'Imagem acima de 15 MB.' : 'Não foi possível ler a imagem.'); }
}

/* ---------- backup ---------- */
function backupCompleto() {
  const planos = {}; Object.keys(S.plans).forEach((y) => { planos[y] = clone(S.plans[y]); });
  const d = new Date(); const dia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  saveFile(`financial-planning-backup-${dia}.json`, JSON.stringify(E.makeBackup(clone(S.profile), planos), null, 2), 'application/json');
  toast('Backup gerado. Guarde o arquivo em local seguro.');
}
function bkHtml() {
  const b = S.bk; if (!b) return '';
  if (b.state === 'error') return `<div class="notice">${esc(b.msg)}</div>`;
  const P = b.parsed; const anos = Object.keys(P.planos).sort(); const nAt = anos.reduce((s, y) => s + (P.planos[y].ativos || []).length, 0);
  return `<div class="imp-prev card"><h4>${esc(b.name)}</h4><ul class="sum"><li><b>${anos.length}</b> ${anos.length === 1 ? 'ano' : 'anos'} (${anos.join(', ')})</li><li><b>${nAt}</b> registros de ativos</li></ul>${P.avisos.length ? `<ul class="warns">${P.avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    <p class="mmsg">Restaurar substitui todos os planejamentos atuais pelo conteúdo do arquivo.</p><div class="btn-row"><button class="btn primary" data-act="bk-apply">Restaurar e substituir tudo</button><button class="btn" data-act="bk-cancel">Cancelar</button></div></div>`;
}
async function lerBackup(file) {
  try { const obj = JSON.parse(await file.text()); const r = E.parseBackup(obj, uid); S.bk = r.ok ? { state: 'ready', name: file.name, parsed: r } : { state: 'error', msg: r.erro }; }
  catch (e) { S.bk = { state: 'error', msg: 'Não foi possível ler o arquivo. Use um backup gerado pelo ' + CFG.marca + ' (.json).' }; }
  renderAdmin();
}
async function aplicarBackup() {
  const b = S.bk.parsed; const antigos = Object.keys(S.plans).map(Number);
  S.plans = {}; Object.keys(b.planos).forEach((y) => { S.plans[y] = hydratePlan(b.planos[y]); });
  try {
    for (const y of antigos) if (!S.plans[y]) await Store.deletePlan(y, S.user);
    for (const y of Object.keys(S.plans)) await Store.savePlan(+y, S.plans[y], S.user);
  } catch (e) { toast('Restaurado na tela, mas houve falha ao salvar. Tente de novo.'); }
  if (b.perfil) { const keep = { nome: S.profile.nome, email: S.profile.email, whatsapp: S.profile.whatsapp, criadoEm: S.profile.criadoEm, planoSolicitado: S.profile.planoSolicitado }; S.profile = hydrateProfile(Object.assign({}, b.perfil, keep, { onboarded: true })); }
  touch('profile'); S.bk = null; S.year = pickYear(); S.plan = S.plans[S.year]; S.mes = defaultMes(S.year); S.profile.anoRef = S.year;
  render(); toast('Backup restaurado.');
}

/* ---------- importação de planilha ---------- */
function importHtml() {
  const im = S.imp;
  const how = `<details class="how"><summary>Como preencher o modelo</summary><ul><li><b>Rendas:</b> Categoria (qualquer nome), Fonte (opcional), Item e o valor de cada mês.</li><li><b>Despesas:</b> Categoria, Área, Subárea (opcional), Item e o valor de cada mês.</li><li><b>Parcelados:</b> Valor total, parcelas, mês e ano inicial. O sistema distribui o valor pelos meses.</li><li><b>Investimentos e Proventos:</b> Tipo, Classe, Grupo e Subgrupo (opcionais), Ativo e os valores por mês.</li><li><b>Carteira:</b> os mesmos campos do ativo, mais Alvo % (somando 100), Valor atual e Preço (opcionais).</li><li>Preencha só as abas que quiser e apague as linhas de exemplo antes.</li></ul></details>`;
  const modes = `<fieldset class="plan-pick tight"><legend>Como importar</legend>
    <label class="pick"><input type="radio" name="impmode" data-imp-mode value="merge" ${im.mode === 'merge' ? 'checked' : ''}><span><b>Mesclar</b><small>Atualiza o que já existe e acrescenta o novo, sem duplicar.</small></span></label>
    <label class="pick"><input type="radio" name="impmode" data-imp-mode value="replace" ${im.mode === 'replace' ? 'checked' : ''}><span><b>Substituir</b><small>Troca o conteúdo das seções enviadas pelo do arquivo.</small></span></label></fieldset>`;
  let state = '';
  if (im.state === 'reading') state = `<p class="mmsg">Lendo ${esc(im.name)}…</p>`;
  else if (im.state === 'error') state = `<div class="notice">${esc(im.msg)}</div>`;
  else if (im.state === 'ready') {
    const P = im.parsed; const c = P.counts; const rows = [['Rendas', c.rendas], ['Despesas', c.despesas], ['Parcelados', c.parcelados], ['Ativos em Investimentos', c.investimentos], ['Ativos em Proventos', c.proventos], ['Ativos na Carteira', c.carteira]].filter((r) => r[1] > 0);
    const av = P.avisos.slice(0, 8).map((a) => `<li>${esc(a)}</li>`).join('') + (P.avisos.length > 8 ? `<li>E mais ${P.avisos.length - 8} avisos.</li>` : '');
    state = P.vazio ? `<div class="notice">Não encontramos abas conhecidas em ${esc(im.name)}. Use o modelo (Rendas, Despesas, Parcelados, Investimentos, Proventos ou Carteira).</div>${av ? `<ul class="warns">${av}</ul>` : ''}`
      : `<div class="imp-prev card"><h4>${esc(im.name)}</h4><ul class="sum">${rows.map(([l, n]) => `<li><b>${n}</b> ${l}</li>`).join('')}</ul>${av ? `<p class="mmsg">Avisos:</p><ul class="warns">${av}</ul>` : ''}<p class="mmsg">Os dados serão importados em ${S.year}.</p><div class="btn-row"><button class="btn primary" data-act="imp-apply">Importar para ${S.year}</button><button class="btn" data-act="imp-cancel">Cancelar</button></div></div>`;
  }
  return `<p class="mmsg">Baixe o modelo, preencha e importe. Serve também para receber a carteira montada pelo seu assessor.</p><div class="btn-row"><button class="btn" data-act="download-template">Baixar modelo (.xlsx)</button></div>${how}${modes}<div class="btn-row"><label class="btn primary" for="imp-file">Escolher arquivo .xlsx</label><input id="imp-file" type="file" accept=".xlsx" hidden></div>${state}`;
}
function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX); if (loadXlsx.p) return loadXlsx.p;
  loadXlsx.p = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => res(window.XLSX); s.onerror = () => { loadXlsx.p = null; rej(new Error('xlsx')); }; document.head.appendChild(s); });
  return loadXlsx.p;
}
async function baixarModelo() {
  let arr;
  try {
    const X = await loadXlsx(); const wb = X.utils.book_new();
    E.templateSheets(S.year).forEach((sh) => { const ws = X.utils.aoa_to_sheet(sh.rows); ws['!cols'] = sh.name === 'Instruções' ? [{ wch: 130 }] : sh.rows[0].map((_, i) => ({ wch: i < 5 ? 22 : 11 })); X.utils.book_append_sheet(wb, ws, sh.name); });
    arr = X.write(wb, { bookType: 'xlsx', type: 'array' });
  } catch (e) { toast('Não foi possível carregar o gerador de planilhas. Verifique a conexão e tente de novo.'); return; }
  saveFile('financial-planning-modelo.xlsx', new Uint8Array(arr), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); toast('Modelo baixado.');
}
async function lerPlanilha(file) {
  const mode = S.imp.mode; S.imp = { state: 'reading', mode, name: file.name }; renderAdmin();
  try {
    const X = await loadXlsx(); const wb = X.read(await file.arrayBuffer(), { type: 'array' });
    const sheets = wb.SheetNames.map((n) => ({ name: n, rows: X.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '', raw: true }) }));
    S.imp = { state: 'ready', mode, name: file.name, parsed: E.parseImport(sheets) };
  } catch (e) { S.imp = { state: 'error', mode, name: file.name, msg: 'Não foi possível ler o arquivo. Confirme que é um .xlsx válido e que a conexão está ativa.' }; }
  renderAdmin();
}
function aplicarPlanilha() {
  if (gated('importar') || !S.plan || S.imp.state !== 'ready') return;
  const { parsed, mode } = S.imp; const r = E.applyImport(S.plan, S.profile.carteira, parsed, mode, uid);
  touch('plan'); if (parsed.found.cart) touch('profile'); S.imp = { state: 'idle', mode };
  render(); renderAdmin();
  const parts = []; if (r.rendas) parts.push(`${r.rendas} rendas`); if (r.despesas) parts.push(`${r.despesas} gastos`); if (r.parcelados) parts.push(`${r.parcelados} parcelados`); if (r.ativos) parts.push(`${r.ativos} ativos novos`); if (r.carteira) parts.push(`${r.carteira} alvos`);
  toast('Importação concluída' + (parts.length ? ': ' + parts.join(', ') : '') + '.');
}

/* ---------- campos do painel ---------- */
function refazerPerfil() { closeAdmin(); initOb(); S.ob.step = OB_STEPS.indexOf('perfil'); S.ob.q = 0; S.ob.resp = []; S.ob.perfil = null; S.screen = 'onboarding'; render(); }

function onAdminChange(t) {
  const p = S.profile; const num = (v) => (String(v).trim() === '' ? 0 : E.parseValor(String(v).replace('%', '')));
  if (t.matches('[data-pf]')) {
    const k = t.dataset.pf; const v = t.value.trim();
    if (k === 'nome' && v.length < 2) { toast('Informe seu nome.'); t.value = p.nome; return true; }
    p[k] = v; touch('profile'); renderLater(); const hp = $('.dr-head p', $('#admin')); if (hp) hp.textContent = `${p.nome || 'Minha conta'}, ${planLabel().toLowerCase()}`; const ht = $('.pf-hero-t b', $('#admin')); if (ht && (k === 'nome' || k === 'apelido')) ht.textContent = p.apelido || p.nome || 'Seu nome'; return true;
  }
  if (t.matches('[data-prof]')) {
    const k = t.dataset.prof; const v = num(t.value);
    if (Number.isNaN(v) || v < 0 || (k === 'retornoAnual' && v > 100)) { toast('Valor inválido.'); t.value = String(p[k]).replace('.', ','); return true; }
    p[k] = v; t.value = k === 'retornoAnual' ? String(v).replace('.', ',') : (v ? nf.format(v) : ''); touch('profile'); renderLater(); return true;
  }
  if (t.matches('[data-setting]') && S.plan) {
    const k = t.dataset.setting; const v = num(t.value);
    if (Number.isNaN(v) || v < 0) { toast('Valor inválido.'); t.value = S.plan.settings[k] ? nf.format(S.plan.settings[k]) : ''; return true; }
    if (k === 'patrimonioInicial' && String(t.value).trim() === '') { S.plan.settings.patrimonioInicial = null; t.value = ''; touch('plan'); renderLater(); return true; }
    S.plan.settings[k] = v; t.value = v || k === 'patrimonioInicial' ? nf.format(v) : ''; touch('plan'); renderLater(); return true;
  }
  if (t.matches('[data-objf]')) { objCampo(t); return true; }
  if (t.matches('[data-painel-on]')) { painelLigar(t); return true; }
  if (t.matches('[data-tema-auto]')) { definirTema(t.checked ? 'auto-on' : 'auto-off'); return true; }
  if (t.matches('[data-abf]')) { aberturaCampo(t); return true; }
  if (t.matches('[data-aba]')) {
    const keys = $$('[data-aba]:checked', $('#admin')).map((x) => x.dataset.aba);
    p.abas = hydrateProfile({ abas: ['geral'].concat(keys.filter((k) => k !== 'geral')) }).abas; if (!p.abas.includes(S.view)) S.view = 'geral'; touch('profile'); renderLater(); return true;
  }
  if (t.matches('[data-imp-mode]')) { S.imp.mode = t.value; return true; }
  if (t.id === 'imp-file') { const f = t.files && t.files[0]; if (f) lerPlanilha(f); return true; }
  if (t.id === 'bk-file') { const f = t.files && t.files[0]; if (f) lerBackup(f); return true; }
  return false;
}

/* ---------- área do consultor ---------- */
async function loadClients() {
  S.clientsLoading = true;
  try { S.clients = await Store.listClients(); } catch (e) { S.clients = []; toast('Não foi possível carregar os clientes.'); }
  S.clientsLoading = false; render({ soft: true });
}
async function setPlanoCliente(id, plano) {
  try { await Store.setPlano(id, plano, 'ativo'); const c = S.clients.find((x) => x.id === id); if (c) c.plano = plano; toast(`Plano ${nomePlano(plano)} definido para o cliente.`); }
  catch (e) { toast('Não foi possível alterar o plano. Confira as regras do banco.'); }
  render();
}
function viewClientes() {
  if (!S.isAdmin) return '<p class="empty-s">Área restrita ao consultor.</p>';
  if (S.clients == null) { if (!S.clientsLoading) loadClients(); return '<div class="page-h"><div><h2 class="title">Clientes</h2></div></div><div class="loading">Carregando clientes…</div>'; }
  const q = S.clientsQ.trim().toLowerCase(); const all = S.clients.filter((c) => !S.user || c.id !== S.user.id);
  const lista = all.filter((c) => !q || `${c.nome} ${c.email}`.toLowerCase().includes(q));
  const ped = (c) => ((c.dados.planoSolicitado === 'completo' || c.dados.planoSolicitado === 'investidor') && c.plano !== c.dados.planoSolicitado && c.plano !== 'completo' ? c.dados.planoSolicitado : null);
  const f = { cad: all.length, diag: all.filter((c) => c.dados.onboarded).length, sol: all.filter((c) => ped(c)).length, inv: all.filter((c) => c.plano === 'investidor').length, comp: all.filter((c) => c.plano === 'completo').length };
  const rows = lista.map((c) => {
    const d = c.dados; const pf = d.perfilInvestidor && d.perfilInvestidor.resultado ? E.PERFIS[d.perfilInvestidor.resultado].nome : '–'; const zap = String(c.whatsapp || '').replace(/\D/g, ''); const pd = ped(c);
    return `<tr><td><div class="cli-n">${avatarHtml(Object.assign({ nome: c.nome, email: c.email }, c.dados || {}), 'sm')}<div><b>${esc(c.nome || '(sem nome)')}</b><small>${esc(c.email)}</small></div></div></td><td>${zap ? `<a class="lnk strong" href="https://wa.me/${zap}" ${ext}>${esc(c.whatsapp)}</a>` : '–'}</td><td>${pf}</td><td class="num">${d.patrimonioInicial ? brl0(d.patrimonioInicial) : '–'}</td>
      <td>${esc(objResumoCliente(d))}</td><td>${sel('plano', [['gratis', 'Organização'], ['investidor', 'Investidor'], ['completo', 'Assessoria']], c.plano).replace('<select', `<select data-plano-cli="${c.id}"`)}${pd ? `<small class="warn-t">Pediu ${esc(nomePlano(pd))}</small>` : ''}</td>
      <td>${c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '–'}</td><td><button class="btn sm" data-act="cliente-abrir" data-id="${esc(c.id)}">Abrir</button></td></tr>`;
  }).join('');
  const st = (k, v, n) => `<div class="stat"><div class="c-k">${k}</div><div class="c-num">${v}</div>${n ? `<div class="c-n">${n}</div>` : ''}</div>`;
  return `<div class="page-h"><div><h2 class="title">Clientes</h2><p class="sub">Cadastros, diagnósticos e planos. Abra um cliente para ver o relatório (Assessoria) e registrar a carteira recomendada.</p></div></div>
    <div class="stats4">${st('Cadastros', f.cad)}${st('Diagnósticos concluídos', f.diag, f.cad ? pct(f.diag / f.cad) + ' dos cadastros' : '')}${st('Pediram um plano', f.sol)}${st('Investidor e Assessoria', f.inv + f.comp, `${f.inv} Investidor · ${f.comp} Assessoria`)}</div>
    <div class="ltools"><input class="search" type="search" data-clients-q placeholder="Buscar por nome ou e-mail" value="${esc(S.clientsQ)}" aria-label="Buscar cliente"></div>
    <div class="tablewrap"><table class="clientes"><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Perfil</th><th class="num">Patrimônio</th><th>Objetivo</th><th>Plano</th><th>Cadastro</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty-s">Nenhum cliente encontrado.</td></tr>'}</tbody></table></div>`;
}

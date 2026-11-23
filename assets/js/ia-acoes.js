/* Ações do assistente: a IA (ou o entendimento local, sem internet) PROPÕE anotar um gasto, uma entrada, um aporte,
   mudar a meta ou um limite, ou abrir uma tela. Aqui a proposta é conferida, vira um cartão no chat e na conversa por voz
   (Confirmar / Editar / Cancelar) e só é gravada depois do Confirmar, pelas mesmas regras dos formulários (basSalvar, basico.js). */
'use strict';
const IAX_TELAS = { inicio: ['o Início', 'inicio', '', 'geral'], gastos: ['Gastos', 'gastos', '', 'despesas'], investimentos: ['Patrimônio', 'investir', '', 'inv'], entradas: ['Entradas', 'inicio', 'entradas', 'rendas'],
  sonhos: ['Sonhos', 'inicio', 'sonhos', 'geral'], cartoes: ['Cartões', 'gastos', 'cartoes', 'despesas'], limites: ['Limites', 'perfil', 'planejamento', 'despesas'], planejamento: ['Planejamento', 'perfil', 'planejamento', 'geral'],
  carteira: ['Carteira', 'investir', 'carteira', 'cart'], proventos: ['Proventos', 'investir', 'proventos', 'pro'], avisos: ['Avisos', 'inicio', 'avisos-tela', 'geral'], resumo: ['Resumo do mês', 'inicio', 'resumo', 'geral'], saude: ['Saúde financeira', 'inicio', 'saude', 'geral'] };
const iaxTxt = (x, n) => String(x == null ? '' : x).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 40);
const iaxMes = () => (S.year === NOW_Y ? NOW_M : S.mes);
// categorias que o app conhece (as fixas e as que a pessoa já usou); vão para a IA escolher entre elas
function iaxAreas() {
  const p = S.plan; if (!p) return [];
  return [...new Set(BAS_AREAS.concat((p.despesas || []).map((x) => x.area), (p.lancamentos || []).map((x) => x.area), Object.keys((p.settings && p.settings.limites) || {}), ['Outros']).filter(Boolean))].slice(0, 30);
}
function iaxAtivo(nome) {
  const L = (S.plan && S.plan.ativos) || []; const n = E.norm(nome || '');
  if (!n) return L.length === 1 ? L[0] : null;
  return L.find((a) => E.norm(a.nome) === n) || L.find((a) => E.norm(a.nome).includes(n) || n.includes(E.norm(a.nome))) || null;
}

/* entendimento local de pedidos simples ("gastei 45 no mercado", "recebi 3 mil de salário", "aportei 500 no CDB",
   "muda minha meta para 800", "limite de lazer 300"); só com um valor dito. Sem estado: testado em tests/ia-acoes.test.js */
const IAX_VERBO = '(anota|anote|anotar|lanca|lance|lancar|registra|registre|registrar|coloca|coloque|adiciona|adicione)';
const IAX_MUDA = /\b(muda|mude|mudar|altera|altere|alterar|coloca|coloque|colocar|define|defina|definir|ajusta|ajuste|ajustar|passa|passe|quero|bota|bote|aumenta|aumente|diminui|diminua|baixa|baixe|sobe|suba)\b/;
function iaxEntender(q, hoje, areas) {
  const t = ' ' + E.norm(q).replace(/[^a-z0-9$.,\s]/g, ' ').replace(/\s+/g, ' ') + ' '; const v = E.iaValor(q); if (!(v > 0)) return null;
  const tem = (re) => re.test(t); const vb = (alvo) => new RegExp(`\\b${IAX_VERBO}\\b.*\\b${alvo}`).test(t);
  // o que vem depois do valor, sem preposição: "gastei 45 no mercado" → "mercado"
  const i = q.search(/\d/); const resto = i < 0 ? '' : q.slice(i).replace(/^[\d.,]+\s*(mil|k)?\s*(reais|real|conto|contos|pila)?/i, '');
  const depois = iaxTxt(resto.replace(/^[\s,]*(no|na|nos|nas|em|com|de|do|da|dos|das|pro|pra|para o|para a|para|pelo|pela)\s+/i, '').replace(/\s*\b(hoje|ontem|anteontem)\b.*$/i, '').replace(/[.!?]+$/, ''));
  const Cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const area = (areas || []).find((a) => a !== 'Outros' && t.includes(' ' + E.norm(a) + ' ')) || '';
  if (tem(/\bmeta\b/) && (IAX_MUDA.test(t) || vb('meta'))) return { tipo: 'mudar_meta_aporte', valor: v };
  if (tem(/\blimite\b/) && (IAX_MUDA.test(t) || vb('limite') || /\blimite (de|da|do|pra|para)\b/.test(t))) return { tipo: 'mudar_limite', valor: v, categoria: area };
  if (tem(/\b(aportei|investi|apliquei)\b/) || vb('(aporte|investimento)')) return { tipo: 'anotar_aporte', valor: v, ativo: depois };
  if (tem(/\b(dividendo|provento|rendimento|jcp)/)) return null; // proventos ficam com o formulário de proventos
  if (tem(/\b(recebi|ganhei|entrou|caiu)\b/) || vb('(entrada|renda|salario)')) return { tipo: 'anotar_entrada', valor: v, fonte: Cap(depois.replace(/^(meu|minha|o|a)\s+/i, '')) };
  if (tem(/\b(gastei|paguei|comprei|torrei)\b/) || vb('(gasto|despesa|compra)')) {
    const d = new Date(hoje + 'T12:00:00'); const dd = tem(/\banteontem\b/) ? 2 : tem(/\bontem\b/) ? 1 : 0; d.setDate(d.getDate() - dd);
    const dia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { tipo: 'anotar_gasto', valor: v, descricao: Cap(depois), categoria: area, dia };
  }
  return null;
}
function iaxLocal(q) {
  if (!S.plan) return null; const a = iaxEntender(q, basHoje(), iaxAreas()); const ok = a && iaxValidar([a])[0];
  return ok ? { texto: 'Entendi! Confira e confirme aqui embaixo.', acao: ok } : null;
}
// confere a proposta (da nuvem ou local) antes de mostrar: valor positivo e razoável, categoria conhecida, ativo existente
function iaxValidar(lista) {
  if (!S.plan || !Array.isArray(lista)) return []; const areas = iaxAreas(); const acha = (x) => areas.find((a) => E.norm(a) === E.norm(x || '')) || '';
  const out = [];
  lista.slice(0, 3).forEach((a0) => { const a = a0 || {}; const v = Math.round(+a.valor * 100) / 100; const okV = v > 0 && v <= 1e6; const tipo = a.tipo;
    if (tipo === 'anotar_gasto' && okV) { const desc = iaxTxt(a.descricao); let cat = acha(a.categoria);
      if (!cat && desc && typeof FPIngest !== 'undefined') cat = acha(FPIngest.classificar({ descricao: desc, valor: -v }).area);
      out.push({ tipo, valor: v, descricao: desc, categoria: cat || 'Outros', dia: /^\d{4}-\d{2}-\d{2}$/.test(a.dia || '') && E.parseDataISO(a.dia) ? a.dia : basHoje() }); }
    else if (tipo === 'anotar_entrada' && okV) out.push({ tipo, valor: v, fonte: iaxTxt(a.fonte) || 'Outras entradas' });
    else if (tipo === 'anotar_aporte' && okV && temRecurso('aporte_simples')) { const at = iaxAtivo(a.ativo); out.push({ tipo, valor: v, ativo: at ? at.nome : iaxTxt(a.ativo), ativoId: at ? at.id : '' }); }
    else if (tipo === 'mudar_meta_aporte' && okV) out.push({ tipo, valor: v });
    else if (tipo === 'mudar_limite' && okV) out.push({ tipo, valor: v, categoria: acha(a.categoria) || iaxTxt(a.categoria) }); // limite vale para qualquer categoria, mesmo nova
    else if (tipo === 'abrir_tela' && IAX_TELAS[a.tela]) out.push({ tipo, tela: a.tela });
  });
  return out.map((x) => Object.assign(x, { estado: 'pendente' }));
}

/* ---------- cartão de confirmação ---------- */
function iaxDia(iso) {
  const h = basHoje(); if (iso === h) return 'hoje'; const d = new Date(h + 'T12:00:00'); d.setDate(d.getDate() - 1);
  if (iso === `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`) return 'ontem'; const p = iso.split('-'); return `em ${p[2]}/${p[1]}`;
}
function iaxFrase(a) {
  const v = brl(a.valor); const mes = MES_LONGO[iaxMes()];
  switch (a.tipo) {
    case 'anotar_gasto': return `Anotar gasto de ${v} em ${a.categoria}${a.descricao && E.norm(a.descricao) !== E.norm(a.categoria) ? ` (${a.descricao})` : ''} ${iaxDia(a.dia)}?`;
    case 'anotar_entrada': return `Anotar entrada de ${v} (${a.fonte}) em ${mes}?`;
    case 'anotar_aporte': return a.ativoId ? `Registrar investimento de ${v} em ${a.ativo}, ${mes}?` : `Registrar investimento de ${v}${a.ativo ? ` (${a.ativo})` : ''}? Escolha em qual ativo.`;
    case 'mudar_meta_aporte': return `Mudar a meta de investir para ${v} por mês?`;
    case 'mudar_limite': return `Mudar o limite de ${a.categoria || 'gastos do mês'} para ${v} por mês?`;
    case 'abrir_tela': return `Abrir ${IAX_TELAS[a.tela][0]}?`;
    default: return '';
  }
}
const IAX_ROT = { anotar_gasto: ['Novo gasto', 'despesas', 'g'], anotar_entrada: ['Nova entrada', 'rendas', 'e'], anotar_aporte: ['Investimento', 'inv', 'i'], mudar_meta_aporte: ['Meta de investir', 'inv', 'i'], mudar_limite: ['Limite de gasto', 'despesas', 'g'], abrir_tela: ['Abrir tela', 'chev', 't'] };
function iaxCartoesHtml(m, i) {
  return `<div class="iax-l">${m.acoes.map((a, k) => { const [rot, ic, cor] = IAX_ROT[a.tipo] || ['Ação', 'chev', 't']; const st = a.estado;
    const bt = (act, txt, cls) => `<button type="button" class="iax-b ${cls}" data-act="${act}" data-i="${i}" data-k="${k}">${txt}</button>`;
    const ed = modoBasico() && a.tipo !== 'abrir_tela';
    const pe = st === 'feito' ? `<p class="iax-fim ok">${I.check || ''}${a.tipo === 'abrir_tela' ? 'Aberto' : 'Feito'}</p>` : st === 'cancelado' ? '<p class="iax-fim">Cancelado</p>' : st === 'editando' ? '<p class="iax-fim">Aberto para você editar</p>'
      : `${a.erro ? `<p class="iax-err">${esc(a.erro)}</p>` : ''}<div class="iax-bts">${a.tipo === 'anotar_aporte' && !a.ativoId ? (ed ? bt('iax-ed', 'Escolher ativo', 'pri') : '') : bt('iax-ok', 'Confirmar', 'pri')}${ed && !(a.tipo === 'anotar_aporte' && !a.ativoId) ? bt('iax-ed', 'Editar', '') : ''}${bt('iax-no', 'Cancelar', 'sec')}</div>`;
    return `<div class="iax" data-estado="${st}" data-cor="${cor}"><div class="iax-top"><span class="iax-ic" aria-hidden="true">${I[ic] || ''}</span><small>${rot}</small>${a.valor ? `<b class="iax-v">${brl(a.valor)}</b>` : ''}</div><p class="iax-q">${esc(iaxFrase(a))}</p>${pe}</div>`; }).join('')}</div>`;
}

/* ---------- gravar: o mesmo caminho do formulário, com um formulário invisível ---------- */
// empilha a tela do formulário (sem desenhar), chama basSalvar e, se ele recusar, desempilha e devolve a mensagem de erro
function iaxForm(t, campos, o) {
  const f = document.createElement('form'); f.dataset.t = t; f.innerHTML = '<p class="bas-err" hidden></p>';
  Object.keys(campos).forEach((k) => { const x = document.createElement('input'); x.name = k; x.value = campos[k] == null ? '' : String(campos[k]); f.appendChild(x); });
  const topo = Object.assign({ t, volta: window.scrollY }, o); basPilha().push(topo); history.pushState({ bas: basPilha().length }, '');
  try { basSalvar(f); } catch (e) { /* trata como recusa */ }
  if (basTopoPilha() !== topo) return '';
  basPilha().pop(); history.back(); const e = f.querySelector('.bas-err'); return (e && e.textContent) || 'Não deu para gravar agora.';
}
function iaxGravar(a) {
  const v = nf.format(a.valor);
  switch (a.tipo) {
    case 'anotar_gasto': return iaxForm('gasto', { tipo: 'uma', valor: v, desc: a.descricao, area: a.categoria, data: a.dia, inst: '' });
    case 'anotar_entrada': if (S.year === NOW_Y) S.mes = NOW_M; return iaxForm('entrada', { nome: a.fonte, valor: v });
    case 'anotar_aporte': return a.ativoId ? iaxForm('aporte', { modo: 'ex', ativo: a.ativoId, valor: v, op: '1', mes: String(iaxMes()) }) : 'Escolha em qual investimento.';
    case 'mudar_meta_aporte': { const ms = S.plan.metasAporte || []; const c = { valor: v }; for (let k = 0; k < 12; k++) c['m' + k] = ms[k] == null ? '' : nf.format(ms[k]); return iaxForm('meta', c); }
    case 'mudar_limite': return iaxForm('limite', { valor: v }, a.categoria ? { area: a.categoria } : {});
    case 'abrir_tela': iaxIr(a.tela); return '';
    default: return 'Ação desconhecida.';
  }
}
function iaxIr(tela) {
  const x = IAX_TELAS[tela]; if (!x) return; S.notifOpen = false;
  if (modoBasico()) { basGuiaIr(x[1], x[2])(); return; }
  if (typeof closeAdmin === 'function') closeAdmin(); S.view = navItems().some((n) => n[0] === x[3]) ? x[3] : 'geral'; render();
}
// Editar: abre o formulário de sempre já preenchido com o que a IA entendeu
function iaxEditar(a) {
  const v = nf.format(a.valor); const abre = (t, o, campos) => { basAbrir(t, o || {}); iaxPreenche(t, campos); };
  switch (a.tipo) {
    case 'anotar_gasto': return abre('gasto', {}, { valor: v, desc: a.descricao, data: a.dia, area: a.categoria });
    case 'anotar_entrada': return abre('entrada', {}, { valor: v, nome: a.fonte });
    case 'anotar_aporte': return abre('aporte', a.ativoId ? { ativo: a.ativoId } : {}, { valor: v, nome: a.ativoId ? '' : a.ativo });
    case 'mudar_meta_aporte': return abre('meta', {}, { valor: v });
    case 'mudar_limite': return abre('limite', a.categoria ? { area: a.categoria } : {}, { valor: v });
    default: return undefined;
  }
}
function iaxPreenche(t, campos, n) {
  const f = document.querySelector(`.bas-form[data-t="${t}"]`); if (!f) { if ((n || 0) < 60) requestAnimationFrame(() => iaxPreenche(t, campos, (n || 0) + 1)); return; }
  Object.keys(campos).forEach((k) => { const val = campos[k]; const el = f.elements[k]; if (!el || val == null || val === '') return;
    if (el.length && el[0] && el[0].type === 'radio') { const r = [...el].find((x) => x.value === val);
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } else if (k === 'area' && f.elements.areaNova) { const nv = [...el].find((x) => x.value === ''); if (nv) nv.checked = true; f.elements.areaNova.value = val; } }
    else { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); } });
}
function iaxAcao(act, ds) {
  if (!['iax-ok', 'iax-ed', 'iax-no'].includes(act)) return false;
  const m = iaEstado().msgs[+ds.i]; const a = m && m.acoes && m.acoes[+ds.k]; if (!a || !['pendente', 'erro'].includes(a.estado)) return true;
  const atualiza = () => { iaRefresh(); if (typeof vozVisualRefaz === 'function') vozVisualRefaz(); };
  if (act === 'iax-no') { a.estado = 'cancelado'; atualiza(); return true; }
  if (act === 'iax-ed') { a.estado = 'editando'; atualiza(); iaxEditar(a); return true; }
  // o estado muda antes de gravar: a gravação redesenha a tela e o cartão já sai como "Feito"
  a.estado = 'feito'; delete a.erro; const err = iaxGravar(a);
  if (err) { a.estado = 'erro'; a.erro = err; } else if (typeof basVibra === 'function') basVibra(12);
  atualiza(); return true;
}

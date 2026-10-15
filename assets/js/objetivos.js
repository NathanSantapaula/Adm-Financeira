/* Múltiplos objetivos: catálogo (ícone e cor por tipo), tela "Meus objetivos" no painel e card multi-metas da Visão geral.
   Dados em S.profile.objetivos = [{ id, tipo, nome, valor, ano, pct }] (perfil: Supabase ou navegador).
   pct = fatia do patrimônio e do aporte mensal reservada para o objetivo. Cálculos em E.analiseObjetivos / E.sugerirDivisao. */
'use strict';

const OBJ_ICONES = {
  independencia: ic('<circle cx="12" cy="12" r="3.6"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'),
  aposentadoria: ic('<path d="M3.5 12a8.5 8.5 0 0 1 17 0z"/><path d="M12 12v6.5a2 2 0 0 1-4 0"/>'),
  imovel: ic('<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-5h4v5"/>'),
  carro: ic('<path d="M4.5 15v-3.2L7 6.5h10l2.5 5.3V15"/><rect x="3" y="11.5" width="18" height="5" rx="1.6"/><path d="M6.5 16.5v2M17.5 16.5v2"/>'),
  viagem: ic('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.7 2.6 14.3 0 17M12 3.5c-2.6 2.7-2.6 14.3 0 17"/>'),
  filhos: ic('<circle cx="9" cy="7.5" r="2.8"/><circle cx="16.5" cy="10" r="2.2"/><path d="M4 19.5c.5-3.4 2.4-5.2 5-5.2s4.5 1.8 5 5.2M13.6 19.5c.3-2.3 1.4-3.7 2.9-3.7s2.6 1.4 2.9 3.7"/>'),
  educacao: ic('<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.6c1.5 1.4 3.4 2.1 5.5 2.1s4-.7 5.5-2.1V11M21.5 9v5"/>'),
  reserva: ic('<path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  casamento: ic('<circle cx="9" cy="14.5" r="5"/><circle cx="15" cy="14.5" r="5"/><path d="m10 5.5 2-2.2 2 2.2"/>'),
  negocio: ic('<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/>'),
  outro: ic('<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>'),
};
const OBJ_CORES = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
// prazo sugerido ao criar cada tipo (anos a partir de hoje)
const OBJ_PRAZO = { independencia: 20, aposentadoria: 25, imovel: 8, carro: 3, viagem: 2, filhos: 15, educacao: 10, reserva: 1, casamento: 3, negocio: 5, outro: 5 };
const OBJ_STATUS = {
  concluido: ['Concluído', 'pos'], 'no-prazo': ['No prazo', 'pos'], atrasado: ['Atrasado', 'warn'], fora: ['Fora de alcance', 'neg'],
  'sem-prazo': ['Sem prazo', 'info'], 'sem-divisao': ['Sem fatia', 'warn'], 'sem-valor': ['Defina o valor', 'info'],
};
const objNomeDe = (g) => g.nome || objNome(g.tipo);
const objCor = (i) => OBJ_CORES[i % OBJ_CORES.length];
const objIcone = (g, i) => `<span class="obj-ic" style="--cor:${objCor(i)}" aria-hidden="true">${OBJ_ICONES[g.tipo] || OBJ_ICONES.outro}</span>`;
const mesAno = (p) => (p ? MES[p.mes].toLowerCase() + '/' + p.ano : '');

/* ---------- dados ---------- */
function objLista() { const p = S.profile; if (!Array.isArray(p.objetivos)) p.objetivos = E.normObjetivos(p, uid); return p.objetivos; }
function objBase() {
  const C = S.C; const ma = +(S.plan && S.plan.settings.metaAporte) || 0;
  const aporte = ma || (C && C.T.aportes > 0 ? C.T.aportes / Math.max(1, S.year === NOW_Y ? NOW_M + 1 : 12) : 0);
  return { patrimonio: C ? C.patrimonio[11] : (+S.profile.patrimonioInicial || 0), aporte, retorno: +S.profile.retornoAnual || 10, hoje: new Date() };
}
function objAnalise() { return E.analiseObjetivos(Object.assign({ objetivos: objLista() }, objBase())); }
function objFoco(A) {
  const itens = (A || objAnalise()).itens; if (!itens.length) return null;
  return itens.find((g) => g.id === S.profile.objetivoFoco) || itens[0];
}
// grava: normaliza, mantém o campo antigo "objetivo" (o principal) para compatibilidade e agenda o salvamento
function objSalvar() {
  const p = S.profile; p.objetivos = E.normObjetivos({ objetivos: p.objetivos }, uid);
  const pr = p.objetivos.find((g) => g.id === p.objetivoFoco) || p.objetivos[0];
  p.objetivo = pr ? { tipo: pr.tipo, valor: pr.valor, ano: pr.ano } : { tipo: 'independencia', valor: 0, ano: null };
  touch('profile');
}
// frase de situação de um objetivo já analisado
function objFrase(g) {
  switch (g.status) {
    case 'concluido': return `Você já tem ${brl0(g.saldo)} reservados: o valor está coberto.`;
    case 'no-prazo': return `Previsto para ${mesAno(g.previsto)}${g.folga >= 12 ? `, ${duracao(g.folga)} antes do prazo` : ''}.`;
    case 'atrasado': return `No ritmo atual chega em ${mesAno(g.previsto)}, ${duracao(g.atraso)} depois do prazo. Para chegar em ${g.ano}: ${brl0(g.necessario)} por mês (hoje ${brl0(g.aporte)}).`;
    case 'fora': return `Com a fatia atual, não chega ao valor. Para ${g.ano || 'o prazo'}: ${g.necessario != null ? brl0(g.necessario) + ' por mês' : 'aumente a fatia ou o aporte'}.`;
    case 'sem-prazo': return `Previsto para ${mesAno(g.previsto)}. Defina um ano limite para acompanhar o prazo.`;
    case 'sem-divisao': return 'Ainda não recebe parte do patrimônio nem do aporte. Ajuste a fatia.';
    default: return 'Defina o valor para acompanhar o progresso.';
  }
}

/* ---------- Visão geral: card multi-metas ---------- */
function objCardHtml() {
  const A = objAnalise(); const g = objFoco(A);
  const gerenciar = `<button class="hist-btn" data-act="objetivos-abrir">${OBJ_ICONES.outro}<span>Meus objetivos</span></button>`;
  if (!g) return `<section class="card goal-card" id="obj-card"><div class="c-k hc-row"><span>Objetivos</span></div><div class="goal-cta"><p>Imóvel, carro, viagem, filhos, independência: cadastre seus objetivos com valor e prazo. Calculamos o progresso de cada um e liberamos o simulador “E se?”.</p><button class="btn primary" data-act="objetivo-definir">Definir meus objetivos</button></div></section>`;
  const i = A.itens.indexOf(g); const st = OBJ_STATUS[g.status] || OBJ_STATUS['sem-valor'];
  const sw = A.itens.length > 1 ? `<div class="obj-sw" role="tablist" aria-label="Escolher objetivo">${A.itens.map((x, k) => `<button role="tab" class="obj-chip" data-act="objetivo-foco" data-id="${esc(x.id)}" aria-selected="${x.id === g.id}" title="${esc(objNomeDe(x))}">${objIcone(x, k)}<span>${esc(objNomeDe(x))}</span></button>`).join('')}</div>` : '';
  const resumo = A.itens.length > 1 ? `<p class="obj-resumo">${A.itens.length} objetivos · ${A.noPrazo} no prazo${A.atrasados ? ` · ${A.atrasados} ${A.atrasados === 1 ? 'pede' : 'pedem'} atenção` : ''}${A.livre > 0 ? ` · ${A.livre}% sem destino` : ''}</p>` : '';
  return `<section class="card goal-card multi" id="obj-card"><div class="c-k hc-row"><span>Objetivos</span>${gerenciar}</div>${sw}
    <div class="obj-foco"><div class="goal-ring">${ring(g.progresso, { size: 124, stroke: 11, color: objCor(i), label: pct(g.progresso), sub: 'do objetivo', aria: `Progresso de ${objNomeDe(g)}` })}</div>
      <div class="obj-foco-t"><b>${esc(objNomeDe(g))}</b><span class="obj-st ${st[1]}">${st[0]}</span><small>${brl0(g.saldo)} de ${brl0(g.valor)}${g.ano ? ' até ' + g.ano : ''}${A.itens.length > 1 ? ` · fatia de ${g.pct}%` : ''}</small></div></div>
    <p class="obj-frase">${esc(objFrase(g))}</p>
    ${g.status !== 'concluido' && g.valor > 0 && g.pct > 0 ? '<button class="lnk strong sim-link" data-act="sim-ir">E se eu aportar mais? Simular</button>' : ''}${resumo}
    <p class="cap">Patrimônio a custo dividido pelas fatias de cada objetivo; retorno hipotético de ${fmtTaxa(+S.profile.retornoAnual || 10)} ao ano, sem promessa de resultado.</p></section>`;
}
// troca de objetivo em foco sem redesenhar a página: só o card e o simulador
function objTrocarFoco(id) {
  S.profile.objetivoFoco = id; touch('profile'); S.sim = null;
  const c = document.getElementById('obj-card'); if (c) c.outerHTML = objCardHtml();
  if (S.simAberto) popSync(); // simulador aberto na janela (dashboard.js): passa a mostrar o novo objetivo
  const b = document.querySelector(`.obj-chip[data-id="${CSS.escape(id)}"]`); if (b) b.focus();
}

/* ---------- Painel: tela "Meus objetivos" ---------- */
function objetivosResumoTxt() {
  const L = objLista(); if (!L.length) return 'Nenhum objetivo cadastrado';
  const A = objAnalise(); return `${L.length} ${L.length === 1 ? 'objetivo' : 'objetivos'} · ${A.noPrazo} no prazo${A.atrasados ? ` · ${A.atrasados} com atenção` : ''}`;
}
function objetivosLinkHtml() {
  const L = objLista();
  const icones = L.slice(0, 4).map((g, i) => objIcone(g, i)).join('') || objIcone({ tipo: 'outro' }, 0);
  return `<button class="pf-card obj-link" data-act="objetivos-abrir"><span class="obj-stack">${icones}</span><span class="pf-t"><b>Meus objetivos</b><small>${esc(objetivosResumoTxt())}</small></span><span class="pf-go">Abrir${I.chev}</span></button>`;
}
function objTiposHtml(acao) {
  return `<div class="obj-tipos">${E.OBJ_TIPOS.map(([t, n], i) => `<button type="button" class="obj-tipo" data-act="${acao}" data-tipo="${t}">${objIcone({ tipo: t }, i)}<span>${esc(n)}</span></button>`).join('')}</div>`;
}
function objetivosHtml() {
  const L = objLista(); const A = objAnalise(); const B = objBase();
  if (!L.length) return `<section class="dr-sec"><h3>Qual é o seu primeiro objetivo?</h3><p class="mmsg">Escolha um tipo. Depois você define valor, prazo e quanto do patrimônio vai para ele, e pode cadastrar quantos objetivos quiser.</p>${objTiposHtml('objetivo-novo')}</section>`;
  const barra = `<div class="obj-div" role="img" aria-label="Divisão do patrimônio entre os objetivos">${A.itens.map((g, i) => (g.pct > 0 ? `<i style="width:${g.pct}%;background:${objCor(i)}" title="${esc(objNomeDe(g))}: ${g.pct}%"></i>` : '')).join('')}${A.livre > 0 ? `<i class="livre" style="width:${A.livre}%" title="Sem destino: ${A.livre}%"></i>` : ''}</div>`;
  const leg = `<ul class="leg obj-leg">${A.itens.map((g, i) => `<li><i style="background:${objCor(i)}"></i>${esc(objNomeDe(g))} ${g.pct}%</li>`).join('')}${A.livre > 0 ? `<li><i class="livre"></i>Sem destino ${A.livre}%</li>` : ''}</ul>`;
  const card = (g, i) => { const st = OBJ_STATUS[g.status] || OBJ_STATUS['sem-valor'];
    return `<li class="obj-card" data-id="${esc(g.id)}">
      <div class="obj-card-h">${objIcone(g, i)}<input class="obj-nome" data-objf="nome" data-id="${esc(g.id)}" value="${esc(g.nome)}" placeholder="${esc(objNome(g.tipo))}" aria-label="Nome do objetivo" maxlength="60"><span class="obj-st ${st[1]}">${st[0]}</span>
        <div class="obj-acts"><button class="icon-btn sm" data-act="objetivo-mover" data-id="${esc(g.id)}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${I.up}</button><button class="icon-btn sm" data-act="objetivo-mover" data-id="${esc(g.id)}" data-d="1" ${i === L.length - 1 ? 'disabled' : ''} aria-label="Descer">${I.down}</button><button class="icon-btn sm danger" data-act="objetivo-del" data-id="${esc(g.id)}" aria-label="Excluir ${esc(objNomeDe(g))}">${I.x}</button></div></div>
      <div class="obj-campos"><label class="fld"><span>Tipo</span>${sel('t-' + g.id, E.OBJ_TIPOS, g.tipo).replace('<select', `<select data-objf="tipo" data-id="${esc(g.id)}"`)}</label>
        <label class="fld"><span>Valor alvo (R$)</span><input data-objf="valor" data-id="${esc(g.id)}" inputmode="decimal" value="${g.valor ? (oculto() ? '' : nf.format(g.valor)) : ''}" placeholder="${oculto() ? 'Valor oculto' : 'Ex.: 300.000,00'}"></label>
        <label class="fld"><span>Ano limite</span><input data-objf="ano" data-id="${esc(g.id)}" inputmode="numeric" maxlength="4" value="${g.ano || ''}" placeholder="${NOW_Y + (OBJ_PRAZO[g.tipo] || 5)}"></label>
        <label class="fld"><span>Fatia (%)</span><input data-objf="pct" data-id="${esc(g.id)}" inputmode="numeric" maxlength="3" value="${g.pct}"></label></div>
      <div class="obj-prog"><span class="kbar" style="--cor:${objCor(i)}"><i style="width:${(g.progresso * 100).toFixed(1)}%"></i></span><small>${pct(g.progresso)} · ${brl0(g.saldo)} de ${brl0(g.valor)}</small></div>
      <p class="obj-frase">${esc(objFrase(g))}</p></li>`; };
  return `<section class="dr-sec obj-topo"><p class="mmsg">A fatia de cada objetivo divide o seu patrimônio (${brl0(B.patrimonio)}) e o aporte mensal (${brl0(B.aporte)}) entre as metas. A soma vai até 100%.</p>${barra}${leg}
      <div class="btn-row"><button class="btn sm" data-act="objetivo-dividir">Dividir pelo prazo</button>${A.livre > 0 && L.length ? `<button class="btn sm" data-act="objetivo-completar">Dar os ${A.livre}% livres ao 1º objetivo</button>` : ''}</div></section>
    <section class="dr-sec"><ul class="obj-lista">${A.itens.map(card).join('')}</ul></section>
    <section class="dr-sec"><h3>Adicionar objetivo</h3>${objTiposHtml('objetivo-novo')}</section>
    <p class="cap obj-nota">Patrimônio a custo e retorno hipotético de ${fmtTaxa(B.retorno)} ao ano (altere em Painel › Metas e ponto de partida). Não é promessa de rentabilidade.</p>`;
}

/* ---------- ações ---------- */
function objNovo(tipo) {
  const L = objLista(); if (L.length >= 12) { toast('Limite de 12 objetivos.'); return; }
  const livre = Math.max(0, 100 - L.reduce((s, g) => s + (+g.pct || 0), 0));
  const g = { id: uid(), tipo, nome: '', valor: 0, ano: NOW_Y + (OBJ_PRAZO[tipo] || 5), pct: livre };
  L.push(g); if (!S.profile.objetivoFoco) S.profile.objetivoFoco = g.id; objSalvar(); S.adminPage = 'objetivos'; renderAdmin(); renderLater();
  setTimeout(() => { const f = document.querySelector(`#admin [data-objf="valor"][data-id="${g.id}"]`); if (f) { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.focus(); } }, 60);
}
function objAcao(act, ds) {
  const L = () => objLista();
  switch (act) {
    case 'objetivos-abrir': case 'objetivo-definir': {
      S.maisOpen = false; if (!S.adminOpen) openAdmin('objetivos'); else { S.adminPage = 'objetivos'; renderAdmin(true); }
      setTimeout(() => { const f = document.querySelector('#admin [data-objf="valor"]') || document.querySelector('#admin .obj-tipo'); if (f && act === 'objetivo-definir') f.focus(); }, 80);
      return true;
    }
    case 'objetivos-voltar': S.adminPage = 'inicio'; renderAdmin(true); return true;
    case 'objetivo-novo': objNovo(ds.tipo); return true;
    case 'objetivo-foco': objTrocarFoco(ds.id); return true;
    case 'objetivo-mover': {
      const l = L(); const i = l.findIndex((g) => g.id === ds.id); const j = i + (+ds.d); if (i < 0 || j < 0 || j >= l.length) return true;
      [l[i], l[j]] = [l[j], l[i]]; objSalvar(); renderAdmin(); renderLater(); return true;
    }
    case 'objetivo-del': {
      const l = L(); const i = l.findIndex((g) => g.id === ds.id); if (i < 0) return true; const g = l[i]; const foco = S.profile.objetivoFoco;
      l.splice(i, 1); if (foco === g.id) S.profile.objetivoFoco = l[0] ? l[0].id : null; objSalvar(); renderAdmin(); renderLater();
      toastAcao(`Objetivo "${objNomeDe(g)}" excluído.`, 'Desfazer', () => { objLista().splice(i, 0, g); S.profile.objetivoFoco = foco; objSalvar(); if (S.adminOpen) renderAdmin(); render(); });
      return true;
    }
    case 'objetivo-dividir': {
      const l = L(); const antes = l.map((g) => g.pct); const sug = E.sugerirDivisao(Object.assign({ objetivos: l }, objBase()));
      l.forEach((g) => { g.pct = sug[g.id] || 0; }); objSalvar(); renderAdmin(); renderLater();
      toastAcao('Fatias divididas pelo esforço mensal de cada objetivo até o prazo.', 'Desfazer', () => { objLista().forEach((g, k) => { g.pct = antes[k]; }); objSalvar(); if (S.adminOpen) renderAdmin(); render(); });
      return true;
    }
    case 'objetivo-completar': { const l = L(); const livre = 100 - l.reduce((s, g) => s + g.pct, 0); if (l[0] && livre > 0) { l[0].pct += livre; objSalvar(); renderAdmin(); renderLater(); } return true; }
    default: return false;
  }
}
// edição dos campos da tela (evento change)
function objCampo(t) {
  const g = objLista().find((x) => x.id === t.dataset.id); if (!g) return;
  const k = t.dataset.objf;
  if (k === 'nome') g.nome = t.value.trim().slice(0, 60);
  else if (k === 'tipo') g.tipo = t.value;
  else if (k === 'valor') { if (oculto() && !t.value.trim()) return; const v = t.value.trim() === '' ? 0 : parseReais(t.value); if (Number.isNaN(v) || v < 0) { toast('Valor inválido. Use números como 250.000,00.'); t.value = g.valor ? nf.format(g.valor) : ''; return; } g.valor = v; }
  else if (k === 'ano') { const a = parseInt(t.value, 10); if (t.value.trim() === '') g.ano = null; else if (!anoValido(a)) { toast('Informe um ano entre 1990 e 2100.'); t.value = g.ano || ''; return; } else g.ano = a; }
  else if (k === 'pct') {
    let v = parseInt(String(t.value).replace(/\D/g, ''), 10); if (!Number.isFinite(v) || v < 0) v = 0;
    const outros = objLista().filter((x) => x !== g).reduce((s, x) => s + x.pct, 0); const max = Math.max(0, 100 - outros);
    if (v > max) { toast(`A soma das fatias vai até 100%. Este objetivo ficou com ${max}%.`); v = max; }
    g.pct = Math.min(100, v);
  }
  objSalvar(); renderLater();
  // redesenha a tela depois que o foco já passou para o próximo campo, e devolve o foco a ele
  setTimeout(() => {
    const at = document.activeElement; const sel = at && at.dataset && at.dataset.objf ? `[data-objf="${at.dataset.objf}"][data-id="${at.dataset.id}"]` : null;
    renderAdmin(); if (sel) { const n = document.querySelector('#admin ' + sel); if (n) n.focus(); }
  }, 0);
}

/* ---------- consultor: resumo dos objetivos de um cliente ---------- */
function objResumoCliente(d) {
  const L = E.normObjetivos(d || {}); if (!L.length) return '–';
  return L.length === 1 ? objNomeDe(L[0]) : `${objNomeDe(L[0])} +${L.length - 1}`;
}

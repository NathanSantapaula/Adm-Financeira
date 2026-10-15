/* Página inicial: página de produto em vidro e gradiente, feita para converter.
   Ordem (cada seção responde à próxima dúvida do visitante): o que é (herói com o painel vivo), quem está por trás
   (trajetória), o que faz (recursos), o que faz por mim (simulador do aporte), quem me acompanha (assessor),
   quem já usa (depoimentos reais, só quando existirem em CFG.depoimentos), quanto custa (planos), dúvidas e chamada final.
   As prévias são fragmentos do próprio painel com valores ilustrativos; o simulador usa E.rebalance, o mesmo cálculo da Carteira. */
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
const lpEstado = () => (S.lp = S.lp || { aporte: 5000, perfil: 'moderado', hoje: 'rf', ok: false, nome: '', tela: 'geral' });
const lpPct = (x) => Math.round(x * 100) + '%';
// empresas da trajetória do assessor (CFG.empresas); sem logo informado, o nome aparece em tipografia limpa
const lpEmpresas = () => (Array.isArray(CFG.empresas) ? CFG.empresas.filter((e) => e && e.nome) : []);
// logos desenhados no HTML: as letras na cor do texto (currentColor) e o destaque na cor da marca, que segue o tema.
// XP Inc.: mesmo desenho e mesma ordem do arquivo original (Wikimedia Commons, domínio público), só as cores trocadas.
const LP_SVG = {
  xp: '<svg viewBox="1.5 1.5 98.6 20.6" aria-hidden="true"><path fill="currentColor" d="M59.927 21.783h-5.126V6.639h5.126v15.144zm16.583 0h-5.164v-8.595c0-1.963-.654-2.48-1.708-2.48-1.054 0-1.735.517-1.735 2.423v8.652h-5.126V6.639h5.126V7.65a5.661 5.661 0 013.757-1.326c3.274 0 4.841 2.218 4.841 6.2l.01 9.259zm15.094-3.287c-1.738 2.597-3.361 3.605-6.01 3.605-4.385 0-7.004-2.828-7.004-7.932 0-4.645 2.334-7.845 7.12-7.845 2.818 0 4.441 1.326 5.75 3.459l-3.523 2.712c-.71-1.327-1.194-1.96-2.304-1.96-1.31 0-1.964 1.326-1.964 3.72s.71 3.635 2.105 3.635c.969 0 1.653-.547 2.592-1.963l3.238 2.57zm8.146.289a3.339 3.339 0 01-.993 2.282 3.254 3.254 0 01-2.282.938c-.851 0-1.67-.337-2.281-.938a3.339 3.339 0 01-.993-2.282c0-1.907 1.394-3.272 3.273-3.272 1.879 0 3.276 1.365 3.276 3.272z"/><path class="hp-logo-acc" d="M29.91 1.5c4.696 0 7.805 1.826 7.805 6.724 0 5.157-3.373 6.983-8.179 6.983h-2.774v6.576H51.39L62.948 1.5H29.909z"/><path fill="currentColor" d="M29.539 15.207c4.803 0 8.179-1.826 8.179-6.983 0-4.898-3.118-6.724-7.81-6.724h-8.607v20.283h5.464v-6.576h2.774zM26.765 6.08h3.003c1.761 0 2.43.892 2.43 2.23 0 1.535-.716 2.317-2.518 2.317h-2.915V6.08zm-7.339 15.703L13.528 11.43l5.66-9.927h-6.13l-2.595 4.55-2.595-4.55h-5.89l5.54 9.716L1.5 21.783h6.127l2.956-5.184 2.954 5.184h5.889z"/></svg>',
};
// logo numa cor só: o arquivo vira máscara e a cor vem do texto (currentColor); "caixa" corta a margem vazia do arquivo
function lpLogo(e) {
  if (e.svg && LP_SVG[e.svg]) return `<span class="hp-logo-svg" role="img" aria-label="${esc(e.nome)}"${+e.altura > 0 ? ` style="height:${+e.altura}px"` : ''}>${LP_SVG[e.svg]}</span>`;
  if (!e.logo) return `<span class="hp-emp-n">${esc(e.nome)}</span>`;
  // imagem (PNG): <img> é reduzida com boa qualidade no computador (a máscara serrilha); o filtro deixa o desenho na cor do texto (branco)
  if (/\.(png|jpe?g|webp)$/i.test(e.logo)) {
    const k = Array.isArray(e.caixa) && e.caixa.length === 6 ? e.caixa : null;
    const im = k ? `width:${((k[4] / k[2]) * 100).toFixed(3)}%;left:${((-k[0] / k[2]) * 100).toFixed(3)}%;top:${((-k[1] / k[3]) * 100).toFixed(3)}%` : 'width:100%;left:0;top:0';
    return `<span class="hp-logo-img" role="img" aria-label="${esc(e.nome)}" style="aspect-ratio:${k ? `${k[2]} / ${k[3]}` : '4 / 1'}${+e.altura > 0 ? `;height:${+e.altura}px` : ''}"><img src="${esc(e.logo)}" alt="" loading="lazy" decoding="async" style="${im}"></span>`;
  }
  const u = `url('${String(e.logo).replace(/['()\\\s]/g, '')}')`; const k = Array.isArray(e.caixa) && e.caixa.length === 6 ? e.caixa : null;
  const pos = k ? `;-webkit-mask-size:${((k[4] / k[2]) * 100).toFixed(2)}% ${((k[5] / k[3]) * 100).toFixed(2)}%;mask-size:${((k[4] / k[2]) * 100).toFixed(2)}% ${((k[5] / k[3]) * 100).toFixed(2)}%;-webkit-mask-position:${k[4] > k[2] ? ((k[0] / (k[4] - k[2])) * 100).toFixed(2) : 50}% ${k[5] > k[3] ? ((k[1] / (k[5] - k[3])) * 100).toFixed(2) : 50}%;mask-position:${k[4] > k[2] ? ((k[0] / (k[4] - k[2])) * 100).toFixed(2) : 50}% ${k[5] > k[3] ? ((k[1] / (k[5] - k[3])) * 100).toFixed(2) : 50}%` : '';
  const p = Math.min(1.5, +e.peso || 0); // traço fino: sombras sem desfoque da mesma cor engrossam o desenho já recortado
  const peso = p > 0 ? ` style="display:block;filter:drop-shadow(${p}px 0 0 currentColor) drop-shadow(-${p}px 0 0 currentColor) drop-shadow(0 ${(p * 0.7).toFixed(2)}px 0 currentColor)"` : '';
  return `${peso ? `<span${peso}>` : ''}<span class="hp-logo" role="img" aria-label="${esc(e.nome)}" style="-webkit-mask-image:${u};mask-image:${u};aspect-ratio:${k ? `${k[2]} / ${k[3]}` : '4 / 1'}${+e.altura > 0 ? `;height:${+e.altura}px` : ''}${e.recorte ? `;clip-path:${String(e.recorte).replace(/[^a-z0-9%.,() -]/gi, '')}` : ''}${pos}"></span>${peso ? '</span>' : ''}`;
}
const lpIniciais = (n) => String(n || '').trim().split(/\s+/).filter(Boolean).map((p) => p[0]).filter((c, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase();
const lpListaNomes = (l) => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' e ' + l[l.length - 1]);

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

// projeção ilustrativa da seção "Seu futuro": mesmos números do gráfico (R$ 180 mil, R$ 4.500 por mês, 10% ao ano, 10 anos)
const lpProj = () => E.projetar(180000, 4500, 10, 120);
const lpProjAno = () => { const p = lpProj(); const i = p.findIndex((v) => v >= 1000000); return i < 0 ? NOW_Y + 10 : NOW_Y + Math.floor(i / 12) + 1; };

/* objetivo da prévia: o visitante escolhe qual (os mesmos tipos do app, E.OBJ_TIPOS); valores ilustrativos por tipo:
   [meta em reais, progresso de 0 a 1, anos até a previsão] */
const LP_OBJ = { independencia: [2400000, 0.62, 12], aposentadoria: [1800000, 0.48, 15], imovel: [180000, 0.71, 2], carro: [95000, 0.85, 1], viagem: [28000, 0.9, 1],
  filhos: [320000, 0.34, 8], educacao: [120000, 0.55, 4], reserva: [36000, 0.92, 0], casamento: [70000, 0.66, 2], negocio: [250000, 0.4, 5] };
const lpObj = () => { const t = LP_OBJ[lpEstado().obj] ? lpEstado().obj : 'independencia'; const [meta, pct, anos] = LP_OBJ[t]; return { t, meta, pct, anos }; };
const lpObjIc = (t) => (typeof OBJ_ICONES !== 'undefined' && OBJ_ICONES[t]) || '';
function lpObjSel() {
  const { t } = lpObj();
  return `<label class="hp-obj-sel"><span class="hp-obj-ic" id="hp-obj-ic" aria-hidden="true">${lpObjIc(t)}</span>
    <select data-lp="obj" aria-label="Escolha o objetivo da simulação">${E.OBJ_TIPOS.filter(([k]) => LP_OBJ[k]).map(([k, n]) => `<option value="${k}"${k === t ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <i aria-hidden="true">${I.chev}</i></label>`;
}
// troca o objetivo sem redesenhar a página: anel, ano e meta
function lpObjAtualiza() {
  const o = lpObj(); const r = $('#hp-ring'); if (r) r.innerHTML = ring(o.pct, { size: 104, stroke: 10, label: Math.round(o.pct * 100) + '%', aria: `${Math.round(o.pct * 100)}% do objetivo` });
  const a = $('#hp-obj-ano'); if (a) a.textContent = NOW_Y + o.anos; const m = $('#hp-obj-meta'); if (m) m.textContent = 'Meta de ' + brl0(o.meta);
  const ic = $('#hp-obj-ic'); if (ic) ic.innerHTML = lpObjIc(o.t);
}

/* herói: janela do painel com três telas (Visão geral, Carteira, Gastos) e cartões de vidro flutuando em volta */
function lpPainelHtml() {
  const st = lpEstado(); const mes = MES_LONGO[NOW_M].toLowerCase();
  const abas = [['geral', 'Visão geral'], ['carteira', 'Carteira'], ['gastos', 'Gastos']];
  const tela = (id, html) => `<div class="hp-scr${st.tela === id ? ' on' : ''}" id="hp-scr-${id}" role="tabpanel" aria-labelledby="hp-tab-${id}"${st.tela === id ? '' : ' aria-hidden="true"'}>${html}</div>`;
  const geral = `<div class="hp-kpis">
      <div class="hp-kpi hp-kpi-p"><small>Patrimônio estimado</small><b class="hp-num" data-conta="487320">R$ 487.320</b><span class="hp-delta"><i aria-hidden="true"></i>R$ 74.900 no ano</span></div>
      <div class="hp-kpi"><small>Aportado em ${NOW_Y}</small><b>R$ 36.000</b><span class="hp-kbar" aria-hidden="true"><i style="width:83%"></i></span><em>83% da meta do ano</em></div>
      <div class="hp-kpi"><small>Sobrou para investir</small><b>32%</b><em>da renda de ${mes}</em></div></div>
    <div class="hp-scr-g"><div class="hp-tile"><small>Evolução do patrimônio</small><div class="chart" id="hp-line"></div></div>
      <div class="hp-tile hp-t-ring">${lpObjSel()}<div class="hp-ring-w"><div id="hp-ring"></div><span><b id="hp-obj-ano">${NOW_Y + lpObj().anos}</b><em id="hp-obj-meta">Meta de ${brl0(lpObj().meta)}</em>previsão no ritmo atual</span></div></div></div>`;
  const carteira = `<div class="hp-scr-g c2"><div class="hp-tile"><small>Composição da carteira</small><div class="donut" id="hp-donut"></div>
        <ul class="hp-leg"><li><i style="background:var(--c1)"></i>Renda fixa<b>54%</b></li><li><i style="background:var(--c2)"></i>Ações<b>28%</b></li><li><i style="background:var(--c3)"></i>Imobiliário<b>18%</b></li></ul></div>
      <div class="hp-tile"><small>Onde investir R$ 3.000 em ${mes}</small><ol class="hp-onde-mini">
        <li><span>Tesouro IPCA+<small>3,8 p.p. abaixo do alvo</small></span><b>R$ 1.800</b></li>
        <li><span>Fundo imobiliário<small>1,9 p.p. abaixo do alvo</small></span><b>R$ 800</b></li>
        <li><span>CDB pós-fixado<small>0,6 p.p. abaixo do alvo</small></span><b>R$ 400</b></li></ol>
        <span class="hp-ok-pill">Sem vender nada</span></div></div>`;
  const gastos = `<div class="hp-scr-g c2"><div class="hp-tile"><small>Orçamento de ${mes}</small><b class="hp-num sm">R$ 4.680 <em>de R$ 6.000</em></b><div class="hp-bar"><i style="width:78%"></i></div><span class="hp-pos">Restam R$ 1.320 para o mês</span></div>
      <div class="hp-tile"><small>Para onde foi</small><ul class="hp-cats sm">${[['Moradia', 100, 2200], ['Alimentação', 52, 1150], ['Transporte', 28, 620], ['Lazer', 20, 430]].map((c) => `<li><span>${c[0]}</span><span class="hp-cat-t"><i style="width:${c[1]}%"></i></span><b>${brl(c[2])}</b></li>`).join('')}</ul></div></div>`;
  return `<div class="hp-stage hp-in" id="hp-stage">
      <div class="hp-device" id="hp-device" aria-label="Prévia ilustrativa do painel">
        <div class="hp-device-bar"><span class="hp-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <div class="hp-tabs" role="tablist" aria-label="Telas do painel">${abas.map(([id, n]) => `<button type="button" role="tab" id="hp-tab-${id}" aria-controls="hp-scr-${id}" aria-selected="${st.tela === id}" data-act="lp-tela" data-v="${id}">${n}</button>`).join('')}</div></div>
        <div class="hp-scrs">${tela('geral', geral)}${tela('carteira', carteira)}${tela('gastos', gastos)}</div>
      </div>
      <div class="hp-float f1" aria-hidden="true"><span class="hp-fi ok"></span><span><b>Aporte de ${mes} registrado</b><small>R$ 3.000 · meta do mês batida</small></span></div>
      <div class="hp-float f2" aria-hidden="true"><span class="hp-fi doc"></span><span><b>Extrato importado</b><small>42 lançamentos categorizados</small></span></div>
      <div class="hp-float f3" aria-hidden="true"><span class="hp-fi seta"></span><span><b>Próximo aporte</b><small>Tesouro IPCA+ · R$ 1.800</small></span></div>
    </div>`;
}

/* assessor: a foto fica num quadro com o fundo original dela e o topo da cabeça sai do quadro sobre o fundo do site
   (contorno em CFG.fotoRecorte, em pixels da foto; o quadro começa em CFG.fotoCorte). Sem contorno, só o quadro. */
function lpFotoHtml() {
  if (!CFG.foto) return `<div class="hp-foto-vazia" aria-hidden="true"><span>${esc(lpIniciais(CFG.consultor))}</span></div>`;
  const [W, H] = CFG.fotoTam || [4, 5]; const rec = CFG.fotoRecorte; const ok = W > 0 && H > 0 && CFG.fotoCorte > 0 && Array.isArray(rec) && rec.length > 2;
  const topo = ok ? CFG.fotoCorte / H : 0.12; const resto = 1 - topo;
  const poly = ok ? rec.map(([x, y]) => `${((x / W) * 100).toFixed(2)}% ${((y / H) * 100).toFixed(2)}%`).join(', ') : '';
  const img = (st, cls) => `<img class="${cls}" src="${esc(CFG.foto)}" alt="" loading="lazy" decoding="async" width="${W}" height="${H}" style="${st}">`;
  return `<div class="hp-foto-comp" style="aspect-ratio:${W} / ${H};--topo:${(topo * 100).toFixed(3)}%" role="img" aria-label="Foto de ${esc(CFG.consultor)}">
      <span class="hp-foto-luz" aria-hidden="true"></span>
      <div class="hp-foto-quadro">${img(`height:${(100 / resto).toFixed(3)}%;top:${((-topo / resto) * 100).toFixed(3)}%`, 'hp-foto-q')}</div>
      ${ok ? `<div class="hp-foto-cabeca" aria-hidden="true">${img(`clip-path:polygon(${poly})`, 'hp-foto-c')}</div>` : ''}
    </div>`;
}
function lpAssessorHtml() {
  const emps = lpEmpresas(); const antes = emps.map((e) => e.nome).filter((n) => !/\bXP\b/i.test(n));
  const bio = CFG.bio || `Assessor de investimentos vinculado à XP Inc.${antes.length ? `, com passagens por ${lpListaNomes(antes)}` : ''}. Meu trabalho é um só: fazer você saber, todo mês, exatamente o que fazer com o seu dinheiro.`;
  const pilares = [['plano', 'Planejamento completo', 'Orçamento, metas e patrimônio num só lugar.'], ['alvo', 'Carteira com alvo claro', 'Cada aporte vai para onde a carteira precisa.'], ['mes', 'Ao seu lado todo mês', 'Revisão mensal e o próximo passo definido.']];
  const agenda = CFG.agendaUrl ? `<a class="hp-btn lg" href="${esc(CFG.agendaUrl)}" ${ext}>Agendar uma conversa</a>` : `<button class="hp-btn lg" data-act="contact">Falar com o ${esc(primeiroNome())}</button>`;
  const wa = waLink(baseMsg(`Vi o ${CFG.marca} e gostaria de conversar sobre assessoria.`));
  const lnk = CFG.linkedinUrl ? `<a class="hp-lnk" href="${esc(CFG.linkedinUrl)}" ${ext}>Ver trajetória no LinkedIn ${I.chev}</a>` : '';
  return `<section class="hp-sec hp-dark hp-asses" id="assessor"><div class="hp-w">
    <div class="hp-sobre-g">
      <figure class="hp-foto" data-rv>${lpFotoHtml()}
        <figcaption class="hp-foto-tag"><b>${esc(CFG.consultor)}</b><span>Assessor de investimentos · XP Inc.</span></figcaption></figure>
      <div class="hp-sobre-t" data-rv>
        <p class="hp-k">Seu assessor</p>
        <h2 class="hp-h2">Quem cuida do<br>seu planejamento.</h2>
        <p class="hp-lead">${esc(bio)}</p>
        <ul class="hp-pilares">${pilares.map(([k, t, d]) => `<li><span class="hp-pi ${k}" aria-hidden="true"></span><span><b>${t}</b><small>${d}</small></span></li>`).join('')}</ul>
        ${emps.length ? `<div class="hp-traj"><small>Trajetória</small><ul>${emps.map((e) => `<li class="hp-emp"${e.cargo || e.periodo ? ` title="${esc([e.cargo, e.periodo].filter(Boolean).join(' · '))}"` : ''}>${lpLogo(e)}</li>`).join('')}</ul></div>` : ''}
        ${(CFG.credenciais || []).length ? `<ul class="hp-creds">${CFG.credenciais.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
        <div class="hp-sobre-cta">${agenda}${wa ? `<a class="hp-btn lg vidro" href="${esc(wa)}" ${ext}>WhatsApp</a>` : ''}</div>
        ${lnk}
      </div>
    </div>
  </div></section>`;
}

/* depoimentos: carrossel centrado com foco no cartão do meio (os vizinhos recuam e esmaecem conforme a rolagem),
   bolinhas, setas, teclado, arraste com o mouse e avanço automático que pausa quando a pessoa interage.
   Só aparece com depoimentos reais (CFG.depoimentos). */
function lpDepoimentosHtml() {
  const deps = (CFG.depoimentos || []).filter((d) => d && d.texto && d.nome); if (!deps.length) return '';
  const nota = (n) => Math.max(0, Math.min(5, Math.round(+n || 0)));
  const estrelas = (n) => (n ? `<span class="hp-stars" role="img" aria-label="Nota ${n} de 5">${'<i></i>'.repeat(n)}</span>` : '');
  const notas = deps.map((d) => nota(d.nota)).filter(Boolean); const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
  const card = (d, i) => `<li class="hp-dep${i === 0 ? ' ativo' : ''}" data-i="${i}" aria-roledescription="depoimento" aria-label="${i + 1} de ${deps.length}"><figure>
      <div class="hp-dep-top">${estrelas(nota(d.nota))}${d.data ? `<time>${esc(d.data)}</time>` : ''}</div>
      <blockquote>${d.destaque ? `<p class="hp-dep-dest">${esc(d.destaque)}</p>` : ''}<p>${esc(d.texto)}</p></blockquote>
      <figcaption><span class="hp-av">${d.foto ? `<img src="${esc(d.foto)}" alt="" loading="lazy">` : esc(lpIniciais(d.nome))}</span>
        <span class="hp-dep-q"><b>${esc(d.nome)}</b>${d.descricao ? `<small>${esc(d.descricao)}</small>` : ''}</span>${d.plano ? `<em>${esc(d.plano)}</em>` : ''}</figcaption></figure></li>`;
  return `<section class="hp-sec hp-depo" id="depoimentos"><div class="hp-w">
    <div class="hp-depo-h" data-rv><div><h2 class="hp-h2">Quem já planeja<br>com o ${esc(primeiroNome())}.</h2><p class="hp-lead">Clientes que acompanham o próprio dinheiro com o ${esc(CFG.marca)} e a assessoria.</p></div>
      ${media ? `<div class="hp-media"><span class="hp-media-av" aria-hidden="true">${deps.slice(0, 5).map((d) => `<i>${d.foto ? `<img src="${esc(d.foto)}" alt="" loading="lazy">` : esc(lpIniciais(d.nome))}</i>`).join('')}</span><b>${media.toFixed(1).replace('.', ',')}</b><span>${estrelas(Math.round(media))}<small>média de ${notas.length} ${notas.length === 1 ? 'avaliação' : 'avaliações'}</small></span></div>` : ''}</div>
  </div>
  <div class="hp-car" data-rv><ul class="hp-car-t" id="hp-car" tabindex="0" aria-roledescription="carrossel" aria-label="Depoimentos de clientes. Use as setas do teclado para navegar.">${deps.map(card).join('')}</ul></div>
  <div class="hp-w hp-car-pe"><div class="hp-car-dots" role="group" aria-label="Escolher depoimento">${deps.map((_, i) => `<button type="button" data-car-i="${i}" aria-label="Depoimento ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div>
    <div class="hp-car-nav"><button type="button" class="hp-car-b prev" data-car="-1" aria-label="Depoimento anterior">${I.chev}</button><button type="button" class="hp-car-b" data-car="1" aria-label="Próximo depoimento">${I.chev}</button></div></div>
  <div class="hp-w"><p class="hp-cap">Depoimentos de clientes, publicados com autorização. Experiências individuais não garantem resultados.</p></div></section>`;
}

function landingHtml() {
  const logged = !!S.user; const nome = primeiroNome(); const st = lpEstado();
  const temDepo = (CFG.depoimentos || []).some((d) => d && d.texto && d.nome);
  // planos em ordem crescente: cada degrau sobe um pouco e ganha mais cor; a Assessoria fecha em destaque escuro
  const plano = (id, n) => { const i = infoPlano(id); const d = id === 'completo'; const txt = id !== 'gratis' && precoPlano(id) <= 0;
    const antes = d && CFG.precoRegular > precoPlano(id) ? `<s class="hp-antes"><span class="hp-sr">De </span>${esc(brl(CFG.precoRegular))}</s>` : '';
    return `<article class="hp-card hp-plano n${n + 1}${d ? ' rec hp-dark' : ''}" data-rv>${d ? `<span class="hp-selo">Com o ${esc(nome)}</span>` : ''}
      <span class="hp-nivel" role="img" aria-label="Nível ${n + 1} de 3"><i></i><i></i><i></i></span>
      <h3>${esc(nomePlano(id))}</h3><p class="hp-plano-r">${esc(i.resumo)}</p>
      <div class="hp-preco-w">${antes}<p class="hp-preco${txt ? ' txt' : ''}">${antes ? '<span class="hp-sr">por </span>' : ''}${esc(precoTxt(id))}</p></div>
      <p class="hp-plano-n">${antes ? 'Condição de lançamento.' : id === 'gratis' ? 'Grátis, sem prazo.' : '&nbsp;'}</p>
      <ul>${i.itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <button class="hp-btn${d ? ' lg' : id === 'gratis' ? ' vidro' : ''}" data-act="go-auth" data-mode="signup" data-plano="${id}"${d ? ' data-pagar="1"' : ''}>${id === 'gratis' ? 'Começar grátis' : id === 'investidor' ? (txt ? 'Quero saber mais' : 'Quero o Investidor') : 'Quero a assessoria'}</button></article>`; };
  const faq = [
    ['O que é o diagnóstico?', 'É uma etapa guiada logo após o cadastro: você informa seu patrimônio atual, responde a sete perguntas de perfil de investidor e define seus objetivos. Com isso o painel já nasce personalizado.'],
    ['Onde ficam os meus dados?', `Seus lançamentos ficam em servidor protegido por login e só você acessa. ${esc(CFG.consultor)} vê apenas seu nome, contato e o resultado do diagnóstico, a menos que você contrate a Assessoria.`],
    ['Como funciona a importação do extrato?', 'Você exporta o extrato ou a fatura em CSV ou OFX no aplicativo do banco e envia o arquivo. O sistema lê no seu aparelho, sugere a categoria de cada lançamento, ignora o que já foi importado e mostra tudo para você conferir antes de gravar.'],
    ['Como ativo a Assessoria?', `Depois do cadastro, você faz o pagamento e envia o comprovante. O ${esc(nome)} confirma e libera o plano na sua conta.`],
    ['O assessor vê os meus lançamentos?', `No Organização e no Investidor, não: o ${esc(nome)} vê nome, contato e o resultado do diagnóstico. Na Assessoria ele também acompanha o planejamento, para orientar você.`],
    ['Posso levar meus dados embora?', 'Sim. A qualquer momento você baixa um backup completo e pode restaurá-lo depois.'],
  ];
  const cta = logged ? 'Abrir meu painel' : 'Fazer meu diagnóstico gratuito';
  const links = [['produto', 'Produto'], ['simulador', 'Simulador'], ['assessor', 'O assessor']].concat(temDepo ? [['depoimentos', 'Depoimentos']] : []).concat([['planos', 'Planos'], ['duvidas', 'Dúvidas']]);

  return `<div class="hp">
  <header class="hp-nav"><div class="hp-w hp-nav-in">
    <a class="hp-marca" href="#topo" data-act="scroll" data-to="topo">${logoMarca()}</a>
    <nav class="hp-links" aria-label="Seções">${links.map(([id, n]) => `<button data-act="scroll" data-to="${id}">${n}</button>`).join('')}</nav>
    <div class="hp-nav-a">${logged ? '<button class="hp-btn sm" data-act="open-app">Abrir meu painel</button>' : '<button class="hp-btn sm ghost" data-act="go-auth" data-mode="login">Entrar</button><button class="hp-btn sm" data-act="go-auth" data-mode="signup">Fazer diagnóstico</button>'}</div>
  </div></header>

  <section class="hp-hero" id="topo"><div class="hp-w">
    <p class="hp-pill hp-in">Planejamento financeiro com assessoria de ${esc(CFG.consultor)}</p>
    <h1 class="hp-h1 hp-in">Seu patrimônio,<br><span class="hp-grad">sob controle.</span></h1>
    <p class="hp-sub hp-in">Importe o extrato, veja para onde vai cada real e saiba exatamente onde investir a cada aporte. Em minutos você descobre seu perfil e recebe um diagnóstico do seu momento financeiro.</p>
    <div class="hp-ctas hp-in"><button class="hp-btn lg" data-act="go-auth" data-mode="signup">${cta}</button><button class="hp-lnk" data-act="contact">Falar com o ${esc(nome)} ${I.chev}</button></div>
    <ul class="hp-garantias hp-in"><li>Grátis para começar</li><li>Sem cartão de crédito</li><li>Seus dados só seus</li></ul>
    ${lpPainelHtml()}
    <p class="hp-cap">Prévia ilustrativa, com valores fictícios. Toque nas abas para ver outras telas.</p>
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
    <div class="hp-feat luz" data-rv>
      <div class="hp-feat-t"><h3>Seu futuro, em números.</h3><p>Projete o patrimônio até o seu objetivo, seja aposentadoria, imóvel ou independência financeira, e veja o efeito de cada aporte no prazo.</p></div>
      <div class="hp-card hp-vis luz"><div class="hp-proj-h"><small>Projeção ilustrativa</small><span class="hp-proj-k"><b>${brl0(1000000)}</b> objetivo</span><span class="hp-proj-k"><b>${lpProjAno()}</b> previsão</span></div><div class="chart" id="hp-proj"></div></div>
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
    <div class="hp-center" data-rv><button class="hp-btn lg" data-act="go-auth" data-mode="signup">Descobrir o meu perfil</button></div>
  </div></section>

  ${lpAssessorHtml()}
  ${lpDepoimentosHtml()}

  <section class="hp-sec" id="planos"><div class="hp-w">
    <div class="hp-head" data-rv><h2 class="hp-h2">Escolha como começar.</h2><p class="hp-lead">Comece grátis e mude de plano quando quiser.</p></div>
    <div class="hp-grid3 hp-planos">${['gratis', 'investidor', 'completo'].map(plano).join('')}</div>
    <p class="hp-cap hp-planos-dica">Arraste para o lado para ver os outros planos.</p>
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
  chartLine($('#hp-line'), { height: 168, zoom: true, labels: meses, aria: 'Evolução ilustrativa do patrimônio', series: [{ color: 'var(--c1)', values: patr, area: true, w: 3 }], tip: (i) => `<b>${meses[i]}</b><br>${brl0(patr[i])}` });
  chartDonut($('#hp-donut'), { aria: 'Composição ilustrativa da carteira', title: '3 classes', sub: 'diversificada', items: [{ label: 'Renda fixa', value: 54, color: 'var(--c1)' }, { label: 'Ações', value: 28, color: 'var(--c2)' }, { label: 'Fundos imobiliários', value: 18, color: 'var(--c3)' }] });
  lpObjAtualiza();
  const proj = lpProj(); const lab = proj.map((_, i) => (i % 12 === 11 ? String(NOW_Y + Math.floor(i / 12) + 1) : ''));
  chartLine($('#hp-proj'), { height: 220, labels: lab, aria: 'Projeção ilustrativa do patrimônio até o objetivo', goal: 1000000, goalLabel: 'Objetivo: R$ 1 milhão', series: [{ color: 'var(--c1)', values: proj, area: true, w: 3 }], tip: (i) => `<b>${NOW_Y + Math.floor(i / 12)}</b><br>${brl0(proj[i])}` });
  lpHeroVivo(); lpCarrossel();
}

/* herói vivo: o número do patrimônio sobe ao abrir e a janela inclina de leve seguindo o mouse (só mouse, sem movimento reduzido) */
function lpHeroVivo() {
  const stage = $('#hp-stage'); const dev = $('#hp-device'); if (!stage || !dev || stage.dataset.vivo) return; stage.dataset.vivo = '1';
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const num = stage.querySelector('[data-conta]');
  if (num && !calmo && !S.lpContou) {
    S.lpContou = true; const alvo = +num.dataset.conta; const final = num.textContent; const t0 = performance.now(); const dur = 1400;
    const passo = (t) => { const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 4); num.textContent = k < 1 ? brl0(alvo * (0.82 + 0.18 * e)) : final; if (k < 1) requestAnimationFrame(passo); };
    setTimeout(() => requestAnimationFrame(passo), 380);
  }
  if (calmo || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const floats = [...stage.querySelectorAll('.hp-float')]; let raf = 0; let px = 0; let py = 0;
  const aplica = () => { raf = 0; dev.style.transform = `rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
    floats.forEach((f, i) => { const k = (i + 1) * 7; f.style.translate = `${(px * k).toFixed(1)}px ${(py * k).toFixed(1)}px`; }); };
  stage.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = stage.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5; if (!raf) raf = requestAnimationFrame(aplica); });
  stage.addEventListener('pointerleave', () => { px = 0; py = 0; if (!raf) raf = requestAnimationFrame(aplica); });
}
// troca a tela da prévia sem redesenhar a página (as três telas ficam empilhadas; os gráficos já estão desenhados)
function lpTela(v) {
  const st = lpEstado(); st.tela = v;
  document.querySelectorAll('.hp-tabs [role="tab"]').forEach((b) => b.setAttribute('aria-selected', b.dataset.v === v));
  document.querySelectorAll('.hp-scr').forEach((s) => { const on = s.id === 'hp-scr-' + v; s.classList.toggle('on', on); if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true'); });
}

/* carrossel inteligente: rolagem nativa com encaixe no centro. A cada quadro de rolagem, cada cartão recebe escala e
   opacidade conforme a distância ao centro (o do meio fica em destaque). Avança sozinho a cada 7 s só quando está na tela,
   a aba está visível e ninguém está mexendo; qualquer toque, mouse, foco ou tecla pausa por 15 s. */
function lpCarrossel() {
  const t = $('#hp-car'); if (!t || t.dataset.ligado) return; t.dataset.ligado = '1';
  const sec = t.closest('.hp-depo'); const cards = [...t.querySelectorAll('.hp-dep')]; const dots = [...sec.querySelectorAll('[data-car-i]')];
  const prev = sec.querySelector('[data-car="-1"]'); const next = sec.querySelector('[data-car="1"]');
  const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let atual = 0; let raf = 0;
  const centro = (c) => c.offsetLeft + c.offsetWidth / 2 - t.clientWidth / 2;
  const ir = (i, suave) => { i = (i + cards.length) % cards.length; t.scrollTo({ left: centro(cards[i]), behavior: suave === false || calmo() ? 'auto' : 'smooth' }); };
  const pinta = () => { raf = 0; const meio = t.scrollLeft + t.clientWidth / 2; let melhor = 0; let dmin = Infinity;
    cards.forEach((c, i) => { const d = (c.offsetLeft + c.offsetWidth / 2 - meio) / c.offsetWidth; const a = Math.min(1.2, Math.abs(d));
      if (Math.abs(d) < dmin) { dmin = Math.abs(d); melhor = i; }
      if (!calmo()) { c.style.transform = `scale(${(1 - a * 0.07).toFixed(4)})`; c.style.opacity = (1 - Math.min(1, a) * 0.42).toFixed(3); } });
    if (melhor !== atual || !cards[melhor].classList.contains('ativo')) { atual = melhor; cards.forEach((c, i) => c.classList.toggle('ativo', i === atual)); dots.forEach((b, i) => (i === atual ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'))); if (!pausado) agendar(); }
    if (prev) prev.disabled = atual === 0; if (next) next.disabled = atual === cards.length - 1; };
  const agenda = () => { if (!raf) raf = requestAnimationFrame(pinta); };
  t.addEventListener('scroll', agenda, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(agenda).observe(t);
  // avanço automático: a bolinha do cartão atual se enche em 7 s e aí passa para o próximo; mexeu, pausa (15 s, ou enquanto o mouse estiver em cima)
  let visivel = false; let pausado = false; let tAvanco = 0; let tVolta = 0;
  const encher = () => { dots.forEach((b) => b.classList.remove('corre')); const b = dots[atual]; if (b && !pausado && !calmo()) { void b.offsetWidth; b.classList.add('corre'); } };
  function agendar() { clearTimeout(tAvanco); if (calmo() || cards.length < 2 || pausado) return; encher();
    tAvanco = setTimeout(() => { if (!document.body.contains(t)) return; if (!visivel || document.hidden) { agendar(); return; } ir(atual + 1); }, 7000); }
  const pausar = (ms) => { pausado = true; sec.classList.add('pausa'); clearTimeout(tAvanco); clearTimeout(tVolta); dots.forEach((b) => b.classList.remove('corre'));
    if (ms) tVolta = setTimeout(() => { pausado = false; sec.classList.remove('pausa'); agendar(); }, ms); };
  const pausa = () => pausar(15000);
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !visivel && !pausado) agendar(); visivel = v; }, { threshold: 0.4 }).observe(t);
  ['pointerdown', 'wheel', 'touchstart', 'keydown', 'focusin'].forEach((ev) => t.addEventListener(ev, pausa, { passive: true }));
  t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pausar(0); }); t.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') pausa(); });
  // setas, bolinhas e teclado
  sec.querySelectorAll('[data-car]').forEach((b) => b.addEventListener('click', () => { pausa(); ir(atual + +b.dataset.car); }));
  dots.forEach((b) => b.addEventListener('click', () => { pausa(); ir(+b.dataset.carI); }));
  t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); ir(atual + (e.key === 'ArrowRight' ? 1 : -1)); } });
  cards.forEach((c, i) => c.addEventListener('click', () => { if (i !== atual && !arrastou) ir(i); }));
  // arraste com o mouse (no toque, a rolagem nativa já faz isso)
  let x0 = 0; let s0 = 0; let arrastou = false; let ativo = false;
  t.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; ativo = true; arrastou = false; x0 = e.clientX; s0 = t.scrollLeft; });
  t.addEventListener('pointermove', (e) => { if (!ativo) return; const dx = e.clientX - x0; if (!arrastou && Math.abs(dx) > 5) { arrastou = true; t.classList.add('arrastando'); t.setPointerCapture(e.pointerId); } if (arrastou) t.scrollLeft = s0 - dx; });
  const solta = () => { if (!ativo) return; ativo = false; if (arrastou) { t.classList.remove('arrastando'); pinta(); ir(atual); setTimeout(() => { arrastou = false; }, 0); } };
  t.addEventListener('pointerup', solta); t.addEventListener('pointercancel', solta); t.addEventListener('lostpointercapture', solta);
  t.addEventListener('click', (e) => { if (arrastou) { e.preventDefault(); e.stopPropagation(); } }, true);
  ir(0, false); pinta();
}

/* parte viva: atualiza só o trecho, sem redesenhar a página */
function lpAtualiza() { const o = $('#lp-onde'); if (o) o.innerHTML = lpOndeHtml(); const ap = $('#lp-ap-o'); if (ap) ap.textContent = brl(lpEstado().aporte); }
function lpInput(t) {
  const st = lpEstado(); const k = t.dataset.lp;
  if (k === 'aporte') { st.aporte = +t.value || 0; lpAtualiza(); } else if (k === 'nome') st.nome = t.value;
  else if (k === 'obj') { st.obj = t.value; lpObjAtualiza(); }
}
function lpAcao(act, el) {
  const st = lpEstado();
  if (act === 'lp-confirma') { st.ok = !st.ok; const w = $('#lp-vivo-w'); if (w) { w.innerHTML = lpLanc(st.ok ? 'pronto' : 'chega', true); const b = w.querySelector('button'); if (b) b.focus(); } return true; }
  if (act === 'lp-set') { st[el.dataset.k] = el.dataset.v; el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === el)); lpAtualiza(); return true; }
  if (act === 'lp-tela') { lpTela(el.dataset.v); return true; }
  return false;
}
function lpComecar() {
  const st = lpEstado();
  if (S.user) { S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); return; }
  S.authMode = 'signup'; S.authPlano = 'gratis'; S.authPagar = false; S.authErr = ''; S.authDraft = { nome: String(st.nome || '').trim() }; S.screen = 'auth'; render();
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

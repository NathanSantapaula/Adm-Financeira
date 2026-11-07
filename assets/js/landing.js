/* Página inicial: página de produto em vidro e gradiente, feita para converter.
   Ordem (cada seção responde à próxima dúvida do visitante): o que é (herói com o painel vivo), quem está por trás
   (trajetória), o que faz (recursos), o que faz por mim (simulador do aporte), quem me acompanha (assessor),
   quem já usa (depoimentos reais, só quando existirem em CFG.depoimentos), quanto custa (planos), dúvidas e chamada final.
   As prévias são fragmentos do próprio painel com valores ilustrativos; o simulador usa E.rebalance, o mesmo cálculo da Carteira. */
'use strict';

/* simulador do aporte: alocação de referência por perfil em sete classes, no padrão das carteiras de assessoria
   (pós-fixado, inflação, prefixado, multimercado, imobiliário, ações e internacional); números ilustrativos, não são recomendação */
const LP_CLASSES = [
  { k: 'pos', n: 'Pós-fixado', c: 'Tesouro Selic, CDB e LCI/LCA', rf: true },
  { k: 'inf', n: 'Inflação', c: 'Tesouro IPCA+ e títulos atrelados ao IPCA', rf: true },
  { k: 'pre', n: 'Prefixado', c: 'Tesouro Prefixado e CDB prefixado', rf: true },
  { k: 'mm', n: 'Multimercado', c: 'Fundos multimercado' },
  { k: 'fii', n: 'Fundos imobiliários', c: 'FIIs de tijolo e de papel' },
  { k: 'acoes', n: 'Ações', c: 'Fundo de índice ou ações brasileiras' },
  { k: 'int', n: 'Internacional', c: 'ETFs e BDRs no exterior' },
];
const LP_ALVO = {
  conservador: { pos: 60, inf: 20, pre: 10, mm: 5, fii: 0, acoes: 0, int: 5 },
  moderado: { pos: 35, inf: 20, pre: 10, mm: 10, fii: 5, acoes: 10, int: 10 },
  agressivo: { pos: 15, inf: 15, pre: 10, mm: 15, fii: 10, acoes: 20, int: 15 },
};
// carteira atual de R$ 60.000: quase tudo no pós-fixado, ou concentrada em ações
const LP_HOJE = { rf: { pos: 0.72, inf: 0.12, pre: 0.08, mm: 0, fii: 0.08, acoes: 0, int: 0 }, rv: { pos: 0.15, inf: 0.05, pre: 0, mm: 0, fii: 0.15, acoes: 0.60, int: 0.05 } };
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
  const st = lpEstado(); const alvo = LP_ALVO[st.perfil]; const hoje = LP_HOJE[st.hoje]; const total = 60000;
  const items = LP_CLASSES.map((a) => ({ ...a, w: alvo[a.k], v: total * hoje[a.k] }));
  const r = E.rebalance(items, st.aporte);
  const linhas = items.map((a, i) => ({ ...a, val: r.alloc[i] })).filter((a) => a.val >= 0.5).sort((a, b) => b.val - a.val);
  const rfDepois = items.reduce((s, a, i) => s + (a.rf ? a.v + r.alloc[i] : 0), 0) / (total + st.aporte);
  const rfHoje = LP_CLASSES.reduce((s, a) => s + (a.rf ? hoje[a.k] : 0), 0); const rfAlvo = LP_CLASSES.reduce((s, a) => s + (a.rf ? alvo[a.k] : 0), 0);
  return { st, linhas, rfHoje, rfDepois, rfAlvo };
}

/* prévia "Onde investir", igual à aba Carteira */
function lpOndeHtml() {
  const { st, linhas, rfHoje, rfDepois, rfAlvo } = lpCalculo();
  return `<div class="hp-onde-h"><b>Onde investir ${brl(st.aporte)}</b><span>Perfil ${esc(E.PERFIS[st.perfil].nome.toLowerCase())}</span></div>
    <ol class="hp-onde-l">${linhas.map((a) => `<li><span>${esc(a.n)}<small>${esc(a.c)}</small></span><b>${brl(a.val)}</b></li>`).join('')}</ol>
    <div class="hp-rf"><div class="hp-rf-t"><span>Renda fixa</span><span>${lpPct(rfHoje)} hoje · ${lpPct(rfDepois)} depois · alvo ${rfAlvo}%</span></div>
      <div class="hp-rf-bar" role="img" aria-label="Renda fixa: ${lpPct(rfDepois)} depois do aporte, alvo ${rfAlvo}%"><i style="width:${(rfDepois * 100).toFixed(1)}%"></i><b style="left:${rfAlvo}%"></b></div></div>
    <p class="hp-onde-n">Carteira de exemplo de ${brl(60000)} e alocação de referência por perfil. Valores ilustrativos, não é recomendação.</p>`;
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
  const bio = CFG.bio || `Assessor de investimentos vinculado à XP Inc.${antes.length ? `, com passagens por ${lpListaNomes(antes)}` : ''}. Todo mês, você sabe o que fazer com o seu dinheiro.`;
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
    ['O que é o diagnóstico?', 'Uma conversa curta depois do cadastro: patrimônio, perfil de investidor e objetivos. O painel já nasce com a sua cara.'],
    ['Onde ficam os meus dados?', `Seus lançamentos ficam em servidor protegido por login e só você acessa. ${esc(CFG.consultor)} vê apenas seu nome, contato e o resultado do diagnóstico, a menos que você contrate a Assessoria.`],
    ['Como funciona a importação do extrato?', 'Envie o CSV ou OFX do app do banco. A leitura acontece no seu aparelho, cada lançamento ganha categoria e nada é gravado sem você conferir.'],
    ['Como ativo a Assessoria?', `Depois do cadastro, você faz o pagamento e envia o comprovante. O ${esc(nome)} confirma e libera o plano na sua conta.`],
    ['O assessor vê os meus lançamentos?', `No Organização e no Investidor, não: o ${esc(nome)} vê nome, contato e o resultado do diagnóstico. Na Assessoria ele também acompanha o planejamento, para orientar você.`],
    ['Posso levar meus dados embora?', 'Sim. Baixe um backup completo quando quiser.'],
  ];
  const cta = logged ? 'Abrir meu painel' : 'Fazer meu diagnóstico gratuito';
  const links = [['produto', 'Recursos'], ['como', 'Como funciona'], ['assessor', 'O assessor']].concat(temDepo ? [['depoimentos', 'Depoimentos']] : []).concat([['planos', 'Planos'], ['duvidas', 'Dúvidas']]);

  const mes = MES_LONGO[NOW_M].toLowerCase();
  const tel = (cls, corpo) => `<div class="hm-tel ${cls}" aria-hidden="true"><span class="hm-tel-ilha"></span><div class="hm-tel-st"><b>9:41</b><i></i></div>${corpo}</div>`;
  const cats = [['Moradia', 2200, 'var(--c1)'], ['Alimentação', 1150, 'var(--c2)'], ['Transporte', 620, 'var(--c3)'], ['Lazer', 430, 'var(--c4)']];
  const totCat = cats.reduce((s, c) => s + c[1], 0);
  // as 5 áreas do produto, cada uma com uma pergunta e um widget (valores ilustrativos)
  const bento = [
    ['w2', 'Hoje', 'Como estou e o que faço agora?', `<div class="hm-hoje"><div><small class="hm-mut">Pode gastar hoje</small><b class="hm-big">${brl0(86)}</b><span class="hm-ok">● No ritmo · sobra prevista de ${brl0(1320)}</span></div><ol class="hm-plano"><li>Pague a internet <em>vence amanhã</em></li><li>Aporte ${brl0(300)} no sonho</li><li>Segure o lazer <em>85% do limite</em></li></ol></div>`],
    ['', 'Dinheiro', 'Para onde vai e de onde vem?', `<ul class="hm-contas"><li><b>Salário</b><small>dia 5</small><em class="pos">+${brl0(5750)}</em></li><li><b>Mercado</b><small>ontem</small><em>−${brl0(386)}</em></li></ul>`],
    ['', 'Futuro', 'Vou chegar lá?', `<ul class="hm-etapas" aria-hidden="true">${[10, 25, 50, 75, 100].map((n) => `<li class="${n <= 50 ? 'ok' : ''}"><i></i>${n}%</li>`).join('')}</ul><small class="hm-mut">Próxima etapa em março</small>`],
    ['w2', 'Patrimônio', 'Quanto tenho e como cresce?', `<div class="hm-patr"><div class="donut" id="hm-donut"></div><div><b class="hm-big">${brl0(487320)}</b><small class="hm-mut">aportes, proventos e carteira com alvo</small></div></div>`],
    ['w2', 'Você', 'Seu jeito, seus dados', `<ul class="hm-voce"><li>Sem senha do banco</li><li>Backup quando quiser</li><li>Assessor a um toque</li></ul>`],
  ];
  const passos = ['Envie o extrato', `O ${esc(CFG.marca)} organiza`, 'Você confere'];

  return `<div class="hp hp-dark hm">
  <header class="hp-nav hm-nav"><div class="hp-w hp-nav-in">
    <a class="hp-marca" href="#topo" data-act="scroll" data-to="topo">${logoMarca()}</a>
    <nav class="hp-links" aria-label="Seções">${links.map(([id, n]) => `<button data-act="scroll" data-to="${id}">${n}</button>`).join('')}</nav>
    <div class="hp-nav-a">${logged ? '<button class="hp-btn sm" data-act="open-app">Abrir meu painel</button>' : '<button class="hp-btn sm ghost" data-act="go-auth" data-mode="login">Entrar</button><button class="hp-btn sm" data-act="go-auth" data-mode="signup">Começar →</button>'}</div>
  </div></header>

  <section class="hm-hero" id="topo"><div class="hp-w">
    <h1 class="hm-h1 hp-in"><span class="hm-l1">O ${esc(CFG.marca)} organiza tudo.</span><span class="hm-l2">Você alcança seu objetivo.</span></h1>
    <p class="hm-sub hp-in">Seu dinheiro organizado sozinho e o próximo passo sempre claro. Com a assessoria de ${esc(CFG.consultor)}.</p>
    <div class="hm-ctas hp-in"><button class="hp-btn lg" data-act="go-auth" data-mode="signup">${cta} ↗</button><button class="hp-btn lg vidro" data-act="scroll" data-to="como">Ver como funciona</button></div>
    <p class="hm-garantia hp-in">Grátis para começar · sem cartão · sem senha do banco</p>
    <div class="hm-fone hp-in">
      ${tel('esq', `<div class="hm-tel-c"><p class="hm-tel-t">Assistente</p><div class="hm-chat"><p class="eu">Quanto sobrou em ${mes}?</p><p>Sobraram ${brl0(1840)}. Já dá para o aporte do mês e ainda fica uma folga.</p></div></div>`)}
      <div class="hm-meio" aria-hidden="true"><small>● Pode gastar hoje</small><b>${brl0(86)}</b><span>e o mês ainda fecha no azul</span></div>
      ${tel('dir', `<div class="hm-tel-c"><p class="hm-tel-t">Gastos por categoria</p><small class="hm-mut">${MES_LONGO[NOW_M]} ${NOW_Y}</small><b class="hm-big">${brl0(totCat)}</b><ul class="hm-cats">${cats.map(([n, v, c]) => `<li><i style="background:${c}"></i><span>${n}<small>${Math.round((v / totCat) * 100)}% dos gastos</small></span><b>${brl0(v)}</b></li>`).join('')}</ul></div>`)}
    </div>
    <p class="hp-cap">Telas ilustrativas, com valores fictícios.</p>
  </div></section>

  <section class="hp-sec" id="produto"><div class="hp-w">
    <div class="hp-head" data-rv><p class="hp-k">Cinco áreas, nada a mais</p><h2 class="hp-h2">Cada tela responde uma pergunta.</h2></div>
    <div class="hm-bento">${bento.map(([w, t, q, v]) => `<article class="hm-b ${w}" data-rv><h3>${t}</h3><p>${q}</p><div class="hm-b-v">${v}</div></article>`).join('')}</div>
  </div></section>

  <section class="hp-sec" id="como"><div class="hp-w">
    <div class="hp-head" data-rv><p class="hp-k">Do extrato ao mês</p><h2 class="hp-h2">Sem digitar. Sem senha do banco.</h2></div>
    <ol class="hm-passos">${passos.map((t, i) => `<li data-rv><span class="hm-n">${i + 1}</span><h3>${t}</h3></li>`).join('')}</ol>
    <div class="hp-card hp-vis hm-imp" data-rv><small>Importação de ${mes}</small><ul class="hp-lancs">${lpLanc('chega')}</ul><ul class="hp-lancs" id="lp-vivo-w">${lpLanc(st.ok ? 'pronto' : 'chega', true)}</ul><ul class="hp-lancs">${lpLanc('pronto')}</ul></div>
  </div></section>


  <section class="hp-sec" id="simulador"><div class="hp-w">
    <div class="hp-sim hp-dark" data-rv>
      <div class="hp-sim-c">
        <p class="hp-k">Seus objetivos</p>
        <h2 class="hp-h2">O que sobra<br>tem destino.</h2>
        <p class="hp-lead">Mexa no aporte e veja para onde ele vai.</p>
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
    <div class="hm-pl-h" data-rv><p class="hp-k">Planos · comece grátis</p><h2 class="hm-h1 hm-h1-s"><span class="hm-l1">Chega de fim de mês no susto.</span><span class="hm-l2">Comece hoje.</span></h2>
      <p class="hm-sub">A partir de <b>${esc(brl(precoPlano('investidor') / 30))} por dia</b>.</p></div>
    <div id="hm-pl" data-rv>${lpPlanosHtml()}</div>
  </div></section>

  <section class="hp-sec hp-alt" id="duvidas"><div class="hp-w hp-estreito">
    <div class="hp-head" data-rv><h2 class="hp-h2">Perguntas frequentes</h2></div>
    <div class="hp-card hp-faq" data-rv>${faq.map((q) => `<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}</div>
  </div></section>

  <section class="hp-sec"><div class="hp-w">
    <div class="hp-fim hp-dark" data-rv>
      <h2 class="hp-h2">Comece pelo<br>diagnóstico.</h2>
      <form class="hp-fim-f" id="lp-comeco"><label class="hp-sr" for="hp-nome">Como devemos chamar você?</label>
        <input id="hp-nome" name="nome" autocomplete="given-name" placeholder="Como devemos chamar você?" value="${esc(st.nome)}" data-lp="nome">
        <button class="hp-btn lg" type="submit">${logged ? 'Abrir meu painel' : 'Começar agora'}</button></form>
      
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
  chartDonut($('#hm-donut'), { aria: 'Composição ilustrativa da carteira', title: '54%', sub: 'renda fixa', items: [{ label: 'Renda fixa', value: 54, color: 'var(--c1)' }, { label: 'Ações', value: 28, color: 'var(--c2)' }, { label: 'Fundos imobiliários', value: 18, color: 'var(--c3)' }] });
  lpCarrossel();
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

/* planos em três passos (Plano, Período, Pagamento), como um checkout; troca só o bloco #hm-pl, sem render() */
const LP_PL_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function lpPlanosHtml() {
  const st = lpEstado(); const pl = (st.pl = st.pl || { passo: 1, plano: 'investidor', per: 'mensal' }); const nome = primeiroNome();
  const passos = ['Plano', 'Período', 'Pagamento'];
  const topo = `<div class="hm-pl-pas" role="tablist" aria-label="Etapas">${passos.map((n, i) => `<button type="button" role="tab" class="${pl.passo === i + 1 ? 'on' : pl.passo > i + 1 ? 'ok' : ''}" aria-selected="${pl.passo === i + 1}" data-act="lp-pl" data-k="passo" data-v="${i + 1}"${i + 1 > pl.passo ? ' disabled' : ''}><i>${pl.passo > i + 1 ? '✓' : i + 1}</i>${n}</button>`).join('')}</div>`;
  const preco = (id) => precoPlano(id); const mensal = preco(pl.plano);
  let corpo;
  if (pl.passo === 1) {
    // os cartões de sempre (nível, preço de/por, itens); escolher um pago leva ao Período
    const card = (id, n) => { const i = infoPlano(id); const d = id === 'completo'; const txt = id !== 'gratis' && preco(id) <= 0;
      const antes = d && CFG.precoRegular > preco(id) ? `<s class="hp-antes"><span class="hp-sr">De </span>${esc(brl(CFG.precoRegular))}</s>` : '';
      return `<article class="hp-card hp-plano n${n + 1}${d ? ' rec hp-dark' : ''}${pl.plano === id ? ' sel' : ''}">${d ? `<span class="hp-selo">Com o ${esc(nome)}</span>` : ''}
        <span class="hp-nivel" role="img" aria-label="Nível ${n + 1} de 3"><i></i><i></i><i></i></span>
        <h3>${esc(nomePlano(id))}</h3><p class="hp-plano-r">${esc(i.resumo)}</p>
        <div class="hp-preco-w">${antes}<p class="hp-preco${txt ? ' txt' : ''}">${antes ? '<span class="hp-sr">por </span>' : ''}${esc(precoTxt(id))}</p></div>
        <p class="hp-plano-n">${antes ? 'Condição de lançamento.' : id === 'gratis' ? 'Grátis, sem prazo.' : '&nbsp;'}</p>
        <ul>${i.itens.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <button class="hp-btn${d ? ' lg' : id === 'gratis' ? ' vidro' : ''}" data-act="lp-pl" data-k="plano" data-v="${id}">${id === 'gratis' ? 'Começar grátis' : id === 'investidor' ? 'Quero o Investidor' : 'Quero a assessoria'}</button></article>`; };
    corpo = `<div class="hp-grid3 hp-planos">${['gratis', 'investidor', 'completo'].map(card).join('')}</div>`;
  } else if (pl.passo === 2) {
    const ops = [['mensal', 'Mensal', `${brl(mensal)}/mês`, 'Renova todo mês. Mude de plano quando quiser.'], ['anual', 'Anual', `12 × ${brl(mensal)}`, `Condição para o ano inteiro: combine com o ${nome}.`]];
    corpo = `<div class="hm-pl-g g2">${ops.map(([k, n, v, d]) => `<button type="button" class="hm-pl-c${pl.per === k ? ' sel' : ''}" data-act="lp-pl" data-k="per" data-v="${k}" aria-pressed="${pl.per === k}"><b class="hm-pl-n">${n}</b><span class="hm-pl-p"><b>${esc(v)}</b></span><span class="hm-pl-r">${esc(d)}</span><span class="hm-pl-esc">Continuar →</span></button>`).join('')}</div>
      <button type="button" class="hm-pl-volta" data-act="lp-pl" data-k="passo" data-v="1">← Trocar de plano</button>`;
  } else {
    const anual = pl.per === 'anual';
    corpo = `<div class="hm-pl-res"><div><small>Seu plano</small><b class="hm-pl-n">${esc(nomePlano(pl.plano))}${anual ? ' · anual' : ' · mensal'}</b><span class="hm-pl-r">${esc(infoPlano(pl.plano).resumo)}</span></div>
      <div class="hm-pl-tot"><small>${anual ? 'Total do ano' : 'Por mês'}</small><b>${esc(brl(anual ? mensal * 12 : mensal))}</b></div></div>
      <ol class="hm-pl-ord"><li>Crie sua conta e faça o diagnóstico</li><li>Pague pelo link seguro do Mercado Pago, no cartão ou no Pix</li><li>O ${esc(nome)} confirma e libera o plano na sua conta</li></ol>
      <div class="hm-ctas">${anual ? `<button class="hp-btn lg" data-act="contact">Combinar o anual com o ${esc(nome)}</button>` : `<button class="hp-btn lg" data-act="go-auth" data-mode="signup" data-plano="${pl.plano}" data-pagar="1">Criar conta e pagar</button>`}<button type="button" class="hp-btn lg vidro" data-act="lp-pl" data-k="passo" data-v="2">Voltar</button></div>`;
  }
  return `${topo}<div class="hm-pl-box">${corpo}</div>
    <ul class="hm-pl-conf"><li><b>Grátis</b> sem prazo</li><li><b>Cartão ou Pix</b> pelo Mercado Pago</li><li><b>Mude</b> quando quiser</li></ul>
    <p class="hm-pl-leg"><button class="hp-lnk" data-act="terms">Termos de uso e privacidade</button></p>`;
}
function lpPlano(el) {
  const pl = lpEstado().pl; const k = el.dataset.k; const v = el.dataset.v;
  if (k === 'plano') { if (v === 'gratis') { S.lp.pl.plano = v; return lpComecar(); } pl.plano = v; pl.passo = 2; }
  else if (k === 'per') { pl.per = v; pl.passo = 3; } else pl.passo = +v;
  const w = $('#hm-pl'); if (w) { w.innerHTML = lpPlanosHtml(); }
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
  if (act === 'lp-pl') { lpPlano(el); return true; }
  return false;
}
function lpComecar() {
  const st = lpEstado();
  if (S.user) { S.screen = S.profile.onboarded ? 'app' : 'onboarding'; if (S.screen === 'onboarding' && !S.ob) initOb(); render(); return; }
  S.authMode = 'signup'; S.asPasso = 1; S.authPlano = 'gratis'; S.authPagar = false; S.authErr = ''; S.authDraft = { nome: String(st.nome || '').trim() }; S.screen = 'auth'; render();
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

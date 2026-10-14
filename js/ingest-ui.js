/* Interface da ingestão: escolher arquivo, revisar a categorização automática e distribuir para cada aba. */
'use strict';
const ING_DEST = [['despesa', 'Gasto'], ['renda', 'Renda'], ['investimento', 'Aporte ou resgate'], ['provento', 'Provento'], ['ignorar', 'Ignorar']];
const dataBR = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

function abrirIngestao(modo) {
  if (!S.plan) { toast('Crie o planejamento do ano primeiro.'); return; }
  const corretora = modo === 'corretora'; S.ingModo = corretora ? 'corretora' : 'banco';
  S.ing = { estado: 'inicio', filtro: 'todos' };
  openModal({ title: corretora ? 'Importar da corretora' : 'Importar extrato', ok: 'Importar', wide: true, body: '<div id="ing-root" class="ing"></div>',
    onOk: () => { if (!S.ing || S.ing.estado !== 'pronto' || !S.ing.resumo || !S.ing.resumo.incluidas) { toast('Escolha um arquivo e marque ao menos um lançamento.'); return false; } aplicarIngestao(); return true; } });
  renderIng();
}

function ingCtx() {
  return { planos: S.plans, ativos: (S.plan && S.plan.ativos) || [], permiteInvest: temRecurso('ingestao_invest'), regrasUsuario: S.profile.regras || [] };
}
function ingProcessar() {
  const r = FPIngest.processar(S.ing.parsed, ingCtx()); S.ing.rows = r.transacoes; S.ing.resumo = r.resumo; S.ing.estado = 'pronto';
}

async function ingLer(file) {
  S.ing = { estado: 'lendo', nome: file.name, filtro: 'todos' }; renderIng();
  try {
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') { await ingPDF(file); renderIng(); return; }
    if (file.size > 8 * 1024 * 1024) throw new Error('grande');
    let texto = null; let linhas = null; let parsed; let fmt;
    if (/\.xlsx?$/i.test(file.name)) {
      const X = await loadXlsx(); const wb = X.read(new Uint8Array(await file.arrayBuffer()), { type: 'array', cellDates: true });
      // usa a primeira aba que tiver linhas (relatórios da B3 vêm numa aba só)
      for (const nome of wb.SheetNames) { const l = X.utils.sheet_to_json(wb.Sheets[nome], { header: 1, raw: true, defval: '' }); if (l.length > 1) { linhas = l; break; } }
      if (!linhas) throw new Error('vazio');
      parsed = FPIngest.parseTabela(linhas, { anoPadrao: S.year, nomeArquivo: file.name }); fmt = parsed.formato;
    } else {
      texto = FPIngest.decodeBytes(await file.arrayBuffer()); fmt = FPIngest.detectarFormato(texto, file.name);
      parsed = fmt === 'ofx' ? FPIngest.parseOFX(texto) : FPIngest.parseCSV(texto, { anoPadrao: S.year, nomeArquivo: file.name }); if (parsed.formato === 'b3') fmt = 'b3';
    }
    S.ing = { estado: 'pronto', nome: file.name, formato: fmt, texto, linhas, parsed, filtro: 'todos', tipoConta: parsed.tipoConta };
    if (!parsed.transacoes.length) { S.ing.estado = 'erro'; S.ing.msg = (parsed.avisos[0] || 'Nenhuma transação encontrada.') + ' Confira o arquivo ou o mapeamento das colunas.'; if (fmt === 'csv') S.ing.estado = 'mapear'; } else ingProcessar();
  } catch (e) { S.ing = { estado: 'erro', nome: file.name, msg: e && e.message === 'grande' ? 'Arquivo acima de 8 MB. Exporte um período menor.' : e && e.message === 'xlsx' ? 'Não foi possível carregar o leitor de planilhas. Confira a internet ou salve o arquivo como CSV.' : 'Não foi possível ler o arquivo. Use CSV, OFX, XLSX ou PDF.' }; }
  renderIng();
}

async function ingPDF(file) {
  if (!temRecurso('ia_pdf')) { S.ing = { estado: 'bloqueado', nome: file.name }; return; }
  if (Store.mode !== 'cloud' || !(CFG.ingestao && CFG.ingestao.iaAtiva)) { S.ing = { estado: 'erro', nome: file.name, msg: 'A leitura de PDF por IA ainda não foi ativada neste site. Exporte o extrato em CSV ou OFX no aplicativo do seu banco.' }; return; }
  if (file.size > 10 * 1024 * 1024) { S.ing = { estado: 'erro', nome: file.name, msg: 'PDF acima de 10 MB.' }; return; }
  S.ing = { estado: 'lendo', nome: file.name, msg: 'Enviando e lendo o PDF com IA…' }; renderIng();
  try {
    const caminho = await Store.uploadIngest(file, S.user);
    const payload = FPIngest.montarPayloadIA({ modo: 'extrair', arquivo: { nome: file.name, tipo: 'application/pdf', tamanho: file.size, caminho }, ano: S.year, categoriasDespesa: S.plan.catsDesp.map((c) => c.nome), categoriasRenda: S.plan.rendaCats.map((c) => c.nome), ativos: S.plan.ativos.map((a) => a.nome), regras: S.profile.regras });
    const v = FPIngest.validarRespostaIA(await Store.ingestIA(payload), { anoPadrao: S.year });
    if (!v.ok || !v.transacoes.length) { S.ing = { estado: 'erro', nome: file.name, msg: v.erro || 'A IA não encontrou lançamentos no PDF.' }; return; }
    S.ing = { estado: 'pronto', nome: file.name, formato: 'pdf', parsed: { transacoes: v.transacoes, avisos: v.avisos, tipoConta: 'extrato' }, filtro: 'todos', tipoConta: 'extrato' }; ingProcessar();
  } catch (e) { S.ing = { estado: 'erro', nome: file.name, msg: e && e.amigavel ? e.message : 'Não foi possível ler o PDF agora.' }; }
}

async function ingRefinar() {
  const baixos = S.ing.rows.filter((t) => t.confianca < 0.6 && !t.duplicado && t.destino !== 'ignorar'); if (!baixos.length) { toast('Nada a refinar: todas as linhas têm boa confiança.'); return; }
  S.ing.refinando = true; renderIng();
  try {
    const payload = FPIngest.montarPayloadIA({ modo: 'categorizar', ano: S.year, categoriasDespesa: S.plan.catsDesp.map((c) => c.nome), categoriasRenda: S.plan.rendaCats.map((c) => c.nome), ativos: S.plan.ativos.map((a) => a.nome), regras: S.profile.regras, transacoes: baixos });
    const n = FPIngest.aplicarRefinoIA(S.ing.rows, await Store.ingestIA(payload)); S.ing.resumo = FPIngest.resumir(S.ing.rows); toast(n ? `A IA sugeriu categorias para ${n} lançamentos. Revise antes de importar.` : 'A IA não trouxe novas sugestões.');
  } catch (e) { toast(e && e.amigavel ? e.message : 'A leitura por IA não respondeu agora.'); }
  S.ing.refinando = false; renderIng();
}

const podeIA = () => temRecurso('ia_pdf') && Store.mode === 'cloud' && !!(CFG.ingestao && CFG.ingestao.iaAtiva);
function linhaIng(t) {
  const conf = t.confianca >= 0.8 ? 'hi' : t.confianca >= 0.55 ? 'md' : 'lo'; const abre = S.ing.editando === t.idx;
  const badges = [t.duplicado ? '<span class="badge">Já importado</span>' : '', t.bloqueado ? `<span class="badge parc">${esc(t.bloqueado)}</span>` : '', t.conciliar && t.destino === 'despesa' ? `<span class="badge prev">Casa com “${esc(t.conciliar.nome)}”</span>` : '', t.planoNovo ? `<span class="badge">Cria ${t.ano}</span>` : '', t.origem === 'ia' ? '<span class="badge ia">IA</span>' : ''].join('');
  const alvo = t.destino === 'despesa' ? `${esc(t.area)}${t.sub ? ' › ' + esc(t.sub) : ''}` : t.destino === 'renda' ? esc(t.catTipo === 'fixa' ? 'Renda fixa' : 'Renda extra') : t.destino === 'ignorar' ? 'Não será importado' : t.ativo ? esc(t.ativo.nome) : '';
  const edit = abre ? `<div class="ing-edit">
      ${t.destino === 'despesa' ? `<select data-ing="catTipo" data-i="${t.idx}"><option value="fixa" ${t.catTipo === 'fixa' ? 'selected' : ''}>Despesa fixa</option><option value="variavel" ${t.catTipo !== 'fixa' ? 'selected' : ''}>Despesa variável</option></select><input data-ing="area" data-i="${t.idx}" value="${esc(t.area)}" placeholder="Área" aria-label="Área"><input data-ing="sub" data-i="${t.idx}" value="${esc(t.sub || '')}" placeholder="Subárea (opcional)" aria-label="Subárea">` : ''}
      ${t.destino === 'renda' ? `<select data-ing="catTipo" data-i="${t.idx}"><option value="fixa" ${t.catTipo === 'fixa' ? 'selected' : ''}>Renda fixa</option><option value="extra" ${t.catTipo !== 'fixa' ? 'selected' : ''}>Renda extra</option></select><input data-ing="itemRenda" data-i="${t.idx}" value="${esc(t.itemRenda || '')}" placeholder="Nome da renda (opcional)" aria-label="Nome da renda">` : ''}
      ${t.destino === 'investimento' || t.destino === 'provento' ? `<input data-ing="ativoNome" data-i="${t.idx}" value="${esc(t.ativo ? t.ativo.nome : '')}" placeholder="Ativo" aria-label="Ativo"><select data-ing="ativoTipo" data-i="${t.idx}"><option value="RENDA FIXA" ${t.ativo && t.ativo.tipo === 'RENDA FIXA' ? 'selected' : ''}>Renda fixa</option><option value="BOLSA DE VALORES" ${t.ativo && t.ativo.tipo !== 'RENDA FIXA' ? 'selected' : ''}>Bolsa de valores</option></select><input data-ing="ativoClasse" data-i="${t.idx}" value="${esc(t.ativo ? t.ativo.classe : '')}" placeholder="Classe" aria-label="Classe do ativo">` : ''}
      ${t.conciliar && t.destino === 'despesa' ? `<label class="chk"><input type="checkbox" data-ing="conciliarAceito" data-i="${t.idx}" ${t.conciliarAceito ? 'checked' : ''}><span>Substituir o previsto “${esc(t.conciliar.nome)}” (${brl(t.conciliar.valor)})</span></label>` : ''}
      <label class="chk"><input type="checkbox" data-ing="lembrar" data-i="${t.idx}" ${t.lembrar ? 'checked' : ''}><span>Lembrar para este estabelecimento</span></label></div>` : '';
  return `<div class="ing-row${t.incluir ? '' : ' off'}"><input type="checkbox" data-ing="incluir" data-i="${t.idx}" ${t.incluir ? 'checked' : ''} ${t.duplicado || t.bloqueado ? 'disabled' : ''} aria-label="Incluir lançamento">
    <span class="ing-desc" title="${esc(t.descricao)}">${esc(t.descricao)}</span><span class="ing-val${t.valor > 0 ? ' in' : ''}">${t.valor > 0 ? '+' : '−'}${brl(Math.abs(t.valor))}</span>
    <span class="ing-sub"><span>${dataBR(t.data)}</span><i class="conf ${conf}" title="${esc(t.motivo)}"></i>
      <select data-ing="destino" data-i="${t.idx}" aria-label="Destino" ${t.duplicado ? 'disabled' : ''}>${ING_DEST.map(([v, l]) => `<option value="${v}" ${t.destino === v ? 'selected' : ''}>${l}</option>`).join('')}</select><span>${alvo}</span>${badges}
      ${t.duplicado ? '' : `<button class="lnk strong" data-act="ing-edit" data-i="${t.idx}">${abre ? 'Fechar' : 'Editar'}</button>`}</span>${edit}</div>`;
}

function renderIng() {
  const root = $('#ing-root'); if (!root) return; const g = S.ing || { estado: 'inicio' };
  const corretora = S.ingModo === 'corretora';
  const drop = `<label class="drop" for="ing-file"><b>Arraste o arquivo aqui ou toque para escolher</b><small>${corretora ? 'Relatório da B3 ou da corretora em XLSX ou CSV' : 'Extratos e faturas em CSV, OFX ou XLSX'}${temRecurso('ia_pdf') ? ' (e PDF)' : ''}. O arquivo é lido no seu aparelho.</small></label><input id="ing-file" type="file" accept=".csv,.ofx,.qfx,.txt,.xlsx,.xls${temRecurso('ia_pdf') ? ',.pdf' : ''}" hidden>`;
  const sc = $('.ing-list', root) ? $('.ing-list', root).scrollTop : 0; let h = '';
  if (g.estado === 'inicio') h = drop + (corretora
    ? `<ol class="passos"><li>Entre em <b>investidor.b3.com.br</b> (Área do Investidor da B3, gratuita e com todas as suas corretoras).</li><li>Vá em <b>Extratos</b> e escolha <b>Movimentação</b> (compras, vendas e proventos) ou <b>Negociação</b> (só compras e vendas).</li><li>Filtre o período e baixe em <b>Excel</b>. Solte o arquivo aqui.</li></ol><p class="cap">Reconheço ações, FIIs, ETFs, BDRs e Tesouro Direto, separo aportes, resgates e proventos e ignoro eventos sem dinheiro (bonificação, desdobro, atualização). Reimportar o mesmo período não duplica nada.</p>`
    : `<p class="cap">Dica: no aplicativo do seu banco, exporte o extrato do mês em OFX ou CSV. Eu reconheço a categoria de cada lançamento, separo entradas, gastos, aportes e proventos e evito duplicar o que já foi importado. Para a carteira, use "Importar da corretora" em Investimentos.</p>`);
  else if (g.estado === 'lendo') h = `<p class="mmsg">${esc(g.msg || 'Lendo ' + g.nome + '…')}</p><div class="skel" style="height:90px"></div>`;
  else if (g.estado === 'bloqueado') h = lockedHtml('ia_pdf') + drop;
  else if (g.estado === 'erro') h = `<div class="notice">${esc(g.msg)}</div>` + drop;
  else if (g.estado === 'mapear') h = `<div class="notice">${esc(g.msg)}</div>${mapaHtml(g)}${drop}`;
  else {
    const R = g.resumo; const rows = g.rows; const f = g.filtro;
    const mostra = rows.filter((t) => (f === 'revisar' ? t.confianca < 0.6 && !t.duplicado && t.destino !== 'ignorar' : f === 'dup' ? t.duplicado : true));
    const novos = R.anos.filter((y) => !S.plans[y]);
    h = `<div class="ing-opts"><b>${esc(g.nome)}</b>${g.formato === 'csv' ? `<select data-ing-conta aria-label="Tipo de arquivo"><option value="extrato" ${g.tipoConta === 'extrato' ? 'selected' : ''}>Extrato bancário</option><option value="cartao" ${g.tipoConta === 'cartao' ? 'selected' : ''}>Fatura de cartão</option></select>` : `<span class="badge">${g.formato === 'ofx' ? 'OFX' : g.formato === 'b3' ? (g.parsed.relatorio === 'negociacao' ? 'B3 · Negociação' : 'B3 · Movimentação') : 'PDF com IA'}</span>`}<label class="lnk strong" for="ing-file">Trocar arquivo</label><input id="ing-file" type="file" accept=".csv,.ofx,.qfx,.txt,.xlsx,.xls${temRecurso('ia_pdf') ? ',.pdf' : ''}" hidden></div>
      <div class="ing-head"><p class="ing-big"><b>${R.total}</b> ${R.total === 1 ? 'lançamento encontrado' : 'lançamentos encontrados'}</p><p class="ing-ok">${R.revisar ? `<span class="pill warn">${R.revisar} para revisar</span>` : '<span class="pill ok">Tudo categorizado</span>'}${R.duplicadas ? `<span class="pill">${R.duplicadas} já importados</span>` : ''}</p>
        <div class="ing-tot">${[[R.porDestino.despesa, 'gasto', 'gastos', ''], [R.porDestino.renda, 'entrada', 'entradas', 'in'], [R.porDestino.investimento, 'movimento em ativos', 'movimentos em ativos', ''], [R.porDestino.provento, 'provento', 'proventos', 'in']].filter((x) => x[0].n).map(([d, l1, l, c]) => `<span><b class="${c}">${brl0(Math.abs(d.valor))}</b><small>${d.n} ${d.n === 1 ? l1 : l}</small></span>`).join('')}</div></div>
      ${R.bloqueadas ? `<p class="ing-warn">${R.bloqueadas} lançamentos de investimento ficam de fora: aportes e proventos pelo extrato fazem parte do plano ${esc(nomePlano(planoMinimoDe('ingestao_invest')))}.</p>` : ''}
      ${novos.length ? `<p class="ing-warn">O planejamento de ${novos.join(', ')} ainda não existe e será criado ao importar.</p>` : ''}
      ${(g.parsed.avisos || []).slice(0, 3).map((a) => `<p class="ing-warn">${esc(a)}</p>`).join('')}
      <div class="chips" role="tablist">${[['todos', 'Todos'], ['revisar', 'Revisar'], ['dup', 'Já importados']].map(([k, l]) => `<button class="chip-m${f === k ? ' on' : ''}" data-act="ing-filtro" data-f="${k}">${l}</button>`).join('')}${podeIA() && R.revisar ? `<button class="btn sm" data-act="ing-ia" ${g.refinando ? 'disabled' : ''}>${g.refinando ? 'Consultando IA…' : 'Refinar com IA'}</button>` : ''}</div>
      ${g.formato === 'csv' ? `<details class="how"><summary>Conferir colunas reconhecidas</summary>${mapaHtml(g)}</details>` : ''}
      <div class="ing-list">${mostra.length ? mostra.map(linhaIng).join('') : '<p class="empty-s">Nada nesta lista.</p>'}</div>
      <p class="cap">Marque o que entra, ajuste o destino e a categoria se precisar. O ponto colorido mostra a confiança do reconhecimento (verde alta, vermelho baixa). Reimportar o mesmo arquivo não duplica nada.</p>`;
  }
  root.innerHTML = h; if ($('.ing-list', root)) $('.ing-list', root).scrollTop = sc;
  const ok = $('#mform button[type=submit]'); if (ok) { const n = g.estado === 'pronto' && g.resumo ? g.resumo.incluidas : 0; ok.textContent = n ? `Importar ${n} ${n === 1 ? 'lançamento' : 'lançamentos'}` : 'Importar'; ok.disabled = !n; }
}
function mapaHtml(g) {
  const cab = (g.parsed && g.parsed.cabecalho) || (g.parsed && g.parsed.lido && g.parsed.lido.linhas[0]) || []; const m = (g.parsed && g.parsed.mapeamento) || { data: -1, descricao: -1, valor: -1 };
  const opts = (cur) => `<option value="-1">(nenhuma)</option>${cab.map((c, i) => `<option value="${i}" ${cur === i ? 'selected' : ''}>${esc(c || 'Coluna ' + (i + 1))}</option>`).join('')}`;
  return `<div class="ing-edit">${[['data', 'Data'], ['descricao', 'Descrição'], ['valor', 'Valor'], ['debito', 'Débito'], ['credito', 'Crédito']].map(([k, l]) => `<label class="fld"><span>${l}</span><select data-ing-col="${k}">${opts(m[k])}</select></label>`).join('')}</div>`;
}
function ingMapa(k, v) {
  const g = S.ing; const p = g.parsed; if (!p || !p.lido) return; p.mapeamento[k] = +v;
  const n = FPIngest.normalizarCSV(p.lido, p.mapeamento, { anoPadrao: S.year, tipoConta: g.tipoConta }); p.transacoes = n.transacoes; p.avisos = n.avisos;
  if (n.transacoes.length) ingProcessar(); else { g.estado = 'mapear'; g.msg = 'Nenhuma transação reconhecida com este mapeamento.'; }
  renderIng();
}
function ingConta(tipo) {
  const g = S.ing; g.tipoConta = tipo; g.parsed = g.linhas ? FPIngest.parseTabela(g.linhas, { anoPadrao: S.year, nomeArquivo: g.nome, tipoConta: tipo }) : FPIngest.parseCSV(g.texto, { anoPadrao: S.year, nomeArquivo: g.nome, tipoConta: tipo });
  if (g.parsed.transacoes.length) ingProcessar(); else { g.estado = 'mapear'; g.msg = 'Nenhuma transação reconhecida.'; } renderIng();
}
function ingCampo(i, campo, valor, marcado) {
  const t = S.ing.rows[i]; if (!t) return;
  if (campo === 'incluir') t.incluir = marcado;
  else if (campo === 'destino') {
    t.destino = valor; t.motivo = 'Ajustado por você'; t.confianca = 1;
    if (valor === 'renda' && t.catTipo !== 'fixa') t.catTipo = 'extra'; if (valor === 'despesa' && t.catTipo === 'extra') t.catTipo = 'variavel';
    if ((valor === 'investimento' || valor === 'provento') && !t.ativo) t.ativo = { nome: 'Aportes (a classificar)', tipo: 'RENDA FIXA', classe: 'Aplicações' };
    t.bloqueado = (valor === 'investimento' || valor === 'provento') && !temRecurso('ingestao_invest') ? 'Disponível no plano Investidor' : '';
    t.conciliar = valor === 'despesa' ? FPIngest.sugerirConciliacao(t, S.plans[t.ano]) : null; t.conciliarAceito = !!t.conciliar;
    t.incluir = valor !== 'ignorar' && !t.bloqueado && !t.duplicado; t.lembrar = true;
  } else if (campo === 'ativoNome' || campo === 'ativoTipo' || campo === 'ativoClasse') { t.ativo = Object.assign({ nome: '', tipo: 'RENDA FIXA', classe: 'Aplicações' }, t.ativo); t.ativo[campo === 'ativoNome' ? 'nome' : campo === 'ativoTipo' ? 'tipo' : 'classe'] = valor; t.lembrar = true; }
  else if (campo === 'conciliarAceito' || campo === 'lembrar') t[campo] = marcado;
  else { t[campo] = valor; t.confianca = 1; t.motivo = 'Ajustado por você'; t.lembrar = true; }
  S.ing.resumo = FPIngest.resumir(S.ing.rows); renderIng();
}

function aplicarIngestao() {
  const g = S.ing; const rows = g.rows; const antes = { planos: clone(S.plans), regras: clone(S.profile.regras || []) };
  const res = FPIngest.aplicar(rows, { ensurePlan, newId: uid, nomeArquivo: g.nome });
  let ap = false; rows.filter((t) => t.lembrar && t.incluir && !t.duplicado).forEach((t) => { S.profile.regras = FPIngest.aprenderRegra(S.profile.regras, t); ap = true; });
  if (ap) touch('profile');
  res.anos.forEach((y) => { if (y === S.year) touch('plan'); else savePlanNow(y).catch(() => toast('Não foi possível salvar o ano ' + y + '. Tente de novo.')); });
  const meses = rows.filter((t) => t.incluir && !t.duplicado && t.ano === S.year).map((t) => t.mes);
  if (meses.length) { S.mes = Math.min(...meses); S.mesesAbertos = new Set([S.mes]); }
  const partes = [[res.despesas, 'gasto', 'gastos'], [res.rendas, 'entrada', 'entradas'], [res.investimentos, 'aporte', 'aportes'], [res.proventos, 'provento', 'proventos']].filter((x) => x[0]).map((x) => `${x[0]} ${x[0] === 1 ? x[1] : x[2]}`);
  if (res.conciliados) partes.push(`${res.conciliados} casados com o previsto`);
  S.ing = null; if (res.despesas && S.view !== 'despesas') S.view = 'despesas';
  const desfazer = () => {
    res.anos.forEach((y) => {
      if (antes.planos[y]) { S.plans[y] = antes.planos[y]; if (y === S.year) { S.plan = S.plans[y]; touch('plan'); } else savePlanNow(y).catch(() => toast('Não foi possível desfazer no ano ' + y + '.')); }
      else { delete S.plans[y]; Store.deletePlan(y, S.user).catch(() => {}); }
    });
    S.profile.regras = antes.regras; touch('profile'); render(); toast('Importação desfeita.');
  };
  setTimeout(() => { render(); const msg = voz('ingest_ok', { resumo: partes.join(', ') || 'nada novo' }); if (partes.length) toastAcao(msg, 'Desfazer', desfazer); else toast(msg); }, 0);
}

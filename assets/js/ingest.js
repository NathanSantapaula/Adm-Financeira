/* Financial planning: ingestão inteligente de extratos (CSV e OFX) e ponte para IA (PDF e relatórios).
   Módulo puro (sem DOM): roda no navegador e no Node (testes).
   Fluxo: bytes -> texto -> parse (OFX/CSV) -> transações normalizadas -> classificação -> chaves anti-duplicidade
          -> conciliação com gastos previstos -> prévia editável -> aplicar nas abas (despesas, rendas, investimentos, proventos). */
(function (root) {
  'use strict';
  const E = typeof module !== 'undefined' && module.exports ? require('./engine.js') : root.FPEngine;
  const { norm, r2, z } = E;
  const pad = (n) => String(n).padStart(2, '0');
  const DESTINOS = ['despesa', 'renda', 'investimento', 'provento', 'ignorar'];
  const clamp01 = (x) => Math.max(0, Math.min(1, +x || 0));

  /* ============================== leitura de bytes ============================== */
  function decodeBytes(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8);
    if (u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff) return new TextDecoder('utf-16be').decode(u8);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch (e) { return new TextDecoder('windows-1252').decode(u8); } // OFX de bancos costuma ser Windows-1252
  }
  const limpar = (t) => String(t || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  function detectarFormato(texto, nome) {
    if (/\.pdf$/i.test(nome || '')) return 'pdf';
    if (/<OFX[\s>]|OFXHEADER|<STMTTRN>/i.test(texto)) return 'ofx';
    return 'csv';
  }

  /* ============================== números e datas ============================== */
  function numeroBR(v) {
    if (typeof v === 'number') return isFinite(v) ? v : NaN;
    let s = String(v == null ? '' : v).replace(/\u00a0/g, ' ').replace(/[−–]/g, '-').trim();
    if (!s) return NaN;
    let neg = false;
    if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
    if (/^-/.test(s)) { neg = true; s = s.slice(1); }
    if (/-\s*$/.test(s)) { neg = true; s = s.replace(/-\s*$/, ''); }
    if (/\d\s*D\s*$/i.test(s)) neg = true; // "123,45 D" (débito)
    s = s.replace(/[^0-9.,]/g, '');
    if (!/\d/.test(s)) return NaN;
    const lc = s.lastIndexOf(','); const ld = s.lastIndexOf('.'); let dec = null;
    if (lc >= 0 && ld >= 0) dec = lc > ld ? ',' : '.';
    else if (lc >= 0) dec = /^\d{1,3}(,\d{3})+$/.test(s) ? null : ',';
    else if (ld >= 0) dec = /^\d{1,3}(\.\d{3})+$/.test(s) ? null : '.';
    const t = dec ? s.replace(dec === ',' ? /\./g : /,/g, '').replace(dec, '.') : s.replace(/[.,]/g, '');
    const n = Number(t);
    return Number.isNaN(n) ? NaN : neg ? -n : n;
  }
  function isoData(y, m, d) {
    if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2100)) return null;
    const dt = new Date(Date.UTC(y, m - 1, d)); if (dt.getUTCMonth() !== m - 1) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  }
  function parseData(v, anoPadrao) {
    if (v == null) return null;
    if (v instanceof Date) return isFinite(v) ? isoData(v.getFullYear(), v.getMonth() + 1, v.getDate()) : null;
    const s = String(v).trim().toLowerCase(); if (!s) return null; let m;
    if ((m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s))) return isoData(+m[1], +m[2], +m[3]);
    if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})(?!\d)/.exec(s))) {
      let a = +m[1]; let b = +m[2]; let y = +m[3]; if (y < 100) y += 2000;
      return a <= 12 && b > 12 ? isoData(y, a, b) : isoData(y, b, a); // dd/mm por padrão; mm/dd só se o 2º número passar de 12
    }
    if ((m = /^(\d{1,2})\s+(?:de\s+)?([a-zçã]{3,9})\.?(?:\s+(?:de\s+)?(\d{4}))?/.exec(s))) {
      const mi = E.monthIndex(m[2]); const y = m[3] ? +m[3] : anoPadrao; if (mi >= 0 && y) return isoData(y, mi + 1, +m[1]);
    }
    if ((m = /^(\d{1,2})[-/.](\d{1,2})(?![\d/.-])/.exec(s)) && anoPadrao) return isoData(anoPadrao, +m[2], +m[1]);
    return null;
  }

  /* ============================== OFX ============================== */
  const ent = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  const tagOFX = (bloco, tag) => { const m = new RegExp('<' + tag + '>\\s*([^<\\r\\n]*)', 'i').exec(bloco); return m ? ent(m[1].trim()) : ''; };
  const SAIDA_OFX = ['DEBIT', 'CHECK', 'PAYMENT', 'ATM', 'POS', 'FEE', 'SRVCHG', 'REPEATPMT', 'DIRECTDEBIT'];
  const ENTRADA_OFX = ['CREDIT', 'DEP', 'DIRECTDEP', 'INT', 'DIV'];
  function parseOFX(texto) {
    texto = limpar(texto); const avisos = []; const transacoes = [];
    const cartao = /<CCSTMTRS>|<CREDITCARDMSGSRSV1>/i.test(texto);
    const re = /<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|<\/CCSTMTRS>|<\/STMTRS>|$)/gi; let m;
    while ((m = re.exec(texto))) {
      const b = m[1]; const tipo = tagOFX(b, 'TRNTYPE').toUpperCase(); const dt = tagOFX(b, 'DTPOSTED');
      const data = /^\d{8}/.test(dt) ? isoData(+dt.slice(0, 4), +dt.slice(4, 6), +dt.slice(6, 8)) : null;
      let valor = numeroBR(tagOFX(b, 'TRNAMT').replace(/\s/g, ''));
      const nome = tagOFX(b, 'NAME'); const memo = tagOFX(b, 'MEMO');
      const descricao = [nome, memo].filter((x, i, a) => x && a.indexOf(x) === i).join(' - ') || '(sem descrição)';
      if (!data || !isFinite(valor)) { avisos.push(`Transação OFX ignorada (data ou valor ausente): ${descricao}`); continue; }
      if (SAIDA_OFX.includes(tipo)) valor = -Math.abs(valor); else if (ENTRADA_OFX.includes(tipo)) valor = Math.abs(valor); // o tipo manda; o sinal é o plano B
      transacoes.push({ data, descricao, valor: r2(valor), fitid: tagOFX(b, 'FITID'), tipoOfx: tipo, origem: 'ofx' });
    }
    if (!transacoes.length) avisos.push('Nenhuma transação encontrada no arquivo OFX.');
    return { formato: 'ofx', tipoConta: cartao ? 'cartao' : 'extrato', conta: { banco: tagOFX(texto, 'BANKID') || tagOFX(texto, 'ORG'), id: tagOFX(texto, 'ACCTID') }, moeda: tagOFX(texto, 'CURDEF') || 'BRL', transacoes, avisos };
  }

  /* ============================== CSV ============================== */
  function contarFora(l, d) { let q = false; let c = 0; for (const ch of l) { if (ch === '"') q = !q; else if (ch === d && !q) c++; } return c; }
  function detectarDelimitador(texto) {
    const linhas = texto.split('\n').filter((l) => l.trim()).slice(0, 12); let best = ';'; let bestScore = -1;
    for (const d of [';', ',', '\t', '|']) {
      const counts = linhas.map((l) => contarFora(l, d)).filter((c) => c > 0); if (!counts.length) continue;
      const freq = {}; counts.forEach((c) => { freq[c] = (freq[c] || 0) + 1; }); const modo = +Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
      const score = freq[modo] * 10 + modo; if (score > bestScore) { best = d; bestScore = score; }
    }
    return best;
  }
  function splitCSV(texto, d) {
    const rows = []; let row = []; let cur = ''; let q = false;
    for (let i = 0; i < texto.length; i++) {
      const ch = texto[i];
      if (q) { if (ch === '"') { if (texto[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === d) { row.push(cur.trim()); cur = ''; }
      else if (ch === '\n') { row.push(cur.trim()); rows.push(row); row = []; cur = ''; }
      else cur += ch;
    }
    row.push(cur.trim()); if (row.some((c) => c !== '')) rows.push(row);
    return rows.filter((r) => r.some((c) => c !== ''));
  }
  const VOC = {
    data: ['data', 'date', 'dt', 'posted', 'movimentacao'], valor: ['valor', 'amount', 'quantia', 'vlr', 'value'],
    debito: ['debito', 'saida', 'debit', 'saidas'], credito: ['credito', 'entrada', 'credit', 'entradas'],
    descricao: ['descricao', 'historico', 'estabelecimento', 'title', 'titulo', 'lancamento', 'detalhe', 'memo', 'nome', 'transacao', 'description', 'beneficiario'],
    tipo: ['tipo', 'type', 'd/c', 'dc', 'natureza'], categoria: ['categoria', 'category'], saldo: ['saldo', 'balance'],
  };
  const ehCab = (c) => { const n = norm(c); return n && Object.values(VOC).some((l) => l.some((k) => n === k || n.includes(k))); };
  function mapearColunas(header) {
    const map = { data: -1, descricao: -1, valor: -1, debito: -1, credito: -1, tipo: -1, categoria: -1, saldo: -1 };
    const n = header.map((c) => norm(c)); let melhorDesc = 99;
    n.forEach((c, i) => {
      if (!c) return;
      if (c.includes('saldo') || c.includes('balance')) { if (map.saldo < 0) map.saldo = i; return; }
      if (/(^|\s)(data|date|dt)(\s|$)|^posted/.test(c) && map.data < 0) { map.data = i; return; }
      if (VOC.debito.some((k) => c.includes(k)) && map.debito < 0) { map.debito = i; return; }
      if (VOC.credito.some((k) => c.includes(k)) && map.credito < 0) { map.credito = i; return; }
      if (VOC.valor.some((k) => c === k || c.startsWith(k + ' ') || c.includes(k)) && map.valor < 0) { map.valor = i; return; }
      if (VOC.categoria.some((k) => c.includes(k)) && map.categoria < 0) { map.categoria = i; return; }
      if (VOC.tipo.some((k) => c === k) && map.tipo < 0) { map.tipo = i; return; }
      const p = VOC.descricao.findIndex((k) => c === k || c.includes(k)); if (p >= 0 && p < melhorDesc) { melhorDesc = p; map.descricao = i; }
    });
    return map;
  }
  function inferirColunas(linhas, anoPadrao) { // sem cabeçalho: descobre pelo conteúdo
    const w = Math.max(...linhas.map((r) => r.length)); const amostra = linhas.slice(0, 40); const map = { data: -1, descricao: -1, valor: -1, debito: -1, credito: -1, tipo: -1, categoria: -1, saldo: -1 };
    let melhorTxt = 0;
    for (let c = 0; c < w; c++) {
      const cel = amostra.map((r) => r[c] || '').filter(Boolean); if (!cel.length) continue;
      const datas = cel.filter((x) => parseData(x, anoPadrao)).length / cel.length; const nums = cel.filter((x) => isFinite(numeroBR(x))).length / cel.length;
      const txt = cel.reduce((a, x) => a + x.length, 0) / cel.length;
      if (datas > 0.6 && map.data < 0) map.data = c; else if (nums > 0.6 && datas < 0.3) { if (map.valor < 0) map.valor = c; else if (map.saldo < 0) map.saldo = c; } else if (txt > melhorTxt && nums < 0.3) { melhorTxt = txt; map.descricao = c; }
    }
    return map;
  }
  function lerCSV(texto) {
    texto = limpar(texto); const delim = detectarDelimitador(texto); const linhas = splitCSV(texto, delim); let cab = -1;
    for (let i = 0; i < Math.min(linhas.length, 15); i++) { if (linhas[i].filter(ehCab).length >= 2) { cab = i; break; } }
    return { delim, linhas, cabIdx: cab, cabecalho: cab >= 0 ? linhas[cab] : null, dados: linhas.slice(cab + 1) };
  }
  const DC_SAIDA = /^(d|deb|debito|saida|s)$/; const DC_ENTRADA = /^(c|cred|credito|entrada|e)$/;
  function normalizarCSV(lido, mapa, opt) {
    opt = opt || {}; const avisos = []; const out = []; let pulou = 0;
    lido.dados.forEach((r, i) => {
      const linhaN = lido.cabIdx + 2 + i; const data = parseData(r[mapa.data], opt.anoPadrao); const dsc = String(r[mapa.descricao] || '').trim();
      if (/^saldo(\s|$)/.test(norm(dsc)) || /\bsaldo (anterior|final|do dia|inicial)\b/.test(norm(dsc))) return;
      let valor = NaN;
      if (mapa.valor >= 0) {
        valor = numeroBR(r[mapa.valor]);
        if (mapa.tipo >= 0 && isFinite(valor)) { const t = norm(r[mapa.tipo]); if (DC_SAIDA.test(t)) valor = -Math.abs(valor); else if (DC_ENTRADA.test(t)) valor = Math.abs(valor); }
        if (opt.tipoConta === 'cartao' && isFinite(valor) && !(mapa.tipo >= 0)) valor = -valor; // fatura: positivo = compra
      } else if (mapa.debito >= 0 || mapa.credito >= 0) {
        const d = numeroBR(r[mapa.debito]); const c = numeroBR(r[mapa.credito]);
        valor = (isFinite(c) ? Math.abs(c) : 0) - (isFinite(d) ? Math.abs(d) : 0); if (!isFinite(c) && !isFinite(d)) valor = NaN;
      }
      if (!data || !isFinite(valor) || valor === 0) { if (r.some((x) => x)) { pulou++; if (avisos.length < 6) avisos.push(`Linha ${linhaN} ignorada (data ou valor não reconhecidos).`); } return; }
      out.push({ data, descricao: dsc || '(sem descrição)', valor: r2(valor), fitid: '', origem: 'csv', categoriaOrigem: mapa.categoria >= 0 ? r[mapa.categoria] || '' : '' });
    });
    if (pulou > 6) avisos.push(`E mais ${pulou - 6} linhas ignoradas.`);
    if (!out.length) avisos.push('Nenhuma transação reconhecida. Confira o mapeamento das colunas.');
    return { transacoes: out, avisos };
  }
  function parseCSV(texto, opt) {
    opt = opt || {}; const lido = lerCSV(texto); const nomeArq = opt.nomeArquivo || '';
    const b3 = parseB3(lido.linhas, opt); if (b3) return b3;
    let mapa; let confianca = 1;
    if (lido.cabecalho) mapa = mapearColunas(lido.cabecalho);
    else { mapa = inferirColunas(lido.linhas, opt.anoPadrao); lido.dados = lido.linhas; confianca = 0.5; }
    if (mapa.data < 0 || mapa.descricao < 0 || (mapa.valor < 0 && mapa.debito < 0 && mapa.credito < 0)) confianca = Math.min(confianca, 0.3);
    const cab = lido.cabecalho ? lido.cabecalho.map(norm) : [];
    const cartao = (cab.includes('title') && cab.includes('category')) || /fatura|cartao|nubank|card/i.test(nomeArq);
    const tipoConta = opt.tipoConta || (cartao ? 'cartao' : 'extrato');
    const n = normalizarCSV(lido, mapa, { anoPadrao: opt.anoPadrao, tipoConta });
    return { formato: 'csv', delimitador: lido.delim, cabecalho: lido.cabecalho, mapeamento: mapa, confianca, tipoConta, lido, transacoes: n.transacoes, avisos: n.avisos };
  }


  /* ============================== corretora e B3 (Área do Investidor) ==============================
     Lê os dois relatórios que qualquer investidor baixa em investidor.b3.com.br (Extratos):
       Movimentação: Entrada/Saída | Data | Movimentação | Produto | Instituição | Quantidade | Preço unitário | Valor da Operação
       Negociação:   Data do Negócio | Tipo de Movimentação | Mercado | Prazo/Vencimento | Instituição | Código de Negociação | Quantidade | Preço | Valor
     Também serve para relatórios de corretoras com essas colunas. Sinal: compra = saída de dinheiro (valor negativo), venda/resgate = entrada,
     provento = entrada. Assim o resto da ingestão (aportes e proventos) funciona sem mudanças. */
  const TICK_B3 = /^([A-Z]{4}\d{1,2})F?$/;
  function ativoDeProduto(produto) {
    const bruto = String(produto || '').trim(); const up = norm(bruto).toUpperCase();
    const cod = up.split(/\s+-\s+|\s+/)[0].replace(/[^A-Z0-9]/g, ''); const t = TICK_B3.exec(cod);
    const desc = up.slice(cod.length);
    if (/TESOURO/.test(up)) return { nome: bruto.replace(/\s+/g, ' ').slice(0, 48), tipo: 'RENDA FIXA', classe: 'Tesouro Direto' };
    if (/^(CDB|LCI|LCA|LC|LIG|RDB)\b/.test(up)) return { nome: bruto.replace(/\s+/g, ' ').slice(0, 48), tipo: 'RENDA FIXA', classe: "CDB's" };
    if (/^(CRI|CRA|DEB|DEBENTURE)\b/.test(up)) return { nome: bruto.replace(/\s+/g, ' ').slice(0, 48), tipo: 'RENDA FIXA', classe: 'Crédito privado' };
    if (t) {
      const tk = t[1]; const sufixo = +tk.slice(4);
      let classe = 'Ações BR';
      if (/\bETF\b|INDEX|ISHARES|IT NOW|TREND|FUNDO DE INDICE/.test(desc)) classe = "ETF's";
      else if (sufixo === 11) classe = /\bUNT\b|\bUNIT\b|\bN[12M]\b|\bEDJ\b/.test(desc) ? 'Ações BR' : 'Fundos Imobiliários';
      else if (sufixo >= 32 && sufixo <= 39) classe = 'Ações EUA';
      return { nome: tk, tipo: 'BOLSA DE VALORES', classe };
    }
    return { nome: (bruto || 'Ativo (a classificar)').replace(/\s+/g, ' ').slice(0, 48), tipo: 'RENDA FIXA', classe: 'Aplicações' };
  }
  const B3_PROVENTO = ['DIVIDENDO', 'JUROS SOBRE CAPITAL', 'JCP', 'RENDIMENTO', 'JUROS', 'CUPOM', 'REEMBOLSO', 'RESTITUICAO DE CAPITAL'];
  const B3_COMPRA_VENDA = ['TRANSFERENCIA - LIQUIDACAO', 'TRANSFERENCIA LIQUIDACAO', 'LIQUIDACAO', 'COMPRA', 'VENDA', 'APLICACAO', 'SUBSCRICAO'];
  const B3_RESGATE = ['RESGATE', 'VENCIMENTO', 'AMORTIZACAO', 'RESGATE ANTECIPADO', 'LEILAO DE FRACAO', 'FRACAO EM ATIVOS'];
  function cabecalhoB3(linhas) {
    for (let i = 0; i < Math.min(linhas.length, 12); i++) {
      const n = (linhas[i] || []).map((c) => norm(c));
      const col = (...ks) => n.findIndex((c) => ks.some((k) => c === k || c.startsWith(k)));
      if (n.some((c) => c === 'movimentacao') && n.some((c) => c.startsWith('produto'))) return { tipo: 'movimentacao', i, es: col('entrada/saida', 'entrada / saida', 'entrada'), data: col('data'), mov: col('movimentacao'), prod: col('produto'), qtd: col('quantidade'), preco: col('preco unitario', 'preco'), valor: col('valor da operacao', 'valor'), inst: col('instituicao') };
      if (n.some((c) => c.startsWith('codigo de negociacao')) && n.some((c) => c.startsWith('tipo de movimentacao'))) return { tipo: 'negociacao', i, data: col('data do negocio', 'data'), mov: col('tipo de movimentacao'), prod: col('codigo de negociacao'), qtd: col('quantidade'), preco: col('preco'), valor: n.findIndex((c) => c === 'valor' || c.startsWith('valor (') || c === 'valor total'), inst: col('instituicao'), merc: col('mercado') };
    }
    return null;
  }
  function parseB3(linhas, opt) {
    opt = opt || {}; const cab = cabecalhoB3(linhas); if (!cab) return null;
    const out = []; const avisos = []; let semValor = 0; let pulou = 0;
    linhas.slice(cab.i + 1).forEach((r, k) => {
      if (!r || !r.some((c) => c !== '' && c != null)) return;
      const data = parseData(r[cab.data], opt.anoPadrao); const movBruto = String(r[cab.mov] || '').trim(); const mov = norm(movBruto).toUpperCase();
      const prod = String(r[cab.prod] || '').trim(); const qtd = numeroBR(r[cab.qtd]); let valor = numeroBR(r[cab.valor]);
      if (!isFinite(valor) || valor === 0) { const pu = numeroBR(r[cab.preco]); if (isFinite(pu) && isFinite(qtd)) valor = Math.abs(pu * qtd); }
      if (!data) { pulou++; if (avisos.length < 5) avisos.push(`Linha ${cab.i + 2 + k} ignorada (data não reconhecida).`); return; }
      const ativo = ativoDeProduto(prod); const qtdTxt = isFinite(qtd) && qtd ? ` · ${qtd.toLocaleString('pt-BR', { maximumFractionDigits: 8 })} ${ativo.tipo === 'RENDA FIXA' ? 'un.' : 'cotas'}` : '';
      const descricao = `${movBruto || 'Movimentação'} · ${ativo.nome}${qtdTxt}`;
      const credito = cab.tipo === 'movimentacao' ? /^CRED|^ENTRADA/.test(norm(r[cab.es]).toUpperCase()) : !/VENDA/.test(mov);
      const base = { data, descricao, fitid: '', origem: 'b3', preclassificado: true, ativo, quantidade: isFinite(qtd) ? qtd : null, catTipo: 'variavel', area: '', sub: '' };
      const sem = !isFinite(valor) || Math.abs(valor) < 0.005; const v = Math.abs(valor);
      const has = (lista) => lista.some((x) => mov === x || mov.startsWith(x) || mov.includes(x));
      if (cab.tipo === 'negociacao') {
        if (sem) { semValor++; return; }
        const venda = /VENDA/.test(mov);
        out.push(Object.assign(base, { valor: r2(venda ? v : -v), destino: 'investimento', confianca: 0.95, motivo: venda ? 'Venda registrada na B3' : 'Compra registrada na B3' }));
        return;
      }
      if (has(B3_PROVENTO) && !/ATUALIZACAO/.test(mov)) {
        if (sem) { semValor++; return; }
        const transferido = /TRANSFERID/.test(mov);
        out.push(Object.assign(base, { valor: r2(v), destino: credito ? 'provento' : 'ignorar', confianca: transferido ? 0.55 : 0.95, motivo: transferido ? 'Provento "transferido": confira se não é repetido' : credito ? 'Provento pago pela B3' : 'Débito de provento: confira' }));
      } else if (has(B3_RESGATE)) {
        if (sem) { semValor++; return; }
        out.push(Object.assign(base, { valor: r2(v), destino: 'investimento', confianca: 0.85, motivo: 'Resgate, vencimento ou amortização (reduz o aporte)' }));
      } else if (has(B3_COMPRA_VENDA)) {
        if (sem) { semValor++; return; }
        out.push(Object.assign(base, { valor: r2(credito ? -v : v), destino: 'investimento', confianca: 0.95, motivo: credito ? 'Compra liquidada na B3' : 'Venda liquidada na B3' }));
      } else {
        if (sem) { semValor++; return; }
        out.push(Object.assign(base, { valor: r2(credito ? v : -v), destino: 'ignorar', confianca: 0.5, motivo: 'Evento da B3 não reconhecido: confira se é aporte, resgate ou provento' }));
      }
    });
    if (semValor) avisos.push(`${semValor} ${semValor === 1 ? 'evento sem valor financeiro (bonificação, desdobro, atualização ou transferência de custódia) foi ignorado' : 'eventos sem valor financeiro (bonificação, desdobro, atualização ou transferência de custódia) foram ignorados'}.`);
    if (pulou > 5) avisos.push(`E mais ${pulou - 5} linhas ignoradas.`);
    if (!out.length) avisos.push('Nenhuma movimentação com valor encontrada no relatório da B3.');
    return { formato: 'b3', relatorio: cab.tipo, tipoConta: 'corretora', confianca: 1, transacoes: out, avisos, mapeamento: null };
  }
  /* Planilha (.xlsx) já convertida em linhas: B3 primeiro; senão, o mesmo caminho do CSV. */
  function parseTabela(linhas, opt) {
    opt = opt || {}; linhas = (linhas || []).map((r) => (r || []).map((c) => (c == null ? '' : c))).filter((r) => r.some((c) => c !== ''));
    const b3 = parseB3(linhas, opt); if (b3) return b3;
    let cab = -1; for (let i = 0; i < Math.min(linhas.length, 15); i++) { if (linhas[i].filter((c) => typeof c === 'string' && ehCab(c)).length >= 2) { cab = i; break; } }
    const lido = { delim: null, linhas, cabIdx: cab, cabecalho: cab >= 0 ? linhas[cab].map(String) : null, dados: linhas.slice(cab + 1) };
    let mapa; let confianca = 1;
    if (lido.cabecalho) mapa = mapearColunas(lido.cabecalho); else { mapa = inferirColunas(linhas.map((r) => r.map((c) => (c instanceof Date ? c.toISOString().slice(0, 10) : String(c)))), opt.anoPadrao); lido.dados = linhas; confianca = 0.5; }
    const tipoConta = opt.tipoConta || 'extrato'; const n = normalizarCSV(lido, mapa, { anoPadrao: opt.anoPadrao, tipoConta });
    return { formato: 'csv', delimitador: null, cabecalho: lido.cabecalho, mapeamento: mapa, confianca, tipoConta, lido, transacoes: n.transacoes, avisos: n.avisos };
  }

  /* ============================== classificação automática ============================== */
  const R = (area, cat, sub, kws) => ({ area, cat, sub, kws });
  const REGRAS_DESPESA = [
    R('Moradia', 'fixa', 'Aluguel e condomínio', ['ALUGUEL', 'CONDOMINIO', 'IPTU', 'IMOBILIARIA']),
    R('Moradia', 'fixa', 'Contas da casa', ['ENERGIA', 'ENEL', 'CPFL', 'LIGHT', 'CEMIG', 'COPEL', 'CELESC', 'EQUATORIAL', 'NEOENERGIA', 'SABESP', 'COPASA', 'SANEPAR', 'CEDAE', 'AGUAS DE', 'COMGAS', 'NATURGY', 'ULTRAGAZ', 'LIQUIGAS']),
    R('Moradia', 'fixa', 'Internet e telefone', ['VIVO', 'CLARO', 'TIM', 'OI FIBRA', 'NET VIRTUA', 'INTERNET', 'TELEFONE', 'BRISANET', 'ALGAR']),
    R('Assinaturas', 'fixa', '', ['NETFLIX', 'SPOTIFY', 'DISNEY', 'HBO', 'MAX.COM', 'AMAZON PRIME', 'PRIME VIDEO', 'YOUTUBE', 'GLOBOPLAY', 'DEEZER', 'APPLE.COM/BILL', 'ICLOUD', 'GOOGLE ONE', 'GOOGLE *', 'ADOBE', 'MICROSOFT', 'OPENAI', 'CHATGPT', 'NOTION', 'DROPBOX', 'PARAMOUNT', 'CRUNCHYROLL', 'STEAM', 'XBOX', 'PLAYSTATION', 'NINTENDO']),
    R('Alimentação', 'variavel', 'Restaurantes e delivery', ['IFOOD', 'RAPPI', 'UBER EATS', 'RESTAURANTE', 'LANCHONETE', 'PADARIA', 'CAFE', 'CAFETERIA', 'STARBUCKS', 'MCDONALD', 'BURGER', 'SUBWAY', 'PIZZ', 'SUSHI', 'CHURRASC', 'BOTECO', 'CONFEITARIA', 'SORVETERIA', 'SPOLETO', 'OUTBACK', 'GIRAFFAS', 'HABIBS']),
    R('Transporte', 'variavel', 'Aplicativos', ['UBER', '99', '99POP', 'CABIFY', 'INDRIVER']),
    R('Transporte', 'variavel', 'Combustível', ['POSTO', 'SHELL', 'IPIRANGA', 'PETROBRAS', 'COMBUSTIVEL', 'GASOLINA', 'ETANOL']),
    R('Transporte', 'variavel', 'Estacionamento e pedágio', ['ESTACIONAMENTO', 'ESTAPAR', 'SEM PARAR', 'CONECTCAR', 'PEDAGIO', 'VELOE', 'ZONA AZUL']),
    R('Transporte', 'variavel', 'Transporte público', ['METRO', 'CPTM', 'BILHETE UNICO', 'SPTRANS', 'RIOCARD']),
    R('Saúde', 'variavel', 'Farmácia', ['FARMACIA', 'DROGARIA', 'DROGASIL', 'RAIA', 'PACHECO', 'PAGUE MENOS', 'PANVEL', 'ULTRAFARMA']),
    R('Saúde', 'fixa', 'Plano de saúde', ['UNIMED', 'AMIL', 'BRADESCO SAUDE', 'SULAMERICA', 'HAPVIDA', 'NOTREDAME', 'PORTO SAUDE', 'PLANO DE SAUDE', 'ODONTO']),
    R('Saúde', 'variavel', 'Consultas e exames', ['CLINICA', 'CONSULTA', 'LABORATORIO', 'HOSPITAL', 'FLEURY', 'DASA', 'MEDICO', 'DENTISTA', 'PSICOLOG', 'TERAPIA']),
    R('Saúde', 'fixa', 'Academia', ['ACADEMIA', 'SMART FIT', 'SMARTFIT', 'BLUEFIT', 'TOTALPASS', 'GYMPASS', 'WELLHUB', 'PILATES', 'CROSSFIT']),
    R('Educação', 'fixa', 'Escola e faculdade', ['ESCOLA', 'COLEGIO', 'FACULDADE', 'UNIVERSIDADE', 'MENSALIDADE', 'MATRICULA']),
    R('Educação', 'variavel', 'Cursos e livros', ['UDEMY', 'ALURA', 'COURSERA', 'DUOLINGO', 'LIVRARIA', 'SARAIVA', 'KINDLE', 'CURSO', 'HOTMART']),
    R('Lazer', 'variavel', 'Eventos e cultura', ['CINEMA', 'CINEMARK', 'INGRESSO', 'SYMPLA', 'TEATRO', 'EVENTIM', 'MUSEU', 'TICKETMASTER']),
    R('Viagens', 'variavel', '', ['HOTEL', 'BOOKING', 'AIRBNB', 'LATAM', 'GOL LINHAS', 'AZUL LINHAS', 'DECOLAR', 'CVC', 'PASSAGEM', 'HURB', 'LOCALIZA', 'MOVIDA', 'EXPEDIA']),
    R('Compras', 'variavel', 'Online', ['AMAZON', 'MERCADO LIVRE', 'MERCADOLIVRE', 'SHOPEE', 'MAGALU', 'MAGAZINE LUIZA', 'AMERICANAS', 'SHEIN', 'ALIEXPRESS', 'KABUM', 'CASAS BAHIA', 'PONTO FRIO']),
    R('Alimentação', 'variavel', 'Mercado', ['SUPERMERCADO', 'MERCADO', 'HIPERMERCADO', 'CARREFOUR', 'PAO DE ACUCAR', 'ASSAI', 'ATACADAO', 'SAMS CLUB', 'COSTCO', 'HORTIFRUTI', 'SACOLAO', 'EMPORIO', 'ACOUGUE', 'EXTRA']),
    R('Compras', 'variavel', 'Vestuário', ['RENNER', 'C&A', 'ZARA', 'RIACHUELO', 'MARISA', 'DECATHLON', 'CENTAURO', 'NETSHOES', 'HERING', 'AREZZO', 'OSKLEN']),
    R('Casa', 'variavel', 'Utilidades', ['LEROY', 'TELHANORTE', 'TOK STOK', 'TOKSTOK', 'CAMICADO', 'IKEA']),
    R('Pets', 'variavel', '', ['PETZ', 'COBASI', 'PETSHOP', 'PET SHOP', 'VETERIN', 'RACAO']),
    R('Cuidados pessoais', 'variavel', '', ['SALAO', 'BARBEARIA', 'CABELEIREIRO', 'MANICURE', 'ESTETICA', 'BOTICARIO', 'NATURA', 'SEPHORA', 'PERFUMARIA']),
    R('Seguros', 'fixa', '', ['SEGURO', 'PORTO SEGURO', 'TOKIO', 'LIBERTY', 'ALLIANZ', 'MAPFRE']),
    R('Impostos e taxas', 'variavel', '', ['IOF', 'TARIFA', 'ANUIDADE', 'IMPOSTO', 'DARF', 'DAS', 'INSS', 'IPVA', 'MULTA', 'TAXA', 'JUROS', 'DETRAN', 'CARTORIO']),
    R('Doações', 'variavel', '', ['DOACAO', 'IGREJA', 'DIZIMO', 'VAKINHA']),
    R('Transferências', 'variavel', 'Pix e TED', ['PIX ENVIADO', 'PIX ENVIO', 'TRANSFERENCIA ENVIADA', 'TED ENVIADA', 'TRANSF ENVIADA', 'DOC ENVIADO', 'PIX']),
  ];
  const KW_NEUTRO = ['PAGAMENTO DE FATURA', 'PAGTO FATURA', 'PGTO FATURA', 'PAG FATURA', 'PAGAMENTO FATURA', 'PAGAMENTO RECEBIDO', 'SALDO ANTERIOR', 'SALDO FINAL', 'SALDO DO DIA', 'SALDO DISPONIVEL', 'SALDO INICIAL', 'TRANSFERENCIA ENTRE CONTAS', 'TRANSF ENTRE CONTAS', 'MESMA TITULARIDADE', 'TED PROPRIA', 'APLICACAO AUTOMATICA', 'RESGATE AUTOMATICO', 'APLIC AUTOM', 'RESG AUTOM'];
  const KW_ESTORNO = ['ESTORNO', 'REEMBOLSO', 'DEVOLUCAO', 'CASHBACK', 'CHARGEBACK'];
  const KW_PROVENTO = ['DIVIDENDO', 'JCP', 'JUROS S/CAPITAL', 'JUROS SOBRE CAPITAL', 'RENDIMENTO', 'PROVENTO', 'CUPOM', 'REND PAGO'];
  const KW_INVEST = ['APLICACAO', 'RESGATE', 'CDB', 'LCI', 'LCA', 'TESOURO', 'PREVIDENCIA', 'FUNDO DE INVEST', 'FUNDOS DE INVEST', 'CORRETORA', 'XP INVEST', 'XP INC', 'RICO INVEST', 'CLEAR CORRETORA', 'BTG PACTUAL', 'NUINVEST', 'INTER INVEST', 'COMPRA DE ACOES', 'LIQUIDACAO B3', 'TESOURO DIRETO'];
  const KW_SALARIO = ['SALARIO', 'FOLHA', 'PAGTO SAL', 'PGTO SAL', 'PRO LABORE', 'PROLABORE', 'REMUNERACAO', 'DECIMO TERCEIRO', '13O SAL', 'FERIAS', 'VENCIMENTOS'];
  const TICKER = /(^|[^A-Z0-9])([A-Z]{4}(?:3|4|5|6|11|33|34|35))(?![A-Z0-9])/;

  const textoNorm = (d) => ' ' + norm(d).toUpperCase().replace(/[^A-Z0-9&*./ ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const casa = (n, kw) => { // palavras curtas (até 4 letras) casam inteiras; as longas casam como prefixo de palavra
    const e = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^A-Z0-9])' + e + (kw.length <= 4 ? '([^A-Z0-9]|$)' : '')).test(n);
  };
  const algum = (n, lista) => lista.find((k) => casa(n, k));
  function chaveComercio(desc) {
    const t = textoNorm(desc).replace(/\d+/g, ' ').replace(/[^A-Z&* ]/g, ' ').split(/\s+/).filter((x) => x.length >= 3 && !['COMPRA', 'CARTAO', 'DEBITO', 'CREDITO', 'PAGAMENTO', 'PAGTO', 'PGTO', 'NO', 'EM'].includes(x));
    return t.slice(0, 3).join(' ').slice(0, 28);
  }
  function especAtivo(descN, ativos) {
    const ex = (ativos || []).find((a) => a.nome && descN.includes(' ' + norm(a.nome).toUpperCase() + ' '));
    if (ex) return { nome: ex.nome, tipo: ex.tipo, classe: ex.classe, existente: true };
    const t = TICKER.exec(descN);
    if (t) return { nome: t[2], tipo: 'BOLSA DE VALORES', classe: /11$/.test(t[2]) ? 'Fundos Imobiliários' : 'Ações BR' };
    if (/TESOURO/.test(descN)) return { nome: 'Tesouro (a classificar)', tipo: 'RENDA FIXA', classe: 'Tesouro Direto' };
    if (/\bCDB\b|\bLCI\b|\bLCA\b/.test(descN)) return { nome: 'Renda fixa (a classificar)', tipo: 'RENDA FIXA', classe: "CDB's" };
    return { nome: 'Aportes (a classificar)', tipo: 'RENDA FIXA', classe: 'Aplicações' };
  }
  function classificar(tx, ctx) {
    ctx = ctx || {}; const n = textoNorm(tx.descricao); const saida = tx.valor < 0;
    const base = (o) => Object.assign({ destino: 'despesa', catTipo: 'variavel', area: 'Outros', sub: '', ativo: null, confianca: 0.3, motivo: 'Sem correspondência: revise' }, o);
    for (const r of ctx.regrasUsuario || []) { if (r.padrao && n.includes(' ' + r.padrao + ' ') || (r.padrao && chaveComercio(tx.descricao) === r.padrao)) return base({ destino: r.destino, catTipo: r.catTipo || 'variavel', area: r.area || 'Outros', sub: r.sub || '', ativo: r.ativoNome ? { nome: r.ativoNome, tipo: r.ativoTipo || 'RENDA FIXA', classe: r.ativoClasse || 'Aplicações' } : null, confianca: 1, motivo: 'Sua regra aprendida' }); }
    if (algum(n, KW_NEUTRO)) return base({ destino: 'ignorar', area: '', confianca: 0.95, motivo: 'Movimento neutro (fatura, saldo ou transferência própria)' });
    if (!saida) {
      if (algum(n, KW_ESTORNO)) return base({ destino: 'despesa', area: 'Outros', confianca: 0.7, motivo: 'Estorno reduz o gasto' });
      if (algum(n, KW_PROVENTO)) return base({ destino: 'provento', ativo: especAtivo(n, ctx.ativos), confianca: 0.85, motivo: 'Dividendo ou rendimento' });
      if (algum(n, KW_INVEST)) return base({ destino: 'investimento', ativo: especAtivo(n, ctx.ativos), confianca: 0.8, motivo: 'Resgate de investimento' });
      if (algum(n, KW_SALARIO)) return base({ destino: 'renda', catTipo: 'fixa', area: 'Salário', confianca: 0.9, motivo: 'Salário ou remuneração' });
      return base({ destino: 'renda', catTipo: 'extra', area: 'Outras entradas', confianca: 0.45, motivo: 'Entrada: confirme se é renda' });
    }
    if (algum(n, KW_INVEST) || TICKER.test(n)) return base({ destino: 'investimento', ativo: especAtivo(n, ctx.ativos), confianca: 0.8, motivo: 'Aplicação ou compra de ativo' });
    for (const r of REGRAS_DESPESA) { const k = algum(n, r.kws); if (k) return base({ destino: 'despesa', catTipo: r.cat, area: r.area, sub: r.sub, confianca: k.length >= 6 ? 0.9 : 0.75, motivo: `Reconhecido: ${k.toLowerCase()}` }); }
    return base({});
  }
  function aprenderRegra(regras, t) {
    const padrao = chaveComercio(t.descricao); if (!padrao) return regras || [];
    const nova = { padrao, destino: t.destino, catTipo: t.catTipo, area: t.area, sub: t.sub || '', ativoNome: t.ativo ? t.ativo.nome : '', ativoTipo: t.ativo ? t.ativo.tipo : '', ativoClasse: t.ativo ? t.ativo.classe : '' };
    return (regras || []).filter((r) => r.padrao !== padrao).concat(nova);
  }

  /* ============================== chaves, duplicidade e conciliação ============================== */
  function hash53(str) {
    let h1 = 0xdeadbeef; let h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const tokens = (s) => new Set(textoNorm(s).split(' ').filter((x) => x.length >= 3));
  function sugerirConciliacao(t, plan) {
    if (!plan || t.destino !== 'despesa' || t.valor >= 0) return null; const gasto = -t.valor; const td = tokens(t.descricao); let melhor = null;
    for (const it of plan.despesas || []) {
      const v = E.itemValores(it, plan.year)[t.mes]; if (!(v > 0)) continue;
      const diff = Math.abs(v - gasto); const casaValor = diff <= Math.max(0.5, 0.01 * v) ? 0.6 : diff / v <= 0.1 ? 0.2 : 0; if (!casaValor) continue;
      const ti = tokens([it.nome, it.sub, it.area].join(' ')); let inter = 0; ti.forEach((x) => { if (td.has(x)) inter++; });
      const sobre = ti.size ? Math.min(0.4, (inter / Math.min(ti.size, 3)) * 0.4) : 0; const area = norm(it.area) === norm(t.area) ? 0.1 : 0;
      const score = casaValor + sobre + area; if (score >= 0.75 && (!melhor || score > melhor.score)) melhor = { itemId: it.id, nome: it.nome, valor: v, score: r2(score) };
    }
    return melhor;
  }

  function processar(parsed, ctx) {
    ctx = ctx || {}; const txs = parsed.transacoes.map((t, i) => Object.assign({}, t, { idx: i })); const cont = {};
    txs.forEach((t) => { const b = hash53(`${t.data}|${t.valor.toFixed(2)}|${norm(t.descricao)}|${t.fitid || ''}`); cont[b] = (cont[b] || 0) + 1; t.chave = b + '#' + cont[b]; });
    txs.forEach((t) => {
      if (!t.preclassificado) Object.assign(t, classificar(t, ctx));
      t.ano = +t.data.slice(0, 4); t.mes = +t.data.slice(5, 7) - 1; const plan = ctx.planos && ctx.planos[t.ano];
      t.duplicado = !!(plan && plan.ingestao && plan.ingestao.chaves && plan.ingestao.chaves[t.chave]); t.planoNovo = !plan; t.bloqueado = '';
      if ((t.destino === 'investimento' || t.destino === 'provento') && ctx.permiteInvest === false) t.bloqueado = 'Disponível no plano Investidor';
      t.conciliar = sugerirConciliacao(t, plan); t.conciliarAceito = !!t.conciliar;
      t.incluir = !t.duplicado && !t.bloqueado && t.destino !== 'ignorar';
    });
    return { transacoes: txs, resumo: resumir(txs) };
  }
  function resumir(txs) {
    const r = { total: txs.length, incluidas: 0, duplicadas: 0, ignoradas: 0, bloqueadas: 0, revisar: 0, conciliaveis: 0, anos: [], porDestino: { despesa: { n: 0, valor: 0 }, renda: { n: 0, valor: 0 }, investimento: { n: 0, valor: 0 }, provento: { n: 0, valor: 0 } } };
    const anos = new Set();
    txs.forEach((t) => {
      if (t.duplicado) { r.duplicadas++; return; } if (t.bloqueado) { r.bloqueadas++; return; }
      if (!t.incluir) { r.ignoradas++; return; }
      r.incluidas++; anos.add(t.ano); const d = r.porDestino[t.destino]; if (d) { d.n++; d.valor = r2(d.valor + Math.abs(t.valor)); }
      if (t.confianca < 0.6) r.revisar++; if (t.conciliar && t.conciliarAceito) r.conciliaveis++;
    });
    r.anos = [...anos].sort(); return r;
  }

  /* ============================== aplicar nas abas ============================== */
  const catDespId = (plan, tipo) => { plan.catsDesp = plan.catsDesp || []; let c = plan.catsDesp.find((x) => x.id === tipo || norm(x.nome).includes(tipo === 'fixa' ? 'fixa' : 'variavel')); if (!c) { c = { id: tipo, nome: tipo === 'fixa' ? 'Despesa fixa' : 'Despesa variável' }; plan.catsDesp.push(c); } return c.id; };
  const catRendaId = (plan, tipo) => { plan.rendaCats = plan.rendaCats || []; let c = plan.rendaCats.find((x) => x.id === tipo || norm(x.nome).includes(tipo === 'fixa' ? 'fixa' : 'extra')); if (!c) { c = { id: tipo, nome: tipo === 'fixa' ? 'Renda fixa' : 'Renda extra' }; plan.rendaCats.push(c); } return c.id; };
  function nomeRenda(desc, area) {
    const t = textoNorm(desc).replace(/\d+/g, ' ').split(' ').filter((x) => x.length >= 3 && !['PIX', 'RECEBIDO', 'RECEBIDA', 'TRANSFERENCIA', 'TED', 'DOC', 'CREDITO', 'PAGAMENTO', 'DEP', 'DEPOSITO', 'REC'].includes(x)).slice(0, 3);
    const s = t.map((x) => x[0] + x.slice(1).toLowerCase()).join(' '); return s || area || 'Entradas importadas';
  }
  function garantirAtivo(plan, spec, newId) {
    plan.ativos = plan.ativos || []; const k = E.ativoKey({ tipo: spec.tipo, classe: spec.classe, grupo: spec.grupo, subgrupo: spec.subgrupo, nome: spec.nome });
    let a = plan.ativos.find((x) => E.ativoKey(x) === k) || plan.ativos.find((x) => norm(x.nome) === norm(spec.nome));
    if (!a) { a = { id: newId(), tipo: spec.tipo, classe: spec.classe, grupo: spec.grupo || null, subgrupo: spec.subgrupo || null, nome: spec.nome, ap: z(), pr: z() }; plan.ativos.push(a); }
    return a;
  }
  function aplicar(rows, ctx) {
    const res = { despesas: 0, rendas: 0, investimentos: 0, proventos: 0, conciliados: 0, ignorados: 0, duplicados: 0, anos: [], valores: { despesas: 0, rendas: 0, investimentos: 0, proventos: 0 } }; const anos = new Set();
    rows.forEach((t) => {
      if (t.duplicado) { res.duplicados++; return; } if (!t.incluir || t.destino === 'ignorar' || t.bloqueado) { res.ignorados++; return; }
      const plan = ctx.ensurePlan(t.ano); plan.ingestao = plan.ingestao || { chaves: {}, arquivos: [] };
      if (plan.ingestao.chaves[t.chave]) { res.duplicados++; return; }
      anos.add(t.ano);
      if (t.destino === 'despesa') {
        let cat = catDespId(plan, t.catTipo); let area = t.area || 'Outros'; let sub = t.sub || ''; let itemId;
        if (t.conciliar && t.conciliarAceito) { const it = (plan.despesas || []).find((x) => x.id === t.conciliar.itemId); if (it) { it.baixas = it.baixas || {}; it.baixas[t.ano + '-' + t.mes] = true; cat = it.cat; area = it.area; sub = it.sub || ''; itemId = it.id; res.conciliados++; } }
        plan.lancamentos = plan.lancamentos || []; plan.lancamentos.push({ id: ctx.newId(), data: t.data, desc: t.descricao, valor: r2(-t.valor), cat, area, sub, origem: t.origem || 'import', chave: t.chave, itemId });
        res.despesas++; res.valores.despesas = r2(res.valores.despesas - t.valor);
      } else if (t.destino === 'renda') {
        const cat = catRendaId(plan, t.catTipo === 'fixa' ? 'fixa' : 'extra'); const nome = t.itemRenda || nomeRenda(t.descricao, t.area); plan.rendas = plan.rendas || [];
        let it = plan.rendas.find((x) => x.cat === cat && norm(x.nome) === norm(nome)); if (!it) { it = { id: ctx.newId(), cat, nome, fonte: 'Importado', valores: z() }; plan.rendas.push(it); }
        it.valores[t.mes] = r2((it.valores[t.mes] || 0) + t.valor); res.rendas++; res.valores.rendas = r2(res.valores.rendas + t.valor);
      } else if (t.destino === 'investimento' || t.destino === 'provento') {
        const a = garantirAtivo(plan, t.ativo || especAtivo(textoNorm(t.descricao), plan.ativos), ctx.newId);
        if (t.destino === 'investimento') { a.ap[t.mes] = r2((a.ap[t.mes] || 0) - t.valor); res.investimentos++; res.valores.investimentos = r2(res.valores.investimentos - t.valor); }
        else { a.pr[t.mes] = r2((a.pr[t.mes] || 0) + Math.abs(t.valor)); res.proventos++; res.valores.proventos = r2(res.valores.proventos + Math.abs(t.valor)); }
      }
      plan.ingestao.chaves[t.chave] = t.data;
    });
    res.anos = [...anos].sort();
    res.anos.forEach((y) => { const p = ctx.ensurePlan(y); p.ingestao.arquivos = (p.ingestao.arquivos || []).concat({ nome: ctx.nomeArquivo || 'arquivo', em: new Date().toISOString(), linhas: rows.filter((t) => t.ano === y && t.incluir && !t.duplicado).length }).slice(-30); });
    return res;
  }

  /* ============================== ponte com IA (Supabase Edge Function) ============================== */
  function montarPayloadIA(o) {
    o = o || {};
    return {
      versao: 1, modo: o.modo || 'extrair', // 'extrair' (PDF/relatório inteiro) ou 'categorizar' (só linhas de baixa confiança)
      arquivo: o.arquivo ? { nome: o.arquivo.nome, tipo: o.arquivo.tipo || 'application/pdf', tamanho: o.arquivo.tamanho || 0, caminho: o.arquivo.caminho || '' } : null,
      contexto: { anoPadrao: o.ano, moeda: 'BRL', tipoConta: o.tipoConta || 'extrato', categoriasDespesa: o.categoriasDespesa || [], categoriasRenda: o.categoriasRenda || [], ativos: o.ativos || [], regras: (o.regras || []).slice(0, 80) },
      transacoes: (o.transacoes || []).map((t) => ({ id: t.chave || String(t.idx), data: t.data, descricao: t.descricao, valor: t.valor })),
      instrucoes: 'Devolva JSON {versao:1, transacoes:[{id, data (AAAA-MM-DD), descricao, valor (negativo = saída), destino (despesa|renda|investimento|provento|ignorar), catTipo (fixa|variavel), area, sub, ativo, confianca (0 a 1)}], avisos:[]}. Não invente transações.',
    };
  }
  function validarRespostaIA(resp, opt) {
    opt = opt || {}; const avisos = [];
    if (!resp || !Array.isArray(resp.transacoes)) return { ok: false, erro: 'A resposta da IA não trouxe transações.', transacoes: [], avisos };
    const out = [];
    resp.transacoes.forEach((x, i) => {
      const data = parseData(x && x.data, opt.anoPadrao); const valor = typeof (x && x.valor) === 'number' ? x.valor : numeroBR(x && x.valor); const desc = String((x && x.descricao) || '').trim();
      if (!data || !isFinite(valor) || valor === 0 || !desc) { avisos.push(`Linha ${i + 1} da IA ignorada (dados incompletos).`); return; }
      const t = { data, descricao: desc, valor: r2(valor), fitid: String((x && x.id) || ''), origem: 'ia' };
      if (DESTINOS.includes(x.destino)) {
        Object.assign(t, { preclassificado: true, destino: x.destino, catTipo: x.catTipo === 'fixa' ? 'fixa' : 'variavel', area: String(x.area || 'Outros'), sub: String(x.sub || ''), confianca: clamp01(x.confianca == null ? 0.7 : x.confianca), motivo: 'Sugestão da IA' });
        if (x.ativo) t.ativo = { nome: String(x.ativo), tipo: /tesouro|cdb|lci|lca|renda fixa/i.test(x.ativo) ? 'RENDA FIXA' : 'BOLSA DE VALORES', classe: /11$/.test(x.ativo) ? 'Fundos Imobiliários' : /tesouro/i.test(x.ativo) ? 'Tesouro Direto' : /cdb|lci|lca/i.test(x.ativo) ? "CDB's" : 'Ações BR' };
      }
      out.push(t);
    });
    return { ok: true, transacoes: out, avisos: avisos.concat(Array.isArray(resp.avisos) ? resp.avisos.map(String) : []) };
  }
  function aplicarRefinoIA(rows, resp) { // mescla a categorização da IA nas linhas de baixa confiança (por id/chave)
    if (!resp || !Array.isArray(resp.transacoes)) return 0; let n = 0;
    resp.transacoes.forEach((x) => { const t = rows.find((r) => r.chave === x.id || String(r.idx) === String(x.id)); if (!t || !DESTINOS.includes(x.destino) || t.confianca >= 0.9) return;
      Object.assign(t, { destino: x.destino, catTipo: x.catTipo === 'fixa' ? 'fixa' : 'variavel', area: String(x.area || t.area), sub: String(x.sub || ''), confianca: clamp01(x.confianca == null ? 0.7 : x.confianca), motivo: 'Sugestão da IA' });
      if (x.ativo) t.ativo = { nome: String(x.ativo), tipo: t.ativo ? t.ativo.tipo : 'RENDA FIXA', classe: t.ativo ? t.ativo.classe : 'Aplicações' };
      t.incluir = t.destino !== 'ignorar' && !t.duplicado && !t.bloqueado; n++; });
    return n;
  }

  const api = { parseB3, parseTabela, ativoDeProduto, garantirAtivo, DESTINOS, decodeBytes, detectarFormato, numeroBR, parseData, parseOFX, lerCSV, mapearColunas, normalizarCSV, parseCSV, classificar, aprenderRegra, chaveComercio, hash53, sugerirConciliacao, processar, resumir, aplicar, montarPayloadIA, validarRespostaIA, aplicarRefinoIA, REGRAS_DESPESA, textoNorm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FPIngest = api;
})(typeof window !== 'undefined' ? window : globalThis);

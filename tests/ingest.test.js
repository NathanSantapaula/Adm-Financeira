// Testes da ingestão (CSV/OFX, categorização, duplicidade, conciliação e IA). Rode com: npm test
const E = require('../assets/js/engine.js');
const I = require('../assets/js/ingest.js');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('✗', m); } else console.log('✓', m); };
let n = 0; const newId = () => 'id' + (++n);

// ---- números e datas
ok(I.numeroBR('R$ 1.234,56') === 1234.56 && I.numeroBR('-1.234,56') === -1234.56 && I.numeroBR('1,234.56') === 1234.56 && I.numeroBR('(123,45)') === -123.45 && I.numeroBR('123,45-') === -123.45 && I.numeroBR('1234.5') === 1234.5 && I.numeroBR('200,00 D') === -200, 'numeroBR: formatos brasileiros e americanos');
ok(I.parseData('15/03/2026') === '2026-03-15' && I.parseData('2026-03-15') === '2026-03-15' && I.parseData('15-03-26') === '2026-03-15' && I.parseData('03/25/2026') === '2026-03-25' && I.parseData('15/03', 2026) === '2026-03-15' && I.parseData('5 de março de 2026') === '2026-03-05' && I.parseData('31/02/2026') === null, 'parseData: formatos e datas impossíveis');

// ---- CSV de banco brasileiro (BOM, linhas antes do cabeçalho, ponto e vírgula, saldo)
const csvBanco = '\uFEFFExtrato da conta;;;\nPeríodo: 01/03/2026 a 31/03/2026;;;\nData;Histórico;Valor;Saldo\n01/03/2026;SALDO ANTERIOR;;5.000,00\n02/03/2026;PIX ALUGUEL IMOBILIARIA;-2.500,00;2.500,00\n05/03/2026;SALARIO EMPRESA XYZ;8.000,00;10.500,00\n06/03/2026;SUPERMERCADO EXTRA 0345;-210,45;10.289,55\n07/03/2026;UBER *TRIP;-23,90;10.265,65\n';
let p = I.parseCSV(csvBanco, { anoPadrao: 2026, nomeArquivo: 'extrato.csv' });
ok(p.delimitador === ';' && p.transacoes.length === 4 && p.transacoes[0].valor === -2500 && p.transacoes[1].valor === 8000 && p.tipoConta === 'extrato', 'CSV de banco: delimitador, cabeçalho e saldo ignorado');

// ---- CSV com colunas de débito e crédito
const csvDC = 'Data,Descrição,Débito,Crédito\n03/04/2026,ACADEMIA SMART FIT,119.90,\n10/04/2026,DIVIDENDOS ITSA4,,35.20\n';
p = I.parseCSV(csvDC, { anoPadrao: 2026 }); ok(p.transacoes.length === 2 && p.transacoes[0].valor === -119.9 && p.transacoes[1].valor === 35.2, 'CSV com débito e crédito separados');

// ---- fatura de cartão (positivo = compra)
const csvCartao = 'date,category,title,amount\n2026-03-02,restaurante,iFood *Pedido,45.90\n2026-03-04,transporte,Uber *Trip,19.80\n2026-03-10,pagamento,Pagamento recebido,-1500.00\n';
p = I.parseCSV(csvCartao, { anoPadrao: 2026, nomeArquivo: 'nubank-fatura.csv' });
ok(p.tipoConta === 'cartao' && p.transacoes[0].valor === -45.9 && p.transacoes[2].valor === 1500, 'CSV de fatura: compras viram saídas');
let r = I.processar(p, { planos: {}, ativos: [] }); ok(r.transacoes[2].destino === 'ignorar' && r.transacoes[0].area === 'Alimentação', 'fatura: pagamento recebido é ignorado e iFood vai para Alimentação');

// ---- CSV sem cabeçalho (inferência)
p = I.parseCSV('01/05/2026;PADARIA CENTRAL;-12,50\n02/05/2026;FARMACIA POPULAR;-45,00\n03/05/2026;PIX RECEBIDO JOAO;300,00\n', { anoPadrao: 2026 });
ok(p.transacoes.length === 3 && p.confianca < 1, 'CSV sem cabeçalho: colunas inferidas pelo conteúdo');

// ---- OFX 1.x (SGML) em Windows-1252, e OFX 2.x (XML)
const ofx1 = 'OFXHEADER:100\r\nDATA:OFXSGML\r\nCHARSET:1252\r\n\r\n<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><CURDEF>BRL<BANKACCTFROM><BANKID>341<ACCTID>12345-6</BANKACCTFROM><BANKTRANLIST>\r\n<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260311120000[-3:BRT]<TRNAMT>-89,90<FITID>A1<MEMO>FARMÁCIA PACHECO</STMTTRN>\r\n<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260312<TRNAMT>1500.00<FITID>A2<MEMO>SALÁRIO EMPRESA</STMTTRN>\r\n</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>';
const txt1 = I.decodeBytes(Buffer.from(ofx1, 'latin1')); ok(/FARMÁCIA/.test(txt1), 'OFX: texto Windows-1252 decodificado com acentos');
p = I.parseOFX(txt1); ok(p.transacoes.length === 2 && p.transacoes[0].valor === -89.9 && p.transacoes[0].data === '2026-03-11' && p.transacoes[1].valor === 1500 && p.conta.id === '12345-6', 'OFX 1.x (SGML): datas, valores e conta');
const ofx2 = '<?xml version="1.0"?><OFX><CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS><BANKTRANLIST><STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260320</DTPOSTED><TRNAMT>54.30</TRNAMT><FITID>X9</FITID><MEMO>NETFLIX.COM</MEMO></STMTTRN></BANKTRANLIST></CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>';
p = I.parseOFX(ofx2); ok(p.tipoConta === 'cartao' && p.transacoes[0].valor === -54.3, 'OFX 2.x (XML) de cartão: tipo DEBIT manda no sinal');

// ---- classificação automática
const cls = (d, v) => I.classificar({ descricao: d, valor: v }, { ativos: [] });
ok(cls('SALARIO EMPRESA XYZ', 8000).destino === 'renda' && cls('SALARIO EMPRESA XYZ', 8000).catTipo === 'fixa', 'salário vira renda fixa');
ok(cls('PIX RECEBIDO MARIA', 300).catTipo === 'extra', 'entrada genérica vira renda extra (baixa confiança)');
ok(cls('DIVIDENDOS ITSA4', 35.2).destino === 'provento' && cls('DIVIDENDOS ITSA4', 35.2).ativo.nome === 'ITSA4', 'dividendo vira provento do ativo certo');
ok(cls('COMPRA HGLG11 B3', -1000).destino === 'investimento' && cls('COMPRA HGLG11 B3', -1000).ativo.classe === 'Fundos Imobiliários', 'compra de FII vira aporte em Fundos Imobiliários');
ok(cls('APLICACAO CDB BANCO X', -2000).destino === 'investimento' && cls('RESGATE CDB', 500).destino === 'investimento', 'aplicação e resgate vão para Investimentos');
ok(cls('PAGAMENTO DE FATURA CARTAO', -1500).destino === 'ignorar', 'pagamento de fatura é ignorado (evita contar em dobro)');
ok(cls('NETFLIX.COM', -55.9).area === 'Assinaturas' && cls('ENEL DISTRIBUICAO', -180).area === 'Moradia' && cls('DROGASIL 123', -40).sub === 'Farmácia', 'despesas reconhecidas por palavra-chave');
ok(cls('ESTORNO COMPRA', 30).destino === 'despesa', 'estorno reduz gasto');
ok(cls('XPTO COMERCIO LTDA', -50).confianca <= 0.3, 'sem correspondência: confiança baixa para revisão');
const regras = I.aprenderRegra([], Object.assign({ descricao: 'PADARIA SAO JORGE 123' }, { destino: 'despesa', catTipo: 'fixa', area: 'Casa', sub: 'Pão', ativo: null }));
const aprend = I.classificar({ descricao: 'PADARIA SAO JORGE 456', valor: -12 }, { regrasUsuario: regras }); ok(aprend.area === 'Casa' && aprend.confianca === 1, 'regra aprendida com a correção do usuário');

// ---- processar + aplicar + duplicidade + conciliação
const plano = { v: 2, year: 2026, settings: {}, rendaCats: E.CATS_RENDA(), rendas: [], catsDesp: E.CATS_DESP(), orcamento: new Array(12).fill(null), ativos: [],
  despesas: [{ id: 'alu', cat: 'fixa', area: 'Moradia', sub: '', nome: 'Aluguel', valores: [0, 0, 2500, 0, 0, 0, 0, 0, 0, 0, 0, 0] }], lancamentos: [] };
const planos = { 2026: plano };
const ctxP = { planos, ativos: [], permiteInvest: true, regrasUsuario: [] };
p = I.parseCSV(csvBanco, { anoPadrao: 2026 }); r = I.processar(p, ctxP);
const alu = r.transacoes.find((t) => /ALUGUEL/.test(t.descricao)); ok(alu.conciliar && alu.conciliar.itemId === 'alu', 'conciliação sugere casar o PIX do aluguel com o gasto previsto');
ok(r.resumo.incluidas === 4 && r.resumo.porDestino.renda.valor === 8000, 'resumo da prévia');
let res = I.aplicar(r.transacoes, { ensurePlan: (y) => planos[y], newId, nomeArquivo: 'extrato.csv' });
ok(res.despesas === 3 && res.rendas === 1 && res.conciliados === 1, `aplicado: ${JSON.stringify({ d: res.despesas, r: res.rendas, c: res.conciliados })}`);
let C = E.compute(plano, {});
ok(Math.abs(C.despesas[2] - (2500 + 210.45 + 23.9)) < 0.01, 'conciliado: março soma 2.500 uma vez só (não conta o previsto e o real)');
ok(Math.abs(C.rendas[2] - 8000) < 0.01, 'salário importado entra em Rendas no mês certo');
const r2x = I.processar(I.parseCSV(csvBanco, { anoPadrao: 2026 }), ctxP); ok(r2x.resumo.duplicadas === 4 && r2x.resumo.incluidas === 0, 'reimportar o mesmo arquivo: tudo marcado como duplicado');
res = I.aplicar(r2x.transacoes, { ensurePlan: (y) => planos[y], newId }); ok(res.despesas === 0 && plano.lancamentos.length === 3, 'reimportação não duplica lançamentos');
// duas compras idênticas no mesmo dia não são tratadas como duplicadas entre si
p = I.parseCSV('Data;Descrição;Valor\n10/05/2026;CAFE CENTRAL;-5,00\n10/05/2026;CAFE CENTRAL;-5,00\n', { anoPadrao: 2026 }); r = I.processar(p, ctxP); ok(new Set(r.transacoes.map((t) => t.chave)).size === 2 && r.resumo.incluidas === 2, 'duas compras iguais no mesmo dia continuam sendo duas');
// investimentos: bloqueado no plano gratuito, liberado no investidor
p = { transacoes: [{ data: '2026-06-10', descricao: 'COMPRA HGLG11', valor: -1000, origem: 'csv' }, { data: '2026-06-15', descricao: 'DIVIDENDOS HGLG11', valor: 8.5, origem: 'csv' }] };
r = I.processar(p, { planos, ativos: [], permiteInvest: false }); ok(r.resumo.bloqueadas === 2 && r.transacoes.every((t) => !t.incluir), 'plano gratuito: aportes e proventos ficam bloqueados na prévia');
r = I.processar(p, { planos, ativos: [], permiteInvest: true }); I.aplicar(r.transacoes, { ensurePlan: (y) => planos[y], newId });
ok(plano.ativos.length === 1 && plano.ativos[0].nome === 'HGLG11' && plano.ativos[0].ap[5] === 1000 && plano.ativos[0].pr[5] === 8.5, 'plano investidor: aporte e provento no ativo HGLG11');
// ano que ainda não tem planejamento
p = { transacoes: [{ data: '2025-12-20', descricao: 'RESTAURANTE X', valor: -80, origem: 'csv' }] }; r = I.processar(p, ctxP); ok(r.transacoes[0].planoNovo && r.resumo.anos[0] === 2025, 'ano sem planejamento é sinalizado na prévia');
res = I.aplicar(r.transacoes, { ensurePlan: (y) => (planos[y] = planos[y] || { v: 2, year: y, settings: {}, rendaCats: E.CATS_RENDA(), rendas: [], catsDesp: E.CATS_DESP(), despesas: [], orcamento: [], ativos: [] }), newId });
ok(planos[2025] && planos[2025].lancamentos.length === 1, 'planejamento do ano anterior criado ao importar');

// ---- IA: payload e validação da resposta
const pay = I.montarPayloadIA({ modo: 'extrair', arquivo: { nome: 'fatura.pdf', tamanho: 1234, caminho: 'u1/fatura.pdf' }, ano: 2026, categoriasDespesa: ['Despesa fixa'], ativos: ['HGLG11'] });
ok(pay.versao === 1 && pay.arquivo.caminho === 'u1/fatura.pdf' && pay.contexto.moeda === 'BRL' && Array.isArray(pay.transacoes), 'payload da IA estruturado');
const v = I.validarRespostaIA({ transacoes: [{ data: '2026-07-01', descricao: 'Mercado', valor: -90, destino: 'despesa', catTipo: 'variavel', area: 'Alimentação', confianca: 0.9 }, { data: 'x', descricao: 'Lixo', valor: 1 }, { data: '2026-07-02', descricao: 'Dividendo ABCD3', valor: 12, destino: 'provento', ativo: 'ABCD3' }] }, { anoPadrao: 2026 });
ok(v.ok && v.transacoes.length === 2 && v.avisos.length === 1 && v.transacoes[0].preclassificado && v.transacoes[1].ativo.nome === 'ABCD3', 'resposta da IA validada e linhas inválidas descartadas');
ok(!I.validarRespostaIA({}).ok, 'resposta da IA sem transações é recusada');
r = I.processar({ transacoes: [{ data: '2026-07-03', descricao: 'XPTO LTDA', valor: -50, origem: 'csv' }] }, ctxP); const alvo = r.transacoes[0];
const nref = I.aplicarRefinoIA(r.transacoes, { transacoes: [{ id: alvo.chave, destino: 'despesa', catTipo: 'variavel', area: 'Pets', sub: '', confianca: 0.8 }] }); ok(nref === 1 && alvo.area === 'Pets', 'refino por IA atualiza só as linhas de baixa confiança');

// ---- B3 (Área do Investidor): movimentação, negociação e planilha
const csvB3 = 'Entrada/Saída;Data;Movimentação;Produto;Instituição;Quantidade;Preço unitário;Valor da Operação\n'
  + 'Credito;15/03/2026;Transferência - Liquidação;HGLG11 - CSHG LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO - FII;XP;10;160,50;1.605,00\n'
  + 'Credito;14/03/2026;Rendimento;HGLG11 - CSHG LOGÍSTICA FUNDO DE INVESTIMENTO IMOBILIÁRIO - FII;XP;10;1,10;11,00\n'
  + 'Credito;10/03/2026;Juros Sobre Capital Próprio;BBAS3 - BANCO DO BRASIL S.A.;XP;50;0,40;20,00\n'
  + 'Debito;05/03/2026;Transferência - Liquidação;PETR4 - PETROBRAS;XP;20;38,00;760,00\n'
  + 'Credito;03/03/2026;Atualização;HGLG11 - CSHG LOGÍSTICA;XP;10;-;-\n'
  + 'Credito;01/03/2026;Compra;Tesouro IPCA+ 2035;XP;0,5;2.000,00;1.000,00\n'
  + 'Credito;01/03/2026;Transferência - Liquidação;BOVA11 - ISHARES BOVA FUNDO DE INDICE;XP;3;120,00;360,00\n'
  + 'Credito;01/03/2026;Transferência - Liquidação;AAPL34 - APPLE INC DRN;XP;2;60,00;120,00\n';
p = I.parseCSV(csvB3, { anoPadrao: 2026 });
const tx = (nome, dest) => p.transacoes.find((t) => t.ativo.nome === nome && t.destino === dest);
ok(p.formato === 'b3' && p.relatorio === 'movimentacao' && p.transacoes.length === 7 && p.avisos.length === 1, 'B3 movimentação reconhecida e evento sem valor ignorado');
ok(tx('HGLG11', 'investimento').valor === -1605 && tx('PETR4', 'investimento').valor === 760 && tx('HGLG11', 'provento').valor === 11 && tx('BBAS3', 'provento').valor === 20, 'B3: compra sai, venda entra, rendimento e JCP viram proventos');
ok(tx('HGLG11', 'investimento').ativo.classe === 'Fundos Imobiliários' && tx('BOVA11', 'investimento').ativo.classe === "ETF's" && tx('AAPL34', 'investimento').ativo.classe === 'Ações EUA'
  && tx('PETR4', 'investimento').ativo.classe === 'Ações BR' && p.transacoes.find((t) => /Tesouro/.test(t.ativo.nome)).ativo.classe === 'Tesouro Direto', 'B3: classe por ticker e produto (FII, ETF, BDR, ação, Tesouro)');
const pB3 = { 2026: E.migratePlan({ year: 2026, ativos: [{ id: 'x1', tipo: 'BOLSA DE VALORES', classe: 'Fundos Imobiliários', nome: 'HGLG11', ap: E.z(), pr: E.z() }] }, newId) };
r = I.processar(p, { planos: pB3, ativos: pB3[2026].ativos, permiteInvest: true });
res = I.aplicar(r.transacoes, { ensurePlan: (y) => pB3[y], newId });
const hg = pB3[2026].ativos.filter((a) => a.nome === 'HGLG11');
ok(hg.length === 1 && hg[0].ap[2] === 1605 && hg[0].pr[2] === 11 && pB3[2026].ativos.find((a) => a.nome === 'PETR4').ap[2] === -760 && res.investimentos === 5 && res.proventos === 2, 'B3: aplica no ativo existente, cria os novos, venda reduz aporte');
r = I.processar(I.parseCSV(csvB3, { anoPadrao: 2026 }), { planos: pB3, ativos: pB3[2026].ativos, permiteInvest: true });
ok(r.resumo.duplicadas === 7 && r.resumo.incluidas === 0, 'B3: reimportar o mesmo relatório não duplica');
ok(I.processar(I.parseCSV(csvB3, { anoPadrao: 2026 }), { planos: {}, ativos: [], permiteInvest: false }).resumo.bloqueadas === 7, 'B3: plano Organização vê, mas não importa investimentos');
const neg = I.parseTabela([['Data do Negócio', 'Tipo de Movimentação', 'Mercado', 'Prazo/Vencimento', 'Instituição', 'Código de Negociação', 'Quantidade', 'Preço', 'Valor'],
  [new Date(2026, 4, 6), 'Compra', 'Mercado à Vista', '-', 'XP', 'ITSA4', 100, 10.5, 1050], ['07/05/2026', 'Venda', 'Mercado Fracionário', '-', 'XP', 'PETR4F', 3, 40, 120]], { anoPadrao: 2026 });
ok(neg.formato === 'b3' && neg.relatorio === 'negociacao' && neg.transacoes[0].data === '2026-05-06' && neg.transacoes[0].valor === -1050 && neg.transacoes[1].valor === 120 && neg.transacoes[1].ativo.nome === 'PETR4', 'B3 negociação em planilha: datas do Excel, fracionário sem F');
const planilha = I.parseTabela([['Data', 'Descrição', 'Valor'], [new Date(2026, 2, 2), 'SUPERMERCADO EXTRA', -210.45], ['05/03/2026', 'SALARIO', 8000]], { anoPadrao: 2026 });
ok(planilha.formato === 'csv' && planilha.transacoes.length === 2 && planilha.transacoes[0].valor === -210.45 && planilha.transacoes[0].data === '2026-03-02', 'planilha .xlsx de extrato comum usa o mesmo caminho do CSV');
process.exit(bad ? 1 : 0);

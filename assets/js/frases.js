/* Título da Visão geral como uma conversa: catálogo de frases por situação, nas três vozes, e o motor que escolhe.
   Cada situação tem uma condição (sobre o contexto do momento: hora, dia, época do ano, orçamento, poupança, aportes,
   proventos, patrimônio, carteira, objetivos e avisos), um peso (o que mais importa agora aparece mais) e variações
   em cada voz. As variáveis entre chaves vêm de tituloContexto (dashboard.js). Uma frase só entra se todas as suas
   variáveis existirem; com o olho oculto, frases com valores em reais ficam de fora. Os números nunca mudam com a voz. */
'use strict';
const TIT_MOEDA = ['restante', 'excesso', 'gastoMes', 'sobraMes', 'deficit', 'aporteMes', 'aportesAno', 'metaMes', 'faltaMeta', 'provMes', 'provAno', 'patr', 'cresc', 'falta'];
const TIT_CAT = {
  /* ---------- momento do dia ---------- */
  madrugada: { p: 1, c: (v) => v.hora < 5, consultivo: ['Madrugada adentro, seu {ano} segue aqui.', 'Ainda acordado? Seu plano não dorme.', 'Uma olhada rápida antes de descansar?'],
    direto: ['Madrugada. Números em dia.', '{ano}, a qualquer hora.', 'Tarde da noite. Tudo salvo.'],
    acolhedor: ['Madrugada, {nome}? Seu plano te espera.', 'Até de madrugada a gente cuida do seu futuro.', 'Sem sono? Vem ver como está o seu {ano}.', 'A cidade dorme, seu dinheiro trabalha.'] },
  manha: { p: 1, c: (v) => v.hora >= 5 && v.hora < 12, consultivo: ['Bom começo de dia para olhar os números.', 'Manhã é boa hora para planejar.', 'Café na mão, seu {ano} em um relance.'],
    direto: ['Manhã. Seu {ano} em um relance.', 'Bom dia. Números atualizados.', '{dia} de manhã. Tudo em ordem.'],
    acolhedor: ['Bom dia, {nome}! Vamos começar bem?', 'Café e planejamento: dupla perfeita.', 'Manhã nova, chances novas para o seu {ano}.', 'Que tal começar o dia de olho no futuro?'] },
  tarde: { p: 1, c: (v) => v.hora >= 12 && v.hora < 18, consultivo: ['Uma pausa à tarde para conferir o plano.', 'Meio do dia, bom momento para revisar.', 'Sua tarde de {dia}, com o {ano} em vista.'],
    direto: ['Tarde. Seu {ano} em um relance.', '{dia} à tarde. Números em dia.', 'Pausa rápida. Plano conferido.'],
    acolhedor: ['Boa tarde, {nome}! Tudo certo por aí?', 'Um respiro na tarde para cuidar do futuro.', 'Que tal um cafezinho com seus números?', 'Sua tarde ficou mais leve com o plano em dia.'] },
  noite: { p: 1, c: (v) => v.hora >= 18, consultivo: ['Fim de dia: hora de ver como foi.', 'À noite, os números contam o dia.', 'Antes de dormir, uma olhada no seu {ano}.'],
    direto: ['Noite. Resumo do dia.', 'Fim de dia. Tudo registrado.', 'Seu {ano} em um minuto.'],
    acolhedor: ['Boa noite, {nome}! Como foi o dia?', 'Uma espiadinha no seu {ano} antes de dormir?', 'Noite tranquila começa com o plano em dia.', 'Dia vencido. Vamos ver como ele foi?'] },
  /* ---------- dia da semana ---------- */
  segunda: { p: 1, c: (v) => v.diaSemana === 1, consultivo: ['Semana nova, plano em dia.', 'Segunda-feira: bom dia para definir o ritmo.', 'Começo de semana pede um olhar no orçamento.'],
    direto: ['Segunda. Foco no plano.', 'Semana nova. Metas mantidas.', 'Segunda. Orçamento na mira.'],
    acolhedor: ['Segunda com cara de recomeço. Vamos?', 'Semana novinha em folha, {nome}!', 'Bora começar a semana com o pé direito?'] },
  meioSemana: { p: 1, c: (v) => v.diaSemana >= 2 && v.diaSemana <= 4, consultivo: ['Meio da semana, plano no caminho.', '{dia}: um bom dia para ajustar o rumo.', 'A semana avança, seus números também.'],
    direto: ['{dia}. Plano seguindo.', 'Meio da semana. Tudo nos trilhos.', '{dia}. Nada fora do lugar.'],
    acolhedor: ['Já é {dia}! A semana está voando.', 'Metade da semana, e você firme no plano.', 'Respira: já passamos da metade da semana!'] },
  sexta: { p: 1, c: (v) => v.diaSemana === 5, consultivo: ['Sexta-feira: boa hora para revisar a semana.', 'Antes do fim de semana, um olhar no orçamento.', 'Sexta chegou. Como ficou a semana?'],
    direto: ['Sexta. Revise a semana.', 'Sexta. Orçamento do fim de semana?', 'Fim de semana à vista. Plano em dia.'],
    acolhedor: ['Sextou! Que tal ver como foi a semana?', 'Sextou, {nome}! O plano também merece um brinde.', 'Fim de semana chegando. Tudo certo por aqui!'] },
  fds: { p: 1, c: (v) => v.diaSemana === 0 || v.diaSemana === 6, consultivo: ['Fim de semana: seus números estão aqui.', 'Com calma, o fim de semana é ótimo para planejar.', '{dia}: tempo para pensar no seu {ano}.'],
    direto: ['Fim de semana. Números em dia.', '{dia}. Plano conferido.', 'Fim de semana. Nada pendente.'],
    acolhedor: ['Fim de semana pede calma. Está tudo aqui.', '{dia} de descanso, e o plano em ordem.', 'Aproveita o fim de semana, {nome}!', 'Descansar também faz parte do plano.'] },
  /* ---------- época do mês e do ano ---------- */
  inicioMes: { p: 2, c: (v) => v.doAno && v.diaMes <= 5, consultivo: ['{Mes} começou. Bom momento para planejar.', 'Mês novo: hora de definir o orçamento.', 'Início de {mes}, página em branco.'],
    direto: ['{Mes} começou.', 'Mês novo. Orçamento definido?', 'Início de {mes}. Plano na mesa.'],
    acolhedor: ['{Mes} chegou. Página nova!', 'Mês novinho, {nome}. Vamos fazer bonito?', 'Bem-vindo, {mes}! Que seja leve e bem planejado.'] },
  meioMes: { p: 1, c: (v) => v.doAno && v.diaMes >= 12 && v.diaMes <= 19, consultivo: ['Metade de {mes}: como está o ritmo?', 'Meio do mês é hora de conferir o orçamento.', '{Mes} na metade. Tudo no caminho?'],
    direto: ['Metade de {mes}.', 'Meio do mês. Confira o orçamento.', '{Mes}: metade cumprida.'],
    acolhedor: ['Metade de {mes} já foi! Como vamos?', 'Meio do mês, {nome}: bora conferir?', '{Mes} está na metade e você firme!'] },
  fimMes: { p: 3, c: (v) => v.doAno && v.diasMes <= 5, consultivo: ['Fechamento de {mes} em {dias}.', 'Reta final de {mes}: vale conferir o orçamento.', '{Mes} termina em {dias}. Como fecha o mês?'],
    direto: ['{dias} para fechar {mes}.', 'Fim de {mes} em {dias}.', '{Mes} fecha em {dias}.'],
    acolhedor: ['Reta final de {mes}: só {dias}!', 'Faltam {dias} para virar o mês. Bora fechar bem!', '{Mes} está acabando. Que mês, hein?'] },
  natal: { p: 2, c: (v) => v.mesNum === 11 && v.diaMes >= 18 && v.diaMes <= 26, consultivo: ['Natal chegando: presentes cabem no orçamento?', 'Época de festas pede um orçamento atento.', 'Fim de ano: celebre sem perder o plano.'],
    direto: ['Natal. Orçamento das festas?', 'Festas à vista. Limite definido?', 'Dezembro. Gastos de fim de ano.'],
    acolhedor: ['Feliz Natal, {nome}! Que venham conquistas.', 'Natal com o plano em dia é presente duplo!', 'Clima de festa por aqui. Aproveita!'] },
  anoNovo: { p: 2, c: (v) => (v.mesNum === 11 && v.diaMes >= 27) || (v.mesNum === 0 && v.diaMes <= 3), consultivo: ['Virada de ano: hora de rever as metas.', 'Ano novo pede objetivos novos.', 'Feche o ano olhando para o próximo.'],
    direto: ['Virada de ano. Metas revisadas?', 'Ano novo. Plano novo.', 'Fim de ano. Hora do balanço.'],
    acolhedor: ['Feliz ano novo, {nome}! Que venha o melhor.', 'Ano novo, sonhos novos. Bora planejar?', 'Que o próximo ano seja ainda mais seu!'] },
  decimoTerceiro: { p: 2, c: (v) => (v.mesNum === 10 && v.diaMes >= 15) || (v.mesNum === 11 && v.diaMes < 18), consultivo: ['Época de 13º: que tal reforçar os aportes?', 'O 13º pode acelerar um objetivo.', 'Antes de gastar o 13º, vale um plano.'],
    direto: ['13º chegando. Destino definido?', '13º: aporte ou dívida?', 'Dezembro. Use bem o 13º.'],
    acolhedor: ['13º à vista! Que tal dar um gás no sonho?', 'Seu 13º pode virar um passo enorme.', 'Bônus de fim de ano? Seu futuro agradece!'] },
  fimAno: { p: 1, c: (v) => v.doAno && v.mesNum >= 9 && v.diasAno > 10, consultivo: ['Faltam {diasAno} dias para fechar {ano}.', 'Último trimestre de {ano}: hora de acelerar.', '{ano} entra na reta final.'],
    direto: ['{diasAno} dias para o fim de {ano}.', 'Último trimestre de {ano}.', '{ano}: reta final.'],
    acolhedor: ['Só {diasAno} dias para fechar {ano}!', '{ano} está quase no fim. Que ano!', 'Reta final de {ano}: vamos fechar bonito?'] },
  inicioAno: { p: 1, c: (v) => v.doAno && v.mesNum <= 1 && !(v.mesNum === 0 && v.diaMes <= 3), consultivo: ['Começo de {ano}: metas no lugar?', '{ano} começou. Ótima hora para planejar.', 'Ano novo, orçamento novo.'],
    direto: ['{ano} começou.', 'Início de {ano}. Metas definidas?', '{ano}. Plano em andamento.'],
    acolhedor: ['{ano} está só começando, {nome}!', 'Ano fresquinho, cheio de possibilidades.', 'Bora fazer de {ano} o seu ano?'] },
  /* ---------- orçamento ---------- */
  orcOk: { p: 2, c: (v) => v.temOrc && v.uso <= 0.7, consultivo: ['Seu orçamento de {mes} está sob controle.', 'Ainda restam {restante} no orçamento de {mes}.', '{Mes} segue dentro do planejado.', 'Orçamento de {mes}: {pctUso} usado, tudo bem.'],
    direto: ['{Mes}: orçamento em dia.', '{restante} livres em {mes}.', '{pctUso} do orçamento usado.', 'Orçamento de {mes} sob controle.'],
    acolhedor: ['Seu {mes} está tranquilo. Que bom!', 'Ainda sobram {restante} em {mes}. Show!', 'Orçamento de {mes} sob controle, {nome}!', '{Mes} está leve: só {pctUso} usado.'] },
  orcMedio: { p: 2, c: (v) => v.temOrc && v.uso > 0.7 && v.uso <= 0.9, consultivo: ['{pctUso} do orçamento de {mes} já foi.', 'Restam {restante} para o resto de {mes}.', '{Mes} avança: o orçamento pede atenção.'],
    direto: ['{pctUso} do orçamento usado.', 'Restam {restante} em {mes}.', '{Mes}: atenção ao ritmo.'],
    acolhedor: ['{Mes} está no ritmo, mas de olho!', 'Ainda dá: restam {restante} em {mes}.', 'Calma que dá, {nome}: {pctUso} usado.'] },
  orcAlto: { p: 3, c: (v) => v.temOrc && v.uso > 0.9 && v.uso <= 1, consultivo: ['{Mes} pede atenção: {pctUso} do orçamento usado.', 'Só restam {restante} no orçamento de {mes}.', 'Orçamento de {mes} quase no limite.'],
    direto: ['{pctUso} do orçamento de {mes} usado.', 'Restam só {restante}.', '{Mes} no limite.'],
    acolhedor: ['Ei, {mes} está quase no limite.', 'Restam {restante}. Vamos com calma?', 'Pé no freio, {nome}: {mes} quase no limite.'] },
  orcEstourou: { p: 4, c: (v) => v.temOrc && v.uso > 1, consultivo: ['{Mes} passou do orçamento. Vamos ajustar?', '{Mes} está {excesso} acima do orçado.', 'O orçamento de {mes} foi ultrapassado.'],
    direto: ['Orçamento de {mes} estourado.', '{excesso} acima do orçado.', '{Mes}: {pctUso} do orçamento.'],
    acolhedor: ['{Mes} escapou um pouco. Bora ajustar?', 'Passou {excesso}, mas dá para equilibrar.', 'Tudo bem, {nome}: dá para ajustar {mes}.', 'Respira: {mes} saiu do plano, mas tem jeito.'] },
  semOrc: { p: 2, c: (v) => !v.temOrc && v.gastoM > 0, consultivo: ['{Mes} ainda não tem orçamento definido.', 'Que tal definir um orçamento para {mes}?', 'Um orçamento ajudaria a guiar {mes}.'],
    direto: ['{Mes} sem orçamento.', 'Defina o orçamento de {mes}.', 'Sem limite para {mes}.'],
    acolhedor: ['Que tal dar um orçamento para {mes}?', 'Um orçamento deixa {mes} mais leve!', '{Mes} merece um orçamento, {nome}.'] },
  maiorArea: { p: 1, c: (v) => !!v.area, consultivo: ['{area} é onde mais vai o seu dinheiro.', 'Seu maior gasto em {ano}: {area}.', 'Olhar {area} com carinho pode render.'],
    direto: ['Maior gasto: {area}.', '{area} lidera os gastos.', 'Top gasto em {ano}: {area}.'],
    acolhedor: ['{area} é a campeã de gastos. Tudo bem?', 'Seu dinheiro adora {area}, hein?', 'Que tal dar uma olhada em {area}?'] },
  /* ---------- poupança e sobra ---------- */
  poupAlta: { p: 2, c: (v) => v.poup != null && v.poup >= 0.3, consultivo: ['Você está guardando {pctPoup} do que ganha.', '{pctPoup} da renda vira futuro. Excelente.', 'Taxa de poupança de {pctPoup} em {ano}.'],
    direto: ['{pctPoup} da renda guardada.', 'Poupança: {pctPoup}.', '{pctPoup} poupados em {ano}.'],
    acolhedor: ['Você já guardou {pctPoup} do que entrou!', '{pctPoup} poupados? Isso é disciplina!', 'Que orgulho, {nome}: {pctPoup} guardados!', 'Guardar {pctPoup} é coisa de campeão!'] },
  poupBoa: { p: 2, c: (v) => v.poup != null && v.poup >= 0.12 && v.poup < 0.3, consultivo: ['Você guarda {pctPoup} da renda. Bom ritmo.', '{pctPoup} da renda vira investimento.', 'Poupança de {pctPoup}: dá para crescer.'],
    direto: ['{pctPoup} da renda guardada.', 'Poupança em {pctPoup}.', 'Meta: passar de {pctPoup}.'],
    acolhedor: ['{pctPoup} guardados. Bom caminho!', 'Cada {pctPoup} conta, {nome}!', 'Você está guardando {pctPoup}. Segue firme!'] },
  poupBaixa: { p: 3, c: (v) => v.poup != null && v.poup >= 0 && v.poup < 0.12 && v.receita > 0, consultivo: ['Só {pctPoup} da renda está sobrando.', 'Que tal mirar em guardar um pouco mais?', 'A sobra de {ano} está apertada.'],
    direto: ['Sobra baixa: {pctPoup}.', 'Poupança abaixo de 12%.', 'Aumente a sobra.'],
    acolhedor: ['Sobra apertada? Juntos a gente acha espaço.', 'Que tal guardar um pouquinho mais?', 'Pequenos ajustes, grandes sobras, {nome}.'] },
  deficit: { p: 4, c: (v) => v.receita > 0 && v.sobraAno < 0, consultivo: ['Em {ano}, os gastos superam as entradas.', 'Gastos {deficit} acima das entradas em {ano}.', 'Falta registrar alguma renda de {ano}?'],
    direto: ['Gastos acima das entradas.', 'Déficit de {deficit} em {ano}.', 'Faltou renda? Confira.'],
    acolhedor: ['Gastos passaram as entradas. Vamos ver?', 'Ei, {ano} está no vermelho. Bora virar?', 'Falta lançar alguma renda, {nome}?'] },
  sobraMes: { p: 2, c: (v) => v.sobraM > 0, consultivo: ['{Mes} deixou {sobraMes} de sobra.', 'Sobraram {sobraMes} em {mes}.', '{sobraMes} livres para investir em {mes}.'],
    direto: ['Sobra de {mes}: {sobraMes}.', '{sobraMes} livres.', '{Mes}: +{sobraMes}.'],
    acolhedor: ['Sobrou {sobraMes} em {mes}. Investe?', '{sobraMes} sobrando! Seu futuro quer.', 'Olha só: {sobraMes} livres em {mes}!'] },
  /* ---------- investimentos ---------- */
  aporteMes: { p: 2, c: (v) => v.inv && v.aporteM > 0, consultivo: ['Em {mes}, você já investiu {aporteMes}.', '{aporteMes} aportados em {mes}.', 'Aportes de {mes}: {aporteMes}.'],
    direto: ['{aporteMes} investidos em {mes}.', 'Aporte de {mes}: {aporteMes}.', '{Mes}: +{aporteMes} investidos.'],
    acolhedor: ['{aporteMes} investidos em {mes}. Isso é futuro!', 'Mais {aporteMes} trabalhando por você!', 'Você investiu {aporteMes} em {mes}. Uau!'] },
  metaBatida: { p: 3, c: (v) => v.inv && v.meta > 0 && v.aporteM >= v.meta, consultivo: ['Meta de aporte de {mes} cumprida.', 'Você bateu a meta de aporte de {mes}.', '{Mes}: aporte acima da meta mensal.'],
    direto: ['Meta de {mes}: batida.', 'Aporte de {mes} na meta.', 'Meta cumprida.'],
    acolhedor: ['Meta de {mes} batida! Que orgulho!', 'Bateu a meta de aporte, {nome}!', 'Meta cumprida em {mes}. Comemora!'] },
  metaFalta: { p: 2, c: (v) => v.inv && v.meta > 0 && v.aporteM < v.meta && v.doAno && v.diaMes >= 10, consultivo: ['Faltam {faltaMeta} para a meta de {mes}.', 'A meta de aporte de {mes} ainda dá.', '{faltaMeta} separam você da meta.'],
    direto: ['Faltam {faltaMeta} na meta.', 'Meta de {mes}: falta {faltaMeta}.', 'Aporte pendente: {faltaMeta}.'],
    acolhedor: ['Só {faltaMeta} para bater a meta!', 'Bora fechar a meta de {mes}, {nome}?', 'Tá pertinho: faltam {faltaMeta}!'] },
  aportesAno: { p: 1, c: (v) => v.inv && v.aportesA > 0, consultivo: ['{aportesAno} investidos em {ano}.', 'Seus aportes de {ano} somam {aportesAno}.', 'Em {ano}, {aportesAno} viraram investimento.'],
    direto: ['{ano}: {aportesAno} aportados.', 'Aportes do ano: {aportesAno}.', '{aportesAno} investidos.'],
    acolhedor: ['{aportesAno} plantados em {ano}!', 'Você já investiu {aportesAno} este ano!', '{aportesAno} rumo aos seus sonhos!'] },
  sequencia: { p: 2, c: (v) => v.seq >= 2, consultivo: ['{seq} meses seguidos na meta de aporte.', 'Constância: {seq} meses na meta.', 'Sequência de {seq} meses batendo a meta.'],
    direto: ['{seq} meses na meta.', 'Sequência: {seq} meses.', '{seq} meses seguidos.'],
    acolhedor: ['{seq} meses seguidos na meta. Que ritmo!', 'Sequência de {seq} meses, {nome}!', '{seq} meses na meta. Não para!'] },
  provMes: { p: 2, c: (v) => v.inv && v.provM > 0, consultivo: ['Seus investimentos renderam {provMes} em {mes}.', '{provMes} de proventos em {mes}.', 'Em {mes}, seu dinheiro gerou {provMes}.'],
    direto: ['{provMes} de proventos em {mes}.', 'Proventos de {mes}: {provMes}.', '{Mes}: +{provMes} em proventos.'],
    acolhedor: ['Seu dinheiro trabalhou: {provMes} em {mes}.', '{provMes} pingaram na conta em {mes}!', 'Renda passiva de {provMes}. Que delícia!'] },
  provAno: { p: 1, c: (v) => v.inv && v.provA > 0, consultivo: ['{provAno} em proventos em {ano}.', 'Seus investimentos devolveram {provAno}.', 'Proventos de {ano}: {provAno}.'],
    direto: ['Proventos do ano: {provAno}.', '{provAno} recebidos.', '{ano}: {provAno} de renda passiva.'],
    acolhedor: ['{provAno} de renda passiva em {ano}!', 'Seu dinheiro já te pagou {provAno}!', '{provAno} sem esforço este ano!'] },
  patrimonio: { p: 1, c: (v) => v.inv && v.patrV > 0, consultivo: ['Seu patrimônio está em {patr}.', 'Patrimônio estimado de {patr}.', '{patr} construídos até aqui.'],
    direto: ['Patrimônio: {patr}.', '{patr} acumulados.', 'Total investido: {patr}.'],
    acolhedor: ['{patr} construídos com carinho!', 'Olha só onde você chegou: {patr}!', 'Seu patrimônio já soma {patr}!'] },
  cresceu: { p: 2, c: (v) => v.inv && v.crescV > 0, consultivo: ['Seu patrimônio cresceu {cresc} em {ano}.', '{ano}: patrimônio {crescPct} maior.', 'Mais {cresc} no patrimônio este ano.'],
    direto: ['Patrimônio: +{cresc} em {ano}.', '+{crescPct} no ano.', 'Crescimento: {cresc}.'],
    acolhedor: ['Seu patrimônio cresceu {cresc} em {ano}!', '+{crescPct} em {ano}. Que evolução!', 'Mais {cresc} no seu futuro, {nome}!'] },
  carteira: { p: 1, c: (v) => !!v.ativo, consultivo: ['{ativo} está abaixo do alvo da carteira.', 'Próximo aporte: vale priorizar {ativo}.', 'A carteira pede reforço em {ativo}.'],
    direto: ['{ativo} abaixo do alvo.', 'Priorize {ativo}.', 'Rebalanceie: {ativo}.'],
    acolhedor: ['{ativo} está pedindo um carinho.', 'Que tal reforçar {ativo} no próximo aporte?', 'Sua carteira sente falta de {ativo}.'] },
  /* ---------- objetivos ---------- */
  objProg: { p: 2, c: (v) => !!v.obj && v.objP > 0.02 && v.objP < 1, consultivo: ['{obj}: {pctObj} do caminho percorrido.', '{obj} já está em {pctObj}.', 'Você já tem {pctObj} de {obj}.'],
    direto: ['{obj}: {pctObj} concluído.', '{obj} em {pctObj}.', 'Progresso de {obj}: {pctObj}.'],
    acolhedor: ['{obj}: já são {pctObj} do caminho!', '{pctObj} de {obj}. Cada vez mais perto!', '{obj} está tomando forma: {pctObj}!'] },
  objPrev: { p: 2, c: (v) => !!v.obj && !!v.quando, consultivo: ['No ritmo atual, {obj} chega em {quando}.', '{obj}: previsão para {quando}.', 'Mantendo o ritmo, {obj} em {quando}.'],
    direto: ['{obj}: previsto para {quando}.', '{obj} em {quando}.', 'Previsão de {obj}: {quando}.'],
    acolhedor: ['Desse jeito, {obj} chega em {quando}!', '{obj} já tem data: {quando}!', 'Contagem regressiva: {obj} em {quando}!'] },
  objFalta: { p: 2, c: (v) => !!v.obj && v.faltaV > 0, consultivo: ['Faltam {falta} para {obj}.', '{obj}: ainda faltam {falta}.', '{falta} separam você de {obj}.'],
    direto: ['{obj}: faltam {falta}.', 'Falta {falta} para {obj}.', '{falta} até {obj}.'],
    acolhedor: ['Só {falta} até {obj}!', 'Faltam {falta} para {obj}. Bora!', '{obj} está a {falta} de você!'] },
  objQuase: { p: 3, c: (v) => !!v.obj && v.objP >= 0.8 && v.objP < 1, consultivo: ['{obj} está quase lá: {pctObj}.', 'Reta final para {obj}.', '{obj} a poucos passos.'],
    direto: ['{obj}: reta final.', '{obj} em {pctObj}. Quase.', 'Falta pouco para {obj}.'],
    acolhedor: ['{obj} está logo ali!', 'Reta final de {obj}. Que emoção!', 'Quase lá, {nome}: {obj} em {pctObj}!'] },
  objComeco: { p: 1, c: (v) => !!v.obj && v.objP <= 0.1 && v.objP < 1, consultivo: ['{obj} está começando. Todo plano começa assim.', 'Primeiros passos rumo a {obj}.', 'O começo de {obj} já está no plano.'],
    direto: ['{obj}: início.', '{obj}. Primeiros aportes.', 'Começo de {obj}.'],
    acolhedor: ['Todo sonho começa assim: {obj}!', 'Primeiro passo rumo a {obj}!', '{obj} começou. Que lindo!'] },
  objOk: { p: 3, c: (v) => !!v.obj && v.objOk, consultivo: ['{obj}: objetivo alcançado.', '{obj} está coberto. Parabéns.', 'Meta de {obj} cumprida.'],
    direto: ['{obj}: concluído.', '{obj} coberto.', 'Meta atingida: {obj}.'],
    acolhedor: ['{obj}: conquista desbloqueada!', 'Você conseguiu {obj}! Que orgulho!', '{obj} realizado. Qual o próximo sonho?'] },
  objVarios: { p: 1, c: (v) => v.nObj >= 2, consultivo: ['{nObj} objetivos em andamento.', 'Você tem {nObj} objetivos no plano.', '{nObj} sonhos, um plano só.'],
    direto: ['{nObj} objetivos ativos.', 'Objetivos: {nObj}.', '{nObj} metas no plano.'],
    acolhedor: ['{nObj} sonhos em construção!', '{nObj} objetivos, um de cada vez!', 'Você sonha alto: {nObj} objetivos!'] },
  semObj: { p: 2, c: (v) => v.nObj === 0, consultivo: ['Que tal definir um objetivo?', 'Um objetivo dá direção ao plano.', 'Comece cadastrando o seu primeiro objetivo.'],
    direto: ['Defina um objetivo.', 'Sem objetivos ainda.', 'Cadastre uma meta.'],
    acolhedor: ['Qual é o seu sonho, {nome}?', 'Todo plano precisa de um sonho!', 'Bora sonhar? Cadastre um objetivo!'] },
  /* ---------- avisos ---------- */
  avisos: { p: 2, c: (v) => v.nAvisos > 0, consultivo: ['Você tem {nAvisos} {avisosTxt} para ver.', '{nAvisos} {avisosTxt} esperando na central.', 'Há {nAvisos} {avisosTxt} no sino.'],
    direto: ['{nAvisos} {avisosTxt}.', 'Sino: {nAvisos} {avisosTxt}.', 'Confira {nAvisos} {avisosTxt}.'],
    acolhedor: ['Tem {nAvisos} {avisosTxt} te esperando!', 'O sino tem {nAvisos} {avisosTxt} para você!', 'Psiu: {nAvisos} {avisosTxt} no sino.'] },
  /* ---------- sempre na roda ---------- */
  base: { p: 1, c: () => true, consultivo: ['Seu planejamento de {ano}, em um relance.', 'Tudo o que importa do seu {ano}.', 'Seu {ano}, organizado.', 'O seu dinheiro, com clareza.'],
    direto: ['{ano}: onde você está.', 'Seu {ano} em números.', 'Resumo de {ano}.', 'Os números de {ano}.'],
    acolhedor: ['Vamos ver como está o seu {ano}?', 'Cada real guardado conta uma história.', 'Seu plano, no seu ritmo.', 'Que bom ter você aqui, {nome}!', 'Seu futuro começa nas escolhas de hoje.', 'Pequenos passos, grandes conquistas.', 'Hoje é um ótimo dia para cuidar do amanhã.', 'Seu dinheiro, sua história.'] },
};
// todas as frases possíveis agora, com o peso da situação; sem variáveis faltando e, com o olho oculto, sem valores em reais
function tituloCandidatas(ctx, tom) {
  const out = []; const oc = typeof oculto === 'function' && oculto();
  Object.values(TIT_CAT).forEach((s) => {
    let ok = false; try { ok = s.c(ctx); } catch (e) { ok = false; } if (!ok) return;
    (s[tom] || s.consultivo).forEach((t) => {
      const vars = [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      if (vars.some((k) => ctx[k] == null || ctx[k] === '')) return; if (oc && vars.some((k) => TIT_MOEDA.includes(k))) return;
      out.push({ f: t.replace(/\{(\w+)\}/g, (_, k) => ctx[k]), p: s.p });
    });
  });
  return out;
}
// sorteio com peso: o que mais importa aparece mais, nunca repete a frase atual e evita as últimas mostradas
function tituloSortear(cands, atual, hist) {
  const recentes = new Set(hist || []); let pool = cands.filter((c) => c.f !== atual && !recentes.has(c.f));
  if (!pool.length) pool = cands.filter((c) => c.f !== atual); if (!pool.length) return atual;
  const peso = (c) => c.p * c.p; const tot = pool.reduce((a, c) => a + peso(c), 0); let r = Math.random() * tot;
  for (const c of pool) { r -= peso(c); if (r <= 0) return c.f; } return pool[pool.length - 1].f;
}

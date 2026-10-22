/* Política de privacidade e termos de uso (LGPD, Lei 13.709/2018). Puro, sem DOM: o app abre num modal (openTerms em ui.js)
   e a página pública privacidade.html desenha o mesmo texto. Mudou o texto? Troque POLITICA_VERSAO: o aceite gravado no perfil guarda a versão. */
'use strict';
const POLITICA_VERSAO = '2026-11-01';
function politicaHtml(cfg, nuvem) {
  const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const marca = e(cfg.marca || 'AVEN'); const quem = e(cfg.controlador || cfg.consultor || ''); const cons = e(cfg.consultor || '');
  const mail = e(cfg.encarregadoEmail || cfg.email || ''); const zap = e(cfg.whatsapp || '');
  const [a, m, d] = POLITICA_VERSAO.split('-'); const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const sec = (t, corpo) => `<h4>${t}</h4>${corpo}`; const li = (xs) => `<ul>${xs.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  return `<div class="terms politica">
  <p class="pol-v">Versão de ${+d} de ${MESES[+m - 1]} de ${a}.</p>
  <p>Esta política explica quais dados pessoais o ${marca} usa, para quê, com quem eles são compartilhados e como você exerce os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Ao criar a conta você declara que leu este texto.</p>
  ${sec('1. Quem cuida dos seus dados', `<p>O controlador dos dados é ${quem}, responsável pelo ${marca}. O encarregado pelo tratamento de dados pessoais (art. 41 da LGPD) atende pelo e-mail <a href="mailto:${mail}">${mail}</a>${zap ? ` e pelo WhatsApp ${zap}` : ''}.</p>`)}
  ${sec('2. Que dados usamos', li([
    '<b>Cadastro:</b> nome, e-mail e WhatsApp. A senha é guardada pelo provedor de login apenas de forma cifrada (hash); ninguém, nem o consultor, consegue lê-la.',
    '<b>Perfil:</b> como prefere ser chamado e, se você quiser, uma foto ou um avatar.',
    '<b>Diagnóstico:</b> patrimônio informado, renda, perfil de investidor (questionário) e objetivos.',
    '<b>Planejamento:</b> o que você lança ou importa: rendas, gastos, contas, parcelas, investimentos, proventos, carteira, metas e limites.',
    '<b>Arquivos de extrato:</b> CSV, OFX e planilhas são lidos no próprio aparelho; só os lançamentos que você confirma são gravados. O PDF lido por inteligência artificial (plano Assessoria) é enviado de forma temporária e apagado logo após a leitura.',
    '<b>Preferências:</b> tema, cores, voz do painel e a organização das telas.',
    '<b>Dados técnicos:</b> a sessão de login e preferências guardadas no navegador (armazenamento local). Não usamos cookies de publicidade nem ferramentas de rastreamento.',
  ]) + '<p>Não pedimos nem guardamos senhas de banco, números de cartão, documentos (CPF, RG) ou localização.</p>')}
  ${sec('3. Para que usamos e com qual base legal', li([
    '<b>Prestar o serviço que você contratou</b> (organizar finanças, calcular orçamento, metas e carteira): execução de contrato (art. 7º, V).',
    `<b>Atendimento pelo consultor</b> (ver seu cadastro e o diagnóstico; e, no plano Assessoria, o planejamento detalhado): consentimento (art. 7º, I), dado no cadastro e na contratação do plano.`,
    '<b>Leitura de PDF por inteligência artificial:</b> consentimento, a cada uso.',
    '<b>Segurança da conta e prevenção de fraudes:</b> legítimo interesse (art. 7º, IX).',
    '<b>Cumprir obrigações legais ou atender autoridades</b>, quando houver: obrigação legal (art. 7º, II).',
  ]) + '<p>Os dados financeiros são usados só para o seu planejamento. Não vendemos, alugamos nem usamos seus dados para publicidade.</p>')}
  ${sec('4. Quem pode ver seus dados', li([
    '<b>Você</b>, sempre.',
    `<b>${cons}</b>, o consultor: nome, contato, foto ou avatar e o diagnóstico (patrimônio informado, perfil e objetivos). O planejamento detalhado só fica visível se você contratar o plano Assessoria, e deixa de ficar se o plano for cancelado.`,
    '<b>Supabase</b> (banco de dados e login): guarda os dados com acesso restrito por conta. Os servidores podem ficar fora do Brasil; essa transferência internacional segue o art. 33 da LGPD, com as garantias contratuais do provedor.',
    '<b>GitHub Pages</b> (hospedagem do site) e as redes de entrega jsDelivr, cdnjs e Google Fonts: recebem o endereço IP do aparelho para entregar as páginas, bibliotecas e fontes, sem acesso aos seus dados financeiros.',
    '<b>Anthropic</b> (provedor de inteligência artificial): só recebe o PDF quando você usa a leitura por IA, para extrair os lançamentos.',
    '<b>Autoridades</b>, apenas quando a lei ou uma ordem judicial exigir.',
  ]))}
  ${sec('5. Por quanto tempo guardamos', `<p>Enquanto a sua conta existir. Ao excluir a conta, o cadastro, o perfil, o diagnóstico, os planejamentos e a assinatura são apagados na hora; cópias de segurança automáticas do provedor expiram em alguns dias. O PDF da leitura por IA é apagado logo após a leitura. No modo demonstração, tudo fica só neste navegador e some ao limpar os dados do site.</p>`)}
  ${sec('6. Seus direitos', `<p>Pela LGPD (art. 18) você pode, a qualquer momento:</p>` + li([
    'confirmar que tratamos seus dados e ter acesso a eles;',
    'corrigir dados incompletos ou desatualizados;',
    'pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários;',
    'levar seus dados para outro serviço (portabilidade);',
    'saber com quem eles são compartilhados;',
    'revogar o consentimento e pedir a eliminação dos dados tratados com base nele;',
    'opor-se a um tratamento que descumpra a lei.',
  ]) + `<p>Dentro do app você já pode baixar todos os seus dados (Baixar meus dados), corrigir o perfil e excluir a conta (Excluir minha conta). Para o resto, escreva para <a href="mailto:${mail}">${mail}</a>; respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p><p>O assistente do app funciona no próprio aparelho, não toma decisões automatizadas sobre você e não envia suas perguntas para fora.</p>`)}
  ${sec('7. Segurança', li([
    'Conexão sempre cifrada (HTTPS).',
    'Cada conta só lê os próprios dados: a regra fica no banco (Row Level Security), não apenas na tela.',
    'Arquivos enviados para leitura ficam num espaço privado, em pasta só da sua conta.',
    'As bibliotecas externas são conferidas por assinatura de integridade, e o site não guarda chaves secretas.',
    'Se acontecer um incidente de segurança que possa trazer risco a você, avisaremos você e a ANPD (art. 48).',
  ]) + '<p>Proteja também a sua parte: use uma senha forte, só sua, e saia da conta em aparelhos compartilhados.</p>')}
  ${sec('8. Termos de uso', li([
    `O ${marca} é uma ferramenta de organização financeira oferecida por ${cons}. Não constitui oferta, nem recomendação individual de investimento, nem promessa de rentabilidade.`,
    'O questionário de perfil é uma versão simplificada e não substitui a análise de adequação (suitability) feita na assessoria.',
    'Projeções e simulações são ilustrativas e usam as premissas mostradas na tela.',
    'Os valores dependem do que você lança ou importa; confira a prévia antes de gravar uma importação.',
    'Os planos pagos são contratados com o consultor; o cancelamento pode ser pedido a qualquer momento pelos canais de contato.',
    'O serviço é destinado a maiores de 18 anos.',
    'Não use o serviço para guardar dados de outras pessoas sem autorização delas.',
  ]))}
  ${sec('9. Mudanças nesta política', `<p>Quando esta política mudar, a data no topo é atualizada e avisamos no app. Mudanças que alterem a finalidade do uso dos dados pedem um novo aceite.</p>`)}
</div>`;
}
if (typeof module !== 'undefined') module.exports = { politicaHtml, POLITICA_VERSAO };

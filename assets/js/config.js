/* Configuração pública do Financial planning.
   Nada aqui é segredo: a chave "anon" do Supabase é pública por projeto e protegida pelas regras de acesso (RLS) de supabase/schema.sql.
   Campos vazios simplesmente não aparecem no site. */
window.FP_CONFIG = {
  marca: 'AVEN',
  submarca: 'Financial Planning', // linha abaixo do logo
  consultor: 'Nathan Santapaula',
  consultorCurto: 'Nathan',

  // Canais de contato do consultor (preencha ao menos um)
  whatsapp: '+55 11 93487-5598',
  email: 'nathansantapaula@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/nathansantapaula/',
  agendaUrl: 'https://zcal.co/i/ioYEzB16',
  paymentUrl: 'https://mpago.li/22BFXTT',
  paymentUrlInvestidor: 'https://mpago.la/1XGSHzW', // link de pagamento do plano Investidor

  // Planos: Organização (gratuito), Investidor e Assessoria. O plano Assessoria usa precoPor/precoRegular.
  precoPor: 124.75,
  precoRegular: 324.99,
  precoInvestidor: 54.75, // ex.: 49.9. Vazio mostra "Sob consulta" no site

  // Seção "Quem cuida do seu planejamento" na página inicial. Campos vazios simplesmente não aparecem.
  // foto: caminho da sua foto (PNG com o fundo recortado fica melhor; JPG também funciona). Ex.: 'assets/img/nathan.png'
  // empresas: a trajetória. logo é opcional (arquivo SVG ou PNG oficial em assets/img/logos/); sem logo, o nome aparece escrito.
  //           cargo e periodo também são opcionais. Ex.: { nome: 'Deloitte', logo: 'assets/img/logos/deloitte.svg', cargo: 'Consultor', periodo: '2019 a 2021' }
  // bio: texto sobre você (vazio usa um texto padrão com as empresas acima).
  // credenciais: ['Assessor de investimentos XP Inc.', 'Certificação X'],
  // depoimentos: só reais e autorizados. A seção com o carrossel aparece quando houver ao menos um. Campos:
  //   { nome: 'Mariana C.', texto: 'O depoimento.', descricao: 'Médica, São Paulo', plano: 'Assessoria', nota: 5, data: 'Set 2026', foto: '' }
  //   (nome e texto obrigatórios; o resto é opcional; sem foto aparecem as iniciais)
  foto: 'assets/img/nathan.jpg',
  // fotoRecorte: contorno do topo da cabeça (pontos x,y em pixels da foto original), que "sai" do quadro sobre o fundo do site.
  // fotoCorte: altura (px da foto original) onde começa o quadro. Trocou a foto? Ajuste os dois ou apague para usar só o quadro.
  fotoTam: [843, 1131],
  fotoCorte: 118,
  fotoRecorte: [[338, 126], [338, 124], [340, 116], [343, 108], [347, 103], [354, 92], [362, 86], [370, 80], [378, 74], [386, 73], [395, 67], [410, 66], [440, 65], [460, 65], [474, 64], [482, 65], [490, 67], [498, 69], [506, 72], [514, 76], [522, 81], [530, 87], [535, 92], [538, 97], [540, 101], [542, 104], [544, 108], [547, 112], [550, 116], [553, 120], [555, 124], [555, 126]],
  // logos do Wikimedia Commons (domínio público), mostrados numa cor só. caixa: [x, y, largura, altura] do desenho dentro
  // do arquivo e [largura, altura] do arquivo, para cortar a margem vazia (opcional). altura: em px, para equilibrar logos (opcional). peso: engrossa o traço de um logo fino, em px (opcional).
  empresas: [
    { nome: 'Stone Co.', logo: 'assets/img/logos/stone.png', caixa: [452, 1624, 3192, 848, 4096, 4096], altura: 19 },
    { nome: 'Deloitte', logo: 'assets/img/logos/deloitte.svg', caixa: [3, 2, 886, 167, 892, 171] },
    // XP: desenhado no próprio HTML (LP_SVG em landing.js) para a forma ficar na cor da marca e mudar com o tema
    { nome: 'XP Inc.', svg: 'xp' },
  ],
  bio: '',
  credenciais: [],
  depoimentos: [],

  // Banco de dados e login (Supabase). Deixe em branco para o modo demonstração (dados só no navegador).
  supabase: { url: 'https://amvxhgjtseeixhjwllkc.supabase.co', anonKey: 'sb_publishable_WmR5xrvOV5wzFBJ9eNcBOA_V8PDjClb' },

  // Ingestão por IA (PDF e relatórios): ligue só depois de publicar a Edge Function (supabase/functions/ingest-statement)
  ingestao: { iaAtiva: false, bucket: 'ingestao', funcao: 'ingest-statement' },

  // Troca o plano mínimo de um recurso. Exemplo: recursos: { carteira: 'completo', importar: 'gratis' }
  // Recursos: ingestao, orcamento, backup, investimentos, proventos, patrimonio, carteira, ingestao_invest, importar,
  //           carteira_recomendada, relatorios, ia_pdf, visao_consultor. Planos: gratis, investidor, completo.
  recursos: {},

  // Avatares próprios (opcional). Somam-se à coleção desenhada do Meu perfil. Coloque as imagens (quadradas, 320 px ou mais)
  // em assets/img/avatares/ e liste aqui. Grupos: protecao, equilibrio, crescimento, tecnologia.
  // avatares: [{ id: 'mar', nome: 'Mar', grupo: 'protecao', src: 'assets/img/avatares/mar.webp' }],
};

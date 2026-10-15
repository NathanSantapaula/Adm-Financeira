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

  // Prova de autoridade: só aparece se preenchido. Exemplos:
  // bio: 'Texto curto sobre você.',
  // credenciais: ['Assessor de investimentos XP Inc.', 'Certificação X'],
  // depoimentos: [{ nome: 'Cliente', texto: 'Depoimento autorizado.' }],
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

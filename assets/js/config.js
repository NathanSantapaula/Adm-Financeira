/* Configuração pública do Financial planning.
   Nada aqui é segredo: a chave "anon" do Supabase é pública por projeto e protegida pelas regras de acesso (RLS) de supabase/schema.sql.
   Campos vazios simplesmente não aparecem no site. */
window.FP_CONFIG = {
  marca: 'Financial Planning',
  consultor: 'Nathan Santapaula',
  consultorCurto: 'Nathan',

  // Canais de contato do consultor (preencha ao menos um)
  whatsapp: '+55 11 93487-5598',
  email: 'nathansantapaula@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/nathansantapaula/',
  agendaUrl: 'https://zcal.co/i/ioYEzB16',
  paymentUrl: 'https://mpago.li/22BFXTT',

  // Oferta
  precoPor: 124.75,
  precoRegular: 324.99,

  // Prova de autoridade: só aparece se preenchido. Exemplos:
  // bio: 'Texto curto sobre você.',
  // credenciais: ['Assessor de investimentos XP Inc.', 'Certificação X'],
  // depoimentos: [{ nome: 'Cliente', texto: 'Depoimento autorizado.' }],
  bio: '',
  credenciais: [],
  depoimentos: [],

  // Banco de dados e login (Supabase). Deixe em branco para o modo demonstração (dados só no navegador).
  supabase: { url: 'https://amvxhgjtseeixhjwllkc.supabase.co', anonKey: 'sb_publishable_WmR5xrvOV5wzFBJ9eNcBOA_V8PDjClb' },

  // Recursos exclusivos do plano completo (false libera para todos)
  gates: { cart: true, importar: true },
};

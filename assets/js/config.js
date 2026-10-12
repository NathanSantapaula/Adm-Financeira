/* Configuração pública do Financial planning.
   Nada aqui é segredo: a chave "anon" do Supabase é pública por projeto e protegida pelas regras de acesso (RLS) de supabase/schema.sql.
   Campos vazios simplesmente não aparecem no site. */
window.FP_CONFIG = {
  marca: 'Financial planning',
  consultor: 'Nathan Santapaula',
  consultorCurto: 'Nathan',

  // Canais de contato do consultor (preencha ao menos um)
  whatsapp: '', // só dígitos, com DDI e DDD. Exemplo: 5511999999999
  email: '',
  xpUrl: '', // link opcional da assessoria na XP Inc.
  agendaUrl: '', // link de agendamento (Calendly, Google Agenda, etc.) para o botão "Agendar conversa"
  paymentUrl: '', // link de pagamento do plano completo (Pix, cartão, boleto)

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
  supabase:{url:'https://amvxhgjtsseeixhjwllkc.supabase.co',anonKey:'sb_publishable_WmR5xrvOV5wzFBJ9eNcBOA_V8PDjClb'},

  // Recursos exclusivos do plano completo (false libera para todos)
  gates: { cart: true, importar: true },
};

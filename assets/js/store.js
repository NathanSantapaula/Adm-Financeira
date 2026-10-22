/* Camada de dados: LocalStore (navegador, modo demonstração) e SupabaseStore (nuvem).
   O app só conversa com `Store`; trocar de serviço de nuvem significa reescrever apenas este arquivo. */
'use strict';
const Store = (() => {
  const CFG = window.FP_CONFIG;
  const cloud = !!(CFG.supabase && CFG.supabase.url && CFG.supabase.anonKey);
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  const SUPABASE_SRI = 'sha384-0w2KAL2YHP6wKOkUDzkCDGgVvfmHnj02DHeQ6XcHOgTfFsGyonKOpShMH1x6nk9o'; // conferido com o hash publicado pelo jsDelivr; trocou a versão, troque o hash

  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } };
  const lsKeys = () => { const r = []; try { for (let i = 0; i < localStorage.length; i++) r.push(localStorage.key(i)); } catch (e) { /* ignora */ } return r; };
  const parse = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
  const erro = (m) => Object.assign(new Error(m), { amigavel: true });

  /* ===================== modo demonstração (navegador) ===================== */
  const Local = {
    mode: 'local',
    async init() { return lsGet('fp:out') === '1' ? null : parse(lsGet('fp:user')); },
    async signUp({ nome, email, whatsapp }) {
      const atual = parse(lsGet('fp:user'));
      if (atual && atual.email.toLowerCase() !== String(email).trim().toLowerCase()) throw erro(`Este navegador já tem uma conta de demonstração (${atual.email}). Entre com ela.`);
      const user = atual || { id: 'local', email, nome, whatsapp };
      if (!lsSet('fp:user', JSON.stringify(user))) throw erro('Seu navegador bloqueou o armazenamento local.');
      lsDel('fp:out'); return { user, needsVerify: false };
    },
    async signIn({ email }) {
      const u = parse(lsGet('fp:user'));
      if (!u || (email && u.email.toLowerCase() !== String(email).trim().toLowerCase())) throw erro('Não encontramos essa conta neste navegador. Crie uma conta para começar.');
      lsDel('fp:out'); return { user: u };
    },
    async signOut() { lsSet('fp:out', '1'); /* mantém os dados; só encerra a sessão */ },
    async resetPassword() { throw erro('No modo demonstração não há senha para recuperar.'); },
    async updatePassword() { throw erro('No modo demonstração não há senha.'); },
    onAuth() { /* sem eventos externos */ },
    async loadAll() {
      const planos = {};
      lsKeys().forEach((k) => { const m = /^fp:plan:(\d{4})$/.exec(k || ''); if (m) planos[+m[1]] = parse(lsGet(k)); });
      return { perfil: parse(lsGet('fp:profile')), planos, assinatura: { plano: 'completo', status: 'ativo', demo: true }, isAdmin: false, recomendacao: null };
    },
    async saveProfile(p) { if (!lsSet('fp:profile', JSON.stringify(p))) throw new Error('storage'); },
    async savePlan(year, dados) { if (!lsSet('fp:plan:' + year, JSON.stringify(dados))) throw new Error('storage'); },
    async deletePlan(year) { lsDel('fp:plan:' + year); },
    async listClients() { return []; },
    async setPlano() { /* sem efeito no modo demonstração */ },
    async loadClient() { throw erro('Disponível com o Supabase configurado.'); },
    async saveRecomendacao() { throw erro('Disponível com o Supabase configurado.'); },
    async uploadIngest() { throw erro('A leitura de PDF por IA precisa do Supabase configurado.'); },
    async ingestIA() { throw erro('A leitura de PDF por IA precisa do Supabase configurado.'); },
    async deleteAccount() { lsKeys().filter((k) => k && k.startsWith('fp:')).forEach(lsDel); },
  };

  /* ===================== Supabase ===================== */
  let sb = null;
  const loadScript = (src, sri) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; if (sri) { s.integrity = sri; s.crossOrigin = 'anonymous'; } s.onload = res; s.onerror = () => rej(new Error('script')); document.head.appendChild(s); });
  const mapErr = (e) => {
    const m = String((e && e.message) || e || ''); const code = String((e && e.code) || '');
    if (e) console.warn('[auth]', code || (e && e.status) || '', m); // o texto original ajuda a diagnosticar no console
    // envio do e-mail de confirmação: limite de envios por hora ou servidor de e-mail do Supabase recusando o endereço
    if (/over_email_send_rate_limit|email_address_not_authorized/.test(code) || /email rate limit|sending (confirmation|magic link|recovery)|confirmation email|not authorized/i.test(m)) {
      return Object.assign(erro('Não conseguimos enviar o e-mail de confirmação agora. Seus dados não foram perdidos: tente de novo em alguns minutos ou fale com o assessor.'), { email: true });
    }
    if (/Invalid login credentials/i.test(m)) return erro('E-mail ou senha incorretos.');
    if (/Email not confirmed/i.test(m)) return erro('Confirme seu e-mail antes de entrar. Procure a mensagem de confirmação na sua caixa de entrada.');
    if (/already registered|already been registered/i.test(m)) return erro('Este e-mail já tem conta. Entre ou recupere a senha.');
    if (/Password should be at least|weak/i.test(m)) return erro('Use uma senha com pelo menos 8 caracteres.');
    if (/rate limit|too many/i.test(m) || (e && e.status === 429)) return erro('Muitas tentativas seguidas deste aparelho. Aguarde alguns minutos e tente de novo.');
    if (/network|fetch/i.test(m)) return erro('Sem conexão com o servidor. Verifique sua internet.');
    // qualquer outro erro: mostra o código do Supabase para o cliente poder repassar ao assessor
    const ref = code || (/database error/i.test(m) ? 'erro no banco' : e && e.status ? 'status ' + e.status : '');
    return erro(`Não foi possível concluir agora. Tente novamente.${ref ? ` (motivo: ${ref})` : ''}`);
  };
  const U = (u) => (u ? { id: u.id, email: u.email, nome: (u.user_metadata && u.user_metadata.nome) || '', whatsapp: (u.user_metadata && u.user_metadata.whatsapp) || '' } : null);
  const need = ({ data, error }) => { if (error) throw error; return data; };
  const siteUrl = () => (CFG.siteUrl || (location.origin + location.pathname));

  const Cloud = {
    mode: 'cloud',
    async init() {
      if (!(window.supabase && window.supabase.createClient)) await loadScript(SUPABASE_JS, SUPABASE_SRI);
      sb = window.supabase.createClient(CFG.supabase.url, CFG.supabase.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const { data } = await sb.auth.getSession();
      return U(data && data.session && data.session.user);
    },
    async signUp({ nome, email, password, whatsapp }) {
      try {
        const d = need(await sb.auth.signUp({ email, password, options: { data: { nome, whatsapp }, emailRedirectTo: siteUrl() } }));
        return { user: U(d.user), needsVerify: !d.session };
      } catch (e) { throw mapErr(e); }
    },
    async signIn({ email, password }) {
      try { const d = need(await sb.auth.signInWithPassword({ email, password })); return { user: U(d.user) }; } catch (e) { throw mapErr(e); }
    },
    async signOut() { await sb.auth.signOut(); },
    async resetPassword(email) { try { need(await sb.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() })); } catch (e) { throw mapErr(e); } },
    async updatePassword(password) { try { need(await sb.auth.updateUser({ password })); } catch (e) { throw mapErr(e); } },
    onAuth(cb) { sb.auth.onAuthStateChange((event, session) => cb(event, U(session && session.user))); },
    async loadAll(user) {
      const uid = user.id;
      const [p, pl, a, c, rc] = await Promise.all([
        sb.from('perfis').select('*').eq('user_id', uid).maybeSingle(),
        sb.from('planos').select('ano,dados,atualizado_em').eq('user_id', uid),
        sb.from('assinaturas').select('plano,status').eq('user_id', uid).maybeSingle(),
        sb.from('consultores').select('user_id').eq('user_id', uid).maybeSingle(),
        sb.from('recomendacoes').select('carteira,notas,atualizado_em').eq('user_id', uid).maybeSingle(),
      ]);
      [p, pl, a, c].forEach((r) => { if (r.error) throw r.error; });
      const planos = {}; (pl.data || []).forEach((r) => { planos[r.ano] = r.dados; });
      const perfil = p.data ? Object.assign({}, p.data.dados || {}, { nome: p.data.nome, email: p.data.email, whatsapp: p.data.whatsapp, criadoEm: p.data.criado_em }) : null;
      return { perfil, planos, assinatura: a.data || { plano: 'gratis', status: 'ativo' }, isAdmin: !!c.data, recomendacao: rc && !rc.error ? rc.data : null };
    },
    async saveProfile(p, user) {
      const { nome, email, whatsapp, criadoEm, ...dados } = p;
      need(await sb.from('perfis').upsert({ user_id: user.id, nome, email: email || user.email, whatsapp, dados, atualizado_em: new Date().toISOString() }, { onConflict: 'user_id' }));
    },
    async savePlan(year, dados, user) { need(await sb.from('planos').upsert({ user_id: user.id, ano: year, dados, atualizado_em: new Date().toISOString() }, { onConflict: 'user_id,ano' })); },
    async deletePlan(year, user) { need(await sb.from('planos').delete().eq('user_id', user.id).eq('ano', year)); },
    async listClients() {
      const [p, a] = await Promise.all([
        sb.from('perfis').select('user_id,nome,email,whatsapp,dados,criado_em').order('criado_em', { ascending: false }),
        sb.from('assinaturas').select('user_id,plano,status'),
      ]);
      [p, a].forEach((r) => { if (r.error) throw r.error; });
      const by = {}; (a.data || []).forEach((x) => { by[x.user_id] = x; });
      return (p.data || []).map((x) => ({ id: x.user_id, nome: x.nome, email: x.email, whatsapp: x.whatsapp, dados: x.dados || {}, criadoEm: x.criado_em, plano: (by[x.user_id] || {}).plano || 'gratis', status: (by[x.user_id] || {}).status || 'ativo' }));
    },
    async loadClient(userId) { // consultor: perfil, assinatura, recomendação e, só para clientes da Assessoria, os planejamentos (RLS)
      const [p, pl, a, rc] = await Promise.all([
        sb.from('perfis').select('*').eq('user_id', userId).maybeSingle(),
        sb.from('planos').select('ano,dados').eq('user_id', userId),
        sb.from('assinaturas').select('plano,status').eq('user_id', userId).maybeSingle(),
        sb.from('recomendacoes').select('carteira,notas,atualizado_em').eq('user_id', userId).maybeSingle(),
      ]);
      [p, pl, a].forEach((r) => { if (r.error) throw r.error; });
      const planos = {}; (pl.data || []).forEach((r) => { planos[r.ano] = r.dados; });
      const perfil = p.data ? Object.assign({}, p.data.dados || {}, { nome: p.data.nome, email: p.data.email, whatsapp: p.data.whatsapp }) : null;
      return { perfil, planos, assinatura: a.data || { plano: 'gratis', status: 'ativo' }, recomendacao: rc && !rc.error ? rc.data : null };
    },
    async saveRecomendacao(userId, rec) { need(await sb.from('recomendacoes').upsert({ user_id: userId, carteira: rec.carteira || [], notas: rec.notas || '', atualizado_em: new Date().toISOString() }, { onConflict: 'user_id' })); },
    async uploadIngest(file, user) { // PDF vai para o bucket privado "ingestao", numa pasta com o id do usuário
      const bucket = (CFG.ingestao && CFG.ingestao.bucket) || 'ingestao'; const nome = String(file.name || 'arquivo').replace(/[^\w.\-]+/g, '_'); const caminho = `${user.id}/${Date.now()}-${nome}`;
      const r = await sb.storage.from(bucket).upload(caminho, file, { contentType: file.type || 'application/pdf', upsert: false }); if (r.error) throw erro('Não foi possível enviar o arquivo para leitura.');
      return caminho;
    },
    async ingestIA(payload) {
      const r = await sb.functions.invoke((CFG.ingestao && CFG.ingestao.funcao) || 'ingest-statement', { body: payload });
      if (r.error) throw erro('A leitura por IA não respondeu agora. Tente de novo em instantes.'); return r.data;
    },
    // exclui a conta: apaga os arquivos que tenham sobrado na pasta privada e chama a função do banco, que remove o usuário e,
    // em cascata, perfil, planejamentos, assinatura e recomendação (migration 003)
    async deleteAccount(user) {
      const bucket = (CFG.ingestao && CFG.ingestao.bucket) || 'ingestao';
      try { const l = await sb.storage.from(bucket).list(user.id); if (l.data && l.data.length) await sb.storage.from(bucket).remove(l.data.map((f) => `${user.id}/${f.name}`)); } catch (e) { /* segue: os arquivos já são apagados após a leitura */ }
      try { need(await sb.rpc('excluir_minha_conta')); } catch (e) { throw erro('Não foi possível excluir a conta agora. Tente de novo ou fale com o assessor.'); }
      try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { /* a conta já não existe */ }
    },
    async setPlano(userId, plano, status) { need(await sb.from('assinaturas').upsert({ user_id: userId, plano, status: status || 'ativo', atualizado_em: new Date().toISOString() }, { onConflict: 'user_id' })); },
  };

  return cloud ? Cloud : Local;
})();

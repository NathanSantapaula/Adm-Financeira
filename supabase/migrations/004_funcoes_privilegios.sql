-- 004: fecha execução de funções SECURITY DEFINER para quem não deve chamá-las.
-- is_consultor() é usada nas regras de RLS, então continua liberada para usuários logados (authenticated),
-- mas sai do anon (visitante sem login). nova_assinatura() é trigger: nunca deve ser chamada por RPC.
-- Pode rodar de novo sem erro (REVOKE é idempotente).

revoke execute on function public.is_consultor() from anon, public;
grant execute on function public.is_consultor() to authenticated;

revoke execute on function public.nova_assinatura() from anon, authenticated, public;

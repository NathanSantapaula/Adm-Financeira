-- 003: LGPD e segurança. Rode no SQL Editor do Supabase; pode rodar de novo sem erro. Também está em schema.sql (instalações novas).

-- 1) Excluir a própria conta (LGPD, art. 18, VI; exigido pela App Store): apaga o usuário de login e, em cascata,
--    perfil, planejamentos, assinatura, recomendação e a linha de consultor. Só a própria conta: usa auth.uid().
create or replace function public.excluir_minha_conta() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'não autenticado'; end if;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;

-- 2) O e-mail do perfil é sempre o da conta de login: o cliente não consegue aparecer para o consultor com outro e-mail.
create or replace function public.perfil_email() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  select u.email into new.email from auth.users u where u.id = new.user_id;
  return new;
end $$;
drop trigger if exists perfis_email on public.perfis;
create trigger perfis_email before insert or update on public.perfis for each row execute function public.perfil_email();

-- 3) Limites de tamanho (evitam abuso de espaço): perfil até 1 MB (inclui a foto), cada ano de planejamento até 5 MB,
--    nome até 200 caracteres e WhatsApp até 40. "not valid": vale para gravações novas sem travar dados antigos.
alter table public.perfis drop constraint if exists perfis_dados_tamanho;
alter table public.perfis add constraint perfis_dados_tamanho check (pg_column_size(dados) < 1048576) not valid;
alter table public.perfis drop constraint if exists perfis_textos;
alter table public.perfis add constraint perfis_textos check (char_length(coalesce(nome, '')) <= 200 and char_length(coalesce(whatsapp, '')) <= 40) not valid;
alter table public.planos drop constraint if exists planos_dados_tamanho;
alter table public.planos add constraint planos_dados_tamanho check (pg_column_size(dados) < 5242880) not valid;

-- 4) Espaço da leitura por IA: só PDF e até 10 MB por arquivo.
update storage.buckets set file_size_limit = 10485760, allowed_mime_types = array['application/pdf'] where id = 'ingestao';

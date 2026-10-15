-- Migração 002: 3 planos, recomendação do assessor, visão do consultor e ingestão por IA.
-- Para projetos que JÁ rodaram o schema.sql anterior: cole no SQL Editor do Supabase e execute (pode repetir sem problemas).
alter table public.assinaturas drop constraint if exists assinaturas_plano_check;
alter table public.assinaturas add constraint assinaturas_plano_check check (plano in ('gratis', 'investidor', 'completo'));

-- Recomendação do assessor para cada cliente (carteira recomendada e notas). O cliente lê; só o consultor grava.
create table if not exists public.recomendacoes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  carteira jsonb not null default '[]'::jsonb,
  notas text not null default '',
  atualizado_em timestamptz not null default now()
);
alter table public.recomendacoes enable row level security;
drop policy if exists "recomendacoes: dono le" on public.recomendacoes;
create policy "recomendacoes: dono le" on public.recomendacoes for select using (auth.uid() = user_id);
drop policy if exists "recomendacoes: consultor" on public.recomendacoes;
create policy "recomendacoes: consultor" on public.recomendacoes for all using (public.is_consultor()) with check (public.is_consultor());

-- Visão do consultor: lê os planejamentos apenas de clientes com a Assessoria ativa
drop policy if exists "planos: consultor le assessoria" on public.planos;
create policy "planos: consultor le assessoria" on public.planos for select using (
  public.is_consultor() and exists (select 1 from public.assinaturas a where a.user_id = planos.user_id and a.plano = 'completo' and a.status = 'ativo')
);

-- Ingestão por IA: bucket privado; cada usuário só mexe na pasta com o próprio id
insert into storage.buckets (id, name, public) values ('ingestao', 'ingestao', false) on conflict (id) do nothing;
drop policy if exists "ingestao: dono envia" on storage.objects;
create policy "ingestao: dono envia" on storage.objects for insert to authenticated with check (bucket_id = 'ingestao' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "ingestao: dono le" on storage.objects;
create policy "ingestao: dono le" on storage.objects for select to authenticated using (bucket_id = 'ingestao' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "ingestao: dono apaga" on storage.objects;
create policy "ingestao: dono apaga" on storage.objects for delete to authenticated using (bucket_id = 'ingestao' and (storage.foldername(name))[1] = auth.uid()::text);

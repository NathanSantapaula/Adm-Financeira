-- Financial planning: banco de dados (Supabase / PostgreSQL)
-- Como usar: Supabase > SQL Editor > cole este arquivo inteiro e execute (pode rodar de novo sem problemas).
-- Segurança: cada cliente só enxerga os próprios dados (RLS). O consultor (tabela "consultores") enxerga apenas
-- perfis e assinaturas, nunca os planejamentos financeiros detalhados dos clientes.

create table if not exists public.perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  whatsapp text,
  dados jsonb not null default '{}'::jsonb,   -- preferências, patrimônio inicial, perfil de investidor, objetivo, carteira-alvo
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.planos (
  user_id uuid not null references auth.users(id) on delete cascade,
  ano int not null check (ano between 1990 and 2100),
  dados jsonb not null,                        -- rendas, despesas, orçamento, ativos do ano
  atualizado_em timestamptz not null default now(),
  primary key (user_id, ano)
);

create table if not exists public.assinaturas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plano text not null default 'gratis' check (plano in ('gratis', 'completo')),
  status text not null default 'ativo' check (status in ('ativo', 'pendente', 'cancelado')),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.consultores (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Função auxiliar: o usuário logado é consultor?
create or replace function public.is_consultor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.consultores where user_id = auth.uid());
$$;

-- Todo novo usuário nasce com assinatura gratuita
create or replace function public.nova_assinatura() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.assinaturas (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users for each row execute function public.nova_assinatura();

-- Regras de acesso (RLS)
alter table public.perfis enable row level security;
alter table public.planos enable row level security;
alter table public.assinaturas enable row level security;
alter table public.consultores enable row level security;

drop policy if exists "perfis: dono" on public.perfis;
create policy "perfis: dono" on public.perfis for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "perfis: consultor le" on public.perfis;
create policy "perfis: consultor le" on public.perfis for select using (public.is_consultor());

drop policy if exists "planos: dono" on public.planos;
create policy "planos: dono" on public.planos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Assinatura: o cliente só LÊ a própria; quem altera é o consultor (ou o painel do Supabase/webhook de pagamento)
drop policy if exists "assinaturas: dono le" on public.assinaturas;
create policy "assinaturas: dono le" on public.assinaturas for select using (auth.uid() = user_id);
drop policy if exists "assinaturas: consultor" on public.assinaturas;
create policy "assinaturas: consultor" on public.assinaturas for all using (public.is_consultor()) with check (public.is_consultor());

drop policy if exists "consultores: le a propria linha" on public.consultores;
create policy "consultores: le a propria linha" on public.consultores for select using (auth.uid() = user_id);

-- DEPOIS de criar a sua conta no site, torne-se consultor (troque pelo seu e-mail):
-- insert into public.consultores (user_id) select id from auth.users where email = 'seu-email@exemplo.com';

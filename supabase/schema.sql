-- Execute este script no Supabase > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  pessoa text not null,
  tipo text not null check (tipo in ('entrada', 'gasto')),
  valor numeric(12, 2) not null check (valor > 0),
  descricao text,
  criado_em timestamptz not null default now()
);

alter table public.lancamentos enable row level security;

-- ATENÇÃO: estas políticas permitem leitura, inclusão e exclusão sem login.
-- Use somente se aceitar que qualquer pessoa que obtenha a URL e a chave
-- pública do projeto possa acessar os lançamentos. Veja o README para opções.
create policy "Leitura pública dos lançamentos"
on public.lancamentos for select
to anon
using (true);

create policy "Inclusão pública dos lançamentos"
on public.lancamentos for insert
to anon
with check (
  tipo in ('entrada', 'gasto')
  and valor > 0
  and length(trim(pessoa)) > 0
);

create policy "Exclusão pública dos lançamentos"
on public.lancamentos for delete
to anon
using (true);

grant select, insert, delete on public.lancamentos to anon;

-- Run on a new AulaPilot Português Supabase project.
create extension if not exists pgcrypto;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  kind text not null check (kind in ('slides','atividade','avaliacao','mapa_mental','jornal','plano_aula','aula_emergencia')),
  grade text not null,
  topic text not null,
  content jsonb not null default '{"blocks":[]}'::jsonb,
  status text not null default 'draft' check (status in ('draft','ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index materials_owner_created_idx on public.materials(owner_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.materials enable row level security;
create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid())=id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy materials_select on public.materials for select to authenticated using ((select auth.uid())=owner_id);
create policy materials_insert on public.materials for insert to authenticated with check ((select auth.uid())=owner_id);
create policy materials_update on public.materials for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy materials_delete on public.materials for delete to authenticated using ((select auth.uid())=owner_id);
grant select,insert,update on public.profiles to authenticated;
grant select,insert,update,delete on public.materials to authenticated;

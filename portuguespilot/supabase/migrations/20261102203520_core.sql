-- PortuguêsPilot — estrutura principal.
-- Cada professor administra apenas a própria conta: não há painel de escola
-- nem administrador global. Todo acesso passa por RLS.

create extension if not exists pgcrypto;

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text        not null default '' check (char_length(full_name) <= 120),
  school      text        not null default '' check (char_length(school) <= 160),
  city        text        not null default '' check (char_length(city) <= 120),
  stage       text        not null default 'fundamental2'
              check (stage in ('fundamental1','fundamental2','medio','eja','superior','outro')),
  grades      text[]      not null default '{}',
  plan        text        not null default 'free' check (plan in ('free','pro','escola')),
  theme       text        not null default 'system' check (theme in ('system','light','dark')),
  onboarded   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Dados pedagógicos do professor. Cada professor administra apenas a própria conta.';

create table public.materials (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid        not null references auth.users(id) on delete cascade,
  title       text        not null check (char_length(title) between 1 and 180),
  kind        text        not null check (kind in (
                'slides','atividade','avaliacao','mapa_mental',
                'jornal','plano_aula','aula_emergencia','redacao')),
  grade       text        not null default '' check (char_length(grade) <= 80),
  topic       text        not null default '' check (char_length(topic) <= 600),
  content     jsonb       not null default '{}'::jsonb,
  status      text        not null default 'draft' check (status in ('draft','ready','archived')),
  is_favorite boolean     not null default false,
  tags        text[]      not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint materials_content_size check (pg_column_size(content) < 6000000)
);

create index materials_owner_created_idx on public.materials (owner_id, created_at desc);
create index materials_owner_kind_idx    on public.materials (owner_id, kind);
create index materials_favorite_idx      on public.materials (owner_id) where is_favorite;
create index materials_search_idx        on public.materials
  using gin (to_tsvector('portuguese', title || ' ' || topic));

create table public.notices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  title      text        not null check (char_length(title) between 1 and 160),
  body       text        not null default '' check (char_length(body) <= 600),
  kind       text        not null default 'info' check (kind in ('info','success','warning')),
  href       text        not null default '' check (char_length(href) <= 300),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notices_user_created_idx on public.notices (user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch  before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger materials_touch before update on public.materials
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120))
  on conflict (id) do nothing;

  insert into public.notices (user_id, title, body, kind, href)
  values (
    new.id,
    'Bem-vindo(a) ao PortuguêsPilot',
    'Complete seu perfil em 30 segundos e o sistema já começa a sugerir materiais para as suas turmas.',
    'success',
    '/dashboard/conta'
  );

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles  enable row level security;
alter table public.materials enable row level security;
alter table public.notices   enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy materials_select on public.materials
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy materials_insert on public.materials
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy materials_update on public.materials
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy materials_delete on public.materials
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy notices_select on public.notices
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notices_insert on public.notices
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notices_update on public.notices
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy notices_delete on public.notices
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update         on public.profiles  to authenticated;
grant select, insert, update, delete on public.materials to authenticated;
grant select, insert, update, delete on public.notices   to authenticated;

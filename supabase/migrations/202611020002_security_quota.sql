-- Execute depois de 202611020001_initial.sql. Não use projetos de outros produtos.
create table if not exists public.generation_usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null default (now() at time zone 'utc')::date,
 used integer not null default 0 check (used >= 0),
 primary key(user_id,day)
);
alter table public.generation_usage enable row level security;
-- Nenhuma política de leitura/escrita direta: apenas a função interna pode consumir créditos.
revoke all on public.generation_usage from anon,authenticated;
create or replace function public.consume_generation_quota(p_action text,p_max_daily integer default 15)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_used integer;
begin
 if auth.uid() is null or p_action not in ('slides','atividade','mapa_mental') or p_max_daily <> 15 then return false; end if;
 insert into public.generation_usage(user_id,day,used)
 values(auth.uid(),(now() at time zone 'utc')::date,1)
 on conflict (user_id,day) do update set used=public.generation_usage.used+1
 where public.generation_usage.used < p_max_daily
 returning used into v_used;
 return v_used is not null;
end $$;
revoke all on function public.consume_generation_quota(text,integer) from public,anon;
grant execute on function public.consume_generation_quota(text,integer) to authenticated;

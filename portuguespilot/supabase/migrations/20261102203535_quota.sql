-- Limite diário de gerações, contado de forma atômica no banco.
-- O navegador nunca escreve nesta tabela: se pudesse, bastaria editar o
-- contador para gerar sem limite.

create table public.generation_usage (
  user_id uuid    not null references auth.users(id) on delete cascade,
  day     date    not null default (now() at time zone 'utc')::date,
  used    integer not null default 0 check (used >= 0),
  primary key (user_id, day)
);

comment on table public.generation_usage is
  'Contador diário de gerações. Só as funções internas escrevem aqui.';

alter table public.generation_usage enable row level security;
revoke all on public.generation_usage from anon, authenticated;

create or replace function public.plan_daily_limit(p_plan text)
returns integer language sql immutable set search_path = '' as $$
  select case p_plan
    when 'pro'    then 200
    when 'escola' then 500
    else 15
  end
$$;

create or replace function public.consume_generation_quota(p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_limit integer;
  v_used  integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  if p_action not in ('slides','atividade','avaliacao','mapa_mental',
                      'jornal','plano_aula','aula_emergencia','redacao') then
    return jsonb_build_object('ok', false, 'reason', 'invalid_action');
  end if;

  select public.plan_daily_limit(plan) into v_limit
  from public.profiles where id = v_uid;
  v_limit := coalesce(v_limit, 15);

  insert into public.generation_usage (user_id, day, used)
  values (v_uid, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set used = public.generation_usage.used + 1
    where public.generation_usage.used < v_limit
  returning used into v_used;

  if v_used is null then
    return jsonb_build_object('ok', false, 'reason', 'limit',
                              'limit', v_limit, 'used', v_limit, 'remaining', 0);
  end if;

  return jsonb_build_object('ok', true, 'used', v_used,
                            'limit', v_limit, 'remaining', v_limit - v_used);
end $$;

create or replace function public.generation_status()
returns jsonb language plpgsql security definer stable set search_path = '' as $$
declare
  v_uid   uuid := auth.uid();
  v_plan  text;
  v_limit integer;
  v_used  integer;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  select plan into v_plan from public.profiles where id = v_uid;
  v_plan  := coalesce(v_plan, 'free');
  v_limit := public.plan_daily_limit(v_plan);

  select used into v_used from public.generation_usage
  where user_id = v_uid and day = (now() at time zone 'utc')::date;
  v_used := coalesce(v_used, 0);

  return jsonb_build_object('ok', true, 'plan', v_plan, 'used', v_used,
                            'limit', v_limit,
                            'remaining', greatest(v_limit - v_used, 0));
end $$;

revoke all on function public.consume_generation_quota(text) from public, anon;
revoke all on function public.generation_status()            from public, anon;
revoke all on function public.plan_daily_limit(text)         from public, anon;

grant execute on function public.consume_generation_quota(text) to authenticated;
grant execute on function public.generation_status()            to authenticated;

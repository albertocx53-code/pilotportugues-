-- Devolve uma geração quando o provedor de IA falha depois de a quota ter sido
-- consumida. Só o service_role pode chamar: se o navegador pudesse chamar,
-- bastaria repetir a chamada para zerar o contador e gerar sem limite.

create or replace function public.refund_generation_quota(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
  v_used integer;
begin
  if v_role <> 'service_role' then
    return false;
  end if;

  update public.generation_usage
     set used = used - 1
   where user_id = p_user_id
     and day = (now() at time zone 'utc')::date
     and used > 0
  returning used into v_used;

  return v_used is not null;
end $$;

revoke all on function public.refund_generation_quota(uuid) from public, anon, authenticated;

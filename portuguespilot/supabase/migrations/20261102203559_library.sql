-- Funções da biblioteca: contagens para o painel e duplicação de material.
-- Ambas rodam como o próprio usuário (security invoker), então a RLS continua
-- valendo e ninguém lê material de outra conta.

create or replace function public.library_stats()
returns jsonb language plpgsql security invoker stable set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_out jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false);
  end if;

  select jsonb_build_object(
    'ok',        true,
    'total',     count(*),
    'favorites', count(*) filter (where is_favorite),
    'week',      count(*) filter (where created_at > now() - interval '7 days'),
    'ready',     count(*) filter (where status = 'ready'),
    'by_kind',   coalesce(jsonb_object_agg(kind, k) filter (where kind is not null), '{}'::jsonb)
  )
  into v_out
  from (
    select kind, is_favorite, status, created_at,
           count(*) over (partition by kind) as k
    from public.materials
    where owner_id = v_uid
  ) t;

  return coalesce(v_out, jsonb_build_object('ok', true, 'total', 0, 'favorites', 0,
                                            'week', 0, 'ready', 0, 'by_kind', '{}'::jsonb));
end $$;

create or replace function public.duplicate_material(p_id uuid)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_new uuid;
begin
  if v_uid is null then
    raise exception 'Sessão necessária';
  end if;

  insert into public.materials (owner_id, title, kind, grade, topic, content, status, tags)
  select owner_id,
         left(title || ' (cópia)', 180),
         kind, grade, topic, content, 'draft', tags
  from public.materials
  where id = p_id and owner_id = v_uid
  returning id into v_new;

  if v_new is null then
    raise exception 'Material não encontrado';
  end if;

  return v_new;
end $$;

revoke all on function public.library_stats()          from public, anon;
revoke all on function public.duplicate_material(uuid) from public, anon;
grant execute on function public.library_stats()          to authenticated;
grant execute on function public.duplicate_material(uuid) to authenticated;

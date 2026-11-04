-- Renomeia o produto nos textos guardados no banco.
-- O aviso de boas-vindas era criado com o nome antigo do projeto.

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

update public.notices
   set title = replace(replace(title, 'Pilot Português', 'PortuguêsPilot'),
                       'AulaPilot Português', 'PortuguêsPilot')
 where title like '%Pilot%';

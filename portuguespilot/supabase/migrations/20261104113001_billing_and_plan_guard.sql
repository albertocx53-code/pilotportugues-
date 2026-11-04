-- Cobrança + proteção contra auto-promoção de plano.
--
-- IMPORTANTE: a política `profiles_update` permite ao professor editar a
-- própria linha. Sem o gatilho abaixo, qualquer pessoa logada poderia rodar
-- `update profiles set plan='escola'` pelo navegador e passar de 15 para 500
-- gerações por dia sem pagar. O gatilho devolve os valores antigos de todas as
-- colunas de plano e cobrança, a menos que a chamada venha da service role
-- (ou seja, do webhook do Stripe).

alter table public.profiles
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists plan_status            text not null default 'active',
  add column if not exists plan_renews_at         timestamptz;

alter table public.profiles drop constraint if exists profiles_plan_status_check;
alter table public.profiles add constraint profiles_plan_status_check
  check (plan_status in ('active','past_due','canceled','trialing'));

create unique index if not exists profiles_stripe_customer_idx
  on public.profiles(stripe_customer_id) where stripe_customer_id is not null;

create or replace function public.guard_profile_billing()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
  if v_role = 'service_role' then
    return new;
  end if;

  new.plan                   := old.plan;
  new.plan_status            := old.plan_status;
  new.plan_renews_at         := old.plan_renews_at;
  new.stripe_customer_id     := old.stripe_customer_id;
  new.stripe_subscription_id := old.stripe_subscription_id;
  new.id                     := old.id;
  new.created_at             := old.created_at;
  return new;
end $$;

drop trigger if exists profiles_guard_billing on public.profiles;
create trigger profiles_guard_billing
  before update on public.profiles
  for each row execute function public.guard_profile_billing();

revoke all on function public.guard_profile_billing() from public, anon, authenticated;

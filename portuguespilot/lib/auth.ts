import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export type Perfil = {
  id: string;
  full_name: string;
  school: string;
  city: string;
  stage: string;
  grades: string[];
  plan: string;
  plan_status: string;
  plan_renews_at: string | null;
  theme: 'system' | 'light' | 'dark';
  onboarded: boolean;
};

const PERFIL_COLUNAS =
  'id,full_name,school,city,stage,grades,plan,plan_status,plan_renews_at,theme,onboarded';

export async function requireUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user };
}

/** Usuário + perfil. Redireciona ao onboarding em acesso novo. */
export async function requirePerfil(opcoes?: { permitirSemOnboarding?: boolean }) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from('profiles')
    .select(PERFIL_COLUNAS)
    .eq('id', user.id)
    .maybeSingle();

  const perfil = (data ?? {
    id: user.id,
    full_name: '',
    school: '',
    city: '',
    stage: 'fundamental2',
    grades: [],
    plan: 'free',
    plan_status: 'active',
    plan_renews_at: null,
    theme: 'system',
    onboarded: false,
  }) as Perfil;

  if (!perfil.onboarded && !opcoes?.permitirSemOnboarding) redirect('/onboarding');

  return { supabase, user, perfil };
}

export function primeiroNome(perfil: Perfil, emailReserva?: string | null): string {
  const nome = (perfil.full_name || '').trim();
  if (nome) return nome.split(/\s+/)[0];
  const email = (emailReserva || '').split('@')[0];
  return email ? email.charAt(0).toUpperCase() + email.slice(1) : 'professor';
}

import { createClient } from '@supabase/supabase-js';

/**
 * Cliente com a service role key. Use SOMENTE no webhook do Stripe, que não
 * tem sessão de usuário e precisa alterar o plano do perfil (o gatilho
 * `profiles_guard_billing` só aceita mudança de plano vinda daqui).
 *
 * Esta chave nunca pode chegar ao navegador: não prefixe com NEXT_PUBLIC_.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import { apiUser, falha, ok } from '@/lib/api-security';
import { cobrancaAtiva, stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

/** Abre o portal do Stripe, onde o professor troca cartão ou cancela. */
export async function POST(req: Request) {
  const sessao = await apiUser();
  if (!sessao) return falha('Sua sessão expirou. Entre de novo.', 401);

  if (!cobrancaAtiva()) {
    return falha('A cobrança ainda não está configurada neste servidor.', 503);
  }

  const { data: perfil } = await sessao.db
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', sessao.user.id)
    .maybeSingle();

  if (!perfil?.stripe_customer_id) {
    return falha('Você ainda não tem assinatura para gerenciar.', 400);
  }

  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: perfil.stripe_customer_id,
      return_url: `${new URL(req.url).origin}/dashboard/planos`,
    });
    return ok({ url: portal.url });
  } catch {
    return falha('Não foi possível abrir o portal de cobrança.', 502);
  }
}

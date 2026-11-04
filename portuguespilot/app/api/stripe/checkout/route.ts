import { apiUser, falha, ok } from '@/lib/api-security';
import { cobrancaAtiva, priceDoPlano, stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * Abre a sessão de pagamento. O plano NUNCA é alterado aqui: quem muda o
 * plano é o webhook, depois de o Stripe confirmar o pagamento.
 */
export async function POST(req: Request) {
  const sessao = await apiUser();
  if (!sessao) return falha('Sua sessão expirou. Entre de novo.', 401);

  if (!cobrancaAtiva()) {
    return falha(
      'A cobrança ainda não está configurada neste servidor. Configure as chaves do Stripe.',
      503,
    );
  }

  let corpo: { plano?: string };
  try {
    corpo = await req.json();
  } catch {
    return falha('Não foi possível ler os dados enviados.');
  }

  const plano = corpo.plano;
  if (plano !== 'pro' && plano !== 'escola') return falha('Plano inválido.');

  const price = priceDoPlano(plano);
  if (!price) return falha(`Falta configurar o price do plano ${plano}.`, 503);

  const origem = new URL(req.url).origin;

  try {
    const { data: perfil } = await sessao.db
      .from('profiles')
      .select('stripe_customer_id,full_name')
      .eq('id', sessao.user.id)
      .maybeSingle();

    let customer = perfil?.stripe_customer_id ?? undefined;

    /* Cria o cliente no Stripe na primeira assinatura e guarda o id. */
    if (!customer) {
      const criado = await stripe().customers.create({
        email: sessao.user.email,
        name: perfil?.full_name || undefined,
        metadata: { supabase_user_id: sessao.user.id },
      });
      customer = criado.id;

      /* A coluna é protegida pelo gatilho: só a service role grava. */
      await supabaseAdmin()
        .from('profiles')
        .update({ stripe_customer_id: customer })
        .eq('id', sessao.user.id);
    }

    const checkout = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price, quantity: 1 }],
      allow_promotion_codes: true,
      locale: 'pt-BR',
      success_url: `${origem}/dashboard/planos?assinatura=ok`,
      cancel_url: `${origem}/dashboard/planos?assinatura=cancelada`,
      subscription_data: {
        metadata: { supabase_user_id: sessao.user.id, plano },
      },
      metadata: { supabase_user_id: sessao.user.id, plano },
    });

    if (!checkout.url) throw new Error('sem url');
    return ok({ url: checkout.url });
  } catch {
    return falha('Não foi possível abrir o pagamento. Tente novamente.', 502);
  }
}

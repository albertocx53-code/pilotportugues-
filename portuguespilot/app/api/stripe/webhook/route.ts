import type Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { planoDoPrice, stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * Webhook do Stripe: a ÚNICA porta por onde o plano de um professor muda.
 *
 * A assinatura do corpo é verificada com STRIPE_WEBHOOK_SECRET; sem isso
 * qualquer pessoa poderia enviar um POST e virar assinante. Usamos a service
 * role porque o gatilho `profiles_guard_billing` recusa mudança de plano
 * vinda de qualquer outro papel.
 */
export async function POST(req: Request) {
  const assinatura = req.headers.get('stripe-signature');
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;

  if (!assinatura || !segredo) {
    return NextResponse.json({ error: 'webhook não configurado' }, { status: 503 });
  }

  const bruto = await req.text();

  let evento: Stripe.Event;
  try {
    evento = stripe().webhooks.constructEvent(bruto, assinatura, segredo);
  } catch {
    return NextResponse.json({ error: 'assinatura inválida' }, { status: 400 });
  }

  try {
    switch (evento.type) {
      case 'checkout.session.completed': {
        const sessao = evento.data.object as Stripe.Checkout.Session;
        if (sessao.subscription) {
          const assinatura = await stripe().subscriptions.retrieve(
            String(sessao.subscription),
          );
          await aplicarAssinatura(assinatura);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await aplicarAssinatura(evento.data.object as Stripe.Subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const fatura = evento.data.object as Stripe.Invoice;
        const perfil = await acharPerfil(String(fatura.customer), null);
        if (perfil) {
          await supabaseAdmin()
            .from('profiles')
            .update({ plan_status: 'past_due' })
            .eq('id', perfil);
          await avisar(
            perfil,
            'Pagamento não aprovado',
            'Atualize a forma de pagamento para manter seu plano ativo.',
            'warning',
            '/dashboard/planos',
          );
        }
        break;
      }

      default:
        break;
    }
  } catch {
    /* Devolver 500 faz o Stripe tentar de novo, o que é o comportamento certo. */
    return NextResponse.json({ error: 'falha ao processar' }, { status: 500 });
  }

  return NextResponse.json({ recebido: true });
}

/* ---------------------------------------------------------------- */

async function aplicarAssinatura(assinatura: Stripe.Subscription) {
  const userId = await acharPerfil(
    String(assinatura.customer),
    (assinatura.metadata?.supabase_user_id as string) ?? null,
  );
  if (!userId) return;

  const priceId = assinatura.items.data[0]?.price?.id ?? '';
  const planoPago = planoDoPrice(priceId);

  /* Assinatura válida mantém o plano; qualquer outro estado volta ao gratuito. */
  const ativa = ['active', 'trialing', 'past_due'].includes(assinatura.status);
  const plano = ativa && planoPago ? planoPago : 'free';

  const status =
    assinatura.status === 'trialing'
      ? 'trialing'
      : assinatura.status === 'past_due' || assinatura.status === 'unpaid'
        ? 'past_due'
        : assinatura.status === 'active'
          ? 'active'
          : 'canceled';

  const fim = (assinatura as unknown as { current_period_end?: number })
    .current_period_end;

  await supabaseAdmin()
    .from('profiles')
    .update({
      plan: plano,
      plan_status: status,
      stripe_subscription_id: assinatura.id,
      stripe_customer_id: String(assinatura.customer),
      plan_renews_at: fim ? new Date(fim * 1000).toISOString() : null,
    })
    .eq('id', userId);

  if (plano !== 'free' && status === 'active') {
    await avisar(
      userId,
      `Plano ${plano === 'pro' ? 'Professor' : 'Escola'} ativo`,
      'Seu limite diário de gerações já foi aumentado.',
      'success',
      '/dashboard/planos',
    );
  }

  if (plano === 'free' && status === 'canceled') {
    await avisar(
      userId,
      'Assinatura encerrada',
      'Sua conta voltou ao plano gratuito, com 15 gerações por dia. Seus materiais continuam salvos.',
      'info',
      '/dashboard/planos',
    );
  }
}

/** Acha o professor pelo id nos metadados ou pelo customer do Stripe. */
async function acharPerfil(
  customerId: string,
  userIdDosMetadados: string | null,
): Promise<string | null> {
  if (userIdDosMetadados) return userIdDosMetadados;

  const { data } = await supabaseAdmin()
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.id ?? null;
}

async function avisar(
  userId: string,
  title: string,
  body: string,
  kind: 'info' | 'success' | 'warning',
  href: string,
) {
  await supabaseAdmin().from('notices').insert({ user_id: userId, title, body, kind, href });
}

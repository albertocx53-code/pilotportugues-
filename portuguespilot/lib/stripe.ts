import Stripe from 'stripe';

/**
 * Cliente do Stripe. Criado por chamada (e não no topo do módulo) para que o
 * build não falhe em ambiente sem as chaves configuradas — a cobrança é
 * opcional e o resto do sistema funciona sem ela.
 */
export function stripe(): Stripe {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) throw new Error('STRIPE_SECRET_KEY não configurada.');
  /* Sem apiVersion explícita: o SDK usa a versão com que foi publicado, que é
     a que seus tipos descrevem. Fixar uma string aqui quebra o build a cada
     atualização do pacote. */
  return new Stripe(chave);
}

export function cobrancaAtiva(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

/** Converte o price ID recebido do Stripe no plano correspondente. */
export function planoDoPrice(priceId: string): 'pro' | 'escola' | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId && priceId === process.env.STRIPE_PRICE_ESCOLA) return 'escola';
  return null;
}

export function priceDoPlano(plano: 'pro' | 'escola'): string | undefined {
  return plano === 'pro' ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_ESCOLA;
}

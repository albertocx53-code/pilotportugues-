/**
 * Planos. Os limites diários aqui são apenas para exibição — quem decide de
 * verdade é a função `plan_daily_limit` no Postgres, para que ninguém consiga
 * aumentar o próprio limite pelo navegador.
 */

export type PlanoId = 'free' | 'pro' | 'escola';

export type Plano = {
  id: PlanoId;
  nome: string;
  preco: string;
  periodo: string;
  chamada: string;
  limiteDiario: number;
  recursos: string[];
  /** Variável de ambiente com o price ID do Stripe. */
  envPriceId?: 'STRIPE_PRICE_PRO' | 'STRIPE_PRICE_ESCOLA';
};

export const PLANOS: Plano[] = [
  {
    id: 'free',
    nome: 'Gratuito',
    preco: 'R$ 0',
    periodo: 'para sempre',
    chamada: 'Para experimentar e preparar as próximas aulas.',
    limiteDiario: 15,
    recursos: [
      '15 gerações por dia',
      'Todos os sete módulos',
      'Catálogo de 200 conteúdos',
      'Biblioteca de materiais salvos',
      'Exportar em PDF e PowerPoint',
    ],
  },
  {
    id: 'pro',
    nome: 'Professor',
    preco: 'R$ 29',
    periodo: 'por mês',
    chamada: 'Para quem prepara aula toda semana e não quer pensar em limite.',
    limiteDiario: 200,
    envPriceId: 'STRIPE_PRICE_PRO',
    recursos: [
      '200 gerações por dia',
      'Todos os sete módulos',
      'Banco de imagens com licença',
      'Materiais ilimitados na biblioteca',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'escola',
    nome: 'Escola',
    preco: 'R$ 149',
    periodo: 'por mês',
    chamada: 'Para coordenação que atende todo o corpo docente de Português.',
    limiteDiario: 500,
    envPriceId: 'STRIPE_PRICE_ESCOLA',
    recursos: [
      '500 gerações por dia',
      'Tudo do plano Professor',
      'Materiais compartilháveis por link',
      'Atendimento prioritário',
    ],
  },
];

export function plano(id: string): Plano {
  return PLANOS.find((p) => p.id === id) ?? PLANOS[0];
}

export function nomeDoPlano(id: string): string {
  return plano(id).nome;
}

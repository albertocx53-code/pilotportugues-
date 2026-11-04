import { Check } from 'lucide-react';
import { requirePerfil } from '@/lib/auth';
import { PLANOS, plano as acharPlano } from '@/lib/plans';
import { cobrancaAtiva } from '@/lib/stripe';
import { BotaoAssinar, BotaoGerenciar } from '@/components/billing/botoes';

export const metadata = { title: 'Plano' };

const ESTADO: Record<string, { texto: string; classe: string }> = {
  active: { texto: 'Ativo', classe: 'bg-giz-clara text-giz' },
  trialing: { texto: 'Em teste', classe: 'bg-pena-clara text-pena' },
  past_due: { texto: 'Pagamento pendente', classe: 'bg-correcao-clara text-correcao' },
  canceled: { texto: 'Encerrado', classe: 'bg-papel-3 text-grafite' },
};

export default async function Planos({
  searchParams,
}: {
  searchParams: Promise<{ assinatura?: string }>;
}) {
  const { supabase, perfil } = await requirePerfil();
  const p = await searchParams;

  const { data: quota } = await supabase.rpc('generation_status');
  const atual = acharPlano(perfil.plan);
  const estado = ESTADO[perfil.plan_status] ?? ESTADO.active;
  const pago = perfil.plan !== 'free';
  const ligado = cobrancaAtiva();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Seu plano</h1>
        <p className="mt-2 text-grafite">
          O que muda entre os planos é quantas gerações por dia você tem. Todos os sete
          módulos estão em todos eles.
        </p>
      </header>

      {p.assinatura === 'ok' && (
        <p className="rounded-folha bg-giz-clara px-4 py-3.5 text-sm text-giz">
          Pagamento recebido. Assim que o Stripe confirmar, seu novo limite aparece aqui —
          costuma levar alguns segundos.
        </p>
      )}
      {p.assinatura === 'cancelada' && (
        <p className="rounded-folha bg-papel-3 px-4 py-3.5 text-sm text-grafite">
          Pagamento não concluído. Seu plano continua o mesmo.
        </p>
      )}

      {/* Situação atual */}
      <section className="folha p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold">Plano {atual.nome}</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estado.classe}`}
              >
                {estado.texto}
              </span>
            </div>
            <p className="mt-2 text-sm text-grafite">
              {quota?.ok
                ? `${quota.used} de ${quota.limit} gerações usadas hoje · restam ${quota.remaining}`
                : `${atual.limiteDiario} gerações por dia`}
            </p>
            {perfil.plan_renews_at && pago && (
              <p className="mt-1 text-sm text-grafite">
                {perfil.plan_status === 'canceled' ? 'Acesso até ' : 'Renova em '}
                {new Date(perfil.plan_renews_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          {pago && ligado && <BotaoGerenciar />}
        </div>
      </section>

      {!ligado && (
        <p className="rounded-folha border border-correcao/30 bg-correcao-clara px-4 py-3.5 text-sm text-correcao">
          A cobrança não está configurada neste servidor. Preencha as chaves do Stripe no
          arquivo <code className="font-mono text-xs">.env.local</code> para liberar as
          assinaturas. Até então, todas as contas ficam no plano gratuito.
        </p>
      )}

      {/* Planos */}
      <section>
        <h2 className="text-lg font-semibold">Mudar de plano</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          {PLANOS.map((pl) => {
            const ehAtual = pl.id === perfil.plan;
            const destaque = pl.id === 'pro' && !ehAtual;

            return (
              <div
                key={pl.id}
                className={`flex flex-col rounded-folha border p-6 ${
                  ehAtual
                    ? 'border-pena bg-pena-clara'
                    : destaque
                      ? 'border-pena/50 bg-papel'
                      : 'border-linha bg-papel'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{pl.nome}</h3>
                  {ehAtual && (
                    <span className="rounded-full bg-pena px-2.5 py-1 text-xs font-semibold text-white dark:text-[#0c1120]">
                      Seu plano
                    </span>
                  )}
                </div>

                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="display text-3xl font-bold">{pl.preco}</span>
                  <span className="text-sm text-grafite">{pl.periodo}</span>
                </p>
                <p className="mt-2 min-h-[2.75rem] text-sm leading-relaxed text-grafite">
                  {pl.chamada}
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {pl.recursos.map((r) => (
                    <li key={r} className="flex gap-2.5 text-sm">
                      <Check size={16} className="mt-0.5 shrink-0 text-giz" aria-hidden />
                      <span className="text-tinta-2">{r}</span>
                    </li>
                  ))}
                </ul>

                {ehAtual ? (
                  <p className="mt-7 text-center text-sm font-medium text-grafite">
                    Você está usando este plano
                  </p>
                ) : pl.id === 'free' ? (
                  <p className="mt-7 text-center text-sm leading-relaxed text-grafite">
                    Para voltar ao gratuito, cancele no portal de cobrança.
                  </p>
                ) : ligado ? (
                  <BotaoAssinar
                    plano={pl.id as 'pro' | 'escola'}
                    rotulo={`Assinar ${pl.nome}`}
                    destaque={destaque}
                  />
                ) : (
                  <p className="mt-7 text-center text-sm text-grafite">
                    Indisponível até configurar o Stripe
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p className="max-w-[64ch] text-sm leading-relaxed text-grafite">
        O limite diário é contado por conta e zera à meia-noite no horário UTC. Materiais
        já salvos continuam seus mesmo se você voltar ao plano gratuito.
      </p>
    </div>
  );
}

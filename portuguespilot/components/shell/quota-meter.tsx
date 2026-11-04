'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { nomeDoPlano } from '@/lib/plans';

type Status = { used: number; limit: number; remaining: number; plan: string };

/* Permite que qualquer tela avise "gastei uma geração, recarregue o medidor". */
export const EVENTO_QUOTA = 'pp:quota';
export function avisarQuotaMudou() {
  window.dispatchEvent(new Event(EVENTO_QUOTA));
}

export function MedidorDeQuota({ inicial }: { inicial: Status | null }) {
  const [status, setStatus] = useState<Status | null>(inicial);

  useEffect(() => {
    let vivo = true;

    async function carregar() {
      const { data } = await supabaseBrowser().rpc('generation_status');
      if (vivo && data?.ok) setStatus(data as Status);
    }

    const onEvento = () => carregar();
    window.addEventListener(EVENTO_QUOTA, onEvento);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_QUOTA, onEvento);
    };
  }, []);

  if (!status) return null;

  /* A barra mostra o que SOBRA e vai esvaziando — é o mesmo que o número ao
     lado diz. Encher a barra conforme o uso contradiz o rótulo "restantes". */
  const restantes = Math.max(Math.min(status.remaining, status.limit), 0);
  const proporcao = status.limit > 0 ? restantes / status.limit : 0;
  const acabando = restantes <= 3;
  const esgotado = restantes <= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-grafite-2">
          Plano {nomeDoPlano(status.plan)}
        </span>
        <span
          className={`text-xs font-semibold tabular-nums ${
            acabando ? 'text-correcao' : 'text-grafite'
          }`}
        >
          {restantes} de {status.limit}
        </span>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-papel-3"
        role="meter"
        aria-valuenow={restantes}
        aria-valuemin={0}
        aria-valuemax={status.limit}
        aria-label="Gerações restantes hoje"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            acabando ? 'bg-correcao' : 'bg-pena'
          }`}
          style={{ width: `${Math.max(proporcao * 100, restantes > 0 ? 4 : 0)}%` }}
        />
      </div>

      <p className="text-xs leading-snug text-grafite">
        {esgotado ? (
          <>
            Você usou as gerações de hoje.{' '}
            {status.plan === 'free' && (
              <Link href="/dashboard/planos" className="botao-texto">
                Ver planos
              </Link>
            )}
          </>
        ) : (
          'gerações restantes hoje'
        )}
      </p>
    </div>
  );
}

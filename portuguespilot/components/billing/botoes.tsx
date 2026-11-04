'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAviso } from '@/components/ui/toast';

export function BotaoAssinar({
  plano,
  rotulo,
  destaque,
}: {
  plano: 'pro' | 'escola';
  rotulo: string;
  destaque: boolean;
}) {
  const [ocupado, setOcupado] = useState(false);
  const { avisar } = useAviso();

  async function assinar() {
    setOcupado(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano }),
      });
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo.error || 'Falha ao abrir o pagamento.');
      window.location.href = corpo.url;
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Falha ao abrir o pagamento.', 'erro');
      setOcupado(false);
    }
  }

  return (
    <button
      onClick={assinar}
      disabled={ocupado}
      className={`mt-7 w-full ${destaque ? 'botao' : 'botao-vazio'}`}
    >
      {ocupado && <Loader2 size={16} className="girando" aria-hidden />}
      {ocupado ? 'Abrindo...' : rotulo}
    </button>
  );
}

export function BotaoGerenciar() {
  const [ocupado, setOcupado] = useState(false);
  const { avisar } = useAviso();

  async function abrir() {
    setOcupado(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo.error || 'Falha ao abrir o portal.');
      window.location.href = corpo.url;
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Falha ao abrir o portal.', 'erro');
      setOcupado(false);
    }
  }

  return (
    <button onClick={abrir} disabled={ocupado} className="botao-vazio">
      {ocupado && <Loader2 size={16} className="girando" aria-hidden />}
      {ocupado ? 'Abrindo...' : 'Gerenciar assinatura'}
    </button>
  );
}

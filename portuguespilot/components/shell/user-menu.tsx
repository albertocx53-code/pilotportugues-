'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { MedidorDeQuota } from '@/components/shell/quota-meter';

type Tema = 'system' | 'light' | 'dark';

const OPCOES: { id: Tema; rotulo: string; Icone: typeof Sun }[] = [
  { id: 'light', rotulo: 'Claro', Icone: Sun },
  { id: 'dark', rotulo: 'Escuro', Icone: Moon },
  { id: 'system', rotulo: 'Sistema', Icone: Monitor },
];

export function aplicarTema(tema: Tema) {
  try {
    localStorage.setItem('pp-tema', tema);
  } catch {
    /* navegação privada pode bloquear; o tema vale só nesta aba */
  }
  const escuro =
    tema === 'dark' ||
    (tema === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', escuro);
}

export function RodapeDaConta({
  email,
  temaInicial,
  quota,
}: {
  email: string;
  temaInicial: Tema;
  quota: { used: number; limit: number; remaining: number; plan: string } | null;
}) {
  const [tema, setTema] = useState<Tema>(temaInicial);
  const [saindo, setSaindo] = useState(false);
  const router = useRouter();

  async function trocarTema(novo: Tema) {
    setTema(novo);
    aplicarTema(novo);
    const db = supabaseBrowser();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user) await db.from('profiles').update({ theme: novo }).eq('id', user.id);
  }

  async function sair() {
    setSaindo(true);
    await supabaseBrowser().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <MedidorDeQuota inicial={quota} />

      <div
        className="flex gap-1 rounded-lg bg-papel-2 p-1"
        role="group"
        aria-label="Tema da interface"
      >
        {OPCOES.map(({ id, rotulo, Icone }) => (
          <button
            key={id}
            onClick={() => trocarTema(id)}
            aria-pressed={tema === id}
            title={rotulo}
            className={`flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors ${
              tema === id
                ? 'bg-papel text-pena shadow-sm'
                : 'text-grafite-2 hover:text-tinta'
            }`}
          >
            <Icone size={15} aria-hidden />
            <span className="sr-only">{rotulo}</span>
          </button>
        ))}
      </div>

      <div>
        <p className="truncate text-xs text-grafite-2" title={email}>
          {email}
        </p>
        <button
          onClick={sair}
          disabled={saindo}
          className="mt-2 flex items-center gap-2 text-sm font-medium text-grafite transition-colors hover:text-correcao disabled:opacity-60"
        >
          <LogOut size={15} aria-hidden />
          {saindo ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </div>
  );
}

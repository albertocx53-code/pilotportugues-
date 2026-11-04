'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  House,
  PlusCircle,
  Library,
  CreditCard,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { Marca } from '@/components/brand/logo';

const LINKS = [
  { href: '/dashboard', rotulo: 'Início', Icone: House },
  { href: '/dashboard/criar', rotulo: 'Criar material', Icone: PlusCircle },
  { href: '/dashboard/biblioteca', rotulo: 'Biblioteca', Icone: Library },
];

const LINKS_CONTA = [
  { href: '/dashboard/planos', rotulo: 'Plano', Icone: CreditCard },
  { href: '/dashboard/conta', rotulo: 'Configurações', Icone: Settings },
];

export function Sidebar({ rodape }: { rodape: React.ReactNode }) {
  const [aberta, setAberta] = useState(false);
  const caminho = usePathname();

  /* Fecha a gaveta ao navegar no celular. */
  useEffect(() => setAberta(false), [caminho]);

  /* Esc fecha a gaveta. */
  useEffect(() => {
    if (!aberta) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberta]);

  return (
    <>
      {/* Barra do celular */}
      <div className="nao-imprimir sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-linha bg-papel px-4 lg:hidden">
        <button
          onClick={() => setAberta(true)}
          aria-label="Abrir menu"
          aria-expanded={aberta}
          className="-ml-1 rounded-lg p-2 text-grafite hover:bg-papel-2 hover:text-tinta"
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" aria-label="Início">
          <Marca tamanho="sm" />
        </Link>
      </div>

      {aberta && (
        <div
          className="nao-imprimir fixed inset-0 z-40 bg-tinta/40 lg:hidden"
          onClick={() => setAberta(false)}
          aria-hidden
        />
      )}

      <aside
        className={`nao-imprimir fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col gap-7 border-r border-linha bg-papel p-5 transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          aberta ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Link href="/dashboard" aria-label="PortuguêsPilot, início">
            <Marca />
          </Link>
          <button
            onClick={() => setAberta(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-grafite hover:text-tinta lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto rolagem-fina">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <ItemDeMenu key={l.href} {...l} caminho={caminho} />
            ))}
          </ul>

          <div>
            <p className="px-3 pb-2 text-xs font-semibold text-grafite-2">Sua conta</p>
            <ul className="space-y-1">
              {LINKS_CONTA.map((l) => (
                <ItemDeMenu key={l.href} {...l} caminho={caminho} />
              ))}
            </ul>
          </div>
        </nav>

        <div className="border-t border-linha pt-4">{rodape}</div>
      </aside>
    </>
  );
}

function ItemDeMenu({
  href,
  rotulo,
  Icone,
  caminho,
}: {
  href: string;
  rotulo: string;
  Icone: typeof House;
  caminho: string;
}) {
  const ativo = href === '/dashboard' ? caminho === href : caminho.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        aria-current={ativo ? 'page' : undefined}
        className={`margem-ativa flex items-center gap-3 rounded-lg py-2.5 pl-4 pr-3 text-sm font-medium transition-colors ${
          ativo
            ? 'bg-pena-clara text-pena before:opacity-100'
            : 'text-grafite before:opacity-0 hover:bg-papel-2 hover:text-tinta'
        }`}
      >
        <Icone size={18} aria-hidden />
        {rotulo}
      </Link>
    </li>
  );
}

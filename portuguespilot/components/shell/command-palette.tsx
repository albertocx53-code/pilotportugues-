'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft } from 'lucide-react';
import { MODULOS } from '@/lib/modules';
import { catalog } from '@/lib/catalog';

type Alvo = { rotulo: string; detalhe: string; rota: string };

const FIXOS: Alvo[] = [
  { rotulo: 'Início', detalhe: 'Painel', rota: '/dashboard' },
  { rotulo: 'Criar material', detalhe: 'Escolher módulo', rota: '/dashboard/criar' },
  { rotulo: 'Biblioteca', detalhe: 'Materiais salvos', rota: '/dashboard/biblioteca' },
  { rotulo: 'Plano', detalhe: 'Assinatura e limites', rota: '/dashboard/planos' },
  { rotulo: 'Configurações', detalhe: 'Perfil e tema', rota: '/dashboard/conta' },
  ...MODULOS.filter((m) => m.destaque).map((m) => ({
    rotulo: m.nome,
    detalhe: 'Módulo',
    rota: m.rota,
  })),
];

const sem = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Busca rápida por teclado: Ctrl+K ou Cmd+K. */
export function PaletaDeComandos() {
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState('');
  const [indice, setIndice] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAberta((v) => !v);
      }
      if (e.key === 'Escape') setAberta(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (aberta) {
      setBusca('');
      setIndice(0);
      setTimeout(() => campo.current?.focus(), 20);
    }
  }, [aberta]);

  const resultados = useMemo<Alvo[]>(() => {
    const q = sem(busca.trim());
    if (!q) return FIXOS.slice(0, 8);

    const telas = FIXOS.filter((f) => sem(f.rotulo).includes(q));
    const conteudos = catalog
      .filter((c) => sem(c.title).includes(q))
      .slice(0, 8)
      .map((c) => ({
        rotulo: c.title,
        detalhe: c.category,
        rota: `/dashboard/slides/editor?tema=${encodeURIComponent(c.title)}`,
      }));

    return [...telas, ...conteudos].slice(0, 10);
  }, [busca]);

  useEffect(() => setIndice(0), [busca]);

  function irPara(alvo?: Alvo) {
    if (!alvo) return;
    setAberta(false);
    router.push(alvo.rota);
  }

  if (!aberta) return null;

  return (
    <div
      className="nao-imprimir fixed inset-0 z-[90] bg-tinta/40 p-4 pt-[12vh]"
      onClick={() => setAberta(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca rápida"
        onClick={(e) => e.stopPropagation()}
        className="entrar-aviso folha mx-auto max-w-lg overflow-hidden shadow-2xl shadow-tinta/20"
      >
        <div className="flex items-center gap-3 border-b border-linha px-4">
          <Search size={18} className="shrink-0 text-grafite-2" aria-hidden />
          <input
            ref={campo}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndice((i) => Math.min(i + 1, resultados.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndice((i) => Math.max(i - 1, 0));
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                irPara(resultados[indice]);
              }
            }}
            placeholder="Buscar tela ou conteúdo..."
            className="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-grafite-2"
          />
          <kbd className="hidden shrink-0 rounded border border-linha px-1.5 py-0.5 text-[10px] font-semibold text-grafite-2 sm:block">
            Esc
          </kbd>
        </div>

        {resultados.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-grafite">
            Nenhum resultado para “{busca}”.
          </p>
        ) : (
          <ul className="max-h-72 overflow-y-auto rolagem-fina py-1.5">
            {resultados.map((r, i) => (
              <li key={`${r.rota}-${r.rotulo}`}>
                <button
                  onMouseEnter={() => setIndice(i)}
                  onClick={() => irPara(r)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${
                    i === indice ? 'bg-pena-clara' : ''
                  }`}
                >
                  <span className="flex-1 truncate text-sm font-medium">{r.rotulo}</span>
                  <span className="shrink-0 text-xs text-grafite-2">{r.detalhe}</span>
                  {i === indice && (
                    <CornerDownLeft size={14} className="shrink-0 text-pena" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Botão visível que abre a mesma paleta (para quem não usa atalho). */
export function BotaoDeBusca() {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
        )
      }
      className="flex items-center gap-2.5 rounded-lg border border-linha bg-papel px-3 py-2 text-sm text-grafite-2 transition-colors hover:border-grafite-2 hover:text-tinta"
    >
      <Search size={16} aria-hidden />
      <span className="hidden sm:inline">Buscar</span>
      <kbd className="hidden rounded border border-linha px-1.5 py-0.5 text-[10px] font-semibold md:inline">
        Ctrl K
      </kbd>
    </button>
  );
}

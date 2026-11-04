'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, CircleAlert, CircleCheck, Info } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

export type Aviso = {
  id: string;
  title: string;
  body: string;
  kind: 'info' | 'success' | 'warning';
  href: string;
  read_at: string | null;
  created_at: string;
};

const ICONE = {
  info: { Componente: Info, cor: 'text-pena' },
  success: { Componente: CircleCheck, cor: 'text-giz' },
  warning: { Componente: CircleAlert, cor: 'text-correcao' },
};

function quando(iso: string): string {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ontem' : `${dias} dias`;
}

export function Avisos({ iniciais }: { iniciais: Aviso[] }) {
  const [avisos, setAvisos] = useState(iniciais);
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  const naoLidos = avisos.filter((a) => !a.read_at).length;

  /* Fecha ao clicar fora ou com Esc. */
  useEffect(() => {
    if (!aberto) return;
    const onClique = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', onClique);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClique);
      document.removeEventListener('keydown', onKey);
    };
  }, [aberto]);

  async function marcarTodos() {
    const pendentes = avisos.filter((a) => !a.read_at).map((a) => a.id);
    if (!pendentes.length) return;
    const agora = new Date().toISOString();
    setAvisos((atual) => atual.map((a) => (a.read_at ? a : { ...a, read_at: agora })));
    await supabaseBrowser().from('notices').update({ read_at: agora }).in('id', pendentes);
  }

  return (
    <div ref={caixa} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label={
          naoLidos ? `Avisos, ${naoLidos} não lidos` : 'Avisos, nenhum não lido'
        }
        aria-expanded={aberto}
        className="relative rounded-lg p-2 text-grafite transition-colors hover:bg-papel-2 hover:text-tinta"
      >
        <Bell size={19} />
        {naoLidos > 0 && (
          <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-correcao text-[10px] font-bold text-white">
            {naoLidos > 9 ? '9+' : naoLidos}
          </span>
        )}
      </button>

      {aberto && (
        <div className="entrar-aviso folha absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden shadow-xl shadow-tinta/10">
          <div className="flex items-center justify-between gap-3 border-b border-linha px-4 py-3">
            <h2 className="text-sm font-semibold">Avisos</h2>
            {naoLidos > 0 && (
              <button
                onClick={marcarTodos}
                className="flex items-center gap-1.5 text-xs font-semibold text-pena hover:underline"
              >
                <CheckCheck size={14} aria-hidden />
                Marcar como lidos
              </button>
            )}
          </div>

          {avisos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-grafite">
              Nada por aqui. Avisamos quando algo precisar da sua atenção.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-linha overflow-y-auto rolagem-fina">
              {avisos.map((a) => {
                const { Componente, cor } = ICONE[a.kind] ?? ICONE.info;
                const conteudo = (
                  <>
                    <Componente size={17} className={`mt-0.5 shrink-0 ${cor}`} aria-hidden />
                    <span className="flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">{a.title}</span>
                        <span className="shrink-0 text-xs text-grafite-2">
                          {quando(a.created_at)}
                        </span>
                      </span>
                      {a.body && (
                        <span className="mt-0.5 block text-xs leading-relaxed text-grafite">
                          {a.body}
                        </span>
                      )}
                    </span>
                  </>
                );

                return (
                  <li
                    key={a.id}
                    className={`flex gap-3 px-4 py-3 ${a.read_at ? '' : 'bg-pena-clara/40'}`}
                  >
                    {a.href ? (
                      <Link
                        href={a.href}
                        onClick={() => setAberto(false)}
                        className="flex flex-1 gap-3"
                      >
                        {conteudo}
                      </Link>
                    ) : (
                      conteudo
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

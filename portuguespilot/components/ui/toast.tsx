'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type Tipo = 'ok' | 'erro' | 'info';
type Aviso = { id: number; tipo: Tipo; texto: string };

type Contexto = {
  avisar: (texto: string, tipo?: Tipo) => void;
};

const Ctx = createContext<Contexto>({ avisar: () => {} });

export function useAviso() {
  return useContext(Ctx);
}

const ESTILO: Record<Tipo, { cor: string; Icone: typeof Info }> = {
  ok: { cor: 'text-giz', Icone: CheckCircle2 },
  erro: { cor: 'text-correcao', Icone: AlertCircle },
  info: { cor: 'text-pena', Icone: Info },
};

export function ProvedorDeAvisos({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((texto: string, tipo: Tipo = 'info') => {
    const id = Date.now() + Math.random();
    setAvisos((atual) => [...atual.slice(-2), { id, tipo, texto }]);
  }, []);

  const fechar = useCallback((id: number) => {
    setAvisos((atual) => atual.filter((a) => a.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ avisar }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="nao-imprimir fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-5 sm:translate-x-0"
      >
        {avisos.map((aviso) => (
          <Item key={aviso.id} aviso={aviso} onFechar={() => fechar(aviso.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function Item({ aviso, onFechar }: { aviso: Aviso; onFechar: () => void }) {
  const { cor, Icone } = ESTILO[aviso.tipo];

  useEffect(() => {
    const t = setTimeout(onFechar, aviso.tipo === 'erro' ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [aviso.tipo, onFechar]);

  return (
    <div
      role="status"
      className="entrar-aviso folha flex items-start gap-3 p-3.5 shadow-lg shadow-tinta/10"
    >
      <Icone size={18} className={`mt-0.5 shrink-0 ${cor}`} aria-hidden />
      <p className="flex-1 text-sm leading-snug">{aviso.texto}</p>
      <button
        onClick={onFechar}
        aria-label="Fechar aviso"
        className="shrink-0 text-grafite-2 hover:text-tinta"
      >
        <X size={16} />
      </button>
    </div>
  );
}

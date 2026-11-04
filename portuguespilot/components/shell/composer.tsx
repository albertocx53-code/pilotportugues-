'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MODULOS, type Tipo } from '@/lib/modules';
import { Icone } from '@/components/shell/icone';

const ANOS_PADRAO = [
  '6º ano',
  '7º ano',
  '8º ano',
  '9º ano',
  '1ª série EM',
  '2ª série EM',
  '3ª série EM',
];

/**
 * A primeira coisa do painel: escreva o tema, escolha o formato, siga.
 * Nenhum material é gerado aqui — levamos o professor ao módulo certo já com
 * o tema e a turma preenchidos.
 */
export function Compositor({ anosDoProfessor }: { anosDoProfessor: string[] }) {
  const anos = anosDoProfessor.length ? anosDoProfessor : ANOS_PADRAO;

  const [tema, setTema] = useState('');
  const [turma, setTurma] = useState(anos[0]);
  const [indo, setIndo] = useState<Tipo | null>(null);
  const router = useRouter();

  const destaque = MODULOS.filter((m) => m.destaque);
  const pronto = tema.trim().length >= 3;

  function seguir(tipo: Tipo, rota: string) {
    if (!pronto) return;
    setIndo(tipo);
    const q = new URLSearchParams({ tema: tema.trim(), turma });
    router.push(`${rota}?${q.toString()}`);
  }

  return (
    <section className="folha p-5 sm:p-7">
      <h2 className="text-xl font-semibold sm:text-2xl">Sobre o que é a aula?</h2>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Tema da aula</span>
          <input
            className="campo text-[15px]"
            value={tema}
            maxLength={160}
            autoFocus
            onChange={(e) => setTema(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && pronto) seguir('slides', '/dashboard/slides');
            }}
            placeholder="Orações subordinadas adverbiais"
          />
        </label>
        <label className="sm:w-44">
          <span className="sr-only">Turma</span>
          <select
            className="campo"
            value={turma}
            onChange={(e) => setTurma(e.target.value)}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-5 text-sm font-medium text-grafite">
        {pronto ? 'Escolha o formato:' : 'Escreva o tema para liberar os formatos'}
      </p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {destaque.map((m) => (
          <li key={m.tipo}>
            <button
              onClick={() => seguir(m.tipo, m.rota)}
              disabled={!pronto || indo !== null}
              title={m.resumo}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${
                pronto
                  ? 'border-linha bg-papel text-tinta hover:border-pena hover:bg-pena-clara hover:text-pena'
                  : 'cursor-not-allowed border-linha bg-papel-2 text-grafite-2'
              } disabled:opacity-70`}
            >
              {indo === m.tipo ? (
                <Loader2 size={16} className="girando" aria-hidden />
              ) : (
                <Icone nome={m.icone} size={16} />
              )}
              {m.nome}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

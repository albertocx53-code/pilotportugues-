import Link from 'next/link';
import { requirePerfil } from '@/lib/auth';
import { MODULOS } from '@/lib/modules';
import { Icone } from '@/components/shell/icone';

export const metadata = { title: 'Criar material' };

export default async function Criar() {
  await requirePerfil();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Criar material</h1>
        <p className="mt-2 max-w-[58ch] text-grafite">
          Escolha o formato. Em todos eles você escreve o tema e recebe o material
          montado, pronto para editar, imprimir ou projetar.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {MODULOS.filter((m) => m.destaque).map((m) => (
          <li key={m.tipo}>
            <Link
              href={m.rota}
              className="group flex h-full gap-4 rounded-folha border border-linha bg-papel p-5 transition-colors hover:border-pena"
            >
              <span className="mt-0.5 shrink-0 text-pena">
                <Icone nome={m.icone} size={22} />
              </span>
              <span>
                <span className="block font-semibold">{m.nome}</span>
                <span className="mt-1 block text-sm leading-relaxed text-grafite">
                  {m.resumo}
                </span>
                <span className="mt-3 block text-sm font-semibold text-pena opacity-0 transition-opacity group-hover:opacity-100">
                  {m.acao}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="folha p-5 sm:p-6">
        <h2 className="font-semibold">Sem ideia de tema?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-grafite">
          O catálogo tem 200 conteúdos de Língua Portuguesa organizados por área. Escolha
          um e o material começa dali.
        </p>
        <Link href="/dashboard/slides" className="botao-vazio mt-4">
          Abrir o catálogo
        </Link>
      </section>
    </div>
  );
}

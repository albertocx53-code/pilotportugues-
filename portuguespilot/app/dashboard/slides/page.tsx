import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { requirePerfil } from '@/lib/auth';
import { catalog } from '@/lib/catalog';

export const metadata = { title: 'Slides' };

const sem = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default async function Slides({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; area?: string; tema?: string; turma?: string }>;
}) {
  await requirePerfil();
  const p = await searchParams;

  const busca = sem((p.q ?? '').trim());
  const area = p.area ?? '';
  const areas = [...new Set(catalog.map((c) => c.category))];

  const temas = catalog.filter(
    (c) => (!area || c.category === area) && (!busca || sem(c.title).includes(busca)),
  );

  /* Se o professor chegou do compositor com um tema escrito, abrimos direto. */
  const paramsEditor = new URLSearchParams();
  if (p.tema) paramsEditor.set('tema', p.tema);
  if (p.turma) paramsEditor.set('turma', p.turma);
  const linkNovo = `/dashboard/slides/editor${
    paramsEditor.toString() ? `?${paramsEditor}` : ''
  }`;

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Slides</h1>
          <p className="mt-2 max-w-[56ch] text-grafite">
            Comece de um conteúdo do catálogo ou monte do zero. O editor gera a
            apresentação com IA, deixa você editar slide por slide e exporta em PDF ou
            PowerPoint.
          </p>
        </div>
        <Link href={linkNovo} className="botao">
          <Plus size={17} aria-hidden />
          Nova apresentação
        </Link>
      </header>

      <form className="folha flex flex-col gap-3 p-4 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar conteúdo</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-grafite-2"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={p.q ?? ''}
            className="campo pl-10"
            placeholder="Buscar entre os 200 conteúdos..."
          />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">Área</span>
          <select name="area" defaultValue={area} className="campo">
            <option value="">Todas as áreas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <button className="botao">Filtrar</button>
      </form>

      <p className="text-sm text-grafite">
        {temas.length === 0
          ? 'Nenhum conteúdo com esse filtro.'
          : `${temas.length} ${temas.length === 1 ? 'conteúdo' : 'conteúdos'}`}
      </p>

      {temas.length === 0 ? (
        <div className="folha p-10 text-center">
          <p className="text-grafite">
            Nada encontrado. Limpe o filtro ou monte uma apresentação do zero com o tema
            que você quiser.
          </p>
          <Link href="/dashboard/slides/editor" className="botao mt-5">
            Montar do zero
          </Link>
        </div>
      ) : (
        <ul className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
          {temas.map((t) => (
            <li key={t.id} className="border-b border-linha">
              <Link
                href={`/dashboard/slides/editor?tema=${encodeURIComponent(t.title)}${
                  p.turma ? `&turma=${encodeURIComponent(p.turma)}` : ''
                }`}
                className="block py-4"
              >
                <p className="text-xs font-semibold text-pena">{t.category}</p>
                <p className="mt-1 font-medium leading-snug">{t.title}</p>
                <p className="mt-1 text-xs text-grafite-2">{t.grade}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

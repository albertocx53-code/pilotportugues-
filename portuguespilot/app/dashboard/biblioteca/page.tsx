import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import { requirePerfil } from '@/lib/auth';
import { MODULOS, modulo, nomeDoTipo } from '@/lib/modules';
import { Icone } from '@/components/shell/icone';
import { AcoesDoMaterial } from '@/components/library/acoes';

export const metadata = { title: 'Biblioteca' };

function dataLonga(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function Biblioteca({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; fav?: string }>;
}) {
  const { supabase } = await requirePerfil();
  const p = await searchParams;

  const busca = (p.q ?? '').trim();
  const tipo = p.tipo ?? '';
  const somenteFavoritos = p.fav === '1';

  let consulta = supabase
    .from('materials')
    .select('id,title,kind,grade,topic,status,is_favorite,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (tipo) consulta = consulta.eq('kind', tipo);
  if (somenteFavoritos) consulta = consulta.eq('is_favorite', true);
  if (busca) {
    /* O termo é escapado para não quebrar a sintaxe do filtro `or`. */
    const termo = busca.replace(/[%,()]/g, ' ').trim();
    if (termo) consulta = consulta.or(`title.ilike.%${termo}%,topic.ilike.%${termo}%`);
  }

  const { data: materiais, error } = await consulta;
  const comFiltro = !!(busca || tipo || somenteFavoritos);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca</h1>
          <p className="mt-2 text-grafite">Tudo que você já salvou, do mais recente.</p>
        </div>
        <Link href="/dashboard/criar" className="botao">
          Criar material
        </Link>
      </header>

      <form className="folha flex flex-col gap-3 p-4 lg:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Buscar na biblioteca</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-grafite-2"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={busca}
            className="campo pl-10"
            placeholder="Buscar por título ou tema..."
          />
        </label>
        <label className="lg:w-56">
          <span className="sr-only">Tipo de material</span>
          <select name="tipo" defaultValue={tipo} className="campo">
            <option value="">Todos os tipos</option>
            {MODULOS.map((m) => (
              <option key={m.tipo} value={m.tipo}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2.5 rounded-lg border border-linha bg-papel px-3.5 py-2.5 text-sm lg:w-auto">
          <input
            type="checkbox"
            name="fav"
            value="1"
            defaultChecked={somenteFavoritos}
            className="size-4 accent-[var(--color-pena)]"
          />
          Só favoritos
        </label>
        <button className="botao">Filtrar</button>
      </form>

      {error ? (
        <div className="folha p-8 text-center">
          <p className="font-medium text-correcao">Não foi possível carregar a biblioteca.</p>
          <p className="mt-2 text-sm text-grafite">
            Confirme se as migrações do banco foram aplicadas e recarregue a página.
          </p>
        </div>
      ) : !materiais?.length ? (
        <div className="folha p-12 text-center">
          <p className="text-lg font-semibold">
            {comFiltro ? 'Nada com esse filtro' : 'Sua biblioteca está vazia'}
          </p>
          <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-grafite">
            {comFiltro
              ? 'Tente outro termo ou limpe os filtros para ver tudo.'
              : 'Gere um material em qualquer módulo e clique em salvar — ele aparece aqui.'}
          </p>
          <Link
            href={comFiltro ? '/dashboard/biblioteca' : '/dashboard/criar'}
            className="botao mt-6"
          >
            {comFiltro ? 'Limpar filtros' : 'Criar o primeiro material'}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-grafite">
            {materiais.length} {materiais.length === 1 ? 'material' : 'materiais'}
          </p>

          <ul className="divide-y divide-linha border-y border-linha">
            {materiais.map((m) => {
              const mod = modulo(m.kind);
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-4 py-4 transition-colors hover:bg-papel"
                >
                  <span className="shrink-0 text-grafite-2" title={nomeDoTipo(m.kind)}>
                    <Icone nome={mod?.icone ?? 'FileText'} size={19} />
                  </span>

                  <Link href={`/dashboard/biblioteca/${m.id}`} className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{m.title}</span>
                      {m.is_favorite && (
                        <Star
                          size={13}
                          className="shrink-0 fill-current text-marca-texto"
                          aria-label="Favorito"
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-grafite">
                      {nomeDoTipo(m.kind)}
                      {m.grade ? ` · ${m.grade}` : ''} · {dataLonga(m.updated_at)}
                    </span>
                  </Link>

                  <div className="shrink-0">
                    <AcoesDoMaterial
                      id={m.id}
                      favorito={m.is_favorite}
                      titulo={m.title}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

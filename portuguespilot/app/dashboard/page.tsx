import Link from 'next/link';
import { Clock, Star } from 'lucide-react';
import { requirePerfil, primeiroNome } from '@/lib/auth';
import { Compositor } from '@/components/shell/composer';
import { Icone } from '@/components/shell/icone';
import { MODULOS, modulo, nomeDoTipo } from '@/lib/modules';

export const metadata = { title: 'Início' };

function saudacao(): string {
  /* Fuso do Brasil: o servidor pode estar em UTC. */
  const hora = Number(
    new Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    }).format(new Date()),
  );
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function dataCurta(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 7) return `${dias} dias atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default async function Painel() {
  const { supabase, user, perfil } = await requirePerfil();

  const [{ data: recentes }, { data: stats }] = await Promise.all([
    supabase
      .from('materials')
      .select('id,title,kind,grade,updated_at,is_favorite')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase.rpc('library_stats'),
  ]);

  const total = stats?.total ?? 0;
  const semana = stats?.week ?? 0;
  const favoritos = stats?.favorites ?? 0;

  return (
    <div className="space-y-9">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {saudacao()}, {primeiroNome(perfil, user.email)}
        </h1>
        <p className="mt-2 text-grafite">
          {total === 0
            ? 'Seu primeiro material começa com um tema.'
            : `${total} ${total === 1 ? 'material' : 'materiais'} na sua biblioteca${
                semana > 0 ? ` · ${semana} desta semana` : ''
              }${favoritos > 0 ? ` · ${favoritos} favorito${favoritos > 1 ? 's' : ''}` : ''}`}
        </p>
      </header>

      <Compositor anosDoProfessor={perfil.grades ?? []} />

      {/* Continuar de onde parou */}
      {recentes && recentes.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Continue de onde parou</h2>
            <Link href="/dashboard/biblioteca" className="botao-texto text-sm">
              Ver a biblioteca
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-linha border-y border-linha">
            {recentes.map((m) => {
              const mod = modulo(m.kind);
              return (
                <li key={m.id}>
                  <Link
                    href={`/dashboard/biblioteca/${m.id}`}
                    className="flex items-center gap-4 py-3.5 transition-colors hover:bg-papel"
                  >
                    <span className="shrink-0 text-grafite-2">
                      <Icone nome={mod?.icone ?? 'FileText'} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
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
                        {m.grade ? ` · ${m.grade}` : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-grafite-2">
                      <Clock size={13} aria-hidden />
                      {dataCurta(m.updated_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Todos os módulos */}
      <section>
        <h2 className="text-lg font-semibold">Todos os módulos</h2>
        <ul className="mt-4 grid gap-x-10 sm:grid-cols-2">
          {MODULOS.filter((m) => m.destaque).map((m) => (
            <li key={m.tipo} className="border-b border-linha last:border-b-0">
              <Link href={m.rota} className="flex gap-4 py-4">
                <span className="mt-0.5 shrink-0 text-pena">
                  <Icone nome={m.icone} size={19} />
                </span>
                <span>
                  <span className="block font-medium">{m.nome}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-grafite">
                    {m.resumo}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

import { requirePerfil } from '@/lib/auth';
import { FormularioDoPerfil } from '@/components/conta/formulario';

export const metadata = { title: 'Configurações' };

export default async function Conta() {
  const { supabase, user, perfil } = await requirePerfil();

  const { data: stats } = await supabase.rpc('library_stats');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-2 text-grafite">Seus dados e preferências.</p>
      </header>

      <FormularioDoPerfil perfil={perfil} email={user.email ?? ''} />

      <section className="folha p-5 sm:p-6">
        <h2 className="font-semibold">Sua biblioteca</h2>
        <dl className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {[
            ['Materiais', stats?.total ?? 0],
            ['Favoritos', stats?.favorites ?? 0],
            ['Nesta semana', stats?.week ?? 0],
            ['Prontos', stats?.ready ?? 0],
          ].map(([rotulo, valor]) => (
            <div key={String(rotulo)}>
              <dd className="display text-2xl font-bold tabular-nums">{String(valor)}</dd>
              <dt className="mt-0.5 text-sm text-grafite">{String(rotulo)}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="folha p-5 sm:p-6">
        <h2 className="font-semibold">Conta</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2 border-b border-linha pb-2">
            <dt className="text-grafite">E-mail</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-grafite">Conta criada em</dt>
            <dd className="font-medium">
              {new Date(user.created_at ?? Date.now()).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-grafite">
          Para trocar a senha, saia da conta e use “Esqueci minha senha” na tela de login.
          Para apagar a conta e todos os materiais, escreva para o suporte.
        </p>
      </section>
    </div>
  );
}

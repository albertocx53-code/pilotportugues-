import { requirePerfil } from '@/lib/auth';
import { Sidebar } from '@/components/shell/sidebar';
import { RodapeDaConta } from '@/components/shell/user-menu';
import { Avisos, type Aviso } from '@/components/shell/notices';
import { PaletaDeComandos, BotaoDeBusca } from '@/components/shell/command-palette';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, perfil } = await requirePerfil();

  /* Avisos e medidor de quota são carregados no servidor para a primeira pintura. */
  const [{ data: avisos }, { data: quota }] = await Promise.all([
    supabase
      .from('notices')
      .select('id,title,body,kind,href,read_at,created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.rpc('generation_status'),
  ]);

  return (
    <div className="area-do-painel lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <Sidebar
        rodape={
          <RodapeDaConta
            email={user.email ?? ''}
            temaInicial={perfil.theme}
            quota={quota?.ok ? quota : null}
          />
        }
      />

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="nao-imprimir sticky top-0 z-20 hidden h-16 items-center justify-end gap-2 border-b border-linha bg-papel/90 px-6 backdrop-blur lg:flex">
          <BotaoDeBusca />
          <Avisos iniciais={(avisos ?? []) as Aviso[]} />
        </header>

        {/* No celular a barra fica junto ao conteúdo */}
        <div className="nao-imprimir flex items-center justify-between gap-2 px-5 pt-4 lg:hidden">
          <BotaoDeBusca />
          <Avisos iniciais={(avisos ?? []) as Aviso[]} />
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 sm:px-6 sm:py-9">
          {children}
        </main>
      </div>

      <PaletaDeComandos />
    </div>
  );
}

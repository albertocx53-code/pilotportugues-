import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { requirePerfil } from '@/lib/auth';
import { ehTipoDeTexto, nomeDoTipo } from '@/lib/modules';
import { Estudio } from '@/components/studio/estudio';
import type { MaterialGerado } from '@/lib/ai';

export const metadata = { title: 'Material' };

export default async function VerMaterial({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requirePerfil();

  const { data: material } = await supabase
    .from('materials')
    .select('id,title,kind,grade,topic,content')
    .eq('id', id)
    .maybeSingle();

  if (!material) notFound();

  /* Slides têm editor próprio. */
  if (material.kind === 'slides' || material.kind === 'jornal') {
    redirect(`/dashboard/slides/editor?id=${material.id}`);
  }

  if (!ehTipoDeTexto(material.kind)) {
    return (
      <div className="space-y-5">
        <Voltar />
        <div className="folha p-10 text-center">
          <p className="font-semibold">Este material não tem editor</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-grafite">
            Ele foi salvo como “{nomeDoTipo(material.kind)}”, um tipo que esta versão não
            abre. Você ainda pode duplicá-lo ou excluí-lo na biblioteca.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="nao-imprimir">
        <Voltar />
      </div>
      <Suspense>
        <Estudio
          tipo={material.kind}
          materialInicial={material.content as MaterialGerado}
          idInicial={material.id}
          temaInicial={material.topic}
          turmaInicial={material.grade}
        />
      </Suspense>
    </div>
  );
}

function Voltar() {
  return (
    <Link
      href="/dashboard/biblioteca"
      className="inline-flex items-center gap-2 text-sm font-medium text-grafite transition-colors hover:text-tinta"
    >
      <ArrowLeft size={16} aria-hidden />
      Biblioteca
    </Link>
  );
}

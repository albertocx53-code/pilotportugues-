import { Suspense } from 'react';
import SlideEditor from '@/components/slide-editor';
import { requirePerfil } from '@/lib/auth';

export const metadata = { title: 'Editor de slides' };

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string; turma?: string; id?: string }>;
}) {
  await requirePerfil();
  const p = await searchParams;

  return (
    <Suspense>
      <SlideEditor
        temaInicial={p.tema || 'Novo conteúdo de Português'}
        turmaInicial={p.turma || '8º ano'}
        materialId={p.id || ''}
      />
    </Suspense>
  );
}

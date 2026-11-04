import { Suspense } from 'react';
import { Estudio } from '@/components/studio/estudio';

export const metadata = { title: 'Atividades' };

export default function Pagina() {
  return (
    <Suspense>
      <Estudio tipo="atividade" />
    </Suspense>
  );
}

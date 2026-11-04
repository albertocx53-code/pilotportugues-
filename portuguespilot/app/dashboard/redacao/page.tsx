import { Suspense } from 'react';
import { Estudio } from '@/components/studio/estudio';

export const metadata = { title: 'Correção de redação' };

export default function Pagina() {
  return (
    <Suspense>
      <Estudio tipo="redacao" />
    </Suspense>
  );
}

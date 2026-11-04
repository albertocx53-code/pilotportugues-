import { Suspense } from 'react';
import { Estudio } from '@/components/studio/estudio';

export const metadata = { title: 'Avaliações' };

export default function Pagina() {
  return (
    <Suspense>
      <Estudio tipo="avaliacao" />
    </Suspense>
  );
}

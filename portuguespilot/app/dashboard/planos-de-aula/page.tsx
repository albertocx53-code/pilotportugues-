import { Suspense } from 'react';
import { Estudio } from '@/components/studio/estudio';

export const metadata = { title: 'Planos de aula' };

export default function Pagina() {
  return (
    <Suspense>
      <Estudio tipo="plano_aula" />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { Estudio } from '@/components/studio/estudio';

export const metadata = { title: 'Aula de emergência' };

export default function Pagina() {
  return (
    <Suspense>
      <Estudio tipo="aula_emergencia" />
    </Suspense>
  );
}

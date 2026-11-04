import { Suspense } from 'react';
import { Estudio } from '@/components/studio/estudio';

export const metadata = { title: 'Mapas mentais' };

export default function Pagina() {
  return (
    <Suspense>
      <Estudio tipo="mapa_mental" />
    </Suspense>
  );
}

import { Suspense } from 'react';
import AuthForm from '@/components/auth-form';

export const metadata = { title: 'Criar conta' };

export default function Cadastro() {
  return (
    <Suspense>
      <AuthForm modo="cadastro" />
    </Suspense>
  );
}

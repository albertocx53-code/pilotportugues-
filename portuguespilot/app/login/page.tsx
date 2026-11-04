import { Suspense } from 'react';
import AuthForm from '@/components/auth-form';

export const metadata = { title: 'Entrar' };

export default function Login() {
  return (
    <Suspense>
      <AuthForm modo="login" />
    </Suspense>
  );
}

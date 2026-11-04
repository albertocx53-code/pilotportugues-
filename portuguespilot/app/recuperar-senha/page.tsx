'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Marca } from '@/components/brand/logo';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setErro('');
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) {
      setErro(
        error.message.toLowerCase().includes('rate')
          ? 'Muitos pedidos seguidos. Espere um minuto antes de tentar de novo.'
          : 'Não foi possível enviar o e-mail agora. Tente novamente.',
      );
      setOcupado(false);
      return;
    }
    setEnviado(true);
    setOcupado(false);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-papel-2 px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-7 inline-block" aria-label="PortuguêsPilot, início">
          <Marca tamanho="lg" />
        </Link>

        {enviado ? (
          <div className="folha space-y-4 p-7 sm:p-8">
            <MailCheck size={30} className="text-giz" aria-hidden />
            <h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
            <p className="text-sm leading-relaxed text-grafite">
              Se existe conta com <strong className="text-tinta">{email}</strong>,
              enviamos um link para criar uma senha nova. O link vale por uma hora.
            </p>
            <Link href="/login" className="botao-vazio w-full">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="folha space-y-5 p-7 sm:p-8">
            <div>
              <h1 className="text-2xl font-bold">Recuperar senha</h1>
              <p className="mt-1.5 text-sm text-grafite">
                Informe o e-mail da sua conta e enviamos um link para criar outra senha.
              </p>
            </div>

            <label className="block text-sm font-medium">
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                className="campo mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="professor@escola.br"
              />
            </label>

            {erro && (
              <p
                role="alert"
                className="rounded-lg bg-correcao-clara px-3.5 py-3 text-sm text-correcao"
              >
                {erro}
              </p>
            )}

            <button disabled={ocupado} className="botao w-full">
              {ocupado && <Loader2 size={17} className="girando" aria-hidden />}
              {ocupado ? 'Enviando...' : 'Enviar link'}
            </button>

            <p className="text-center text-sm">
              <Link href="/login" className="botao-texto">
                Voltar para o login
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

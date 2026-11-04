'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Marca } from '@/components/brand/logo';

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('');
  const [repetida, setRepetida] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null);
  const router = useRouter();

  /* O link do e-mail já abre com uma sessão de recuperação ativa. */
  useEffect(() => {
    let vivo = true;
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (vivo) setSessaoValida(!!data.session);
      });
    return () => {
      vivo = false;
    };
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (senha !== repetida) {
      setErro('As duas senhas não são iguais.');
      return;
    }
    setOcupado(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: senha });
    if (error) {
      setErro(
        error.message.toLowerCase().includes('at least')
          ? 'A senha precisa de pelo menos 8 caracteres.'
          : 'Não foi possível salvar a senha. Peça um link novo e tente de novo.',
      );
      setOcupado(false);
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-papel-2 px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-7 inline-block" aria-label="PortuguêsPilot, início">
          <Marca tamanho="lg" />
        </Link>

        {sessaoValida === false ? (
          <div className="folha space-y-4 p-7 sm:p-8">
            <h1 className="text-2xl font-bold">Este link já venceu</h1>
            <p className="text-sm leading-relaxed text-grafite">
              Os links de recuperação valem por uma hora e só podem ser usados uma vez.
              Peça outro para continuar.
            </p>
            <Link href="/recuperar-senha" className="botao w-full">
              Pedir link novo
            </Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="folha space-y-5 p-7 sm:p-8">
            <div>
              <h1 className="text-2xl font-bold">Criar senha nova</h1>
              <p className="mt-1.5 text-sm text-grafite">
                Escolha uma senha com pelo menos 8 caracteres.
              </p>
            </div>

            <label className="block text-sm font-medium">
              Senha nova
              <span className="relative mt-1.5 block">
                <input
                  type={verSenha ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="campo pr-11"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-grafite-2 hover:text-tinta"
                >
                  {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            <label className="block text-sm font-medium">
              Repita a senha
              <input
                type={verSenha ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                className="campo mt-1.5"
                value={repetida}
                onChange={(e) => setRepetida(e.target.value)}
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

            <button disabled={ocupado || sessaoValida === null} className="botao w-full">
              {ocupado && <Loader2 size={17} className="girando" aria-hidden />}
              {ocupado ? 'Salvando...' : 'Salvar senha'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

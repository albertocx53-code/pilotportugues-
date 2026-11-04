'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { Marca } from '@/components/brand/logo';

type Modo = 'login' | 'cadastro';

/** Mensagens do Supabase vêm em inglês; traduzimos as mais comuns. */
function mensagemDeErro(bruta: string, modo: Modo): string {
  const m = bruta.toLowerCase();
  if (m.includes('invalid login credentials'))
    return 'E-mail ou senha não conferem. Confira e tente de novo.';
  if (m.includes('email not confirmed'))
    return 'Falta confirmar seu e-mail. Procure a mensagem que enviamos na sua caixa de entrada.';
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Esse e-mail já tem conta. Entre com ele ou recupere a senha.';
  if (m.includes('password should be at least'))
    return 'A senha precisa de pelo menos 8 caracteres.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas seguidas. Espere um minuto e tente outra vez.';
  if (m.includes('fetch') || m.includes('network'))
    return 'Sem conexão com o servidor. Verifique sua internet.';
  return modo === 'login'
    ? 'Não foi possível entrar agora. Tente novamente.'
    : 'Não foi possível criar a conta agora. Tente novamente.';
}

export default function AuthForm({ modo }: { modo: Modo }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const proximo = params.get('proximo') || '/dashboard';

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setErro('');
    setAviso('');

    const client = supabaseBrowser();

    try {
      if (modo === 'cadastro') {
        const { data, error } = await client.auth.signUp({
          email,
          password: senha,
          options: {
            data: { full_name: nome.trim() },
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) {
          setErro(mensagemDeErro(error.message, modo));
        } else if (data.session) {
          router.replace('/onboarding');
          router.refresh();
          return;
        } else {
          setAviso(
            'Conta criada. Enviamos um e-mail de confirmação — abra o link para entrar.',
          );
        }
      } else {
        const { error } = await client.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) {
          setErro(mensagemDeErro(error.message, modo));
        } else {
          router.replace(proximo.startsWith('/') ? proximo : '/dashboard');
          router.refresh();
          return;
        }
      }
    } catch {
      setErro('Sem conexão com o servidor. Verifique sua internet.');
    }

    setOcupado(false);
  }

  const novaConta = modo === 'cadastro';

  return (
    <main className="grid min-h-screen place-items-center bg-papel-2 px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-7 inline-block" aria-label="PortuguêsPilot, início">
          <Marca tamanho="lg" />
        </Link>

        <form onSubmit={enviar} className="folha space-y-5 p-7 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold">
              {novaConta ? 'Criar sua conta' : 'Entrar'}
            </h1>
            <p className="mt-1.5 text-sm text-grafite">
              {novaConta
                ? 'Leva menos de um minuto e começa no plano gratuito.'
                : 'Bom te ver de volta.'}
            </p>
          </div>

          {novaConta && (
            <label className="block text-sm font-medium">
              Seu nome
              <input
                className="campo mt-1.5"
                required
                autoComplete="name"
                maxLength={120}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como a turma te chama"
              />
            </label>
          )}

          <label className="block text-sm font-medium">
            E-mail
            <input
              type="email"
              className="campo mt-1.5"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="professor@escola.br"
            />
          </label>

          <label className="block text-sm font-medium">
            Senha
            <span className="relative mt-1.5 block">
              <input
                type={verSenha ? 'text' : 'password'}
                className="campo pr-11"
                required
                minLength={8}
                autoComplete={novaConta ? 'new-password' : 'current-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={novaConta ? 'Pelo menos 8 caracteres' : ''}
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

          {erro && (
            <p
              role="alert"
              className="rounded-lg bg-correcao-clara px-3.5 py-3 text-sm text-correcao"
            >
              {erro}
            </p>
          )}
          {aviso && (
            <p
              role="status"
              className="rounded-lg bg-giz-clara px-3.5 py-3 text-sm text-giz"
            >
              {aviso}
            </p>
          )}

          <button disabled={ocupado} className="botao w-full">
            {ocupado && <Loader2 size={17} className="girando" aria-hidden />}
            {ocupado
              ? novaConta
                ? 'Criando conta...'
                : 'Entrando...'
              : novaConta
                ? 'Criar conta'
                : 'Entrar'}
          </button>

          <div className="space-y-2 text-center text-sm">
            {!novaConta && (
              <p>
                <Link href="/recuperar-senha" className="botao-texto">
                  Esqueci minha senha
                </Link>
              </p>
            )}
            <p className="text-grafite">
              {novaConta ? 'Já tem conta? ' : 'Ainda não tem conta? '}
              <Link href={novaConta ? '/login' : '/cadastro'} className="botao-texto">
                {novaConta ? 'Entrar' : 'Criar agora'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

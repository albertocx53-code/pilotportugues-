import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Destino dos links de e-mail do Supabase (confirmação de cadastro,
 * recuperação de senha, troca de e-mail). Aceita os dois formatos: `code`
 * (PKCE) e `token_hash` + `type` (OTP).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  // `next` só é aceito como caminho interno, para não virar redirecionamento aberto.
  const bruto = url.searchParams.get('next') || '';
  const destino = bruto.startsWith('/') && !bruto.startsWith('//') ? bruto : null;

  const client = await supabaseServer();

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(destino ?? '/dashboard', url.origin));
    }
  } else if (tokenHash && type) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const padrao = type === 'recovery' ? '/redefinir-senha' : '/dashboard';
      return NextResponse.redirect(new URL(destino ?? padrao, url.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?confirmacao=erro', url.origin));
}

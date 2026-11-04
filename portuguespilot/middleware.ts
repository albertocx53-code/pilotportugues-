import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';

type ParaGravar = Parameters<NonNullable<CookieMethodsServer['setAll']>>[0];

/**
 * Mantém a sessão do Supabase renovada a cada navegação e barra o acesso ao
 * painel sem login. O arquivo precisa ter exatamente este nome na raiz do
 * projeto — o Next só reconhece `middleware.ts`.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items: ParaGravar) {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const protegido = path.startsWith('/dashboard') || path.startsWith('/onboarding');
  const deAutenticacao = path === '/login' || path === '/cadastro';

  if (!user && protegido) {
    const url = new URL('/login', request.url);
    url.searchParams.set('proximo', path);
    return NextResponse.redirect(url);
  }

  if (user && deAutenticacao) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding',
    '/login',
    '/cadastro',
    '/recuperar-senha',
    '/redefinir-senha',
    '/auth/:path*',
  ],
};

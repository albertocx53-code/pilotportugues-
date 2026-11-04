import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { cookies } from 'next/headers';

type ParaGravar = Parameters<NonNullable<CookieMethodsServer['setAll']>>[0];

export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(items: ParaGravar) {
          try {
            items.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            // Server Components não podem escrever cookies; o middleware já renovou.
          }
        },
      },
    },
  );
}

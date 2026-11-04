import type { NextConfig } from 'next';

const dev = process.env.NODE_ENV !== 'production';

/**
 * A origem do Supabase sai da própria variável de ambiente, em vez de um
 * curinga fixo. Assim a CSP continua correta se o projeto usar domínio
 * próprio, e não libera nenhum host a mais do que o necessário.
 */
const origemSupabase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin;
  } catch {
    return 'https://*.supabase.co';
  }
})();

/**
 * CSP: em produção não liberamos 'unsafe-eval'. O modo de desenvolvimento do
 * Next precisa de eval para o hot reload, então ele entra só quando dev=true.
 * As imagens são servidas pelo nosso proxy (/api/images/file), por isso
 * img-src não precisa liberar domínios externos.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${origemSupabase}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  'upgrade-insecure-requests',
].join('; ');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default config;

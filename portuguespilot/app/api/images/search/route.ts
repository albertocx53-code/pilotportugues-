import { apiUser, falha, ok } from '@/lib/api-security';

export const runtime = 'nodejs';

/**
 * Busca de imagens na Wikimedia Commons.
 *
 * Nada é gerado por IA aqui: são fotos e ilustrações já existentes, com
 * licença. A URL devolvida aponta para o nosso proxy autenticado
 * (/api/images/file), não para o arquivo original — assim evitamos CORS e
 * não expomos o professor a domínios de terceiros.
 */
export async function GET(req: Request) {
  if (!(await apiUser())) return falha('Sua sessão expirou. Entre de novo.', 401);

  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  if (q.length < 3 || q.length > 90) {
    return falha('Escreva de 3 a 90 caracteres na busca.');
  }

  const api = new URL('https://commons.wikimedia.org/w/api.php');
  const params: Record<string, string> = {
    action: 'query',
    generator: 'search',
    gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '16',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '800',
    format: 'json',
    origin: '*',
  };
  Object.entries(params).forEach(([k, v]) => api.searchParams.set(k, v));

  try {
    const res = await fetch(api, {
      signal: AbortSignal.timeout(9000),
      headers: { 'User-Agent': 'PortuguesPilot/1.0 (busca de imagens educacionais)' },
    });
    if (!res.ok) throw new Error('resposta ruim');

    const json = await res.json();
    const paginas = Object.values(json?.query?.pages ?? {}) as Array<{
      title?: string;
      imageinfo?: Array<{
        thumburl?: string;
        descriptionurl?: string;
        mime?: string;
        extmetadata?: Record<string, { value?: string }>;
      }>;
    }>;

    const semHtml = (s: string) => s.replace(/<[^>]*>/g, '').trim();

    const imagens = paginas
      .map((p) => {
        const info = p.imageinfo?.[0];
        return {
          title: p.title ?? '',
          url: `/api/images/file?title=${encodeURIComponent(p.title ?? '')}`,
          source: info?.descriptionurl ?? '',
          license: semHtml(info?.extmetadata?.LicenseShortName?.value ?? '') || 'Ver na origem',
          artist: semHtml(info?.extmetadata?.Artist?.value ?? '').slice(0, 180),
        };
      })
      .filter(
        (x) =>
          x.title.startsWith('File:') &&
          x.source.startsWith('https://commons.wikimedia.org/'),
      );

    return ok({ imagens });
  } catch {
    return falha(
      'A Wikimedia Commons não respondeu. Tente de novo ou envie uma imagem do seu computador.',
      502,
    );
  }
}

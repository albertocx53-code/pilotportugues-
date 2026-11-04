import { apiUser, falha } from '@/lib/api-security';

export const runtime = 'nodejs';

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
const HOSTS_ACEITOS = ['upload.wikimedia.org'];
const TAMANHO_MAXIMO = 3_000_000;

/**
 * Proxy autenticado das imagens da Wikimedia.
 *
 * Só serve arquivos que a própria API da Commons indicar, e apenas do host
 * upload.wikimedia.org, com tipo de imagem conhecido. Isso impede que o
 * parâmetro `title` seja usado para fazer o servidor buscar endereços
 * arbitrários (SSRF).
 */
export async function GET(req: Request) {
  if (!(await apiUser())) return falha('Sua sessão expirou. Entre de novo.', 401);

  const title = new URL(req.url).searchParams.get('title') || '';
  if (!title.startsWith('File:') || title.length > 250) {
    return falha('Arquivo inválido.');
  }

  const api = new URL('https://commons.wikimedia.org/w/api.php');
  const params: Record<string, string> = {
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '800',
    format: 'json',
  };
  Object.entries(params).forEach(([k, v]) => api.searchParams.set(k, v));

  try {
    const info = await fetch(api, {
      signal: AbortSignal.timeout(9000),
      headers: { 'User-Agent': 'PortuguesPilot/1.0 (proxy de imagens)' },
    });
    if (!info.ok) throw new Error('metadados indisponíveis');

    const json = await info.json();
    const pagina = Object.values(json?.query?.pages ?? {})[0] as
      | { imageinfo?: Array<{ thumburl?: string; mime?: string }> }
      | undefined;
    const imagem = pagina?.imageinfo?.[0];

    if (!imagem?.thumburl || !TIPOS_ACEITOS.includes(imagem.mime ?? '')) {
      return falha('Esse formato de imagem não é aceito.', 415);
    }

    const url = new URL(imagem.thumburl);
    if (url.protocol !== 'https:' || !HOSTS_ACEITOS.includes(url.hostname)) {
      return falha('Origem de imagem não permitida.', 403);
    }

    const arquivo = await fetch(url, { signal: AbortSignal.timeout(9000) });
    if (!arquivo.ok) throw new Error('download falhou');

    const bytes = await arquivo.arrayBuffer();
    if (bytes.byteLength > TAMANHO_MAXIMO) {
      return falha('A imagem é grande demais.', 413);
    }

    return new Response(bytes, {
      headers: {
        'Content-Type': imagem.mime!,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
      },
    });
  } catch {
    return falha('Não foi possível carregar a imagem.', 502);
  }
}

import {apiUser,failure} from '@/lib/api-security';
export async function GET(req:Request){if(!await apiUser())return failure('Faça login.',401);
 const title=new URL(req.url).searchParams.get('title')||'';if(!title.startsWith('File:')||title.length>250)return failure('Arquivo inválido');
 const api=new URL('https://commons.wikimedia.org/w/api.php');api.searchParams.set('action','query');api.searchParams.set('titles',title);api.searchParams.set('prop','imageinfo');api.searchParams.set('iiprop','url|mime');api.searchParams.set('iiurlwidth','800');api.searchParams.set('format','json');
 try{const info=await fetch(api,{signal:AbortSignal.timeout(9000)});if(!info.ok)throw Error();const j=await info.json();const page=Object.values(j.query?.pages||{})[0] as {imageinfo?:Array<{thumburl?:string;mime?:string}>};const image=page?.imageinfo?.[0];if(!image?.thumburl||!['image/jpeg','image/png','image/webp'].includes(image.mime||''))return failure('Formato não permitido',415);
 const url=new URL(image.thumburl);if(url.protocol!=='https:'||!['upload.wikimedia.org'].includes(url.hostname))return failure('Origem não permitida',403);
 const res=await fetch(url,{signal:AbortSignal.timeout(9000)});if(!res.ok)throw Error();const blob=await res.arrayBuffer();if(blob.byteLength>3_000_000)return failure('Imagem grande demais',413);return new Response(blob,{headers:{'Content-Type':image.mime!,'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'}})
 }catch{return failure('Não foi possível carregar a imagem.',502)}
}

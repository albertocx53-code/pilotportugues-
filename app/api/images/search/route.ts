import {NextResponse} from 'next/server';
import {apiUser,failure} from '@/lib/api-security';
export async function GET(req:Request){
 if(!await apiUser())return failure('Faça login.',401);
 const q=new URL(req.url).searchParams.get('q')?.trim()||'';
 if(q.length<3||q.length>90)return failure('Busca inválida.');
 const endpoint=new URL('https://commons.wikimedia.org/w/api.php');
 endpoint.searchParams.set('action','query');endpoint.searchParams.set('generator','search');endpoint.searchParams.set('gsrsearch',q+' filetype:bitmap');endpoint.searchParams.set('gsrnamespace','6');endpoint.searchParams.set('gsrlimit','12');endpoint.searchParams.set('prop','imageinfo');endpoint.searchParams.set('iiprop','url|extmetadata');endpoint.searchParams.set('iiurlwidth','800');endpoint.searchParams.set('format','json');
 try{const res=await fetch(endpoint,{signal:AbortSignal.timeout(9000),headers:{'User-Agent':'AulaPilotPortugues/1.0 (educational image search)'}});if(!res.ok)throw Error();const json=await res.json();const pages=Object.values(json.query?.pages||{}) as Array<{title:string;imageinfo?:Array<{thumburl?:string;descriptionurl?:string;extmetadata?:Record<string,{value?:string}>}>}>;
 const images=pages.map(p=>({title:p.title,url:'/api/images/file?title='+encodeURIComponent(p.title),source:p.imageinfo?.[0]?.descriptionurl||'',license:p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value||'Verificar na origem',artist:(p.imageinfo?.[0]?.extmetadata?.Artist?.value||'').replace(/<[^>]*>/g,'').slice(0,180)})).filter(x=>x.source.startsWith('https://commons.wikimedia.org/'));
 return NextResponse.json({images},{headers:{'Cache-Control':'private, max-age=60'}})}catch{return failure('Wikimedia Commons indisponível.',502)}
}

import {NextResponse} from 'next/server';
import {supabaseServer} from '@/lib/supabase/server';
export async function apiUser(){const db=await supabaseServer();const {data:{user},error}=await db.auth.getUser();return error||!user?null:{db,user};}
export function failure(message:string,status=400){return NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}})}
export async function quota(db:Awaited<ReturnType<typeof supabaseServer>>,userId:string,action:string){
 const {data,error}=await db.rpc('consume_generation_quota',{p_action:action,p_max_daily:15});
 if(error)throw Error('Limite indisponível: aplique a migração de segurança.');
 return data===true;
}
export function isText(s:unknown,max=140){return typeof s==='string'&&s.trim().length>=3&&s.length<=max;}

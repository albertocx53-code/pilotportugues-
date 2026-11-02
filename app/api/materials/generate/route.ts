import {NextResponse} from 'next/server';
import {apiUser,failure,isText,quota} from '@/lib/api-security';
export const runtime='nodejs';
export async function POST(req:Request){
 const session=await apiUser();if(!session)return failure('Faça login.',401);
 const length=Number(req.headers.get('content-length')||0);if(length>4000)return failure('Solicitação muito grande.',413);
 let data:Record<string,unknown>;try{data=await req.json()}catch{return failure('JSON inválido')}
 const {kind,topic,grade,quantity}=data;
 if(!['atividade','mapa_mental'].includes(String(kind))||!isText(topic)||!isText(grade,60))return failure('Dados inválidos');
 const count=Number(quantity||8);if(!Number.isInteger(count)||count<3||count>15)return failure('Quantidade inválida');
 if(!process.env.OPENAI_API_KEY)return failure('Configure OPENAI_API_KEY no servidor.',503);
 try{if(!await quota(session.db,session.user.id,String(kind)))return failure('Limite diário de 15 gerações atingido.',429)}catch{return failure('Proteção de limite indisponível.',503)}
 const system=kind==='atividade'?'Você é professor especialista em Língua Portuguesa. Gere atividade original com enunciados claros, gabarito correto e explicações.':'Você é especialista em mapas mentais pedagógicos de Língua Portuguesa. Gere nós hierárquicos curtos, relações conceituais corretas e palavras-chave, sem inventar fatos.';
 const schema=kind==='atividade'?'{"title":"...","intro":"...","items":[{"question":"...","answer":"...","explanation":"..."}]}':'{"title":"...","central":"...","branches":[{"title":"...","details":["...","..."]}]}';
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),35000);
  let response:Response;try{response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},temperature:0.35,max_tokens:3500,messages:[{role:'system',content:system+' Retorne APENAS JSON neste formato: '+schema+'. Não invente códigos BNCC; revise ortografia e gabaritos.'},{role:'user',content:JSON.stringify({topic,grade,count})}]})})}finally{clearTimeout(timer)}
  if(!response.ok)return failure('Não foi possível gerar o material.',502);
  const raw=await response.json();const material=JSON.parse(raw.choices?.[0]?.message?.content||'null');
  if(!material||typeof material.title!=='string'||material.title.length>160||typeof material!=='object')return failure('Resposta inválida.',502);
  if(kind==='atividade'&&(!Array.isArray(material.items)||material.items.length<1||material.items.length>20||!material.items.every((x:unknown)=>{const v=x as Record<string,unknown>;return v&&['question','answer','explanation'].every(k=>typeof v[k]==='string'&&String(v[k]).length<3000)})))return failure('Atividade inválida.',502);
  if(kind==='mapa_mental'&&(!Array.isArray(material.branches)||material.branches.length<1||material.branches.length>12||!material.branches.every((x:unknown)=>{const v=x as Record<string,unknown>;return v&&typeof v.title==='string'&&v.title.length<160&&Array.isArray(v.details)&&v.details.length<=12&&v.details.every((d:unknown)=>typeof d==='string'&&d.length<400)})))return failure('Mapa inválido.',502);
  return NextResponse.json({material},{headers:{'Cache-Control':'no-store'}});
 }catch{return failure('Erro ao gerar. Tente novamente.',502)}
}

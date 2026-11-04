import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export type Sessao = {
  db: Awaited<ReturnType<typeof supabaseServer>>;
  user: { id: string; email?: string };
};

export async function apiUser(): Promise<Sessao | null> {
  const db = await supabaseServer();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) return null;
  return { db, user: { id: user.id, email: user.email } };
}

export function falha(mensagem: string, status = 400) {
  return NextResponse.json(
    { error: mensagem },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export function ok(corpo: unknown) {
  return NextResponse.json(corpo, { headers: { 'Cache-Control': 'no-store' } });
}

export type ResultadoQuota = {
  ok: boolean;
  reason?: string;
  used?: number;
  limit?: number;
  remaining?: number;
};

/**
 * Consome uma geração do limite diário. A conta é atômica e feita no banco:
 * mesmo com várias abas abertas o professor não passa do limite do plano.
 */
export async function consumirQuota(
  db: Sessao['db'],
  acao: string,
): Promise<ResultadoQuota> {
  const { data, error } = await db.rpc('consume_generation_quota', { p_action: acao });
  if (error) throw new Error('Controle de limite indisponível. Aplique as migrações.');
  return (data ?? { ok: false, reason: 'unknown' }) as ResultadoQuota;
}

export async function statusQuota(db: Sessao['db']): Promise<ResultadoQuota & { plan?: string }> {
  const { data, error } = await db.rpc('generation_status');
  if (error) return { ok: false, reason: 'unavailable' };
  return (data ?? { ok: false }) as ResultadoQuota & { plan?: string };
}

/** Texto curto obrigatório (tema, turma). */
export function texto(valor: unknown, max = 160, min = 3): string | null {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim().replace(/\s+/g, ' ');
  if (limpo.length < min || limpo.length > max) return null;
  return limpo;
}

/** Texto longo obrigatório (redação do aluno). */
export function textoLongo(valor: unknown, max = 12000, min = 200): string | null {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  if (limpo.length < min || limpo.length > max) return null;
  return limpo;
}

export function inteiro(valor: unknown, min: number, max: number, padrao: number): number | null {
  const n = valor === undefined || valor === null || valor === '' ? padrao : Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

/** Barra corpos grandes antes de ler o JSON. */
export function corpoGrande(req: Request, limite = 40000): boolean {
  return Number(req.headers.get('content-length') || 0) > limite;
}

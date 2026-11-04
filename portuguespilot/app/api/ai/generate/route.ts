import {
  apiUser,
  consumirQuota,
  corpoGrande,
  falha,
  inteiro,
  ok,
  texto,
  textoLongo,
} from '@/lib/api-security';
import { ESPECIFICACOES, ErroDeIA, gerarJson } from '@/lib/ai';
import { ehTipoDeTexto } from '@/lib/modules';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Rota única de geração dos módulos de texto. Toda a configuração de cada
 * módulo (prompt, formato esperado e validação) vive em lib/ai.ts, para que
 * acrescentar um módulo não exija mexer aqui.
 */
export async function POST(req: Request) {
  const sessao = await apiUser();
  if (!sessao) return falha('Sua sessão expirou. Entre de novo para continuar.', 401);

  if (corpoGrande(req)) return falha('O conteúdo enviado é grande demais.', 413);

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return falha('Não foi possível ler os dados enviados.');
  }

  const tipo = corpo.tipo;
  if (!ehTipoDeTexto(tipo)) return falha('Esse tipo de material não existe.');

  const espec = ESPECIFICACOES[tipo];

  const tema = texto(corpo.tema, 160);
  if (!tema) return falha('Escreva um tema com 3 a 160 caracteres.');

  const turma = texto(corpo.turma, 80, 2);
  if (!turma) return falha('Informe a turma ou o ano.');

  const quantidade = inteiro(corpo.quantidade, 3, 20, 8);
  if (quantidade === null) return falha('A quantidade deve ficar entre 3 e 20.');

  const observacao =
    typeof corpo.observacao === 'string' && corpo.observacao.trim()
      ? corpo.observacao.trim().slice(0, 600)
      : '';

  /* A correção de redação precisa do texto do aluno. */
  let redacao: string | null = null;
  if (espec.precisaDeTexto) {
    redacao = textoLongo(corpo.textoDoAluno, 12000, 200);
    if (!redacao) {
      return falha(
        'Cole a redação do aluno com pelo menos 200 caracteres (e no máximo 12 mil).',
      );
    }
  }

  /* Limite diário: contado de forma atômica no banco, antes de gastar com a IA. */
  let consumo;
  try {
    consumo = await consumirQuota(sessao.db, tipo);
  } catch {
    return falha(
      'O controle de limite não respondeu. Confirme se as migrações do banco foram aplicadas.',
      503,
    );
  }

  if (!consumo.ok) {
    if (consumo.reason === 'limit') {
      return falha(
        `Você usou as ${consumo.limit} gerações de hoje. O contador zera à meia-noite (UTC) ou você pode mudar de plano.`,
        429,
      );
    }
    return falha('Não foi possível validar seu limite de gerações.', 403);
  }

  const entrada: Record<string, unknown> = {
    tema,
    turma,
    quantidade,
    ...(observacao ? { observacaoDoProfessor: observacao } : {}),
    ...(redacao ? { textoDoAluno: redacao } : {}),
  };

  try {
    const bruto = await gerarJson(
      `${espec.sistema} Responda neste formato exato: ${espec.formato}`,
      entrada,
      espec.maxTokens,
    );

    if (!espec.valida(bruto)) {
      await devolverQuota(sessao.user.id);
      return falha(
        'A IA devolveu um material fora do formato esperado. Tente de novo — não contamos esta geração.',
        502,
      );
    }

    return ok({ material: bruto, quota: consumo });
  } catch (e) {
    await devolverQuota(sessao.user.id);
    if (e instanceof ErroDeIA) return falha(e.message, e.status);
    return falha('Algo falhou na geração. Tente novamente.', 502);
  }
}

/**
 * Se a culpa foi do provedor, a geração não deve custar nada ao professor.
 * Só funciona com a service role configurada; sem ela, seguimos sem devolver.
 */
async function devolverQuota(userId: string) {
  try {
    await supabaseAdmin().rpc('refund_generation_quota', { p_user_id: userId });
  } catch {
    /* sem service role: o limite permanece consumido */
  }
}

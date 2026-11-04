import {
  apiUser,
  consumirQuota,
  corpoGrande,
  falha,
  inteiro,
  ok,
  texto,
} from '@/lib/api-security';
import { ErroDeIA, gerarJson } from '@/lib/ai';
import { deckValido } from '@/lib/slides';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SISTEMA =
  'Você é professor(a) brasileiro(a) especialista em Língua Portuguesa e monta ' +
  'apresentações para projetar em sala. Escreva em português do Brasil e responda ' +
  'APENAS com JSON válido, sem markdown. ' +
  'Cada slide precisa caber na tela: no máximo 55 palavras no campo body, em linhas ' +
  'curtas separadas por \\n, usando • quando for lista. O campo notes é o roteiro de ' +
  'fala do professor e não aparece projetado. ' +
  'Estruture a sequência: abertura com o tema, objetivos, ativação do que a turma já ' +
  'sabe, explicação dividida em partes, exemplos retirados de textos reais, prática e ' +
  'fechamento com verificação de aprendizagem. ' +
  'Use layout "hero" no primeiro slide, "minimal" em listas e "split" no resto. ' +
  'Nunca cite códigos da BNCC. Confira a correção gramatical de cada exemplo.';

const FORMATO =
  '{"title":"string","topic":"string","grade":"string","slides":[{"id":"s1",' +
  '"title":"string","body":"string","notes":"string","layout":"hero|split|minimal"}]}';

export async function POST(req: Request) {
  const sessao = await apiUser();
  if (!sessao) return falha('Sua sessão expirou. Entre de novo para continuar.', 401);
  if (corpoGrande(req, 6000)) return falha('A solicitação é grande demais.', 413);

  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return falha('Não foi possível ler os dados enviados.');
  }

  const tema = texto(corpo.tema, 160);
  if (!tema) return falha('Escreva um tema com 3 a 160 caracteres.');

  const turma = texto(corpo.turma, 80, 2);
  if (!turma) return falha('Informe a turma ou o ano.');

  const quantidade = inteiro(corpo.quantidade, 6, 20, 12);
  if (quantidade === null) return falha('A quantidade de slides deve ficar entre 6 e 20.');

  let consumo;
  try {
    consumo = await consumirQuota(sessao.db, 'slides');
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

  try {
    const bruto = await gerarJson(
      `${SISTEMA} Gere exatamente ${quantidade} slides. Responda neste formato: ${FORMATO}`,
      { tema, turma, quantidadeDeSlides: quantidade },
      4000,
    );

    if (!deckValido(bruto)) {
      await devolverQuota(sessao.user.id);
      return falha(
        'A IA devolveu slides fora do formato esperado. Tente de novo — não contamos esta geração.',
        502,
      );
    }

    return ok({ deck: bruto, quota: consumo });
  } catch (e) {
    await devolverQuota(sessao.user.id);
    if (e instanceof ErroDeIA) return falha(e.message, e.status);
    return falha('Algo falhou na geração. Tente novamente.', 502);
  }
}

async function devolverQuota(userId: string) {
  try {
    await supabaseAdmin().rpc('refund_generation_quota', { p_user_id: userId });
  } catch {
    /* sem service role: o limite permanece consumido */
  }
}

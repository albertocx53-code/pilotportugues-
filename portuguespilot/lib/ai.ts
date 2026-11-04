import type { TipoDeTexto } from '@/lib/modules';

/* ------------------------------------------------------------------ *
 * Tipos dos materiais gerados
 * ------------------------------------------------------------------ */

export type Questao = { question: string; answer: string; explanation: string };

export type Atividade = {
  title: string;
  intro: string;
  items: Questao[];
};

export type QuestaoProva = {
  statement: string;
  options?: string[];
  answer: string;
  points: number;
  explanation: string;
};

export type Avaliacao = {
  title: string;
  instructions: string;
  totalPoints: number;
  questions: QuestaoProva[];
};

export type MapaMental = {
  title: string;
  central: string;
  branches: { title: string; details: string[] }[];
};

export type PlanoAula = {
  title: string;
  duration: string;
  objectives: string[];
  skills: string[];
  materials: string[];
  steps: { phase: string; minutes: number; description: string }[];
  assessment: string;
  homework: string;
};

export type Competencia = { name: string; score: number; max: number; comment: string };

export type CorrecaoRedacao = {
  title: string;
  totalScore: number;
  competencies: Competencia[];
  strengths: string[];
  improvements: string[];
  excerpts: { original: string; suggestion: string; reason: string }[];
  finalComment: string;
};

export type AulaEmergencia = {
  title: string;
  duration: string;
  hook: string;
  explanation: string;
  boardNotes: string[];
  activity: Questao[];
  closing: string;
};

export type MaterialGerado =
  | Atividade
  | Avaliacao
  | MapaMental
  | PlanoAula
  | CorrecaoRedacao
  | AulaEmergencia;

/* ------------------------------------------------------------------ *
 * Validadores
 * ------------------------------------------------------------------ */

const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const str = (v: unknown, max: number, min = 1): boolean =>
  typeof v === 'string' && v.trim().length >= min && v.length <= max;

const listaDeStr = (v: unknown, maxItens: number, maxTam: number, minItens = 1): boolean =>
  Array.isArray(v) &&
  v.length >= minItens &&
  v.length <= maxItens &&
  v.every((x) => str(x, maxTam));

const num = (v: unknown, min: number, max: number): boolean =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

function validaQuestoes(v: unknown, maxItens: number): boolean {
  return (
    Array.isArray(v) &&
    v.length >= 1 &&
    v.length <= maxItens &&
    v.every((item) => {
      const q = obj(item);
      return (
        !!q &&
        str(q.question, 2000) &&
        str(q.answer, 2000) &&
        str(q.explanation, 2000, 0)
      );
    })
  );
}

/* ------------------------------------------------------------------ *
 * Especificação de cada módulo: prompt, formato e validação
 * ------------------------------------------------------------------ */

const REGRAS_COMUNS =
  'Você é professor(a) brasileiro(a) especialista em Língua Portuguesa, com domínio da ' +
  'norma-padrão e da prática de sala de aula. Escreva em português do Brasil. ' +
  'Responda APENAS com JSON válido, sem markdown e sem comentários. ' +
  'Nunca cite códigos da BNCC (como EF69LP01) a menos que tenha certeza absoluta: ' +
  'na dúvida, descreva a habilidade em palavras. Confira ortografia, concordância e ' +
  'os gabaritos antes de responder: um gabarito errado é pior que nenhum material.';

type Especificacao = {
  sistema: string;
  formato: string;
  maxTokens: number;
  valida: (v: unknown) => boolean;
  /** Campos que o professor envia além de tema/turma. */
  precisaDeTexto?: boolean;
};

export const ESPECIFICACOES: Record<TipoDeTexto, Especificacao> = {
  atividade: {
    sistema:
      REGRAS_COMUNS +
      ' Monte uma lista de exercícios original, com enunciados autoexplicativos, ' +
      'contextualizados e adequados à turma informada. Varie o tipo de comando ' +
      '(identificar, classificar, reescrever, justificar). Cada item traz gabarito e ' +
      'uma explicação curta de por que a resposta é essa.',
    formato:
      '{"title":"string","intro":"string com a orientação ao aluno",' +
      '"items":[{"question":"string","answer":"string","explanation":"string"}]}',
    maxTokens: 4000,
    valida: (v) => {
      const m = obj(v);
      return !!m && str(m.title, 180) && str(m.intro, 1200, 0) && validaQuestoes(m.items, 25);
    },
  },

  avaliacao: {
    sistema:
      REGRAS_COMUNS +
      ' Monte uma prova somativa. Distribua a pontuação entre as questões de modo que ' +
      'a soma feche exatamente com totalPoints (use 10 como total, salvo pedido diferente). ' +
      'Misture questões objetivas (com o campo options) e discursivas (sem options). ' +
      'Em questão objetiva, answer deve ser exatamente o texto de uma das alternativas.',
    formato:
      '{"title":"string","instructions":"string","totalPoints":number,' +
      '"questions":[{"statement":"string","options":["string"] (omita em discursiva),' +
      '"answer":"string","points":number,"explanation":"string"}]}',
    maxTokens: 4500,
    valida: (v) => {
      const m = obj(v);
      if (!m || !str(m.title, 180) || !str(m.instructions, 1200, 0)) return false;
      if (!num(m.totalPoints, 1, 1000)) return false;
      const qs = m.questions;
      return (
        Array.isArray(qs) &&
        qs.length >= 1 &&
        qs.length <= 30 &&
        qs.every((item) => {
          const q = obj(item);
          if (!q) return false;
          if (!str(q.statement, 2500) || !str(q.answer, 2000)) return false;
          if (!num(q.points, 0, 1000)) return false;
          if (!str(q.explanation, 2000, 0)) return false;
          if (q.options !== undefined && !listaDeStr(q.options, 6, 600, 2)) return false;
          return true;
        })
      );
    },
  },

  mapa_mental: {
    sistema:
      REGRAS_COMUNS +
      ' Monte um mapa mental hierárquico. O nó central é o conceito; cada ramo é uma ' +
      'subdivisão real do conteúdo, com palavras-chave curtas (não frases longas). ' +
      'Relações conceituais corretas, sem inventar classificações.',
    formato:
      '{"title":"string","central":"string curta",' +
      '"branches":[{"title":"string","details":["string curta"]}]}',
    maxTokens: 2500,
    valida: (v) => {
      const m = obj(v);
      if (!m || !str(m.title, 180) || !str(m.central, 180)) return false;
      const b = m.branches;
      return (
        Array.isArray(b) &&
        b.length >= 1 &&
        b.length <= 12 &&
        b.every((item) => {
          const r = obj(item);
          return !!r && str(r.title, 180) && listaDeStr(r.details, 12, 400);
        })
      );
    },
  },

  plano_aula: {
    sistema:
      REGRAS_COMUNS +
      ' Monte um plano de aula aplicável. Os passos devem somar a duração informada e ' +
      'descrever o que o professor faz e o que os alunos fazem. Em skills, descreva as ' +
      'habilidades em palavras (sem código BNCC). Recursos devem ser realistas para a ' +
      'escola pública brasileira: quadro, cópia impressa, celular do aluno.',
    formato:
      '{"title":"string","duration":"string (ex.: 50 minutos)",' +
      '"objectives":["string"],"skills":["string"],"materials":["string"],' +
      '"steps":[{"phase":"string","minutes":number,"description":"string"}],' +
      '"assessment":"string","homework":"string"}',
    maxTokens: 3500,
    valida: (v) => {
      const m = obj(v);
      if (!m || !str(m.title, 180) || !str(m.duration, 60)) return false;
      if (!listaDeStr(m.objectives, 10, 500)) return false;
      if (!listaDeStr(m.skills, 10, 500)) return false;
      if (!listaDeStr(m.materials, 15, 300)) return false;
      if (!str(m.assessment, 2000, 0) || !str(m.homework, 2000, 0)) return false;
      const s = m.steps;
      return (
        Array.isArray(s) &&
        s.length >= 1 &&
        s.length <= 12 &&
        s.every((item) => {
          const p = obj(item);
          return (
            !!p && str(p.phase, 120) && num(p.minutes, 0, 400) && str(p.description, 2000)
          );
        })
      );
    },
  },

  redacao: {
    sistema:
      REGRAS_COMUNS +
      ' Corrija a redação do aluno pelas cinco competências do ENEM, cada uma de 0 a 200: ' +
      '1) domínio da norma-padrão; 2) compreensão da proposta e repertório; ' +
      '3) seleção e organização de argumentos; 4) coesão e mecanismos linguísticos; ' +
      '5) proposta de intervenção. totalScore é a soma das cinco notas (0 a 1000). ' +
      'Em excerpts, copie o trecho exatamente como está no texto do aluno e proponha a ' +
      'reescrita. Seja específico e respeitoso: o retorno será lido pelo estudante. ' +
      'Não invente trechos que não estejam no texto enviado.',
    formato:
      '{"title":"string","totalScore":number,' +
      '"competencies":[{"name":"string","score":number,"max":200,"comment":"string"}],' +
      '"strengths":["string"],"improvements":["string"],' +
      '"excerpts":[{"original":"string","suggestion":"string","reason":"string"}],' +
      '"finalComment":"string"}',
    maxTokens: 4000,
    precisaDeTexto: true,
    valida: (v) => {
      const m = obj(v);
      if (!m || !str(m.title, 180) || !num(m.totalScore, 0, 1000)) return false;
      if (!str(m.finalComment, 3000, 0)) return false;
      if (!listaDeStr(m.strengths, 10, 600, 0)) return false;
      if (!listaDeStr(m.improvements, 10, 600, 0)) return false;
      const c = m.competencies;
      if (
        !Array.isArray(c) ||
        c.length < 1 ||
        c.length > 5 ||
        !c.every((item) => {
          const k = obj(item);
          return (
            !!k && str(k.name, 200) && num(k.score, 0, 200) && str(k.comment, 2000, 0)
          );
        })
      )
        return false;
      const e = m.excerpts;
      return (
        e === undefined ||
        (Array.isArray(e) &&
          e.length <= 12 &&
          e.every((item) => {
            const x = obj(item);
            return (
              !!x &&
              str(x.original, 1200) &&
              str(x.suggestion, 1200) &&
              str(x.reason, 1200, 0)
            );
          }))
      );
    },
  },

  aula_emergencia: {
    sistema:
      REGRAS_COMUNS +
      ' Monte uma aula completa para quem vai assumir a turma agora, sem tempo de ' +
      'preparo e possivelmente sem material impresso. Tudo tem de caber no quadro e na ' +
      'fala. hook é uma abertura de 5 minutos que prende a turma. boardNotes é o que o ' +
      'professor copia no quadro, em linhas curtas. A atividade deve ser respondida no ' +
      'caderno, com gabarito para correção coletiva.',
    formato:
      '{"title":"string","duration":"string","hook":"string","explanation":"string",' +
      '"boardNotes":["string curta"],' +
      '"activity":[{"question":"string","answer":"string","explanation":"string"}],' +
      '"closing":"string"}',
    maxTokens: 3500,
    valida: (v) => {
      const m = obj(v);
      return (
        !!m &&
        str(m.title, 180) &&
        str(m.duration, 60) &&
        str(m.hook, 2000) &&
        str(m.explanation, 5000) &&
        listaDeStr(m.boardNotes, 20, 400) &&
        validaQuestoes(m.activity, 15) &&
        str(m.closing, 2000, 0)
      );
    },
  },
};

/* ------------------------------------------------------------------ *
 * Chamada ao provedor
 * ------------------------------------------------------------------ */

export class ErroDeIA extends Error {
  status: number;
  constructor(mensagem: string, status = 502) {
    super(mensagem);
    this.status = status;
  }
}

/**
 * Faz a chamada ao modelo e devolve o JSON já convertido. A chave nunca sai do
 * servidor. Tempo máximo de 45s para não prender a conexão do professor.
 */
export async function gerarJson(
  sistema: string,
  entrada: unknown,
  maxTokens: number,
): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new ErroDeIA(
      'A geração por IA ainda não está ligada: falta configurar OPENAI_API_KEY no servidor.',
      503,
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  /* OPENAI_BASE_URL permite trocar o provedor por qualquer um compatível com a
     API da OpenAI (Azure OpenAI, OpenRouter, modelo local) sem mexer no código. */
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(
    /\/+$/,
    '',
  );

  let resposta: Response;
  try {
    resposta = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sistema },
          { role: 'user', content: JSON.stringify(entrada) },
        ],
      }),
    });
  } catch (e) {
    throw new ErroDeIA(
      (e as Error)?.name === 'AbortError'
        ? 'A geração passou de 45 segundos. Tente um tema mais específico.'
        : 'Não foi possível falar com o provedor de IA.',
    );
  } finally {
    clearTimeout(timer);
  }

  if (resposta.status === 429) {
    throw new ErroDeIA('O provedor de IA está sobrecarregado. Tente em instantes.', 429);
  }
  if (!resposta.ok) {
    throw new ErroDeIA('O provedor de IA não concluiu a geração.');
  }

  const bruto = await resposta.json();
  const conteudo = bruto?.choices?.[0]?.message?.content;
  if (typeof conteudo !== 'string') throw new ErroDeIA('Resposta vazia do provedor.');

  try {
    return JSON.parse(conteudo);
  } catch {
    throw new ErroDeIA('O provedor devolveu um JSON inválido.');
  }
}

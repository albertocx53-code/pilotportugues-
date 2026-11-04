'use client';

import type {
  Atividade,
  AulaEmergencia,
  Avaliacao,
  CorrecaoRedacao,
  MapaMental,
  PlanoAula,
} from '@/lib/ai';
import { CampoEditavel } from '@/components/studio/campo-editavel';

const LETRAS = ['a', 'b', 'c', 'd', 'e', 'f'];

/* Caixa do gabarito, igual em todos os módulos que têm resposta. */
function Gabarito({
  resposta,
  explicacao,
  visivel,
}: {
  resposta: string;
  explicacao?: string;
  visivel: boolean;
}) {
  if (!visivel) return null;
  return (
    <div className="mt-2.5 rounded-lg border border-giz/30 bg-giz-clara px-3.5 py-2.5 text-sm">
      <p>
        <span className="font-semibold text-giz">Resposta:</span> {resposta}
      </p>
      {explicacao && (
        <p className="mt-1.5 leading-relaxed text-tinta-2">{explicacao}</p>
      )}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid">
      <h3 className="border-b border-linha pb-1.5 text-sm font-semibold text-pena">
        {titulo}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-1.5">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-2.5 leading-relaxed">
          <span className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-pena" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- *
 * Atividade
 * ---------------------------------------------------------------- */

export function VisaoAtividade({
  material,
  setMaterial,
  gabarito,
}: {
  material: Atividade;
  setMaterial: (m: Atividade) => void;
  gabarito: boolean;
}) {
  return (
    <>
      <CampoEditavel
        rotulo="Orientação ao aluno"
        valor={material.intro}
        onChange={(intro) => setMaterial({ ...material, intro })}
        className="text-[15px] text-grafite"
        placeholder="Orientação para a turma"
      />

      <ol className="mt-6 space-y-6">
        {material.items.map((item, i) => (
          <li key={i} className="break-inside-avoid">
            <div className="flex gap-3">
              <span className="display mt-1 shrink-0 font-semibold text-pena">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <CampoEditavel
                  rotulo={`Enunciado da questão ${i + 1}`}
                  valor={item.question}
                  onChange={(question) =>
                    setMaterial({
                      ...material,
                      items: material.items.map((x, n) =>
                        n === i ? { ...x, question } : x,
                      ),
                    })
                  }
                />
                <Gabarito
                  resposta={item.answer}
                  explicacao={item.explanation}
                  visivel={gabarito}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ---------------------------------------------------------------- *
 * Avaliação
 * ---------------------------------------------------------------- */

export function VisaoAvaliacao({
  material,
  setMaterial,
  gabarito,
}: {
  material: Avaliacao;
  setMaterial: (m: Avaliacao) => void;
  gabarito: boolean;
}) {
  const soma = material.questions.reduce((t, q) => t + (q.points || 0), 0);
  const divergente = Math.abs(soma - material.totalPoints) > 0.01;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-linha pb-3">
        <CampoEditavel
          rotulo="Instruções da prova"
          valor={material.instructions}
          onChange={(instructions) => setMaterial({ ...material, instructions })}
          className="min-w-[14rem] flex-1 text-[15px] text-grafite"
          placeholder="Instruções para o aluno"
        />
        <p className="shrink-0 text-sm font-semibold">
          Total: {material.totalPoints} pontos
        </p>
      </div>

      {divergente && (
        <p className="nao-imprimir mt-3 rounded-lg bg-correcao-clara px-3.5 py-2.5 text-sm text-correcao">
          A soma das questões dá {soma.toFixed(2).replace(/\.00$/, '')} pontos, e o total
          declarado é {material.totalPoints}. Ajuste antes de aplicar.
        </p>
      )}

      <ol className="mt-6 space-y-7">
        {material.questions.map((q, i) => (
          <li key={i} className="break-inside-avoid">
            <div className="flex gap-3">
              <span className="display mt-1 shrink-0 font-semibold text-pena">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <CampoEditavel
                    rotulo={`Enunciado da questão ${i + 1}`}
                    valor={q.statement}
                    onChange={(statement) =>
                      setMaterial({
                        ...material,
                        questions: material.questions.map((x, n) =>
                          n === i ? { ...x, statement } : x,
                        ),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="mt-1 shrink-0 whitespace-nowrap rounded-full bg-papel-2 px-2.5 py-1 text-xs font-semibold text-grafite">
                    {q.points} {q.points === 1 ? 'ponto' : 'pontos'}
                  </span>
                </div>

                {q.options && q.options.length > 0 && (
                  <ul className="mt-2 space-y-1.5 pl-1.5">
                    {q.options.map((op, j) => (
                      <li key={j} className="flex gap-2.5 leading-relaxed">
                        <span className="font-semibold text-grafite">
                          {LETRAS[j]})
                        </span>
                        <span>{op}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {!q.options?.length && (
                  <div
                    className="mt-3 space-y-5 border-l-2 border-dashed border-linha pl-3"
                    aria-hidden
                  >
                    <div className="h-px bg-linha" />
                    <div className="h-px bg-linha" />
                    <div className="h-px bg-linha" />
                  </div>
                )}

                <Gabarito
                  resposta={q.answer}
                  explicacao={q.explanation}
                  visivel={gabarito}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ---------------------------------------------------------------- *
 * Mapa mental
 * ---------------------------------------------------------------- */

export function VisaoMapaMental({
  material,
  setMaterial,
}: {
  material: MapaMental;
  setMaterial: (m: MapaMental) => void;
}) {
  return (
    <>
      <div className="mt-2 text-center">
        <span className="display inline-block rounded-xl bg-pena px-6 py-3 text-xl font-bold text-white dark:text-[#0c1120]">
          {material.central}
        </span>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {material.branches.map((ramo, i) => (
          <div
            key={i}
            className="break-inside-avoid rounded-folha border border-pena/25 bg-pena-clara p-4"
          >
            <CampoEditavel
              rotulo={`Título do ramo ${i + 1}`}
              valor={ramo.title}
              onChange={(title) =>
                setMaterial({
                  ...material,
                  branches: material.branches.map((x, n) =>
                    n === i ? { ...x, title } : x,
                  ),
                })
              }
              className="font-semibold text-pena"
            />
            <ul className="mt-2 space-y-1.5 pl-1.5">
              {ramo.details.map((d, j) => (
                <li key={j} className="flex gap-2.5 text-sm leading-relaxed">
                  <span
                    className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-pena/50"
                    aria-hidden
                  />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- *
 * Plano de aula
 * ---------------------------------------------------------------- */

export function VisaoPlanoAula({ material }: { material: PlanoAula }) {
  return (
    <>
      <p className="text-sm text-grafite">Duração prevista: {material.duration}</p>

      <Secao titulo="Objetivos">
        <Lista itens={material.objectives} />
      </Secao>

      <Secao titulo="Habilidades trabalhadas">
        <Lista itens={material.skills} />
      </Secao>

      <Secao titulo="Recursos">
        <p className="leading-relaxed">{material.materials.join(' · ')}</p>
      </Secao>

      <Secao titulo="Como a aula acontece">
        <ol className="space-y-4">
          {material.steps.map((p, i) => (
            <li key={i} className="flex gap-4 break-inside-avoid">
              <span className="w-16 shrink-0 pt-0.5 text-right text-sm font-semibold tabular-nums text-pena">
                {p.minutes} min
              </span>
              <span className="min-w-0 flex-1 border-l border-linha pl-4">
                <span className="block font-semibold">{p.phase}</span>
                <span className="mt-1 block leading-relaxed text-tinta-2">
                  {p.description}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao titulo="Avaliação">
        <p className="leading-relaxed">{material.assessment}</p>
      </Secao>

      {material.homework && (
        <Secao titulo="Para casa">
          <p className="leading-relaxed">{material.homework}</p>
        </Secao>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- *
 * Correção de redação
 * ---------------------------------------------------------------- */

export function VisaoCorrecao({ material }: { material: CorrecaoRedacao }) {
  const maxTotal = material.competencies.length * 200 || 1000;

  return (
    <>
      <div className="flex flex-wrap items-end gap-6 border-b border-linha pb-5">
        <div>
          <p className="text-sm text-grafite">Nota sugerida</p>
          <p className="display text-4xl font-bold tabular-nums">
            {material.totalScore}
            <span className="text-xl font-normal text-grafite-2">/{maxTotal}</span>
          </p>
        </div>
        <p className="max-w-[40ch] flex-1 text-xs leading-relaxed text-grafite">
          Esta nota é uma sugestão de leitura automática. A decisão final é sua.
        </p>
      </div>

      <Secao titulo="Competências">
        <ul className="space-y-4">
          {material.competencies.map((c, i) => {
            const proporcao = Math.min(c.score / (c.max || 200), 1);
            return (
              <li key={i} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {c.score}/{c.max || 200}
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-papel-3">
                  <div
                    className={`h-full rounded-full ${
                      proporcao >= 0.7
                        ? 'bg-giz'
                        : proporcao >= 0.4
                          ? 'bg-pena'
                          : 'bg-correcao'
                    }`}
                    style={{ width: `${proporcao * 100}%` }}
                  />
                </div>
                {c.comment && (
                  <p className="mt-2 text-sm leading-relaxed text-tinta-2">{c.comment}</p>
                )}
              </li>
            );
          })}
        </ul>
      </Secao>

      {material.strengths.length > 0 && (
        <Secao titulo="O que funcionou">
          <Lista itens={material.strengths} />
        </Secao>
      )}

      {material.improvements.length > 0 && (
        <Secao titulo="O que melhorar">
          <Lista itens={material.improvements} />
        </Secao>
      )}

      {material.excerpts && material.excerpts.length > 0 && (
        <Secao titulo="Trechos comentados">
          <ul className="space-y-4">
            {material.excerpts.map((t, i) => (
              <li
                key={i}
                className="break-inside-avoid border-l-2 border-correcao/40 pl-4"
              >
                <p className="text-sm italic leading-relaxed text-grafite">
                  “{t.original}”
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  <span className="font-semibold text-giz">Sugestão: </span>
                  {t.suggestion}
                </p>
                {t.reason && (
                  <p className="mt-1 text-xs leading-relaxed text-grafite">{t.reason}</p>
                )}
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {material.finalComment && (
        <Secao titulo="Comentário para o aluno">
          <p className="leading-relaxed">{material.finalComment}</p>
        </Secao>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- *
 * Aula de emergência
 * ---------------------------------------------------------------- */

export function VisaoAulaEmergencia({
  material,
  gabarito,
}: {
  material: AulaEmergencia;
  gabarito: boolean;
}) {
  return (
    <>
      <p className="text-sm text-grafite">Duração prevista: {material.duration}</p>

      <Secao titulo="Primeiros 5 minutos">
        <p className="leading-relaxed">{material.hook}</p>
      </Secao>

      <Secao titulo="O conteúdo">
        <p className="whitespace-pre-line leading-relaxed">{material.explanation}</p>
      </Secao>

      <Secao titulo="Para copiar no quadro">
        <div className="rounded-folha bg-tinta p-5 print:border print:border-linha print:bg-transparent">
          <ul className="space-y-2">
            {material.boardNotes.map((linha, i) => (
              <li
                key={i}
                className="display text-[15px] leading-relaxed text-papel print:text-tinta"
              >
                {linha}
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      <Secao titulo="Atividade no caderno">
        <ol className="space-y-5">
          {material.activity.map((q, i) => (
            <li key={i} className="flex gap-3 break-inside-avoid">
              <span className="display mt-0.5 shrink-0 font-semibold text-pena">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <p className="leading-relaxed">{q.question}</p>
                <Gabarito
                  resposta={q.answer}
                  explicacao={q.explanation}
                  visivel={gabarito}
                />
              </div>
            </li>
          ))}
        </ol>
      </Secao>

      {material.closing && (
        <Secao titulo="Fechamento">
          <p className="leading-relaxed">{material.closing}</p>
        </Secao>
      )}
    </>
  );
}

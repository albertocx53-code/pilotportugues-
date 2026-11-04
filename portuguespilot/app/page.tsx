import Link from 'next/link';
import { Check } from 'lucide-react';
import { Marca } from '@/components/brand/logo';
import { Icone } from '@/components/shell/icone';
import { HeroAnalise } from '@/components/landing/hero-analise';
import { MODULOS } from '@/lib/modules';
import { PLANOS } from '@/lib/plans';
import { catalog } from '@/lib/catalog';

const PASSOS = [
  {
    titulo: 'Você escreve o tema',
    texto:
      'Uma linha basta: "orações coordenadas, 9º ano". Se preferir, escolha um dos conteúdos do catálogo.',
  },
  {
    titulo: 'O material sai montado',
    texto:
      'Enunciados, gabarito, pontuação, ramos do mapa — tudo já no formato do módulo que você escolheu.',
  },
  {
    titulo: 'Você revisa e usa',
    texto:
      'Tudo é editável. Salve na biblioteca, imprima, projete ou exporte em PDF e PowerPoint.',
  },
];

export default function Home() {
  const areas = [...new Set(catalog.map((c) => c.category))];

  return (
    <div className="min-h-screen bg-papel">
      {/* ---------- Topo ---------- */}
      <header className="sticky top-0 z-40 border-b border-linha bg-papel/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" aria-label="PortuguêsPilot, início">
            <Marca />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              href="#modulos"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-grafite hover:text-tinta sm:block"
            >
              O que faz
            </Link>
            <Link
              href="#precos"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-grafite hover:text-tinta sm:block"
            >
              Preços
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-tinta hover:text-pena"
            >
              Entrar
            </Link>
            <Link href="/cadastro" className="botao text-sm">
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* ---------- Herói ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="surgir text-sm font-semibold text-pena">
              Para quem ensina Língua Portuguesa
            </p>
            <h1
              className="surgir mt-4 text-[2.1rem] font-bold leading-[1.1] tracking-tight sm:text-5xl"
              style={{ animationDelay: '0.08s' }}
            >
              A aula de amanhã,
              <br />
              pronta hoje à noite.
            </h1>
            <p
              className="surgir mt-5 max-w-[46ch] text-[1.05rem] leading-relaxed text-grafite"
              style={{ animationDelay: '0.16s' }}
            >
              Escreva o tema e escolha o formato. Slides, atividade, prova com gabarito,
              plano de aula, mapa mental, correção de redação ou uma aula inteira de
              emergência — tudo editável, tudo seu.
            </p>
            <div
              className="surgir mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '0.24s' }}
            >
              <Link href="/cadastro" className="botao">
                Começar de graça
              </Link>
              <Link href="#modulos" className="botao-vazio">
                Ver o que sai pronto
              </Link>
            </div>
            <p
              className="surgir mt-4 text-sm text-grafite-2"
              style={{ animationDelay: '0.3s' }}
            >
              15 gerações por dia no plano gratuito. Sem cartão.
            </p>
          </div>

          {/* A frase sendo analisada */}
          <div className="folha surgir p-7 sm:p-9" style={{ animationDelay: '0.2s' }}>
            <HeroAnalise />
            <p className="mt-14 border-t border-linha pt-5 text-sm leading-relaxed text-grafite">
              É isso que você faz no quadro todos os dias. O PortuguêsPilot cuida da
              digitação, da diagramação e do gabarito — a análise continua sendo sua.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Módulos ---------- */}
      <section id="modulos" className="border-y border-linha bg-papel-2 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-[28ch] text-3xl font-bold leading-tight sm:text-4xl">
            Sete módulos, um lugar só
          </h2>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-grafite">
            Cada um devolve o material no formato certo para a sua rotina — não um texto
            solto para você reorganizar.
          </p>

          <ul className="mt-12 grid gap-x-12 sm:grid-cols-2">
            {MODULOS.filter((m) => m.destaque).map((m) => (
              <li
                key={m.tipo}
                className="flex gap-4 border-b border-linha py-5 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
              >
                <span className="mt-0.5 shrink-0 text-pena">
                  <Icone nome={m.icone} size={21} />
                </span>
                <div>
                  <h3 className="text-[1.05rem] font-semibold">{m.nome}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-grafite">{m.resumo}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Como funciona (sequência real, por isso numerada) ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            Do tema ao material em três passos
          </h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li key={p.titulo}>
                <span
                  className="display block text-3xl font-bold text-pena/35"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-grafite">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Catálogo ---------- */}
      <section className="border-y border-linha bg-papel-2 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
              {catalog.length} conteúdos já mapeados
            </h2>
            <p className="mt-4 max-w-[48ch] leading-relaxed text-grafite">
              Se você não quiser digitar nada, escolha o conteúdo na lista e o material
              começa dali. Da classe gramatical ao Modernismo.
            </p>
            <Link href="/cadastro" className="botao mt-7">
              Abrir o catálogo
            </Link>
          </div>
          <ul className="grid gap-x-8 gap-y-2.5 self-center sm:grid-cols-2">
            {areas.map((area) => (
              <li key={area} className="flex items-baseline gap-2.5 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pena" aria-hidden />
                <span className="text-tinta-2">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Preços ---------- */}
      <section id="precos" className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">Planos</h2>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-grafite">
            O que muda entre os planos é quantas gerações por dia você tem. Os sete
            módulos estão em todos, inclusive no gratuito.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANOS.map((p) => {
              const destaque = p.id === 'pro';
              return (
                <div
                  key={p.id}
                  className={`flex flex-col rounded-folha border p-7 ${
                    destaque
                      ? 'border-pena bg-pena-clara shadow-lg shadow-pena/10'
                      : 'border-linha bg-papel'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold">{p.nome}</h3>
                    {destaque && (
                      <span className="rounded-full bg-pena px-2.5 py-1 text-xs font-semibold text-white dark:text-[#0c1120]">
                        Mais escolhido
                      </span>
                    )}
                  </div>
                  <p className="mt-4 flex items-baseline gap-1.5">
                    <span className="display text-4xl font-bold">{p.preco}</span>
                    <span className="text-sm text-grafite">{p.periodo}</span>
                  </p>
                  <p className="mt-3 min-h-[3rem] text-sm leading-relaxed text-grafite">
                    {p.chamada}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.recursos.map((r) => (
                      <li key={r} className="flex gap-2.5 text-sm">
                        <Check size={17} className="mt-0.5 shrink-0 text-giz" aria-hidden />
                        <span className="text-tinta-2">{r}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/cadastro"
                    className={`mt-7 w-full text-center ${destaque ? 'botao' : 'botao-vazio'}`}
                  >
                    {p.id === 'free' ? 'Criar conta' : `Assinar ${p.nome}`}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- O que ele não faz ---------- */}
      <section className="border-t border-linha bg-papel-2 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            O que ele não faz
          </h2>
          <p className="mt-4 max-w-[58ch] leading-relaxed text-grafite">
            Preferimos dizer antes de você assinar.
          </p>
          <ul className="mt-9 grid max-w-4xl gap-5 sm:grid-cols-2">
            {[
              [
                'Não substitui a sua revisão',
                'O texto sai de um modelo de linguagem. Leia antes de levar para a turma, especialmente gabaritos.',
              ],
              [
                'Não gera imagens',
                'Buscamos fotos e ilustrações com licença na Wikimedia Commons. Confira os créditos na origem antes de publicar.',
              ],
              [
                'Não cita a BNCC por código',
                'As habilidades vêm descritas em palavras. Código citado por engano atrapalha mais do que ajuda.',
              ],
              [
                'Não é sistema de escola',
                'Não há diário, notas de aluno nem painel de direção. Cada professor cuida da própria conta.',
              ],
            ].map(([titulo, texto]) => (
              <li key={titulo} className="border-l-2 border-correcao/40 pl-4">
                <h3 className="font-semibold">{titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-grafite">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Fechamento ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            Sua próxima aula já pode estar pronta
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] leading-relaxed text-grafite">
            Crie a conta, escreva um tema e veja o primeiro material sair. Leva menos
            tempo que escolher o filme da noite.
          </p>
          <Link href="/cadastro" className="botao mt-8">
            Criar conta gratuita
          </Link>
        </div>
      </section>

      <footer className="border-t border-linha bg-papel-2 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-5 sm:flex-row sm:items-center">
          <Marca tamanho="sm" />
          <p className="text-sm text-grafite-2">
            Feito para professores de Língua Portuguesa do Brasil.
          </p>
        </div>
      </footer>
    </div>
  );
}

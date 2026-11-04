'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  Printer,
  RotateCcw,
  Save,
  Sparkles,
  Star,
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { modulo, type TipoDeTexto } from '@/lib/modules';
import { catalog } from '@/lib/catalog';
import { useAviso } from '@/components/ui/toast';
import { avisarQuotaMudou } from '@/components/shell/quota-meter';
import { CampoEditavel } from '@/components/studio/campo-editavel';
import {
  VisaoAtividade,
  VisaoAulaEmergencia,
  VisaoAvaliacao,
  VisaoCorrecao,
  VisaoMapaMental,
  VisaoPlanoAula,
} from '@/components/studio/renderers';
import type {
  Atividade,
  AulaEmergencia,
  Avaliacao,
  CorrecaoRedacao,
  MapaMental,
  MaterialGerado,
  PlanoAula,
} from '@/lib/ai';

const ANOS = [
  '6º ano',
  '7º ano',
  '8º ano',
  '9º ano',
  '1ª série EM',
  '2ª série EM',
  '3ª série EM',
  'EJA',
];

/** Módulos em que faz sentido escolher quantos itens gerar. */
const TEM_QUANTIDADE: TipoDeTexto[] = ['atividade', 'avaliacao', 'aula_emergencia'];
/** Módulos com gabarito a esconder antes de imprimir para a turma. */
const TEM_GABARITO: TipoDeTexto[] = ['atividade', 'avaliacao', 'aula_emergencia'];

export function Estudio({
  tipo,
  materialInicial,
  idInicial,
  temaInicial,
  turmaInicial,
}: {
  tipo: TipoDeTexto;
  materialInicial?: MaterialGerado | null;
  idInicial?: string;
  temaInicial?: string;
  turmaInicial?: string;
}) {
  const mod = modulo(tipo)!;
  const params = useSearchParams();
  const router = useRouter();
  const { avisar } = useAviso();

  const [tema, setTema] = useState(temaInicial ?? params.get('tema') ?? '');
  const [turma, setTurma] = useState(
    turmaInicial ?? params.get('turma') ?? ANOS[2],
  );
  const [quantidade, setQuantidade] = useState(8);
  const [observacao, setObservacao] = useState('');
  const [textoDoAluno, setTextoDoAluno] = useState('');

  const [material, setMaterial] = useState<MaterialGerado | null>(
    materialInicial ?? null,
  );
  const [materialId, setMaterialId] = useState(idInicial ?? '');
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gabarito, setGabarito] = useState(true);
  const [favorito, setFavorito] = useState(false);
  const [sugestoes, setSugestoes] = useState<string[]>([]);

  /* Sugestões do catálogo conforme o professor digita. */
  useEffect(() => {
    const q = tema.trim().toLowerCase();
    if (q.length < 2 || material) {
      setSugestoes([]);
      return;
    }
    const sem = (s: string) =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const achados = catalog
      .filter((c) => sem(c.title).includes(sem(q)))
      .slice(0, 4)
      .map((c) => c.title);
    setSugestoes(achados.filter((t) => t.toLowerCase() !== q));
  }, [tema, material]);

  async function gerar() {
    if (tema.trim().length < 3) {
      avisar('Escreva um tema com pelo menos 3 letras.', 'erro');
      return;
    }
    if (tipo === 'redacao' && textoDoAluno.trim().length < 200) {
      avisar('Cole a redação do aluno — pelo menos 200 caracteres.', 'erro');
      return;
    }

    setGerando(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          tema: tema.trim(),
          turma,
          quantidade,
          observacao,
          ...(tipo === 'redacao' ? { textoDoAluno } : {}),
        }),
      });
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo.error || 'Falha na geração.');

      setMaterial(corpo.material);
      setMaterialId('');
      setFavorito(false);
      avisarQuotaMudou();
      avisar('Material gerado. Revise antes de usar com a turma.', 'ok');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Algo falhou na geração.', 'erro');
    } finally {
      setGerando(false);
    }
  }

  async function salvar() {
    if (!material) return;
    setSalvando(true);
    try {
      const db = supabaseBrowser();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) throw new Error('Sua sessão expirou. Entre de novo.');

      const dados = {
        owner_id: user.id,
        title: (material.title || tema).slice(0, 180),
        kind: tipo,
        grade: turma,
        topic: tema.trim(),
        content: material as unknown as Record<string, unknown>,
        status: 'ready' as const,
        is_favorite: favorito,
      };

      const resposta = materialId
        ? await db.from('materials').update(dados).eq('id', materialId).select('id').single()
        : await db.from('materials').insert(dados).select('id').single();

      if (resposta.error) throw resposta.error;

      setMaterialId(resposta.data.id);
      avisar('Salvo na sua biblioteca.', 'ok');
      router.refresh();
    } catch (e) {
      avisar(
        e instanceof Error ? e.message : 'Não foi possível salvar o material.',
        'erro',
      );
    } finally {
      setSalvando(false);
    }
  }

  function recomecar() {
    setMaterial(null);
    setMaterialId('');
    setFavorito(false);
  }

  function trocarTitulo(title: string) {
    if (material) setMaterial({ ...material, title } as MaterialGerado);
  }

  return (
    <div className="space-y-6">
      <header className="nao-imprimir">
        <h1 className="text-3xl font-bold tracking-tight">{mod.nome}</h1>
        <p className="mt-2 max-w-[60ch] text-grafite">{mod.resumo}</p>
      </header>

      {/* ---------- Formulário ---------- */}
      {!material && (
        <section className="folha nao-imprimir p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <label className="block text-sm font-medium">
              {mod.rotuloTema}
              <input
                className="campo mt-1.5"
                value={tema}
                maxLength={160}
                autoFocus
                onChange={(e) => setTema(e.target.value)}
                placeholder={mod.exemploTema}
              />
            </label>
            <label className="block text-sm font-medium">
              Turma
              <select
                className="campo mt-1.5"
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
              >
                {ANOS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </div>

          {sugestoes.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-grafite-2">Do catálogo:</span>
              {sugestoes.map((s) => (
                <button
                  key={s}
                  onClick={() => setTema(s)}
                  className="rounded-full border border-linha px-2.5 py-1 text-xs text-tinta-2 transition-colors hover:border-pena hover:text-pena"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {TEM_QUANTIDADE.includes(tipo) && (
            <label className="mt-4 block text-sm font-medium sm:w-56">
              Quantas questões
              <input
                type="number"
                min={3}
                max={20}
                className="campo mt-1.5"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
              />
            </label>
          )}

          {tipo === 'redacao' && (
            <label className="mt-4 block text-sm font-medium">
              Redação do aluno
              <textarea
                rows={10}
                className="campo mt-1.5 font-[inherit] leading-relaxed"
                value={textoDoAluno}
                maxLength={12000}
                onChange={(e) => setTextoDoAluno(e.target.value)}
                placeholder="Cole aqui o texto do aluno, do título à conclusão."
              />
              <span className="mt-1.5 block text-xs font-normal text-grafite-2">
                {textoDoAluno.length} de 12.000 caracteres · o texto não fica salvo até
                você clicar em salvar
              </span>
            </label>
          )}

          <label className="mt-4 block text-sm font-medium">
            Alguma instrução a mais?{' '}
            <span className="font-normal text-grafite-2">(opcional)</span>
            <input
              className="campo mt-1.5"
              value={observacao}
              maxLength={600}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: usar exemplos de letras de música; evitar questões de decorar"
            />
          </label>

          <button onClick={gerar} disabled={gerando} className="botao mt-6 w-full sm:w-auto">
            {gerando ? (
              <Loader2 size={17} className="girando" aria-hidden />
            ) : (
              <Sparkles size={17} aria-hidden />
            )}
            {gerando ? 'Gerando...' : mod.acao}
          </button>

          {gerando && (
            <div className="mt-6 space-y-2.5" aria-hidden>
              <div className="esqueleto h-5 w-2/3" />
              <div className="esqueleto h-4 w-full" />
              <div className="esqueleto h-4 w-5/6" />
              <div className="esqueleto h-4 w-4/6" />
            </div>
          )}
        </section>
      )}

      {/* ---------- Resultado ---------- */}
      {material && (
        <>
          <div className="nao-imprimir flex flex-wrap items-center gap-2">
            <button onClick={salvar} disabled={salvando} className="botao">
              {salvando ? (
                <Loader2 size={16} className="girando" aria-hidden />
              ) : (
                <Save size={16} aria-hidden />
              )}
              {salvando ? 'Salvando...' : materialId ? 'Salvar alterações' : 'Salvar'}
            </button>

            <button onClick={() => window.print()} className="botao-vazio">
              <Printer size={16} aria-hidden />
              Imprimir ou gerar PDF
            </button>

            {TEM_GABARITO.includes(tipo) && (
              <button onClick={() => setGabarito((v) => !v)} className="botao-vazio">
                {gabarito ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                {gabarito ? 'Esconder gabarito' : 'Mostrar gabarito'}
              </button>
            )}

            <button
              onClick={() => setFavorito((v) => !v)}
              aria-pressed={favorito}
              className="botao-vazio"
            >
              <Star
                size={16}
                className={favorito ? 'fill-current text-marca-texto' : ''}
                aria-hidden
              />
              {favorito ? 'Favorito' : 'Favoritar'}
            </button>

            <button onClick={recomecar} className="botao-vazio">
              <RotateCcw size={16} aria-hidden />
              Gerar outro
            </button>
          </div>

          {TEM_GABARITO.includes(tipo) && gabarito && (
            <p className="nao-imprimir rounded-lg bg-papel-3 px-3.5 py-2.5 text-sm text-grafite">
              O gabarito está visível e sairá na impressão. Esconda antes de imprimir para
              a turma.
            </p>
          )}

          <article className="folha p-6 sm:p-9 print:p-0">
            <header className="mb-5 border-b border-linha pb-4">
              <CampoEditavel
                rotulo="Título do material"
                valor={material.title}
                onChange={trocarTitulo}
                className="display text-2xl font-bold"
              />
              <p className="px-1.5 text-sm text-grafite print:px-0">
                Língua Portuguesa · {turma}
              </p>
            </header>

            {tipo === 'atividade' && (
              <VisaoAtividade
                material={material as Atividade}
                setMaterial={(m) => setMaterial(m)}
                gabarito={gabarito}
              />
            )}
            {tipo === 'avaliacao' && (
              <VisaoAvaliacao
                material={material as Avaliacao}
                setMaterial={(m) => setMaterial(m)}
                gabarito={gabarito}
              />
            )}
            {tipo === 'mapa_mental' && (
              <VisaoMapaMental
                material={material as MapaMental}
                setMaterial={(m) => setMaterial(m)}
              />
            )}
            {tipo === 'plano_aula' && <VisaoPlanoAula material={material as PlanoAula} />}
            {tipo === 'redacao' && (
              <VisaoCorrecao material={material as CorrecaoRedacao} />
            )}
            {tipo === 'aula_emergencia' && (
              <VisaoAulaEmergencia
                material={material as AulaEmergencia}
                gabarito={gabarito}
              />
            )}

            <footer className="mt-8 hidden border-t border-linha pt-3 text-xs text-grafite print:block">
              PortuguêsPilot · material gerado e revisado pelo professor
            </footer>
          </article>
        </>
      )}
    </div>
  );
}

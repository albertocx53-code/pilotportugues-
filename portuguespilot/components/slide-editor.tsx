'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  Images,
  Loader2,
  Play,
  Plus,
  Presentation,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import {
  deckValido,
  modeloDeDeck,
  nomeDeArquivo,
  TEMAS,
  type Deck,
  type Slide,
} from '@/lib/slides';
import { SlideCanvas } from '@/components/slide-canvas';
import '@/components/slide-canvas.css';
import { useAviso } from '@/components/ui/toast';
import { avisarQuotaMudou } from '@/components/shell/quota-meter';

type Imagem = { title: string; url: string; source: string; license: string; artist: string };

const novoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `s${Date.now()}${Math.random().toString(16).slice(2)}`;

export default function SlideEditor({
  temaInicial,
  turmaInicial,
  materialId,
}: {
  temaInicial: string;
  turmaInicial: string;
  materialId: string;
}) {
  const [deck, setDeck] = useState<Deck>(() => modeloDeDeck(temaInicial, turmaInicial));
  const [indice, setIndice] = useState(0);
  const [id, setId] = useState(materialId);
  const [carregando, setCarregando] = useState(!!materialId);
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState<'pdf' | 'pptx' | null>(null);
  const [apresentando, setApresentando] = useState(false);
  const [quantidade, setQuantidade] = useState(12);

  const [buscaImagem, setBuscaImagem] = useState('');
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [buscandoImagem, setBuscandoImagem] = useState(false);
  const [painelImagens, setPainelImagens] = useState(false);

  const palcoExportacao = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { avisar } = useAviso();

  const slide = deck.slides[indice] ?? deck.slides[0];

  /* ---------- Carregar material existente ---------- */
  useEffect(() => {
    if (!materialId) return;
    let vivo = true;

    (async () => {
      const { data, error } = await supabaseBrowser()
        .from('materials')
        .select('content,title,grade,topic')
        .eq('id', materialId)
        .maybeSingle();

      if (!vivo) return;

      if (error || !data) {
        avisar('Não encontramos essa apresentação na sua biblioteca.', 'erro');
      } else if (deckValido(data.content)) {
        setDeck(data.content as Deck);
        setIndice(0);
      } else {
        avisar('O arquivo salvo está em um formato que não reconhecemos.', 'erro');
      }
      setCarregando(false);
    })();

    return () => {
      vivo = false;
    };
  }, [materialId, avisar]);

  /* ---------- Edição ---------- */
  const editarSlide = useCallback(
    (patch: Partial<Slide>) => {
      setDeck((d) => ({
        ...d,
        slides: d.slides.map((s, i) => (i === indice ? { ...s, ...patch } : s)),
      }));
    },
    [indice],
  );

  function adicionarSlide() {
    const novo: Slide = {
      id: novoId(),
      title: 'Novo slide',
      body: 'Escreva o conteúdo aqui.',
      notes: '',
      layout: 'split',
    };
    setDeck((d) => ({ ...d, slides: [...d.slides, novo] }));
    setIndice(deck.slides.length);
  }

  function removerSlide() {
    if (deck.slides.length === 1) return;
    setDeck((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== indice) }));
    setIndice((i) => Math.max(0, i - 1));
  }

  function moverSlide(direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= deck.slides.length) return;
    setDeck((d) => {
      const slides = [...d.slides];
      [slides[indice], slides[destino]] = [slides[destino], slides[indice]];
      return { ...d, slides };
    });
    setIndice(destino);
  }

  /* ---------- Gerar com IA ---------- */
  async function gerar() {
    if (deck.topic.trim().length < 3) {
      avisar('Escreva o conteúdo da apresentação antes de gerar.', 'erro');
      return;
    }
    setGerando(true);
    try {
      const res = await fetch('/api/slides/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: deck.topic.trim(),
          turma: deck.grade,
          quantidade,
        }),
      });
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo.error || 'Falha na geração.');
      if (!deckValido(corpo.deck)) throw new Error('A IA devolveu um formato inesperado.');

      setDeck({ ...(corpo.deck as Deck), theme: deck.theme });
      setIndice(0);
      avisarQuotaMudou();
      avisar(`${corpo.deck.slides.length} slides gerados. Revise antes da aula.`, 'ok');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Algo falhou na geração.', 'erro');
    } finally {
      setGerando(false);
    }
  }

  /* ---------- Salvar ---------- */
  async function salvar() {
    setSalvando(true);
    try {
      const db = supabaseBrowser();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user) throw new Error('Sua sessão expirou. Entre de novo.');

      const dados = {
        owner_id: user.id,
        title: (deck.title || deck.topic || 'Apresentação').slice(0, 180),
        kind: 'slides' as const,
        grade: deck.grade,
        topic: deck.topic,
        content: deck as unknown as Record<string, unknown>,
        status: 'ready' as const,
      };

      const resposta = id
        ? await db.from('materials').update(dados).eq('id', id).select('id').single()
        : await db.from('materials').insert(dados).select('id').single();

      if (resposta.error) throw resposta.error;

      setId(resposta.data.id);
      avisar('Apresentação salva.', 'ok');
      router.refresh();
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível salvar.', 'erro');
    } finally {
      setSalvando(false);
    }
  }

  /* ---------- Imagens ---------- */
  async function buscarImagens() {
    const termo = buscaImagem.trim() || slide.title;
    if (termo.length < 3) {
      avisar('Escreva pelo menos 3 letras para buscar.', 'erro');
      return;
    }
    setBuscandoImagem(true);
    try {
      const res = await fetch(`/api/images/search?q=${encodeURIComponent(termo)}`);
      const corpo = await res.json();
      if (!res.ok) throw new Error(corpo.error);
      setImagens(corpo.imagens ?? []);
      if (!corpo.imagens?.length) avisar('Nenhuma imagem para esse termo.', 'info');
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'A busca de imagens falhou.', 'erro');
    } finally {
      setBuscandoImagem(false);
    }
  }

  function escolherImagem(img: Imagem) {
    editarSlide({
      image: img.url,
      credit: `${img.title.replace('File:', '')} — ${img.license}${
        img.artist ? ` — ${img.artist}` : ''
      }`,
      layout: 'split',
    });
    setPainelImagens(false);
    avisar('Imagem aplicada. Confira a licença na página de origem antes de publicar.', 'info');
  }

  function enviarImagem(arquivo?: File) {
    if (!arquivo) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      avisar('Use PNG, JPEG ou WebP.', 'erro');
      return;
    }
    if (arquivo.size > 950_000) {
      avisar('A imagem precisa ter no máximo 950 KB.', 'erro');
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () =>
      editarSlide({ image: String(leitor.result), credit: '', layout: 'split' });
    leitor.readAsDataURL(arquivo);
  }

  /* ---------- Exportar ---------- */
  async function exportar(formato: 'pdf' | 'pptx') {
    setExportando(formato);
    try {
      const { toPng } = await import('html-to-image');
      const palco = palcoExportacao.current;
      if (!palco) throw new Error('Palco de exportação indisponível.');

      const telas = Array.from(palco.querySelectorAll<HTMLElement>('.slide-canvas'));
      if (!telas.length) throw new Error('Nada para exportar.');

      const imagensPng: string[] = [];
      for (const tela of telas) {
        /* Espera as imagens decodificarem, senão saem em branco no PNG. */
        await Promise.all(
          Array.from(tela.querySelectorAll('img')).map((img) =>
            img.decode().catch(() => undefined),
          ),
        );
        imagensPng.push(
          await toPng(tela, { pixelRatio: 2, cacheBust: false, backgroundColor: '#ffffff' }),
        );
      }

      const arquivo = nomeDeArquivo(deck.title || deck.topic);

      if (formato === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: [960, 540],
          compress: true,
        });
        imagensPng.forEach((img, i) => {
          if (i) doc.addPage([960, 540], 'landscape');
          doc.addImage(img, 'PNG', 0, 0, 960, 540);
        });
        doc.save(`${arquivo}.pdf`);
      } else {
        const { default: PptxGenJS } = await import('pptxgenjs');
        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_WIDE';
        pptx.author = 'PortuguêsPilot';
        pptx.title = deck.title;
        imagensPng.forEach((img, i) => {
          const s = pptx.addSlide();
          s.addImage({ data: img, x: 0, y: 0, w: 13.333, h: 7.5 });
          const notas = deck.slides[i]?.notes;
          if (notas) s.addNotes(notas);
        });
        await pptx.writeFile({ fileName: `${arquivo}.pptx` });
      }

      avisar(
        `Exportado em ${formato.toUpperCase()}. O desenho de cada slide vai como imagem, então nada sai do lugar.`,
        'ok',
      );
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'A exportação falhou.', 'erro');
    } finally {
      setExportando(null);
    }
  }

  /* ---------- Teclado na apresentação ---------- */
  useEffect(() => {
    if (!apresentando) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setApresentando(false);
      if (e.key === 'ArrowRight' || e.key === ' ')
        setIndice((i) => Math.min(i + 1, deck.slides.length - 1));
      if (e.key === 'ArrowLeft') setIndice((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [apresentando, deck.slides.length]);

  if (carregando) {
    return (
      <div className="space-y-4">
        <div className="esqueleto h-9 w-64" />
        <div className="esqueleto aspect-video w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ---------- Barra de ações ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Editor de slides
          </h1>
          <p className="mt-1.5 text-sm text-grafite">
            {deck.slides.length} {deck.slides.length === 1 ? 'slide' : 'slides'} · tudo
            editável
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={gerar} disabled={gerando} className="botao">
            {gerando ? (
              <Loader2 size={16} className="girando" aria-hidden />
            ) : (
              <Sparkles size={16} aria-hidden />
            )}
            {gerando ? 'Gerando...' : 'Gerar com IA'}
          </button>
          <button onClick={salvar} disabled={salvando} className="botao-vazio">
            {salvando ? (
              <Loader2 size={16} className="girando" aria-hidden />
            ) : (
              <Save size={16} aria-hidden />
            )}
            Salvar
          </button>
          <button onClick={() => setApresentando(true)} className="botao-vazio">
            <Play size={16} aria-hidden />
            Apresentar
          </button>
          <button
            onClick={() => exportar('pdf')}
            disabled={exportando !== null}
            className="botao-vazio"
          >
            {exportando === 'pdf' ? (
              <Loader2 size={16} className="girando" aria-hidden />
            ) : (
              <FileDown size={16} aria-hidden />
            )}
            PDF
          </button>
          <button
            onClick={() => exportar('pptx')}
            disabled={exportando !== null}
            className="botao-vazio"
          >
            {exportando === 'pptx' ? (
              <Loader2 size={16} className="girando" aria-hidden />
            ) : (
              <Presentation size={16} aria-hidden />
            )}
            PowerPoint
          </button>
        </div>
      </header>

      {/* ---------- Dados da apresentação ---------- */}
      <section className="folha grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-sm font-medium lg:col-span-2">
          Título
          <input
            className="campo mt-1.5"
            value={deck.title}
            maxLength={180}
            onChange={(e) => setDeck({ ...deck, title: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium">
          Conteúdo
          <input
            className="campo mt-1.5"
            value={deck.topic}
            maxLength={160}
            onChange={(e) => setDeck({ ...deck, topic: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium">
          Turma
          <input
            className="campo mt-1.5"
            value={deck.grade}
            maxLength={80}
            onChange={(e) => setDeck({ ...deck, grade: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium">
          Estilo
          <select
            className="campo mt-1.5"
            value={deck.theme ?? 'editorial'}
            onChange={(e) => setDeck({ ...deck, theme: e.target.value as Deck['theme'] })}
          >
            {TEMAS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Slides a gerar
          <input
            type="number"
            min={6}
            max={20}
            className="campo mt-1.5"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
          />
        </label>
      </section>

      {/* ---------- Editor ---------- */}
      <div className="grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
        {/* Lista de slides */}
        <aside className="folha max-h-[34rem] space-y-1.5 overflow-y-auto rolagem-fina p-2.5">
          {deck.slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndice(i)}
              aria-current={i === indice ? 'true' : undefined}
              className={`flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left text-sm transition-colors ${
                i === indice
                  ? 'bg-pena-clara text-pena'
                  : 'text-tinta-2 hover:bg-papel-2'
              }`}
            >
              <span className="mt-px shrink-0 text-xs font-semibold tabular-nums opacity-60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="line-clamp-2 flex-1">{s.title || 'Sem título'}</span>
            </button>
          ))}
          <button onClick={adicionarSlide} className="botao-vazio mt-2 w-full text-sm">
            <Plus size={15} aria-hidden />
            Slide
          </button>
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Prévia */}
          <div className="slide-palco overflow-hidden rounded-folha border border-linha shadow-sm">
            <SlideCanvas
              deck={deck}
              slide={slide}
              numero={indice + 1}
              total={deck.slides.length}
            />
          </div>

          {/* Navegação entre slides */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setIndice((i) => Math.max(0, i - 1))}
              disabled={indice === 0}
              className="botao-vazio"
            >
              <ChevronLeft size={16} aria-hidden />
              Anterior
            </button>
            <span className="text-sm tabular-nums text-grafite">
              {indice + 1} de {deck.slides.length}
            </span>
            <button
              onClick={() => setIndice((i) => Math.min(deck.slides.length - 1, i + 1))}
              disabled={indice === deck.slides.length - 1}
              className="botao-vazio"
            >
              Próximo
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>

          {/* Campos do slide */}
          <section className="folha space-y-4 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                Layout
                <select
                  className="campo mt-1.5"
                  value={slide.layout ?? 'split'}
                  onChange={(e) =>
                    editarSlide({ layout: e.target.value as Slide['layout'] })
                  }
                >
                  <option value="split">Texto e imagem</option>
                  <option value="hero">Abertura</option>
                  <option value="minimal">Só texto</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Cor de destaque
                <input
                  type="color"
                  className="campo mt-1.5 h-[46px] p-1"
                  value={slide.accent ?? '#a12e2c'}
                  onChange={(e) => editarSlide({ accent: e.target.value })}
                />
              </label>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => setPainelImagens((v) => !v)}
                  className="botao-vazio flex-1"
                >
                  <Images size={16} aria-hidden />
                  Imagem
                </button>
              </div>
            </div>

            <label className="block text-sm font-medium">
              Título do slide
              <input
                className="campo mt-1.5"
                value={slide.title}
                maxLength={240}
                onChange={(e) => editarSlide({ title: e.target.value })}
              />
            </label>

            <label className="block text-sm font-medium">
              Texto do slide
              <textarea
                rows={5}
                className="campo mt-1.5 leading-relaxed"
                value={slide.body}
                maxLength={5900}
                onChange={(e) => editarSlide({ body: e.target.value })}
              />
              <span className="mt-1 block text-xs font-normal text-grafite-2">
                Use • para listas e quebras de linha para separar ideias.
              </span>
            </label>

            <label className="block text-sm font-medium">
              Roteiro de fala{' '}
              <span className="font-normal text-grafite-2">(não aparece projetado)</span>
              <textarea
                rows={2}
                className="campo mt-1.5 leading-relaxed"
                value={slide.notes}
                maxLength={3900}
                onChange={(e) => editarSlide({ notes: e.target.value })}
              />
            </label>

            {/* Painel de imagens */}
            {painelImagens && (
              <div className="entrar-aviso space-y-3 rounded-xl border border-linha bg-papel-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Imagem do slide</h3>
                  <button
                    onClick={() => setPainelImagens(false)}
                    aria-label="Fechar painel de imagens"
                    className="text-grafite-2 hover:text-tinta"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    className="campo"
                    value={buscaImagem}
                    onChange={(e) => setBuscaImagem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarImagens()}
                    placeholder={`Buscar na Wikimedia: ${slide.title}`}
                  />
                  <button
                    onClick={buscarImagens}
                    disabled={buscandoImagem}
                    className="botao shrink-0"
                  >
                    {buscandoImagem ? (
                      <Loader2 size={16} className="girando" aria-hidden />
                    ) : (
                      'Buscar'
                    )}
                  </button>
                </div>

                {imagens.length > 0 && (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {imagens.map((img) => (
                      <li key={img.title}>
                        <button
                          onClick={() => escolherImagem(img)}
                          title={`${img.license} — ${img.title.replace('File:', '')}`}
                          className="w-full overflow-hidden rounded-lg border border-linha bg-papel p-1 transition-colors hover:border-pena"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.title.replace('File:', '')}
                            className="aspect-video w-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <label className="block text-sm font-medium">
                  Ou envie do computador{' '}
                  <span className="font-normal text-grafite-2">
                    (PNG, JPG ou WebP, até 950 KB)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="campo mt-1.5 text-sm"
                    onChange={(e) => enviarImagem(e.target.files?.[0])}
                  />
                </label>

                <p className="text-xs leading-relaxed text-grafite">
                  As imagens da Wikimedia têm licença própria. Confira os créditos na
                  página de origem antes de publicar o material fora da sala.
                </p>

                {slide.image && (
                  <button
                    onClick={() => editarSlide({ image: '', credit: '' })}
                    className="text-sm font-medium text-correcao hover:underline"
                  >
                    Remover a imagem deste slide
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linha pt-4">
              <div className="flex gap-2">
                <button
                  onClick={() => moverSlide(-1)}
                  disabled={indice === 0}
                  className="botao-vazio text-sm"
                >
                  Subir
                </button>
                <button
                  onClick={() => moverSlide(1)}
                  disabled={indice === deck.slides.length - 1}
                  className="botao-vazio text-sm"
                >
                  Descer
                </button>
              </div>
              <button
                onClick={removerSlide}
                disabled={deck.slides.length === 1}
                className="flex items-center gap-2 text-sm font-medium text-correcao hover:underline disabled:opacity-40 disabled:hover:no-underline"
              >
                <Trash2 size={15} aria-hidden />
                Excluir slide
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* ---------- Palco oculto da exportação (1280px fixos) ---------- */}
      <div
        ref={palcoExportacao}
        aria-hidden
        style={{
          position: 'fixed',
          left: '-20000px',
          top: 0,
          width: '1280px',
          pointerEvents: 'none',
        }}
      >
        {deck.slides.map((s, i) => (
          <div key={s.id} className="slide-palco" style={{ width: '1280px' }}>
            <SlideCanvas
              deck={deck}
              slide={s}
              numero={i + 1}
              total={deck.slides.length}
            />
          </div>
        ))}
      </div>

      {/* ---------- Apresentação ---------- */}
      {apresentando && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Modo apresentação"
          className="fixed inset-0 z-[80] flex flex-col bg-[#07090f]"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm text-white/70">
            <span className="truncate">{deck.title}</span>
            <button
              onClick={() => setApresentando(false)}
              className="flex items-center gap-1.5 hover:text-white"
            >
              <X size={16} aria-hidden />
              Fechar
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center px-2">
            <div className="slide-palco slide-apresentando overflow-hidden shadow-2xl">
              <SlideCanvas
                deck={deck}
                slide={slide}
                numero={indice + 1}
                total={deck.slides.length}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 px-5 py-3 text-white/70">
            <button
              onClick={() => setIndice((i) => Math.max(0, i - 1))}
              disabled={indice === 0}
              className="flex items-center gap-1.5 text-sm hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={18} aria-hidden />
              Anterior
            </button>
            <span className="text-sm tabular-nums">
              {indice + 1} / {deck.slides.length}
            </span>
            <button
              onClick={() => setIndice((i) => Math.min(deck.slides.length - 1, i + 1))}
              disabled={indice === deck.slides.length - 1}
              className="flex items-center gap-1.5 text-sm hover:text-white disabled:opacity-30"
            >
              Próximo
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>

          {slide.notes && (
            <p className="max-h-24 overflow-y-auto border-t border-white/10 px-5 py-3 text-sm leading-relaxed text-white/60">
              {slide.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

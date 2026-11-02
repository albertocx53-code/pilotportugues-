"use client";
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabaseBrowser} from '@/lib/supabase/browser';
import {Deck,Slide,templateDeck,validDeck} from '@/lib/slides';
import {SlideCanvas} from '@/components/slide-canvas';
import '@/components/slide-canvas.css';
const uid=()=>crypto.randomUUID();
const filename=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').slice(0,50);
export default function SlideEditor({topic,materialId}:{topic:string;materialId:string}){
 const [imageResults,setImageResults]=useState<Array<{title:string;url:string;source:string;license:string}>>([]);const [imageSearch,setImageSearch]=useState('');const [deck,setDeck]=useState<Deck>(()=>templateDeck(topic,'8º ano'));const [index,setIndex]=useState(0);const [present,setPresent]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const router=useRouter();const preview=useRef<HTMLDivElement>(null);const exportStage=useRef<HTMLDivElement>(null);const slide=deck.slides[index]||deck.slides[0];
 useEffect(()=>{if(!materialId)return;let active=true;(async()=>{const {data,error}=await supabaseBrowser().from('materials').select('content').eq('id',materialId).eq('kind','slides').single();if(active){if(error)setMessage(error.message);else if(validDeck(data.content)){setDeck(data.content);setIndex(0)}}})();return()=>{active=false}},[materialId]);
 function editSlide(patch:Partial<Slide>){setDeck(d=>({...d,slides:d.slides.map((s,i)=>i===index?{...s,...patch}:s)}))}
 async function save(){setBusy(true);setMessage('');try{const db=supabaseBrowser();const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Faça login para salvar.');const payload={owner_id:user.id,title:deck.title,kind:'slides',grade:deck.grade,topic:deck.topic,content:deck,status:'draft'};const res=materialId?await db.from('materials').update(payload).eq('id',materialId).select('id').single():await db.from('materials').insert(payload).select('id').single();if(res.error)throw res.error;setMessage('Apresentação salva.');if(!materialId)router.replace('/dashboard/slides/editor?id='+res.data.id)}catch(e){setMessage(e instanceof Error?e.message:'Erro ao salvar')}finally{setBusy(false)}}
 async function generate(){setBusy(true);setMessage('');try{const res=await fetch('/api/slides/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:deck.topic,grade:deck.grade})});const j=await res.json();if(!res.ok)throw Error(j.error||'Falha na geração');if(!validDeck(j.deck))throw Error('Resposta inválida da IA');setDeck({...j.deck,theme:deck.theme});setIndex(0);setMessage('Slides gerados. Revise o conteúdo antes de utilizar em aula.')}catch(e){setMessage(e instanceof Error?e.message:'Falha na IA')}finally{setBusy(false)}}
 async function findImage(){setBusy(true);try{const r=await fetch('/api/images/search?q='+encodeURIComponent(imageSearch||slide.title));const j=await r.json();if(!r.ok)throw Error(j.error);setImageResults(j.images||[])}catch(e){setMessage(e instanceof Error?e.message:'Busca indisponível')}finally{setBusy(false)}}
 async function upload(file?:File){if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setMessage('Use PNG, JPEG ou WebP.');return}if(file.size>950000){setMessage('A imagem deve ter no máximo 950 KB nesta versão.');return}const reader=new FileReader();reader.onload=()=>editSlide({image:String(reader.result)});reader.readAsDataURL(file)}
 
async function exportDeck(kind: "pdf" | "pptx") {
  setBusy(true);
  setMessage("Renderizando apresentação...");

  try {
    const { toPng } = await import("html-to-image");
    const node = exportStage.current;

    if (!node) {
      throw new Error("Prévia indisponível");
    }

    const images: string[] = [];
    const canvases = Array.from(
      node.querySelectorAll<HTMLElement>(".slide-canvas")
    );

    for (const canvas of canvases) {
      const elements = Array.from(canvas.querySelectorAll("img"));

      await Promise.all(
        elements.map((img) => img.decode().catch(() => {}))
      );

      const image = await toPng(canvas, {
        pixelRatio: 1,
        cacheBust: false,
        backgroundColor: "#ffffff",
      });

      images.push(image);
    }

    if (kind === "pdf") {
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [338.67, 190.5],
        compress: true,
      });

      images.forEach((img, i) => {
        if (i > 0) doc.addPage();
        doc.addImage(img, "PNG", 0, 0, 338.67, 190.5);
      });

      doc.save(filename(deck.title) + ".pdf");
    } else {
      const { default: PptxGenJS } = await import("pptxgenjs");
      const pptx = new PptxGenJS();

      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "AulaPilot Português";

      images.forEach((img) => {
        const slide = pptx.addSlide();

        slide.addImage({
          data: img,
          x: 0,
          y: 0,
          w: 13.333333,
          h: 7.5,
        });
      });

      await pptx.writeFile({
        fileName: filename(deck.title) + ".pptx",
      });
    }

    setMessage("Exportação concluída!");
  } catch (error) {
    setMessage(
      error instanceof Error ? error.message : "Falha ao exportar"
    );
  } finally {
    setBusy(false);
  }
}

  useEffect(() => {
    if (!present) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresent(false);
      if (e.key === "ArrowRight")
        setIndex(i => Math.min(i + 1, deck.slides.length - 1));
      if (e.key === "ArrowLeft")
        setIndex(i => Math.max(i - 1, 0));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, deck.slides.length]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Estúdio de Slides</h1>

      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={busy}>Salvar</button>
        <button onClick={generate} disabled={busy}>Gerar com IA</button>
        <button onClick={() => setPresent(true)}>Apresentar</button>
        <button onClick={() => exportDeck("pdf")} disabled={busy}>PDF</button>
        <button onClick={() => exportDeck("pptx")} disabled={busy}>PowerPoint</button>
      </div>

      {message && <p role="status">{message}</p>}

      <input
        value={deck.title}
        onChange={e => setDeck(d => ({ ...d, title: e.target.value }))}
        placeholder="Título da apresentação"
      />

      <input
        value={deck.topic}
        onChange={e => setDeck(d => ({ ...d, topic: e.target.value }))}
        placeholder="Tema"
      />

      <input
        value={deck.grade}
        onChange={e => setDeck(d => ({ ...d, grade: e.target.value }))}
        placeholder="Série"
      />

      <div className="flex flex-wrap gap-2">
        {deck.slides.map((item, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={i === index ? "font-bold" : ""}
          >
            Slide {i + 1}
          </button>
        ))}
      </div>

      {slide && (
        <div className="space-y-3">
          <input
            value={slide.title}
            onChange={e => editSlide({ title: e.target.value })}
            placeholder="Título do slide"
          />

          <textarea
            value={slide.body}
            onChange={e => editSlide({ body: e.target.value })}
            placeholder="Conteúdo do slide"
            className="w-full rounded border p-3"
          />

          <div ref={preview}>
           <SlideCanvas
  slide={slide}
  deck={deck}
  number={index + 1}
  total={deck.slides.length}
/>
          </div>
        </div>
      )}

      <div
        ref={exportStage}
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: 1280,
          pointerEvents: "none"
        }}
      >
 {deck.slides.map((item, i) => (
  <SlideCanvas
    key={i}
    slide={item}
    deck={deck}
    number={i + 1}
    total={deck.slides.length}
  />
))}
      </div>

      {present && slide && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-4">
          <div className="w-full max-w-6xl">
            <SlideCanvas
  slide={slide}
  deck={deck}
  number={index + 1}
  total={deck.slides.length}
  large
/>
          </div>

          <div className="mt-4 flex gap-4 text-white">
            <button onClick={() => setIndex(i => Math.max(i - 1, 0))}>
              Anterior
            </button>
            <span>{index + 1} / {deck.slides.length}</span>
            <button onClick={() => setIndex(i => Math.min(i + 1, deck.slides.length - 1))}>
              Próximo
            </button>
            <button onClick={() => setPresent(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

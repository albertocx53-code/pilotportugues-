'use client';

import { forwardRef } from 'react';
import type { Deck, Slide } from '@/lib/slides';

const DESTAQUE_PADRAO: Record<string, string> = {
  editorial: '#a12e2c',
  moderno: '#2e4bc6',
  quadro: '#8fd3b4',
};

export const SlideCanvas = forwardRef<
  HTMLDivElement,
  { slide: Slide; deck: Deck; numero: number; total: number }
>(function SlideCanvas({ slide, deck, numero, total }, ref) {
  const tema = deck.theme ?? 'editorial';
  const destaque = slide.accent || DESTAQUE_PADRAO[tema];
  const layout = slide.layout || 'split';
  /* Só o layout "split" tem segunda coluna: nela entra a imagem ou o enfeite. */
  const temSegundaColuna = layout === 'split';
  const comImagem = temSegundaColuna && !!slide.image;

  return (
    <div
      ref={ref}
      className={`slide-canvas slide-${tema}`}
      style={{ '--slide-destaque': destaque } as React.CSSProperties}
    >
      <div className="slide-topo">
        <span>{deck.title || 'Língua Portuguesa'}</span>
        <span>{deck.grade}</span>
      </div>

      <div className={`slide-corpo layout-${layout}`}>
        <div className="slide-texto">
          <p className="slide-numero">{String(numero).padStart(2, '0')}</p>
          <h2 className="slide-titulo">{slide.title}</h2>
          <div className="slide-tracinho" />
          <p className="slide-paragrafo">{slide.body}</p>
        </div>

        {comImagem && (
          <div className="slide-imagem">
            {/* A imagem vem do nosso proxy ou do arquivo do professor. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image} alt={slide.credit || 'Imagem do slide'} />
            {slide.credit && <p className="slide-credito">{slide.credit}</p>}
          </div>
        )}

        {temSegundaColuna && !comImagem && (
          <div className="slide-enfeite" aria-hidden>
            <span className="slide-enfeite-sinal">ã</span>
            <span>{deck.topic}</span>
          </div>
        )}
      </div>

      <div className="slide-rodape">
        <span>PortuguêsPilot</span>
        <span>
          {String(numero).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
});

"use client";
import {forwardRef} from 'react';
import type {Deck,Slide} from '@/lib/slides';
export const SlideCanvas=forwardRef<HTMLDivElement,{slide:Slide;deck:Deck;number:number;total:number;large?:boolean}>(function SlideCanvas({slide,deck,number,total,large},ref){
 const editorial=deck.theme!=='modern';const accent=slide.accent|| (editorial?'#a12e2c':'#5145df');const layout=slide.layout||'split';
 return <div ref={ref} className={'slide-canvas '+(editorial?'slide-editorial':'slide-modern')} style={{'--slide-accent':accent} as React.CSSProperties}>
  <div className="slide-topline"><strong>{editorial?'JORNAL DE PORTUGUÊS':'AULAPILOT • PORTUGUÊS'}</strong><span>{deck.grade} · {deck.topic}</span></div>
  <div className={'slide-main layout-'+layout}>
    <div className="slide-copy"><div className="slide-kicker">{editorial?'CADERNO PEDAGÓGICO':'APRENDIZAGEM EM FOCO'} <span> / {String(number).padStart(2,'0')}</span></div><h2>{slide.title}</h2><div className="slide-rule"/><p>{slide.body}</p></div>
    {slide.image?<div className="slide-picture"><img alt="Ilustração selecionada pelo professor" src={slide.image}/><div className="slide-picture-label">{editorial?'ILUSTRAÇÃO DIDÁTICA':'MATERIAL VISUAL'}</div></div>:<div className="slide-visual"><div className="slide-visual-symbol">{editorial?'Aa':'✦'}</div><span>{deck.topic}</span></div>}
  </div>
  <div className="slide-footer"><span>© AulaPilot Português · Material editável</span><span>{String(number).padStart(2,'0')} / {String(total).padStart(2,'0')}</span></div>
 </div>
});

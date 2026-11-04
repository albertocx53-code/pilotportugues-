'use client';

import { useEffect, useRef } from 'react';

/**
 * Campo que o professor edita no próprio lugar onde o material será impresso.
 *
 * Na tela é um textarea que cresce com o conteúdo. Na impressão, o textarea
 * sai e entra um parágrafo com o mesmo texto: a altura do textarea é calculada
 * na largura da tela e, ao estreitar para o papel, o conteúdo seria cortado no
 * meio da frase.
 */
export function CampoEditavel({
  valor,
  onChange,
  rotulo,
  className = '',
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  rotulo: string;
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [valor]);

  return (
    <>
      <textarea
        ref={ref}
        rows={1}
        aria-label={rotulo}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`nao-imprimir w-full resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-1.5 py-1 leading-relaxed transition-colors hover:border-linha focus:border-pena focus:bg-papel focus:outline-none ${className}`}
      />
      <p className={`somente-impressao whitespace-pre-wrap leading-relaxed ${className}`}>
        {valor}
      </p>
    </>
  );
}

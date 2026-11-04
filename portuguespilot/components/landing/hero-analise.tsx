import './hero.css';

/**
 * A frase do herói. Cada trecho recebe sua função sintática e um atraso, de
 * modo que a análise aconteça na ordem em que o professor faria no quadro.
 */
export function HeroAnalise() {
  return (
    <p className="analise" aria-label="O tempo, velho professor, corrige todos os cadernos.">
      <span
        className="analise-trecho"
        style={{ '--cor-marca': 'var(--color-pena)', '--atraso': '0.5s' } as React.CSSProperties}
      >
        O tempo
        <span className="analise-rotulo">sujeito</span>
      </span>
      <span aria-hidden>, </span>
      <span
        className="analise-trecho"
        style={{ '--cor-marca': 'var(--color-giz)', '--atraso': '1.1s' } as React.CSSProperties}
      >
        velho professor
        <span className="analise-rotulo">aposto</span>
      </span>
      <span aria-hidden>, </span>
      <span
        className="analise-marcado"
        style={{ '--atraso': '1.75s' } as React.CSSProperties}
      >
        corrige todos os cadernos
      </span>
      <span aria-hidden>.</span>{' '}
      <span className="analise-cursor" aria-hidden />
    </p>
  );
}

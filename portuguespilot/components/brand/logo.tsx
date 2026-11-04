/**
 * Marca do PortuguêsPilot.
 *
 * O sinal gráfico é o til — o diacrítico que mais marca a escrita do
 * português e que nenhum outro produto de educação usa como símbolo.
 */
export function Marca({
  tamanho = 'md',
  mostrarNome = true,
}: {
  tamanho?: 'sm' | 'md' | 'lg';
  mostrarNome?: boolean;
}) {
  const caixa = { sm: 24, md: 30, lg: 40 }[tamanho];
  const texto = { sm: 'text-[15px]', md: 'text-[17px]', lg: 'text-2xl' }[tamanho];

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid shrink-0 place-items-center rounded-[9px] bg-pena text-white"
        style={{ width: caixa, height: caixa }}
      >
        <svg
          width={caixa * 0.62}
          height={caixa * 0.62}
          viewBox="0 0 24 24"
          fill="none"
          className="dark:text-[#0c1120] text-white"
        >
          {/* til */}
          <path
            d="M3.5 8.6c1.6-2.9 3.5-3 5.4-1.2 1.9 1.8 3.8 1.7 5.4-1.2"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* haste do "a" estilizada */}
          <path
            d="M6.4 18.4h11.2"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity=".55"
          />
          <path
            d="M9.6 13.6h8"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {mostrarNome && (
        <span className={`display font-bold tracking-tight ${texto}`}>
          Português<span className="text-pena">Pilot</span>
        </span>
      )}
    </span>
  );
}

import {
  Presentation,
  FileText,
  ClipboardCheck,
  Network,
  CalendarDays,
  SpellCheck,
  Zap,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';

const MAPA: Record<string, LucideIcon> = {
  Presentation,
  FileText,
  ClipboardCheck,
  Network,
  CalendarDays,
  SpellCheck,
  Zap,
  Newspaper,
};

/** Resolve o nome de ícone declarado em lib/modules.ts. */
export function Icone({
  nome,
  size = 20,
  className,
}: {
  nome: string;
  size?: number;
  className?: string;
}) {
  const Componente = MAPA[nome] ?? FileText;
  return <Componente size={size} className={className} aria-hidden />;
}

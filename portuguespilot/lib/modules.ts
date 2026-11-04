/**
 * Registro único dos módulos pedagógicos.
 *
 * Tudo que mostra ou valida um tipo de material lê daqui: a navegação, o
 * compositor do painel, a biblioteca, a rota de geração e os limites de plano.
 * Para acrescentar um módulo novo, inclua uma entrada nesta lista — nenhuma
 * tela precisa ser alterada.
 */

export const TIPOS = [
  'slides',
  'atividade',
  'avaliacao',
  'mapa_mental',
  'plano_aula',
  'redacao',
  'aula_emergencia',
  'jornal',
] as const;

export type Tipo = (typeof TIPOS)[number];

export type Modulo = {
  tipo: Tipo;
  nome: string;
  /** Uma linha, em linguagem de professor, sobre o que sai daqui. */
  resumo: string;
  rota: string;
  /** Nome do ícone em lucide-react, resolvido em components/shell/icone.tsx */
  icone: string;
  /** Aparece no compositor do painel e no hub "Criar". */
  destaque: boolean;
  /** O que o professor digita no campo principal. */
  rotuloTema: string;
  exemploTema: string;
  /** Verbo do botão de geração. */
  acao: string;
};

export const MODULOS: Modulo[] = [
  {
    tipo: 'slides',
    nome: 'Slides',
    resumo: 'Apresentação pronta para projetar, exportar em PDF ou PowerPoint.',
    rota: '/dashboard/slides',
    icone: 'Presentation',
    destaque: true,
    rotuloTema: 'Tema da aula',
    exemploTema: 'Figuras de linguagem',
    acao: 'Montar slides',
  },
  {
    tipo: 'atividade',
    nome: 'Atividade',
    resumo: 'Lista de exercícios com gabarito e explicação de cada resposta.',
    rota: '/dashboard/atividades',
    icone: 'FileText',
    destaque: true,
    rotuloTema: 'Conteúdo da atividade',
    exemploTema: 'Orações subordinadas adverbiais',
    acao: 'Gerar atividade',
  },
  {
    tipo: 'avaliacao',
    nome: 'Avaliação',
    resumo: 'Prova com pontuação, versão do aluno e versão do professor.',
    rota: '/dashboard/avaliacoes',
    icone: 'ClipboardCheck',
    destaque: true,
    rotuloTema: 'Conteúdo da prova',
    exemploTema: 'Romantismo no Brasil',
    acao: 'Gerar avaliação',
  },
  {
    tipo: 'mapa_mental',
    nome: 'Mapa mental',
    resumo: 'Conteúdo aberto em ramos e palavras-chave para revisão.',
    rota: '/dashboard/mapas',
    icone: 'Network',
    destaque: true,
    rotuloTema: 'Conceito central',
    exemploTema: 'Classes gramaticais',
    acao: 'Gerar mapa',
  },
  {
    tipo: 'plano_aula',
    nome: 'Plano de aula',
    resumo: 'Objetivos, metodologia, recursos e avaliação em uma página.',
    rota: '/dashboard/planos-de-aula',
    icone: 'CalendarDays',
    destaque: true,
    rotuloTema: 'Tema do plano',
    exemploTema: 'Gêneros textuais: a crônica',
    acao: 'Gerar plano',
  },
  {
    tipo: 'redacao',
    nome: 'Correção de redação',
    resumo: 'Você cola o texto do aluno e recebe análise por competências.',
    rota: '/dashboard/redacao',
    icone: 'SpellCheck',
    destaque: true,
    rotuloTema: 'Tema proposto na redação',
    exemploTema: 'Os desafios da leitura no Brasil',
    acao: 'Corrigir redação',
  },
  {
    tipo: 'aula_emergencia',
    nome: 'Aula de emergência',
    resumo: 'Uma aula inteira para assumir turma de última hora, sem preparo.',
    rota: '/dashboard/emergencia',
    icone: 'Zap',
    destaque: true,
    rotuloTema: 'Turma ou conteúdo disponível',
    exemploTema: 'Interpretação de texto',
    acao: 'Montar aula agora',
  },
  {
    tipo: 'jornal',
    nome: 'Jornal pedagógico',
    resumo: 'Material em formato de jornal, criado no editor de slides.',
    rota: '/dashboard/slides',
    icone: 'Newspaper',
    destaque: false,
    rotuloTema: 'Tema do jornal',
    exemploTema: 'Produção textual da turma',
    acao: 'Abrir editor',
  },
];

const porTipo = new Map<Tipo, Modulo>(MODULOS.map((m) => [m.tipo, m]));

export function modulo(tipo: string): Modulo | undefined {
  return porTipo.get(tipo as Tipo);
}

export function nomeDoTipo(tipo: string): string {
  return porTipo.get(tipo as Tipo)?.nome ?? tipo;
}

export function ehTipo(valor: unknown): valor is Tipo {
  return typeof valor === 'string' && porTipo.has(valor as Tipo);
}

/** Módulos gerados pela rota única de IA (slides têm rota própria). */
export const TIPOS_DE_TEXTO = [
  'atividade',
  'avaliacao',
  'mapa_mental',
  'plano_aula',
  'redacao',
  'aula_emergencia',
] as const;

export type TipoDeTexto = (typeof TIPOS_DE_TEXTO)[number];

export function ehTipoDeTexto(valor: unknown): valor is TipoDeTexto {
  return (
    typeof valor === 'string' && (TIPOS_DE_TEXTO as readonly string[]).includes(valor)
  );
}

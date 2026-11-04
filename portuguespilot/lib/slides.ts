export type Layout = 'split' | 'hero' | 'minimal';
export type Tema = 'editorial' | 'moderno' | 'quadro';

export type Slide = {
  id: string;
  title: string;
  body: string;
  notes: string;
  image?: string;
  credit?: string;
  layout?: Layout;
  accent?: string;
};

export type Deck = {
  title: string;
  topic: string;
  grade: string;
  theme?: Tema;
  slides: Slide[];
};

export const TEMAS: { id: Tema; nome: string; descricao: string }[] = [
  { id: 'editorial', nome: 'Editorial', descricao: 'Serifado, ar de jornal impresso' },
  { id: 'moderno', nome: 'Moderno', descricao: 'Limpo, bom para projetor fraco' },
  { id: 'quadro', nome: 'Quadro-negro', descricao: 'Fundo escuro, giz claro' },
];

const LIMITE_IMAGEM = 1_400_000;

/**
 * Imagens aceitas em um slide: base64 enviada pelo professor, URL https, ou o
 * caminho do nosso proxy autenticado da Wikimedia. Esse terceiro caso é o que
 * faltava na versão anterior — sem ele, todo deck com imagem da Wikimedia era
 * recusado ao ser reaberto da biblioteca.
 */
function imagemValida(valor: unknown): boolean {
  if (typeof valor !== 'string') return false;
  if (valor === '') return true;
  if (valor.length > LIMITE_IMAGEM) return false;
  return (
    /^data:image\/(png|jpeg|webp);base64,/.test(valor) ||
    /^https:\/\//.test(valor) ||
    valor.startsWith('/api/images/file?')
  );
}

export function modeloDeDeck(tema: string, turma: string): Deck {
  return {
    title: tema,
    topic: tema,
    grade: turma,
    theme: 'editorial',
    slides: [
      {
        id: 's1',
        title: tema,
        body: `Língua Portuguesa · ${turma}`,
        notes: 'Apresente o tema e levante o que a turma já sabe.',
        layout: 'hero',
      },
      {
        id: 's2',
        title: 'Onde queremos chegar',
        body: `• Entender o que é ${tema}\n• Reconhecer em textos reais\n• Usar na própria escrita`,
        notes: 'Ajuste os objetivos ao tempo que você tem.',
        layout: 'minimal',
      },
      {
        id: 's3',
        title: 'Para começar',
        body: `O que você já ouviu sobre ${tema}?\n\nEscreva duas hipóteses no caderno e compare com um colega.`,
        notes: 'Diagnóstico rápido, 5 minutos.',
        layout: 'split',
      },
      {
        id: 's4',
        title: 'O conteúdo',
        body: `Escreva aqui a explicação de ${tema}.\n\nUse o botão de gerar com IA para preencher este slide e revise antes da aula.`,
        notes: 'Este é um modelo editável, não uma aula revisada.',
        layout: 'split',
      },
      {
        id: 's5',
        title: 'Agora com a turma',
        body: `Encontre ${tema} em um texto que vocês escolherem.\n\nExplique por que aquele trecho é um exemplo.`,
        notes: 'Escolha um texto da faixa etária da turma.',
        layout: 'split',
      },
      {
        id: 's6',
        title: 'Fechamento',
        body: '• O que ficou claro?\n• O que ainda está confuso?\n• Onde isso aparece fora da escola?',
        notes: 'Retome as dúvidas na próxima aula.',
        layout: 'minimal',
      },
    ],
  };
}

export function deckValido(v: unknown): v is Deck {
  if (!v || typeof v !== 'object') return false;
  const d = v as Deck;
  if (typeof d.title !== 'string' || d.title.length > 250) return false;
  if (typeof d.topic !== 'string' || d.topic.length > 250) return false;
  if (typeof d.grade !== 'string' || d.grade.length > 120) return false;
  if (d.theme && !['editorial', 'moderno', 'quadro'].includes(d.theme)) return false;
  if (!Array.isArray(d.slides) || d.slides.length < 1 || d.slides.length > 40) return false;

  return d.slides.every(
    (s) =>
      s &&
      typeof s.id === 'string' &&
      typeof s.title === 'string' &&
      s.title.length < 250 &&
      typeof s.body === 'string' &&
      s.body.length < 6000 &&
      typeof s.notes === 'string' &&
      s.notes.length < 4000 &&
      (s.image === undefined || imagemValida(s.image)) &&
      (s.credit === undefined ||
        (typeof s.credit === 'string' && s.credit.length < 600)) &&
      (s.layout === undefined || ['split', 'hero', 'minimal'].includes(s.layout)) &&
      (s.accent === undefined || /^#[0-9a-fA-F]{6}$/.test(s.accent)),
  );
}

export function nomeDeArquivo(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .toLowerCase() || 'apresentacao'
  );
}

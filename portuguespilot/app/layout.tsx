import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ProvedorDeAvisos } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: {
    default: 'PortuguêsPilot — material de Língua Portuguesa em minutos',
    template: '%s · PortuguêsPilot',
  },
  description:
    'Slides, atividades, provas, planos de aula, mapas mentais e correção de redação para professores de Língua Portuguesa. Você dá o tema, o material sai pronto para editar.',
  applicationName: 'PortuguêsPilot',
  openGraph: {
    title: 'PortuguêsPilot',
    description:
      'O estúdio de materiais do professor de Língua Portuguesa. Sete módulos, um tema, material pronto para a próxima aula.',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c1120' },
  ],
};

/**
 * Aplica o tema antes da primeira pintura para não piscar branco em quem
 * usa modo escuro. A preferência do perfil é gravada aqui pelo painel.
 */
const SCRIPT_DE_TEMA = `
(function(){try{
  var t=localStorage.getItem('pp-tema')||'system';
  var escuro = t==='dark' || (t==='system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', escuro);
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DE_TEMA }} />
      </head>
      <body>
        <ProvedorDeAvisos>{children}</ProvedorDeAvisos>
      </body>
    </html>
  );
}

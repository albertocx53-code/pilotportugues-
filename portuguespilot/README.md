# PortuguêsPilot

Estúdio de materiais para professores de Língua Portuguesa. O professor escreve
um tema, escolhe o formato e recebe o material montado, editável, pronto para
imprimir, projetar ou exportar.

Cada professor administra a própria conta. Não há diário de classe, notas de
aluno nem painel de direção.

---

## Os sete módulos

| Módulo | O que sai |
|---|---|
| Slides | Apresentação em 16:9, três estilos, exportação em PDF e PowerPoint |
| Atividade | Lista de exercícios com gabarito e explicação de cada resposta |
| Avaliação | Prova com pontuação por questão, objetivas e discursivas, gabarito separável |
| Mapa mental | Conceito central aberto em ramos e palavras-chave |
| Plano de aula | Objetivos, habilidades, recursos, etapas cronometradas e avaliação |
| Correção de redação | Análise pelas cinco competências do ENEM, trechos comentados e nota sugerida |
| Aula de emergência | Aula inteira para assumir turma de última hora, incluindo o que copiar no quadro |

Mais o catálogo de 200 conteúdos de Língua Portuguesa, divididos em 10 áreas, e
a biblioteca de materiais salvos com busca, favoritos, duplicação e exclusão.

---

## Rodar o projeto

```bash
npm install
cp .env.example .env.local   # preencha as chaves (veja abaixo)
npm run dev                  # http://localhost:3000
```

Antes de publicar:

```bash
npm run typecheck
npm run build
```

### Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | Endereço do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sim | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | quase | Webhook do Stripe e devolução de quota quando a IA falha. **Nunca** com prefixo `NEXT_PUBLIC_` |
| `OPENAI_API_KEY` | sim, para gerar | Chave do provedor de IA |
| `OPENAI_MODEL` | não | Padrão `gpt-4o-mini` |
| `OPENAI_BASE_URL` | não | Troca o provedor por qualquer um compatível com a API da OpenAI (Azure, OpenRouter, modelo local) |
| `STRIPE_SECRET_KEY` | não | Sem ela, todas as contas ficam no plano gratuito |
| `STRIPE_WEBHOOK_SECRET` | não | Obrigatória se usar Stripe |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ESCOLA` | não | IDs de preço (price ID) de cada plano |

### Banco de dados

As migrações estão em `supabase/migrations/`, em ordem. Aplique todas, da
primeira à última, em um projeto Supabase **novo**.

### Stripe

1. Crie dois produtos recorrentes (Professor e Escola) e copie os price IDs.
2. Aponte um webhook para `https://SEU_DOMINIO/api/stripe/webhook`.
3. Assine os eventos: `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`.
4. Copie o signing secret para `STRIPE_WEBHOOK_SECRET`.

---

## Decisões de segurança

- **Row Level Security em todas as tabelas.** Nenhuma consulta enxerga material
  de outra conta, mesmo que alguém use a chave pública direto na API.
- **O plano não pode ser alterado pelo navegador.** A política `profiles_update`
  deixa o professor editar o próprio perfil, então um gatilho
  (`profiles_guard_billing`) devolve os valores antigos de `plan`,
  `plan_status` e das colunas do Stripe sempre que a alteração não vier da
  service role. Sem isso, qualquer pessoa logada passaria de 15 para 500
  gerações por dia com uma linha de JavaScript.
- **O limite diário é contado no banco, de forma atômica**, num `insert ... on
  conflict ... where used < limite`. Abrir várias abas não fura o limite.
- **Devolução de quota.** Se o provedor de IA falhar depois de a quota ter sido
  consumida, o servidor devolve a geração via `refund_generation_quota`, que só
  aceita chamada da service role — se o navegador pudesse chamar, bastaria
  repetir para zerar o contador.
- **Proxy de imagens.** `/api/images/file` só serve arquivos que a própria API
  da Wikimedia indicar, apenas do host `upload.wikimedia.org` e com tipo de
  imagem conhecido, para o parâmetro `title` não virar SSRF.
- **CSP sem `unsafe-eval` em produção** e com a origem do Supabase tirada da
  variável de ambiente, em vez de um curinga.
- **As chaves de IA e do Stripe nunca chegam ao navegador.** Toda geração passa
  pelas rotas de API.

Segurança absoluta não existe. Antes de abrir ao público: rate limiting na
borda, proteção contra cadastro automatizado, verificação de e-mail obrigatória
e auditoria das dependências.

---

## O que o sistema não faz

- **Não substitui a revisão do professor.** O texto vem de um modelo de
  linguagem e pode errar, principalmente em gabaritos.
- **Não gera imagens.** Busca fotos e ilustrações com licença na Wikimedia
  Commons. Confira os créditos na página de origem antes de publicar.
- **Não cita códigos da BNCC.** As habilidades vêm descritas em palavras, de
  propósito: código citado por engano atrapalha mais do que ajuda.
- **O mapa mental é um conjunto de cartões**, não um grafo que se arrasta.
- **A exportação de slides vira imagem** em cada página do PDF ou do PPTX. O
  desenho fica fiel, mas o texto não é selecionável no arquivo final.
- **O plano de aula e a correção de redação** são exibidos para leitura e
  impressão; a edição em tela cobre o título. Os demais módulos permitem editar
  enunciados e ramos diretamente.

---

## Como o código está organizado

```
app/
  page.tsx                 landing
  login, cadastro, recuperar-senha, redefinir-senha, onboarding
  dashboard/
    page.tsx               painel com o compositor
    criar, biblioteca, slides, atividades, avaliacoes,
    mapas, planos-de-aula, redacao, emergencia, planos, conta
  api/
    ai/generate            rota única dos seis módulos de texto
    slides/generate        geração da apresentação
    images/search, images/file
    stripe/checkout, stripe/webhook, stripe/portal
components/
  shell/                   menu, busca por teclado, avisos, medidor de quota
  studio/                  formulário e renderizadores de cada material
  slide-editor, slide-canvas
lib/
  modules.ts               registro dos módulos — a navegação toda lê daqui
  ai.ts                    prompt, formato e validação por módulo
  plans.ts, stripe.ts, slides.ts, catalog.ts
supabase/migrations/       schema completo, em ordem
```

Para acrescentar um módulo novo: inclua a entrada em `lib/modules.ts`, a
especificação em `lib/ai.ts`, um renderizador em
`components/studio/renderers.tsx` e uma página de três linhas. A navegação, a
biblioteca e os limites se ajustam sozinhos.

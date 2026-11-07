# Finance Platform

## Objetivo

Criar uma plataforma web moderna para análise financeira,
investimentos, educação financeira, acompanhamento de mercados,
simulações, carteiras e opções.

## Idioma

Português brasileiro.

## Público

Investidores iniciantes, intermediários e avançados.

## Princípios

- Não inventar dados financeiros.
- Não apresentar dados simulados como dados reais.
- Não prometer rentabilidade.
- Não criar linguagem de enriquecimento rápido.
- Informar riscos.
- Priorizar educação e análise.
- Código limpo e escalável.
- Componentes reutilizáveis.
- Mobile first.
- Segurança desde o início.

## Stack

Antes de implementar, analisar a melhor arquitetura.

Preferência inicial:

- Next.js
- React
- TypeScript
- Tailwind CSS

A escolha definitiva deve ser justificada antes da implementação.

## Dados financeiros

A arquitetura deve permitir integração futura com APIs financeiras.

Dados simulados devem ser identificados claramente como:

"DADOS DEMONSTRATIVOS"

Nunca inventar cotações ou indicadores.

## Desenvolvimento

Antes de grandes alterações:

1. analisar;
2. explicar o plano;
3. implementar;
4. testar;
5. documentar.

## Organização

Manter documentação em:

- README.md
- ARCHITECTURE.md
- ROADMAP.md
- API.md
- DATABASE.md

## Segurança

Nunca colocar:

- API keys;
- tokens;
- senhas;
- secrets

diretamente no código.

Utilizar variáveis de ambiente.

---

## Decisões do projeto (registradas pelo Claude, aprovadas pelo Fabio em 2026-11-07)

**Fonte da verdade:** `docs/superpowers/specs/2026-11-07-plataforma-investimentos-design.md`. A stack escolhida e a justificativa dela estão na seção 8. Mudanças de escopo ou de arquitetura passam primeiro por esse documento.

Este é um projeto pessoal, de estudo e de portfólio. Fabio delega as decisões técnicas e acompanha pelo resultado: explique cada escolha em linguagem simples.

### Stack escolhida
Next.js (App Router) + React + TypeScript estrito · Tailwind CSS v4 com tokens CSS (claro e escuro via next-themes) · Zod · Recharts (carregado sob demanda) · MDX para a área de Educação · Vitest + Testing Library · Playwright + axe · npm · Vercel.

### Regras de dados
- Se um dado faltar, a tela mostra "Dado não disponível".
- O modo demonstrativo simula só preço e histórico. Indicadores fundamentalistas nunca são simulados.
- Uma fonte real que falha mostra "indisponível". Ela nunca é trocada em silêncio por dado demonstrativo.
- Um ativo atendido por fonte real não ganha seções demonstrativas.
- Todo dado de mercado carrega `DataMeta` (`source`, `isDemo`, `asOf`, `attribution`), e a UI exibe a fonte com o `DataSourceBadge`.
- **Fontes:** Banco Central (real, sem chave) para Selic, CDI, IPCA e PTAX. brapi.dev é opcional, ativada por `BRAPI_TOKEN`. O restante fica demonstrativo.

### Linguagem e avisos
- Não usar "compre/venda", "melhor investimento" nem preço-alvo. Para destacar um resultado, use "maior valor líquido nesta simulação".
- O aviso padrão (componente `Disclaimer`) aparece no rodapé global e, em destaque, nos simuladores, no comparador e nas páginas de ativo.
- Nada de contagem regressiva, escassez, preço riscado ou depoimentos de ganho.

### Arquitetura
- `src/lib/finance`: funções financeiras puras, sem I/O e com o "hoje" passado como parâmetro, sempre testadas (TDD).
- `src/lib/data`: a única camada que conhece fornecedores (`bcb`, `brapi`, `demo`). A UI nunca chama APIs externas.
- `src/lib/config/tax-rules.ts`: regras tributárias com `effectiveFrom`, `source` e `verifiedAt`. Confira sempre na fonte oficial.
- `src/lib/config/env.ts`: valida as variáveis de ambiente com Zod. Os módulos que leem segredos importam `server-only`. O `.env.local` fica fora do git e o `.env.example` vai documentado.
- Server Components por padrão; `"use client"` só onde há interação.
- Validação com Zod em três fronteiras: formulários, parâmetros de rota/API e respostas externas.
- Formatação sempre por `src/lib/format` (Intl pt-BR).
- Os documentos ficam assim: `README.md` na raiz; `ARCHITECTURE.md`, `ROADMAP.md`, `API.md` e `DATABASE.md` em `docs/`.

### Design
- **Referência:** `docs/design/mockup-home-v3.html`. Topo escuro fixo, header em vidro fosco, rótulos `// seção` em fonte monoespaçada, cards no estilo Alura e animações em SVG/CSS.
- Respeitar `prefers-reduced-motion`. Animação em loop só no hero.
- Contraste WCAG AA nos dois temas. Alta e baixa sempre com ▲/▼ e sinal, nunca só pela cor.
- Sem rolagem horizontal em 375px.

### Comandos
- `npm run dev`: servidor de desenvolvimento.
- `npm run build` e `npm run start`: build e servidor de produção.
- `npm run lint`: ESLint.
- `npm run typecheck`: `next typegen && tsc --noEmit`.
- `npm test`: testes unitários (Vitest). `npm run test:watch` roda em modo contínuo.
- `npm run test:e2e`: testes E2E (Playwright; sobe `npm run build && npm run start`).
- `npm run format`: Prettier.

### Fluxo de trabalho
- **Ao final de cada etapa, relate ao Fabio:**
  - o que foi criado;
  - os arquivos alterados;
  - como testar;
  - as limitações;
  - o próximo passo recomendado.
- Identificadores de código em inglês. Interface, conteúdo e documentação em português.
- Commits só quando o Fabio pedir.

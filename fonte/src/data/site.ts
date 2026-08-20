/**
 * Conteudo das duas versoes do site num lugar so.
 *
 * As paginas (index.astro e en/index.astro) sao identicas em estrutura e
 * consomem `pt` ou `en` daqui. Traducao que faltar quebra o build, porque
 * as duas precisam satisfazer `SiteContent`.
 */

export interface Stat {
  value: string
  label: string
}

export interface ApproachItem {
  n: string
  title: string
  body: string
}

export interface WorkCase {
  n: string
  sector: string
  title: string
  body: string
  proof?: string
  tags: string[]
  roles: string
}

export interface PlatformItem {
  title: string
  body: string
}

export interface StackGroup {
  title: string
  items: string[]
}

export interface ContactLink {
  label: string
  text: string
  href: string
  external?: boolean
}

export interface SiteContent {
  htmlLang: string
  ogLocale: string
  canonical: string
  altHref: string
  altHreflang: string
  meta: { title: string; description: string }
  nav: {
    work: string
    platform: string
    stack: string
    writing: string
    about: string
    contact: string
    switchLabel: string
    switchHref: string
  }
  hero: {
    eyebrow: string
    headline: string
    lead: string
    ctaPrimary: string
    ctaSecondary: string
    availability: string
  }
  stats: { eyebrow: string; items: Stat[] }
  approach: { eyebrow: string; items: ApproachItem[] }
  work: { eyebrow: string; disclaimer: string; cases: WorkCase[] }
  platform: {
    eyebrow: string
    lead: string
    items: PlatformItem[]
    qualityTitle: string
    quality: string[]
  }
  stack: { eyebrow: string; groups: StackGroup[] }
  about: { eyebrow: string; paragraphs: string[]; motto: string }
  contact: { eyebrow: string; lead: string; links: ContactLink[] }
  footer: { rights: string }
}

export const pt: SiteContent = {
  htmlLang: 'pt-BR',
  ogLocale: 'pt_BR',
  canonical: 'https://saracgpereira.com/',
  altHref: 'https://saracgpereira.com/en/',
  altHreflang: 'en',
  meta: {
    title: 'Sara Pereira — Engenheira de Software',
    description:
      'Engenheira de software full-stack. Seis plataformas SaaS multi-tenant em producao em dominios regulados, com agentes de IA integrados ao produto via MCP.',
  },
  nav: {
    work: 'Trabalho',
    platform: 'Plataforma',
    stack: 'Stack',
    writing: 'Escrita',
    about: 'Sobre',
    contact: 'Contato',
    switchLabel: 'EN',
    switchHref: '/en/',
  },
  hero: {
    eyebrow: 'Engenheira de software full-stack',
    headline: 'Plataformas SaaS multi-tenant para domínios em que o erro custa caro.',
    lead: 'Construo produtos ponta-a-ponta — arquitetura, backend, frontend, mobile e agentes de IA — em setores onde a regra de negócio é densa e a margem de tolerância é pequena. Hoje são seis produtos em produção sobre a mesma base técnica.',
    ctaPrimary: 'Ver trabalhos',
    ctaSecondary: 'Falar comigo',
    availability: 'Disponível para projetos · PJ',
  },
  stats: {
    eyebrow: 'Em números',
    items: [
      { value: '6', label: 'produtos multi-tenant em produção' },
      { value: '5', label: 'domínios regulados atendidos' },
      { value: '~3.700', label: 'commits autorados em 9 meses' },
      { value: '4 → 1', label: 'servidores MCP consolidados em um' },
    ],
  },
  approach: {
    eyebrow: 'Como trabalho',
    items: [
      {
        n: '01',
        title: 'SaaS ponta-a-ponta',
        body: 'Arquitetura, backend, frontend, mobile e deploy. Não terceirizo o que importa — entrego a stack completa, do schema ao componente.',
      },
      {
        n: '02',
        title: 'Multi-tenant em produção',
        body: 'Isolamento por schema no PostgreSQL, módulos desacoplados em Laravel, sem vazar dado entre clientes. Mesmo padrão replicado em seis produtos.',
      },
      {
        n: '03',
        title: 'IA aplicada ao produto',
        body: 'Agentes via MCP rodando dentro do produto, não chatbot grudado por fora. Operam dados reais, com permissão real, sob o mesmo modelo de tenant.',
      },
      {
        n: '04',
        title: 'Base antes de feature',
        body: 'Design system, template compartilhado e CI com gate real. Produto novo nasce com multi-tenancy, RBAC e autenticação prontos — não do zero.',
      },
    ],
  },
  work: {
    eyebrow: 'Trabalhos selecionados',
    disclaimer:
      'Os clientes não podem ser nomeados publicamente. Posso entrar em detalhe sob NDA — me chama.',
    cases: [
      {
        n: 'CASE / 01',
        sector: 'Compras públicas',
        title: 'Plataforma SaaS B2G',
        body: 'Plataforma multi-tenant para empresas que disputam licitações públicas. Integração com APIs governamentais, prospecção automatizada, análise de editais e comparativo de preços entre plataformas concorrentes. Agente conversacional via MCP operando sobre os dados do tenant.',
        proof: 'Numa consolidação recente, fundi três módulos em um e reduzi o produto de sete para cinco — provando paridade de 345 rotas, sem nenhuma migration re-executada nos cinco schemas e com 979 testes verdes.',
        tags: ['Laravel modular', 'PostgreSQL multi-tenant', 'Vue 3 + Inertia', 'MCP Server'],
        roles: 'Arquitetura · Backend · Frontend · IA',
      },
      {
        n: 'CASE / 02',
        sector: 'Setor público',
        title: 'ERP de gestão municipal',
        body: 'O maior produto do portfólio: plataforma modular para prefeituras e autarquias, com isolamento por município no nível de schema. Módulos de orçamento, frotas, patrimônio, agendamento e Departamento Pessoal com folha e ponto — cada contratante liga apenas os que usa.',
        tags: ['Laravel modular', 'PostgreSQL multi-tenant', 'Vue 3 + Inertia', 'MCP Server'],
        roles: 'Arquitetura · Backend · Frontend · IA',
      },
      {
        n: 'CASE / 03',
        sector: 'Tributário',
        title: 'Fiscalização tributária municipal',
        body: 'Cruzamento de notas fiscais de serviço, RPS sem NFS-e correspondente e extrato PGDAS da Receita Federal num cubo de faturamento com medidas propagadas. Domínio onde uma regra mal implementada não gera bug: gera autuação indevida.',
        tags: ['Laravel modular', 'PostgreSQL multi-tenant', 'Vue 3 + Inertia', 'Cubo de faturamento'],
        roles: 'Backend · Frontend · Regra fiscal',
      },
      {
        n: 'CASE / 04',
        sector: 'Serviços ao cidadão',
        title: 'App municipal publicado em iOS e Android',
        body: 'Aplicativo mobile de serviços públicos com a mesma base rodando em iOS, Android e web. Agendamento de espaços públicos, táxi municipal com suporte offline, contra-cheque com IRRF e extrato previdenciário, índices financeiros da prefeitura e portal de água e esgoto.',
        proof: 'Publicado nas duas lojas e em uso por cidadãos — não é protótipo.',
        tags: ['Vue 3 + Capacitor', 'TypeScript', 'Pinia', 'Offline-first'],
        roles: 'Mobile · Frontend · Integrações',
      },
    ],
  },
  platform: {
    eyebrow: 'Trabalho de plataforma',
    lead:
      'Boa parte do que entrego não é feature de produto: é a base sobre a qual os outros produtos — e os outros desenvolvedores — se apoiam.',
    items: [
      {
        title: 'Design system como pacote',
        body: 'Biblioteca de componentes Vue 3 distribuída como pacote npm privado e versionada com semver. Fonte canônica compartilhada por três produtos: corrigir um componente conserta os três de uma vez.',
      },
      {
        title: 'Template base versionado',
        body: 'Ponto de partida para produto novo, já com multi-tenancy por schema, RBAC global e local, autenticação, geração de PDF e os módulos núcleo. O tempo entre decidir e ter tela rodando cai de semanas para dias.',
      },
      {
        title: 'Consolidação dos agentes MCP',
        body: 'Havia um servidor MCP por produto, cada um cópia do mesmo scaffold com as mesmas dezenas de tools duplicadas — o que produziu o mesmo bug em três lugares ao mesmo tempo. Projetei o servidor unificado que resolve a conexão por produto em tempo de execução e substitui os três, provando cobertura caso a caso antes de desligar cada um.',
      },
    ],
    qualityTitle: 'Qualidade que dá para auditar',
    quality: [
      'Análise estática e formatação como gate de CI, com baseline medida',
      'Suíte E2E cobrindo navegação, CRUD, permissões e regressão de listagem',
      'Decisões de arquitetura registradas em ADR, com supersessão explícita',
      'Documentação de onboarding escrita para quem chega sem contexto',
    ],
  },
  stack: {
    eyebrow: 'Stack',
    groups: [
      {
        title: 'Backend',
        items: ['Laravel · PHP 8.2+', 'PostgreSQL multi-tenant', 'Sanctum · Filas · Jobs'],
      },
      {
        title: 'Frontend',
        items: ['Vue 3 · TypeScript estrito', 'Inertia.js', 'Tailwind · Design system próprio'],
      },
      {
        title: 'Mobile',
        items: ['Capacitor · iOS e Android', 'Pinia · Vue Router', 'Offline-first'],
      },
      {
        title: 'Infra e qualidade',
        items: ['Docker · CI/CD', 'Schema-per-tenant', 'Playwright · Análise estática'],
      },
      {
        title: 'IA',
        items: ['MCP Servers', 'Agentes integrados ao produto', 'Tool use sob escopo do tenant'],
      },
    ],
  },
  about: {
    eyebrow: 'Sobre',
    paragraphs: [
      'Engenheira de software com foco em plataformas SaaS de domínio complexo. Trabalho com Laravel, Vue 3 e PostgreSQL multi-tenant em produtos rodando em produção nos setores de compras públicas, gestão municipal, tributário, folha de pagamento e serviços ao cidadão.',
      'Cheguei aqui por um caminho torto. Fui personal trainer, morei fora entre 2014 e 2018 trabalhando em hostels no Chile e na Noruega, e liderei uma equipe de coaches de CrossFit por três anos. Entrei na empresa onde estou hoje em 2021, numa função administrativa; virei desenvolvedora em 2024 e hoje coordeno o setor de inovação.',
      'Treinar pessoas ensina uma coisa que serve para software: você responde pelo resultado de outra pessoa, e um erro de julgamento tem consequência física. É de onde vem meu incômodo com sistema que passa nos testes mas que ninguém abriu na tela.',
      'Consolidei produtos que nasceram separados numa plataforma técnica coerente: mesma arquitetura modular, mesmo modelo de isolamento por tenant, mesmo design system, mesmos gates de qualidade. É isso que me permite entregar feature nova em qualquer um deles sem reaprender o terreno.',
      'Trabalho com agentes de IA integrados ao produto via MCP — não como camada de marketing, mas como interface real de operação, com as mesmas permissões e o mesmo escopo de tenant que a interface gráfica. Também supervisiono um estagiário e escrevo a documentação de onboarding: parte do meu trabalho é fazer com que outra pessoa consiga entrar no código sem precisar me perguntar.',
    ],
    motto:
      'Em todo lugar que passei, fiz a diferença. E sempre que saí, deixei profissionais que levaram o legado adiante — ou melhoraram o que eu deixei.',
  },
  contact: {
    eyebrow: 'Vamos conversar',
    lead: 'Aberta a oportunidades e projetos PJ. Para detalhes sob NDA, me escreve por email.',
    links: [
      { label: 'Email', text: 'contato@saracgpereira.com', href: 'mailto:contato@saracgpereira.com' },
      { label: 'GitHub', text: '@saragilberto', href: 'https://github.com/saragilberto', external: true },
      { label: 'LinkedIn', text: '/in/saracgpereira', href: 'https://www.linkedin.com/in/saracgpereira/', external: true },
      { label: 'Currículo', text: 'Baixar em PDF', href: '/cv-sara-pereira.pdf' },
    ],
  },
  footer: { rights: '© 2026 Sara Pereira · Todos os direitos reservados.' },
}

export const en: SiteContent = {
  htmlLang: 'en',
  ogLocale: 'en_US',
  canonical: 'https://saracgpereira.com/en/',
  altHref: 'https://saracgpereira.com/',
  altHreflang: 'pt-BR',
  meta: {
    title: 'Sara Pereira — Software Engineer',
    description:
      'Full-stack software engineer. Six multi-tenant SaaS platforms in production across regulated domains, with AI agents integrated into the product through MCP.',
  },
  nav: {
    work: 'Work',
    platform: 'Platform',
    stack: 'Stack',
    writing: 'Writing',
    about: 'About',
    contact: 'Contact',
    switchLabel: 'PT',
    switchHref: '/',
  },
  hero: {
    eyebrow: 'Full-stack software engineer',
    headline: 'Multi-tenant SaaS platforms for domains where mistakes are expensive.',
    lead: 'I build products end to end — architecture, backend, frontend, mobile and AI agents — in sectors where business rules are dense and the margin for error is thin. Six products are in production today on the same technical foundation.',
    ctaPrimary: 'See the work',
    ctaSecondary: 'Get in touch',
    availability: 'Available for contract work',
  },
  stats: {
    eyebrow: 'By the numbers',
    items: [
      { value: '6', label: 'multi-tenant products in production' },
      { value: '5', label: 'regulated domains served' },
      { value: '~3,700', label: 'commits authored in 9 months' },
      { value: '4 → 1', label: 'MCP servers consolidated into one' },
    ],
  },
  approach: {
    eyebrow: 'How I work',
    items: [
      {
        n: '01',
        title: 'End-to-end SaaS',
        body: 'Architecture, backend, frontend, mobile and deployment. I do not outsource what matters — I deliver the full stack, from schema to component.',
      },
      {
        n: '02',
        title: 'Multi-tenant in production',
        body: 'Schema-level isolation in PostgreSQL, decoupled Laravel modules, no data leaking between clients. The same pattern replicated across six products.',
      },
      {
        n: '03',
        title: 'AI built into the product',
        body: 'MCP agents running inside the product, not a chatbot bolted on the side. They operate on real data, with real permissions, under the same tenant model.',
      },
      {
        n: '04',
        title: 'Foundation before features',
        body: 'Design system, shared template and CI with a real gate. A new product starts with multi-tenancy, RBAC and authentication already in place — not from scratch.',
      },
    ],
  },
  work: {
    eyebrow: 'Selected work',
    disclaimer: 'Clients cannot be named publicly. I can go into detail under NDA — just ask.',
    cases: [
      {
        n: 'CASE / 01',
        sector: 'Public procurement',
        title: 'B2G SaaS platform',
        body: 'Multi-tenant platform for companies bidding on public tenders. Integration with government APIs, automated prospecting, tender analysis and price comparison across competing platforms. A conversational MCP agent operating on the tenant data.',
        proof: 'In a recent consolidation I merged three modules into one and took the product from seven modules down to five — proving parity across 345 routes, with no migration re-run on any of the five schemas and 979 tests green.',
        tags: ['Modular Laravel', 'Multi-tenant PostgreSQL', 'Vue 3 + Inertia', 'MCP Server'],
        roles: 'Architecture · Backend · Frontend · AI',
      },
      {
        n: 'CASE / 02',
        sector: 'Public sector',
        title: 'Municipal government ERP',
        body: 'The largest product in the portfolio: a modular platform for city halls and public agencies, isolated per municipality at the schema level. Modules for budgeting, fleet, assets, scheduling and HR with payroll and timekeeping — each client enables only what they use.',
        tags: ['Modular Laravel', 'Multi-tenant PostgreSQL', 'Vue 3 + Inertia', 'MCP Server'],
        roles: 'Architecture · Backend · Frontend · AI',
      },
      {
        n: 'CASE / 03',
        sector: 'Tax',
        title: 'Municipal tax auditing',
        body: 'Cross-referencing service invoices, receipts with no matching invoice and federal tax authority statements into a revenue cube with propagated measures. A domain where a badly implemented rule does not produce a bug: it produces an unjustified tax assessment.',
        tags: ['Modular Laravel', 'Multi-tenant PostgreSQL', 'Vue 3 + Inertia', 'Revenue cube'],
        roles: 'Backend · Frontend · Tax rules',
      },
      {
        n: 'CASE / 04',
        sector: 'Citizen services',
        title: 'Municipal app shipped on iOS and Android',
        body: 'Mobile app for public services with a single codebase running on iOS, Android and web. Public venue booking, municipal taxi service with offline support, payslips with income tax and social security statements, city financial indicators and a water and sewage portal.',
        proof: 'Published on both stores and in use by citizens — not a prototype.',
        tags: ['Vue 3 + Capacitor', 'TypeScript', 'Pinia', 'Offline-first'],
        roles: 'Mobile · Frontend · Integrations',
      },
    ],
  },
  platform: {
    eyebrow: 'Platform work',
    lead:
      'Much of what I deliver is not a product feature: it is the foundation the other products — and the other developers — rely on.',
    items: [
      {
        title: 'Design system as a package',
        body: 'A Vue 3 component library shipped as a private npm package and versioned with semver. A single canonical source shared by three products: fixing one component fixes all three at once.',
      },
      {
        title: 'Versioned base template',
        body: 'The starting point for a new product, already carrying schema-based multi-tenancy, global and local RBAC, authentication, PDF generation and the core modules. Time from decision to a working screen drops from weeks to days.',
      },
      {
        title: 'Consolidating the MCP agents',
        body: 'There was one MCP server per product, each a copy of the same scaffold with the same dozens of duplicated tools — which produced the same bug in three places at once. I designed the unified server that resolves the connection per product at runtime and replaces all three, proving coverage case by case before retiring each one.',
      },
    ],
    qualityTitle: 'Quality you can audit',
    quality: [
      'Static analysis and formatting as a CI gate, with a measured baseline',
      'E2E suite covering navigation, CRUD, permissions and listing regressions',
      'Architecture decisions recorded as ADRs, superseded explicitly',
      'Onboarding documentation written for people arriving without context',
    ],
  },
  stack: {
    eyebrow: 'Stack',
    groups: [
      {
        title: 'Backend',
        items: ['Laravel · PHP 8.2+', 'Multi-tenant PostgreSQL', 'Sanctum · Queues · Jobs'],
      },
      {
        title: 'Frontend',
        items: ['Vue 3 · Strict TypeScript', 'Inertia.js', 'Tailwind · In-house design system'],
      },
      {
        title: 'Mobile',
        items: ['Capacitor · iOS and Android', 'Pinia · Vue Router', 'Offline-first'],
      },
      {
        title: 'Infra and quality',
        items: ['Docker · CI/CD', 'Schema-per-tenant', 'Playwright · Static analysis'],
      },
      {
        title: 'AI',
        items: ['MCP Servers', 'Agents integrated into the product', 'Tool use scoped to the tenant'],
      },
    ],
  },
  about: {
    eyebrow: 'About',
    paragraphs: [
      'Software engineer focused on SaaS platforms in complex domains. I work with Laravel, Vue 3 and multi-tenant PostgreSQL on products running in production across public procurement, municipal government, tax, payroll and citizen services.',
      'I got here by a crooked path. I was a personal trainer, lived abroad between 2014 and 2018 working in hostels in Chile and Norway, and led a CrossFit coaching team for three years. I joined the company I am at today in 2021, in an administrative role; I moved into development in 2024 and now I lead its innovation team.',
      'Coaching people teaches something that carries straight into software: you answer for someone else\'s outcome, and a lapse in judgement has physical consequences. That is where my discomfort comes from with a system that passes its tests but that nobody has ever opened on screen.',
      'I consolidated products that started out separate into one coherent technical platform: the same modular architecture, the same tenant isolation model, the same design system, the same quality gates. That is what lets me ship a new feature in any of them without relearning the terrain.',
      'I work with AI agents integrated into the product through MCP — not as a marketing layer, but as a real operating interface, with the same permissions and the same tenant scope as the graphical interface. I also supervise an intern and write the onboarding documentation: part of my job is making sure someone else can get into the code without having to ask me.',
    ],
    motto:
      'Everywhere I have been, I made a difference. And every time I left, I left behind people who carried the work forward — or improved on what I built.',
  },
  contact: {
    eyebrow: 'Let us talk',
    lead: 'Open to opportunities and contract work. For details under NDA, drop me an email.',
    links: [
      { label: 'Email', text: 'contato@saracgpereira.com', href: 'mailto:contato@saracgpereira.com' },
      { label: 'GitHub', text: '@saragilberto', href: 'https://github.com/saragilberto', external: true },
      { label: 'LinkedIn', text: '/in/saracgpereira', href: 'https://www.linkedin.com/in/saracgpereira/', external: true },
      { label: 'Résumé', text: 'Download PDF', href: '/cv-sara-pereira-en.pdf' },
    ],
  },
  footer: { rights: '© 2026 Sara Pereira · All rights reserved.' },
}

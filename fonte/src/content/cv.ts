/**
 * Conteudo do curriculo, PT e EN.
 *
 * Alimenta as paginas /cv/ e /en/cv/ e, por elas, os PDFs gerados em
 * scripts/cv-pdf.mjs. Fonte unica: nao existe versao do CV fora daqui.
 *
 * PENDENTE — datas que a Sara ainda precisa confirmar estao marcadas com
 * o prefixo `A CONFIRMAR`. Elas aparecem no PDF de proposito, para nao
 * passarem batidas.
 */

export interface CvRole {
  title: string
  org: string
  period: string
  location?: string
  bullets: string[]
}

export interface CvSkillGroup {
  title: string
  items: string
}

export interface CvContent {
  htmlLang: string
  meta: { title: string; description: string }
  name: string
  headline: string
  contacts: { label: string; text: string; href?: string }[]
  summaryTitle: string
  summary: string
  experienceTitle: string
  roles: CvRole[]
  earlierTitle: string
  earlier: CvRole[]
  educationTitle: string
  education: { title: string; org: string; period: string }[]
  skillsTitle: string
  skills: CvSkillGroup[]
  languagesTitle: string
  languages: string
  backLabel: string
  backHref: string
}

const PENDENTE = 'A CONFIRMAR'

export const cvPt: CvContent = {
  htmlLang: 'pt-BR',
  meta: {
    title: 'Sara Pereira — Currículo',
    description: 'Currículo de Sara Pereira, engenheira de software full-stack e coordenadora de inovação.',
  },
  name: 'Sara Pereira',
  headline: 'Engenheira de Software Full-Stack · Coordenadora de Inovação',
  contacts: [
    { label: 'Email', text: 'contato@saracgpereira.com', href: 'mailto:contato@saracgpereira.com' },
    { label: 'Site', text: 'saracgpereira.com', href: 'https://saracgpereira.com' },
    { label: 'GitHub', text: 'github.com/saragilberto', href: 'https://github.com/saragilberto' },
    { label: 'LinkedIn', text: 'in/saracgpereira', href: 'https://www.linkedin.com/in/saracgpereira/' },
    { label: 'Trabalho', text: 'Remoto' },
  ],
  summaryTitle: 'Perfil',
  summary:
    'Engenheira de software full-stack e coordenadora de inovação. Construo plataformas SaaS multi-tenant para domínios regulados — compras públicas, gestão municipal, tributário, folha de pagamento e serviços ao cidadão — com Laravel, Vue 3 e PostgreSQL isolado por schema. Nos últimos nove meses autorei cerca de 3.700 commits em seis produtos rodando em produção. Lidero a adoção de agentes de IA integrados ao produto via MCP, com as mesmas permissões e o mesmo escopo de tenant da interface gráfica.',
  experienceTitle: 'Experiência',
  roles: [
    {
      title: 'Coordenadora do Setor de Inovação',
      org: 'SH3 Sistemas',
      period: `${PENDENTE} – atual`,
      location: 'Remoto',
      bullets: [
        'Lidero a adoção de IA na empresa: agentes integrados aos produtos via MCP, operando dados reais sob o escopo de permissão de cada tenant — não camada de chat acoplada por fora.',
        'Projetei a consolidação de quatro servidores MCP em um. Os anteriores eram cópias do mesmo scaffold, com dezenas de tools duplicadas, o que já havia produzido o mesmo defeito em três produtos ao mesmo tempo. O unificado resolve a conexão por produto em tempo de execução e substitui os três provando cobertura caso a caso antes de desligar cada um.',
        'Supervisiono estagiário e mantenho a documentação de onboarding dos produtos, escrita para quem chega sem contexto.',
        'Estabeleci gates de qualidade em CI — análise estática com baseline medida, formatação e suíte E2E cobrindo navegação, CRUD, permissões e regressão — e o registro de decisões de arquitetura em ADR com supersessão explícita.',
      ],
    },
    {
      title: 'Desenvolvedora de Software',
      org: 'SH3 Sistemas',
      period: `abr/2024 – ${PENDENTE}`,
      location: 'Remoto',
      bullets: [
        'Seis produtos multi-tenant em produção sobre a mesma base técnica: SaaS B2G de licitações, ERP de gestão municipal, fiscalização tributária, hub de suporte, aplicativo mobile e o template base compartilhado.',
        'Arquitetura multi-tenant com isolamento por schema em PostgreSQL, RBAC global e local, provisionamento de novos tenants e navegação agregada por módulo.',
        'Consolidei os módulos do produto de licitações de sete para cinco, provando paridade de 345 rotas, sem re-executar nenhuma migration nos cinco schemas e com 979 testes verdes.',
        'Publiquei aplicativo municipal em iOS e Android com Vue 3 e Capacitor — agendamento de espaços públicos, táxi municipal com suporte offline, contra-cheque com IRRF e extrato previdenciário, índices financeiros e portal de água e esgoto.',
        'Criei e mantenho o design system em Vue 3, distribuído como pacote npm privado versionado por semver e consumido por três produtos.',
        'Implementei o domínio de fiscalização tributária: cruzamento de notas fiscais de serviço, recibos sem nota correspondente e extrato PGDAS da Receita Federal num cubo de faturamento com medidas propagadas.',
      ],
    },
    {
      title: 'Assistente Administrativa',
      org: 'SH3 Sistemas',
      period: `${PENDENTE} – abr/2024`,
      bullets: [
        'Rotinas administrativas da empresa, com transição para a área técnica ao longo da graduação em Análise e Desenvolvimento de Sistemas.',
      ],
    },
  ],
  earlierTitle: 'Antes da tecnologia',
  earlier: [
    {
      title: 'Head Coach',
      org: 'CrossFit',
      period: PENDENTE,
      bullets: [
        'Liderança de equipe técnica, planejamento de treino e acompanhamento de alunos.',
      ],
    },
    {
      title: 'Personal Trainer',
      org: '',
      period: 'até 2014',
      bullets: [],
    },
  ],
  educationTitle: 'Formação',
  education: [
    {
      title: 'Tecnólogo em Análise e Desenvolvimento de Sistemas',
      org: 'PUC Minas',
      period: 'concluído em ago/2025',
    },
  ],
  skillsTitle: 'Competências técnicas',
  skills: [
    { title: 'Backend', items: 'Laravel · PHP 8.2+ · PostgreSQL multi-tenant · Sanctum · Filas e jobs' },
    { title: 'Frontend', items: 'Vue 3 · TypeScript estrito · Inertia.js · Tailwind · Design system próprio' },
    { title: 'Mobile', items: 'Capacitor (iOS e Android) · Pinia · Vue Router · Offline-first' },
    { title: 'Infra e qualidade', items: 'Docker · CI/CD · Playwright · Análise estática · ADRs' },
    { title: 'IA', items: 'MCP Servers · Agentes integrados ao produto · Tool use sob escopo do tenant' },
  ],
  languagesTitle: 'Idiomas',
  languages: 'Português — nativo · Inglês — fluente · Espanhol — iniciante',
  backLabel: 'Voltar ao site',
  backHref: '/',
}

export const cvEn: CvContent = {
  htmlLang: 'en',
  meta: {
    title: 'Sara Pereira — Résumé',
    description: 'Résumé of Sara Pereira, full-stack software engineer and innovation lead.',
  },
  name: 'Sara Pereira',
  headline: 'Full-Stack Software Engineer · Innovation Lead',
  contacts: [
    { label: 'Email', text: 'contato@saracgpereira.com', href: 'mailto:contato@saracgpereira.com' },
    { label: 'Site', text: 'saracgpereira.com', href: 'https://saracgpereira.com' },
    { label: 'GitHub', text: 'github.com/saragilberto', href: 'https://github.com/saragilberto' },
    { label: 'LinkedIn', text: 'in/saracgpereira', href: 'https://www.linkedin.com/in/saracgpereira/' },
    { label: 'Work', text: 'Remote' },
  ],
  summaryTitle: 'Profile',
  summary:
    'Full-stack software engineer and innovation lead. I build multi-tenant SaaS platforms for regulated domains — public procurement, municipal government, tax, payroll and citizen services — with Laravel, Vue 3 and schema-isolated PostgreSQL. Over the last nine months I authored roughly 3,700 commits across six products running in production. I lead the adoption of AI agents built into the product through MCP, with the same permissions and the same tenant scope as the graphical interface.',
  experienceTitle: 'Experience',
  roles: [
    {
      title: 'Innovation Lead',
      org: 'SH3 Sistemas',
      period: `${PENDENTE} – present`,
      location: 'Remote',
      bullets: [
        'I lead AI adoption across the company: agents built into the products through MCP, operating on real data under each tenant permission scope — not a chat layer bolted on the side.',
        'I designed the consolidation of four MCP servers into one. The previous ones were copies of the same scaffold with dozens of duplicated tools, which had already produced the same defect in three products at once. The unified server resolves the connection per product at runtime and replaces all three, proving coverage case by case before retiring each one.',
        'I supervise an intern and maintain the onboarding documentation for the products, written for people arriving without context.',
        'I established quality gates in CI — static analysis with a measured baseline, formatting, and an E2E suite covering navigation, CRUD, permissions and regressions — plus architecture decisions recorded as ADRs with explicit supersession.',
      ],
    },
    {
      title: 'Software Developer',
      org: 'SH3 Sistemas',
      period: `Apr 2024 – ${PENDENTE}`,
      location: 'Remote',
      bullets: [
        'Six multi-tenant products in production on the same technical foundation: a B2G tendering SaaS, a municipal government ERP, tax auditing, a support hub, a mobile app and the shared base template.',
        'Multi-tenant architecture with schema-level isolation in PostgreSQL, global and local RBAC, tenant provisioning and module-aggregated navigation.',
        'Consolidated the tendering product from seven modules down to five, proving parity across 345 routes, with no migration re-run on any of the five schemas and 979 tests green.',
        'Shipped a municipal app on iOS and Android with Vue 3 and Capacitor — public venue booking, municipal taxi with offline support, payslips with income tax and social security statements, financial indicators and a water and sewage portal.',
        'Built and maintain the Vue 3 design system, shipped as a semver-versioned private npm package consumed by three products.',
        'Implemented the tax auditing domain: cross-referencing service invoices, receipts with no matching invoice and federal tax authority statements into a revenue cube with propagated measures.',
      ],
    },
    {
      title: 'Administrative Assistant',
      org: 'SH3 Sistemas',
      period: `${PENDENTE} – Apr 2024`,
      bullets: [
        'Company administrative routines, moving into the technical team over the course of my Systems Analysis and Development degree.',
      ],
    },
  ],
  earlierTitle: 'Before technology',
  earlier: [
    {
      title: 'Head Coach',
      org: 'CrossFit',
      period: PENDENTE,
      bullets: ['Leading a coaching team, training programming and athlete development.'],
    },
    {
      title: 'Personal Trainer',
      org: '',
      period: 'until 2014',
      bullets: [],
    },
  ],
  educationTitle: 'Education',
  education: [
    {
      title: 'Technologist degree in Systems Analysis and Development',
      org: 'PUC Minas',
      period: 'completed Aug 2025',
    },
  ],
  skillsTitle: 'Technical skills',
  skills: [
    { title: 'Backend', items: 'Laravel · PHP 8.2+ · Multi-tenant PostgreSQL · Sanctum · Queues and jobs' },
    { title: 'Frontend', items: 'Vue 3 · Strict TypeScript · Inertia.js · Tailwind · In-house design system' },
    { title: 'Mobile', items: 'Capacitor (iOS and Android) · Pinia · Vue Router · Offline-first' },
    { title: 'Infra and quality', items: 'Docker · CI/CD · Playwright · Static analysis · ADRs' },
    { title: 'AI', items: 'MCP Servers · Agents built into the product · Tool use scoped to the tenant' },
  ],
  languagesTitle: 'Languages',
  languages: 'Portuguese — native · English — fluent · Spanish — beginner',
  backLabel: 'Back to site',
  backHref: '/en/',
}

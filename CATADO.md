# Catado — dez/2025 a ago/2026

Levantamento factual do trabalho dos últimos ~9 meses, extraído do GitHub
(`saracristina-sh3` + org `sh3-sistemas`) em 19/08/2026. Serve de matéria-prima
para o site e o CV. Todo número aqui é verificável na API do GitHub.

## Volume

**~3.689 commits autorados** desde nov/2025 (busca global). Destes, **2.399**
estão nos 12 repositórios principais mapeados abaixo; o resto se espalha por
repos menores (`licitapp`, `licitae-disputas`, `licitApp-2.0`,
`licitapp-credenciamento`, `verificadorDeCertificados`, `SH3DP`).

| Mês | Commits |
|---|---:|
| dez/2025 | 33 |
| jan/2026 | 153 |
| fev/2026 | 99 |
| mar/2026 | 196 |
| abr/2026 | 170 |
| mai/2026 | 459 |
| jun/2026 | 385 |
| jul/2026 | 490 |
| ago/2026 (parcial, até dia 19) | 414 |

A inflexão é clara em **maio/2026**: o volume mensal triplica e se mantém.

## Produtos

### SIAM — `siap-sh3` · 1.302 commits
Sistema Integrado de Administração Pública. ERP modular multi-tenant para
gestão municipal, com isolamento por schema PostgreSQL por município/autarquia.
Base de código: 13,6 MB PHP · 4,3 MB Vue · 1,9 MB TypeScript.
Módulos no ecossistema: Departamento Pessoal (folha, ponto), Orçamento, Frotas,
Agendamento, Patrimônio, Auth.

### Licitaê — `licitae` · 335 commits
SaaS B2G multi-tenant para empresas que disputam licitações públicas.
Integração com APIs governamentais, prospecção automatizada, análise de editais,
comparativo de preços entre plataformas concorrentes.
Base: 5,9 MB PHP · 971 KB Vue · 619 KB TypeScript.

Marco documentado (15/08): fusão de 3 módulos em 1 (ADR-019), reduzindo o
produto de 7 para 5 módulos, **com prova de paridade de 345 rotas** e nenhuma
migration re-executada nos 5 schemas. 979 testes PHP verdes.

### Fiscalizaê — `fiscalizae` · 264 commits
Fiscalização tributária municipal. Domínio pesado de regra fiscal: NFS-e, RPS
sem NFS-e par, extrato PGDAS da Receita Federal, cubo de faturamento com
medidas propagadas.
Base: 6,7 MB PHP · 1,3 MB Vue · 1,1 MB TypeScript.

### Cidade App — `cidade-app` · 224 commits
Aplicativo mobile de serviços municipais. Vue 3 + Capacitor, mesma base para
iOS, Android e Web. **Publicado na App Store e no Google Play.**
Módulos entregues: Agendamento de espaços públicos, Táxi municipal (com suporte
offline), Índices financeiros da prefeitura, DAMAE (água e esgoto), Contra
Cheque (com views de IRRF e extrato previdenciário), Turismo, Carta de
Serviços, Informações Úteis.

### Suporte SH3 Hub — `suporte-sh3-hub` · 127 commits
Hub de suporte transversal a SIAM, Licitaê e Cidade App.

### Design System — `design-system` · 54 commits
`@sh3/design-system` — biblioteca de componentes Vue 3 distribuída como pacote
npm privado via Verdaccio. **Fonte canônica compartilhada entre SIAM, LicitApp
e o template.** 748 KB TypeScript · 722 KB Vue.

### Template SH3 — `template-sh3` · 28 commits
Ponto de partida versionado para produtos novos: multi-tenancy por schema,
RBAC global + local, autenticação, design system e geração de PDF já prontos.
Módulos núcleo: AuthCore, ClientCore, Relatórios.

## Agentes de IA / MCP

Quatro servidores MCP construídos, somando **41 commits**:
`licitae-mcp-server`, `fiscalizae-mcp-server`, `siap-mcp-server` e o unificado
`sh3-mcp-server`.

O `sh3-mcp-server` é um projeto de consolidação com justificativa registrada:
os 3 servidores por produto eram cópias do mesmo scaffold com as mesmas ~54
tools duplicadas — o que já produziu **o mesmo bug em três lugares ao mesmo
tempo** (um guard de SQL rejeitando `OFFSET` por engano). O unificado resolve a
conexão dinamicamente por produto/instância e substitui os três gradualmente,
provando cobertura produto a produto antes de desligar cada um.

Escopo de autorização: leitura por padrão, ações administrativas só sob escopo
elevado, sempre dentro do modelo de tenant.

## Engenharia de plataforma (transversal)

- **Multi-tenancy schema-per-tenant** em PostgreSQL, com provisionamento de
  autarquias, RBAC global + local e navegação agregada — padrão replicado em
  todos os produtos da linha.
- **CI/CD com gates reais**: PHPStan com baseline medida, Pint, gate de
  JavaScript, workflows versionados.
- **Suíte E2E Playwright** reerguida e ampliada: infraestrutura, smoke de
  navegação, CRUD, permissões e regressão de listagem.
- **ADRs versionadas** — decisões arquiteturais registradas e supersedidas
  explicitamente (ADR-016 → ADR-019).
- **Ponte Plane–GitHub** unificada, multi-projeto, com webhook assinado
  (`plane-selfhost`, 24 commits) — integração de ferramenta de gestão ao fluxo
  de código, rodando em VPS.
- **Fluxo spec-driven com agentes**: skills versionadas no repositório
  (`tlc-spec-driven`, `playwright-skill`, `codenavi`) conduzindo o ciclo de
  execução pelo estado do work item.

## Liderança e mentoria

Supervisiona o estagiário **Pedro** — preencheu o relatório semestral de estágio
(ago/2026). É a única evidência de responsabilidade sobre outra pessoa no
material levantado, e não aparece em lugar nenhum do site atual.

## Ângulos de venda que o site atual não usa

1. **Volume e consistência** — ~3.7 mil commits em 9 meses, com curva ascendente
   sustentada desde maio. O site não traz um único número.
2. **App publicado nas lojas** — Cidade App está na App Store e no Google Play.
   O site não menciona mobile em lugar nenhum.
3. **Fiscalizaê / domínio tributário** — quarto domínio (NFS-e, PGDAS, Receita
   Federal) ausente do site, que só lista 3 cases.
4. **Design system como produto interno** — pacote npm privado consumido por
   três produtos. É evidência de trabalho de plataforma, não de feature.
5. **Consolidação de 4 servidores MCP em 1** — história técnica forte, com
   causa concreta (bug triplicado) e estratégia de migração. Muito melhor que
   "agentes via MCP" genérico.
6. **Rigor verificável** — 345 rotas provadas idênticas numa refatoração, 979
   testes verdes, PHPStan com baseline, ADRs. Isso é o que diferencia de quem
   só entrega feature.

## Lacunas a preencher (não derivável do código)

- Anos de experiência e histórico de empregos anteriores - assistente administrativa mesma empresa, head coach
  crossfit antes disso e personal trainer até 2014
- Formação acadêmica - útima formação em analise e desenvolvimento de sistemas PUCminas, concluido agosto 2025
- Nível de inglês - ngles fluente, espanhol - iniciate
- Se os nomes SH3 / Licitaê / Fiscalizaê / SIAM / Cidade App podem ser públicos - Não podem
 
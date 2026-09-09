# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Sara Pereira's personal portfolio site (saracgpereira.com) — an Astro + Tailwind static site, plus the
automation that generates its written content. All actual source lives under `fonte/`; the repo root
also holds `site/`, a one-time snapshot of production downloaded from Hostinger for reference (not a
build artifact — `fonte/dist/` is the real build output and is gitignored).

## Commands

All commands run from `fonte/`:

```
npm run dev       # astro dev — local dev server
npm run build     # prebuild (OG image) -> astro build -> postbuild (CV PDFs)
npm run preview   # astro preview
npm run deploy    # ./deploy.sh — build + rsync to Hostinger + trigger LinkedIn drafts
```

There is no test suite or linter configured.

### Building the CV with a named employer

The employer name must never appear in the public build (see below). To generate the PDF with the real
employer name for sending directly to a recruiter — never for `npm run deploy`:

```
CV_EMPREGADOR="Nome da Empresa" npm run build
```

`deploy.sh` refuses to run at all if `CV_EMPREGADOR` is set, so a named CV can't accidentally go live.

## Architecture

### Bilingual content is data-driven, not duplicated templates

`src/data/site.ts` exports `pt` and `en`, both typed as the same `SiteContent` interface. `src/pages/index.astro`
and `src/pages/en/index.astro` are structurally identical and just render whichever object they're given —
the same is true of `src/pages/cv.astro` / `src/pages/en/cv.astro` against `src/data/cv.ts`'s `cvPt`/`cvEn`.
Adding or changing a field means updating the interface and *both* language objects, or the build breaks by
design (TypeScript enforces parity between locales). There's no i18n library — routing convention is
`/` = pt-BR (default), `/en/` = English.

### CV PDFs are generated from the live pages, not authored separately

`scripts/cv-pdf.mjs` runs as `postbuild`: it spins up an ephemeral static server over `dist/`, opens
`/cv/` and `/en/cv/` in headless Playwright/Chromium, and prints each to PDF into `dist/`. The CV content
in `src/data/cv.ts` is the single source of truth — there is no separate PDF template to keep in sync.

### `/writing` is English-only by design

`src/content/config.ts`'s `writing` collection schema documents why: the section exists to be found by
people hiring outside Brazil, so translating would double the work without serving that goal. Posts use
`draft: true`/`false` in frontmatter to control whether they're in the build (`src/pages/writing/[...slug].astro`,
`index.astro`, `rss.xml.ts` all filter on it).

### Content is anonymized by hard rule, not convention

The employer name, and any client/municipality/production data, must never appear in the public site,
the CV, `/writing` posts, or LinkedIn drafts. `src/data/cv.ts` defaults the employer to a generic
descriptor unless `CV_EMPREGADOR` is explicitly set for a one-off named build (see Commands above). The
same rule is spelled out again inside the prompts in `weekly-writing-draft.sh` and `linkedin-draft.sh`
for the headless agents that write draft content unsupervised.

### Content-generation automation writes drafts, never publishes

Two scripts drive headless Claude sessions with deliberately restricted tools (no Bash, no git, no
network) to keep them incapable of publishing anything on their own:

- **`weekly-writing-draft.sh`** — runs weekly via launchd. Scans commit logs across several *other* local
  project repos (paths hardcoded at the top of the script, on an external volume), picks one concrete
  technical decision, and writes a new post into `src/content/writing/` with `draft: true` always. The
  wrapper script (not the headless agent) does the `git add`/`commit` of the new file.
- **`linkedin-draft.sh`** — runs at the end of every successful `deploy.sh`, and can be run manually to
  backfill. For each published post (`draft: false`) that has no LinkedIn draft yet, it asks a headless
  Claude (Read-only on the post, Write-only into `linkedin-drafts/`) to write a short announcement post.
  Nothing is ever posted to LinkedIn automatically — Sara copies the text out manually after review.

Logs for both live in `fonte/.automation/` (gitignored).

### Deploy

`deploy.sh` builds, then `rsync --delete`s `dist/` to the Hostinger `public_html/`, excluding `api/`
(a Hostinger-provided placeholder unrelated to this project — deleting it would just create churn). It
then runs `linkedin-draft.sh`; a LinkedIn-draft failure is logged and reported but does not fail the
deploy, since the site is already live at that point.

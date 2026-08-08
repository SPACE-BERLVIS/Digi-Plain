# DigiPlain

**Digital life, made simple.**

DigiPlain is a database-free, SEO-first static publication for practical answers about phones, apps, internet services, Nigerian digital processes and everyday technology.

## Architecture

```text
Telegram -> Cloudflare Worker -> GitHub Markdown -> Astro -> Cloudflare
```

Content lives as Markdown in Git. No CMS database is required.

## Stack

- Astro 6
- Markdown content collections
- Static HTML output
- Cloudflare Workers Static Assets
- Cloudflare Worker API route for Telegram publishing
- GitHub Actions build/deploy pipeline
- No database

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run check
npm run build
```

Static output is written to `dist/`.

## Cloudflare

Build command:

```bash
npm run build
```

Deploy command:

```bash
npx wrangler deploy
```

`wrangler.jsonc` serves `dist/` as static assets and invokes `src/publisher-worker.ts` only for `/api/telegram/*` requests.

## Publishing content manually

Add Markdown files to:

```text
src/content/articles/
```

The frontmatter schema is defined in `src/content.config.ts`.

## Publishing from Telegram

The Telegram publisher is implemented. It accepts `.md` documents or pasted Markdown, validates article frontmatter, and creates/updates `src/content/articles/<slug>.md` through the GitHub Contents API.

Setup guide:

```text
docs/telegram-publishing.md
```

Useful commands:

```bash
npm run telegram:inspect
npm run telegram:set-webhook
npm run publisher:dev
```

## Continuous integration and deployment

Every push to `main` runs:

```text
npm install
npm run check
npm run build
```

If the repository has `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets, a successful `main` build is deployed automatically with Wrangler.

## Content model

Primary sections:

- Phones
- Apps
- Internet
- Nigeria
- Explained

Draft articles remain in Git but are excluded from generated public routes. Re-uploading the same slug updates the existing article, preserving a simple database-free editorial workflow.

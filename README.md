# DigiPlain

**Digital life, made simple.**

DigiPlain is a database-free, SEO-first static publication for practical answers about phones, apps, internet services, Nigerian digital processes and everyday technology.

## Architecture

```text
Telegram -> Cloudflare Worker -> GitHub Markdown/media -> Astro -> Cloudflare
```

Content lives as Markdown and static media in Git. No CMS database is required.

## Stack

- Astro 6
- Markdown content collections
- Static HTML output
- Cloudflare Workers Static Assets
- Cloudflare Worker API route for Telegram publishing
- GitHub Actions build/deploy pipeline
- Pinned Wrangler deployment toolchain
- No database

## Local development

```bash
npm install
npm run dev
```

## Build validation

```bash
npm run check
npm run build
npm run deploy:dry-run
```

Static output is written to `dist/`.

## Production site URL

Canonical URLs, RSS, sitemap entries and structured data come from the `SITE_URL` environment variable.

CI uses `https://digiplain.invalid` only as a safe non-production build placeholder when no URL is configured. Production deployment is blocked until `SITE_URL` is set to a real HTTPS hostname.

For GitHub Actions, create a repository variable:

```text
SITE_URL=https://your-real-domain.example
```

Do this only after the production domain is owned and ready.

## Cloudflare

Build command:

```bash
npm run build
```

Deploy command:

```bash
npm run deploy
```

`npm run deploy` refuses to continue without a real HTTPS `SITE_URL`.

`wrangler.jsonc` serves `dist/` as static assets and invokes `src/publisher-worker.ts` only for `/api/telegram/*` requests.

## Publishing content manually

Add Markdown files to:

```text
src/content/articles/
```

The frontmatter schema is defined in `src/content.config.ts`.

## Publishing from Telegram

The Telegram publisher is implemented. It accepts `.md` documents or pasted Markdown, validates article frontmatter, and creates/updates `src/content/articles/<slug>.md` through the GitHub Contents API.

It also accepts PNG, JPG, WEBP, GIF and AVIF image documents for article screenshots and stores them under `public/uploads/YYYY/MM/`.

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

Every pull request and push to `main` validates:

```text
npm install
npm run check
npm run build
npm run deploy:dry-run
```

A successful push deploys automatically only when all three production values are configured:

```text
Repository variable: SITE_URL
Repository secret: CLOUDFLARE_API_TOKEN
Repository secret: CLOUDFLARE_ACCOUNT_ID
```

## Content model

Primary sections:

- Phones
- Apps
- Internet
- Nigeria
- Explained

Draft articles remain in Git but are excluded from generated public routes. Re-uploading the same slug updates the existing article, preserving a simple database-free editorial workflow.

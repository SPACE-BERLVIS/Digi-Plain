# DigiPlain

**Digital life, made simple.**

DigiPlain is a database-free, SEO-first static publication built with Astro. Content lives as Markdown in Git and is designed to be publishable later from a Telegram bot.

## Stack

- Astro 6
- Markdown content collections
- Static HTML output
- Cloudflare Workers Static Assets
- No database

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
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

The Worker serves the generated `dist` directory as static assets.

## Publishing content

Add Markdown files to:

```text
src/content/articles/
```

Use the frontmatter schema in `src/content.config.ts`.

The future Telegram publisher should write or update these Markdown files through the GitHub Contents API, then trigger the normal Cloudflare deployment.

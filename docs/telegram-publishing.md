# Telegram publishing

DigiPlain can publish Markdown and article screenshots without a database.

Flow:

```text
Telegram -> Cloudflare Worker -> GitHub Markdown/media -> GitHub Actions -> Cloudflare
```

The Worker accepts:

1. a `.md` Telegram document;
2. pasted Markdown that begins with YAML frontmatter; or
3. PNG, JPG, WEBP, GIF and AVIF images sent as Telegram documents.

The article slug becomes the GitHub filename, so sending the same slug again updates the existing article instead of creating a duplicate.

## 1. Create the Telegram bot

Create a bot with `@BotFather` and keep its token private.

For the simplest publishing setup, use a direct private chat with the bot. The Worker also supports private groups and channel posts.

Before setting the webhook, send `/start` to the bot and inspect the update to discover the chat ID.

PowerShell:

```powershell
$env:TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
npm run telegram:inspect
```

Copy the `chat_id` value. DigiPlain will ignore every other chat.

## 2. Create a GitHub token

Create a fine-grained GitHub personal access token restricted to the `SPACE-BERLVIS/Digi-Plain` repository.

Required repository permission:

- Contents: Read and write

The publisher does not need Issues, Pull Requests, Administration, Actions or other repository permissions.

## 3. Deploy the Worker/site

The Cloudflare Worker name is `digiplain`.

The same Worker serves the static Astro build and handles `/api/telegram/*`.

```bash
npm install
npm run check
npm run build
npm run deploy:dry-run
npm run deploy
```

The repo pins Wrangler so development, CI and production use the same deployment toolchain.

## 4. Add Worker secrets

Set these with Wrangler or in the Cloudflare dashboard:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put GITHUB_TOKEN
```

`TELEGRAM_WEBHOOK_SECRET` should be a random value containing only letters, numbers, `_` and `-`.

The non-secret GitHub repository settings are already defined in `wrangler.jsonc`:

```text
GITHUB_OWNER=SPACE-BERLVIS
GITHUB_REPO=Digi-Plain
GITHUB_BRANCH=main
```

## 5. Set the Telegram webhook

After the Worker has a public HTTPS URL, point Telegram to:

```text
https://YOUR_DOMAIN/api/telegram/webhook
```

PowerShell example:

```powershell
$env:TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
$env:TELEGRAM_WEBHOOK_SECRET="YOUR_RANDOM_SECRET"
$env:TELEGRAM_WEBHOOK_URL="https://YOUR_DOMAIN/api/telegram/webhook"
npm run telegram:set-webhook
```

The setup script subscribes to normal messages, edited messages, channel posts and edited channel posts.

## 6. Publish an article

Send a `.md` file with this shape:

```md
---
title: "How to Fix an Example Problem"
description: "A concise search description under 180 characters."
slug: "fix-example-problem"
category: "phones"
topic: "Android"
tags: ["android", "how-to"]
publishedAt: 2026-08-08
updatedAt: 2026-08-08
verifiedAt: 2026-08-08
evergreen: true
featured: false
status: "published"
author: "DigiPlain Editorial"
---

> **Quick answer:** Start with the direct solution.

Write the useful article here.
```

Allowed categories:

```text
phones
apps
internet
nigeria
explained
```

Use `status: "draft"` to store the Markdown in GitHub without generating a public article route.

## Upload article screenshots

Send an image **as a Telegram document** so Telegram does not unnecessarily recompress the source screenshot.

Supported formats:

```text
.png
.jpg / .jpeg
.webp
.gif
.avif
```

DigiPlain stores the file in a date-based static folder such as:

```text
public/uploads/2026/08/mtn-data-settings.webp
```

The bot replies with the public path and a ready-to-paste Markdown line:

```md
![Describe this image](/uploads/2026/08/mtn-data-settings.webp)
```

Images are capped at 4 MB. SVG uploads are intentionally not accepted by the Telegram publisher.

If an image with the same sanitized filename already exists in that month, sending it again updates that asset. Sending identical bytes creates no new GitHub commit.

## Updating an article

Send a new Markdown file using the same `slug`.

The publisher reads the current GitHub file, supplies its SHA when updating, and only creates a new commit when the Markdown actually changed.

To unpublish without deleting history, send the same article with:

```yaml
status: "draft"
```

To republish, change it back to:

```yaml
status: "published"
```

## Publisher commands

In a private chat or group:

```text
/help
/template
```

`/template` returns a valid starter article template.

## Security model

The publisher is intentionally fail-closed:

- Telegram webhook requests must contain the configured secret header.
- Only one configured Telegram chat is allowed to publish.
- Bot-authored messages are ignored.
- Article Markdown is validated before a GitHub write.
- Image formats and file sizes are restricted before media is written.
- SVG is not accepted through Telegram publishing.
- The GitHub token can be scoped only to DigiPlain content writes.
- Real secrets are never stored in the repository.

## Automatic deployment

`.github/workflows/ci.yml` validates every push and pull request with:

```text
Astro strict check
Astro production build
Cloudflare Worker dry-run bundle
```

If these GitHub repository secrets exist, a successful push to `main` also deploys to Cloudflare:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

If they are missing, CI still validates normally and skips deployment instead of failing.

That means a completed production publishing flow is:

```text
Send Markdown or screenshot in Telegram
-> Worker validates it
-> Worker commits it to GitHub
-> GitHub Actions validates and builds Astro
-> GitHub Actions validates the Worker bundle
-> GitHub Actions deploys the new static site to Cloudflare
```

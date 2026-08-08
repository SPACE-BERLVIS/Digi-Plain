# Telegram publishing

DigiPlain can publish Markdown without a database.

Flow:

```text
Telegram -> Cloudflare Worker -> GitHub Markdown -> GitHub Actions -> Cloudflare
```

The Worker accepts either:

1. a `.md` Telegram document; or
2. pasted Markdown that begins with YAML frontmatter.

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
npm run build
npm run deploy
```

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
- Only `.md` documents or pasted Markdown with frontmatter are accepted.
- Article frontmatter is checked before a GitHub write.
- The GitHub token can be scoped only to DigiPlain content writes.
- Real secrets are never stored in the repository.

## Automatic deployment

`.github/workflows/ci.yml` builds every push to `main`.

If these GitHub repository secrets exist, the same workflow deploys the successful build to Cloudflare:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

If they are missing, CI still builds normally and skips deployment instead of failing.

That means a completed production publishing flow is:

```text
Send Markdown in Telegram
-> Worker validates it
-> Worker commits it to GitHub
-> GitHub Actions builds Astro
-> GitHub Actions deploys the new static site to Cloudflare
```

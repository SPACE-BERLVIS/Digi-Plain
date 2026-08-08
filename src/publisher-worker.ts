type AssetFetcher = {
  fetch(input: Request): Promise<Response>;
};

type Env = {
  ASSETS: AssetFetcher;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  TELEGRAM_CHAT_ID: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
};

type TelegramDocument = {
  file_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  document?: TelegramDocument;
  chat: { id: number; type: string };
  from?: { id: number; is_bot?: boolean };
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};

const ARTICLE_PATH = 'src/content/articles';
const VALID_CATEGORIES = new Set(['phones', 'apps', 'internet', 'nigeria', 'explained']);
const MAX_MARKDOWN_BYTES = 1_000_000;

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const stripQuotes = (value: string) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

function extractFrontmatter(markdown: string) {
  const normalized = markdown.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error('Markdown must start with YAML frontmatter (---).');
  }

  const closing = normalized.indexOf('\n---\n', 4);
  if (closing === -1) {
    throw new Error('Frontmatter is missing its closing --- line.');
  }

  return {
    source: normalized,
    frontmatter: normalized.slice(4, closing),
    body: normalized.slice(closing + 5).trim(),
  };
}

function frontmatterValue(frontmatter: string, key: string) {
  const pattern = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = frontmatter.match(pattern);
  return match ? stripQuotes(match[1]) : undefined;
}

function validateArticle(markdown: string) {
  const { source, frontmatter, body } = extractFrontmatter(markdown);
  const title = frontmatterValue(frontmatter, 'title');
  const description = frontmatterValue(frontmatter, 'description');
  const slug = frontmatterValue(frontmatter, 'slug');
  const category = frontmatterValue(frontmatter, 'category');
  const topic = frontmatterValue(frontmatter, 'topic');
  const publishedAt = frontmatterValue(frontmatter, 'publishedAt');
  const updatedAt = frontmatterValue(frontmatter, 'updatedAt');
  const status = frontmatterValue(frontmatter, 'status') || 'published';

  const missing = [
    ['title', title],
    ['description', description],
    ['slug', slug],
    ['category', category],
    ['topic', topic],
    ['publishedAt', publishedAt],
    ['updatedAt', updatedAt],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length) throw new Error(`Missing frontmatter: ${missing.join(', ')}.`);
  if (title!.length > 120) throw new Error('title must be 120 characters or fewer.');
  if (description!.length > 180) throw new Error('description must be 180 characters or fewer.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug!)) {
    throw new Error('slug must use lowercase letters, numbers and single hyphens only.');
  }
  if (!VALID_CATEGORIES.has(category!)) {
    throw new Error(`category must be one of: ${[...VALID_CATEGORIES].join(', ')}.`);
  }
  if (!['published', 'draft'].includes(status)) throw new Error('status must be published or draft.');
  if (Number.isNaN(Date.parse(publishedAt!)) || Number.isNaN(Date.parse(updatedAt!))) {
    throw new Error('publishedAt and updatedAt must be valid dates.');
  }
  if (body.length < 80) throw new Error('Article body is too short; add a useful answer before publishing.');
  if (new TextEncoder().encode(source).byteLength > MAX_MARKDOWN_BYTES) {
    throw new Error('Markdown file is larger than the 1 MB publishing limit.');
  }

  return { source, slug: slug!, title: title!, status };
}

function base64Encode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64Decode(value: string) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function githubConfig(env: Env) {
  return {
    owner: env.GITHUB_OWNER || 'SPACE-BERLVIS',
    repo: env.GITHUB_REPO || 'Digi-Plain',
    branch: env.GITHUB_BRANCH || 'main',
  };
}

async function githubRequest(env: Env, path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'content-type': 'application/json',
      'user-agent': 'DigiPlain-Telegram-Publisher',
      'x-github-api-version': '2026-03-10',
      ...(init.headers || {}),
    },
  });
  return response;
}

async function upsertArticle(env: Env, markdown: string) {
  const article = validateArticle(markdown);
  const { owner, repo, branch } = githubConfig(env);
  const repoPath = `${ARTICLE_PATH}/${article.slug}.md`;
  const encodedPath = repoPath.split('/').map(encodeURIComponent).join('/');
  const contentUrl = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;

  let sha: string | undefined;
  const current = await githubRequest(env, contentUrl);

  if (current.ok) {
    const existing = await current.json() as { sha?: string; content?: string };
    sha = existing.sha;
    if (existing.content && base64Decode(existing.content) === article.source) {
      return { ...article, repoPath, unchanged: true };
    }
  } else if (current.status !== 404) {
    throw new Error(`GitHub read failed (${current.status}): ${await current.text()}`);
  }

  const putUrl = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
  const write = await githubRequest(env, putUrl, {
    method: 'PUT',
    body: JSON.stringify({
      message: `content: ${sha ? 'update' : 'publish'} ${article.slug} via Telegram`,
      branch,
      content: base64Encode(article.source),
      ...(sha ? { sha } : {}),
    }),
  });

  if (!write.ok) {
    throw new Error(`GitHub write failed (${write.status}): ${await write.text()}`);
  }

  return { ...article, repoPath, unchanged: false };
}

async function telegramApi(env: Env, method: string, payload: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json() as { ok: boolean; result?: unknown; description?: string };
  if (!response.ok || !data.ok) throw new Error(data.description || `Telegram ${method} failed.`);
  return data.result;
}

async function downloadTelegramMarkdown(env: Env, document: TelegramDocument) {
  const fileName = document.file_name || '';
  if (!fileName.toLowerCase().endsWith('.md')) throw new Error('Upload a .md Markdown document.');
  if (document.file_size && document.file_size > MAX_MARKDOWN_BYTES) {
    throw new Error('Markdown file is larger than the 1 MB publishing limit.');
  }

  const file = await telegramApi(env, 'getFile', { file_id: document.file_id }) as { file_path?: string };
  if (!file.file_path) throw new Error('Telegram did not return a downloadable file path.');

  const response = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`);
  if (!response.ok) throw new Error(`Could not download Markdown from Telegram (${response.status}).`);
  return response.text();
}

async function sendFeedback(env: Env, message: TelegramMessage, text: string) {
  if (message.chat.type === 'channel') return;
  await telegramApi(env, 'sendMessage', {
    chat_id: message.chat.id,
    text,
    reply_to_message_id: message.message_id,
  });
}

const template = `---
title: "Your article title"
description: "A concise search description under 180 characters."
slug: "your-article-slug"
category: "phones"
topic: "Android"
tags: ["android", "how-to"]
publishedAt: 2026-08-08
updatedAt: 2026-08-08
verifiedAt: 2026-08-08
evergreen: true
featured: false
status: "draft"
author: "DigiPlain Editorial"
---

> **Quick answer:** Put the direct answer here.

Write the useful article here.
`;

async function handleTelegram(request: Request, env: Env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET || !env.TELEGRAM_CHAT_ID || !env.GITHUB_TOKEN) {
    return json({ ok: false, error: 'Publisher secrets are not configured.' }, 503);
  }

  if (request.headers.get('x-telegram-bot-api-secret-token') !== env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ ok: false, error: 'Unauthorized webhook.' }, 401);
  }

  const update = await request.json() as TelegramUpdate;
  const message = update.edited_channel_post || update.channel_post || update.edited_message || update.message;
  if (!message || message.from?.is_bot) return json({ ok: true, ignored: true });
  if (String(message.chat.id) !== String(env.TELEGRAM_CHAT_ID)) {
    return json({ ok: true, ignored: true, reason: 'chat-not-allowed' });
  }

  try {
    const text = message.text?.trim();
    if (text === '/help' || text === '/start') {
      await sendFeedback(env, message, 'DigiPlain publisher: send a .md file with valid frontmatter, or paste Markdown beginning with ---. Use /template for the required fields.');
      return json({ ok: true, command: 'help' });
    }
    if (text === '/template') {
      await sendFeedback(env, message, template);
      return json({ ok: true, command: 'template' });
    }

    let markdown: string;
    if (message.document) markdown = await downloadTelegramMarkdown(env, message.document);
    else if (text?.startsWith('---')) markdown = message.text!;
    else {
      await sendFeedback(env, message, 'Nothing published. Send a .md file or paste Markdown that begins with YAML frontmatter (---).');
      return json({ ok: true, ignored: true, reason: 'unsupported-message' });
    }

    const result = await upsertArticle(env, markdown);
    const action = result.unchanged ? 'Already current' : result.status === 'draft' ? 'Draft saved' : 'Published';
    await sendFeedback(env, message, `✅ ${action}: ${result.title}\n/${result.repoPath}`);
    return json({ ok: true, article: result.slug, status: result.status, unchanged: result.unchanged });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown publisher error.';
    try { await sendFeedback(env, message, `❌ Not published: ${detail}`); } catch { /* keep webhook response useful */ }
    return json({ ok: false, error: detail }, 422);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/telegram/health') {
      return json({ ok: true, service: 'digiplain-publisher' });
    }

    if (url.pathname === '/api/telegram/webhook') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
      return handleTelegram(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

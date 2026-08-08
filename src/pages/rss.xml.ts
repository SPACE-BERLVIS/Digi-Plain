import { getCollection } from 'astro:content';

const escapeXml = (s: string) => s.replace(/[<>&'\"]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', "'":'&apos;', '"':'&quot;' }[c] || c));

export async function GET({ site }) {
  const base = site?.toString().replace(/\/$/, '') || 'https://digiplain.com';
  const articles = (await getCollection('articles', ({ data }) => data.status === 'published')).sort((a,b) => b.data.updatedAt.valueOf() - a.data.updatedAt.valueOf());
  const items = articles.map(({ data }) => `<item><title>${escapeXml(data.title)}</title><link>${base}/${data.category}/${data.slug}/</link><guid>${base}/${data.category}/${data.slug}/</guid><description>${escapeXml(data.description)}</description><pubDate>${data.publishedAt.toUTCString()}</pubDate></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>DigiPlain</title><link>${base}</link><description>Digital life, made simple.</description>${items}</channel></rss>`, { headers:{ 'Content-Type':'application/rss+xml; charset=utf-8' } });
}

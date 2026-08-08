import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

function wrapTitle(title: string, max = 30) {
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= max || current.length === 0) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

export const getStaticPaths = (async () => {
  const articles = await getCollection('articles', ({ data }) => data.status === 'published');
  return articles.map((article) => ({
    params: { slug: article.data.slug },
    props: {
      title: article.data.title,
      topic: article.data.topic,
      category: article.data.category,
    },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const title = String(props.title || 'DigiPlain guide');
  const topic = String(props.topic || 'Guide');
  const category = String(props.category || 'explained');
  const lines = wrapTitle(title);
  const lineHeight = 74;
  const startY = 245 - Math.max(0, lines.length - 2) * 26;

  const titleSvg = lines
    .map((line, index) => `<text x="82" y="${startY + index * lineHeight}" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`)
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111318"/>
      <stop offset="1" stop-color="#3157f6"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="18%" r="62%">
      <stop offset="0" stop-color="#9fb1ff" stop-opacity=".55"/>
      <stop offset="1" stop-color="#9fb1ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" rx="30" fill="url(#bg)"/>
  <rect width="1200" height="630" rx="30" fill="url(#glow)"/>
  <circle cx="1055" cy="82" r="190" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="2"/>
  <circle cx="1055" cy="82" r="130" fill="none" stroke="#ffffff" stroke-opacity=".10" stroke-width="2"/>
  <circle cx="1055" cy="82" r="70" fill="#ffffff" fill-opacity=".08"/>
  <text x="82" y="78" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="3" fill="#b9c5ff">DIGIPLAIN · ${escapeXml(category.toUpperCase())}</text>
  <text x="82" y="130" font-family="Inter, Arial, sans-serif" font-size="27" font-weight="700" fill="#ffffff" fill-opacity=".78">${escapeXml(topic)}</text>
  ${titleSvg}
  <line x1="82" y1="548" x2="1118" y2="548" stroke="#ffffff" stroke-opacity=".20"/>
  <text x="82" y="590" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600" fill="#ffffff" fill-opacity=".72">Digital life, made simple.</text>
  <text x="1118" y="590" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">digiplain.berlvis.com</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
};

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

const themes: Record<string, { start: string; end: string; accent: string; label: string }> = {
  phones: { start: '#0f172a', end: '#3157f6', accent: '#93c5fd', label: 'DEVICE HELP' },
  apps: { start: '#24133f', end: '#6d28d9', accent: '#d8b4fe', label: 'APP GUIDES' },
  internet: { start: '#0b1f2d', end: '#0f766e', accent: '#67e8f9', label: 'STAY CONNECTED' },
  nigeria: { start: '#10241b', end: '#157347', accent: '#86efac', label: 'LOCAL GUIDES' },
  explained: { start: '#2a1d0e', end: '#b45309', accent: '#fcd34d', label: 'EXPLAINED' },
};

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function decoration(category: string, accent: string, seed: number) {
  const shift = (seed % 70) - 35;

  if (category === 'phones') {
    return `
      <rect x="914" y="108" width="176" height="348" rx="32" fill="none" stroke="${accent}" stroke-opacity=".56" stroke-width="5" transform="rotate(${shift / 8} 1002 282)"/>
      <rect x="950" y="145" width="104" height="245" rx="14" fill="#ffffff" fill-opacity=".07" transform="rotate(${shift / 8} 1002 282)"/>
      <circle cx="1003" cy="420" r="10" fill="${accent}" fill-opacity=".75"/>
    `;
  }

  if (category === 'apps') {
    return `
      <g transform="translate(${930 + shift} 130) rotate(${shift / 10} 120 120)">
        <rect x="0" y="0" width="94" height="94" rx="25" fill="${accent}" fill-opacity=".24"/>
        <rect x="112" y="0" width="94" height="94" rx="25" fill="#ffffff" fill-opacity=".10"/>
        <rect x="0" y="112" width="94" height="94" rx="25" fill="#ffffff" fill-opacity=".10"/>
        <rect x="112" y="112" width="94" height="94" rx="25" fill="${accent}" fill-opacity=".18"/>
      </g>
    `;
  }

  if (category === 'internet') {
    return `
      <circle cx="1030" cy="280" r="164" fill="none" stroke="${accent}" stroke-opacity=".16" stroke-width="8"/>
      <circle cx="1030" cy="280" r="112" fill="none" stroke="${accent}" stroke-opacity=".30" stroke-width="8"/>
      <circle cx="1030" cy="280" r="58" fill="none" stroke="${accent}" stroke-opacity=".50" stroke-width="8"/>
      <circle cx="1030" cy="280" r="13" fill="${accent}"/>
    `;
  }

  if (category === 'nigeria') {
    return `
      <g transform="translate(${914 + shift} 118)">
        <rect x="0" y="0" width="250" height="310" rx="34" fill="#ffffff" fill-opacity=".06"/>
        <path d="M35 74H215M35 137H215M35 200H215M35 263H215M83 34V276M166 34V276" stroke="${accent}" stroke-opacity=".28" stroke-width="3"/>
        <rect x="87" y="141" width="75" height="55" rx="12" fill="${accent}" fill-opacity=".55"/>
      </g>
    `;
  }

  return `
    <circle cx="1020" cy="260" r="160" fill="#ffffff" fill-opacity=".06"/>
    <circle cx="1020" cy="260" r="114" fill="none" stroke="${accent}" stroke-opacity=".35" stroke-width="3"/>
    <path d="M990 217c8-35 68-38 86-8 18 31-3 53-31 68-22 12-27 26-27 46" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
    <circle cx="1018" cy="359" r="11" fill="${accent}"/>
  `;
}

export const getStaticPaths = (async () => {
  const articles = await getCollection('articles', ({ data }) => data.status === 'published');
  return articles.map((article) => ({
    params: { slug: article.data.slug },
    props: {
      slug: article.data.slug,
      title: article.data.title,
      topic: article.data.topic,
      category: article.data.category,
    },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const slug = String(props.slug || 'guide');
  const title = String(props.title || 'DigiPlain guide');
  const topic = String(props.topic || 'Guide');
  const category = String(props.category || 'explained');
  const theme = themes[category] || themes.explained;
  const lines = wrapTitle(title);
  const lineHeight = 72;
  const startY = 238 - Math.max(0, lines.length - 2) * 24;
  const seed = hashString(slug);

  const titleSvg = lines
    .map((line, index) => `<text x="82" y="${startY + index * lineHeight}" font-family="Inter, Arial, sans-serif" font-size="57" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`)
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.start}"/>
      <stop offset="1" stop-color="${theme.end}"/>
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="16%" r="64%">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity=".30"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" rx="30" fill="url(#bg)"/>
  <rect width="1200" height="630" rx="30" fill="url(#glow)"/>
  ${decoration(category, theme.accent, seed)}
  <text x="82" y="72" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="3" fill="${theme.accent}">DIGIPLAIN · ${escapeXml(theme.label)}</text>
  <text x="82" y="121" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" fill-opacity=".78">${escapeXml(topic)}</text>
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

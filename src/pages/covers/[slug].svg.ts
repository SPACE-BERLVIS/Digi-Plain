import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const themes: Record<string, { bg: string; panel: string; accent: string; label: string }> = {
  phones: { bg: '#121827', panel: '#1b2440', accent: '#8aa4ff', label: 'PHONES' },
  apps: { bg: '#171221', panel: '#241a32', accent: '#bd9cff', label: 'APPS' },
  internet: { bg: '#102326', panel: '#173638', accent: '#75c9c1', label: 'INTERNET' },
  nigeria: { bg: '#13231b', panel: '#1c3427', accent: '#79c99c', label: 'NIGERIA' },
  explained: { bg: '#241b13', panel: '#38291c', accent: '#d9aa68', label: 'EXPLAINED' },
};

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function shortLabel(value: string, max = 30) {
  const clean = value.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function decoration(category: string, accent: string, panel: string, seed: number) {
  const drift = (seed % 70) - 35;

  if (category === 'phones') {
    return `
      <rect x="858" y="118" width="210" height="376" rx="38" fill="${panel}" transform="rotate(${drift / 14} 963 306)"/>
      <rect x="892" y="154" width="142" height="278" rx="24" fill="none" stroke="${accent}" stroke-opacity=".42" stroke-width="4" transform="rotate(${drift / 14} 963 306)"/>
      <circle cx="963" cy="458" r="9" fill="${accent}" fill-opacity=".62"/>
    `;
  }

  if (category === 'apps') {
    return `
      <g transform="translate(${842 + drift} 152)">
        <rect x="0" y="0" width="116" height="116" rx="31" fill="${panel}"/>
        <rect x="136" y="0" width="116" height="116" rx="31" fill="none" stroke="${accent}" stroke-opacity=".34" stroke-width="4"/>
        <rect x="0" y="136" width="116" height="116" rx="31" fill="none" stroke="${accent}" stroke-opacity=".24" stroke-width="4"/>
        <rect x="136" y="136" width="116" height="116" rx="31" fill="${panel}"/>
      </g>
    `;
  }

  if (category === 'internet') {
    return `
      <circle cx="974" cy="304" r="188" fill="${panel}"/>
      <circle cx="974" cy="304" r="136" fill="none" stroke="${accent}" stroke-opacity=".20" stroke-width="5"/>
      <circle cx="974" cy="304" r="82" fill="none" stroke="${accent}" stroke-opacity=".34" stroke-width="5"/>
      <circle cx="974" cy="304" r="18" fill="${accent}" fill-opacity=".70"/>
    `;
  }

  if (category === 'nigeria') {
    return `
      <g transform="translate(${846 + drift} 130)">
        <rect x="0" y="0" width="266" height="344" rx="44" fill="${panel}"/>
        <path d="M36 79H230M36 148H230M36 217H230M36 286H230M91 35V309M176 35V309" stroke="${accent}" stroke-opacity=".22" stroke-width="3"/>
        <rect x="98" y="154" width="70" height="58" rx="13" fill="${accent}" fill-opacity=".46"/>
      </g>
    `;
  }

  return `
    <circle cx="968" cy="302" r="184" fill="${panel}"/>
    <circle cx="968" cy="302" r="124" fill="none" stroke="${accent}" stroke-opacity=".28" stroke-width="4"/>
    <path d="M934 247c10-39 76-44 97-10 20 34-4 59-35 75-25 13-30 30-30 52" fill="none" stroke="${accent}" stroke-opacity=".56" stroke-width="17" stroke-linecap="round"/>
    <circle cx="966" cy="405" r="10" fill="${accent}" fill-opacity=".68"/>
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
  const title = String(props.title || 'Sabi Update guide');
  const topic = shortLabel(String(props.topic || 'Guide'));
  const category = String(props.category || 'explained');
  const theme = themes[category] || themes.explained;
  const seed = hashString(slug);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
  <rect width="1200" height="630" rx="28" fill="${theme.bg}"/>
  <rect x="54" y="50" width="1092" height="3" rx="2" fill="${theme.accent}" fill-opacity=".72"/>
  <circle cx="1128" cy="52" r="7" fill="${theme.accent}"/>

  ${decoration(category, theme.accent, theme.panel, seed)}

  <text x="72" y="104" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="1.8" fill="#f6f7fb">Sabi Update</text>
  <text x="72" y="154" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="2.6" fill="${theme.accent}">${escapeXml(theme.label)}</text>

  <text x="72" y="314" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="700" letter-spacing="-2" fill="#f6f7fb">${escapeXml(theme.label)}</text>
  <text x="72" y="368" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="600" fill="#b7bdc8">${escapeXml(topic)}</text>

  <line x1="72" y1="516" x2="748" y2="516" stroke="#ffffff" stroke-opacity=".12"/>
  <text x="72" y="562" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="1.7" fill="#c7ccd5">SABI UPDATE PRACTICAL GUIDE</text>
  <text x="72" y="594" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="500" fill="#9198a5">Answer first. Get on with your day.</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
};

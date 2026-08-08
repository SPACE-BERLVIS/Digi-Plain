import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET({ site }: APIContext) {
  const base = site?.toString().replace(/\/$/, '') || 'https://digiplain.invalid';
  const articles = await getCollection('articles', ({ data }) => data.status === 'published');
  const staticPaths = ['/', '/phones/', '/apps/', '/internet/', '/nigeria/', '/explained/', '/about/', '/editorial-policy/', '/corrections/', '/contact/', '/privacy/', '/terms/'];
  const urls = [
    ...staticPaths.map(path => ({ loc:`${base}${path}`, lastmod:null as string | null })),
    ...articles.map(({ data }) => ({ loc:`${base}/${data.category}/${data.slug}/`, lastmod:data.updatedAt.toISOString() }))
  ];
  const xml = urls.map(u => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xml}</urlset>`, { headers:{ 'Content-Type':'application/xml; charset=utf-8' } });
}

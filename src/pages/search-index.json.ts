import { getCollection } from 'astro:content';

export async function GET() {
  const articles = await getCollection('articles', ({ data }) => data.status === 'published');
  const body = articles.map(({ data }) => ({
    title: data.title,
    description: data.description,
    category: data.category,
    topic: data.topic,
    tags: data.tags,
    url: `/${data.category}/${data.slug}/`
  }));
  return new Response(JSON.stringify(body), { headers:{ 'Content-Type':'application/json; charset=utf-8' } });
}

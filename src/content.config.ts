import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(180),
    slug: z.string(),
    category: z.enum(['phones', 'apps', 'internet', 'nigeria', 'explained']),
    topic: z.string(),
    tags: z.array(z.string()).default([]),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    verifiedAt: z.coerce.date().optional(),
    evergreen: z.boolean().default(true),
    featured: z.boolean().default(false),
    status: z.enum(['published', 'draft']).default('published'),
    author: z.string().default('DigiPlain Editorial'),
    sourceNote: z.string().optional()
  })
});

export const collections = { articles };

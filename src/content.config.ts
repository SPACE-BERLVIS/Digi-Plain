import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
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
    featuredImage: z.string().startsWith('/uploads/').optional(),
    featuredImageAlt: z.string().min(1).max(180).optional(),
    status: z.enum(['published', 'draft']).default('published'),
    author: z.string().default('DigiPlain Editorial'),
    sourceNote: z.string().optional()
  }).superRefine((data, ctx) => {
    if (data.featuredImage && !data.featuredImageAlt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['featuredImageAlt'],
        message: 'featuredImageAlt is required when featuredImage is set.'
      });
    }
    if (data.featuredImageAlt && !data.featuredImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['featuredImage'],
        message: 'featuredImage is required when featuredImageAlt is set.'
      });
    }
  })
});

export const collections = { articles };

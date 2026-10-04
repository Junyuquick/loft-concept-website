import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      sector: z.enum(['residential', 'commercial']),
      propertyType: z.enum(['hdb', 'condo', 'landed', 'commercial']).optional(),
      location: z.string().optional(),
      area: z.string().optional(),
      year: z.number().int().optional(),
      scope: z.string().optional(),
      summary: z.string().min(20),
      cover: image(),
      coverAlt: z.string().optional(),
      coverPosition: z.string().default('50% 50%'),
      hero: image(),
      heroAlt: z.string().optional(),
      gallery: z.array(image()).default([]),
      video: z.string().optional(),
      featured: z.boolean().default(false),
      order: z.number().int(),
    }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/testimonials' }),
  schema: z.object({
    quote: z.string(),
    author: z.string(),
    projectSlug: z.string().optional(),
    projectLabel: z.string(),
    order: z.number().int(),
  }),
});

export const collections = { projects, testimonials };

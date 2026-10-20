import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { guidePath, guideSchema, guides } from './guides';

describe('guides', () => {
  it('has a unique slug, title and description per guide', () => {
    for (const key of ['slug', 'title', 'description'] as const) {
      expect(new Set(guides.map((g) => g[key])).size).toBe(guides.length);
    }
  });
  it('keeps every Google description within 160 characters', () => {
    for (const g of guides) expect(g.description.length).toBeLessThanOrEqual(160);
  });
  it('has a page file for every guide', () => {
    for (const g of guides) expect(existsSync(`src/pages/guides/${g.slug}.astro`)).toBe(true);
  });
  it('uses real, ordered dates', () => {
    for (const g of guides) {
      expect(Number.isNaN(Date.parse(g.published))).toBe(false);
      expect(Date.parse(g.reviewed)).toBeGreaterThanOrEqual(Date.parse(g.published));
    }
  });
  it('never publishes a price', () => {
    expect(JSON.stringify(guides)).not.toMatch(/\$|S\$|\bSGD\b/i);
  });
  it('describes each guide as an Article with a breadcrumb', () => {
    for (const g of guides) {
      const graph = guideSchema(g)['@graph'] as any[];
      expect(graph.map((n) => n['@type'])).toEqual(['Article', 'BreadcrumbList']);
      expect(graph[0].mainEntityOfPage).toContain(guidePath(g));
      expect(graph[0].author).toMatchObject({ '@type': 'Person', name: 'Quick Ming Jun', jobTitle: 'Lead Designer' });
    }
  });
});

import { describe, expect, it } from 'vitest';
import { servicePath, serviceSchema, services } from './services';

describe('service pages', () => {
  it('has a unique slug, title and description per page', () => {
    for (const key of ['slug', 'title', 'description'] as const) {
      expect(new Set(services.map((s) => s[key])).size).toBe(services.length);
    }
  });
  it('keeps every Google description within 160 characters', () => {
    for (const s of services) expect(s.description.length).toBeLessThanOrEqual(160);
  });
  it('never publishes a price', () => {
    const text = JSON.stringify(services);
    expect(text).not.toMatch(/\$|S\$|\bSGD\b|\bfrom \d/i);
  });
  it('serves each page from the site root', () => {
    for (const s of services) expect(servicePath(s)).toBe(`/${s.slug}`);
  });
  it('describes the service and every FAQ question in its structured data', () => {
    for (const s of services) {
      const graph = (serviceSchema(s)['@graph'] as any[]);
      expect(graph.map((g) => g['@type'])).toEqual(['Service', 'FAQPage']);
      expect(graph[1].mainEntity).toHaveLength(s.faq.length);
    }
  });
});

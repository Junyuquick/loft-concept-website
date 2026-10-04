import { describe, expect, it } from 'vitest';
import { localBusinessSchema } from './schema';

describe('localBusinessSchema', () => {
  const s = localBusinessSchema() as Record<string, unknown>;
  it('describes the business with real contact details', () => {
    expect(s['@type']).toBe('HomeAndConstructionBusiness');
    expect(s.name).toBe('Loft Concept');
    expect(s.foundingDate).toBe('2010');
    expect(s.telephone).toBe('+65 8533 7311');
    expect(s.email).toBe('loftconceptsg@gmail.com');
    expect(s.areaServed).toBe('Singapore');
  });
  it('links social profiles and a logo', () => {
    expect(s.sameAs).toEqual(['https://www.facebook.com/loftconceptsg', 'https://www.instagram.com/loftconcept.sg/']);
    expect(s.logo).toBe('https://loftconcept.com.sg/apple-touch-icon.png');
  });
});

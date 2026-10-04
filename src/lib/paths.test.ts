import { describe, expect, it } from 'vitest';
import { cleanPath } from './paths';

describe('cleanPath', () => {
  it('drops the .html that build.format "file" adds to Astro.url', () => {
    expect(cleanPath('/index.html')).toBe('/');
    expect(cleanPath('/portfolio.html')).toBe('/portfolio');
    expect(cleanPath('/portfolio/jalan-lana.html')).toBe('/portfolio/jalan-lana');
  });
  it('leaves clean paths alone and drops a trailing slash', () => {
    expect(cleanPath('/')).toBe('/');
    expect(cleanPath('/about')).toBe('/about');
    expect(cleanPath('/about/')).toBe('/about');
  });
});

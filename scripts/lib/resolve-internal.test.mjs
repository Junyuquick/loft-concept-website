import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveInternal } from './resolve-internal.mjs';

const dist = mkdtempSync(join(tmpdir(), 'dist-'));
writeFileSync(join(dist, 'index.html'), '');
writeFileSync(join(dist, 'about.html'), '');
mkdirSync(join(dist, 'portfolio'));
writeFileSync(join(dist, 'portfolio', 'jalan-lana.html'), '');
writeFileSync(join(dist, 'portfolio.html'), '');

describe('resolveInternal', () => {
  it('resolves clean URLs to .html files', () => {
    expect(resolveInternal(dist, '/')).toBe(true);
    expect(resolveInternal(dist, '/about')).toBe(true);
    expect(resolveInternal(dist, '/portfolio/jalan-lana')).toBe(true);
  });
  it('ignores query strings and fragments', () => {
    expect(resolveInternal(dist, '/portfolio?sector=commercial')).toBe(true);
    expect(resolveInternal(dist, '/#process')).toBe(true);
  });
  it('reports missing pages', () => {
    expect(resolveInternal(dist, '/nope')).toBe(false);
  });
  it('returns null for external, mailto and tel links', () => {
    expect(resolveInternal(dist, 'https://example.com/x')).toBeNull();
    expect(resolveInternal(dist, 'mailto:a@b.sg')).toBeNull();
    expect(resolveInternal(dist, 'tel:+6585337311')).toBeNull();
    expect(resolveInternal(dist, '//cdn.example.com/x.js')).toBeNull();
  });
});

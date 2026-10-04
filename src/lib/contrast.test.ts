import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { tokens } from './tokens';

describe('brand contrast', () => {
  it('umber on bone passes AA for body text', () => {
    expect(contrastRatio(tokens.umber, tokens.bone)).toBeGreaterThanOrEqual(7);
  });
  it('ink on bone passes AAA for headings', () => {
    expect(contrastRatio(tokens.ink, tokens.bone)).toBeGreaterThanOrEqual(12);
  });
  it('white on umber passes AAA for button and footer text', () => {
    expect(contrastRatio(tokens.white, tokens.umber)).toBeGreaterThanOrEqual(7);
  });
  it('stone on umber passes only for large text', () => {
    expect(contrastRatio(tokens.stone, tokens.umber)).toBeGreaterThanOrEqual(3);
  });
  it('stone on bone is decorative only', () => {
    expect(contrastRatio(tokens.stone, tokens.bone)).toBeLessThan(3);
  });
  it('tokens.css declares every token with the same value', () => {
    const css = readFileSync('src/styles/tokens.css', 'utf8').toLowerCase();
    for (const [name, hex] of Object.entries(tokens)) {
      expect(css).toContain(`--${name}: ${hex.toLowerCase()}`);
    }
  });
});

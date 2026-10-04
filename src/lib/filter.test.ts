import { describe, expect, it } from 'vitest';
import { matchesSector, parseSector } from './filter';

describe('parseSector', () => {
  it('defaults to all', () => {
    expect(parseSector('')).toBe('all');
    expect(parseSector('?sector=')).toBe('all');
    expect(parseSector('?sector=bogus')).toBe('all');
  });
  it('reads valid sectors', () => {
    expect(parseSector('?sector=commercial')).toBe('commercial');
    expect(parseSector('?utm=x&sector=residential')).toBe('residential');
  });
});

describe('matchesSector', () => {
  it('matches everything for all', () => {
    expect(matchesSector('commercial', 'all')).toBe(true);
  });
  it('matches only the chosen sector', () => {
    expect(matchesSector('commercial', 'commercial')).toBe(true);
    expect(matchesSector('residential', 'commercial')).toBe(false);
  });
});

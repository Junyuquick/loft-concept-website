import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = 'src/content/testimonials';
const field = (src: string, key: string) => JSON.parse(src.match(new RegExp(`^${key}: (".*")$`, 'm'))?.[1] ?? 'null');

describe('testimonial highlights', () => {
  for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
    it(`${file}: highlight is quoted verbatim from the client's words`, () => {
      const src = readFileSync(join(DIR, file), 'utf8');
      const highlight = field(src, 'highlight');
      expect(highlight).toBeTypeOf('string');
      expect(field(src, 'quote')).toContain(highlight);
    });
  }
});

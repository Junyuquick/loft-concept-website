import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const DIR = 'src/content/testimonials';

// The admin rewrites these files in its own YAML style, so parse them rather than match text.
describe('testimonial highlights', () => {
  for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
    it(`${file}: highlight, when present, is quoted verbatim from the client's words`, () => {
      const data = parse(readFileSync(join(DIR, file), 'utf8').split('---')[1]);
      expect(data.quote).toBeTypeOf('string');
      if (data.highlight !== undefined) expect(data.quote).toContain(data.highlight);
    });
  }
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('robots.txt', () => {
  const robots = readFileSync('public/robots.txt', 'utf8');
  // Staging deploys into public_html/staging, so it is also reachable at loftconcept.com.sg/staging/.
  it('keeps the staging copy under the live domain out of search engines', () => {
    expect(robots).toMatch(/^Disallow: \/staging\/$/m);
  });
  it('still lets search engines crawl the live site', () => {
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).not.toMatch(/^Disallow: \/$/m);
  });
});

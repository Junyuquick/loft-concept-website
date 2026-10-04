import { describe, expect, it } from 'vitest';
import { buildRedirects, renderApache, renderCloudflare } from './redirects.mjs';

const list = buildRedirects(['jalan-lana', 'mimosa']);

describe('buildRedirects', () => {
  it('maps legacy project URLs, with and without .html', () => {
    expect(list).toContainEqual({ from: '/projects/project-jalan-lana', to: '/portfolio/jalan-lana', status: 301 });
    expect(list).toContainEqual({ from: '/projects/project-jalan-lana.html', to: '/portfolio/jalan-lana', status: 301 });
  });
  it('maps pages, index, thankyou and sitemap', () => {
    const froms = list.map((r) => r.from);
    expect(froms).toEqual(expect.arrayContaining(['/about.html', '/portfolio.html', '/testimonials.html', '/contact.html', '/index', '/index.html', '/thankyou', '/thankyou.html', '/sitemap', '/sitemap.xml']));
  });
  it('has exactly 14 rules for 2 projects', () => {
    expect(list).toHaveLength(14);
  });
});

describe('renderCloudflare', () => {
  const out = renderCloudflare(list);
  it('emits a line per rule and a trailing-slash variant', () => {
    expect(out).toContain('/projects/project-jalan-lana /portfolio/jalan-lana 301');
    expect(out).toContain('/projects/project-jalan-lana/ /portfolio/jalan-lana 301');
    expect(out).toContain('/thankyou /thank-you 301');
  });
});

describe('renderApache', () => {
  const out = renderApache(list);
  it('uses anchored RedirectMatch so /sitemap does not swallow /sitemap-index.xml', () => {
    expect(out).toContain('RedirectMatch 301 ^/sitemap/?$ /sitemap-index.xml');
    expect(out).toContain('RedirectMatch 301 ^/projects/project-jalan-lana\\.html/?$ /portfolio/jalan-lana');
  });
  it('keeps clean-URL serving and the 404 page', () => {
    expect(out).toContain('RewriteRule ^(.+?)/?$ $1.html [L]');
    expect(out).toContain('ErrorDocument 404 /404.html');
  });
});

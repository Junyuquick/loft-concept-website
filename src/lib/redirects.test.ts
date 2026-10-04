import { describe, expect, it } from 'vitest';
import { buildRedirects, legacyProjectSlugs, renderApache, renderCloudflare } from './redirects.mjs';

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

describe('deleted launch projects', () => {
  const after = buildRedirects(['mimosa'], ['jalan-lana', 'mimosa']);
  it('sends the old address of a deleted project to the portfolio', () => {
    expect(after).toContainEqual({ from: '/projects/project-jalan-lana', to: '/portfolio', status: 301 });
    expect(after).toContainEqual({ from: '/projects/project-jalan-lana.html', to: '/portfolio', status: 301 });
  });
  it('keeps old addresses of remaining projects pointing at their pages', () => {
    expect(after).toContainEqual({ from: '/projects/project-mimosa', to: '/portfolio/mimosa', status: 301 });
  });
  it('reads launch project slugs from the legacy sitemap', () => {
    const xml = '<loc>https://loftconcept.com.sg/about</loc><loc>https://loftconcept.com.sg/projects/project-jalan-lana</loc><loc>https://loftconcept.com.sg/projects/project-ernani-street-ii</loc>';
    expect(legacyProjectSlugs(xml)).toEqual(['jalan-lana', 'ernani-street-ii']);
  });
});

describe('renderCloudflare', () => {
  const out = renderCloudflare(list);
  it('emits a line per rule and a trailing-slash variant', () => {
    expect(out).toContain('/projects/project-jalan-lana /portfolio/jalan-lana 301');
    expect(out).toContain('/projects/project-jalan-lana/ /portfolio/jalan-lana 301');
    expect(out).toContain('/thankyou /thank-you 301');
  });
  it('sends /admin to /admin/ without looping on /admin/', () => {
    expect(out).toContain('/admin /admin/ 301');
    expect(out).not.toContain('/admin/ /admin/');
  });
});

describe('renderApache', () => {
  const out = renderApache(list);
  const firstRedirect = out.indexOf('[R=301');
  it('redirects only the visitor request, never Apache internal rewrites (prevents loops)', () => {
    expect(out).toContain('RewriteCond %{ENV:REDIRECT_STATUS} !^$');
    expect(out.indexOf('RewriteCond %{ENV:REDIRECT_STATUS} !^$')).toBeLessThan(firstRedirect);
    expect(out).not.toContain('RedirectMatch');
  });
  it('maps legacy URLs with anchored rewrite rules', () => {
    expect(out).toContain('RewriteRule ^sitemap/?$ /sitemap-index.xml [R=301,L]');
    expect(out).toContain('RewriteRule ^projects/project-jalan-lana\\.html/?$ /portfolio/jalan-lana [R=301,L]');
    expect(out).toContain('RewriteRule ^index\\.html/?$ / [R=301,L]');
  });
  it('sends http and www to the canonical https host, on the live domain only', () => {
    expect(out).toContain('RewriteCond %{HTTP_HOST} ^(www\\.)?loftconcept\\.com\\.sg$ [NC]');
    expect(out).toContain('RewriteRule ^ https://loftconcept.com.sg%{REQUEST_URI} [R=301,L]');
  });
  it('serves /portfolio from portfolio.html even though a portfolio/ folder exists', () => {
    expect(out).toContain('DirectorySlash Off');
    expect(out).toContain('Options -MultiViews -Indexes');
    expect(out).toContain('RewriteRule ^(.+)$ $1.html [L]');
  });
  it('keeps the 404 page', () => {
    expect(out).toContain('ErrorDocument 404 /404.html');
  });
  it('sends /admin to /admin/ so the CMS folder index loads despite DirectorySlash Off', () => {
    expect(out).toContain('RewriteRule ^admin$ /admin/ [R=301,L]');
    expect(out.indexOf('RewriteRule ^admin$')).toBeLessThan(out.indexOf('RewriteRule ^(.+)$ $1.html [L]'));
  });
});

// Checks status codes and redirects on a running server, without following redirects.
// Local Apache: node scripts/verify-server.mjs   Live site: BASE_URL=https://loftconcept.com.sg node scripts/verify-server.mjs
import http from 'node:http';
import https from 'node:https';

const BASE = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:8088');
const LIVE = BASE.hostname === 'loftconcept.com.sg';

function get(path, host = BASE.host) {
  const lib = BASE.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request({ hostname: BASE.hostname, port: BASE.port, path, method: 'GET', headers: { Host: host } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location ?? '', body }));
    });
    req.on('error', reject);
    req.end();
  });
}

const pages = ['/', '/about', '/portfolio', '/portfolio/jalan-lana', '/portfolio/mimosa', '/testimonials', '/contact', '/thank-you', '/privacy',
  '/sitemap-index.xml', '/robots.txt', '/videos/hero.mp4', '/textures/paper.jpg'];
const redirects = [
  ['/index.html', '/'], ['/index', '/'],
  ['/about.html', '/about'], ['/about/', '/about'],
  ['/portfolio/', '/portfolio'], ['/portfolio.html', '/portfolio'], ['/portfolio/jalan-lana/', '/portfolio/jalan-lana'],
  ['/projects/project-jalan-lana', '/portfolio/jalan-lana'], ['/projects/project-jalan-lana.html', '/portfolio/jalan-lana'], ['/projects/project-jalan-lana/', '/portfolio/jalan-lana'],
  ['/thankyou', '/thank-you'], ['/thankyou.html', '/thank-you'],
  ['/sitemap', '/sitemap-index.xml'], ['/sitemap.xml', '/sitemap-index.xml'],
];

const failures = [];
const expect = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failures.push(msg); };

for (const path of pages) {
  const r = await get(path);
  expect(r.status === 200, `${path} → ${r.status}${r.location ? ` ${r.location}` : ''} (want 200)`);
}
for (const [from, to] of redirects) {
  const r = await get(from);
  const target = r.location ? new URL(r.location, BASE).pathname : '';
  expect(r.status === 301 && target === to, `${from} → ${r.status} ${target} (want 301 ${to})`);
}
const missing = await get('/no-such-page');
expect(missing.status === 404 && missing.body.includes('That page isn’t here'), `/no-such-page → ${missing.status} with the branded 404 page`);

// Canonical host: on a local server, fake the live Host header; on the live site, ask for http and www directly.
for (const host of ['loftconcept.com.sg', 'www.loftconcept.com.sg']) {
  if (LIVE && host === 'loftconcept.com.sg') continue;
  const r = LIVE ? await new Promise((res) => http.get({ hostname: host, path: '/about' }, (x) => res({ status: x.statusCode, location: x.headers.location ?? '' }))) : await get('/about', host);
  expect(r.status === 301 && r.location === 'https://loftconcept.com.sg/about', `http://${host}/about → ${r.status} ${r.location} (want 301 https://loftconcept.com.sg/about)`);
}

console.log(failures.length ? `verify-server: ${failures.length} failed` : 'verify-server: OK');
process.exit(failures.length ? 1 : 0);

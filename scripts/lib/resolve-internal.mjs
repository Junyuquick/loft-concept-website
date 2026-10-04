import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const isFile = (p) => existsSync(p) && statSync(p).isFile();

export function resolveInternal(distDir, href) {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  const path = decodeURI(href.split('#')[0].split('?')[0]);
  if (path === '/' || path === '') return isFile(join(distDir, 'index.html'));
  return [path, `${path}.html`, join(path, 'index.html')].some((p) => isFile(join(distDir, p)));
}

// build.format: 'file' makes Astro.url end in .html; public URLs are clean.
export function cleanPath(pathname: string): string {
  const path = pathname.replace(/(\/index)?\.html$/, '').replace(/\/$/, '');
  return path || '/';
}

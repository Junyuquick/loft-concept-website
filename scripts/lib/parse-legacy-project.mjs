const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
const strip = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

export function parseLegacyProject(source, fileName) {
  const html = source.replace(/<!--[\s\S]*?-->/g, '');
  const slug = fileName.replace(/^project-/, '').replace(/\.html$/, '');
  const h1 = html.match(/<h1[^>]*class="project-title"[^>]*>([\s\S]*?)<\/h1>/);
  const desc = html.match(/<p[^>]*class="project-desc"[^>]*>([\s\S]*?)<\/p>/);
  if (!h1 || !desc) throw new Error(`Unrecognised legacy project page: ${fileName}`);

  let title = strip(h1[1]);
  if (slug.endsWith('-ii') && !/\sII$/.test(title)) title += ' II';

  const images = [...html.matchAll(/<img[^>]+src="\.\.\/assets\/images\/([^/"]+)\/([^"]+)"/g)]
    .filter(([, folder]) => folder !== 'logo')
    .map(([, folder, file]) => ({ folder, file }))
    .filter((img, i, all) => all.findIndex((o) => o.folder === img.folder && o.file === img.file) === i);
  const video = html.match(/<source src="\.\.\/assets\/images\/mimosa\/([^"]+\.mp4)"/);

  return { slug, title, summary: strip(desc[1]), images, video: video ? video[1] : null };
}

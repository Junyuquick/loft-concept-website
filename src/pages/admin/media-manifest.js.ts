import { getImage } from 'astro:assets';

// The admin preview (public/admin/preview.js) shows project photos. Photos uploaded in the admin are served by the
// CMS itself, but photos already published exist only as build output, so map each source path to its built URL.
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/projects/**/*.{jpg,jpeg,png,webp}');

export async function GET() {
  const entries = await Promise.all(
    Object.entries(files).map(async ([path, load]) => {
      const image = (await load()).default;
      return [path, (await getImage({ src: image, width: Math.min(960, image.width), format: 'webp' })).src];
    }),
  );
  return new Response(`window.LOFT_MEDIA=${JSON.stringify(Object.fromEntries(entries))};`, { headers: { 'Content-Type': 'text/javascript' } });
}

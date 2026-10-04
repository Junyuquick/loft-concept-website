import sharp from 'sharp';

export async function processImage(input, { maxEdge = 2400, quality = 82 } = {}) {
  return sharp(input)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();
}

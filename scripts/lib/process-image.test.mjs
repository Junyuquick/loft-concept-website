import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { processImage } from './process-image.mjs';

const jpeg = (w, h, orientation) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#888888' } })
    .jpeg()
    .withMetadata(orientation ? { orientation } : {})
    .toBuffer();

describe('processImage', () => {
  it('downsizes the long edge to 2400 without enlarging smaller images', async () => {
    const big = await sharp(await processImage(await jpeg(4000, 1000))).metadata();
    expect([big.width, big.height]).toEqual([2400, 600]);
    const small = await sharp(await processImage(await jpeg(800, 600))).metadata();
    expect([small.width, small.height]).toEqual([800, 600]);
  });

  it('applies EXIF rotation so portrait phone photos come out upright', async () => {
    const out = await sharp(await processImage(await jpeg(200, 100, 6))).metadata();
    expect([out.width, out.height]).toEqual([100, 200]);
  });
});

import { mkdirSync, statSync } from 'node:fs';
import sharp from 'sharp';

// Bone paper after the Brand Guide's page stock: soft cloudy mottling plus sparse specks, pulled toward umber.
// Periodic value noise wraps at the tile edge, so the repeat is seamless.
const SIZE = 512;
const [MOTTLE, SPECK] = (process.argv[2] ?? '14,0.007').split(',').map(Number); // mottle: max shift in 0-255 levels; speck: density
const BONE = [245, 240, 230];
const UMBER = [86, 71, 57];

let seed = 20101;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const fade = (t) => t * t * (3 - 2 * t);

function octave(cells) {
  const grid = Array.from({ length: cells * cells }, rand);
  const at = (x, y) => grid[((y % cells) * cells) + (x % cells)];
  return (px, py) => {
    const fx = (px / SIZE) * cells, fy = (py / SIZE) * cells;
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = fade(fx - x0), ty = fade(fy - y0);
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  };
}

const octaves = [[8, 0.6], [16, 1], [32, 0.9], [64, 0.6], [128, 0.35]].map(([cells, weight]) => [octave(cells), weight]);
const total = octaves.reduce((sum, [, w]) => sum + w, 0);
const data = Buffer.alloc(SIZE * SIZE * 3);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const n = octaves.reduce((sum, [f, w]) => sum + f(x, y) * w, 0) / total; // 0..1, centred near 0.5
    let shift = (n - 0.5) * 2 * MOTTLE; // signed levels
    if (rand() < SPECK) shift += 10 + rand() * 14; // a fibre fleck
    const t = Math.max(0, shift) / (BONE[1] - UMBER[1]);
    const lighten = Math.max(0, -shift);
    const i = (y * SIZE + x) * 3;
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(BONE[c] + (UMBER[c] - BONE[c]) * t + lighten * 0.35);
  }
}

mkdirSync('public/textures', { recursive: true });
const out = 'public/textures/paper.jpg';
await sharp(data, { raw: { width: SIZE, height: SIZE, channels: 3 } }).blur(0.5).jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(out);
const stats = await sharp(out).greyscale().stats();
console.log(`${out} ${Math.round(statSync(out).size / 1024)} KB, luminance stdev ${stats.channels[0].stdev.toFixed(2)} (mottle ${MOTTLE}, speck ${SPECK})`);

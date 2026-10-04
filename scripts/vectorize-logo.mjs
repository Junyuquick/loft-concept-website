import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SRC = 'legacy/assets/images/logo/loft-concept-logo.jpeg';
mkdirSync('.tmp', { recursive: true });

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

const stone = px(4, 4);
let blockW = 0;
while (blockW < W && lum(px(blockW, 4)) < 230) blockW++;

const isLight = (x, y) => x < blockW && lum(px(x, y)) > 205;
const isDark = (x, y) => lum(px(x, y)) < 130;

function meanColor(test) {
  let n = 0; const sum = [0, 0, 0];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x, y)) { const p = px(x, y); sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; n++; }
  return sum.map((v) => v / n);
}

function trace(name, test) {
  const buf = Buffer.alloc(W * H, 255);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x, y)) buf[y * W + x] = 0;
  const pgm = `.tmp/${name}.pgm`, svg = `.tmp/${name}.svg`;
  writeFileSync(pgm, Buffer.concat([Buffer.from(`P5\n${W} ${H}\n255\n`), buf]));
  execFileSync('potrace', ['--svg', '--turdsize', '4', '--opttolerance', '0.4', '-o', svg, pgm]);
  return readFileSync(svg, 'utf8').match(/<g[\s\S]*<\/g>/)[0];
}

const recolor = (markup, color) => markup.replace(/fill="#000000"/, `fill="${color}"`);
const light = recolor(trace('light', isLight), hex(meanColor(isLight)));
const dark = recolor(trace('dark', isDark), hex(meanColor(isDark)));

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Loft Concept, Architectural + Interior">
<rect width="${blockW}" height="${H}" fill="${hex(stone)}"/>
${light}
${dark}
</svg>
`;
writeFileSync('public/logo.svg', out);
console.log(`public/logo.svg ${out.length} bytes, block width ${blockW}px of ${W}`);

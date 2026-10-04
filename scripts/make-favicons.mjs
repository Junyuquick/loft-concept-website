import sharp from 'sharp';

const SRC = 'legacy/assets/images/logo/loft-concept-logo.jpeg';
const [r, g, b] = await sharp(SRC).extract({ left: 4, top: 4, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
const stone = { r, g, b, alpha: 1 };

// The "L" occupies roughly x 58-270, y 63-388 of the original; crop above the "Architectural" line.
// "CONCEPT" starts inside the crop; cover everything right of the stem and above the foot with stone.
const cover = await sharp({ create: { width: 190, height: 320, channels: 3, background: stone } }).png().toBuffer();
const letter = await sharp(SRC)
  .extract({ left: 0, top: 0, width: 330, height: 440 })
  .composite([{ input: cover, left: 140, top: 0 }])
  .png()
  .toBuffer();
for (const [file, size] of [['public/favicon-32.png', 32], ['public/apple-touch-icon.png', 180]]) {
  await sharp(letter).resize(size, size, { fit: 'contain', background: stone }).png().toFile(file);
  console.log(file);
}

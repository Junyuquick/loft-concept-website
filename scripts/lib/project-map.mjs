export function imageName(index, file) {
  const base = file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${String(index + 1).padStart(2, '0')}-${base}.jpg`;
}

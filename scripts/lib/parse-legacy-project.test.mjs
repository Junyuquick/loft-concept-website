import { describe, expect, it } from 'vitest';
import { parseLegacyProject } from './parse-legacy-project.mjs';

const lornie = `
<h1 class="project-title">Lornie Road</h1>
<p class="project-desc">A landed home best seen after dark. Warm light &amp; timber.</p>
<img src="../assets/images/logo/loft-concept-logo.jpeg" alt="Loft Concept">
<img src="../assets/images/188-lornie-road/IMG-5072.JPG" alt="Lornie Road" loading="lazy">
<img src="../assets/images/188-lornie-road/PIX1.jpg" alt="Lornie Road" loading="lazy">`;

describe('parseLegacyProject', () => {
  it('extracts title, summary and ordered images, skipping the logo', () => {
    const p = parseLegacyProject(lornie, 'project-lornie-road.html');
    expect(p.slug).toBe('lornie-road');
    expect(p.title).toBe('Lornie Road');
    expect(p.summary).toBe('A landed home best seen after dark. Warm light & timber.');
    expect(p.images).toEqual([
      { folder: '188-lornie-road', file: 'IMG-5072.JPG' },
      { folder: '188-lornie-road', file: 'PIX1.jpg' },
    ]);
    expect(p.video).toBeNull();
  });

  it('disambiguates duplicate titles with a roman numeral', () => {
    const html = lornie.replace('Lornie Road</h1>', 'Ernani Street</h1>');
    expect(parseLegacyProject(html, 'project-ernani-street-ii.html').title).toBe('Ernani Street II');
    expect(parseLegacyProject(html, 'project-ernani-street.html').title).toBe('Ernani Street');
  });

  it('reads the Mimosa tour video', () => {
    const html = `${lornie.split('<img')[0]}<source src="../assets/images/mimosa/mimosa-tour.mp4" type="video/mp4">`;
    expect(parseLegacyProject(html, 'project-mimosa.html').video).toBe('mimosa-tour.mp4');
  });

  it('drops repeats so the hero is not shown again as the first gallery image', () => {
    const hero = '<img class="project-hero-img" src="../assets/images/188-lornie-road/IMG-5072.JPG" alt="Lornie Road">';
    expect(parseLegacyProject(`${hero}${lornie}`, 'project-lornie-road.html').images).toHaveLength(2);
  });

  it('ignores images inside HTML comments', () => {
    const html = `${lornie}\n<!-- <img src="../assets/images/932c/img223.JPG" alt="x"> -->`;
    expect(parseLegacyProject(html, 'project-lornie-road.html').images).toHaveLength(2);
  });

  it('fails loudly on an unrecognised page', () => {
    expect(() => parseLegacyProject('<html></html>', 'project-x.html')).toThrow(/Unrecognised/);
  });
});

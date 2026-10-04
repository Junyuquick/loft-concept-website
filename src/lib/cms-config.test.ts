import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// The Zod schema in src/content.config.ts is the source of truth; `astro sync` emits it as JSON Schema.
const SCHEMA = '.astro/collections/projects.schema.json';
if (!existsSync(SCHEMA)) throw new Error(`${SCHEMA} is missing: run "npx astro sync" first`);
const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'));
const props: Record<string, any> = Object.fromEntries(Object.entries(schema.properties).filter(([k]) => k !== '$schema'));
const config = parse(readFileSync('public/admin/config.yml', 'utf8'));
const projects = config.collections.find((c: any) => c.name === 'projects');
const fields = new Map<string, any>(projects.fields.map((f: any) => [f.name, f]));
const optionValues = (f: any) => f.options.map((o: any) => (typeof o === 'object' ? o.value : o));
// JSON Schema can't tell an image() from a string, so these mirror the image() calls in content.config.ts.
const IMAGE_FIELDS = ['cover', 'hero', 'gallery'];

describe('admin config matches the projects schema', () => {
  it('edits src/content/projects as Markdown front matter', () => {
    expect(projects).toMatchObject({ folder: 'src/content/projects', extension: 'md', format: 'frontmatter', create: true });
  });
  // Deleting is safe: legacy addresses fall back to /portfolio, and the home and testimonials pages skip missing projects.
  it('lets the client delete projects', () => {
    expect(projects.delete).toBe(true);
  });
  it('has exactly the schema fields', () => {
    expect([...fields.keys()].sort()).toEqual(Object.keys(props).sort());
  });
  it('requires exactly the fields the schema requires', () => {
    for (const [name, f] of fields) expect({ name, required: f.required !== false }).toEqual({ name, required: schema.required.includes(name) });
  });
  it('offers exactly the schema enum values', () => {
    for (const [name, p] of Object.entries(props)) if (p.enum) expect({ name, values: optionValues(fields.get(name)) }).toEqual({ name, values: p.enum });
  });
  it('uses integer number inputs for integer properties', () => {
    for (const [name, p] of Object.entries(props)) if (p.type === 'integer') expect({ name, ...fields.get(name) }).toMatchObject({ name, widget: 'number', value_type: 'int' });
  });
  it('carries the schema defaults', () => {
    for (const [name, p] of Object.entries(props)) if (p.default !== undefined) expect({ name, default: fields.get(name).default }).toEqual({ name, default: p.default });
  });
  it('enforces the summary minimum length', () => {
    expect(fields.get('summary').minlength).toBe(props.summary.minLength);
  });
  it('uses image widgets for image fields, with gallery as a reorderable list', () => {
    for (const name of IMAGE_FIELDS) expect(fields.get(name).widget).toBe('image');
    expect(fields.get('gallery').multiple).toBe(true);
  });
});

describe('admin media settings', () => {
  // Astro's image() needs paths relative to the entry file; Sveltia only writes those for a
  // relative collection-level folder (a global public_folder must start with "/").
  it('writes upload paths that resolve, from a project file, to the upload folder', () => {
    expect(projects.public_folder).toBe(projects.media_folder);
    expect(resolve('src/content/projects', projects.public_folder)).toBe(resolve('src/assets/projects/uploads'));
  });
  it('leaves empty optional fields out, since the schema rejects "" for an optional enum or image', () => {
    expect(config.output?.omit_empty_optional_fields).toBe(true);
  });
  it('shrinks uploads to WebP of at most 2400px', () => {
    expect(config.media_libraries.default.config.transformations.raster_image).toEqual({ format: 'webp', quality: 85, width: 2400, height: 2400 });
  });
  it('refuses formats the build cannot process, such as iPhone HEIC', () => {
    for (const name of IMAGE_FIELDS) {
      const accept = fields.get(name).accept as string;
      expect(accept.split(',').sort()).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    }
  });
  it('commits to the repo on the expected branch', () => {
    expect(config.backend).toMatchObject({ name: 'github', repo: 'Junyuquick/loft-concept-website', branch: 'redesign' });
    expect(config.backend.base_url).toMatch(/^https:\/\/sveltia-cms-auth\.[a-z0-9-]+\.workers\.dev$/);
  });
});

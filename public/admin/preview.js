// Live previews for the admin (Sveltia CMS): show an entry the way it will look on the site.
// Layout and class names mirror src/components/ProjectCard.astro and src/pages/{index,portfolio/index,portfolio/[slug],testimonials}.astro;
// styles are in preview.css. If a page layout changes, update these two files to match.
/* global CMS, h */

const val = (entry, key) => entry.getIn(['data', key]);
const list = (entry, key) => {
  const v = val(entry, key);
  return v && v.toJS ? v.toJS() : [];
};
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

// Photos picked in this editing session come from getAsset; published ones fall back to the build's manifest.
const imageUrl = (getAsset, value) => {
  if (!value) return '';
  const asset = getAsset(value);
  if (asset && asset.url) return asset.url;
  const manifest = window.LOFT_MEDIA || {};
  try {
    return manifest[new URL(value, 'http://x/src/content/projects/').pathname] || '';
  } catch {
    return '';
  }
};

// Scale each frame down to the width of the preview pane, and keep it fitted as photos load or the pane resizes.
const fit = (doc) => {
  doc.querySelectorAll('.pv-viewport').forEach((viewport) => {
    const frame = viewport.querySelector('.pv-frame');
    const apply = () => {
      const scale = Math.min(1, viewport.clientWidth / frame.offsetWidth);
      frame.style.transform = `scale(${scale})`;
      viewport.style.height = `${frame.offsetHeight * scale}px`;
    };
    if (!frame.dataset.fit) {
      frame.dataset.fit = '1';
      const Observer = doc.defaultView.ResizeObserver;
      const ro = new Observer(apply);
      ro.observe(frame);
      ro.observe(viewport);
    }
    apply();
  });
};

const frame = (label, children) =>
  h('section', { className: 'pv-section' },
    h('p', { className: 'pv-label' }, label),
    h('div', { className: 'pv-viewport' }, h('div', { className: 'pv-frame' }, h('div', { className: 'pv-inner' }, children))));

const root = (props, ...sections) => {
  props.window.requestAnimationFrame(() => fit(props.document));
  return h('div', { className: 'pv-root' },
    h('div', { className: 'pv-bar' },
      h('span', null, 'Preview, as visitors will see it'),
      h('label', null, h('input', { type: 'radio', name: 'pv-device', value: 'desktop', defaultChecked: true }), ' Computer'),
      h('label', null, h('input', { type: 'radio', name: 'pv-device', value: 'phone' }), ' Phone')),
    sections);
};

const ghosts = (n) => Array.from({ length: n }, (_, i) => h('div', { key: i, className: 'pv-ghost' }, 'Another project'));

const Card = ({ title, sector, coverUrl, position }) =>
  h('article', { className: 'card' },
    h('div', { className: 'card__link' },
      h('div', { className: 'card__media' }, coverUrl ? h('img', { className: 'photo', src: coverUrl, alt: '', style: { objectPosition: position || '50% 50%' } }) : h('div', { className: 'pv-empty' }, 'No cover photo yet')),
      h('div', { className: 'card__meta' }, h('h3', { className: 'card__title' }, title || 'Untitled project'), h('span', { className: 'accent' }, cap(sector)))));

const ProjectPreview = (props) => {
  const { entry, getAsset } = props;
  const title = val(entry, 'title');
  const sector = val(entry, 'sector');
  const position = val(entry, 'coverPosition');
  const coverUrl = imageUrl(getAsset, val(entry, 'cover'));
  const heroUrl = imageUrl(getAsset, val(entry, 'hero'));
  const gallery = list(entry, 'gallery').map((p) => imageUrl(getAsset, p));
  const card = h(Card, { title, sector, coverUrl, position });

  const typeLabels = { hdb: 'HDB', condo: 'Condominium', landed: 'Landed property', commercial: 'Commercial' };
  const facts = [['Sector', cap(sector)]];
  if (val(entry, 'propertyType')) facts.push(['Property', typeLabels[val(entry, 'propertyType')]]);
  if (val(entry, 'location')) facts.push(['Location', val(entry, 'location')]);
  if (val(entry, 'area')) facts.push(['Area', val(entry, 'area')]);
  if (val(entry, 'scope')) facts.push(['Scope', val(entry, 'scope')]);
  if (val(entry, 'year')) facts.push(['Year', String(val(entry, 'year'))]);

  const shapes = gallery.length <= 3 ? gallery.map(() => 'wide') : gallery.map((_, i) => ['wide', 'half', 'half', 'inset'][i % 4]);

  return root(props,
    frame('1 · Home page, "Selected work"', h('section', { className: 'work' },
      h('div', { className: 'work__head' }, h('h2', null, 'Selected work'), h('span', { className: 'link' }, 'All projects')),
      h('div', { className: 'work__grid' },
        val(entry, 'featured') ? card : h('div', { className: 'pv-note' }, 'Not shown here. Switch on "Feature on home page" to show it.'),
        ghosts(3)),
      h('p', { className: 'pv-hint' }, 'The home page shows up to four featured projects, lowest Order first.'))),

    frame('2 · Portfolio page', h('section', { className: 'portfolio' },
      h('p', { className: 'eyebrow' }, 'Portfolio'),
      h('h1', null, 'Homes and spaces we have designed ', h('span', { className: 'accent' }, 'and built.')),
      h('div', { className: 'portfolio__grid' }, card, ghosts(3)))),

    frame('3 · The project page', h('div', null,
      h('section', { className: 'hero' },
        heroUrl ? h('img', { className: 'photo', src: heroUrl, alt: '', style: { objectPosition: position || '50% 50%' } }) : h('div', { className: 'pv-empty' }, 'No main photo yet'),
        val(entry, 'video') ? h('span', { className: 'pv-badge' }, 'A video plays here on the live page') : null),
      h('section', { className: 'head' },
        h('div', { className: 'head__grid' },
          h('div', null, h('p', { className: 'eyebrow' }, cap(sector)), h('h1', null, title || 'Untitled project')),
          h('div', { className: 'head__text' },
            h('p', { className: 'head__summary' }, val(entry, 'summary')),
            h('dl', { className: 'facts' }, facts.map(([label, value]) => h('div', { key: label }, h('dt', null, label), h('dd', null, value))))))),
      gallery.length ? h('section', { className: 'gallery' }, gallery.map((url, i) => h('figure', { key: i, className: `gallery__item gallery__item--${shapes[i]}` }, url ? h('img', { src: url, alt: '' }) : h('div', { className: 'pv-empty' }, 'Photo missing')))) : null)));
};

const TestimonialPreview = (props) => {
  const { entry } = props;
  const quote = val(entry, 'quote') || '';
  const highlight = val(entry, 'highlight');
  const author = val(entry, 'author');
  const label = val(entry, 'projectLabel');
  const paragraphs = quote.split(/\n+/).filter(Boolean);

  return root(props,
    frame('1 · Testimonials page', h('section', { className: 'stories' },
      h('figure', { className: 'story' },
        h('figcaption', { className: 'story__who' }, h('strong', null, author), val(entry, 'projectSlug') ? h('span', { className: 'link' }, label) : h('span', null, label)),
        h('div', { className: 'story__words' },
          highlight ? h('p', { className: 'story__highlight accent' }, `“${highlight}”`) : null,
          h('blockquote', { className: 'story__quote' }, paragraphs.map((text, i) => h('p', { key: i }, (i === 0 ? '“' : '') + text + (i === paragraphs.length - 1 ? '”' : '')))))))),

    frame('2 · Home page quote', h('section', { className: 'quote' },
      h('figure', { className: 'pull' },
        h('blockquote', { className: 'accent' }, `“${highlight || quote}”`),
        h('figcaption', null, h('strong', null, author), ` · ${label}`)),
      h('p', { className: 'pv-hint' }, 'The home page quotes the first testimonial, the one with the lowest Order number.'))));
};

CMS.registerPreviewStyle('/admin/preview.css');
CMS.registerPreviewTemplate('projects', ProjectPreview);
CMS.registerPreviewTemplate('testimonials', TestimonialPreview);

import { site } from './site';

export const author = { name: 'Quick Ming Jun', role: 'Lead Designer' } as const;

export interface Guide {
  slug: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  published: string;
  reviewed: string;
  minutes: number;
  photo: string;
  photoAlt: string;
  serviceHref: string;
  serviceLabel: string;
}

export const guides: Guide[] = [
  {
    slug: 'hdb-renovation-permit-and-timing',
    title: 'HDB Renovation Permits, Timing and Rules Explained',
    description: "What needs an HDB renovation permit, who applies, how long works can take and when noisy work is allowed. Checked against HDB's own guide.",
    h1: 'HDB renovation permits and timing, explained',
    lead: "Most HDB renovations need a permit for at least some of the work, and the rules on who applies, how long you have and when noisy work is allowed are specific. Here is what HDB's own guide says, in plain English.",
    published: '2026-10-21',
    reviewed: '2026-10-21',
    minutes: 6,
    photo: 'mount-sinai-road',
    photoAlt: 'Open kitchen with a backlit onyx-fronted counter, a white petal chandelier and dark glossy cabinetry',
    serviceHref: '/hdb-interior-design',
    serviceLabel: 'HDB interior design and renovation',
  },
  {
    slug: 'landed-rebuild-or-renovate',
    title: 'Rebuild or Renovate Your Landed Home?',
    description: "How to decide between rebuilding and renovating a landed home in Singapore, including the limits URA sets for additions and alterations.",
    h1: 'Rebuild or renovate your landed home?',
    lead: 'It is the first big decision for any landed home, and it has less to do with taste than with what the rules allow, what the structure can support, and how far you want to go.',
    published: '2026-10-21',
    reviewed: '2026-10-21',
    minutes: 6,
    photo: 'sennett-road',
    photoAlt: 'Three-storey landed house at dusk with a dark stone-clad upper volume and a glass-fronted living floor',
    serviceHref: '/landed-interior-design',
    serviceLabel: 'Landed home design and build',
  },
  {
    slug: 'condo-renovation-approvals',
    title: 'Condo Renovation in Singapore: Approvals and Rules',
    description: "What to check before renovating a Singapore condominium: MCST by-laws, structural limits and approvals. Based on guidance from BCA.",
    h1: 'Renovating a condo in Singapore: approvals and rules',
    lead: 'A condominium is a shared building, so what you can change inside your own unit is shaped by rules you did not write. Knowing them before you design saves weeks.',
    published: '2026-10-21',
    reviewed: '2026-10-21',
    minutes: 5,
    photo: 'leedon-green',
    photoAlt: 'Condominium dining area with disc pendant lights, oak veneer cabinetry and a balcony view',
    serviceHref: '/condo-interior-design',
    serviceLabel: 'Condo interior design and renovation',
  },
  {
    slug: 'choosing-a-renovation-firm',
    title: 'How to Choose a Renovation Firm in Singapore',
    description: 'Questions to ask a renovation firm before you sign: who manages your site, how quotations and payments work, and what protects your deposit.',
    h1: 'How to choose a renovation firm: what to ask before you sign',
    lead: 'Renovation is one of the largest things most people spend money on at home, and it is the sector Singaporeans complain about most. A few good questions, asked early, protect you.',
    published: '2026-10-21',
    reviewed: '2026-10-21',
    minutes: 5,
    photo: 'bedok-road',
    photoAlt: 'Open-plan kitchen with walnut millwork, a long crystal pendant light and polished marble floors',
    serviceHref: '/about',
    serviceLabel: 'About Loft Concept',
  },
];

export const guidePath = (guide: Guide) => `/guides/${guide.slug}`;

export function guideSchema(guide: Guide): Record<string, unknown> {
  const url = `${site.url}${guidePath(guide)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: guide.h1,
        description: guide.description,
        url,
        mainEntityOfPage: url,
        datePublished: guide.published,
        dateModified: guide.reviewed,
        author: { '@type': 'Person', name: author.name, jobTitle: author.role, worksFor: { '@type': 'Organization', name: site.name, url: site.url } },
        publisher: { '@type': 'Organization', name: site.name, url: site.url, logo: { '@type': 'ImageObject', url: `${site.url}/apple-touch-icon.png` } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: `${site.url}/guides` },
          { '@type': 'ListItem', position: 3, name: guide.h1, item: url },
        ],
      },
    ],
  };
}

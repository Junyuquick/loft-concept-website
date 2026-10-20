import { site } from './site';

export interface Service {
  slug: string;
  navLabel: string;
  title: string;
  description: string;
  h1: string;
  h1Accent: string;
  lead: string;
  photo: string;
  propertyType: 'landed' | 'condo' | 'hdb';
  projectsHeading: string;
  scope: { term: string; body: string }[];
  timeline: string;
  faq: { q: string; a: string }[];
}

const price = {
  q: 'How much will it cost?',
  a: 'Every home is different, shaped by its size, its condition and the level of finish you want. Message us to arrange a first consultation, where we listen to your plans and give you a clear view of what they involve.',
};

export const services: Service[] = [
  {
    slug: 'landed-interior-design',
    navLabel: 'Landed homes',
    title: 'Landed Home Interior Design in Singapore',
    description: 'Landed home interior design and construction in Singapore. From empty land or a teardown to a finished home, one Loft Concept team manages it all.',
    h1: 'Landed homes,',
    h1Accent: 'designed and built under one roof.',
    lead: 'Whether you are starting from empty land, rebuilding an old house or reimagining one you already own, we take care of the whole journey, from the first sketch to the day you move in.',
    photo: 'sennett-road',
    propertyType: 'landed',
    projectsHeading: 'Landed homes we have completed',
    scope: [
      { term: 'Design', body: 'Architecture and interiors drawn together, so the facade, the floor plan and every finish belong to one idea.' },
      { term: 'Approvals and submissions', body: 'The paperwork and approvals a landed project requires are ours to manage, so you are never left to chase them.' },
      { term: 'Teardown and structural work', body: 'Demolition, rebuilding, extensions and additions, planned and carried out by one accountable team.' },
      { term: 'Construction', body: 'Our own team builds what we design, to the agreed schedule, and keeps you updated at every step.' },
      { term: 'Pools, lifts and outdoor spaces', body: 'The features that make a landed home feel like yours, from pools and private lifts to courtyards and gardens, are part of the design from the start.' },
      { term: 'Interiors and handover', body: 'Joinery, lighting and finishes completed to a standard we are proud to put our name to, and a home handed over ready to live in.' },
    ],
    timeline: 'A renovation can be completed in as little as a month. A new build or major structural project is a longer journey, often more than twelve months, and we plan it carefully so that every stage happens in the right order.',
    faq: [
      { q: 'Can you build a landed home on empty land?', a: 'Yes. We take a landed home from empty land to a finished, ready-to-live-in house. We also work with existing houses, whether that means a full rebuild, an extension or a renovation.' },
      { q: 'Do you handle the approvals and submissions?', a: 'Yes. We manage the approvals and submissions a landed project requires, so that you deal with one team from beginning to end.' },
      { q: 'How long does a landed home project take?', a: 'A renovation can take as little as one month. A new build or a project with major structural work can take more than twelve months. We give you a realistic schedule once we understand the scope.' },
      { q: 'Can you add a pool or a lift to my house?', a: 'Yes. Pools, private lifts and other additions are designed with the rest of the home, so they feel original to the house and not bolted on.' },
      price,
    ],
  },
  {
    slug: 'condo-interior-design',
    navLabel: 'Condominiums',
    title: 'Condo Interior Design in Singapore',
    description: 'Condo interior design and renovation in Singapore. Loft Concept designs, builds and manages the approvals and the whole renovation for you.',
    h1: 'Condominium interiors,',
    h1Accent: 'designed and built for the way you live.',
    lead: 'A condominium rewards careful planning. We take care of the design, the approvals, the build and the handover, so your home is ready on the day you want to move in.',
    photo: 'leedon-green',
    propertyType: 'condo',
    projectsHeading: 'A condominium we have completed',
    scope: [
      { term: 'Space planning and design', body: 'We learn how you live, then draw a plan that makes the most of every square metre and suits everyone in your household.' },
      { term: 'Approvals and building rules', body: 'Management approvals, renovation rules and working-hour requirements are handled by us, so nothing slows your project down.' },
      { term: 'Construction', body: 'Our own team carries out the work to the agreed schedule, with careful coordination around your neighbours and your building.' },
      { term: 'Joinery and finishes', body: 'Custom cabinetry, materials and lighting chosen and made to suit your design.' },
      { term: 'Handover', body: 'A finished home, checked in detail and handed over ready to live in.' },
    ],
    timeline: 'A condominium renovation can be completed in as little as a month. The timeline depends on the scope of work, and we confirm a realistic schedule with you before any work begins.',
    faq: [
      { q: 'Do you handle management approvals for condo renovations?', a: 'Yes. We manage the approvals and follow the renovation rules of your building, so you do not have to coordinate them yourself.' },
      { q: 'Do you design and build, or only design?', a: 'Both. One team designs your home and builds it, so what you approve on paper is what is delivered.' },
      { q: 'How long does a condo renovation take?', a: 'A renovation can take as little as one month, depending on the scope. We confirm a schedule with you before work begins.' },
      { q: 'Can you work on a new or a resale condominium?', a: 'Yes. Whether you have just collected the keys to a new unit or bought a resale home, we plan the work around your space and how you want to live in it.' },
      price,
    ],
  },
  {
    slug: 'hdb-interior-design',
    navLabel: 'HDB flats',
    title: 'HDB Interior Design and Renovation',
    description: 'HDB interior design and renovation by a registered HDB renovation contractor. Loft Concept designs, builds and manages your flat from start to finish.',
    h1: 'HDB homes,',
    h1Accent: 'designed and built to feel like yours.',
    lead: 'As a registered HDB renovation contractor, we take care of everything: the design, the permits, the construction and the handover.',
    photo: 'seagull-walk',
    propertyType: 'hdb',
    projectsHeading: '',
    scope: [
      { term: 'Design for how you live', body: 'We learn how you live and draw a space plan that works for every member of your household.' },
      { term: 'Permits and approvals', body: 'The renovation permits and approvals your flat needs are handled by us, from application to completion.' },
      { term: 'A registered contractor', body: 'We are a registered HDB renovation contractor, so your renovation is carried out by a team that knows the rules and works within them.' },
      { term: 'Construction', body: 'Our own team carries out the work to the agreed schedule, and keeps you updated at every step.' },
      { term: 'Finishing and handover', body: 'Carpentry, lighting and finishes completed with care, and a home handed over ready to live in.' },
    ],
    timeline: 'An HDB renovation can be completed in as little as a month. The timeline depends on the scope of work, and we confirm a realistic schedule with you before any work begins.',
    faq: [
      { q: 'Are you a registered HDB renovation contractor?', a: 'Yes. Loft Concept is a registered HDB renovation contractor.' },
      { q: 'Do you handle the HDB renovation permit?', a: 'Yes. We manage the permits and approvals your renovation needs, so you deal with one team from beginning to end.' },
      { q: 'How long does an HDB renovation take?', a: 'A renovation can take as little as one month, depending on the scope. We confirm a schedule with you before work begins.' },
      { q: 'Do you design as well as renovate?', a: 'Yes. One team designs your home and builds it, so what you approve on paper is what is delivered.' },
      price,
    ],
  },
];

export function servicePath(service: Service): string {
  return `/${service.slug}`;
}

export function serviceSchema(service: Service): Record<string, unknown> {
  const url = `${site.url}${servicePath(service)}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: service.title,
        url,
        description: service.description,
        areaServed: 'Singapore',
        provider: { '@type': 'HomeAndConstructionBusiness', name: site.name, url: site.url },
      },
      {
        '@type': 'FAQPage',
        mainEntity: service.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };
}

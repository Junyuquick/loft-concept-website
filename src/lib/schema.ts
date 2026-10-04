import { site } from './site';

export function localBusinessSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: site.name,
    url: site.url,
    description: 'Interior design and construction practice in Singapore, delivering homes and commercial spaces since 2010.',
    foundingDate: String(site.founded),
    telephone: site.phone,
    email: site.email,
    areaServed: 'Singapore',
    logo: `${site.url}/apple-touch-icon.png`,
    sameAs: [site.facebook, site.instagram],
  };
}

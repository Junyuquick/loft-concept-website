export const site = {
  name: 'Loft Concept',
  url: 'https://loftconcept.com.sg',
  founded: 2010,
  email: 'loftconceptsg@gmail.com',
  phone: '+65 8533 7311',
  phoneHref: 'tel:+6585337311',
  whatsapp: `https://wa.me/6585337311?text=${encodeURIComponent("Hi, I'm interested in renovating or building my property.")}`,
  facebook: 'https://www.facebook.com/loftconceptsg',
  instagram: 'https://www.instagram.com/loftconcept.sg/',
  formAction: 'https://formspree.io/f/mwvzlegk',
  nav: [
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/about', label: 'About' },
    { href: '/testimonials', label: 'Testimonials' },
  ],
  cta: { href: '/contact', label: 'Book a consultation' },
} as const;

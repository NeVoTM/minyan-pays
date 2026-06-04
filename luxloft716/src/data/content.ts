export const BRAND = {
  /** Canonical brand name — use everywhere user-facing */
  name: 'LuxLoft716',
  tagline: 'Salon Suites',
  slogan: 'Elevate your craft. Own your space.',
  phone: '(716) 421-1210',
  phoneHref: 'tel:+17164211210',
  /** mailto address (lowercase domain) */
  email: 'hello@luxloft716.com',
  /** Shown on site — brand casing */
  emailDisplay: 'Hello@LuxLoft716.com',
  addressLine1: '3887 Seneca St',
  addressLine2: 'Buffalo, NY 14224',
  location: '3887 Seneca St, Buffalo, NY 14224',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=3887+Seneca+St+Buffalo+NY+14224',
} as const

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/amenities', label: 'Amenities' },
  { to: '/why-us', label: 'Why Us?' },
  { to: '/what-is-a-salon-suite', label: 'What Is A Salon Suite?' },
  { to: '/professionals', label: 'Professionals' },
  { to: '/reserve', label: 'Reserve A Unit' },
  { to: '/contact', label: 'Contact' },
] as const

export const AMENITIES = [
  '24/7 Building Access',
  'Styling Chair Provided',
  'Shampoo Bowl + Chair Provided',
  'All Utilities Such As Water and Electricity Included',
  'Wifi Included',
  'Cabinets and Sinks Installed In Each Unit',
  'Washer and Dryer Access',
  'Waiting Room For Clients',
] as const

export const FEATURES = [
  {
    title: 'Spacious Design',
    description: 'Generous suite footprints designed for comfort, flow, and a premium client experience.',
  },
  {
    title: 'Luxurious Interior',
    description: 'Refined finishes and thoughtful details that elevate every appointment.',
  },
  {
    title: 'Cleanliness',
    description: 'Well-maintained common areas and professional standards throughout the building.',
  },
] as const

export const SALON_SUITE_BENEFITS = [
  {
    title: 'A Safe Environment',
    description:
      'Most beauty professionals find that clients prefer the privacy of a salon suite. Studios are designed for one client at a time (two at most), so guests feel comfortable knowing they are the only client in the space during their service.',
  },
  {
    title: 'Appointments',
    description:
      'Stylists in a salon suite can schedule appointments with clients anytime throughout the day—for example, evening services for shift workers near hospitals or downtown offices.',
  },
  {
    title: 'Becoming Your Own Boss',
    description:
      'Run your own business without working under someone else. Once you have your space, the sky is the limit for how you build your brand.',
  },
  {
    title: 'Retail Space',
    description:
      'In a conventional salon, stylists often keep only a portion of what they earn. In your suite, you keep 100% of your service income—and can grow retail revenue with products displayed in your studio.',
  },
] as const

export const GALLERY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1560066984-138d9834c973?w=800&q=80',
    alt: `${BRAND.name} salon suite interior`,
  },
  {
    src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    alt: `${BRAND.name} styling station`,
  },
  {
    src: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb04d?w=800&q=80',
    alt: `${BRAND.name} beauty workspace`,
  },
  {
    src: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&q=80',
    alt: `${BRAND.name} waiting area`,
  },
  {
    src: 'https://images.unsplash.com/photo-1595476108010-b7d1a25890b5?w=800&q=80',
    alt: `${BRAND.name} private studio`,
  },
  {
    src: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80',
    alt: `${BRAND.name} professional suite`,
  },
] as const

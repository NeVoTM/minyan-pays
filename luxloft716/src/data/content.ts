import { asset } from '../lib/assets'

export const BRAND = {
  /** Canonical brand name — use everywhere user-facing */
  name: 'LUXE LOFT 716',
  shortName: 'LUXE LOFT 716',
  tagline: 'Salon Suites',
  slogan: 'Elevate your craft. Own your space.',
  phone: '(716) 421-1210',
  phoneHref: 'tel:+17164211210',
  email: 'LuxELoft716@gmail.com',
  emailDisplay: 'LuxELoft716@gmail.com',
  addressLine1: '3887 Seneca St',
  addressLine2: 'Buffalo, NY 14224',
  location: '3887 Seneca St, Buffalo, NY 14224',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=3887+Seneca+St+Buffalo+NY+14224',
} as const

/** Sign logo: one red L + UXE / OFT (shared L) + italic 716 over the T */
export const LOGO_TEXT = {
  letter: 'L',
  top: 'UXE',
  bottom: 'OFT',
  script: '716',
} as const

export const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/amenities', label: 'Amenities' },
  { to: '/why-us', label: 'Why Us?' },
  { to: '/what-is-a-salon-suite', label: 'What Is A Salon Suite?' },
  { to: '/professionals', label: 'Professionals' },
  { to: '/reserve', label: 'Reserve A Unit' },
  { to: '/brand', label: 'Logo' },
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

/** Brand logo image — used site-wide (header, hero, footer, favicon) */
export const LOGO_IMAGE = asset('logo.png')

const GITHUB_RAW =
  'https://raw.githubusercontent.com/NeVoTM/minyan-pays/main/luxloft716/public'
const LIVE = 'https://nevotm.github.io/minyan-pays'

/** Logo files for download — pick the version you want on /brand */
export const LOGO_VARIANTS = [
  {
    id: 'sign',
    name: 'Sign style',
    badge: 'On website now',
    description:
      'Current site logo — matches building signage. Stylized X in UXE with brush-stroke 716.',
    preview: asset('brand/logo-sign.png'),
    png: asset('brand/logo-sign.png'),
    livePng: `${LIVE}/logo.png`,
    githubPng: `${GITHUB_RAW}/logo.png`,
    downloadName: 'luxe-loft-716-logo-sign.png',
  },
  {
    id: 'classic',
    name: 'Classic (regular X)',
    badge: 'Previous logo',
    description:
      'Earlier lockup with standard serif UXE and OFT — regular X, no italic flourish on the letter.',
    preview: asset('brand/logo-classic.png'),
    png: asset('brand/logo-classic.png'),
    svg: asset('brand/logo-classic.svg'),
    livePng: `${LIVE}/brand/logo-classic.png`,
    liveSvg: `${LIVE}/brand/logo-classic.svg`,
    githubPng: `${GITHUB_RAW}/brand/logo-classic.png`,
    githubSvg: `${GITHUB_RAW}/brand/logo-classic.svg`,
    downloadName: 'luxe-loft-716-logo-classic.png',
  },
] as const

/** @deprecated Use LOGO_VARIANTS — kept for backwards compatibility */
export const BRAND_ASSETS = {
  logoPng: asset('logo.png'),
  logoSvg: asset('logo.svg'),
  liveLogoPng: `${LIVE}/logo.png`,
  liveLogoSvg: `${LIVE}/logo.svg`,
  githubLogoPng: `${GITHUB_RAW}/logo.png`,
  githubLogoSvg: `${GITHUB_RAW}/logo.svg`,
} as const

/** Stock photos (Pexels) — bundled locally for reliable GitHub Pages delivery */
export const SITE_IMAGES = {
  hero: asset('images/hero.jpg'),
  amenities: asset('images/amenities.jpg'),
  location: asset('images/location.jpg'),
  salonSuite: asset('images/salon-suite.jpg'),
  whyUs: asset('images/why-us.jpg'),
} as const

export const FEATURES = [
  {
    title: 'Spacious Design',
    description: 'Generous suite footprints designed for comfort, flow, and a premium client experience.',
    image: asset('images/feature-spacious.jpg'),
    alt: `${BRAND.name} spacious salon suite`,
  },
  {
    title: 'Luxurious Interior',
    description: 'Refined finishes and thoughtful details that elevate every appointment.',
    image: asset('images/feature-luxurious.jpg'),
    alt: `${BRAND.name} luxurious suite interior`,
  },
  {
    title: 'Cleanliness',
    description: 'Well-maintained common areas and professional standards throughout the building.',
    image: asset('images/feature-clean.jpg'),
    alt: `${BRAND.name} clean professional workspace`,
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
  { src: asset('images/gallery-1.jpg'), alt: `${BRAND.name} salon suite interior` },
  { src: asset('images/gallery-2.jpg'), alt: `${BRAND.name} styling station` },
  { src: asset('images/gallery-3.jpg'), alt: `${BRAND.name} beauty workspace` },
  { src: asset('images/gallery-4.jpg'), alt: `${BRAND.name} waiting area` },
  { src: asset('images/gallery-5.jpg'), alt: `${BRAND.name} private studio` },
  { src: asset('images/gallery-6.jpg'), alt: `${BRAND.name} professional suite` },
] as const

/** Open suites shown until tenants join — replace with real pros when available */
export const SUITE_LISTINGS = [
  {
    name: 'Suite Available',
    specialty: 'Hair Stylist',
    suite: 'Suite 101',
    image: asset('images/pro-hair.jpg'),
    imageAlt: 'Hair styling suite available at LUXE LOFT 716',
  },
  {
    name: 'Suite Available',
    specialty: 'Nail Technician',
    suite: 'Suite 102',
    image: asset('images/pro-nails.jpg'),
    imageAlt: 'Nail salon suite available at LUXE LOFT 716',
  },
  {
    name: 'Suite Available',
    specialty: 'Esthetician',
    suite: 'Suite 103',
    image: asset('images/pro-esthetician.jpg'),
    imageAlt: 'Esthetics suite available at LUXE LOFT 716',
  },
] as const

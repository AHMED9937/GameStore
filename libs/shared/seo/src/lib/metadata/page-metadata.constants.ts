export type SeoPageId =
  | 'home'
  | 'shop'
  | 'faq'
  | 'contact'
  | 'subscriptions'
  | 'terms'
  | 'privacy'
  | 'refund';

export type SeoPageDefinition = {
  path: string;
  title: string;
  description: string;
};

export const SEO_PAGE_DEFINITIONS: Record<SeoPageId, SeoPageDefinition> = {
  home: {
    path: '/',
    title: 'Premium offline game activation',
    description:
      'Curated PC titles with secure checkout, fast activation, and warranty-backed support.',
  },
  shop: {
    path: '/shop',
    title: 'Shop PC Games',
    description:
      'Instant-access shared accounts for top PC titles secure checkout, offline Steam play, and warranty-backed support.',
  },
  faq: {
    path: '/faq',
    title: 'FAQ — Activation & Support',
    description:
      'Answers about offline play, activation steps, shared accounts, and store support.',
  },
  contact: {
    path: '/contact',
    title: 'Contact',
    description: 'Get help with orders, activation, and account access.',
  },
  subscriptions: {
    path: '/subscriptions',
    title: 'Subscriptions',
    description: 'Browse subscription plans and included published games.',
  },
  terms: {
    path: '/terms-of-service',
    title: 'Terms of Service',
    description:
      'Read the terms and conditions for using OfflineGameNia and purchasing digital game licenses.',
  },
  privacy: {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    description:
      'Learn how OfflineGameNia collects, uses, and protects your personal information.',
  },
  refund: {
    path: '/refund-policy',
    title: 'Refund Policy',
    description:
      'Understand refund eligibility, replacements, and statutory withdrawal rights.',
  },
};

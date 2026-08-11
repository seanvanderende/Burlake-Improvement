/**
 * Site-wide SEO/GEO constants and helpers.
 *
 * The production URL is used for canonical links, Open Graph tags, and the
 * sitemap. If the site is ever moved to a different domain, update this
 * single constant.
 */
export const SITE_URL = 'https://burlake-improvement.replit.app';
export const SITE_NAME = 'Burnaby Lake Greenhouses';

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

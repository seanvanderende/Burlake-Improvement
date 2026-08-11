import { absoluteUrl, SITE_NAME } from '@/lib/seo';

/**
 * Per-page metadata. React 19 automatically hoists <title>, <meta>, and
 * <link> tags rendered anywhere in the tree up into the document <head> —
 * both in the browser and during server/prerender rendering — so this can be
 * dropped directly into any page component with no provider setup.
 */
export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}) {
  const url = absoluteUrl(path);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const imageUrl = image ? absoluteUrl(image) : absoluteUrl('/images/logo-horizontal.jpg');

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_CA" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </>
  );
}

/** Renders a JSON-LD structured-data block. Safe to place anywhere in the tree. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

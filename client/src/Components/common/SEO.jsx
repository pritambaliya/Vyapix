import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Vyapix';
const SITE_URL = 'https://YOUR-DOMAIN.com';

const SEO = ({
  title,
  description,
  path = '/',
  image = '/images/vyapix-retail-banner.png',
  noIndex = false,
}) => {
  const canonicalUrl = `${SITE_URL}${path}`;
  const imageUrl = image.startsWith('http')
    ? image
    : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <title>{title}</title>

      <meta name="description" content={description} />

      <meta
        name="robots"
        content={noIndex ? 'noindex, nofollow' : 'index, follow'}
      />

      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
};

export default SEO;
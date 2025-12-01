export interface SEOMetadata {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'property';
}

export function updateMetaTags(metadata: SEOMetadata) {
  // Update title
  document.title = metadata.title;

  // Update or create description meta tag
  let descTag = document.querySelector('meta[name="description"]');
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.setAttribute('name', 'description');
    document.head.appendChild(descTag);
  }
  descTag.setAttribute('content', metadata.description);

  // Update Open Graph tags
  updateOGTag('og:title', metadata.title);
  updateOGTag('og:description', metadata.description);
  if (metadata.image) updateOGTag('og:image', metadata.image);
  if (metadata.url) updateOGTag('og:url', metadata.url);
  if (metadata.type) updateOGTag('og:type', metadata.type);

  // Update Twitter Card tags
  updateMetaTag('twitter:title', metadata.title);
  updateMetaTag('twitter:description', metadata.description);
  if (metadata.image) updateMetaTag('twitter:image', metadata.image);
}

function updateOGTag(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function updateMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

// Structured Data (JSON-LD)
export function addStructuredData(data: any) {
  let script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function getPropertyStructuredData(property: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: property.title,
    description: property.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zip || '48083'
    },
    priceCurrency: 'USD',
    price: property.price.toString(),
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'USD',
      price: property.price.toString()
    },
    numberOfRooms: property.bedrooms.toString(),
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.sqft.toString(),
      unitCode: 'SQM'
    }
  };
}

export function getOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Choice Properties Inc.',
    url: 'https://choiceproperties.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2265 Livernois, Suite 500',
      addressLocality: 'Troy',
      addressRegion: 'MI',
      postalCode: '48083',
      addressCountry: 'US'
    },
    telephone: '+1-707-706-3137',
    email: 'info@choiceproperties.com',
    sameAs: [
      'https://www.facebook.com/choiceproperties',
      'https://www.instagram.com/choiceproperties',
      'https://www.twitter.com/choiceproperties'
    ]
  };
}

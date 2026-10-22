import { CompanyProfile } from '../types/company';
import { cleanText } from '../utils/normalizer';

export function extractMetaTags(doc: Document): Partial<CompanyProfile> {
  const result: Partial<CompanyProfile> = {};

  const getMeta = (names: string[]): string | null => {
    for (const name of names) {
      const el =
        doc.querySelector(`meta[property="${name}"]`) ||
        doc.querySelector(`meta[name="${name}"]`) ||
        doc.querySelector(`meta[itemprop="${name}"]`);
      if (el) {
        const val = el.getAttribute('content');
        if (val && val.trim() !== '') return val.trim();
      }
    }
    return null;
  };

  // Company / Site Name
  const siteName = getMeta(['og:site_name', 'application-name', 'twitter:app:name:iphone', 'author']);
  if (siteName) {
    result.companyName = cleanText(siteName);
  }

  // Description
  const description = getMeta([
    'og:description',
    'twitter:description',
    'description',
    'sailthru.description'
  ]);
  if (description) {
    result.companyDescription = cleanText(description);
  }

  // Keywords
  const keywords = getMeta(['keywords', 'news_keywords', 'article:tag']);
  if (keywords) {
    result.keywords = keywords
      .split(',')
      .map((k) => cleanText(k))
      .filter((k) => k !== 'N/A' && k.length > 1);
  }

  // Address / Geo
  const geoPlace = getMeta(['geo.placename', 'og:locality', 'place:location:locality']);
  if (geoPlace) result.city = cleanText(geoPlace);

  const geoRegion = getMeta(['geo.region', 'og:region', 'place:location:region']);
  if (geoRegion) result.state = cleanText(geoRegion);

  const geoCountry = getMeta(['geo.country', 'og:country-name', 'place:location:country']);
  if (geoCountry) result.country = cleanText(geoCountry);

  const postal = getMeta(['og:postal-code']);
  if (postal) result.postalCode = cleanText(postal);

  // Email meta
  const emailMeta = getMeta(['og:email', 'email', 'contact:email', 'reply-to']);
  if (emailMeta && emailMeta.includes('@')) {
    result.officialEmail = cleanText(emailMeta);
  }

  // Phone meta
  const phoneMeta = getMeta(['og:phone_number', 'phone', 'contact:phone_number', 'telephone']);
  if (phoneMeta) {
    result.phoneNumber = cleanText(phoneMeta);
  }

  return result;
}

import { CompanyProfile } from '../types/company';
import { cleanText } from '../utils/normalizer';

export function extractMicrodata(doc: Document): Partial<CompanyProfile> {
  const result: Partial<CompanyProfile> = {};

  const orgScopes = doc.querySelectorAll(
    '[itemscope][itemtype*="schema.org/Organization"], [itemscope][itemtype*="schema.org/Corporation"], [itemscope][itemtype*="schema.org/LocalBusiness"], [itemscope][itemtype*="schema.org/Store"]'
  );

  if (orgScopes.length === 0) return result;

  const scope = orgScopes[0];

  const getProp = (propName: string): string | null => {
    const el = scope.querySelector(`[itemprop="${propName}"]`);
    if (!el) return null;
    return (
      el.getAttribute('content') ||
      el.getAttribute('href') ||
      el.getAttribute('src') ||
      el.textContent ||
      null
    );
  };

  const name = getProp('name') || getProp('legalName');
  if (name) result.companyName = cleanText(name);

  const url = getProp('url');
  if (url) result.companyWebsite = cleanText(url);

  const desc = getProp('description');
  if (desc) result.companyDescription = cleanText(desc);

  const email = getProp('email');
  if (email) result.officialEmail = cleanText(email.replace(/^mailto:/i, ''));

  const phone = getProp('telephone');
  if (phone) result.phoneNumber = cleanText(phone.replace(/^tel:/i, ''));

  const street = getProp('streetAddress');
  const city = getProp('addressLocality');
  const region = getProp('addressRegion');
  const postal = getProp('postalCode');
  const country = getProp('addressCountry');

  if (street) result.address = cleanText(street);
  if (city) result.city = cleanText(city);
  if (region) result.state = cleanText(region);
  if (postal) result.postalCode = cleanText(postal);
  if (country) result.country = cleanText(country);

  const locs = [result.city, result.state, result.country].filter((x) => x && x !== 'N/A');
  if (locs.length > 0) result.headquarters = locs.join(', ');

  return result;
}

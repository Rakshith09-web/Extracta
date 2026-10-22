import { CompanyProfile } from '../types/company';
import { cleanText } from '../utils/normalizer';

const VALID_ORG_TYPES = [
  'organization',
  'corporation',
  'localbusiness',
  'company',
  'business',
  'organizationprofile',
  'store',
  'professionalservice',
  'financialservice',
  'automotivebusiness',
  'healthandbeautybusiness',
  'medicalbusiness',
  'restaurant',
  'lodgingbusiness',
  'travelagency',
  'realestateagent',
  'technologystartup',
  'enterprisegroup',
  'ngo'
];

function isOrgType(type: any): boolean {
  if (!type) return false;
  if (Array.isArray(type)) {
    return type.some((t) => isOrgType(t));
  }
  if (typeof type === 'string') {
    const clean = type.toLowerCase().replace(/^(https?:\/\/schema\.org\/|schema:)/, '');
    return VALID_ORG_TYPES.includes(clean);
  }
  return false;
}

export function extractJsonLd(doc: Document): Partial<CompanyProfile> {
  const result: Partial<CompanyProfile> = {};
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  const candidates: any[] = [];

  scripts.forEach((script) => {
    try {
      const raw = script.textContent?.trim();
      if (!raw) return;
      const parsed = JSON.parse(raw);

      const inspectItem = (item: any) => {
        if (!item || typeof item !== 'object') return;
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          item['@graph'].forEach(inspectItem);
          return;
        }
        if (isOrgType(item['@type'])) {
          candidates.push(item);
        }
      };

      if (Array.isArray(parsed)) {
        parsed.forEach(inspectItem);
      } else {
        inspectItem(parsed);
      }
    } catch {
      // JSON parse error in page script, safely ignore
    }
  });

  if (candidates.length === 0) {
    return result;
  }

  // Use the best candidate (the one with the most populated keys)
  const best = candidates.reduce((prev, curr) => {
    return Object.keys(curr).length > Object.keys(prev).length ? curr : prev;
  }, candidates[0]);

  // Name
  if (best.name && typeof best.name === 'string') {
    result.companyName = cleanText(best.name);
  } else if (best.legalName && typeof best.legalName === 'string') {
    result.companyName = cleanText(best.legalName);
  }

  // Website
  if (best.url && typeof best.url === 'string') {
    result.companyWebsite = best.url;
  }

  // Description
  if (best.description && typeof best.description === 'string') {
    result.companyDescription = cleanText(best.description);
  } else if (best.disambiguatingDescription && typeof best.disambiguatingDescription === 'string') {
    result.companyDescription = cleanText(best.disambiguatingDescription);
  }

  // Founded Year
  if (best.foundingDate) {
    const yearMatch = String(best.foundingDate).match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) result.foundedYear = yearMatch[0];
  }

  // Employees / Size
  if (best.numberOfEmployees) {
    if (typeof best.numberOfEmployees === 'object' && best.numberOfEmployees.value) {
      result.numberOfEmployees = String(best.numberOfEmployees.value);
    } else if (typeof best.numberOfEmployees === 'string' || typeof best.numberOfEmployees === 'number') {
      result.numberOfEmployees = String(best.numberOfEmployees);
    }
  }

  // Address
  if (best.address) {
    const addr = best.address;
    if (typeof addr === 'string') {
      result.address = cleanText(addr);
      result.headquarters = cleanText(addr);
    } else if (typeof addr === 'object') {
      if (addr.streetAddress) result.address = cleanText(addr.streetAddress);
      if (addr.addressLocality) result.city = cleanText(addr.addressLocality);
      if (addr.addressRegion) result.state = cleanText(addr.addressRegion);
      if (addr.postalCode) result.postalCode = cleanText(addr.postalCode);
      if (addr.addressCountry) {
        result.country = typeof addr.addressCountry === 'object' ? addr.addressCountry.name || 'N/A' : String(addr.addressCountry);
      }
      const parts = [result.city, result.state, result.country].filter((p) => p && p !== 'N/A');
      if (parts.length > 0) result.headquarters = parts.join(', ');
    }
  }

  // Contact points
  if (best.telephone) {
    result.phoneNumber = String(best.telephone);
  } else if (best.contactPoint) {
    const cp = Array.isArray(best.contactPoint) ? best.contactPoint[0] : best.contactPoint;
    if (cp && typeof cp === 'object') {
      if (cp.telephone) result.phoneNumber = String(cp.telephone);
      if (cp.email) result.officialEmail = String(cp.email);
    }
  }
  if (best.email) {
    result.officialEmail = String(best.email);
  }

  // Social Links in sameAs
  if (best.sameAs) {
    const urls = Array.isArray(best.sameAs) ? best.sameAs : [best.sameAs];
    urls.forEach((u: any) => {
      if (typeof u === 'string') {
        const lower = u.toLowerCase();
        if (lower.includes('linkedin.com/')) result.linkedinUrl = u;
        else if (lower.includes('twitter.com/') || lower.includes('x.com/')) result.twitterUrl = u;
        else if (lower.includes('facebook.com/')) result.facebookUrl = u;
        else if (lower.includes('instagram.com/')) result.instagramUrl = u;
        else if (lower.includes('youtube.com/')) result.youtubeUrl = u;
      }
    });
  }

  // Industry / KnowAs
  if (best.knowsAbout) {
    const knows = Array.isArray(best.knowsAbout) ? best.knowsAbout : [best.knowsAbout];
    result.keywords = knows.filter((k: any) => typeof k === 'string').map(cleanText);
  }

  return result;
}

import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../types/company';
import { CustomSelectorRule } from '../types/selectors';
import { cleanText, extractDomain, normalizeUrl, calculateConfidenceScore } from '../utils/normalizer';
import { extractJsonLd } from './jsonLdExtractor';
import { extractMicrodata } from './microdataExtractor';
import { extractMetaTags } from './metaExtractor';
import { extractEmails } from './emailExtractor';
import { extractPhones } from './phoneExtractor';
import { extractSocialLinks } from './socialExtractor';
import { extractDomHeuristics } from './domExtractor';
import { extractTechAndBusiness } from './techExtractor';

export function runScraperEngine(
  doc: Document = document,
  currentUrl: string = window.location.href,
  customRules: CustomSelectorRule[] = []
): CompanyProfile {
  const profile: CompanyProfile = {
    ...DEFAULT_COMPANY_PROFILE,
    id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sourceUrl: currentUrl,
    sourceWebsite: extractDomain(currentUrl),
    dateScraped: new Date().toISOString(),
    scrapingStatus: 'Success',
  };

  // 1. Structured Data (JSON-LD) - Priority 1
  const jsonLd = extractJsonLd(doc);

  // 2. Microdata - Priority 2
  const microdata = extractMicrodata(doc);

  // 3. Meta & OpenGraph - Priority 3
  const meta = extractMetaTags(doc);

  // 4. DOM Heuristics - Priority 4
  const dom = extractDomHeuristics(doc, currentUrl);

  // Merge with priority fallback: JSON-LD > Microdata > Meta > DOM
  profile.companyName =
    jsonLd.companyName ||
    microdata.companyName ||
    meta.companyName ||
    dom.companyName ||
    extractDomain(currentUrl).replace(/\.[^/.]+$/, '').toUpperCase() ||
    'N/A';

  profile.companyWebsite =
    jsonLd.companyWebsite ||
    microdata.companyWebsite ||
    normalizeUrl(currentUrl);

  profile.companyDescription =
    jsonLd.companyDescription ||
    microdata.companyDescription ||
    meta.companyDescription ||
    dom.companyDescription ||
    'N/A';

  profile.foundedYear =
    jsonLd.foundedYear ||
    dom.foundedYear ||
    'N/A';

  profile.numberOfEmployees =
    jsonLd.numberOfEmployees ||
    'N/A';

  profile.companySize =
    profile.numberOfEmployees !== 'N/A'
      ? `${profile.numberOfEmployees} employees`
      : 'N/A';

  profile.industry =
    jsonLd.industry ||
    (meta.keywords && meta.keywords.length > 0 ? meta.keywords[0] : 'N/A');

  profile.companyType =
    jsonLd.companyType ||
    'N/A';

  profile.address =
    jsonLd.address ||
    microdata.address ||
    dom.address ||
    'N/A';

  profile.city =
    jsonLd.city ||
    microdata.city ||
    meta.city ||
    'N/A';

  profile.state =
    jsonLd.state ||
    microdata.state ||
    meta.state ||
    'N/A';

  profile.country =
    jsonLd.country ||
    microdata.country ||
    meta.country ||
    'N/A';

  profile.postalCode =
    jsonLd.postalCode ||
    microdata.postalCode ||
    meta.postalCode ||
    'N/A';

  profile.headquarters =
    jsonLd.headquarters ||
    microdata.headquarters ||
    ([profile.city, profile.state, profile.country].filter((x) => x !== 'N/A').join(', ') || 'N/A');

  profile.contactPageUrl =
    dom.contactPageUrl ||
    'N/A';

  // 5. Emails Extraction
  const { officialEmail, generalContactEmail, allEmails } = extractEmails(doc);
  profile.officialEmail = jsonLd.officialEmail || microdata.officialEmail || meta.officialEmail || officialEmail;
  profile.generalContactEmail = generalContactEmail;

  // 6. Phones Extraction
  const { phoneNumber, normalizedPhone, phoneCountryCode } = extractPhones(doc);
  profile.phoneNumber = jsonLd.phoneNumber || microdata.phoneNumber || meta.phoneNumber || phoneNumber;
  profile.normalizedPhone = normalizedPhone;
  profile.phoneCountryCode = phoneCountryCode;

  // 7. Social Media Links
  const social = extractSocialLinks(doc);
  profile.linkedinUrl = jsonLd.linkedinUrl || social.linkedinUrl;
  profile.twitterUrl = jsonLd.twitterUrl || social.twitterUrl;
  profile.facebookUrl = jsonLd.facebookUrl || social.facebookUrl;
  profile.instagramUrl = jsonLd.instagramUrl || social.instagramUrl;
  profile.youtubeUrl = jsonLd.youtubeUrl || social.youtubeUrl;
  profile.githubUrl = social.githubUrl;

  // 8. Tech, Products, Services & Categories
  const techBiz = extractTechAndBusiness(doc);
  profile.technologies = techBiz.technologies;
  profile.products = techBiz.products;
  profile.services = techBiz.services;
  profile.businessCategories = techBiz.businessCategories;
  profile.keywords = meta.keywords && meta.keywords.length > 0 ? meta.keywords : (jsonLd.keywords || []);

  // 9. Apply Custom Selector Rules if any match domain
  const domain = extractDomain(currentUrl);
  const matchingRules = customRules.filter((r) => r.enabled && domain.includes(r.domainPattern.toLowerCase()));

  for (const rule of matchingRules) {
    for (const f of rule.fields) {
      try {
        const el = doc.querySelector(f.selector);
        if (el) {
          const val = f.attribute && f.attribute !== 'text' ? el.getAttribute(f.attribute) : el.textContent;
          if (val) {
            const cleaned = cleanText(val);
            if (cleaned !== 'N/A') {
              (profile as any)[f.field] = cleaned;
            }
          }
        }
      } catch {
        // invalid selector, skip
      }
    }
  }

  // 10. Confidence Score and Status
  profile.confidenceScore = calculateConfidenceScore(profile);
  if (profile.confidenceScore < 20 && profile.companyName === 'N/A') {
    profile.scrapingStatus = 'Failed';
  } else if (profile.confidenceScore < 45) {
    profile.scrapingStatus = 'Partial';
  } else {
    profile.scrapingStatus = 'Success';
  }

  return profile;
}

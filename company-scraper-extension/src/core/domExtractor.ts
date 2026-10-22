import { CompanyProfile } from '../types/company';
import { cleanText, normalizeUrl } from '../utils/normalizer';

export function extractDomHeuristics(doc: Document, currentUrl: string): Partial<CompanyProfile> {
  const result: Partial<CompanyProfile> = {};

  // 1. Company Name from Title, Logo alt, or Navbar Brand
  let detectedName: string | null = null;

  // A. Logo image alt in header/nav
  const logoImg = doc.querySelector('header img[alt], nav img[alt], .logo img[alt], #logo img[alt], [class*="brand"] img[alt]');
  if (logoImg) {
    const alt = logoImg.getAttribute('alt');
    if (alt && alt.length > 2 && !/logo|icon|image|home/i.test(alt.trim())) {
      detectedName = alt;
    }
  }

  // B. Brand element text
  if (!detectedName) {
    const brandEl = doc.querySelector('.navbar-brand, .brand, .site-title, [class*="logo-text"], [class*="brand-name"]');
    if (brandEl && brandEl.textContent) {
      detectedName = brandEl.textContent;
    }
  }

  // C. Title element cleaning
  if (!detectedName && doc.title) {
    let title = doc.title;
    // Common title separators: " | ", " - ", " : ", " • "
    const parts = title.split(/\s+[-|•:–—]\s+/);
    if (parts.length > 1) {
      // Often the first or last part is the brand name
      detectedName = parts[0].length < parts[parts.length - 1].length ? parts[0] : parts[parts.length - 1];
    } else {
      detectedName = title;
    }
  }

  // D. First <h1> if title is generic
  if (!detectedName || detectedName.length < 2) {
    const h1 = doc.querySelector('h1');
    if (h1 && h1.textContent && h1.textContent.trim().length < 60) {
      detectedName = h1.textContent;
    }
  }

  if (detectedName) {
    result.companyName = cleanText(detectedName);
  }

  // 2. Company Description from hero paragraph or about section
  const heroParagraph = doc.querySelector('header + * p, main p, .hero p, [class*="hero"] p, [class*="about"] p, .lead');
  if (heroParagraph && heroParagraph.textContent && heroParagraph.textContent.trim().length > 25) {
    result.companyDescription = cleanText(heroParagraph.textContent);
  }

  // 3. Founded Year from Copyright or Text patterns
  const footer = doc.querySelector('footer, [class*="footer"], #footer');
  const footerText = footer ? footer.textContent || '' : doc.body ? doc.body.textContent || '' : '';

  // Match e.g. "© 2012-2024", "Est. 2015", "Founded in 2018", "Copyright 2010"
  const foundedMatch =
    footerText.match(/(?:founded|est(?:ablished)?\.?|since)\s*(?:in\s*)?(\b(19\d{2}|20\d{2})\b)/i) ||
    footerText.match(/©\s*(\b(19\d{2}|20\d{2})\b)\s*-\s*\d{4}/);

  if (foundedMatch && foundedMatch[1]) {
    result.foundedYear = foundedMatch[1];
  }

  // 4. Contact Page URL
  const contactLinks = doc.querySelectorAll<HTMLAnchorElement>('a[href*="contact"], a[href*="about"], a[href*="reach"]');
  for (let i = 0; i < contactLinks.length; i++) {
    const href = contactLinks[i].getAttribute('href');
    const text = contactLinks[i].textContent?.toLowerCase() || '';
    if (href && (href.toLowerCase().includes('contact') || text.includes('contact'))) {
      result.contactPageUrl = normalizeUrl(href, currentUrl);
      break;
    }
  }

  // 5. Address from <address> tag
  const addressEl = doc.querySelector('address, [class*="address"], [class*="location"]');
  if (addressEl && addressEl.textContent && addressEl.textContent.trim().length > 8) {
    result.address = cleanText(addressEl.textContent);
    result.headquarters = cleanText(addressEl.textContent);
  }

  return result;
}

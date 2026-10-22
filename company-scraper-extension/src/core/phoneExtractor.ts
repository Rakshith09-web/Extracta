const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,9}/g;

// Patterns to exclude (Dates, Years, ISO formats, Prices, Dimensions, IP addresses)
const DATE_OR_PRICE_REGEX = /^\$?\d+(\.\d{2})?$|^\d{4}[-/]\d{2}[-/]\d{2}$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

function cleanPhoneString(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}

function isValidPhoneCandidate(raw: string): boolean {
  if (!raw) return false;
  const digitsOnly = raw.replace(/\D/g, '');
  // Legitimate international & national phone numbers are typically 7 to 15 digits
  if (digitsOnly.length < 7 || digitsOnly.length > 15) return false;

  // Reject sequence of identical numbers e.g. 00000000, 11111111
  if (/^(\d)\1+$/.test(digitsOnly)) return false;

  if (DATE_OR_PRICE_REGEX.test(raw.trim())) return false;

  // Avoid postal codes like 10001 or 90210-1234 alone unless matched in longer format
  if (digitsOnly.length === 5) return false;

  return true;
}

function normalizePhoneNumber(raw: string): { normalized: string; countryCode: string } {
  const digits = raw.replace(/[^\d+]/g, '');
  let countryCode = 'N/A';

  if (digits.startsWith('+')) {
    const match = digits.match(/^\+(\d{1,3})/);
    if (match) countryCode = `+${match[1]}`;
  }

  // Format standard 10 digit US / general format nicely
  const plainDigits = digits.replace(/\+/g, '');
  if (plainDigits.length === 10) {
    const formatted = `(${plainDigits.slice(0, 3)}) ${plainDigits.slice(3, 6)}-${plainDigits.slice(6)}`;
    return {
      normalized: digits.startsWith('+1') ? `+1 ${formatted}` : formatted,
      countryCode: digits.startsWith('+') ? countryCode : '+1',
    };
  }

  return {
    normalized: raw.trim(),
    countryCode,
  };
}

export function extractPhones(doc: Document): {
  phoneNumber: string;
  normalizedPhone: string;
  phoneCountryCode: string;
} {
  const candidates = new Set<string>();

  // 1. Direct tel: links (Highest reliability)
  const telLinks = doc.querySelectorAll('a[href^="tel:"]');
  telLinks.forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    const clean = href.replace(/^tel:/i, '').split('?')[0].trim();
    if (isValidPhoneCandidate(clean)) {
      candidates.add(clean);
    }
  });

  // 2. High-priority DOM blocks (footer, header, contact sections, address)
  const prioritySections = doc.querySelectorAll('footer, address, [id*="contact"], [class*="contact"], [id*="footer"], [class*="footer"]');
  prioritySections.forEach((el) => {
    const text = el.textContent || '';
    const matches = text.match(PHONE_REGEX);
    if (matches) {
      matches.forEach((m) => {
        const trimmed = m.trim();
        if (isValidPhoneCandidate(trimmed)) {
          candidates.add(trimmed);
        }
      });
    }
  });

  const list = Array.from(candidates);
  if (list.length === 0) {
    return {
      phoneNumber: 'N/A',
      normalizedPhone: 'N/A',
      phoneCountryCode: 'N/A',
    };
  }

  const primary = list[0];
  const { normalized, countryCode } = normalizePhoneNumber(primary);

  return {
    phoneNumber: primary,
    normalizedPhone: normalized,
    phoneCountryCode: countryCode,
  };
}

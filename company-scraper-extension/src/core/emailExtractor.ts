const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.js', '.css'];
const IGNORED_DOMAINS = ['example.com', 'domain.com', 'yourdomain.com', 'test.com', 'sentry.io', 'wixpress.com', 'w3.org'];

function isValidEmail(email: string): boolean {
  if (!email || email.length < 6 || email.length > 100) return false;
  const lower = email.toLowerCase();

  // Reject image or asset false positives
  if (IGNORED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;

  // Reject placeholder domains
  if (IGNORED_DOMAINS.some((d) => lower.endsWith(`@${d}`) || lower.endsWith(`.${d}`))) return false;

  // Standard RFC-like basic structure check
  const parts = lower.split('@');
  if (parts.length !== 2) return false;
  const [user, domain] = parts;
  if (!user || !domain || !domain.includes('.')) return false;

  // Reject dummy names
  if (['email', 'name', 'user', 'username', 'test', 'sample', 'fake'].includes(user)) return false;

  return true;
}

export function extractEmails(doc: Document): {
  officialEmail: string;
  generalContactEmail: string;
  allEmails: string[];
} {
  const found = new Set<string>();

  // 1. Check mailto: links
  const mailtoLinks = doc.querySelectorAll('a[href^="mailto:"]');
  mailtoLinks.forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    const raw = href.replace(/^mailto:/i, '').split('?')[0].trim();
    if (raw && isValidEmail(raw)) {
      found.add(raw.toLowerCase());
    }
  });

  // 2. Check visible text nodes in header, footer, contact sections, and body
  const textCandidates: string[] = [];
  const priorityContainers = doc.querySelectorAll('footer, header, [id*="contact"], [class*="contact"], [id*="footer"], [class*="footer"], address');
  priorityContainers.forEach((el) => {
    textCandidates.push(el.textContent || '');
  });

  // Also include general body text
  textCandidates.push(doc.body ? doc.body.innerText || doc.body.textContent || '' : '');

  textCandidates.forEach((text) => {
    const matches = text.match(EMAIL_REGEX);
    if (matches) {
      matches.forEach((m) => {
        const clean = m.trim().toLowerCase();
        if (isValidEmail(clean)) {
          found.add(clean);
        }
      });
    }
  });

  const emailList = Array.from(found);

  if (emailList.length === 0) {
    return {
      officialEmail: 'N/A',
      generalContactEmail: 'N/A',
      allEmails: [],
    };
  }

  // Prioritize primary business inboxes
  const officialPrefixes = ['contact@', 'info@', 'hello@', 'support@', 'sales@', 'office@', 'team@', 'inquiries@', 'press@'];
  let official = emailList.find((e) => officialPrefixes.some((p) => e.startsWith(p)));

  if (!official) {
    official = emailList[0];
  }

  const secondary = emailList.find((e) => e !== official);

  return {
    officialEmail: official || 'N/A',
    generalContactEmail: secondary || (emailList.length > 1 ? emailList[1] : 'N/A'),
    allEmails: emailList,
  };
}

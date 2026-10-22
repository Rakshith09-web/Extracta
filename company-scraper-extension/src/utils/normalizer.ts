import { CompanyProfile } from '../types/company';

/**
 * Strips extra whitespace, newlines, and unescapes basic HTML entities.
 */
export function cleanText(input: string | null | undefined): string {
  if (!input) return 'N/A';
  let cleaned = input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  // If after cleaning it's empty or placeholder-like
  if (!cleaned || cleaned.toLowerCase() === 'undefined' || cleaned.toLowerCase() === 'null') {
    return 'N/A';
  }
  return cleaned;
}

/**
 * Extracts normalized domain from any URL string.
 */
export function extractDomain(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0] || '';
  }
}

/**
 * Ensures a valid absolute URL string.
 */
export function normalizeUrl(url: string | null | undefined, baseUrl?: string): string {
  if (!url || url.trim() === '' || url === 'N/A' || url.startsWith('javascript:') || url.startsWith('#')) {
    return 'N/A';
  }
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (baseUrl) {
    try {
      const base = new URL(baseUrl);
      return new URL(trimmed, base.origin).href;
    } catch {
      // ignore
    }
  }
  return `https://${trimmed}`;
}

/**
 * Calculates a 0 - 100 confidence score based on field completeness.
 */
export function calculateConfidenceScore(profile: Partial<CompanyProfile>): number {
  let score = 0;

  // Basic info (weight: 40)
  if (profile.companyName && profile.companyName !== 'N/A') score += 15;
  if (profile.companyWebsite && profile.companyWebsite !== 'N/A') score += 10;
  if (profile.companyDescription && profile.companyDescription !== 'N/A') score += 10;
  if (profile.industry && profile.industry !== 'N/A') score += 5;

  // Contact info (weight: 30)
  if (profile.officialEmail && profile.officialEmail !== 'N/A') score += 15;
  else if (profile.generalContactEmail && profile.generalContactEmail !== 'N/A') score += 10;
  if (profile.phoneNumber && profile.phoneNumber !== 'N/A') score += 10;
  if (profile.address && profile.address !== 'N/A') score += 5;

  // Social & Tech (weight: 20)
  let socialCount = 0;
  if (profile.linkedinUrl && profile.linkedinUrl !== 'N/A') socialCount++;
  if (profile.twitterUrl && profile.twitterUrl !== 'N/A') socialCount++;
  if (profile.facebookUrl && profile.facebookUrl !== 'N/A') socialCount++;
  if (profile.instagramUrl && profile.instagramUrl !== 'N/A') socialCount++;
  if (profile.youtubeUrl && profile.youtubeUrl !== 'N/A') socialCount++;
  score += Math.min(15, socialCount * 4);

  if (profile.technologies && profile.technologies.length > 0) score += 5;

  // Additional (weight: 10)
  if (profile.headquarters && profile.headquarters !== 'N/A') score += 5;
  if (profile.foundedYear && profile.foundedYear !== 'N/A') score += 5;

  return Math.min(100, Math.max(0, score));
}

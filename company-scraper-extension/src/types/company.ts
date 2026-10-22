export interface CompanyProfile {
  id: string;
  // Basic Company Information
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
  industry: string;
  companyType: string;
  foundedYear: string;
  companySize: string;
  numberOfEmployees: string;
  headquarters: string;
  country: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;

  // Contact Information
  officialEmail: string;
  generalContactEmail: string;
  phoneNumber: string;
  normalizedPhone: string;
  phoneCountryCode: string;
  contactPageUrl: string;

  // Business Information
  products: string[];
  services: string[];
  keywords: string[];
  technologies: string[];
  businessCategories: string[];

  // Social Media
  linkedinUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  githubUrl?: string;

  // Additional Information & Metadata
  sourceUrl: string;
  sourceWebsite: string;
  dateScraped: string;
  scrapingStatus: 'Success' | 'Partial' | 'Failed';
  confidenceScore: number; // 0 - 100
  notes?: string;
  tags?: string[];
  isBookmarked?: boolean;
}

export type CompanyFieldKey = keyof CompanyProfile;

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  id: '',
  companyName: 'N/A',
  companyWebsite: 'N/A',
  companyDescription: 'N/A',
  industry: 'N/A',
  companyType: 'N/A',
  foundedYear: 'N/A',
  companySize: 'N/A',
  numberOfEmployees: 'N/A',
  headquarters: 'N/A',
  country: 'N/A',
  state: 'N/A',
  city: 'N/A',
  address: 'N/A',
  postalCode: 'N/A',
  officialEmail: 'N/A',
  generalContactEmail: 'N/A',
  phoneNumber: 'N/A',
  normalizedPhone: 'N/A',
  phoneCountryCode: 'N/A',
  contactPageUrl: 'N/A',
  products: [],
  services: [],
  keywords: [],
  technologies: [],
  businessCategories: [],
  linkedinUrl: 'N/A',
  twitterUrl: 'N/A',
  facebookUrl: 'N/A',
  instagramUrl: 'N/A',
  youtubeUrl: 'N/A',
  sourceUrl: '',
  sourceWebsite: '',
  dateScraped: '',
  scrapingStatus: 'Success',
  confidenceScore: 0,
  tags: [],
  isBookmarked: false,
};

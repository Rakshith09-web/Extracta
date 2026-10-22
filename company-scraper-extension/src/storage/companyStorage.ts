import { CompanyProfile } from '../types/company';
import { CustomSelectorRule } from '../types/selectors';

const STORAGE_KEY_COMPANIES = 'jobjockey_scraped_companies';
const STORAGE_KEY_RULES = 'jobjockey_custom_rules';

const isChromeStorageAvailable = () =>
  typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

export const companyStorage = {
  async getStoredCompanies(): Promise<CompanyProfile[]> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY_COMPANIES], (result) => {
          resolve(result[STORAGE_KEY_COMPANIES] || []);
        });
      });
    }
    const raw = localStorage.getItem(STORAGE_KEY_COMPANIES);
    return raw ? JSON.parse(raw) : [];
  },

  async saveCompany(company: CompanyProfile): Promise<void> {
    const existing = await this.getStoredCompanies();
    // Check if company already exists by sourceUrl or domain
    const index = existing.findIndex(
      (c) =>
        (c.sourceWebsite && c.sourceWebsite === company.sourceWebsite && c.sourceWebsite !== '') ||
        (c.sourceUrl && c.sourceUrl === company.sourceUrl && c.sourceUrl !== '') ||
        c.id === company.id
    );

    let updated: CompanyProfile[];
    if (index >= 0) {
      // Update existing record, preserve tags/notes
      updated = [...existing];
      updated[index] = {
        ...company,
        id: existing[index].id,
        notes: existing[index].notes || company.notes,
        tags: existing[index].tags || company.tags,
        isBookmarked: existing[index].isBookmarked ?? company.isBookmarked,
      };
    } else {
      updated = [company, ...existing];
    }

    await this.setStoredCompanies(updated);
  },

  async updateCompany(id: string, updates: Partial<CompanyProfile>): Promise<void> {
    const existing = await this.getStoredCompanies();
    const updated = existing.map((c) => (c.id === id ? { ...c, ...updates } : c));
    await this.setStoredCompanies(updated);
  },

  async deleteCompany(id: string): Promise<void> {
    const existing = await this.getStoredCompanies();
    const filtered = existing.filter((c) => c.id !== id);
    await this.setStoredCompanies(filtered);
  },

  async bulkDeleteCompanies(ids: string[]): Promise<void> {
    const idSet = new Set(ids);
    const existing = await this.getStoredCompanies();
    const filtered = existing.filter((c) => !idSet.has(c.id));
    await this.setStoredCompanies(filtered);
  },

  async deleteAllCompanies(): Promise<void> {
    await this.setStoredCompanies([]);
  },

  async setStoredCompanies(companies: CompanyProfile[]): Promise<void> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY_COMPANIES]: companies }, () => {
          // Update badge
          if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
            chrome.action.setBadgeText({
              text: companies.length > 0 ? String(companies.length) : '',
            });
            chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
          }
          resolve();
        });
      });
    }
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(companies));
  },

  // Custom Rules
  async getCustomRules(): Promise<CustomSelectorRule[]> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY_RULES], (result) => {
          resolve(result[STORAGE_KEY_RULES] || []);
        });
      });
    }
    const raw = localStorage.getItem(STORAGE_KEY_RULES);
    return raw ? JSON.parse(raw) : [];
  },

  async saveCustomRule(rule: CustomSelectorRule): Promise<void> {
    const existing = await this.getCustomRules();
    const index = existing.findIndex((r) => r.id === rule.id);
    let updated: CustomSelectorRule[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = rule;
    } else {
      updated = [...existing, rule];
    }

    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY_RULES]: updated }, resolve);
      });
    }
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(updated));
  },

  async deleteCustomRule(id: string): Promise<void> {
    const existing = await this.getCustomRules();
    const filtered = existing.filter((r) => r.id !== id);

    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY_RULES]: filtered }, resolve);
      });
    }
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(filtered));
  },

  async getStats() {
    const list = await this.getStoredCompanies();
    const total = list.length;
    const emailsCount = list.filter((c) => c.officialEmail !== 'N/A' || c.generalContactEmail !== 'N/A').length;
    const phonesCount = list.filter((c) => c.phoneNumber !== 'N/A' || c.normalizedPhone !== 'N/A').length;
    const avgConfidence = total > 0 ? Math.round(list.reduce((acc, c) => acc + (c.confidenceScore || 0), 0) / total) : 0;

    return {
      total,
      emailsCount,
      phonesCount,
      avgConfidence,
    };
  },
};

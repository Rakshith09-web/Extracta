import { CompanyProfile } from './company';
import { CustomSelectorRule } from './selectors';

export type MessageType =
  | 'SCRAPE_CURRENT_PAGE'
  | 'SCRAPE_PAGE_RESPONSE'
  | 'GET_STORED_COMPANIES'
  | 'SAVE_COMPANY'
  | 'DELETE_COMPANY'
  | 'DELETE_ALL_COMPANIES'
  | 'START_BULK_SCRAPE'
  | 'CANCEL_BULK_SCRAPE'
  | 'BULK_SCRAPE_PROGRESS'
  | 'BULK_SCRAPE_COMPLETE'
  | 'GET_CUSTOM_RULES'
  | 'SAVE_CUSTOM_RULE'
  | 'DELETE_CUSTOM_RULE'
  | 'PAGE_SCRAPED_NOTIFICATION'
  | 'RELOAD_STORAGE_COUNT';

export interface ExtensionMessage<T = any> {
  type: MessageType;
  payload?: T;
}

export interface BulkScrapePayload {
  urls: string[];
  delayMs?: number;
  autoCloseTabs?: boolean;
}

export interface BulkScrapeProgressPayload {
  current: number;
  total: number;
  currentUrl: string;
  status: 'running' | 'completed' | 'cancelled' | 'error';
  latestCompany?: CompanyProfile;
  error?: string;
}

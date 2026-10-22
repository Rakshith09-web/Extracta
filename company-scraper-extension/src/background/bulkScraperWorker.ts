import { CompanyProfile } from '../types/company';
import { BulkScrapeProgressPayload } from '../types/messages';
import { companyStorage } from '../storage/companyStorage';

export class BulkScraperQueue {
  private isRunning = false;
  private urls: string[] = [];
  private currentIndex = 0;
  private delayMs = 2000;
  private autoCloseTabs = true;

  public async start(
    urls: string[],
    delayMs = 2000,
    autoCloseTabs = true,
    onProgress?: (progress: BulkScrapeProgressPayload) => void
  ) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.urls = urls.filter((u) => u && u.trim().startsWith('http'));
    this.currentIndex = 0;
    this.delayMs = delayMs;
    this.autoCloseTabs = autoCloseTabs;

    for (let i = 0; i < this.urls.length; i++) {
      if (!this.isRunning) {
        onProgress?.({
          current: i,
          total: this.urls.length,
          currentUrl: this.urls[i],
          status: 'cancelled',
        });
        break;
      }

      const url = this.urls[i];
      this.currentIndex = i + 1;

      onProgress?.({
        current: this.currentIndex,
        total: this.urls.length,
        currentUrl: url,
        status: 'running',
      });

      try {
        const company = await this.scrapeSingleUrl(url);
        if (company) {
          await companyStorage.saveCompany(company);
          onProgress?.({
            current: this.currentIndex,
            total: this.urls.length,
            currentUrl: url,
            status: 'running',
            latestCompany: company,
          });
        }
      } catch (err: any) {
        onProgress?.({
          current: this.currentIndex,
          total: this.urls.length,
          currentUrl: url,
          status: 'running',
          error: err?.message || 'Failed to scrape URL',
        });
      }

      // Delay between requests
      if (i < this.urls.length - 1 && this.isRunning) {
        await new Promise((res) => setTimeout(res, this.delayMs));
      }
    }

    this.isRunning = false;
    onProgress?.({
      current: this.currentIndex,
      total: this.urls.length,
      currentUrl: '',
      status: 'completed',
    });
  }

  public cancel() {
    this.isRunning = false;
  }

  private async scrapeSingleUrl(url: string): Promise<CompanyProfile | null> {
    return new Promise((resolve) => {
      chrome.tabs.create({ url, active: false }, (tab) => {
        if (!tab || !tab.id) {
          resolve(null);
          return;
        }

        const tabId = tab.id;

        const onTabUpdated = (updatedId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (updatedId === tabId && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(onTabUpdated);

            // Wait a brief moment for dynamic JS to render
            setTimeout(() => {
              chrome.tabs.sendMessage(
                tabId,
                { type: 'SCRAPE_CURRENT_PAGE' },
                (response) => {
                  if (this.autoCloseTabs) {
                    chrome.tabs.remove(tabId).catch(() => {});
                  }
                  if (response && response.success && response.data) {
                    resolve(response.data);
                  } else {
                    resolve(null);
                  }
                }
              );
            }, 1500);
          }
        };

        chrome.tabs.onUpdated.addListener(onTabUpdated);

        // Timeout fallback after 15 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(onTabUpdated);
          if (this.autoCloseTabs) {
            chrome.tabs.remove(tabId).catch(() => {});
          }
          resolve(null);
        }, 15000);
      });
    });
  }
}

export const bulkScraper = new BulkScraperQueue();

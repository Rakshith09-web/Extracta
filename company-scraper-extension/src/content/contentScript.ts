import { runScraperEngine } from '../core/scraperEngine';
import { ExtensionMessage } from '../types/messages';
import { showScrapeNotification } from './overlayBanner';
import { companyStorage } from '../storage/companyStorage';

// Listen for messages from popup or background service worker
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'SCRAPE_CURRENT_PAGE') {
    (async () => {
      try {
        const customRules = await companyStorage.getCustomRules();
        const company = runScraperEngine(document, window.location.href, customRules);

        // Show non-intrusive toast banner on page
        showScrapeNotification(company);

        sendResponse({ success: true, data: company });
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || 'Scrape execution failed' });
      }
    })();
    return true; // Keep channel open for async response
  }
});

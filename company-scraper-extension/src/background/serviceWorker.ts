import { ExtensionMessage, BulkScrapePayload } from '../types/messages';
import { companyStorage } from '../storage/companyStorage';
import { bulkScraper } from './bulkScraperWorker';

// 1. Extension Installation & Setup
chrome.runtime.onInstalled.addListener(() => {
  // Create Context Menu Item
  chrome.contextMenus.create({
    id: 'jobjockey-scrape-page',
    title: 'Scrape Company Data from This Page',
    contexts: ['page', 'selection', 'link'],
  });

  // Initial Badge count
  updateBadge();
});

async function updateBadge() {
  const companies = await companyStorage.getStoredCompanies();
  const count = companies.length;
  chrome.action.setBadgeText({
    text: count > 0 ? String(count) : '',
  });
  chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
}

// 2. Context Menu Click Handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'jobjockey-scrape-page' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_CURRENT_PAGE' }, async (response) => {
      if (response?.success && response?.data) {
        await companyStorage.saveCompany(response.data);
        updateBadge();
      }
    });
  }
});

// 3. Message Dispatcher
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'START_BULK_SCRAPE') {
    const payload = message.payload as BulkScrapePayload;
    bulkScraper.start(
      payload.urls,
      payload.delayMs || 2000,
      payload.autoCloseTabs !== false,
      (progress) => {
        // Broadcast progress to open views (dashboard/popup)
        chrome.runtime.sendMessage({
          type: 'BULK_SCRAPE_PROGRESS',
          payload: progress,
        }).catch(() => {});
        updateBadge();
      }
    );
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'CANCEL_BULK_SCRAPE') {
    bulkScraper.cancel();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'RELOAD_STORAGE_COUNT') {
    updateBadge();
    sendResponse({ success: true });
    return true;
  }
});

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScrapeStatusCard } from './components/ScrapeStatusCard';
import { QuickDataPreview } from './components/QuickDataPreview';
import { ActionButtons } from './components/ActionButtons';
import { CompanyProfile } from '../types/company';
import { companyStorage } from '../storage/companyStorage';
import { extractDomain } from '../utils/normalizer';
import { runScraperEngine } from '../core/scraperEngine';

export const PopupApp: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [latestData, setLatestData] = useState<CompanyProfile | null>(null);
  const [storedCompanies, setStoredCompanies] = useState<CompanyProfile[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Get active tab info
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setCurrentUrl(tabs[0].url);
          setDomain(extractDomain(tabs[0].url));
          setActiveTabId(tabs[0].id || null);
        }
      });
    } else {
      // Fallback for standalone dev
      const testUrl = window.location.href;
      setCurrentUrl(testUrl);
      setDomain(extractDomain(testUrl));
    }

    // 2. Load stored companies
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    const list = await companyStorage.getStoredCompanies();
    setStoredCompanies(list);

    // If current tab is already in storage, set as latestData
    if (currentUrl) {
      const match = list.find((c) => c.sourceUrl === currentUrl || (c.sourceWebsite && c.sourceWebsite === extractDomain(currentUrl)));
      if (match) {
        setLatestData(match);
      }
    }
  };

  const handleScrapeCurrentPage = async () => {
    setIsScraping(true);

    if (typeof chrome !== 'undefined' && chrome.tabs && activeTabId) {
      chrome.tabs.sendMessage(
        activeTabId,
        { type: 'SCRAPE_CURRENT_PAGE' },
        async (response) => {
          setIsScraping(false);
          if (response && response.success && response.data) {
            setLatestData(response.data);
            await companyStorage.saveCompany(response.data);
            await loadStoredData();
          } else {
            // If content script was not injected yet (e.g. extension just reloaded), run scraper via executeScript
            try {
              chrome.scripting.executeScript(
                {
                  target: { tabId: activeTabId },
                  func: () => {
                    return document.documentElement.outerHTML;
                  },
                },
                async (results) => {
                  if (results && results[0]?.result) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(results[0].result, 'text/html');
                    const company = runScraperEngine(doc, currentUrl);
                    setLatestData(company);
                    await companyStorage.saveCompany(company);
                    await loadStoredData();
                  }
                }
              );
            } catch {
              // Ignore
            }
          }
        }
      );
    } else {
      // Standalone dev fallback
      setTimeout(async () => {
        const company = runScraperEngine(document, currentUrl || window.location.href);
        setLatestData(company);
        await companyStorage.saveCompany(company);
        await loadStoredData();
        setIsScraping(false);
      }, 600);
    }
  };

  const handleOpenDashboard = (tab?: string) => {
    const url = tab ? `dashboard.html#${tab}` : 'dashboard.html';
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL(url) });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-[580px] bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-white">
      <Header onOpenDashboard={() => handleOpenDashboard()} count={storedCompanies.length} />

      <main className="flex-1 overflow-y-auto pb-2">
        <ScrapeStatusCard
          currentUrl={currentUrl}
          domain={domain}
          isScraping={isScraping}
          latestData={latestData}
        />

        {latestData && (
          <QuickDataPreview
            company={latestData}
            onOpenDetails={() => handleOpenDashboard(`company-${latestData.id}`)}
          />
        )}
      </main>

      <footer className="mt-auto bg-slate-850/80 border-t border-slate-750">
        <ActionButtons
          onScrapeCurrent={handleScrapeCurrentPage}
          onOpenBulkScrape={() => handleOpenDashboard('bulk')}
          onOpenDashboard={() => handleOpenDashboard()}
          isScraping={isScraping}
          companies={storedCompanies}
        />
      </footer>
    </div>
  );
};

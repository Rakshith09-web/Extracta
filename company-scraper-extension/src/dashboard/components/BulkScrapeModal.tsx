import React, { useState, useEffect } from 'react';
import { X, Play, Square, CheckCircle2, AlertCircle, Loader2, Layers, Download } from 'lucide-react';
import { BulkScrapeProgressPayload } from '../../types/messages';
import { CompanyProfile } from '../../types/company';
import { exportToCSV } from '../../utils/exporter';

interface BulkScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrapeComplete: () => void;
}

export const BulkScrapeModal: React.FC<BulkScrapeModalProps> = ({
  isOpen,
  onClose,
  onScrapeComplete,
}) => {
  const [urlsText, setUrlsText] = useState<string>(
    'https://stripe.com\nhttps://github.com\nhttps://vercel.com\nhttps://openai.com'
  );
  const [delaySec, setDelaySec] = useState<number>(2);
  const [autoClose, setAutoClose] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<BulkScrapeProgressPayload | null>(null);
  const [scrapedResults, setScrapedResults] = useState<CompanyProfile[]>([]);
  const [logs, setLogs] = useState<{ time: string; msg: string; type: 'info' | 'success' | 'error' }[]>([]);

  useEffect(() => {
    // Listen for progress messages from background service worker
    const listener = (msg: any) => {
      if (msg.type === 'BULK_SCRAPE_PROGRESS') {
        const payload: BulkScrapeProgressPayload = msg.payload;
        setProgress(payload);

        if (payload.status === 'running') {
          if (payload.latestCompany) {
            setScrapedResults((prev) => [payload.latestCompany!, ...prev]);
            addLog(`Scraped ${payload.latestCompany.companyName} (${payload.latestCompany.officialEmail !== 'N/A' ? payload.latestCompany.officialEmail : 'No email'})`, 'success');
          } else if (payload.error) {
            addLog(`Failed ${payload.currentUrl}: ${payload.error}`, 'error');
          }
        } else if (payload.status === 'completed') {
          setIsRunning(false);
          addLog('Bulk scraping process completed!', 'success');
          onScrapeComplete();
        } else if (payload.status === 'cancelled') {
          setIsRunning(false);
          addLog('Bulk scraping process cancelled by user.', 'info');
        }
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, []);

  const addLog = (msg: string, type: 'info' | 'success' | 'error') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, msg, type }, ...prev.slice(0, 49)]);
  };

  const handleStart = () => {
    const urls = urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

    if (urls.length === 0) {
      alert('Please enter at least one valid URL starting with http:// or https://');
      return;
    }

    setIsRunning(true);
    setScrapedResults([]);
    setLogs([]);
    addLog(`Initiating bulk scrape for ${urls.length} URLs...`, 'info');

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'START_BULK_SCRAPE',
        payload: {
          urls,
          delayMs: delaySec * 1000,
          autoCloseTabs: autoClose,
        },
      });
    }
  };

  const handleCancel = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'CANCEL_BULK_SCRAPE' });
    }
    setIsRunning(false);
  };

  if (!isOpen) return null;

  const current = progress?.current || 0;
  const total = progress?.total || 1;
  const percent = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Bulk URL Scraper Engine</h3>
              <p className="text-xs text-slate-400">Crawl and extract structured profiles from multiple domains</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Target URLs (One per line)
            </label>
            <textarea
              rows={5}
              disabled={isRunning}
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              placeholder="https://company1.com&#10;https://company2.com&#10;https://company3.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 font-mono text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4 bg-slate-850 border border-slate-800 rounded-xl p-3.5">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Delay Between Requests (seconds)</label>
              <input
                type="number"
                min={1}
                max={30}
                disabled={isRunning}
                value={delaySec}
                onChange={(e) => setDelaySec(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={autoClose}
                  onChange={(e) => setAutoClose(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0 bg-slate-800 border-slate-600"
                />
                <span className="text-slate-300">Auto-close background tabs</span>
              </label>
            </div>
          </div>

          {/* Progress Bar (when running or completed) */}
          {(isRunning || progress) && (
            <div className="space-y-2 bg-slate-850 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>Progress ({current} / {total})</span>
                <span className="text-sky-400">{percent}%</span>
              </div>

              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {progress?.currentUrl && isRunning && (
                <div className="flex items-center gap-2 text-slate-400 truncate">
                  <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />
                  <span className="truncate">Processing: {progress.currentUrl}</span>
                </div>
              )}
            </div>
          )}

          {/* Logs */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Execution Activity</label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-36 overflow-y-auto font-mono text-[11px] space-y-1">
              {logs.length === 0 ? (
                <span className="text-slate-600 italic">No activity yet. Click Start to begin.</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-400'
                          : log.type === 'error'
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }
                    >
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <div>
            {scrapedResults.length > 0 && !isRunning && (
              <button
                onClick={() => exportToCSV(scrapedResults, 'bulk_scraped_companies')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export ({scrapedResults.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-medium text-xs shadow-md transition"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop Scraping</span>
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition"
                >
                  Close
                </button>
                <button
                  onClick={handleStart}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white px-5 py-2 rounded-lg font-semibold text-xs shadow-lg transition"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Bulk Extraction</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

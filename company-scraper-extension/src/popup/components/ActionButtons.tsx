import React, { useState } from 'react';
import { Play, Layers, Download, Database, FileSpreadsheet, FileCode, Check } from 'lucide-react';
import { CompanyProfile } from '../../types/company';
import { exportToCSV, exportToExcel, exportToJSON } from '../../utils/exporter';

interface ActionButtonsProps {
  onScrapeCurrent: () => void;
  onOpenBulkScrape: () => void;
  onOpenDashboard: () => void;
  isScraping: boolean;
  companies: CompanyProfile[];
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onScrapeCurrent,
  onOpenBulkScrape,
  onOpenDashboard,
  isScraping,
  companies,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (companies.length === 0) return;
    if (format === 'csv') exportToCSV(companies);
    if (format === 'xlsx') exportToExcel(companies);
    if (format === 'json') exportToJSON(companies);

    setExportedFormat(format);
    setTimeout(() => {
      setExportedFormat(null);
      setShowExportMenu(false);
    }, 1500);
  };

  return (
    <div className="p-4 space-y-2.5">
      {/* 1. Primary Scrape Current Page */}
      <button
        onClick={onScrapeCurrent}
        disabled={isScraping}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg shadow-emerald-950/40 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {isScraping ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Extracting Company Data...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Scrape Current Page</span>
          </>
        )}
      </button>

      {/* Grid of secondary actions */}
      <div className="grid grid-cols-2 gap-2">
        {/* 2. Bulk Scraping */}
        <button
          onClick={onOpenBulkScrape}
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-medium py-2 px-3 rounded-lg border border-slate-700 transition text-xs"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Bulk Scraping</span>
        </button>

        {/* 3. View Collected Data */}
        <button
          onClick={onOpenDashboard}
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-medium py-2 px-3 rounded-lg border border-slate-700 transition text-xs"
        >
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span>View Data ({companies.length})</span>
        </button>
      </div>

      {/* 4. Export Menu Toggle */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={companies.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-medium py-2 px-4 rounded-lg border border-slate-700 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Dataset ({companies.length} Records)</span>
        </button>

        {showExportMenu && (
          <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-slate-850 border border-slate-700 rounded-lg shadow-xl p-1.5 z-20 space-y-1">
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-750 rounded-md transition"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export as CSV (.csv)</span>
              </div>
              {exportedFormat === 'csv' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => handleExport('xlsx')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-750 rounded-md transition"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
                <span>Export as Excel (.xlsx)</span>
              </div>
              {exportedFormat === 'xlsx' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-750 rounded-md transition"
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Export as JSON (.json)</span>
              </div>
              {exportedFormat === 'json' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

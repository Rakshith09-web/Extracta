import React from 'react';
import { Globe, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CompanyProfile } from '../../types/company';

interface ScrapeStatusCardProps {
  currentUrl: string;
  domain: string;
  isScraping: boolean;
  latestData: CompanyProfile | null;
}

export const ScrapeStatusCard: React.FC<ScrapeStatusCardProps> = ({
  currentUrl,
  domain,
  isScraping,
  latestData,
}) => {
  return (
    <div className="mx-4 mt-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700/70 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-200 truncate" title={domain || 'Unknown Page'}>
            {domain || 'Current Webpage'}
          </span>
        </div>

        {latestData && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>{latestData.confidenceScore}% Score</span>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-400 truncate" title={currentUrl}>
        {currentUrl || 'Waiting for active tab...'}
      </div>

      {isScraping && (
        <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-400">
          <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Analyzing JSON-LD, Microdata & DOM heuristics...</span>
        </div>
      )}
    </div>
  );
};

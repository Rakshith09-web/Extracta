import React from 'react';
import { Layers, ExternalLink, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenDashboard: () => void;
  count: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDashboard, count }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-750">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            JobJockey <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Pro</span>
          </h1>
          <p className="text-[11px] text-slate-400">Data & Lead Extractor</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenDashboard}
          title="Open Data Studio Dashboard"
          className="flex items-center gap-1 text-xs font-medium bg-slate-750 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md border border-slate-650 transition"
        >
          <span>Studio</span>
          {count > 0 && (
            <span className="bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
              {count}
            </span>
          )}
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </header>
  );
};

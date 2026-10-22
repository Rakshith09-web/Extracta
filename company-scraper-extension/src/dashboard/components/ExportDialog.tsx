import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileCode, CheckSquare, Square } from 'lucide-react';
import { CompanyProfile } from '../../types/company';
import { DEFAULT_EXPORT_COLUMNS, ExportColumnConfig, exportToCSV, exportToExcel, exportToJSON } from '../../utils/exporter';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyProfile[];
  selectedIds: string[];
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  companies,
  selectedIds,
}) => {
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const [columns, setColumns] = useState<ExportColumnConfig[]>([...DEFAULT_EXPORT_COLUMNS]);

  if (!isOpen) return null;

  const targetCompanies =
    exportScope === 'selected' && selectedIds.length > 0
      ? companies.filter((c) => selectedIds.includes(c.id))
      : companies;

  const toggleColumn = (key: keyof CompanyProfile) => {
    setColumns(
      columns.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const setAllColumns = (enabled: boolean) => {
    setColumns(columns.map((c) => ({ ...c, enabled })));
  };

  const handleExecuteExport = () => {
    if (targetCompanies.length === 0) {
      alert('No records available to export.');
      return;
    }

    if (format === 'csv') {
      exportToCSV(targetCompanies, 'company_dataset', columns);
    } else if (format === 'xlsx') {
      exportToExcel(targetCompanies, 'company_dataset', columns);
    } else {
      exportToJSON(targetCompanies, 'company_dataset');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Export Structured Dataset</h3>
              <p className="text-xs text-slate-400">Export verified company records to CSV, Excel, or JSON</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Format Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  format === 'csv'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="font-semibold text-xs">CSV (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  format === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="font-semibold text-xs">Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  format === 'json'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileCode className="w-5 h-5" />
                <span className="font-semibold text-xs">JSON (.json)</span>
              </button>
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="block text-slate-400 font-semibold mb-2">Records Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                  exportScope === 'all'
                    ? 'border-emerald-500 bg-emerald-500/10 text-slate-200'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="text-emerald-500 focus:ring-0"
                />
                <span className="font-medium">All Records ({companies.length})</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                  exportScope === 'selected'
                    ? 'border-emerald-500 bg-emerald-500/10 text-slate-200'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                } ${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="scope"
                  disabled={selectedIds.length === 0}
                  checked={exportScope === 'selected'}
                  onChange={() => setExportScope('selected')}
                  className="text-emerald-500 focus:ring-0"
                />
                <span className="font-medium">Selected ({selectedIds.length})</span>
              </label>
            </div>
          </div>

          {/* Column Customizer (for CSV/Excel) */}
          {format !== 'json' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-400 font-semibold">Included Columns</label>
                <div className="flex gap-3 text-emerald-400 text-xs">
                  <button type="button" onClick={() => setAllColumns(true)} className="hover:underline">
                    Select All
                  </button>
                  <button type="button" onClick={() => setAllColumns(false)} className="hover:underline">
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-slate-850 border border-slate-800 p-3 rounded-xl">
                {columns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={col.enabled}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                    />
                    <span className="truncate">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Exporting <strong className="text-slate-200">{targetCompanies.length}</strong> companies
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteExport}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-semibold text-xs shadow-md transition"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

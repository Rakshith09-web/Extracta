import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Edit,
  Copy,
  Check,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { CompanyProfile } from '../../types/company';
import { copyCompanyToClipboard } from '../../utils/exporter';

interface DataTableProps {
  companies: CompanyProfile[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (all: boolean) => void;
  onEditCompany: (company: CompanyProfile) => void;
  onDeleteCompany: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onToggleBookmark: (id: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  companies,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onEditCompany,
  onDeleteCompany,
  onBulkDelete,
  onToggleBookmark,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [minScore, setMinScore] = useState<number>(0);
  const [onlyWithEmail, setOnlyWithEmail] = useState<boolean>(false);
  const [sortField, setSortField] = useState<keyof CompanyProfile>('dateScraped');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Filtering & Sorting logic
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        c.companyName.toLowerCase().includes(search) ||
        c.companyWebsite.toLowerCase().includes(search) ||
        c.officialEmail.toLowerCase().includes(search) ||
        c.phoneNumber.toLowerCase().includes(search) ||
        c.industry.toLowerCase().includes(search) ||
        c.headquarters.toLowerCase().includes(search) ||
        c.city.toLowerCase().includes(search);

      // Status
      const matchesStatus = statusFilter === 'ALL' || c.scrapingStatus === statusFilter;

      // Min score
      const matchesScore = (c.confidenceScore || 0) >= minScore;

      // Has email
      const matchesEmail = !onlyWithEmail || (c.officialEmail !== 'N/A' || c.generalContactEmail !== 'N/A');

      return matchesSearch && matchesStatus && matchesScore && matchesEmail;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [companies, searchTerm, statusFilter, minScore, onlyWithEmail, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  const handleSort = (field: keyof CompanyProfile) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCopy = async (company: CompanyProfile) => {
    await copyCompanyToClipboard(company);
    setCopiedId(company.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const isAllSelected =
    paginatedCompanies.length > 0 &&
    paginatedCompanies.every((c) => selectedIds.includes(c.id));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search company, domain, email, city, industry..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Partial">Partial</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyWithEmail}
              onChange={(e) => setOnlyWithEmail(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-600"
            />
            <span>Has Email</span>
          </label>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => onBulkDelete(selectedIds)}
              className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead className="bg-slate-850 text-slate-400 font-semibold border-b border-slate-800 select-none">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-600"
                />
              </th>
              <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('companyName')}>
                <div className="flex items-center gap-1.5">
                  <span>Company</span>
                  {sortField === 'companyName' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />)}
                </div>
              </th>
              <th className="p-3">Official Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Location</th>
              <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('industry')}>
                <div className="flex items-center gap-1.5">
                  <span>Industry</span>
                  {sortField === 'industry' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />)}
                </div>
              </th>
              <th className="p-3 cursor-pointer hover:text-white" onClick={() => handleSort('confidenceScore')}>
                <div className="flex items-center gap-1.5">
                  <span>Score</span>
                  {sortField === 'confidenceScore' && (sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />)}
                </div>
              </th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {paginatedCompanies.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Globe className="w-8 h-8 text-slate-600 animate-pulse" />
                    <p className="text-sm font-medium">No company records match your search.</p>
                    <p className="text-xs text-slate-600">Try scraping websites or adjusting your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCompanies.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const scoreColor =
                  c.confidenceScore >= 70
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : c.confidenceScore >= 40
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isSelected ? 'bg-slate-800/80' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(c.id)}
                        className="rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-600"
                      />
                    </td>

                    {/* Company Name & Domain */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleBookmark(c.id)}
                          className={`hover:text-amber-400 transition ${c.isBookmarked ? 'text-amber-400' : 'text-slate-600'}`}
                          title="Bookmark company"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${c.isBookmarked ? 'fill-amber-400' : ''}`} />
                        </button>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span className="truncate max-w-[200px]" title={c.companyName}>
                              {c.companyName}
                            </span>
                            {c.companyWebsite !== 'N/A' && (
                              <a
                                href={c.companyWebsite}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-emerald-400 transition"
                                title="Open Website"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={c.sourceWebsite}>
                            {c.sourceWebsite || c.companyWebsite}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-3">
                      {c.officialEmail !== 'N/A' ? (
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[160px]" title={c.officialEmail}>
                            {c.officialEmail}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">N/A</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="p-3">
                      {c.normalizedPhone !== 'N/A' ? (
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Phone className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate max-w-[130px]" title={c.normalizedPhone}>
                            {c.normalizedPhone}
                          </span>
                        </div>
                      ) : c.phoneNumber !== 'N/A' ? (
                        <span className="truncate max-w-[130px]" title={c.phoneNumber}>{c.phoneNumber}</span>
                      ) : (
                        <span className="text-slate-600 italic">N/A</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="p-3">
                      {c.headquarters !== 'N/A' || c.city !== 'N/A' ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[140px]" title={c.headquarters}>
                            {c.city !== 'N/A' && c.country !== 'N/A' ? `${c.city}, ${c.country}` : c.headquarters}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">N/A</span>
                      )}
                    </td>

                    {/* Industry */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-300 truncate max-w-[120px] inline-block">
                        {c.industry !== 'N/A' ? c.industry : 'General'}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${scoreColor}`}>
                        {c.confidenceScore}%
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(c)}
                          title="Copy Lead Summary"
                          className="p-1.5 rounded-md hover:bg-slate-750 text-slate-400 hover:text-slate-100 transition"
                        >
                          {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => onEditCompany(c)}
                          title="View & Edit Full Profile"
                          className="p-1.5 rounded-md hover:bg-slate-750 text-slate-400 hover:text-emerald-400 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCompany(c.id)}
                          title="Delete Record"
                          className="p-1.5 rounded-md hover:bg-slate-750 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-850 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{filteredCompanies.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-semibold text-slate-200">
            {Math.min(currentPage * pageSize, filteredCompanies.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-200">{filteredCompanies.length}</span> companies
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition"
            >
              Prev
            </button>
            <span className="px-2 font-medium text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

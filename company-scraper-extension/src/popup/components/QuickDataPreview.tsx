import React, { useState } from 'react';
import { Mail, Phone, MapPin, Briefcase, Linkedin, Twitter, Copy, Check, ExternalLink } from 'lucide-react';
import { CompanyProfile } from '../../types/company';
import { copyCompanyToClipboard } from '../../utils/exporter';

interface QuickDataPreviewProps {
  company: CompanyProfile;
  onOpenDetails: () => void;
}

export const QuickDataPreview: React.FC<QuickDataPreviewProps> = ({ company, onOpenDetails }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyCompanyToClipboard(company);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-4 mt-3 rounded-lg bg-slate-800/90 border border-slate-700 p-3 shadow-md">
      <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white truncate" title={company.companyName}>
            {company.companyName}
          </h3>
          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5" title={company.companyDescription}>
            {company.companyDescription !== 'N/A' ? company.companyDescription : 'No meta description found'}
          </p>
        </div>

        <button
          onClick={handleCopy}
          title="Copy structured lead to clipboard"
          className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-650 text-slate-300 hover:text-white transition shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1.5 mt-2.5 text-xs text-slate-300">
        {/* Email */}
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate font-medium text-slate-200">
            {company.officialEmail !== 'N/A'
              ? company.officialEmail
              : company.generalContactEmail !== 'N/A'
              ? company.generalContactEmail
              : <span className="text-slate-500 italic">No email found</span>}
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate text-slate-300">
            {company.normalizedPhone !== 'N/A'
              ? company.normalizedPhone
              : company.phoneNumber !== 'N/A'
              ? company.phoneNumber
              : <span className="text-slate-500 italic">No phone detected</span>}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate text-slate-300">
            {company.headquarters !== 'N/A'
              ? company.headquarters
              : company.address !== 'N/A'
              ? company.address
              : <span className="text-slate-500 italic">No location info</span>}
          </span>
        </div>

        {/* Industry / Type */}
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="truncate text-slate-300">
            {company.industry !== 'N/A' ? company.industry : 'General Organization'}
          </span>
        </div>
      </div>

      {/* Social Icons & Tech Pills */}
      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-700/60 text-[11px]">
        <div className="flex items-center gap-2">
          {company.linkedinUrl !== 'N/A' && (
            <a
              href={company.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 transition"
              title="LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {company.twitterUrl !== 'N/A' && (
            <a
              href={company.twitterUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:text-sky-300 transition"
              title="Twitter/X"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
          )}
          {company.technologies && company.technologies.length > 0 && (
            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
              {company.technologies.slice(0, 2).join(', ')}
            </span>
          )}
        </div>

        <button
          onClick={onOpenDetails}
          className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
        >
          <span>Full Details</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

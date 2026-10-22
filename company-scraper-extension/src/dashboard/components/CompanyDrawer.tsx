import React, { useState } from 'react';
import {
  X,
  Save,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Mail,
  Phone,
  Share2,
  Tag,
  FileText,
  Trash2,
  Plus,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { CompanyProfile } from '../../types/company';
import { copyCompanyToClipboard } from '../../utils/exporter';
import { calculateConfidenceScore } from '../../utils/normalizer';

interface CompanyDrawerProps {
  company: CompanyProfile;
  onClose: () => void;
  onSave: (updated: CompanyProfile) => void;
  onDelete: (id: string) => void;
}

export const CompanyDrawer: React.FC<CompanyDrawerProps> = ({
  company,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>({ ...company });
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'business' | 'social' | 'notes'>('basic');
  const [copied, setCopied] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleChange = (key: keyof CompanyProfile, value: any) => {
    const updated = { ...formData, [key]: value };
    updated.confidenceScore = calculateConfidenceScore(updated);
    setFormData(updated);
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleCopy = async () => {
    await copyCompanyToClipboard(formData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const currentTags = formData.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      handleChange('tags', [...currentTags, newTag.trim()]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || [];
    handleChange('tags', currentTags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
              {formData.companyName.charAt(0) || 'C'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{formData.companyName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-normal">
                  <ShieldCheck className="w-3 h-3" />
                  {formData.confidenceScore}% Confidence
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe className="w-3 h-3 text-slate-400" />
                <span>{formData.sourceWebsite || 'Website'}</span>
                {formData.companyWebsite !== 'N/A' && (
                  <a
                    href={formData.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
                  >
                    <span>Visit site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              title="Copy Summary"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg font-medium text-xs shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-900 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'basic' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Basic Info</span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'contact' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact & Location</span>
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'business' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Business & Tech</span>
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'social' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Profiles</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'notes' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes & Tags</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Official Website</label>
                <input
                  type="text"
                  value={formData.companyWebsite}
                  onChange={(e) => handleChange('companyWebsite', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Company Description</label>
                <textarea
                  rows={4}
                  value={formData.companyDescription}
                  onChange={(e) => handleChange('companyDescription', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Industry</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Company Type</label>
                  <input
                    type="text"
                    value={formData.companyType}
                    onChange={(e) => handleChange('companyType', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Founded Year</label>
                  <input
                    type="text"
                    value={formData.foundedYear}
                    onChange={(e) => handleChange('foundedYear', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Company Size</label>
                  <input
                    type="text"
                    value={formData.companySize}
                    onChange={(e) => handleChange('companySize', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Employees</label>
                  <input
                    type="text"
                    value={formData.numberOfEmployees}
                    onChange={(e) => handleChange('numberOfEmployees', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT & LOCATION */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Official Email</label>
                  <input
                    type="text"
                    value={formData.officialEmail}
                    onChange={(e) => handleChange('officialEmail', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">General Contact Email</label>
                  <input
                    type="text"
                    value={formData.generalContactEmail}
                    onChange={(e) => handleChange('generalContactEmail', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number (Original)</label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Normalized Phone</label>
                  <input
                    type="text"
                    value={formData.normalizedPhone}
                    onChange={(e) => handleChange('normalizedPhone', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Contact Page URL</label>
                <input
                  type="text"
                  value={formData.contactPageUrl}
                  onChange={(e) => handleChange('contactPageUrl', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="font-semibold text-slate-300 mb-2">Location & Address</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Street Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">State / Province</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => handleChange('postalCode', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUSINESS & TECH */}
          {activeTab === 'business' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Technologies Detected (comma-separated)</label>
                <input
                  type="text"
                  value={(formData.technologies || []).join(', ')}
                  onChange={(e) =>
                    handleChange(
                      'technologies',
                      e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Products (comma-separated)</label>
                <input
                  type="text"
                  value={(formData.products || []).join(', ')}
                  onChange={(e) =>
                    handleChange(
                      'products',
                      e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Services (comma-separated)</label>
                <input
                  type="text"
                  value={(formData.services || []).join(', ')}
                  onChange={(e) =>
                    handleChange(
                      'services',
                      e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Keywords</label>
                <input
                  type="text"
                  value={(formData.keywords || []).join(', ')}
                  onChange={(e) =>
                    handleChange(
                      'keywords',
                      e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL PROFILES */}
          {activeTab === 'social' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Twitter / X URL</label>
                <input
                  type="text"
                  value={formData.twitterUrl}
                  onChange={(e) => handleChange('twitterUrl', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={formData.facebookUrl}
                  onChange={(e) => handleChange('facebookUrl', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Instagram URL</label>
                <input
                  type="text"
                  value={formData.instagramUrl}
                  onChange={(e) => handleChange('instagramUrl', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">YouTube URL</label>
                <input
                  type="text"
                  value={formData.youtubeUrl}
                  onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 5: NOTES & TAGS */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(formData.tags || []).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
                    >
                      <span>{t}</span>
                      <button
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-400 hover:text-rose-400 transition"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a tag..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Internal Notes</label>
                <textarea
                  rows={5}
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Add notes about this company, outreach status, decision maker names, etc..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 text-slate-500 text-[11px] space-y-1">
                <div>Source URL: <span className="text-slate-400">{formData.sourceUrl}</span></div>
                <div>Date Scraped: <span className="text-slate-400">{formData.dateScraped}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            onClick={() => onDelete(formData.id)}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Record</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

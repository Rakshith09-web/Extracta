import React, { useState } from 'react';
import { Plus, Trash2, Edit, Code2, Globe, Check, AlertCircle } from 'lucide-react';
import { CustomSelectorRule, SelectorField } from '../../types/selectors';

interface CustomRulesTabProps {
  rules: CustomSelectorRule[];
  onSaveRule: (rule: CustomSelectorRule) => void;
  onDeleteRule: (id: string) => void;
}

export const CustomRulesTab: React.FC<CustomRulesTabProps> = ({
  rules,
  onSaveRule,
  onDeleteRule,
}) => {
  const [editingRule, setEditingRule] = useState<CustomSelectorRule | null>(null);
  const [domainPattern, setDomainPattern] = useState('');
  const [ruleName, setRuleName] = useState('');
  const [fields, setFields] = useState<SelectorField[]>([
    { field: 'companyName', selector: 'h1', attribute: 'text', type: 'string' },
    { field: 'officialEmail', selector: 'a[href^="mailto:"]', attribute: 'href', type: 'string' },
  ]);

  const handleStartNew = () => {
    setEditingRule({
      id: `rule_${Date.now()}`,
      name: '',
      domainPattern: '',
      enabled: true,
      fields: [{ field: 'companyName', selector: 'h1', attribute: 'text', type: 'string' }],
      createdAt: new Date().toISOString(),
    });
    setDomainPattern('');
    setRuleName('');
    setFields([{ field: 'companyName', selector: 'h1', attribute: 'text', type: 'string' }]);
  };

  const handleEdit = (rule: CustomSelectorRule) => {
    setEditingRule(rule);
    setDomainPattern(rule.domainPattern);
    setRuleName(rule.name);
    setFields([...rule.fields]);
  };

  const handleAddField = () => {
    setFields([...fields, { field: 'industry', selector: '', attribute: 'text', type: 'string' }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, key: keyof SelectorField, val: any) => {
    const updated = [...fields];
    (updated[index] as any)[key] = val;
    setFields(updated);
  };

  const handleSave = () => {
    if (!domainPattern.trim() || !ruleName.trim()) {
      alert('Please provide a rule name and domain pattern');
      return;
    }

    const newRule: CustomSelectorRule = {
      id: editingRule ? editingRule.id : `rule_${Date.now()}`,
      name: ruleName.trim(),
      domainPattern: domainPattern.trim().toLowerCase(),
      enabled: editingRule ? editingRule.enabled : true,
      fields: fields.filter((f) => f.selector.trim() !== ''),
      createdAt: editingRule?.createdAt || new Date().toISOString(),
    };

    onSaveRule(newRule);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>Configurable Extraction Rules & Custom Selectors</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Create domain-specific parsing rules to override or augment automated heuristics for specific business directories, catalogs, or custom portals.
          </p>
        </div>

        <button
          onClick={handleStartNew}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Rule</span>
        </button>
      </div>

      {/* Editor Modal / Inline card */}
      {editingRule && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-slate-100 text-sm">
              {ruleName ? `Edit Rule: ${ruleName}` : 'Create New Selector Rule'}
            </h4>
            <button
              onClick={() => setEditingRule(null)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Rule Name</label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g. Crunchbase Profile Rule"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Domain Pattern (e.g. crunchbase.com)</label>
              <input
                type="text"
                value={domainPattern}
                onChange={(e) => setDomainPattern(e.target.value)}
                placeholder="e.g. ycombinator.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fields Mapping */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold text-xs">Field Selector Mappings</label>
              <button
                onClick={handleAddField}
                className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-850 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <select
                    value={f.field}
                    onChange={(e) => handleUpdateField(idx, 'field', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none"
                  >
                    <option value="companyName">Company Name</option>
                    <option value="companyWebsite">Website</option>
                    <option value="companyDescription">Description</option>
                    <option value="officialEmail">Official Email</option>
                    <option value="phoneNumber">Phone Number</option>
                    <option value="headquarters">Headquarters</option>
                    <option value="industry">Industry</option>
                    <option value="foundedYear">Founded Year</option>
                    <option value="numberOfEmployees">Employees</option>
                  </select>

                  <input
                    type="text"
                    value={f.selector}
                    onChange={(e) => handleUpdateField(idx, 'selector', e.target.value)}
                    placeholder="CSS Selector e.g. .company-title or div > h2"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none"
                  />

                  <select
                    value={f.attribute || 'text'}
                    onChange={(e) => handleUpdateField(idx, 'attribute', e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none"
                  >
                    <option value="text">Inner Text</option>
                    <option value="href">href attribute</option>
                    <option value="src">src attribute</option>
                    <option value="content">content attribute</option>
                  </select>

                  <button
                    onClick={() => handleRemoveField(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              onClick={() => setEditingRule(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs shadow-md"
            >
              Save Rule
            </button>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.length === 0 ? (
          <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Globe className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No custom selector rules configured yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Standard automated schema heuristics (JSON-LD, Microdata, OpenGraph) will be used by default.
            </p>
          </div>
        ) : (
          rules.map((r) => (
            <div
              key={r.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span>{r.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        r.enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {r.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </h4>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(r)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRule(r.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-emerald-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 w-fit mb-3">
                  Match: *{r.domainPattern}*
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  {r.fields.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-300">{f.field}:</span>
                      <code className="text-[11px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                        {f.selector} ({f.attribute || 'text'})
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Created {new Date(r.createdAt).toLocaleDateString()}</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => onSaveRule({ ...r, enabled: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0 bg-slate-800"
                  />
                  <span>Enabled</span>
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

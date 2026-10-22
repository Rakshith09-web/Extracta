import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CompanyProfile } from '../types/company';

export interface ExportColumnConfig {
  key: keyof CompanyProfile;
  label: string;
  enabled: boolean;
}

export const DEFAULT_EXPORT_COLUMNS: ExportColumnConfig[] = [
  { key: 'companyName', label: 'Company Name', enabled: true },
  { key: 'companyWebsite', label: 'Website', enabled: true },
  { key: 'officialEmail', label: 'Official Email', enabled: true },
  { key: 'generalContactEmail', label: 'General Email', enabled: true },
  { key: 'phoneNumber', label: 'Phone Number', enabled: true },
  { key: 'normalizedPhone', label: 'Normalized Phone', enabled: true },
  { key: 'companyDescription', label: 'Description', enabled: true },
  { key: 'industry', label: 'Industry', enabled: true },
  { key: 'companyType', label: 'Company Type', enabled: true },
  { key: 'foundedYear', label: 'Founded Year', enabled: true },
  { key: 'companySize', label: 'Company Size', enabled: true },
  { key: 'numberOfEmployees', label: 'Employees', enabled: true },
  { key: 'headquarters', label: 'Headquarters', enabled: true },
  { key: 'country', label: 'Country', enabled: true },
  { key: 'state', label: 'State', enabled: true },
  { key: 'city', label: 'City', enabled: true },
  { key: 'address', label: 'Address', enabled: true },
  { key: 'postalCode', label: 'Postal Code', enabled: true },
  { key: 'contactPageUrl', label: 'Contact Page URL', enabled: true },
  { key: 'linkedinUrl', label: 'LinkedIn', enabled: true },
  { key: 'twitterUrl', label: 'Twitter/X', enabled: true },
  { key: 'facebookUrl', label: 'Facebook', enabled: true },
  { key: 'instagramUrl', label: 'Instagram', enabled: true },
  { key: 'youtubeUrl', label: 'YouTube', enabled: true },
  { key: 'products', label: 'Products', enabled: true },
  { key: 'services', label: 'Services', enabled: true },
  { key: 'keywords', label: 'Keywords', enabled: true },
  { key: 'technologies', label: 'Technologies', enabled: true },
  { key: 'confidenceScore', label: 'Confidence Score (%)', enabled: true },
  { key: 'sourceUrl', label: 'Source URL', enabled: true },
  { key: 'sourceWebsite', label: 'Source Website', enabled: true },
  { key: 'dateScraped', label: 'Date Scraped', enabled: true },
];

function transformDataForExport(
  companies: CompanyProfile[],
  columns: ExportColumnConfig[] = DEFAULT_EXPORT_COLUMNS
): Record<string, string>[] {
  const activeCols = columns.filter((col) => col.enabled);

  return companies.map((c) => {
    const row: Record<string, string> = {};
    for (const col of activeCols) {
      const val = c[col.key];
      if (Array.isArray(val)) {
        row[col.label] = val.join(', ');
      } else if (typeof val === 'number') {
        row[col.label] = val.toString();
      } else {
        row[col.label] = (val as string) || 'N/A';
      }
    }
    return row;
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(
  companies: CompanyProfile[],
  filenamePrefix = 'companies_export',
  columns?: ExportColumnConfig[]
) {
  const data = transformDataForExport(companies, columns);
  const csv = Papa.unparse(data);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `${filenamePrefix}_${timestamp}.csv`);
}

export function exportToExcel(
  companies: CompanyProfile[],
  filenamePrefix = 'companies_export',
  columns?: ExportColumnConfig[]
) {
  const data = transformDataForExport(companies, columns);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');

  // Auto-fit column widths
  const colWidths = Object.keys(data[0] || {}).map((k) => ({
    wch: Math.max(k.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `${filenamePrefix}_${timestamp}.xlsx`);
}

export function exportToJSON(
  companies: CompanyProfile[],
  filenamePrefix = 'companies_export'
) {
  const jsonStr = JSON.stringify(companies, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `${filenamePrefix}_${timestamp}.json`);
}

export async function copyCompanyToClipboard(company: CompanyProfile): Promise<boolean> {
  try {
    const text = `
Company: ${company.companyName}
Website: ${company.companyWebsite}
Email: ${company.officialEmail}
Phone: ${company.normalizedPhone !== 'N/A' ? company.normalizedPhone : company.phoneNumber}
Industry: ${company.industry}
Location: ${company.city}, ${company.state}, ${company.country}
Description: ${company.companyDescription}
LinkedIn: ${company.linkedinUrl}
Twitter: ${company.twitterUrl}
    `.trim();
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

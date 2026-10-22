export interface SelectorField {
  field: string;
  selector: string;
  attribute?: string; // e.g. 'text', 'href', 'src', or attribute name
  type: 'string' | 'array';
}

export interface CustomSelectorRule {
  id: string;
  domainPattern: string; // e.g. "crunchbase.com", "linkedin.com", "clutch.co"
  name: string;
  enabled: boolean;
  fields: SelectorField[];
  createdAt: string;
}

export interface CatalogSubFilter {
  label: string;
  url: string;
}

export interface CatalogGroup {
  id: string;
  title: string;
  description?: string;
  links: CatalogSubFilter[];
}

export interface CatalogCategory {
  slug: string;
  label: string;
  groups: CatalogGroup[];
}

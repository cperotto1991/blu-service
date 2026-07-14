export type MenuSubcategory = {
  slug: string;
  label: string;
  enabled: boolean;
};

export type MenuGroup = {
  slug: string;
  label: string;
  enabled: boolean;
  subcategories: MenuSubcategory[];
};

export type MenuCategory = {
  slug: string;
  label: string;
  order: number;
  enabled: boolean;
  groups: MenuGroup[];
};

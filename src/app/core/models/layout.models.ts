export interface MegaMenuLink {
  label: string;
  url: string;
}

export interface MegaMenuGroup {
  id?: string;
  title: string;
  description?: string;
  links: MegaMenuLink[];
}

export interface MegaMenuCategory {
  label: string;
  slug: string;
  icon: string;
  groups: MegaMenuGroup[];
}

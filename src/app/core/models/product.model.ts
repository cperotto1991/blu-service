import type { ProductOptionGroup } from './catalog.models';

export interface Product {
  id: number;
  slug: string;
  code: string;
  name: string;
  category: string;
  categorySlug: string;
  groupId: string;
  subcategory: string;
  subcategorySlug: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  tags: string[];
  isOffer: boolean;
  offerLabel?: string;
  discountPercent?: number;
  relatedProductCodes?: string[];
  optionGroups: ProductOptionGroup[];
}

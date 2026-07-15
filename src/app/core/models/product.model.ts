import type { ProductOptionGroup } from './catalog.models';

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  groupId: string;
  subcategory: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  showPrice: boolean;
  supplierPrice?: number;
  finalPrice?: number;
  imageUrl: string;
  tags: string[];
  isActive: boolean;
  isOffer: boolean;
  offerType?: string;
  offerLabel?: string;
  discountPercent?: number;
  relatedProductCodes?: string[];
  optionGroups: ProductOptionGroup[];
}

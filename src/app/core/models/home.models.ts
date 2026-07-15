export interface HomeCategoryCard {
  label: string;
  categorySlug: string;
  description: string;
  imageUrl: string;
  icon?: string;
}

export interface HomeOfferCard {
  id: number;
  code?: string;
  name: string;
  shortDescription: string;
  imageUrl: string;
  showPrice: boolean;
  supplierPrice?: number;
  discountPercent: number;
  discountedPrice: number;
  basePrice: number;
  savings: number;
}

export interface HeroSlide {
  id: number;
  code?: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  showPrice: boolean;
  supplierPrice?: number;
  discountPercent: number;
  discountedPrice: number;
  basePrice: number;
  savings: number;
}

export interface SpotlightSlide {
  id: string;
  kicker: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
  imageUrl: string;
}

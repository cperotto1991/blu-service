import type { Product } from './product.model';

export interface RelatedProductGroup {
  category: string;
  products: Product[];
}

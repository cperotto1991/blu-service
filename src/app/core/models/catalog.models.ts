export interface ProductOption {
  id: string;
  label: string;
  priceDelta: number;
}

export interface ProductOptionGroup {
  id: string;
  title: string;
  required: boolean;
  options: ProductOption[];
}

export interface QuoteRequest {
  productId: number;
  selectedOptions: Record<string, string>;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  estimatedTotal: number;
}

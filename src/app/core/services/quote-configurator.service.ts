import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'blu-service-quote-products';

export type ConfiguredProductItem = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

@Injectable({
  providedIn: 'root',
})
export class QuoteConfiguratorService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly selectedProductsSignal = signal<Product[]>(
    this.loadFromStorage(),
  );

  readonly selectedProducts = this.selectedProductsSignal.asReadonly();

  readonly groupedSelectedProducts = computed<ConfiguredProductItem[]>(() => {
    const grouped = new Map<number, ConfiguredProductItem>();

    for (const product of this.selectedProductsSignal()) {
      const current = grouped.get(product.id);

      if (current) {
        current.quantity += 1;
        current.lineTotal += product.basePrice;
        continue;
      }

      grouped.set(product.id, {
        product,
        quantity: 1,
        lineTotal: product.basePrice,
      });
    }

    return Array.from(grouped.values());
  });

  readonly selectedTotal = computed(() =>
    this.selectedProductsSignal().reduce(
      (total, product) => total + product.basePrice,
      0,
    ),
  );

  readonly selectedCount = computed(() => this.selectedProductsSignal().length);

  addProduct(product: Product): void {
    this.selectedProductsSignal.update((items) => {
      const updated = [...items, product];
      this.saveToStorage(updated);
      return updated;
    });
  }

  removeProduct(productId: number): void {
    this.selectedProductsSignal.update((items) => {
      const index = items.findIndex((item) => item.id === productId);

      if (index < 0) {
        return items;
      }

      const updated = [...items];
      updated.splice(index, 1);
      this.saveToStorage(updated);
      return updated;
    });
  }

  getProductQuantity(productId: number): number {
    return this.selectedProductsSignal().filter((item) => item.id === productId)
      .length;
  }

  clear(): void {
    this.selectedProductsSignal.set([]);
    this.saveToStorage([]);
  }

  private loadFromStorage(): Product[] {
    if (!this.isBrowser) {
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as Product[];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  private saveToStorage(products: Product[]): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }
}

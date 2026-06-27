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

  readonly selectedTotal = computed(() =>
    this.selectedProductsSignal().reduce(
      (total, product) => total + product.basePrice,
      0,
    ),
  );

  readonly selectedCount = computed(() => this.selectedProductsSignal().length);

  addProduct(product: Product): void {
    const alreadySelected = this.selectedProductsSignal().some(
      (item) => item.id === product.id,
    );

    if (alreadySelected) {
      return;
    }

    this.selectedProductsSignal.update((items) => {
      const updated = [...items, product];
      this.saveToStorage(updated);
      return updated;
    });
  }

  removeProduct(productId: number): void {
    this.selectedProductsSignal.update((items) => {
      const updated = items.filter((item) => item.id !== productId);
      this.saveToStorage(updated);
      return updated;
    });
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

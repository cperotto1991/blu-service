import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { QuoteRequest } from '../models/catalog.models';
import { FirebaseDataService } from './firebase-data.service';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly firebaseDataService = inject(FirebaseDataService);

  private readonly productsSignal = signal<Product[]>([]);
  private readonly selectedProductSignal = signal<Product | undefined>(
    undefined,
  );
  readonly products = computed(() => this.productsSignal());
  readonly offers = computed(() =>
    this.productsSignal().filter((p) => p.isOffer),
  );
  readonly selectedProduct = computed(() => this.selectedProductSignal());

  async loadProducts(categorySlug?: string | null): Promise<void> {
    try {
      const products =
        await this.firebaseDataService.listProducts(categorySlug);
      this.productsSignal.set(products);
    } catch (error) {
      console.error('Impossibile caricare i prodotti da Firebase:', error);
      this.productsSignal.set([]);
    }
  }

  async loadOffers(): Promise<void> {
    try {
      const offers = await this.firebaseDataService.listOffers();
      this.productsSignal.set(offers);
    } catch (error) {
      console.error('Impossibile caricare le offerte da Firebase:', error);
      this.productsSignal.set([]);
    }
  }

  async loadProductById(id: number): Promise<void> {
    try {
      const product = await this.firebaseDataService.getProductById(id);

      if (!product) {
        this.selectedProductSignal.set(undefined);
        return;
      }

      this.selectedProductSignal.set(product);

      const relatedCodes = product.relatedProductCodes ?? [];
      const relatedProducts = relatedCodes.length
        ? await this.firebaseDataService.listProductsByCodes(relatedCodes)
        : [];

      this.productsSignal.update((items) => {
        const merged = new Map<number, Product>();

        for (const item of items) {
          merged.set(item.id, item);
        }

        merged.set(product.id, product);

        for (const related of relatedProducts) {
          merged.set(related.id, related);
        }

        return Array.from(merged.values());
      });
    } catch (error) {
      console.error('Impossibile caricare il prodotto da Firebase:', error);
      this.selectedProductSignal.set(undefined);
    }
  }

  async loadProductByCode(code: string): Promise<void> {
    try {
      const normalizedCode = code.trim().toUpperCase();
      const product =
        await this.firebaseDataService.getProductByCode(normalizedCode);

      if (!product) {
        this.selectedProductSignal.set(undefined);
        return;
      }

      this.selectedProductSignal.set(product);

      const relatedCodes = product.relatedProductCodes ?? [];
      const relatedProducts = relatedCodes.length
        ? await this.firebaseDataService.listProductsByCodes(relatedCodes)
        : [];

      this.productsSignal.update((items) => {
        const merged = new Map<number, Product>();

        for (const item of items) {
          merged.set(item.id, item);
        }

        merged.set(product.id, product);

        for (const related of relatedProducts) {
          merged.set(related.id, related);
        }

        return Array.from(merged.values());
      });
    } catch (error) {
      console.error('Impossibile caricare il prodotto da Firebase:', error);
      this.selectedProductSignal.set(undefined);
    }
  }

  getById(id: number): Product | undefined {
    return (
      this.productsSignal().find((p) => p.id === id) ??
      this.selectedProductSignal()
    );
  }

  getByCode(code: string): Product | undefined {
    const normalizedCode = code.trim().toUpperCase();
    return (
      this.productsSignal().find(
        (p) => p.code.toUpperCase() === normalizedCode,
      ) ?? this.selectedProductSignal()
    );
  }

  calculateTotal(
    product: Product,
    selectedOptions: Record<string, string>,
    quantity: number,
  ): number {
    const optionsTotal = product.optionGroups.reduce((total, group) => {
      const selectedOptionId = selectedOptions[group.id];
      const option = group.options.find((o) => o.id === selectedOptionId);
      return total + (option?.priceDelta ?? 0);
    }, 0);

    const subtotal = (product.basePrice + optionsTotal) * quantity;
    const discount = product.discountPercent
      ? (subtotal * product.discountPercent) / 100
      : 0;

    return Math.round(subtotal - discount);
  }

  submitQuoteRequest(request: QuoteRequest): void {
    const recipient = environment.quoteEmail ?? '';
    const subject = `Richiesta preventivo - prodotto ${request.productId}`;

    const lines = [
      `Prodotto: ${request.productId}`,
      `Quantità: ${request.quantity}`,
      `Opzioni: ${JSON.stringify(request.selectedOptions)}`,
      `Nome cliente: ${request.customerName}`,
      `Email cliente: ${request.customerEmail}`,
      `Telefono: ${request.customerPhone ?? ''}`,
      `Note: ${request.notes ?? ''}`,
      `Totale stimato: ${request.estimatedTotal}`,
    ];

    const body = encodeURIComponent(lines.join('\n'));
    const mailto = `${recipient ? 'mailto:' + recipient : 'mailto:'}?subject=${encodeURIComponent(
      subject,
    )}&body=${body}`;

    if (typeof window !== 'undefined') {
      window.location.href = mailto;
    } else {
      console.log('Mailto (server):', mailto);
    }
  }
}

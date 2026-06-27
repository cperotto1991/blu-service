import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { QuoteRequest } from '../models/catalog.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  private readonly productsSignal = signal<Product[]>([]);
  private readonly selectedProductSignal = signal<Product | undefined>(
    undefined,
  );
  readonly products = computed(() => this.productsSignal());
  readonly offers = computed(() =>
    this.productsSignal().filter((p) => p.isOffer),
  );
  readonly selectedProduct = computed(() => this.selectedProductSignal());

  loadProducts(): void {
    this.http.get<Product[]>(`${this.apiBaseUrl}/products`).subscribe({
      next: (products) => this.productsSignal.set(products),
      error: (error) => {
        console.error('Impossibile caricare i prodotti:', error);
        this.productsSignal.set([]);
      },
    });
  }

  loadProductById(id: number): void {
    this.http.get<Product>(`${this.apiBaseUrl}/products/${id}`).subscribe({
      next: (product) => {
        this.selectedProductSignal.set(product);
        this.productsSignal.update((items) => {
          const existingIndex = items.findIndex((item) => item.id === id);
          if (existingIndex !== -1) {
            const updated = [...items];
            updated[existingIndex] = product;
            return updated;
          }
          return [...items, product];
        });
      },
      error: (error) => {
        console.error('Impossibile caricare il prodotto:', error);
        this.selectedProductSignal.set(undefined);
      },
    });
  }

  getById(id: number): Product | undefined {
    return (
      this.productsSignal().find((p) => p.id === id) ??
      this.selectedProductSignal()
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

import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ConfiguredProductItem,
  QuoteConfiguratorService,
} from '../../core/services/quote-configurator.service';
import { inject } from '@angular/core';
import { PriceVisibilityService } from '../../core/services/price-visibility.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-quote-configurator',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './quote-configurator.component.html',
  styleUrls: ['./quote-configurator.component.scss'],
})
export class QuoteConfiguratorComponent {
  private readonly priceVisibilityService = inject(PriceVisibilityService);

  constructor(
    private readonly quoteConfiguratorService: QuoteConfiguratorService,
  ) {}

  get selectedProducts() {
    return this.quoteConfiguratorService.selectedProducts;
  }

  get groupedSelectedProducts() {
    return this.quoteConfiguratorService.groupedSelectedProducts;
  }

  get selectedCount() {
    return this.quoteConfiguratorService.selectedCount;
  }

  get selectedTotal() {
    return this.quoteConfiguratorService.selectedTotal;
  }

  canSeeProductPrice(product: Product): boolean {
    return this.priceVisibilityService.canSeeProductPrice(product);
  }

  canSeeSupplierPrice(product: Product): boolean {
    return this.priceVisibilityService.canSeeSupplierPrice(product);
  }

  canSeeTotal(): boolean {
    return this.groupedSelectedProducts().every((item) =>
      this.canSeeProductPrice(item.product),
    );
  }

  getLineTotal(item: ConfiguredProductItem): number {
    return item.lineTotal;
  }

  getQuantityLabel(item: ConfiguredProductItem): string {
    return `Quantita: ${item.quantity}`;
  }

  canSeeGroupedSupplierPrice(item: ConfiguredProductItem): boolean {
    return this.canSeeSupplierPrice(item.product);
  }

  removeProduct(id: number): void {
    this.quoteConfiguratorService.removeProduct(id);
  }
}

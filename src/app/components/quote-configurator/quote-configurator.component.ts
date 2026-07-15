import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuoteConfiguratorService } from '../../core/services/quote-configurator.service';
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
    return this.selectedProducts().every((product) =>
      this.canSeeProductPrice(product),
    );
  }

  removeProduct(id: number): void {
    this.quoteConfiguratorService.removeProduct(id);
  }
}

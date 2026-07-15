import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { QuoteConfiguratorService } from '../../core/services/quote-configurator.service';
import { Location } from '@angular/common';
import { PriceVisibilityService } from '../../core/services/price-visibility.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-quote-request',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './quote-request.component.html',
  styleUrl: './quote-request.component.scss',
})
export class QuoteRequestComponent {
  private readonly quoteConfiguratorService = inject(QuoteConfiguratorService);
  private readonly location = inject(Location);
  private readonly priceVisibilityService = inject(PriceVisibilityService);

  readonly selectedProducts = this.quoteConfiguratorService.selectedProducts;
  readonly selectedTotal = this.quoteConfiguratorService.selectedTotal;

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

  removeProduct(productId: number): void {
    this.quoteConfiguratorService.removeProduct(productId);
  }

  clearConfiguration(): void {
    this.quoteConfiguratorService.clear();
  }

  goBack(): void {
    this.location.back();
  }
}

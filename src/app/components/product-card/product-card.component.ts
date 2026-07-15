import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../core/models/product.model';
import { PriceVisibilityService } from '../../core/services/price-visibility.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  private readonly priceVisibilityService = inject(PriceVisibilityService);

  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<Product>();

  canSeeProductPrice(): boolean {
    return this.priceVisibilityService.canSeeProductPrice(this.product);
  }

  canSeeSupplierPrice(): boolean {
    return this.priceVisibilityService.canSeeSupplierPrice(this.product);
  }

  addToConfigurator(): void {
    this.add.emit(this.product);
  }
}

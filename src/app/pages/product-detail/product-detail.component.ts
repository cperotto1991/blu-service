import { Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { QuoteConfiguratorComponent } from '../../components/quote-configurator/quote-configurator.component';
import { CatalogService } from '../../core/services/catalog.service';
import { Product } from '../../core/models/product.model';
import { QuoteConfiguratorService } from '../../core/services/quote-configurator.service';
import { RelatedProductGroup } from '../../core/models/product-detail.models';
import { PriceVisibilityService } from '../../core/services/price-visibility.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, QuoteConfiguratorComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly quoteConfiguratorService = inject(QuoteConfiguratorService);
  private readonly priceVisibilityService = inject(PriceVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  product = computed(() => {
    const code = this.route.snapshot.paramMap.get('code')?.trim() ?? '';

    if (!code) {
      return undefined;
    }

    return this.catalogService.getByCode(code);
  });

  constructor() {
    const code = this.route.snapshot.paramMap.get('code')?.trim() ?? '';
    if (this.isBrowser && code) {
      void this.catalogService.loadProductByCode(code);
    }
  }

  relatedProducts = computed(() => {
    const product = this.product();

    if (!product?.relatedProductCodes?.length) {
      return [];
    }

    const relatedCodeSet = new Set(product.relatedProductCodes);

    return this.catalogService
      .products()
      .filter((candidate) => relatedCodeSet.has(candidate.code));
  });

  relatedProductGroups = computed<RelatedProductGroup[]>(() => {
    const groupsMap = new Map<string, Product[]>();

    for (const related of this.relatedProducts()) {
      const key = related.category;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }

      groupsMap.get(key)?.push(related);
    }

    return Array.from(groupsMap.entries()).map(([category, products]) => ({
      category,
      products,
    }));
  });

  selectedProducts = this.quoteConfiguratorService.selectedProducts;
  readonly selectedTotal = this.quoteConfiguratorService.selectedTotal;

  isSelected(productId: number): boolean {
    return this.getSelectedQuantity(productId) > 0;
  }

  getSelectedQuantity(productId: number): number {
    return this.quoteConfiguratorService.getProductQuantity(productId);
  }

  addToConfiguration(product: Product): void {
    this.quoteConfiguratorService.addProduct(product);
  }

  removeFromConfiguration(productId: number): void {
    this.quoteConfiguratorService.removeProduct(productId);
  }

  toggleConfiguration(product: Product): void {
    this.addToConfiguration(product);
  }

  canSeeProductPrice(product: Product | undefined): boolean {
    return this.priceVisibilityService.canSeeProductPrice(product);
  }

  canSeeSupplierPrice(product: Product | undefined): boolean {
    return this.priceVisibilityService.canSeeSupplierPrice(product);
  }
}

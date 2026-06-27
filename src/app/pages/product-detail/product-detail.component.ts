import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CatalogService } from '../../core/services/catalog.service';
import { Product } from '../../core/models/product.model';
import { QuoteConfiguratorService } from '../../core/services/quote-configurator.service';
import { RelatedProductGroup } from '../../core/models/product-detail.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly quoteConfiguratorService = inject(QuoteConfiguratorService);

  product = computed(() => {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? Number(idStr) : NaN;
    if (!Number.isFinite(id)) return undefined;
    return this.catalogService.getById(id);
  });

  constructor() {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? Number(idStr) : NaN;
    if (Number.isFinite(id)) {
      this.catalogService.loadProductById(id);
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

  isSelected(productId: number): boolean {
    return this.selectedProducts().some((item) => item.id === productId);
  }

  addToConfiguration(product: Product): void {
    this.quoteConfiguratorService.addProduct(product);
  }

  removeFromConfiguration(productId: number): void {
    this.quoteConfiguratorService.removeProduct(productId);
  }

  toggleConfiguration(product: Product): void {
    if (this.isSelected(product.id)) {
      this.removeFromConfiguration(product.id);
      return;
    }

    this.addToConfiguration(product);
  }
}

import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { QuoteConfiguratorComponent } from '../../components/quote-configurator/quote-configurator.component';
import { Product } from '../../core/models/product.model';
import { CatalogService } from '../../core/services/catalog.service';
import { CategoryMenuService } from '../../core/services/category-menu.service';
import { QuoteConfiguratorService } from '../../core/services/quote-configurator.service';

type CatalogSidebarSubcategory = {
  slug: string;
  label: string;
};

type CatalogSidebarGroup = {
  id: string;
  title: string;
  subcategories: CatalogSidebarSubcategory[];
};

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, QuoteConfiguratorComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly categoryMenuService = inject(CategoryMenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly quoteConfiguratorService = inject(QuoteConfiguratorService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly selectedProducts = this.quoteConfiguratorService.selectedProducts;
  readonly selectedTotal = this.quoteConfiguratorService.selectedTotal;
  readonly selectedCount = this.quoteConfiguratorService.selectedCount;

  readonly selectedCategory = signal<string>('Tutti');
  readonly selectedCategorySlug = signal<string | null>(null);
  readonly selectedGroup = signal<string | null>(null);
  readonly selectedSubFilter = signal<string | null>(null);

  readonly currentCategory = computed(() => {
    const slug = this.selectedCategorySlug();

    if (!slug) {
      return null;
    }

    return (
      this.categoryMenuService
        .categories()
        .find((category) => category.slug === slug && category.enabled) ?? null
    );
  });

  readonly currentCategoryGroups = computed<CatalogSidebarGroup[]>(() => {
    const categorySlug = this.selectedCategorySlug();

    if (!categorySlug) {
      return [];
    }

    const categoryConfig = this.currentCategory();
    const configuredGroups = (categoryConfig?.groups ?? [])
      .filter((group) => group.enabled !== false)
      .map((group) => ({
        id: this.normalizeSlug(group.slug || group.label),
        title: group.label,
        subcategories: (group.subcategories ?? [])
          .filter((subcategory) => subcategory.enabled !== false)
          .map((subcategory) => ({
            slug: this.normalizeSlug(subcategory.slug || subcategory.label),
            label: subcategory.label,
          }))
          .filter((subcategory) => subcategory.slug && subcategory.label)
          .sort((a, b) => a.label.localeCompare(b.label, 'it')),
      }))
      .filter((group) => group.id && group.subcategories.length > 0);

    if (configuredGroups.length > 0) {
      return configuredGroups;
    }

    const groups = new Map<
      string,
      { id: string; title: string; subcategories: Map<string, string> }
    >();

    for (const product of this.catalogService.products()) {
      if (this.normalizeSlug(product.categorySlug) !== categorySlug) {
        continue;
      }

      const groupId = this.normalizeSlug(product.groupId) || 'altri';
      const groupTitle = product.groupId
        ? this.formatLabelFromSlug(product.groupId)
        : 'Altri';
      const subcategorySlug =
        this.normalizeSlug(product.subcategorySlug) ||
        this.normalizeSlug(product.subcategory);

      if (!subcategorySlug) {
        continue;
      }

      const subcategoryLabel =
        product.subcategory || this.formatLabelFromSlug(subcategorySlug);

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          title: groupTitle,
          subcategories: new Map<string, string>(),
        });
      }

      groups.get(groupId)?.subcategories.set(subcategorySlug, subcategoryLabel);
    }

    return Array.from(groups.values())
      .map((group) => ({
        id: group.id,
        title: group.title,
        subcategories: Array.from(group.subcategories.entries())
          .map(([slug, label]) => ({ slug, label }))
          .sort((a, b) => a.label.localeCompare(b.label, 'it')),
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'it'));
  });

  readonly categories = computed(() => [
    'Tutti',
    ...this.categoryMenuService.headerCategories().map((item) => item.label),
  ]);

  readonly products = computed(() => {
    let products = this.catalogService.products();

    const category = this.selectedCategory();
    const categorySlug = this.selectedCategorySlug();
    const group = this.selectedGroup();
    const subcategory = this.selectedSubFilter();

    if (categorySlug) {
      products = products.filter(
        (product) => this.normalizeSlug(product.categorySlug) === categorySlug,
      );
    }

    if (!categorySlug && category !== 'Tutti') {
      products = products.filter((product) => product.category === category);
    }

    if (group && !subcategory) {
      products = products.filter(
        (product) => this.normalizeSlug(product.groupId) === group,
      );
    }

    if (subcategory) {
      products = products.filter(
        (product) =>
          this.normalizeSlug(product.subcategorySlug) === subcategory ||
          this.normalizeSlug(product.subcategory) === subcategory,
      );
    }

    return products;
  });

  constructor() {
    if (this.isBrowser) {
      void this.categoryMenuService.loadCategories();
    }

    this.route.queryParams.subscribe((params) => {
      const categorySlug = params['category']
        ? this.normalizeSlug(String(params['category']))
        : null;
      const group = params['group']
        ? this.normalizeSlug(String(params['group']))
        : null;
      const subcategory = params['subcategory']
        ? this.normalizeSlug(String(params['subcategory']))
        : null;

      this.selectedCategorySlug.set(categorySlug);
      this.selectedGroup.set(group);
      this.selectedSubFilter.set(subcategory);

      if (categorySlug) {
        const categoryData = this.categoryMenuService
          .categories()
          .find((category) => category.slug === categorySlug);
        this.selectedCategory.set(categoryData?.label ?? 'Tutti');
      } else {
        this.selectedCategory.set('Tutti');
      }

      if (this.isBrowser) {
        void this.catalogService.loadProducts(categorySlug);
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.selectedCategorySlug.set(null);
    this.selectedGroup.set(null);
    this.selectedSubFilter.set(null);
  }

  selectGroupOnly(groupId: string): void {
    if (this.selectedGroup() === groupId) {
      this.selectedGroup.set(null);
      this.selectedSubFilter.set(null);
      return;
    }

    this.selectedGroup.set(groupId);
    this.selectedSubFilter.set(null);
  }

  selectSubFilter(subcategorySlug: string, groupId: string): void {
    this.selectedGroup.set(groupId);
    this.selectedSubFilter.set(subcategorySlug);
  }

  clearFilters(): void {
    this.selectedGroup.set(null);
    this.selectedSubFilter.set(null);
  }

  addProduct(product: Product): void {
    this.quoteConfiguratorService.addProduct(product);
  }

  removeProduct(productId: number): void {
    this.quoteConfiguratorService.removeProduct(productId);
  }

  private formatLabelFromSlug(value: string): string {
    return this.normalizeSlug(value)
      .split('-')
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }

  private normalizeSlug(value: string | null | undefined): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

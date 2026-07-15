import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  inject,
  ViewChild,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { CategoryMenuService } from '../../core/services/category-menu.service';
import { FirebaseAuthService } from '../../core/services/firebase-auth.service';
import { FirebaseDataService } from '../../core/services/firebase-data.service';
import { Product } from '../../core/models/product.model';

type AdminSubcategoryOption = {
  slug: string;
  label: string;
};

type AdminCategoryOption = {
  slug: string;
  label: string;
  subcategories: AdminSubcategoryOption[];
};

type PromoFilter = 'all' | 'with-promo' | 'without-promo';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(FirebaseAuthService);
  private readonly dataService = inject(FirebaseDataService);
  private readonly catalogService = inject(CatalogService);
  private readonly categoryMenuService = inject(CategoryMenuService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly user = this.authService.user;
  readonly isAuthReady = this.authService.isReady;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isAdmin = this.authService.isAdmin;
  readonly products = this.catalogService.products;
  readonly tableSearch = signal('');
  readonly promoFilter = signal<PromoFilter>('all');
  readonly categoryFilter = signal('');
  readonly subcategoryFilter = signal('');
  readonly tableSubcategoryOptions = computed(() => {
    const categorySlug = this.categoryFilter().trim();

    if (!categorySlug) {
      return this.categoryOptions().flatMap(
        (category) => category.subcategories,
      );
    }

    return this.findCategoryOption(categorySlug)?.subcategories ?? [];
  });
  readonly filteredProducts = computed(() => {
    const query = this.tableSearch().trim().toLowerCase();
    const promoFilter = this.promoFilter();
    const categoryFilter = this.categoryFilter().trim();
    const subcategoryFilter = this.subcategoryFilter().trim();

    let items = this.products();

    if (categoryFilter) {
      items = items.filter(
        (product) => product.categorySlug === categoryFilter,
      );
    }

    if (subcategoryFilter) {
      items = items.filter(
        (product) => product.subcategorySlug === subcategoryFilter,
      );
    }

    if (promoFilter === 'with-promo') {
      items = items.filter((product) => product.isOffer);
    }

    if (promoFilter === 'without-promo') {
      items = items.filter((product) => !product.isOffer);
    }

    if (!query) {
      return items;
    }

    return items.filter((product) => {
      const searchable = [
        product.code,
        product.name,
        product.shortDescription,
        product.description,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  });
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly editingProductCode = signal<string | null>(null);
  readonly selectedProductCodes = signal<string[]>([]);
  readonly showProductForm = signal(false);
  readonly isEditorPage = signal(false);
  readonly hasSelection = computed(
    () => this.selectedProductCodes().length > 0,
  );
  readonly statusMessage = signal('');
  readonly errorMessage = signal('');
  readonly selectedFileName = signal('Nessun file selezionato');
  readonly bulkFileName = signal('Nessun file selezionato');
  readonly bulkProductsToImport = signal<Product[]>([]);
  readonly showLinkProductsModal = signal(false);
  readonly linkingCategorySlug = signal('');
  readonly linkingSubcategorySlug = signal('');
  readonly linkingResults = signal<Product[]>([]);
  readonly linkingSelectedCodes = signal<string[]>([]);
  readonly isLinkingSearchLoading = signal(false);
  readonly linkingErrorMessage = signal('');
  readonly showScrollTopButton = signal(false);
  readonly showScrollBottomButton = signal(false);
  readonly categoryOptions = computed<AdminCategoryOption[]>(() =>
    this.categoryMenuService.categories().map((category) => ({
      slug: category.slug,
      label: category.label,
      subcategories: category.groups.flatMap((group) =>
        group.subcategories.map((subcategory) => ({
          slug: subcategory.slug,
          label: subcategory.label,
        })),
      ),
    })),
  );

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly productForm = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    shortDescription: ['', [Validators.required]],
    description: ['', [Validators.required]],
    categorySlug: ['', [Validators.required]],
    subcategorySlug: ['', [Validators.required]],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    supplierPrice: [0, [Validators.min(0)]],
    finalPrice: [0, [Validators.min(0)]],
    isOffer: [false],
    offerType: [''],
    discountPercent: [0, [Validators.min(0), Validators.max(100)]],
    relatedProductCodesText: [''],
  });

  private selectedImageFile: File | null = null;
  private currentImageUrl = '';
  private readonly scrollVisibilityThreshold = 160;

  @ViewChild('catalogPreview')
  private catalogPreviewRef?: ElementRef<HTMLElement>;

  @ViewChild('productsTableWrap')
  private productsTableWrapRef?: ElementRef<HTMLElement>;

  constructor() {
    if (this.isBrowser) {
      void this.catalogService.loadProducts().then(() => {
        this.updateScrollButtonState();
      });
      void this.categoryMenuService.loadCategories();
    }

    this.resetProductForm();
    this.updateOfferValidators(false);

    this.route.url.subscribe(() => {
      void this.syncPageModeFromRoute();
    });

    this.route.paramMap.subscribe(() => {
      void this.syncPageModeFromRoute();
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollButtonState();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateScrollButtonState();
  }

  async signIn(): Promise<void> {
    this.errorMessage.set('');
    this.statusMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.authService.signIn(email, password);
      this.statusMessage.set('Accesso completato.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    }
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.showProductForm.set(false);
    this.isEditorPage.set(false);
    this.editingProductCode.set(null);
    this.selectedProductCodes.set([]);
    this.statusMessage.set('Sei uscito dalla sessione.');
  }

  scrollToTop(): void {
    if (!this.isBrowser) {
      return;
    }

    this.catalogPreviewRef?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  scrollToBottom(): void {
    if (!this.isBrowser) {
      return;
    }

    this.productsTableWrapRef?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }

  onTableCategoryFilterChange(categorySlug: string): void {
    this.categoryFilter.set(categorySlug);

    if (
      this.subcategoryFilter() &&
      !this.tableSubcategoryOptions().some(
        (subcategory) => subcategory.slug === this.subcategoryFilter(),
      )
    ) {
      this.subcategoryFilter.set('');
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.selectedImageFile = file;
    this.selectedFileName.set(file?.name ?? 'Nessun file selezionato');
  }

  async onBulkProductsFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.errorMessage.set('');
    this.statusMessage.set('');

    if (!file) {
      this.bulkFileName.set('Nessun file selezionato');
      this.bulkProductsToImport.set([]);
      return;
    }

    this.bulkFileName.set(file.name);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const importedProducts = this.extractProductsFromImportPayload(parsed)
        .map((item) => this.toImportableProduct(item))
        .filter((item): item is Product => item !== null);

      if (!importedProducts.length) {
        this.bulkProductsToImport.set([]);
        this.errorMessage.set(
          'Il file non contiene prodotti validi da importare.',
        );
        return;
      }

      this.bulkProductsToImport.set(importedProducts);
      this.statusMessage.set(
        `File pronto: ${importedProducts.length} prodotti da importare.`,
      );
    } catch {
      this.bulkProductsToImport.set([]);
      this.errorMessage.set('JSON non valido. Verifica il file selezionato.');
    }
  }

  async importProductsFromJson(): Promise<void> {
    const products = this.bulkProductsToImport();

    if (!products.length) {
      this.errorMessage.set('Seleziona prima un file JSON valido.');
      return;
    }

    this.errorMessage.set('');
    this.statusMessage.set('Import massivo in corso...');
    this.isSaving.set(true);

    try {
      const result = await this.dataService.saveProductsBulk(products);
      await this.catalogService.loadProducts();

      this.statusMessage.set(
        `Import completato: ${result.written} prodotti salvati${result.skipped > 0 ? `, ${result.skipped} ignorati` : ''}.`,
      );
      this.bulkProductsToImport.set([]);
      this.bulkFileName.set('Nessun file selezionato');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveProduct(): Promise<void> {
    this.errorMessage.set('');
    this.statusMessage.set('');

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.errorMessage.set(
        'Compila tutti i campi obbligatori prima di salvare.',
      );
      return;
    }

    this.isSaving.set(true);
    this.statusMessage.set('Salvataggio in corso...');

    try {
      const value = this.productForm.getRawValue();
      const product = this.buildProduct(value);
      const wasEditing = this.editingProductCode() !== null;
      const savedProduct = await this.dataService.saveProduct(
        product,
        this.selectedImageFile,
      );

      this.statusMessage.set(
        wasEditing
          ? `Prodotto aggiornato: ${savedProduct.name}`
          : `Prodotto salvato: ${savedProduct.name}`,
      );
      await this.catalogService.loadProducts();
      this.resetProductForm();
      this.editingProductCode.set(null);
      this.showProductForm.set(false);
      void this.router.navigate(['/admin']);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  startAddingProduct(): void {
    void this.router.navigate(['/admin/prodotto/nuovo']);
  }

  editProduct(product: Product): void {
    void this.router.navigate(['/admin/prodotto', product.code]);
  }

  async togglePromoForProduct(product: Product): Promise<void> {
    this.errorMessage.set('');
    this.statusMessage.set('');
    this.isSaving.set(true);

    try {
      const nextIsOffer = !product.isOffer;
      const nextDiscount = nextIsOffer
        ? this.clampDiscount(product.discountPercent ?? 10)
        : 0;
      const nextOfferType = nextIsOffer
        ? (product.offerType?.trim() || 'Promo')
        : undefined;
      const updatedProduct: Product = {
        ...product,
        isOffer: nextIsOffer,
        offerType: nextOfferType,
        offerLabel: nextOfferType
          ? this.getOfferTypeLabel(nextOfferType)
          : undefined,
        discountPercent: nextIsOffer ? nextDiscount : undefined,
        finalPrice: nextIsOffer
          ? this.calculateDiscountedPrice(product.basePrice, nextDiscount)
          : undefined,
      };

      await this.dataService.saveProduct(updatedProduct);
      await this.catalogService.loadProducts();
      this.statusMessage.set(
        nextIsOffer
          ? `Promo attivata per ${product.name}`
          : `Promo disattivata per ${product.name}`,
      );
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  async toggleProductActive(product: Product): Promise<void> {
    this.errorMessage.set('');
    this.statusMessage.set('');
    this.isSaving.set(true);

    try {
      const nextIsActive = !product.isActive;
      await this.dataService.saveProduct({
        ...product,
        isActive: nextIsActive,
      });

      await this.catalogService.loadProducts();
      this.statusMessage.set(
        nextIsActive
          ? `Prodotto attivato: ${product.name}`
          : `Prodotto disattivato: ${product.name}`,
      );
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  private openEditorWithProduct(product: Product): void {
    this.errorMessage.set('');
    this.statusMessage.set('');
    this.editingProductCode.set(product.code);
    this.isEditorPage.set(true);
    this.showProductForm.set(true);
    this.selectedImageFile = null;
    this.selectedFileName.set('Nessun file selezionato');
    this.currentImageUrl = product.imageUrl;

    this.productForm.patchValue({
      code: product.code,
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      categorySlug: product.categorySlug,
      subcategorySlug: product.subcategorySlug,
      basePrice: product.basePrice,
      supplierPrice: this.normalizeMoney(product.supplierPrice ?? 0),
      finalPrice: this.getFinalPriceForProduct(product),
      isOffer: product.isOffer,
      offerType: product.offerType ?? product.offerLabel ?? '',
      discountPercent: product.discountPercent ?? 0,
      relatedProductCodesText: (product.relatedProductCodes ?? []).join(', '),
    });

    this.updateOfferValidators(product.isOffer);

    this.applyCategorySelection(product.categorySlug, product.subcategorySlug);
  }

  onCategorySelectionChange(categorySlug: string): void {
    this.applyCategorySelection(categorySlug);
  }

  openLinkProductsModal(): void {
    this.linkingErrorMessage.set('');
    this.showLinkProductsModal.set(true);
    this.linkingCategorySlug.set(this.productForm.value.categorySlug ?? '');
    this.linkingSubcategorySlug.set('');
    this.linkingResults.set([]);
    this.linkingSelectedCodes.set(
      this.splitCsv(this.productForm.value.relatedProductCodesText ?? ''),
    );
  }

  closeLinkProductsModal(): void {
    this.showLinkProductsModal.set(false);
    this.linkingErrorMessage.set('');
    this.isLinkingSearchLoading.set(false);
  }

  onLinkingCategoryChange(categorySlug: string): void {
    this.linkingCategorySlug.set(categorySlug);
    this.linkingSubcategorySlug.set('');
    this.linkingResults.set([]);
    this.linkingErrorMessage.set('');
  }

  onLinkingSubcategoryChange(subcategorySlug: string): void {
    this.linkingSubcategorySlug.set(subcategorySlug);
  }

  getLinkingSubcategoryOptions(): AdminSubcategoryOption[] {
    return (
      this.findCategoryOption(this.linkingCategorySlug())?.subcategories ?? []
    );
  }

  async searchLinkableProducts(): Promise<void> {
    const categorySlug = this.linkingCategorySlug().trim();

    if (!categorySlug) {
      this.linkingErrorMessage.set('Seleziona prima una categoria.');
      return;
    }

    this.linkingErrorMessage.set('');
    this.isLinkingSearchLoading.set(true);

    try {
      const products = await this.dataService.listProducts(categorySlug);
      const selectedSubcategory = this.linkingSubcategorySlug().trim();
      const currentCode = (this.productForm.value.code ?? '')
        .trim()
        .toUpperCase();
      const filtered = products
        .filter((product) =>
          selectedSubcategory
            ? product.subcategorySlug === selectedSubcategory
            : true,
        )
        .filter((product) => product.code.trim().toUpperCase() !== currentCode)
        .sort((a, b) => a.name.localeCompare(b.name, 'it'));

      this.linkingResults.set(filtered);

      if (!filtered.length) {
        this.linkingErrorMessage.set(
          'Nessun prodotto trovato con i filtri selezionati.',
        );
      }
    } catch (error) {
      this.linkingErrorMessage.set(this.getErrorMessage(error));
      this.linkingResults.set([]);
    } finally {
      this.isLinkingSearchLoading.set(false);
    }
  }

  toggleLinkingProduct(code: string, checked: boolean): void {
    const normalizedCode = code.trim().toUpperCase();

    this.linkingSelectedCodes.update((codes) => {
      if (checked) {
        return codes.includes(normalizedCode)
          ? codes
          : [...codes, normalizedCode];
      }

      return codes.filter((item) => item !== normalizedCode);
    });
  }

  isLinkingProductSelected(code: string): boolean {
    return this.linkingSelectedCodes().includes(code.trim().toUpperCase());
  }

  addLinkedProducts(): void {
    const current = this.splitCsv(
      this.productForm.value.relatedProductCodesText ?? '',
    );
    const mergedCodes = Array.from(
      new Set([...current, ...this.linkingSelectedCodes()]),
    );

    this.productForm.patchValue({
      relatedProductCodesText: mergedCodes.join(', '),
    });

    this.closeLinkProductsModal();
  }

  onBasePriceInput(): void {
    const { basePrice, discountPercent, isOffer } =
      this.productForm.getRawValue();
    const normalizedBase = this.normalizeMoney(basePrice);

    if (!isOffer) {
      this.productForm.patchValue(
        {
          basePrice: normalizedBase,
          finalPrice: normalizedBase,
          discountPercent: 0,
        },
        { emitEvent: false },
      );
      return;
    }

    const normalizedDiscount = this.clampDiscount(discountPercent);
    const finalPrice = this.calculateDiscountedPrice(
      normalizedBase,
      normalizedDiscount,
    );

    this.productForm.patchValue(
      {
        basePrice: normalizedBase,
        discountPercent: normalizedDiscount,
        finalPrice,
      },
      { emitEvent: false },
    );
  }

  onDiscountPercentInput(): void {
    const { basePrice, discountPercent } = this.productForm.getRawValue();
    const normalizedBase = this.normalizeMoney(basePrice);
    const normalizedDiscount = this.clampDiscount(discountPercent);
    const finalPrice = this.calculateDiscountedPrice(
      normalizedBase,
      normalizedDiscount,
    );

    this.productForm.patchValue(
      {
        basePrice: normalizedBase,
        discountPercent: normalizedDiscount,
        finalPrice,
        isOffer: normalizedDiscount > 0,
      },
      { emitEvent: false },
    );
  }

  onFinalPriceInput(): void {
    const { basePrice, finalPrice } = this.productForm.getRawValue();
    const normalizedBase = this.normalizeMoney(basePrice);
    const normalizedFinal = this.normalizeMoney(finalPrice);

    if (normalizedBase <= 0) {
      this.productForm.patchValue(
        {
          basePrice: 0,
          finalPrice: 0,
          discountPercent: 0,
          isOffer: false,
        },
        { emitEvent: false },
      );
      return;
    }

    const boundedFinal = Math.min(normalizedBase, normalizedFinal);
    const discountPercent = this.clampDiscount(
      ((normalizedBase - boundedFinal) / normalizedBase) * 100,
    );

    this.productForm.patchValue(
      {
        basePrice: normalizedBase,
        finalPrice: boundedFinal,
        discountPercent,
        isOffer: discountPercent > 0,
      },
      { emitEvent: false },
    );
  }

  onOfferToggle(checked: boolean): void {
    const { basePrice } = this.productForm.getRawValue();
    const normalizedBase = this.normalizeMoney(basePrice);

    this.updateOfferValidators(checked);

    if (!checked) {
      this.productForm.patchValue(
        {
          isOffer: false,
          offerType: '',
          discountPercent: 0,
          finalPrice: normalizedBase,
        },
        { emitEvent: false },
      );
      return;
    }

    const { discountPercent } = this.productForm.getRawValue();
    const normalizedDiscount =
      this.clampDiscount(discountPercent) > 0
        ? this.clampDiscount(discountPercent)
        : 10;

    this.productForm.patchValue(
      {
        isOffer: true,
        offerType: (this.productForm.value.offerType ?? '').trim() || 'Promo',
        discountPercent: normalizedDiscount,
        finalPrice: this.calculateDiscountedPrice(
          normalizedBase,
          normalizedDiscount,
        ),
      },
      { emitEvent: false },
    );
  }

  onSubcategorySelectionChange(subcategorySlug: string): void {
    this.productForm.patchValue({
      subcategorySlug,
    });
  }

  getCurrentSubcategoryOptions(): AdminSubcategoryOption[] {
    return (
      this.findCategoryOption(this.productForm.value.categorySlug)
        ?.subcategories ?? []
    );
  }

  cancelEdit(): void {
    void this.router.navigate(['/admin']);
  }

  async deleteProduct(product: Product): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    const confirmDelete = window.confirm(`Vuoi eliminare "${product.name}"?`);

    if (!confirmDelete) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

    try {
      await this.dataService.deleteProduct(product.code);
      await this.catalogService.loadProducts();
      this.selectedProductCodes.update((codes) =>
        codes.filter((code) => code !== product.code),
      );

      if (this.editingProductCode() === product.code) {
        this.cancelEdit();
      }

      this.statusMessage.set(`Prodotto eliminato: ${product.name}`);
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isDeleting.set(false);
    }
  }

  async deleteSelectedProducts(): Promise<void> {
    if (!this.isBrowser || !this.hasSelection()) {
      return;
    }

    const selectedCodes = this.selectedProductCodes();
    const confirmDelete = window.confirm(
      `Vuoi eliminare ${selectedCodes.length} prodotti selezionati?`,
    );

    if (!confirmDelete) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.statusMessage.set('');

    try {
      await this.dataService.deleteProducts(selectedCodes);
      await this.catalogService.loadProducts();
      this.selectedProductCodes.set([]);

      if (
        this.editingProductCode() !== null &&
        selectedCodes.includes(this.editingProductCode()!)
      ) {
        this.cancelEdit();
      }

      this.statusMessage.set(
        `${selectedCodes.length} prodotti eliminati con successo.`,
      );
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isDeleting.set(false);
    }
  }

  toggleProductSelection(productCode: string, checked: boolean): void {
    this.selectedProductCodes.update((codes) => {
      if (checked) {
        return codes.includes(productCode) ? codes : [...codes, productCode];
      }

      return codes.filter((code) => code !== productCode);
    });
  }

  toggleAllSelections(checked: boolean): void {
    if (!checked) {
      this.selectedProductCodes.set([]);
      return;
    }

    this.selectedProductCodes.set(
      this.filteredProducts().map((product) => product.code),
    );
  }

  isSelected(productCode: string): boolean {
    return this.selectedProductCodes().includes(productCode);
  }

  isAllSelected(): boolean {
    const products = this.filteredProducts();
    const selected = this.selectedProductCodes();

    return (
      products.length > 0 &&
      products.every((product) => selected.includes(product.code))
    );
  }

  trackByLinkingProductId(_index: number, product: Product): number {
    return product.id;
  }

  private buildProduct(value: {
    code: string;
    name: string;
    shortDescription: string;
    description: string;
    categorySlug: string;
    subcategorySlug: string;
    basePrice: number;
    supplierPrice: number;
    finalPrice: number;
    isOffer: boolean;
    offerType: string;
    discountPercent: number;
    relatedProductCodesText: string;
  }): Product {
    const normalizedCode = value.code.trim().toUpperCase();
    const normalizedBasePrice = this.normalizeMoney(value.basePrice);
    const normalizedFinalPrice = this.normalizeMoney(value.finalPrice);
    const normalizedDiscount = this.clampDiscount(value.discountPercent);
    const normalizedCategorySlug = value.categorySlug.trim();
    const normalizedSubcategorySlug = value.subcategorySlug.trim();
    const existingProduct = this.editingProductCode()
      ? this.products().find(
          (product) => product.code === this.editingProductCode(),
        )
      : null;

    return {
      id: this.createNumericIdFromCode(normalizedCode),
      slug: '',
      code: normalizedCode,
      name: value.name.trim(),
      category: normalizedCategorySlug,
      categorySlug: normalizedCategorySlug,
      groupId: '',
      subcategory: normalizedSubcategorySlug,
      subcategorySlug: normalizedSubcategorySlug,
      shortDescription: value.shortDescription.trim(),
      description: value.description.trim(),
      basePrice: normalizedBasePrice,
      supplierPrice: this.normalizeMoney(value.supplierPrice),
      finalPrice:
        value.isOffer && normalizedDiscount > 0
          ? Math.min(normalizedBasePrice, normalizedFinalPrice)
          : undefined,
      imageUrl: this.currentImageUrl,
      tags: [],
      isActive: existingProduct?.isActive ?? true,
      isOffer: value.isOffer,
      offerLabel: value.isOffer
        ? this.getOfferTypeLabel(value.offerType)
        : undefined,
      offerType: value.isOffer ? value.offerType.trim() || 'Promo' : undefined,
      discountPercent:
        value.isOffer && normalizedDiscount > 0
          ? normalizedDiscount
          : undefined,
      relatedProductCodes: this.splitCsv(value.relatedProductCodesText),
      optionGroups: [],
    };
  }

  private splitCsv(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
  }

  private extractProductsFromImportPayload(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { documents?: unknown[] }).documents)
    ) {
      return (payload as { documents: unknown[] }).documents.map((entry) => {
        if (entry && typeof entry === 'object' && 'data' in entry) {
          return (entry as { data?: unknown }).data;
        }

        return entry;
      });
    }

    return [];
  }

  private toImportableProduct(raw: unknown): Product | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const value = raw as Partial<Product>;
    const code = String(value.code ?? value.id ?? '')
      .trim()
      .toUpperCase();

    if (!code) {
      return null;
    }

    const categorySlug = this.normalizeSlug(
      String(value.categorySlug ?? value.category ?? ''),
    );
    const subcategorySlug = this.normalizeSlug(
      String(value.subcategorySlug ?? value.subcategory ?? ''),
    );

    const normalizedBasePrice = this.normalizeMoney(
      Number(value.basePrice ?? 0),
    );
    const normalizedDiscount =
      typeof value.discountPercent === 'number'
        ? this.clampDiscount(value.discountPercent)
        : undefined;

    const offerType =
      value.offerType === 'promo' ||
      value.offerType === 'flash' ||
      value.offerType === 'stagionale'
        ? value.offerType
        : undefined;

    return {
      id:
        typeof value.id === 'number' && Number.isFinite(value.id)
          ? value.id
          : this.createNumericIdFromCode(code),
      slug: String(value.slug ?? ''),
      code,
      name: String(value.name ?? code),
      category: String(value.category ?? categorySlug),
      categorySlug,
      groupId: String(value.groupId ?? ''),
      subcategory: String(value.subcategory ?? subcategorySlug),
      subcategorySlug,
      shortDescription: String(value.shortDescription ?? ''),
      description: String(value.description ?? ''),
      basePrice: normalizedBasePrice,
      finalPrice:
        typeof value.finalPrice === 'number'
          ? this.normalizeMoney(value.finalPrice)
          : undefined,
      imageUrl: String(value.imageUrl ?? ''),
      tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
      isActive: value.isActive !== false,
      isOffer: Boolean(value.isOffer),
      offerType:
        typeof value.offerType === 'string' ? value.offerType.trim() : offerType,
      offerLabel:
        typeof value.offerLabel === 'string'
          ? value.offerLabel
          : typeof value.offerType === 'string' && value.offerType.trim()
            ? value.offerType.trim()
            : offerType
              ? this.getOfferTypeLabel(offerType)
            : undefined,
      discountPercent: normalizedDiscount,
      supplierPrice:
        typeof value.supplierPrice === 'number'
          ? this.normalizeMoney(value.supplierPrice)
          : undefined,
      relatedProductCodes: Array.isArray(value.relatedProductCodes)
        ? value.relatedProductCodes.map((item) => String(item).toUpperCase())
        : [],
      optionGroups: Array.isArray(value.optionGroups) ? value.optionGroups : [],
    };
  }

  private normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Si è verificato un errore inatteso.';
  }

  trackByProductId(_index: number, product: Product): string {
    return product.code;
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  getDiscountedPricePreview(): number | null {
    const { basePrice, discountPercent, isOffer } =
      this.productForm.getRawValue();

    if (!isOffer || !discountPercent || discountPercent <= 0) {
      return null;
    }

    return this.calculateDiscountedPrice(basePrice, discountPercent);
  }

  private calculateDiscountedPrice(
    basePrice: number,
    discountPercent: number,
  ): number {
    const normalizedBase = this.normalizeMoney(basePrice);
    const normalizedDiscount = this.clampDiscount(discountPercent);
    const discountValue = (normalizedBase * normalizedDiscount) / 100;
    return this.normalizeMoney(Math.max(0, normalizedBase - discountValue));
  }

  private clampDiscount(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private normalizeMoney(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.round(value * 100) / 100);
  }

  private getOfferTypeLabel(type: string): string {
    return type.trim();
  }

  private getFinalPriceForProduct(product: Product): number {
    if (typeof product.finalPrice === 'number' && product.finalPrice > 0) {
      return this.normalizeMoney(product.finalPrice);
    }

    if (product.discountPercent && product.discountPercent > 0) {
      return this.calculateDiscountedPrice(
        product.basePrice,
        product.discountPercent,
      );
    }

    return this.normalizeMoney(product.basePrice);
  }

  private resetProductForm(): void {
    const defaultCategory = this.categoryOptions()[0];
    const defaultSubcategory = defaultCategory?.subcategories[0];

    this.productForm.patchValue({
      code: '',
      name: '',
      shortDescription: '',
      description: '',
      categorySlug: defaultCategory?.slug ?? '',
      subcategorySlug: defaultSubcategory?.slug ?? '',
      basePrice: 0,
      supplierPrice: 0,
      finalPrice: 0,
      isOffer: false,
      offerType: '',
      discountPercent: 0,
      relatedProductCodesText: '',
    });

    this.updateOfferValidators(false);

    this.selectedImageFile = null;
    this.currentImageUrl = '';
    this.selectedFileName.set('Nessun file selezionato');
  }

  private updateOfferValidators(isOffer: boolean): void {
    const finalPriceControl = this.productForm.controls.finalPrice;
    const discountControl = this.productForm.controls.discountPercent;
    const offerTypeControl = this.productForm.controls.offerType;

    if (isOffer) {
      finalPriceControl.setValidators([Validators.required, Validators.min(0)]);
      discountControl.setValidators([
        Validators.required,
        Validators.min(0),
        Validators.max(100),
      ]);
      offerTypeControl.setValidators([Validators.required]);
    } else {
      finalPriceControl.setValidators([Validators.min(0)]);
      discountControl.setValidators([Validators.min(0), Validators.max(100)]);
      offerTypeControl.setValidators([]);
    }

    finalPriceControl.updateValueAndValidity({ emitEvent: false });
    discountControl.updateValueAndValidity({ emitEvent: false });
    offerTypeControl.updateValueAndValidity({ emitEvent: false });
  }

  private createNumericIdFromCode(code: string): number {
    const normalized = code.trim().toUpperCase();

    if (!normalized) {
      return 0;
    }

    let hash = 0;

    for (let index = 0; index < normalized.length; index += 1) {
      hash = (hash * 31 + normalized.charCodeAt(index)) | 0;
    }

    return Math.abs(hash);
  }

  private applyCategorySelection(
    categorySlug: string,
    preferredSubcategorySlug?: string,
  ): void {
    const category = this.findCategoryOption(categorySlug);

    if (!category) {
      this.productForm.patchValue({
        categorySlug: '',
        subcategorySlug: '',
      });
      return;
    }

    const subcategory =
      category.subcategories.find(
        (item) => item.slug === preferredSubcategorySlug,
      ) ?? category.subcategories[0];

    this.productForm.patchValue({
      categorySlug: category.slug,
      subcategorySlug: subcategory?.slug ?? '',
    });
  }

  private findCategoryOption(
    categorySlug: string | null | undefined,
  ): AdminCategoryOption | undefined {
    const normalizedSlug = categorySlug?.trim() ?? '';
    return this.categoryOptions().find((item) => item.slug === normalizedSlug);
  }

  private prepareNewProductForm(): void {
    this.errorMessage.set('');
    this.statusMessage.set('');
    this.editingProductCode.set(null);
    this.resetProductForm();
    this.showProductForm.set(true);
    this.isEditorPage.set(true);
  }

  private updateScrollButtonState(): void {
    if (!this.isBrowser) {
      return;
    }

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight;
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
    const canScroll = scrollHeight > viewportHeight + 40;

    this.showScrollTopButton.set(scrollTop > this.scrollVisibilityThreshold);
    this.showScrollBottomButton.set(
      canScroll &&
        scrollTop + viewportHeight <
          scrollHeight - this.scrollVisibilityThreshold,
    );
  }

  private async syncPageModeFromRoute(): Promise<void> {
    const currentPath = this.router.url.split('?')[0] ?? '';
    const isEditor = currentPath.startsWith('/admin/prodotto');

    this.isEditorPage.set(isEditor);

    if (!isEditor) {
      this.showProductForm.set(false);
      this.closeLinkProductsModal();
      this.resetProductForm();
      this.editingProductCode.set(null);
      return;
    }

    const codeFromRoute = this.route.snapshot.paramMap.get('code');

    if (!codeFromRoute) {
      this.prepareNewProductForm();
      return;
    }

    const normalizedCode = codeFromRoute.trim().toUpperCase();
    const existing = this.products().find(
      (product) => product.code.toUpperCase() === normalizedCode,
    );

    if (existing) {
      this.openEditorWithProduct(existing);
      return;
    }

    const product = await this.dataService.getProductByCode(normalizedCode);

    if (!product) {
      this.errorMessage.set('Prodotto non trovato.');
      void this.router.navigate(['/admin']);
      return;
    }

    this.openEditorWithProduct(product);
  }
}

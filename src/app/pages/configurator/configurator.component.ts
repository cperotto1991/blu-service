import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { PriceVisibilityService } from '../../core/services/price-visibility.service';

@Component({
  selector: 'app-configurator',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './configurator.component.html',
  styleUrl: './configurator.component.scss',
})
export class ConfiguratorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly priceVisibilityService = inject(PriceVisibilityService);

  step = signal(0);
  quantity = signal(1);
  selectedOptions = signal<Record<string, string>>({});

  customerName = '';
  customerEmail = '';
  customerPhone = '';
  notes = '';

  product = computed(() => {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? Number(idStr) : NaN;
    if (!Number.isFinite(id)) return undefined;
    return this.catalogService.getById(id);
  });

  constructor() {
    const idStr = this.route.snapshot.paramMap.get('id') ?? '';
    const id = idStr ? Number(idStr) : NaN;
    if (Number.isFinite(id)) {
      this.catalogService.loadProductById(id);
    }
  }

  currentGroup = computed(() => this.product()?.optionGroups[this.step()]);

  total = computed(() => {
    const product = this.product();
    if (!product) return 0;

    return this.catalogService.calculateTotal(
      product,
      this.selectedOptions(),
      this.quantity(),
    );
  });

  readonly canSeeProductPrice = computed(() =>
    this.priceVisibilityService.canSeeProductPrice(this.product()),
  );

  readonly canSeeSupplierPrice = computed(() =>
    this.priceVisibilityService.canSeeSupplierPrice(this.product()),
  );

  selectOption(groupId: string, optionId: string): void {
    this.selectedOptions.update((current) => ({
      ...current,
      [groupId]: optionId,
    }));
  }

  next(): void {
    const product = this.product();
    if (!product) return;

    if (this.step() < product.optionGroups.length) {
      this.step.update((value) => value + 1);
    }
  }

  previous(): void {
    this.step.update((value) => Math.max(0, value - 1));
  }

  submit(): void {
    const product = this.product();
    if (!product) return;

    this.catalogService.submitQuoteRequest({
      productId: product.id,
      selectedOptions: this.selectedOptions(),
      quantity: this.quantity(),
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      customerPhone: this.customerPhone,
      notes: this.notes,
      estimatedTotal: this.total(),
    });

    alert(
      'Richiesta preventivo inviata in modalità mock. Sì, un alert. Sopravvivremo.',
    );
  }
}

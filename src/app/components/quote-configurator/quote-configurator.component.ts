import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuoteConfiguratorService } from '../../core/services/quote-configurator.service';

@Component({
  selector: 'app-quote-configurator',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './quote-configurator.component.html',
  styleUrls: ['./quote-configurator.component.scss'],
})
export class QuoteConfiguratorComponent {
  constructor(
    private readonly quoteConfiguratorService: QuoteConfiguratorService,
  ) {}

  get selectedProducts() {
    return this.quoteConfiguratorService.selectedProducts;
  }

  get selectedTotal() {
    return this.quoteConfiguratorService.selectedTotal;
  }

  removeProduct(id: number): void {
    this.quoteConfiguratorService.removeProduct(id);
  }
}

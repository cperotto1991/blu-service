import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuoteConfiguratorService } from '../../core/services/quote-configurator.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-quote-request',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './quote-request.component.html',
  styleUrl: './quote-request.component.scss',
})
export class QuoteRequestComponent {
  private readonly quoteConfiguratorService = inject(QuoteConfiguratorService);
  private readonly location = inject(Location);

  readonly selectedProducts = this.quoteConfiguratorService.selectedProducts;
  readonly selectedTotal = this.quoteConfiguratorService.selectedTotal;

  removeProduct(productId: number): void {
    this.quoteConfiguratorService.removeProduct(productId);
  }

  clearConfiguration(): void {
    this.quoteConfiguratorService.clear();
  }

  goBack(): void {
    this.location.back();
  }

  requestQuote(): void {
    alert('Richiesta di preventivo inviata! Verrai contattato al più presto.');
    this.quoteConfiguratorService.clear();
    this.location.back();
  }
}

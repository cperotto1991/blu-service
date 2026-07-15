import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { isPlatformBrowser } from '@angular/common';
import { PriceVisibilityService } from '../../core/services/price-visibility.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.scss',
})
export class OffersComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly priceVisibilityService = inject(PriceVisibilityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  offers = this.catalogService.offers;

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    void this.catalogService.loadOffers();
  }

  canSeeOfferPrice(product: Product): boolean {
    return this.priceVisibilityService.canSeeProductPrice(product);
  }

  canSeeSupplierPrice(product: Product): boolean {
    return this.priceVisibilityService.canSeeSupplierPrice(product);
  }
}

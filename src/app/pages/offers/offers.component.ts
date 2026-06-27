import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.scss',
})
export class OffersComponent {
  private readonly catalogService = inject(CatalogService);
  offers = this.catalogService.offers;
}

import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'offerte',
        loadComponent: () =>
          import('./pages/offers/offers.component').then(
            (m) => m.OffersComponent,
          ),
      },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./pages/catalog/catalog.component').then(
            (m) => m.CatalogComponent,
          ),
      },
      {
        path: 'catalogo/:id',
        loadComponent: () =>
          import('./pages/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent,
          ),
      },
      {
        path: 'configura/:id',
        loadComponent: () =>
          import('./pages/configurator/configurator.component').then(
            (m) => m.ConfiguratorComponent,
          ),
      },
      {
        path: 'richiesta-preventivo',
        loadComponent: () =>
          import('./pages/quote-request/quote-request.component').then(
            (m) => m.QuoteRequestComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { priceVisibilityGuard } from './core/guards/price-visibility.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        canActivate: [priceVisibilityGuard],
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'offerte',
        canActivate: [priceVisibilityGuard],
        loadComponent: () =>
          import('./pages/offers/offers.component').then(
            (m) => m.OffersComponent,
          ),
      },
      {
        path: 'catalogo',
        canActivate: [priceVisibilityGuard],
        loadComponent: () =>
          import('./pages/catalog/catalog.component').then(
            (m) => m.CatalogComponent,
          ),
      },
      {
        path: 'catalogo/:code',
        canActivate: [priceVisibilityGuard],
        loadComponent: () =>
          import('./pages/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent,
          ),
      },
      {
        path: 'configura/:id',
        canActivate: [priceVisibilityGuard],
        loadComponent: () =>
          import('./pages/configurator/configurator.component').then(
            (m) => m.ConfiguratorComponent,
          ),
      },
      {
        path: 'richiesta-preventivo',
        canActivate: [priceVisibilityGuard],
        loadComponent: () =>
          import('./pages/quote-request/quote-request.component').then(
            (m) => m.QuoteRequestComponent,
          ),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./pages/admin/admin.component').then((m) => m.AdminComponent),
      },
      {
        path: 'admin/prodotto/nuovo',
        loadComponent: () =>
          import('./pages/admin/admin.component').then((m) => m.AdminComponent),
      },
      {
        path: 'admin/prodotto/:code',
        loadComponent: () =>
          import('./pages/admin/admin.component').then((m) => m.AdminComponent),
      },
      {
        path: 'admin/categorie',
        loadComponent: () =>
          import('./pages/admin-categories/admin-categories.component').then(
            (m) => m.AdminCategoriesComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

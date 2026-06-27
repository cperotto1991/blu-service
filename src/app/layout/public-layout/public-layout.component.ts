import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../site-header/site-header.component';
import { SiteFooterComponent } from '../site-footer/site-footer.component';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  template: `
    <app-site-header />
    <main>
      <router-outlet />
    </main>
    <app-site-footer />
  `,
})
export class PublicLayoutComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  ngOnInit(): void {
    this.catalogService.loadProducts();
  }
}

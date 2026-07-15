import { Injectable, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FirebaseAuthService } from './firebase-auth.service';
import type { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class PriceVisibilityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly authService = inject(FirebaseAuthService);
  private readonly collaboratorGuestModeSignal = signal(false);

  readonly isCollaboratorGuestMode =
    this.collaboratorGuestModeSignal.asReadonly();

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const raw = localStorage.getItem('blu-collaborator-guest-mode');
    this.collaboratorGuestModeSignal.set(raw === 'true');
  }

  readonly canSeeRestrictedPrices = computed(() =>
    this.authService.isPrivileged(),
  );

  canSeePriceForFlag(showPrice: boolean | null | undefined): boolean {
    return showPrice !== false || this.canSeeRestrictedPrices();
  }

  canSeeProductPrice(
    product: Pick<Product, 'showPrice'> | null | undefined,
  ): boolean {
    return this.canSeePriceForFlag(product?.showPrice);
  }

  canSeeSupplierPrice(
    product: Pick<Product, 'supplierPrice'> | null | undefined,
  ): boolean {
    const supplierPrice = product?.supplierPrice;

    return (
      this.authService.isCollaborator() &&
      !this.collaboratorGuestModeSignal() &&
      typeof supplierPrice === 'number' &&
      Number.isFinite(supplierPrice)
    );
  }

  toggleCollaboratorGuestMode(): void {
    if (!this.authService.isCollaborator()) {
      return;
    }

    const next = !this.collaboratorGuestModeSignal();
    this.collaboratorGuestModeSignal.set(next);

    if (this.isBrowser) {
      localStorage.setItem('blu-collaborator-guest-mode', String(next));
    }
  }
}

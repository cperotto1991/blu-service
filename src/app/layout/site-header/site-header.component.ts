import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Location } from '@angular/common';
import { inject } from '@angular/core';
import { FirebaseAuthService } from '../../core/services/firebase-auth.service';
import { CategoryMenuService } from '../../core/services/category-menu.service';
import { PriceVisibilityService } from '../../core/services/price-visibility.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.scss',
})
export class SiteHeaderComponent {
  mobileMenuOpen = signal(false);
  userMenuOpen = signal(false);
  private readonly location = inject(Location);
  private readonly authService = inject(FirebaseAuthService);
  private readonly categoryMenuService = inject(CategoryMenuService);
  private readonly priceVisibilityService = inject(PriceVisibilityService);

  readonly user = this.authService.user;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isAdmin = this.authService.isAdmin;
  readonly isCollaborator = this.authService.isCollaborator;
  readonly isCollaboratorGuestMode =
    this.priceVisibilityService.isCollaboratorGuestMode;
  readonly navCategories = this.categoryMenuService.headerCategories;

  constructor() {
    void this.categoryMenuService.loadCategories();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.location.back();
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.userMenuOpen.set(false);
  }

  toggleCollaboratorGuestMode(): void {
    this.priceVisibilityService.toggleCollaboratorGuestMode();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.userMenuOpen.set(false);
  }
}

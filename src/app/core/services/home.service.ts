import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  private readonly offersSignal = signal<Product[]>([]);
  readonly offers = computed(() => this.offersSignal());

  loadOffers(): void {
    this.http.get<Product[]>(`${this.apiBaseUrl}/offers`).subscribe({
      next: (offers) => this.offersSignal.set(offers),
      error: (error) => {
        console.error('Impossibile caricare le offerte home:', error);
        this.offersSignal.set([]);
      },
    });
  }
}

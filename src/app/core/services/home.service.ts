import { Injectable, computed, inject, signal } from '@angular/core';
import { Product } from '../models/product.model';
import { FirebaseDataService } from './firebase-data.service';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  private readonly firebaseDataService = inject(FirebaseDataService);

  private readonly offersSignal = signal<Product[]>([]);
  readonly offers = computed(() => this.offersSignal());

  async loadOffers(): Promise<void> {
    try {
      const offers = await this.firebaseDataService.listOffers();
      this.offersSignal.set(offers);
    } catch (error) {
      console.error('Impossibile caricare le offerte home da Firebase:', error);
      this.offersSignal.set([]);
    }
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { hasFirebaseConfig } from '../firebase/firebase.config';
import { MenuCategory } from '../models/menu-category.model';
import { FirebaseDataService } from './firebase-data.service';

const DEFAULT_CATEGORIES: MenuCategory[] = [
  {
    slug: 'depuratori',
    label: 'Depuratori',
    order: 10,
    enabled: true,
    groups: [
      {
        slug: 'depuratori-dispenser-acqua',
        label: 'Depuratori e dispenser acqua',
        enabled: true,
        subcategories: [
          { slug: 'uso-domestico', label: 'Uso domestico', enabled: true },
          {
            slug: 'bar-ristoranti',
            label: 'Bar e Ristoranti',
            enabled: true,
          },
          { slug: 'hotel', label: 'Hotel', enabled: true },
          {
            slug: 'uffici-locali-pubblici',
            label: 'Uffici e locali pubblici',
            enabled: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'addolcitori',
    label: 'Addolcitori',
    order: 20,
    enabled: true,
    groups: [
      {
        slug: 'addolcitori',
        label: 'Addolcitori',
        enabled: true,
        subcategories: [
          { slug: 'cabinati', label: 'Cabinati', enabled: true },
          { slug: 'doppio-corpo', label: 'Doppio corpo', enabled: true },
          {
            slug: 'decalcificatori-elettronici',
            label: 'Decalcificatori elettronici',
            enabled: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'sanificazione',
    label: 'Sanificazione',
    order: 30,
    enabled: true,
    groups: [
      {
        slug: 'sanificazione-acqua',
        label: 'Sanificazione acqua',
        enabled: true,
        subcategories: [
          {
            slug: 'ozonizzatori-acqua',
            label: 'Ozonizzatori acqua completi',
            enabled: true,
          },
          {
            slug: 'accessori-ozonizzatori',
            label: 'Accessori ozonizzatori',
            enabled: true,
          },
          {
            slug: 'sistemi-uv',
            label: 'Sistemi UV acqua completi',
            enabled: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'miscelatori',
    label: 'Miscelatori',
    order: 40,
    enabled: true,
    groups: [
      {
        slug: 'rubinetteria',
        label: 'Rubinetteria',
        enabled: true,
        subcategories: [
          {
            slug: 'rubinetti-3-vie',
            label: 'Rubinetti 3 vie',
            enabled: true,
          },
          {
            slug: 'rubinetti-4-vie',
            label: 'Rubinetti 4 vie',
            enabled: true,
          },
          {
            slug: 'rubinetti-5-vie',
            label: 'Rubinetti 5 vie',
            enabled: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'accessori',
    label: 'Accessori',
    order: 50,
    enabled: true,
    groups: [
      {
        slug: 'accessori-cucina',
        label: 'Accessori cucina',
        enabled: true,
        subcategories: [
          { slug: 'pattumiere', label: 'Pattumiere', enabled: true },
          { slug: 'tritarifiuti', label: 'Tritarifiuti', enabled: true },
          {
            slug: 'borracce-termiche',
            label: 'Borracce termiche',
            enabled: true,
          },
        ],
      },
    ],
  },
];

@Injectable({
  providedIn: 'root',
})
export class CategoryMenuService {
  private readonly firebaseDataService = inject(FirebaseDataService);
  private readonly categoriesSignal =
    signal<MenuCategory[]>(DEFAULT_CATEGORIES);

  readonly categories = computed(() => this.categoriesSignal());
  readonly headerCategories = computed(() =>
    this.categoriesSignal()
      .filter((item) => item.enabled)
      .sort(
        (a, b) => a.order - b.order || a.label.localeCompare(b.label, 'it'),
      ),
  );

  async loadCategories(): Promise<void> {
    if (!hasFirebaseConfig()) {
      this.categoriesSignal.set(DEFAULT_CATEGORIES);
      return;
    }

    try {
      const categories = await this.firebaseDataService.listCategories();
      this.categoriesSignal.set(categories);
    } catch (error) {
      console.error('Impossibile caricare le categorie da Firebase:', error);
    }
  }

  async saveCategory(category: MenuCategory): Promise<void> {
    await this.firebaseDataService.saveCategory(category);

    this.categoriesSignal.update((items) => {
      const next = [
        ...items.filter((item) => item.slug !== category.slug),
        category,
      ];
      return next.sort(
        (a, b) => a.order - b.order || a.label.localeCompare(b.label, 'it'),
      );
    });
  }

  async deleteCategory(slug: string): Promise<void> {
    await this.firebaseDataService.deleteCategory(slug);
    this.categoriesSignal.update((items) =>
      items.filter((item) => item.slug !== slug),
    );
  }
}

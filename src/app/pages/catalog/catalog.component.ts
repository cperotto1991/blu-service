import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { QuoteConfiguratorComponent } from '../../components/quote-configurator/quote-configurator.component';
import { CatalogService } from '../../core/services/catalog.service';
import { Product } from '../../core/models/product.model';
import { QuoteConfiguratorService } from '../../core/services/quote-configurator.service';
import { RouterLink } from '@angular/router';
import {
  CatalogCategory,
  CatalogGroup,
  CatalogSubFilter,
} from '../../core/models/catalog-ui.models';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, QuoteConfiguratorComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly quoteConfiguratorService = inject(QuoteConfiguratorService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly selectedProducts = this.quoteConfiguratorService.selectedProducts;
  readonly selectedTotal = this.quoteConfiguratorService.selectedTotal;
  readonly selectedCount = this.quoteConfiguratorService.selectedCount;

  readonly selectedCategory = signal<string>('Tutti');
  readonly selectedCategorySlug = signal<string | null>(null);
  readonly selectedGroup = signal<string | null>(null);
  readonly selectedSubFilter = signal<string | null>(null);

  private readonly catalogData: CatalogCategory[] = [
    {
      slug: 'depuratori',
      label: 'Depuratori',
      groups: [
        {
          id: 'depuratori-dispenser',
          title: 'Depuratori e dispenser acqua',
          description:
            'Soluzioni per casa, locali, uffici e strutture ricettive.',
          links: [
            {
              label: 'Uso domestico',
              url: '/catalogo/depuratori/uso-domestico',
            },
            {
              label: 'Bar e Ristoranti',
              url: '/catalogo/depuratori/bar-ristoranti',
            },
            { label: 'Hotel', url: '/catalogo/depuratori/hotel' },
            {
              label: 'Uffici e locali pubblici',
              url: '/catalogo/depuratori/uffici-locali-pubblici',
            },
          ],
        },
        {
          id: 'filtrazione',
          title: 'Filtrazione acqua',
          links: [
            {
              label: 'Kit filtri acqua sottolavello',
              url: '/catalogo/filtrazione/kit-sottolavello',
            },
            {
              label: 'Kit pre-filtro',
              url: '/catalogo/filtrazione/pre-filtro',
            },
            {
              label: 'Kit pre-filtro autopulente',
              url: '/catalogo/filtrazione/pre-filtro-autopulente',
            },
            {
              label: 'Caraffe filtranti',
              url: '/catalogo/filtrazione/caraffe',
            },
            {
              label: 'Purificatori per rubinetti',
              url: '/catalogo/filtrazione/rubinetti',
            },
            {
              label: 'Purificatori sopralavello',
              url: '/catalogo/filtrazione/sopralavello',
            },
            {
              label: 'Purificatori anticalcare',
              url: '/catalogo/filtrazione/anticalcare',
            },
          ],
        },
        {
          id: 'gasatori',
          title: 'Gasatori',
          links: [
            { label: 'Gasatori acqua', url: '/catalogo/gasatori/acqua' },
            {
              label: 'Accessori gasatori acqua',
              url: '/catalogo/gasatori/accessori',
            },
          ],
        },
        {
          id: 'ricambi-depuratori',
          title: 'Ricambi depuratori',
          links: [
            { label: 'Manometri', url: '/catalogo/ricambi/manometri' },
            {
              label: 'Motori e pompe depuratori',
              url: '/catalogo/ricambi/pompe',
            },
            { label: 'Carbonatori', url: '/catalogo/ricambi/carbonatori' },
            { label: 'Pressostati', url: '/catalogo/ricambi/pressostati' },
            {
              label: 'Centraline di controllo',
              url: '/catalogo/ricambi/centraline',
            },
            { label: 'Sonde', url: '/catalogo/ricambi/sonde' },
            {
              label: 'Regolatori di flusso',
              url: '/catalogo/ricambi/regolatori-flusso',
            },
            { label: 'Clip', url: '/catalogo/ricambi/clip' },
          ],
        },
        {
          id: 'accessori-installazione',
          title: 'Accessori installazione',
          links: [
            { label: 'Contalitri', url: '/catalogo/accessori/contalitri' },
            {
              label: 'Testate filtri a baionetta',
              url: '/catalogo/accessori/testate-filtri',
            },
            {
              label: 'Riduttori di pressione H2O',
              url: '/catalogo/accessori/riduttori-h2o',
            },
            {
              label: 'Riduttori di pressione CO2',
              url: '/catalogo/accessori/riduttori-co2',
            },
            {
              label: 'Componenti di ricambio',
              url: '/catalogo/accessori/componenti-ricambio',
            },
            { label: 'Raccorderia', url: '/catalogo/accessori/raccorderia' },
            {
              label: 'Tubi innesto rapido',
              url: '/catalogo/accessori/tubi-innesto-rapido',
            },
            {
              label: 'Kit installazione completi',
              url: '/catalogo/accessori/kit-installazione',
            },
          ],
        },
        {
          id: 'filtri',
          title: 'Filtri',
          links: [
            {
              label: 'Filtri acqua a baionetta',
              url: '/catalogo/filtri/baionetta',
            },
            { label: 'Filtri acqua Drop in', url: '/catalogo/filtri/drop-in' },
            {
              label: 'Filtri acqua in Linea',
              url: '/catalogo/filtri/in-linea',
            },
          ],
        },
        {
          id: 'membrane',
          title: 'Membrane',
          links: [
            { label: 'Membrane RO', url: '/catalogo/membrane/ro' },
            { label: 'Vessel', url: '/catalogo/membrane/vessel' },
            { label: 'Housing', url: '/catalogo/membrane/housing' },
          ],
        },
        {
          id: 'bombole-co2',
          title: 'Bombole CO2',
          links: [
            { label: 'Bombole monouso', url: '/catalogo/co2/monouso' },
            {
              label: 'Bombole ricaricabili',
              url: '/catalogo/co2/ricaricabili',
            },
          ],
        },
      ],
    },
    {
      slug: 'addolcitori',
      label: 'Addolcitori',
      groups: [
        {
          id: 'addolcitori',
          title: 'Addolcitori',
          links: [
            { label: 'Cabinati', url: '/catalogo/addolcitori/cabinati' },
            {
              label: 'Doppio corpo',
              url: '/catalogo/addolcitori/doppio-corpo',
            },
            {
              label: 'Decalcificatori elettronici',
              url: '/catalogo/addolcitori/decalcificatori-elettronici',
            },
          ],
        },
        {
          id: 'ricambi-addolcitori',
          title: 'Ricambi addolcitori',
          links: [
            { label: 'Valvole', url: '/catalogo/addolcitori/valvole' },
            {
              label: 'Centraline addolcitori',
              url: '/catalogo/addolcitori/centraline',
            },
            { label: 'Tino sale', url: '/catalogo/addolcitori/tino-sale' },
            { label: 'Bombole', url: '/catalogo/addolcitori/bombole' },
          ],
        },
        {
          id: 'kit-installazione-addolcitori',
          title: 'Kit installazione addolcitori',
          links: [
            {
              label: 'Tubi scarico addolcitori',
              url: '/catalogo/addolcitori/tubi-scarico',
            },
            {
              label: 'Kit installazione completi',
              url: '/catalogo/addolcitori/kit-installazione',
            },
          ],
        },
      ],
    },
    {
      slug: 'miscelatori',
      label: 'Miscelatori',
      groups: [
        {
          id: 'rubinetteria',
          title: 'Rubinetteria',
          links: [
            {
              label: 'Rubinetti 1 via supplementari',
              url: '/catalogo/miscelatori/rubinetti-1-via',
            },
            {
              label: 'Rubinetti 2 vie supplementari',
              url: '/catalogo/miscelatori/rubinetti-2-vie',
            },
            {
              label: 'Rubinetti 3 vie supplementari',
              url: '/catalogo/miscelatori/rubinetti-3-vie-supplementari',
            },
            {
              label: 'Rubinetti 3 vie',
              url: '/catalogo/miscelatori/rubinetti-3-vie',
            },
            {
              label: 'Rubinetti 4 vie',
              url: '/catalogo/miscelatori/rubinetti-4-vie',
            },
            {
              label: 'Rubinetti 5 vie',
              url: '/catalogo/miscelatori/rubinetti-5-vie',
            },
          ],
        },
        {
          id: 'colonnine',
          title: 'Colonnine',
          links: [
            {
              label: 'Colonnine 1 via',
              url: '/catalogo/miscelatori/colonnine-1-via',
            },
            {
              label: 'Colonnine 2 vie',
              url: '/catalogo/miscelatori/colonnine-2-vie',
            },
            {
              label: 'Colonnine 3 vie',
              url: '/catalogo/miscelatori/colonnine-3-vie',
            },
          ],
        },
        {
          id: 'accessori-miscelatori',
          title: 'Accessori miscelatori e colonnine',
          links: [
            {
              label: 'Raccogli gocce',
              url: '/catalogo/miscelatori/raccogli-gocce',
            },
          ],
        },
        {
          id: 'ricambi-miscelatori',
          title: 'Ricambi miscelatori',
          links: [
            {
              label: 'Cartucce miscelatori',
              url: '/catalogo/miscelatori/cartucce',
            },
            { label: 'Aeratori', url: '/catalogo/miscelatori/aeratori' },
            { label: 'Pomelli', url: '/catalogo/miscelatori/pomelli' },
            { label: 'Oring', url: '/catalogo/miscelatori/oring' },
            { label: 'Cannette', url: '/catalogo/miscelatori/cannette' },
            { label: 'Flessibili', url: '/catalogo/miscelatori/flessibili' },
            { label: 'Terminali', url: '/catalogo/miscelatori/terminali' },
            { label: 'Doccette', url: '/catalogo/miscelatori/doccette' },
            {
              label: 'Ricambi colonnine',
              url: '/catalogo/miscelatori/ricambi-colonnine',
            },
          ],
        },
      ],
    },
    {
      slug: 'sanificazione',
      label: 'Sanificazione',
      groups: [
        {
          id: 'ozonizzatore',
          title: 'Ozonizzatore per lavatrice',
          links: [
            {
              label: 'Ozonizzatori acqua completi',
              url: '/catalogo/sanificazione/ozonizzatori-acqua',
            },
            {
              label: 'Accessori ozonizzatori acqua',
              url: '/catalogo/sanificazione/accessori-ozonizzatori',
            },
          ],
        },
        {
          id: 'sanificazione-addolcitori',
          title: 'Sanificazione addolcitori',
          links: [
            {
              label: 'Bustine per sanificazione',
              url: '/catalogo/sanificazione/bustine-addolcitori',
            },
          ],
        },
        {
          id: 'sistemi-uv',
          title: 'Sistemi UV',
          links: [
            {
              label: 'Sistemi UV acqua completi',
              url: '/catalogo/sanificazione/sistemi-uv',
            },
            {
              label: 'Ricambi sistemi UV',
              url: '/catalogo/sanificazione/ricambi-uv',
            },
          ],
        },
        {
          id: 'sistemi-clorazione',
          title: 'Sistemi di clorazione',
          links: [
            {
              label: 'Sistemi di clorazione completi',
              url: '/catalogo/sanificazione/clorazione',
            },
            {
              label: 'Pompe dosatrici',
              url: '/catalogo/sanificazione/pompe-dosatrici',
            },
            {
              label: 'Contalitri lancia impulsi',
              url: '/catalogo/sanificazione/contalitri',
            },
            {
              label: 'Staffe per contalitri',
              url: '/catalogo/sanificazione/staffe-contalitri',
            },
            {
              label: 'Serbatoi cloro',
              url: '/catalogo/sanificazione/serbatoi-cloro',
            },
          ],
        },
      ],
    },
    {
      slug: 'accessori',
      label: 'Accessori',
      groups: [
        {
          id: 'rifiuti',
          title: 'Rifiuti',
          links: [
            { label: 'Pattumiere', url: '/catalogo/accessori/pattumiere' },
            { label: 'Tritarifiuti', url: '/catalogo/accessori/tritarifiuti' },
            {
              label: 'Recupero acqua di scarto',
              url: '/catalogo/accessori/recupero-acqua-scarto',
            },
          ],
        },
        {
          id: 'bottiglie-bicchieri',
          title: 'Bottiglie e bicchieri',
          links: [
            {
              label: 'Bottiglie in vetro',
              url: '/catalogo/accessori/bottiglie-vetro',
            },
            {
              label: 'Bottiglie in vetro serigrafate',
              url: '/catalogo/accessori/bottiglie-serigrafate',
            },
            {
              label: 'Bottiglie per gasatori',
              url: '/catalogo/accessori/bottiglie-gasatori',
            },
            {
              label: 'Bicchieri per acqua',
              url: '/catalogo/accessori/bicchieri-acqua',
            },
            {
              label: 'Calici per vino',
              url: '/catalogo/accessori/calici-vino',
            },
          ],
        },
        {
          id: 'borracce',
          title: 'Borracce',
          links: [
            {
              label: 'Borracce termiche',
              url: '/catalogo/accessori/borracce-termiche',
            },
            {
              label: 'Borracce filtranti',
              url: '/catalogo/accessori/borracce-filtranti',
            },
            {
              label: 'Accessori e ricambi borracce',
              url: '/catalogo/accessori/ricambi-borracce',
            },
          ],
        },
        {
          id: 'contenitori-termici',
          title: 'Contenitori termici',
          links: [
            {
              label: 'Tazze termiche',
              url: '/catalogo/accessori/tazze-termiche',
            },
            { label: 'Porta pranzo', url: '/catalogo/accessori/porta-pranzo' },
          ],
        },
        {
          id: 'bamboo-collection',
          title: 'Bamboo collection',
          links: [
            {
              label: 'Bamboo collection',
              url: '/catalogo/accessori/bamboo-collection',
            },
          ],
        },
        {
          id: 'tester-analisi',
          title: 'Tester analisi acqua',
          links: [
            {
              label: 'Tester analisi acqua',
              url: '/catalogo/accessori/tester-analisi-acqua',
            },
          ],
        },
        {
          id: 'filtri-accessori',
          title: 'Filtri',
          links: [
            {
              label: 'Filtri doccia',
              url: '/catalogo/accessori/filtri-doccia',
            },
            {
              label: 'Filtri per lavatrice',
              url: '/catalogo/accessori/filtri-lavatrice',
            },
            {
              label: 'Filtri Philips',
              url: '/catalogo/accessori/filtri-philips',
            },
          ],
        },
      ],
    },
  ];

  readonly currentCategory = computed(() => {
    const categorySlug = this.selectedCategorySlug();

    if (!categorySlug) {
      return null;
    }

    return (
      this.catalogData.find((category) => category.slug === categorySlug) ??
      null
    );
  });

  readonly currentCategoryGroups = computed(
    () => this.currentCategory()?.groups ?? [],
  );

  readonly categories = computed(() => [
    'Tutti',
    ...new Set(
      this.catalogService.products().map((product) => product.category),
    ),
  ]);

  readonly products = computed(() => {
    let products = this.catalogService.products();

    const category = this.selectedCategory();
    const categorySlug = this.selectedCategorySlug();
    const group = this.selectedGroup();
    const subFilter = this.selectedSubFilter();

    if (categorySlug) {
      products = products.filter(
        (product) => product.categorySlug === categorySlug,
      );
    }

    if (!categorySlug && category !== 'Tutti') {
      products = products.filter((product) => product.category === category);
    }

    if (group && !subFilter) {
      products = products.filter((product) => product.groupId === group);
    }

    if (subFilter) {
      const subcategorySlug = this.getSubcategorySlug(subFilter);
      products = products.filter(
        (product) => product.subcategorySlug === subcategorySlug,
      );
    }

    return products;
  });

  constructor() {
    this.route.queryParams.subscribe((params) => {
      const categorySlug = params['category'] ?? null;
      const group = params['group'] ?? null;
      const subcategory = params['subcategory'] ?? null;

      this.selectedCategorySlug.set(categorySlug);
      this.selectedGroup.set(group);
      this.selectedSubFilter.set(subcategory);

      if (categorySlug) {
        const categoryData = this.catalogData.find(
          (category) => category.slug === categorySlug,
        );

        this.selectedCategory.set(categoryData?.label ?? 'Tutti');
      } else {
        this.selectedCategory.set('Tutti');
      }

      if (this.isBrowser) {
        void this.catalogService.loadProducts(categorySlug);
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.selectedCategorySlug.set(null);
    this.selectedGroup.set(null);
    this.selectedSubFilter.set(null);
  }

  selectGroupOnly(groupId: string): void {
    if (this.selectedGroup() === groupId) {
      this.selectedGroup.set(null);
      this.selectedSubFilter.set(null);
      return;
    }

    this.selectedGroup.set(groupId);
    this.selectedSubFilter.set(null);
  }

  selectSubFilter(url: string, groupId: string): void {
    this.selectedGroup.set(groupId);
    this.selectedSubFilter.set(url);
  }

  clearFilters(): void {
    this.selectedGroup.set(null);
    this.selectedSubFilter.set(null);
  }

  addProduct(product: Product): void {
    this.quoteConfiguratorService.addProduct(product);
  }

  removeProduct(productId: number): void {
    this.quoteConfiguratorService.removeProduct(productId);
  }

  private getSubcategorySlug(url: string): string {
    const segments = url.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? '';
  }
}

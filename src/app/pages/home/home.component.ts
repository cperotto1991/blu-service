import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { HomeService } from '../../core/services/home.service';
import {
  HomeCategoryCard,
  HomeOfferCard,
  HeroSlide,
  SpotlightSlide,
} from '../../core/models/home.models';
import { Product } from '../../core/models/product.model';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly homeService = inject(HomeService);
  private readonly destroyRef = inject(DestroyRef);
  readonly activeHeroSlide = signal(0);
  readonly isHeroCarouselPaused = signal(false);
  readonly activeSpotlightSlide = signal(0);
  readonly heroPromoText = 'PROMO dal 3 al 30 Giugno';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly spotlightSlides: SpotlightSlide[] = [
    {
      id: 'configuratore',
      kicker: 'Configuratore',
      title: 'Trova il depuratore perfetto per te',
      description:
        'Scegli in autonomia la soluzione piu adatta alle tue esigenze.',
      ctaLabel: 'Scopri ora',
      ctaLink: '/catalogo',
      imageUrl:
        'https://images.unsplash.com/photo-1556911220-bda9f7f7597e?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 'novita',
      kicker: 'Novita 2026',
      title: 'Filtro Anticalcare Shurity Duo Protect',
      description:
        'Nuova linea ad alte prestazioni per protezione e qualita costante.',
      ctaLabel: 'Acquista ora',
      ctaLink: '/offerte',
      imageUrl:
        'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1600&q=80',
    },
    {
      id: 'promo',
      kicker: 'Promo speciale',
      title: 'Pacchetto manutenzione + filtri in omaggio',
      description:
        'Approfitta dell offerta limitata con assistenza tecnica inclusa.',
      ctaLabel: 'Richiedi preventivo',
      ctaLink: '/offerte',
      imageUrl: 'assets/images/',
    },
  ];

  readonly heroImage = computed(
    () =>
      this.homeService.offers()[0]?.imageUrl ??
      'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=1180&q=80',
  );

  readonly heroSlides = computed<HeroSlide[]>(() => {
    const slides = this.homeService
      .offers()
      .slice(0, 5)
      .map((offer) => this.toHeroSlide(offer));
    const fallbackSlide: HeroSlide = {
      id: 0,
      code: '',
      title: 'BLU Service',
      shortDescription: 'Scopri le offerte disponibili nel catalogo.',
      imageUrl: this.heroImage(),
      discountPercent: 10,
      discountedPrice: 490,
      basePrice: 550,
      savings: 60,
    };

    const heroSlides: HeroSlide[] =
      slides.length > 0 ? slides : [fallbackSlide];

    return heroSlides;
  });

  readonly activeHeroSlideIndex = computed(() => {
    const slideCount = this.heroSlides().length;
    if (slideCount === 0) {
      return 0;
    }

    return this.activeHeroSlide() % slideCount;
  });

  readonly activeHeroSlideData = computed(
    () => this.heroSlides()[this.activeHeroSlideIndex()],
  );

  readonly activeSpotlightSlideIndex = computed(
    () => this.activeSpotlightSlide() % this.spotlightSlides.length,
  );

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    void this.homeService.loadOffers();

    const heroIntervalId = window.setInterval(() => {
      if (this.heroSlides().length > 1 && !this.isHeroCarouselPaused()) {
        this.nextHeroSlide();
      }
    }, 4500);

    const spotlightIntervalId = window.setInterval(() => {
      if (this.spotlightSlides.length > 1) {
        this.nextSpotlightSlide();
      }
    }, 5200);

    this.destroyRef.onDestroy(() => {
      window.clearInterval(heroIntervalId);
      window.clearInterval(spotlightIntervalId);
    });
  }

  readonly offers = computed<HomeOfferCard[]>(() =>
    this.homeService
      .offers()
      .slice(0, 3)
      .map((product) => this.toHomeOfferCard(product)),
  );

  readonly categoryCards: HomeCategoryCard[] = [
    {
      label: 'Depuratori',
      categorySlug: 'depuratori',
      description: 'Acqua pura, buona e sostenibile',
      imageUrl: '/assets/images/depuratore.png',
    },
    {
      label: 'Addolcitori',
      categorySlug: 'addolcitori',
      description: 'Proteggi impianti e elettrodomestici',
      imageUrl: '/assets/images/addolcitore.png',
    },
    {
      label: 'Miscelatori',
      categorySlug: 'miscelatori',
      description: 'Design e funzionalita in cucina',
      imageUrl: '/assets/images/miscelatore.png',
    },
    {
      label: 'Sanificazione',
      categorySlug: 'sanificazione',
      description: 'Ambienti sani, sempre protetti',
      imageUrl: '/assets/images/sanificatore.png',
    },
    {
      label: 'Accessori',
      categorySlug: 'accessori',
      description: 'Ricambi e accessori originali',
      imageUrl: '/assets/images/accessori.png',
    },
  ];

  private toHomeOfferCard(product: Product): HomeOfferCard {
    const basePrice = Number.isFinite(product.basePrice)
      ? product.basePrice
      : 0;
    const discountPercent = product.discountPercent ?? 10;
    const discountedPrice = Math.round(basePrice * (1 - discountPercent / 100));

    return {
      id: product.id,
      code: product.code,
      name: product.name,
      shortDescription: product.shortDescription,
      imageUrl: product.imageUrl,
      discountPercent,
      discountedPrice,
      basePrice,
      savings: basePrice - discountedPrice,
    };
  }

  private toHeroSlide(product: Product): HeroSlide {
    const offer = this.toHomeOfferCard(product);

    return {
      id: offer.id,
      code: offer.code,
      title: offer.name,
      shortDescription: offer.shortDescription,
      imageUrl: offer.imageUrl,
      discountPercent: offer.discountPercent,
      discountedPrice: offer.discountedPrice,
      basePrice: offer.basePrice,
      savings: offer.savings,
    };
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('it-IT').format(value);
  }

  nextHeroSlide(): void {
    const slideCount = this.heroSlides().length;
    if (slideCount <= 1) {
      return;
    }

    this.activeHeroSlide.update((value) => (value + 1) % slideCount);
  }

  previousHeroSlide(): void {
    const slideCount = this.heroSlides().length;
    if (slideCount <= 1) {
      return;
    }

    this.activeHeroSlide.update(
      (value) => (value - 1 + slideCount) % slideCount,
    );
  }

  setHeroSlide(index: number): void {
    const slideCount = this.heroSlides().length;
    if (slideCount === 0) {
      return;
    }

    this.activeHeroSlide.set(index % slideCount);
  }

  pauseHeroCarousel(): void {
    this.isHeroCarouselPaused.set(true);
  }

  resumeHeroCarousel(): void {
    this.isHeroCarouselPaused.set(false);
  }

  nextSpotlightSlide(): void {
    this.activeSpotlightSlide.update(
      (value) => (value + 1) % this.spotlightSlides.length,
    );
  }

  previousSpotlightSlide(): void {
    this.activeSpotlightSlide.update(
      (value) =>
        (value - 1 + this.spotlightSlides.length) % this.spotlightSlides.length,
    );
  }

  setSpotlightSlide(index: number): void {
    this.activeSpotlightSlide.set(index % this.spotlightSlides.length);
  }
}

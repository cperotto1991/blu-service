import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  MegaMenuCategory,
  MegaMenuGroup,
} from '../../core/models/layout.models';

@Component({
  selector: 'app-mega-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mega-menu.component.html',
  styleUrl: './mega-menu.component.scss',
})
export class MegaMenuComponent {
  activeCategory = signal<MegaMenuCategory | null>(null);

  categories: MegaMenuCategory[] = [
    {
      label: 'Depuratori',
      slug: 'depuratori',
      icon: '⌁',
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
          title: 'Membrane',
          links: [
            { label: 'Membrane RO', url: '/catalogo/membrane/ro' },
            { label: 'Vessel', url: '/catalogo/membrane/vessel' },
            { label: 'Housing', url: '/catalogo/membrane/housing' },
          ],
        },
        {
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
      label: 'Addolcitori',
      slug: 'addolcitori',
      icon: '◌',
      groups: [
        {
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
      label: 'Miscelatori',
      slug: 'miscelatori',
      icon: '⌐',
      groups: [
        {
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
          title: 'Accessori miscelatori e colonnine',
          links: [
            {
              label: 'Raccogli gocce',
              url: '/catalogo/miscelatori/raccogli-gocce',
            },
          ],
        },
        {
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
      label: 'Sanificazione',
      slug: 'sanificazione',
      icon: '♢',
      groups: [
        {
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
          title: 'Sanificazione addolcitori',
          links: [
            {
              label: 'Bustine per sanificazione',
              url: '/catalogo/sanificazione/bustine-addolcitori',
            },
          ],
        },
        {
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
      label: 'Accessori',
      slug: 'accessori',
      icon: '▯',
      groups: [
        {
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
          title: 'Bamboo collection',
          links: [
            {
              label: 'Bamboo collection',
              url: '/catalogo/accessori/bamboo-collection',
            },
          ],
        },
        {
          title: 'Tester analisi acqua',
          links: [
            {
              label: 'Tester analisi acqua',
              url: '/catalogo/accessori/tester-analisi-acqua',
            },
          ],
        },
        {
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

  openCategory(category: MegaMenuCategory): void {
    this.activeCategory.set(category);
  }

  closeMenu(): void {
    this.activeCategory.set(null);
  }

  getGroupId(group: MegaMenuGroup): string {
    return group.id || group.title.toLowerCase().replace(/\s+/g, '-');
  }
}

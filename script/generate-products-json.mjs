import fs from "node:fs";

const catalogTree = [
  {
    slug: "depuratori",
    label: "Depuratori",
    base: 420,
    groups: [
      {
        id: "depuratori-dispenser",
        title: "Depuratori e dispenser acqua",
        subcategories: [
          { label: "Uso domestico", slug: "uso-domestico" },
          { label: "Bar e Ristoranti", slug: "bar-ristoranti" },
          { label: "Hotel", slug: "hotel" },
          {
            label: "Uffici e locali pubblici",
            slug: "uffici-locali-pubblici",
          },
        ],
      },
      {
        id: "filtrazione",
        title: "Filtrazione acqua",
        subcategories: [
          {
            label: "Kit filtri acqua sottolavello",
            slug: "kit-sottolavello",
          },
          { label: "Kit pre-filtro", slug: "pre-filtro" },
          {
            label: "Kit pre-filtro autopulente",
            slug: "pre-filtro-autopulente",
          },
          { label: "Caraffe filtranti", slug: "caraffe" },
          { label: "Purificatori per rubinetti", slug: "rubinetti" },
          { label: "Purificatori sopralavello", slug: "sopralavello" },
          { label: "Purificatori anticalcare", slug: "anticalcare" },
        ],
      },
      {
        id: "gasatori",
        title: "Gasatori",
        subcategories: [
          { label: "Gasatori acqua", slug: "acqua" },
          { label: "Accessori gasatori acqua", slug: "accessori" },
        ],
      },
      {
        id: "ricambi-depuratori",
        title: "Ricambi depuratori",
        subcategories: [
          { label: "Manometri", slug: "manometri" },
          { label: "Motori e pompe depuratori", slug: "pompe" },
          { label: "Carbonatori", slug: "carbonatori" },
          { label: "Pressostati", slug: "pressostati" },
          { label: "Centraline di controllo", slug: "centraline" },
          { label: "Sonde", slug: "sonde" },
          { label: "Regolatori di flusso", slug: "regolatori-flusso" },
          { label: "Clip", slug: "clip" },
        ],
      },
      {
        id: "accessori-installazione",
        title: "Accessori installazione",
        subcategories: [
          { label: "Contalitri", slug: "contalitri" },
          { label: "Testate filtri a baionetta", slug: "testate-filtri" },
          { label: "Riduttori di pressione H2O", slug: "riduttori-h2o" },
          { label: "Riduttori di pressione CO2", slug: "riduttori-co2" },
          { label: "Componenti di ricambio", slug: "componenti-ricambio" },
          { label: "Raccorderia", slug: "raccorderia" },
          { label: "Tubi innesto rapido", slug: "tubi-innesto-rapido" },
          { label: "Kit installazione completi", slug: "kit-installazione" },
        ],
      },
      {
        id: "filtri",
        title: "Filtri",
        subcategories: [
          { label: "Filtri acqua a baionetta", slug: "baionetta" },
          { label: "Filtri acqua Drop in", slug: "drop-in" },
          { label: "Filtri acqua in Linea", slug: "in-linea" },
        ],
      },
      {
        id: "membrane",
        title: "Membrane",
        subcategories: [
          { label: "Membrane RO", slug: "ro" },
          { label: "Vessel", slug: "vessel" },
          { label: "Housing", slug: "housing" },
        ],
      },
      {
        id: "bombole-co2",
        title: "Bombole CO2",
        subcategories: [
          { label: "Bombole monouso", slug: "monouso" },
          { label: "Bombole ricaricabili", slug: "ricaricabili" },
        ],
      },
    ],
  },
  {
    slug: "addolcitori",
    label: "Addolcitori",
    base: 690,
    groups: [
      {
        id: "addolcitori",
        title: "Addolcitori",
        subcategories: [
          { label: "Cabinati", slug: "cabinati" },
          { label: "Doppio corpo", slug: "doppio-corpo" },
          {
            label: "Decalcificatori elettronici",
            slug: "decalcificatori-elettronici",
          },
        ],
      },
      {
        id: "ricambi-addolcitori",
        title: "Ricambi addolcitori",
        subcategories: [
          { label: "Valvole", slug: "valvole" },
          { label: "Centraline addolcitori", slug: "centraline" },
          { label: "Tino sale", slug: "tino-sale" },
          { label: "Bombole", slug: "bombole" },
        ],
      },
      {
        id: "kit-installazione-addolcitori",
        title: "Kit installazione addolcitori",
        subcategories: [
          { label: "Tubi scarico addolcitori", slug: "tubi-scarico" },
          { label: "Kit installazione completi", slug: "kit-installazione" },
        ],
      },
    ],
  },
  {
    slug: "miscelatori",
    label: "Miscelatori",
    base: 180,
    groups: [
      {
        id: "rubinetteria",
        title: "Rubinetteria",
        subcategories: [
          {
            label: "Rubinetti 1 via supplementari",
            slug: "rubinetti-1-via",
          },
          {
            label: "Rubinetti 2 vie supplementari",
            slug: "rubinetti-2-vie",
          },
          {
            label: "Rubinetti 3 vie supplementari",
            slug: "rubinetti-3-vie-supplementari",
          },
          { label: "Rubinetti 3 vie", slug: "rubinetti-3-vie" },
          { label: "Rubinetti 4 vie", slug: "rubinetti-4-vie" },
          { label: "Rubinetti 5 vie", slug: "rubinetti-5-vie" },
        ],
      },
      {
        id: "colonnine",
        title: "Colonnine",
        subcategories: [
          { label: "Colonnine 1 via", slug: "colonnine-1-via" },
          { label: "Colonnine 2 vie", slug: "colonnine-2-vie" },
          { label: "Colonnine 3 vie", slug: "colonnine-3-vie" },
        ],
      },
      {
        id: "accessori-miscelatori",
        title: "Accessori miscelatori e colonnine",
        subcategories: [{ label: "Raccogli gocce", slug: "raccogli-gocce" }],
      },
      {
        id: "ricambi-miscelatori",
        title: "Ricambi miscelatori",
        subcategories: [
          { label: "Cartucce miscelatori", slug: "cartucce" },
          { label: "Aeratori", slug: "aeratori" },
          { label: "Pomelli", slug: "pomelli" },
          { label: "Oring", slug: "oring" },
          { label: "Cannette", slug: "cannette" },
          { label: "Flessibili", slug: "flessibili" },
          { label: "Terminali", slug: "terminali" },
          { label: "Doccette", slug: "doccette" },
          { label: "Ricambi colonnine", slug: "ricambi-colonnine" },
        ],
      },
    ],
  },
  {
    slug: "sanificazione",
    label: "Sanificazione",
    base: 120,
    groups: [
      {
        id: "ozonizzatore",
        title: "Ozonizzatore per lavatrice",
        subcategories: [
          {
            label: "Ozonizzatori acqua completi",
            slug: "ozonizzatori-acqua",
          },
          {
            label: "Accessori ozonizzatori acqua",
            slug: "accessori-ozonizzatori",
          },
        ],
      },
      {
        id: "sanificazione-addolcitori",
        title: "Sanificazione addolcitori",
        subcategories: [
          { label: "Bustine per sanificazione", slug: "bustine-addolcitori" },
        ],
      },
      {
        id: "sistemi-uv",
        title: "Sistemi UV",
        subcategories: [
          { label: "Sistemi UV acqua completi", slug: "sistemi-uv" },
          { label: "Ricambi sistemi UV", slug: "ricambi-uv" },
        ],
      },
      {
        id: "sistemi-clorazione",
        title: "Sistemi di clorazione",
        subcategories: [
          { label: "Sistemi di clorazione completi", slug: "clorazione" },
          { label: "Pompe dosatrici", slug: "pompe-dosatrici" },
          { label: "Contalitri lancia impulsi", slug: "contalitri" },
          { label: "Staffe per contalitri", slug: "staffe-contalitri" },
          { label: "Serbatoi cloro", slug: "serbatoi-cloro" },
        ],
      },
    ],
  },
  {
    slug: "accessori",
    label: "Accessori",
    base: 65,
    groups: [
      {
        id: "rifiuti",
        title: "Rifiuti",
        subcategories: [
          { label: "Pattumiere", slug: "pattumiere" },
          { label: "Tritarifiuti", slug: "tritarifiuti" },
          { label: "Recupero acqua di scarto", slug: "recupero-acqua-scarto" },
        ],
      },
      {
        id: "bottiglie-bicchieri",
        title: "Bottiglie e bicchieri",
        subcategories: [
          { label: "Bottiglie in vetro", slug: "bottiglie-vetro" },
          {
            label: "Bottiglie in vetro serigrafate",
            slug: "bottiglie-serigrafate",
          },
          { label: "Bottiglie per gasatori", slug: "bottiglie-gasatori" },
          { label: "Bicchieri per acqua", slug: "bicchieri-acqua" },
          { label: "Calici per vino", slug: "calici-vino" },
        ],
      },
      {
        id: "borracce",
        title: "Borracce",
        subcategories: [
          { label: "Borracce termiche", slug: "borracce-termiche" },
          { label: "Borracce filtranti", slug: "borracce-filtranti" },
          { label: "Accessori e ricambi borracce", slug: "ricambi-borracce" },
        ],
      },
      {
        id: "contenitori-termici",
        title: "Contenitori termici",
        subcategories: [
          { label: "Tazze termiche", slug: "tazze-termiche" },
          { label: "Porta pranzo", slug: "porta-pranzo" },
        ],
      },
      {
        id: "bamboo-collection",
        title: "Bamboo collection",
        subcategories: [
          { label: "Bamboo collection", slug: "bamboo-collection" },
        ],
      },
      {
        id: "tester-analisi",
        title: "Tester analisi acqua",
        subcategories: [
          { label: "Tester analisi acqua", slug: "tester-analisi-acqua" },
        ],
      },
      {
        id: "filtri-accessori",
        title: "Filtri",
        subcategories: [
          { label: "Filtri doccia", slug: "filtri-doccia" },
          { label: "Filtri per lavatrice", slug: "filtri-lavatrice" },
          { label: "Filtri Philips", slug: "filtri-philips" },
        ],
      },
    ],
  },
];

const peopleRanges = [
  "1/2 persone",
  "2/4 persone",
  "4/6 persone",
  "6/8 persone",
  "8/10 persone",
  "10/12 persone",
  "12/14 persone",
  "14/16 persone",
];

const totalProductsTarget = 200;

const staticImageUrl =
  "https://www.shurity.it/wp-content/uploads/2025/09/331830_AB-768x767.jpg";

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toTitleCase = (value) =>
  value
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");

const optionGroups = [
  {
    id: "utilizzo",
    title: "Tipo di utilizzo",
    required: true,
    options: [
      { id: "domestico", label: "Domestico", priceDelta: 0 },
      {
        id: "ufficio",
        label: "Ufficio o locale pubblico",
        priceDelta: 180,
      },
      {
        id: "professionale",
        label: "Professionale / alta portata",
        priceDelta: 420,
      },
    ],
  },
  {
    id: "installazione",
    title: "Installazione",
    required: true,
    options: [
      { id: "fornitura", label: "Solo fornitura", priceDelta: 0 },
      { id: "standard", label: "Installazione standard", priceDelta: 250 },
      { id: "plus", label: "Installazione con collaudo", priceDelta: 390 },
    ],
  },
  {
    id: "manutenzione",
    title: "Piano manutenzione",
    required: true,
    options: [
      {
        id: "nessuna",
        label: "Nessuna manutenzione inclusa",
        priceDelta: 0,
      },
      { id: "annuale", label: "Manutenzione annuale", priceDelta: 120 },
      {
        id: "premium",
        label: "Manutenzione premium + sanificazione",
        priceDelta: 220,
      },
    ],
  },
  {
    id: "accessori",
    title: "Accessori",
    required: false,
    options: [
      { id: "base", label: "Kit base", priceDelta: 0 },
      { id: "filtri", label: "Kit filtri aggiuntivi", priceDelta: 90 },
      {
        id: "monitoraggio",
        label: "Monitoraggio qualità acqua",
        priceDelta: 160,
      },
    ],
  },
];

const flattenedSubcategories = catalogTree.flatMap((category) =>
  category.groups.flatMap((group) =>
    group.subcategories.map((subcategory) => ({
      category,
      group,
      subcategory,
    })),
  ),
);

const createProduct = (entry, id, variantSeed = 0) => {
  const { category, group, subcategory } = entry;
  const capacity = peopleRanges[(id + variantSeed) % peopleRanges.length];
  const variantSuffix = variantSeed === 0 ? "" : ` ${toTitleCase(subcategory.slug)}`;
  const model = `${subcategory.label}${variantSuffix}`;

  const basePrice = category.base + ((id + variantSeed) % 12) * 55;
  const isOffer = id % 7 === 0 || id % 11 === 0;
  const discountPercent = id % 7 === 0 ? 12 : id % 11 === 0 ? 8 : undefined;

  return {
    id,
    slug: `${slugify(model)}-${id}`,
    code: `H2O-${String(id).padStart(4, "0")}`,
    name: `${model} ${capacity}`,
    category: category.label,
    categorySlug: category.slug,
    groupId: group.id,
    subcategory: subcategory.label,
    subcategorySlug: subcategory.slug,
    shortDescription: `Soluzione per il trattamento acqua configurabile, indicata per ${capacity}.`,
    description:
      "Sistema per il trattamento dell'acqua pensato per migliorare qualità, comfort e protezione degli impianti domestici o professionali. Configurabile in base a utilizzo, portata, installazione e manutenzione.",
    basePrice,
    imageUrl: staticImageUrl,
    tags: [
      "Trattamento acqua",
      "Configurabile",
      capacity,
      subcategory.label,
      id % 3 === 0 ? "Uso domestico" : "Uso professionale",
    ],
    isOffer,
    offerLabel:
      id % 7 === 0 ? "Promo mese" : id % 11 === 0 ? "Best deal" : undefined,
    discountPercent,
    optionGroups,
  };
};

// Seed list: at least one product for each subcategory.
const seededProducts = flattenedSubcategories.map((entry, index) =>
  createProduct(entry, index + 1),
);

const extraCount = Math.max(0, totalProductsTarget - seededProducts.length);

const extraProducts = Array.from({ length: extraCount }, (_, index) => {
  const id = seededProducts.length + index + 1;
  const entry = flattenedSubcategories[index % flattenedSubcategories.length];
  return createProduct(entry, id, (index % 3) + 1);
});

const baseProducts = [...seededProducts, ...extraProducts];

const byGroup = new Map();
for (const product of baseProducts) {
  const list = byGroup.get(product.groupId) ?? [];
  list.push(product);
  byGroup.set(product.groupId, list);
}

const products = baseProducts.map((product) => {
  const related = (byGroup.get(product.groupId) ?? [])
    .filter((candidate) => candidate.code !== product.code)
    .slice(0, 3)
    .map((candidate) => candidate.code);

  return {
    ...product,
    relatedProductCodes: related,
  };
});

fs.mkdirSync("public/assets/data", { recursive: true });
fs.mkdirSync("src/assets/data", { recursive: true });
fs.writeFileSync(
  "public/assets/data/products.json",
  JSON.stringify(products, null, 2),
);
fs.writeFileSync(
  "src/assets/data/products.json",
  JSON.stringify(products, null, 2),
);

console.log(
  `products.json generato con ${products.length} prodotti e ${flattenedSubcategories.length} sottocategorie coperte`,
);

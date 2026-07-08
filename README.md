# BluServiceShop

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.17.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Firebase setup

This app uses Firebase for catalog data, product images, and admin authentication.

### Environment values

The Firebase config is stored in:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

### Firestore collections

- `products`: catalog items
- `categories`: optional category data
- `admins`: one document per authorized admin user, using the Firebase Auth `uid` as the document id

Recommended product document shape:

```json
{
  "id": 1001,
  "slug": "depuratore-acqua-base",
  "code": "DEP-001",
  "name": "Depuratore Acqua Base",
  "category": "Depuratori",
  "categorySlug": "depuratori",
  "groupId": "depuratori-dispenser",
  "subcategory": "Uso domestico",
  "subcategorySlug": "uso-domestico",
  "shortDescription": "Soluzione compatta per casa e ufficio.",
  "description": "Descrizione estesa del prodotto.",
  "basePrice": 1290,
  "imageUrl": "https://...",
  "tags": ["promo", "best-seller"],
  "isOffer": true,
  "discountPercent": 10,
  "relatedProductCodes": ["DEP-002", "ACC-010"],
  "optionGroups": []
}
```

### Images

The admin page uploads images to Firebase Storage and stores the resulting URL in `imageUrl`.

Recommended Storage path:

- `product-images/{productId}/...`

### Rules

Use the following files in Firebase:

- `firebase.firestore.rules`
- `firebase.storage.rules`

Rules summary:

- public users can read catalog products and images
- only admins can create, update, or delete products
- only admins can upload images

### Admin bootstrap

To create the first admin:

1. Sign in with the Firebase Auth account you want to use.
2. In Firestore, create `admins/{your-uid}`.
3. Add any minimal document body, for example `{ "role": "admin" }`.

After that, the `/admin` page can write catalog data and upload images.

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');
const productsJsonPath = join(
  browserDistFolder,
  'assets',
  'data',
  'products.json',
);

const app = express();
const commonEngine = new CommonEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 */

app.use(express.json());

async function loadProductsFromDisk(): Promise<unknown[]> {
  const content = await readFile(productsJsonPath, 'utf-8');
  return JSON.parse(content) as unknown[];
}

app.get('/api/products', async (req, res) => {
  try {
    const products = await loadProductsFromDisk();
    res.json(products);
  } catch (error) {
    console.error('Errore caricamento prodotti mock:', error);
    res.status(500).json({ message: 'Errore caricamento prodotti' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const products = await loadProductsFromDisk();
    const id = Number(req.params.id);
    const product = (products as any[]).find((item) => Number(item.id) === id);

    if (!product) {
      return res.status(404).json({ message: 'Prodotto non trovato' });
    }

    // Assemble related products inside the product detail to reduce client calls
    const relatedCodes: string[] = product.relatedProductCodes ?? [];
    const related = (products as any[]).filter((p) => {
      if (!relatedCodes || relatedCodes.length === 0) return false;
      if (p.code && relatedCodes.includes(p.code)) return true;
      if (String(p.id) && relatedCodes.includes(String(p.id))) return true;
      return false;
    });

    const response = { ...product, related };
    return res.json(response);
  } catch (error) {
    console.error('Errore caricamento prodotto mock:', error);
    return res.status(500).json({ message: 'Errore caricamento prodotto' });
  }
});

app.get('/api/home/offers', async (req, res) => {
  try {
    const products = await loadProductsFromDisk();
    const offers = (products as any[]).filter((item) => item.isOffer);
    res.json(offers);
  } catch (error) {
    console.error('Errore caricamento offerte mock:', error);
    res.status(500).json({ message: 'Errore caricamento offerte' });
  }
});

// NOTE: quote-request endpoint intentionally not implemented here.
// The frontend currently uses a `mailto:` flow for mock requests.

/**
 * Serve static files from /browser
 */
app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;

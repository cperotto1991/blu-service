import { Injectable } from '@angular/core';
import { MenuCategory } from '../models/menu-category.model';
import { Product } from '../models/product.model';
import { ProductOptionGroup } from '../models/catalog.models';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import {
  FirebaseStorage,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { getFirebaseApp, hasFirebaseConfig } from '../firebase/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class FirebaseDataService {
  private readonly productsCollectionName = 'products';
  private readonly categoriesCollectionName = 'categories';

  async listProducts(categorySlug?: string | null): Promise<Product[]> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      return [];
    }

    const firestore = getFirestore(getFirebaseApp()!);
    const productsRef = collection(firestore, this.productsCollectionName);
    const snapshot = categorySlug
      ? await this.listProductsByCategory(productsRef, categorySlug)
      : await getDocs(productsRef);

    return snapshot.docs.map((item) =>
      this.mapProduct(item.data() as Partial<Product>, item.id),
    );
  }

  async listOffers(): Promise<Product[]> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      return [];
    }

    const firestore = getFirestore(getFirebaseApp()!);
    const productsRef = collection(firestore, this.productsCollectionName);
    const snapshot = await getDocs(
      query(productsRef, where('isOffer', '==', true)),
    );

    return snapshot.docs.map((item) =>
      this.mapProduct(item.data() as Partial<Product>, item.id),
    );
  }

  async listCategories(): Promise<MenuCategory[]> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      return [];
    }

    const firestore = getFirestore(getFirebaseApp()!);
    const categoriesRef = collection(firestore, this.categoriesCollectionName);
    const snapshot = await getDocs(categoriesRef);

    return snapshot.docs
      .map((item) =>
        this.mapCategory(item.data() as Partial<MenuCategory>, item.id),
      )
      .sort(
        (a, b) => a.order - b.order || a.label.localeCompare(b.label, 'it'),
      );
  }

  async saveCategory(category: MenuCategory): Promise<MenuCategory> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      throw new Error(
        'Firebase non configurato. Inserisci i dati in environment.ts',
      );
    }

    const normalized = this.normalizeCategory(category);

    if (!normalized.slug) {
      throw new Error('Lo slug categoria è obbligatorio.');
    }

    const firestore = getFirestore(getFirebaseApp()!);
    await setDoc(
      doc(firestore, this.categoriesCollectionName, normalized.slug),
      normalized,
      { merge: false },
    );

    return normalized;
  }

  async deleteCategory(categorySlug: string): Promise<void> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      throw new Error(
        'Firebase non configurato. Inserisci i dati in environment.ts',
      );
    }

    const normalizedSlug = this.normalizeSlug(categorySlug);

    if (!normalizedSlug) {
      throw new Error('Slug categoria non valido.');
    }

    const firestore = getFirestore(getFirebaseApp()!);
    await deleteDoc(
      doc(firestore, this.categoriesCollectionName, normalizedSlug),
    );
  }

  async getProductById(id: number): Promise<Product | null> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      return null;
    }

    const firestore = getFirestore(getFirebaseApp()!);
    const productRef = doc(firestore, this.productsCollectionName, String(id));
    const snapshot = await getDoc(productRef);

    if (snapshot.exists()) {
      return this.mapProduct(snapshot.data() as Partial<Product>, snapshot.id);
    }

    const productsRef = collection(firestore, this.productsCollectionName);
    const fallbackSnapshot = await getDocs(
      query(productsRef, where('id', '==', id), limit(1)),
    );

    const first = fallbackSnapshot.docs[0];
    return first
      ? this.mapProduct(first.data() as Partial<Product>, first.id)
      : null;
  }

  async getProductByCode(code: string): Promise<Product | null> {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode || !hasFirebaseConfig() || !getFirebaseApp()) {
      return null;
    }

    const firestore = getFirestore(getFirebaseApp()!);
    const productRef = doc(
      firestore,
      this.productsCollectionName,
      normalizedCode,
    );
    const directSnapshot = await getDoc(productRef);

    if (directSnapshot.exists()) {
      return this.mapProduct(
        directSnapshot.data() as Partial<Product>,
        directSnapshot.id,
      );
    }

    const productsRef = collection(firestore, this.productsCollectionName);
    const snapshot = await getDocs(
      query(productsRef, where('code', '==', normalizedCode), limit(1)),
    );

    const first = snapshot.docs[0];
    return first
      ? this.mapProduct(first.data() as Partial<Product>, first.id)
      : null;
  }

  async listProductsByCodes(codes: string[]): Promise<Product[]> {
    const normalizedCodes = Array.from(
      new Set(codes.map((code) => code.trim().toUpperCase()).filter(Boolean)),
    );

    if (!normalizedCodes.length || !hasFirebaseConfig() || !getFirebaseApp()) {
      return [];
    }

    const firestore = getFirestore(getFirebaseApp()!);
    const productsRef = collection(firestore, this.productsCollectionName);
    const results: Product[] = [];
    const missingCodes: string[] = [];

    await Promise.all(
      normalizedCodes.map(async (code) => {
        const snapshot = await getDoc(
          doc(firestore, this.productsCollectionName, code),
        );

        if (snapshot.exists()) {
          results.push(
            this.mapProduct(snapshot.data() as Partial<Product>, snapshot.id),
          );
          return;
        }

        missingCodes.push(code);
      }),
    );

    for (let index = 0; index < missingCodes.length; index += 10) {
      const chunk = missingCodes.slice(index, index + 10);
      const snapshot = await getDocs(
        query(productsRef, where('code', 'in', chunk)),
      );
      results.push(
        ...snapshot.docs.map((item) =>
          this.mapProduct(item.data() as Partial<Product>, item.id),
        ),
      );
    }

    return results;
  }

  async saveProduct(
    product: Product,
    imageFile?: File | null,
  ): Promise<Product> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      throw new Error(
        'Firebase non configurato. Inserisci i dati in environment.ts',
      );
    }

    const firestore = getFirestore(getFirebaseApp()!);
    const storage = getStorage(getFirebaseApp()!);
    const imageUrl = imageFile
      ? await this.uploadImage(storage, product, imageFile)
      : product.imageUrl;

    const normalized = this.normalizeProduct({
      ...product,
      imageUrl,
    });
    const persistencePayload = this.toPersistenceProduct(normalized);

    const documentId = normalized.code.trim().toUpperCase();

    if (!documentId) {
      throw new Error('Il codice prodotto è obbligatorio.');
    }

    await setDoc(
      doc(firestore, this.productsCollectionName, documentId),
      persistencePayload,
      { merge: false },
    );

    return normalized;
  }

  async deleteProduct(productCode: string): Promise<void> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      throw new Error(
        'Firebase non configurato. Inserisci i dati in environment.ts',
      );
    }

    const normalizedCode = productCode.trim().toUpperCase();

    if (!normalizedCode) {
      throw new Error('Codice prodotto non valido.');
    }

    const firestore = getFirestore(getFirebaseApp()!);
    await deleteDoc(
      doc(firestore, this.productsCollectionName, normalizedCode),
    );
  }

  async deleteProducts(productCodes: string[]): Promise<void> {
    const normalizedCodes = Array.from(
      new Set(
        productCodes.map((code) => code.trim().toUpperCase()).filter(Boolean),
      ),
    );

    for (const code of normalizedCodes) {
      await this.deleteProduct(code);
    }
  }

  async saveProductsBulk(
    products: Product[],
  ): Promise<{ written: number; skipped: number }> {
    if (!hasFirebaseConfig() || !getFirebaseApp()) {
      throw new Error(
        'Firebase non configurato. Inserisci i dati in environment.ts',
      );
    }

    const firestore = getFirestore(getFirebaseApp()!);
    const normalizedProducts = products
      .map((product) => this.normalizeProduct(product))
      .map((product) => ({
        id: product.code.trim().toUpperCase(),
        payload: this.toPersistenceProduct(product),
      }))
      .filter((item) => item.id.length > 0);

    const skipped = Math.max(0, products.length - normalizedProducts.length);

    if (!normalizedProducts.length) {
      return { written: 0, skipped };
    }

    const chunkSize = 400;
    let written = 0;

    for (let index = 0; index < normalizedProducts.length; index += chunkSize) {
      const chunk = normalizedProducts.slice(index, index + chunkSize);
      const batch = writeBatch(firestore);

      for (const item of chunk) {
        const docRef = doc(firestore, this.productsCollectionName, item.id);
        batch.set(docRef, item.payload, { merge: false });
      }

      await batch.commit();
      written += chunk.length;
    }

    return { written, skipped };
  }

  private async uploadImage(
    storage: FirebaseStorage,
    product: Product,
    file: File,
  ): Promise<string> {
    const extension = file.name.includes('.')
      ? (file.name.split('.').pop() ?? 'jpg')
      : 'jpg';
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const storageRef = ref(
      storage,
      `products/${product.code.trim().toUpperCase()}/${Date.now()}-${safeName}.${extension}`,
    );

    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  private mapCategory(
    data: Partial<MenuCategory>,
    fallbackId: string,
  ): MenuCategory {
    const slug = this.normalizeSlug(String(data.slug ?? fallbackId ?? ''));
    const label = String(data.label ?? slug);
    const sourceGroups = Array.isArray(data.groups)
      ? data.groups
      : this.createLegacyGroupFromSubcategories(
          data as {
            subcategories?: Array<{
              slug?: string;
              label?: string;
              enabled?: boolean;
            }>;
          },
        );

    const groups = sourceGroups
      .map((group) => {
        const groupSlug = this.normalizeSlug(
          String(group?.slug ?? group?.label ?? ''),
        );
        const groupLabel = String(group?.label ?? group?.slug ?? '');
        const subcategories = Array.isArray(group?.subcategories)
          ? group.subcategories
              .map((item) => ({
                slug: this.normalizeSlug(
                  String(item?.slug ?? item?.label ?? ''),
                ),
                label: String(item?.label ?? item?.slug ?? ''),
                enabled: item?.enabled !== false,
              }))
              .filter((item) => item.slug && item.label)
          : [];

        return {
          slug: groupSlug,
          label: groupLabel,
          enabled: group?.enabled !== false,
          subcategories,
        };
      })
      .filter((group) => group.slug && group.label);

    return {
      slug,
      label,
      order:
        typeof data.order === 'number' && Number.isFinite(data.order)
          ? Math.round(data.order)
          : 0,
      enabled: data.enabled !== false,
      groups,
    };
  }

  private normalizeCategory(category: MenuCategory): MenuCategory {
    const slug = this.normalizeSlug(category.slug);
    const label = category.label.trim() || slug;
    const uniqueGroups = new Map<
      string,
      {
        label: string;
        enabled: boolean;
        subcategories: Map<string, { label: string; enabled: boolean }>;
      }
    >();

    for (const group of category.groups ?? []) {
      const groupSlug = this.normalizeSlug(
        String(group.slug ?? group.label ?? ''),
      );
      const groupLabel = String(group.label ?? group.slug ?? '').trim();
      const groupEnabled = group.enabled !== false;

      if (!groupSlug || !groupLabel) {
        continue;
      }

      if (!uniqueGroups.has(groupSlug)) {
        uniqueGroups.set(groupSlug, {
          label: groupLabel,
          enabled: groupEnabled,
          subcategories: new Map<string, { label: string; enabled: boolean }>(),
        });
      }

      const targetGroup = uniqueGroups.get(groupSlug);

      for (const subcategory of group.subcategories ?? []) {
        const subSlug = this.normalizeSlug(
          String(subcategory.slug ?? subcategory.label ?? ''),
        );
        const subLabel = String(
          subcategory.label ?? subcategory.slug ?? '',
        ).trim();
        const subEnabled = subcategory.enabled !== false;

        if (!subSlug || !subLabel || !targetGroup) {
          continue;
        }

        if (!targetGroup.subcategories.has(subSlug)) {
          targetGroup.subcategories.set(subSlug, {
            label: subLabel,
            enabled: subEnabled,
          });
        }
      }
    }

    return {
      slug,
      label,
      order:
        typeof category.order === 'number' && Number.isFinite(category.order)
          ? Math.round(category.order)
          : 0,
      enabled: category.enabled !== false,
      groups: Array.from(uniqueGroups.entries()).map(([groupSlug, group]) => ({
        slug: groupSlug,
        label: group.label,
        enabled: group.enabled,
        subcategories: Array.from(group.subcategories.entries()).map(
          ([subSlug, subcategory]) => ({
            slug: subSlug,
            label: subcategory.label,
            enabled: subcategory.enabled,
          }),
        ),
      })),
    };
  }

  private createLegacyGroupFromSubcategories(data: {
    subcategories?: Array<{ slug?: string; label?: string; enabled?: boolean }>;
  }): Array<{
    slug: string;
    label: string;
    enabled: boolean;
    subcategories: Array<{ slug?: string; label?: string; enabled?: boolean }>;
  }> {
    if (!Array.isArray(data.subcategories) || data.subcategories.length === 0) {
      return [];
    }

    return [
      {
        slug: 'generale',
        label: 'Generale',
        enabled: true,
        subcategories: data.subcategories,
      },
    ];
  }

  private normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private mapProduct(data: Partial<Product>, fallbackId: string): Product {
    const legacyData = data as Partial<Product> & {
      categorySlug?: unknown;
      subcategorySlug?: unknown;
    };

    const normalizedCode = this.normalizeProductCode(
      String(data.code ?? fallbackId ?? ''),
      fallbackId,
      data.id,
    );

    return this.normalizeProduct({
      ...data,
      id:
        typeof data.id === 'number' && Number.isFinite(data.id)
          ? data.id
          : this.createNumericIdFromCode(normalizedCode),
      code: normalizedCode,
      name: String(data.name ?? ''),
      category: String(data.category ?? legacyData.categorySlug ?? ''),
      groupId: String(data.groupId ?? ''),
      subcategory: String(data.subcategory ?? legacyData.subcategorySlug ?? ''),
      shortDescription: String(data.shortDescription ?? ''),
      description: String(data.description ?? ''),
      basePrice: Number(data.basePrice ?? 0),
      showPrice: data.showPrice !== false,
      supplierPrice:
        typeof data.supplierPrice === 'number' ? data.supplierPrice : undefined,
      finalPrice:
        typeof data.finalPrice === 'number' ? data.finalPrice : undefined,
      imageUrl: String(data.imageUrl ?? ''),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      isActive: data.isActive !== false,
      isOffer: Boolean(data.isOffer),
      offerType:
        typeof data.offerType === 'string' ? data.offerType.trim() : undefined,
      offerLabel:
        typeof data.offerLabel === 'string'
          ? data.offerLabel
          : this.getOfferLabel(data.offerType),
      discountPercent:
        typeof data.discountPercent === 'number'
          ? data.discountPercent
          : undefined,
      relatedProductCodes: Array.isArray(data.relatedProductCodes)
        ? data.relatedProductCodes.map(String)
        : [],
      optionGroups: Array.isArray(data.optionGroups)
        ? data.optionGroups.map((group) => this.normalizeOptionGroup(group))
        : [],
    });
  }

  private normalizeProduct(product: Partial<Product>): Product {
    const legacyProduct = product as Partial<Product> & {
      categorySlug?: unknown;
      subcategorySlug?: unknown;
    };

    const normalizedCode = this.normalizeProductCode(
      String(product.code ?? ''),
      String(product.id ?? ''),
      product.id,
    );

    return {
      id:
        typeof product.id === 'number' && Number.isFinite(product.id)
          ? product.id
          : this.createNumericIdFromCode(normalizedCode),
      code: normalizedCode,
      name: String(product.name ?? ''),
      category: String(product.category ?? legacyProduct.categorySlug ?? ''),
      groupId: String(product.groupId ?? ''),
      subcategory: String(
        product.subcategory ?? legacyProduct.subcategorySlug ?? '',
      ),
      shortDescription: String(product.shortDescription ?? ''),
      description: String(product.description ?? ''),
      basePrice: Number(product.basePrice ?? 0),
      showPrice: product.showPrice !== false,
      supplierPrice:
        typeof product.supplierPrice === 'number'
          ? product.supplierPrice
          : undefined,
      finalPrice:
        typeof product.finalPrice === 'number' ? product.finalPrice : undefined,
      imageUrl: String(product.imageUrl ?? ''),
      tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
      isActive: product.isActive !== false,
      isOffer: Boolean(product.isOffer),
      offerType:
        typeof product.offerType === 'string'
          ? product.offerType.trim()
          : undefined,
      offerLabel:
        typeof product.offerLabel === 'string'
          ? product.offerLabel
          : this.getOfferLabel(product.offerType),
      discountPercent:
        typeof product.discountPercent === 'number'
          ? product.discountPercent
          : undefined,
      relatedProductCodes: Array.isArray(product.relatedProductCodes)
        ? product.relatedProductCodes.map(String)
        : [],
      optionGroups: Array.isArray(product.optionGroups)
        ? product.optionGroups.map((group) => this.normalizeOptionGroup(group))
        : [],
    };
  }

  private async listProductsByCategory(
    productsRef: ReturnType<typeof collection>,
    categorySlug: string,
  ) {
    const byCategory = await getDocs(
      query(productsRef, where('category', '==', categorySlug)),
    );

    if (byCategory.docs.length > 0) {
      return byCategory;
    }

    return getDocs(
      query(productsRef, where('categorySlug', '==', categorySlug)),
    );
  }

  private toPersistenceProduct(product: Product): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      id: product.id,
      code: product.code,
      name: product.name,
      category: product.category,
      groupId: product.groupId,
      subcategory: product.subcategory,
      shortDescription: product.shortDescription,
      description: product.description,
      basePrice: product.basePrice,
      showPrice: product.showPrice,
      isActive: product.isActive,
      imageUrl: product.imageUrl,
      tags: product.tags ?? [],
      isOffer: product.isOffer,
      relatedProductCodes: product.relatedProductCodes ?? [],
      optionGroups: product.optionGroups ?? [],
    };

    if (typeof product.finalPrice === 'number') {
      payload['finalPrice'] = product.finalPrice;
    }

    if (typeof product.supplierPrice === 'number') {
      payload['supplierPrice'] = product.supplierPrice;
    }

    if (typeof product.offerType === 'string') {
      payload['offerType'] = product.offerType;
    }

    if (typeof product.discountPercent === 'number') {
      payload['discountPercent'] = product.discountPercent;
    }

    return payload;
  }

  private getOfferLabel(
    offerType: Product['offerType'] | undefined,
  ): string | undefined {
    switch (offerType) {
      case 'flash':
        return 'Offerta flash';
      case 'stagionale':
        return 'Offerta stagionale';
      case 'promo':
        return 'Promo';
      default:
        return undefined;
    }
  }

  private createNumericIdFromCode(code: string): number {
    if (!code) {
      return 0;
    }

    let hash = 0;

    for (let index = 0; index < code.length; index += 1) {
      hash = (hash * 31 + code.charCodeAt(index)) | 0;
    }

    return Math.abs(hash);
  }

  private normalizeProductCode(
    rawCode: string,
    fallbackCode: string,
    fallbackId?: number,
  ): string {
    const cleanedCode = String(rawCode ?? '')
      .trim()
      .toUpperCase();

    if (!cleanedCode) {
      return String(fallbackCode ?? '')
        .trim()
        .toUpperCase();
    }

    if (/^\d+$/.test(cleanedCode)) {
      const numericSuffix =
        cleanedCode || String(fallbackId ?? fallbackCode ?? '');
      return `H2O-${numericSuffix}`;
    }

    return cleanedCode;
  }

  private normalizeOptionGroup(
    group: Partial<ProductOptionGroup>,
  ): ProductOptionGroup {
    return {
      id: String(group.id ?? ''),
      title: String(group.title ?? ''),
      required: Boolean(group.required),
      options: Array.isArray(group.options)
        ? group.options.map((option) => ({
            id: String(option.id ?? ''),
            label: String(option.label ?? ''),
            priceDelta: Number(option.priceDelta ?? 0),
          }))
        : [],
    };
  }
}

import { Injectable } from '@angular/core';
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

  private mapProduct(data: Partial<Product>, fallbackId: string): Product {
    const normalizedCode = String(data.code ?? fallbackId ?? '')
      .trim()
      .toUpperCase();

    return this.normalizeProduct({
      ...data,
      id:
        typeof data.id === 'number' && Number.isFinite(data.id)
          ? data.id
          : this.createNumericIdFromCode(normalizedCode),
      slug: String(data.slug ?? ''),
      code: normalizedCode,
      name: String(data.name ?? ''),
      category: String(data.category ?? data.categorySlug ?? ''),
      categorySlug: String(data.categorySlug ?? data.category ?? ''),
      groupId: String(data.groupId ?? ''),
      subcategory: String(data.subcategory ?? data.subcategorySlug ?? ''),
      subcategorySlug: String(data.subcategorySlug ?? data.subcategory ?? ''),
      shortDescription: String(data.shortDescription ?? ''),
      description: String(data.description ?? ''),
      basePrice: Number(data.basePrice ?? 0),
      finalPrice:
        typeof data.finalPrice === 'number' ? data.finalPrice : undefined,
      imageUrl: String(data.imageUrl ?? ''),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      isOffer: Boolean(data.isOffer),
      offerType:
        data.offerType === 'promo' ||
        data.offerType === 'flash' ||
        data.offerType === 'stagionale'
          ? data.offerType
          : undefined,
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
    const normalizedCode = String(product.code ?? '')
      .trim()
      .toUpperCase();

    return {
      id:
        typeof product.id === 'number' && Number.isFinite(product.id)
          ? product.id
          : this.createNumericIdFromCode(normalizedCode),
      slug: String(product.slug ?? ''),
      code: normalizedCode,
      name: String(product.name ?? ''),
      category: String(product.category ?? product.categorySlug ?? ''),
      categorySlug: String(product.categorySlug ?? product.category ?? ''),
      groupId: String(product.groupId ?? ''),
      subcategory: String(product.subcategory ?? product.subcategorySlug ?? ''),
      subcategorySlug: String(
        product.subcategorySlug ?? product.subcategory ?? '',
      ),
      shortDescription: String(product.shortDescription ?? ''),
      description: String(product.description ?? ''),
      basePrice: Number(product.basePrice ?? 0),
      finalPrice:
        typeof product.finalPrice === 'number' ? product.finalPrice : undefined,
      imageUrl: String(product.imageUrl ?? ''),
      tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
      isOffer: Boolean(product.isOffer),
      offerType:
        product.offerType === 'promo' ||
        product.offerType === 'flash' ||
        product.offerType === 'stagionale'
          ? product.offerType
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
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      shortDescription: product.shortDescription,
      description: product.description,
      basePrice: product.basePrice,
      imageUrl: product.imageUrl,
      isOffer: product.isOffer,
      relatedProductCodes: product.relatedProductCodes ?? [],
    };

    if (typeof product.finalPrice === 'number') {
      payload['finalPrice'] = product.finalPrice;
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

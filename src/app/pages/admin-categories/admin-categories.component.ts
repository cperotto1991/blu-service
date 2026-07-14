import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  MenuCategory,
  MenuGroup,
  MenuSubcategory,
} from '../../core/models/menu-category.model';
import { FirebaseAuthService } from '../../core/services/firebase-auth.service';
import { CategoryMenuService } from '../../core/services/category-menu.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(FirebaseAuthService);
  private readonly categoryMenuService = inject(CategoryMenuService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly user = this.authService.user;
  readonly isAuthReady = this.authService.isReady;
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isAdmin = this.authService.isAdmin;
  readonly categories = this.categoryMenuService.categories;
  readonly hasCategories = computed(() => this.categories().length > 0);
  readonly isSaving = signal(false);
  readonly statusMessage = signal('');
  readonly errorMessage = signal('');
  readonly editingSlug = signal<string | null>(null);
  readonly groupInputs = signal<
    Array<{
      label: string;
      enabled: boolean;
      subcategories: Array<{ label: string; enabled: boolean }>;
    }>
  >([
    {
      label: '',
      enabled: true,
      subcategories: [{ label: '', enabled: true }],
    },
  ]);
  // Backward compatibility for stale browser chunks referencing old template binding.
  readonly subcategoryInputs = computed(() =>
    this.groupInputs().flatMap((group) => group.subcategories),
  );

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly categoryForm = this.fb.nonNullable.group({
    label: ['', [Validators.required]],
    enabled: [true],
  });

  constructor() {
    if (this.isBrowser) {
      void this.categoryMenuService.loadCategories();
    }
  }

  async signIn(): Promise<void> {
    this.errorMessage.set('');
    this.statusMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.authService.signIn(email, password);
      this.statusMessage.set('Accesso completato.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    }
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.statusMessage.set('Sei uscito dalla sessione.');
  }

  addGroupInput(): void {
    this.groupInputs.update((items) => [
      ...items,
      {
        label: '',
        enabled: true,
        subcategories: [{ label: '', enabled: true }],
      },
    ]);
  }

  removeGroupInput(index: number): void {
    this.groupInputs.update((items) => {
      if (items.length <= 1) {
        return [
          {
            label: '',
            enabled: true,
            subcategories: [{ label: '', enabled: true }],
          },
        ];
      }

      return items.filter((_item, itemIndex) => itemIndex !== index);
    });
  }

  updateGroupInput(index: number, label: string): void {
    this.groupInputs.update((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, label } : item,
      ),
    );
  }

  addSubcategoryInput(groupIndex: number): void {
    this.groupInputs.update((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== groupIndex) {
          return item;
        }

        return {
          ...item,
          subcategories: [...item.subcategories, { label: '', enabled: true }],
        };
      }),
    );
  }

  removeSubcategoryInput(groupIndex: number, subcategoryIndex: number): void {
    this.groupInputs.update((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== groupIndex) {
          return item;
        }

        if (item.subcategories.length <= 1) {
          return {
            ...item,
            subcategories: [{ label: '', enabled: true }],
          };
        }

        return {
          ...item,
          subcategories: item.subcategories.filter(
            (_sub, subIndex) => subIndex !== subcategoryIndex,
          ),
        };
      }),
    );
  }

  updateSubcategoryInput(
    groupIndex: number,
    subcategoryIndex: number,
    label: string,
  ): void {
    this.groupInputs.update((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== groupIndex) {
          return item;
        }

        return {
          ...item,
          subcategories: item.subcategories.map((subcategory, subIndex) =>
            subIndex === subcategoryIndex
              ? { ...subcategory, label }
              : subcategory,
          ),
        };
      }),
    );
  }

  toggleCategoryEnabled(): void {
    this.categoryForm.patchValue({
      enabled: !this.categoryForm.controls.enabled.value,
    });
  }

  toggleGroupEnabled(index: number): void {
    this.groupInputs.update((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  }

  toggleSubcategoryEnabled(groupIndex: number, subcategoryIndex: number): void {
    this.groupInputs.update((items) =>
      items.map((item, itemIndex) =>
        itemIndex === groupIndex
          ? {
              ...item,
              subcategories: item.subcategories.map((subcategory, subIndex) =>
                subIndex === subcategoryIndex
                  ? { ...subcategory, enabled: !subcategory.enabled }
                  : subcategory,
              ),
            }
          : item,
      ),
    );
  }

  async saveCategory(): Promise<void> {
    this.errorMessage.set('');
    this.statusMessage.set('');

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();
    const label = value.label.trim();
    const slug = this.editingSlug() ?? this.normalizeSlug(label);
    const existingCategory = this.categories().find(
      (category) => category.slug === slug,
    );

    if (!slug || !label) {
      this.errorMessage.set('Categoria non valida. Inserisci un nome.');
      return;
    }

    this.isSaving.set(true);

    try {
      const category: MenuCategory = {
        slug,
        label,
        order: existingCategory?.order ?? this.getNextOrderValue(),
        enabled: value.enabled,
        groups: this.parseGroups(this.groupInputs()),
      };

      await this.categoryMenuService.saveCategory(category);
      this.statusMessage.set(
        this.editingSlug()
          ? `Categoria aggiornata: ${category.label}`
          : `Categoria creata: ${category.label}`,
      );
      this.resetForm();
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  editCategory(category: MenuCategory): void {
    this.editingSlug.set(category.slug);
    this.errorMessage.set('');
    this.statusMessage.set('');

    this.categoryForm.patchValue({
      label: category.label,
      enabled: category.enabled,
    });

    this.groupInputs.set(
      category.groups.length
        ? category.groups.map((group) => ({
            label: group.label,
            enabled: group.enabled !== false,
            subcategories: group.subcategories.length
              ? group.subcategories.map((subcategory) => ({
                  label: subcategory.label,
                  enabled: subcategory.enabled !== false,
                }))
              : [{ label: '', enabled: true }],
          }))
        : [
            {
              label: '',
              enabled: true,
              subcategories: [{ label: '', enabled: true }],
            },
          ],
    );
  }

  async deleteCategory(category: MenuCategory): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    const confirmed = window.confirm(
      `Vuoi eliminare la categoria "${category.label}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.errorMessage.set('');
    this.statusMessage.set('');
    this.isSaving.set(true);

    try {
      await this.categoryMenuService.deleteCategory(category.slug);
      this.statusMessage.set(`Categoria eliminata: ${category.label}`);

      if (this.editingSlug() === category.slug) {
        this.resetForm();
      }
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  canMoveUp(index: number): boolean {
    return index > 0;
  }

  canMoveDown(index: number): boolean {
    return index < this.categories().length - 1;
  }

  async moveCategory(index: number, direction: -1 | 1): Promise<void> {
    const orderedCategories = [...this.categories()];
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= orderedCategories.length) {
      return;
    }

    this.errorMessage.set('');
    this.statusMessage.set('Riordino categorie in corso...');
    this.isSaving.set(true);

    const [movedCategory] = orderedCategories.splice(index, 1);
    orderedCategories.splice(targetIndex, 0, movedCategory);

    try {
      for (
        let listIndex = 0;
        listIndex < orderedCategories.length;
        listIndex += 1
      ) {
        const category = orderedCategories[listIndex];
        await this.categoryMenuService.saveCategory({
          ...category,
          order: (listIndex + 1) * 10,
        });
      }

      this.statusMessage.set('Ordine categorie aggiornato.');
    } catch (error) {
      this.errorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  private resetForm(): void {
    this.editingSlug.set(null);
    this.categoryForm.reset({
      label: '',
      enabled: true,
    });
    this.groupInputs.set([
      {
        label: '',
        enabled: true,
        subcategories: [{ label: '', enabled: true }],
      },
    ]);
  }

  private parseGroups(
    values: Array<{
      label: string;
      enabled: boolean;
      subcategories: Array<{ label: string; enabled: boolean }>;
    }>,
  ): MenuGroup[] {
    const map = new Map<
      string,
      {
        label: string;
        enabled: boolean;
        subcategories: MenuSubcategory[];
      }
    >();

    for (const row of values) {
      const label = row.label.trim();
      const slug = this.normalizeSlug(label);

      if (!slug || !label) {
        continue;
      }

      if (!map.has(slug)) {
        map.set(slug, {
          label,
          enabled: row.enabled !== false,
          subcategories: this.parseSubcategories(row.subcategories),
        });
      }
    }

    return Array.from(map.entries()).map(([slug, group]) => ({
      slug,
      label: group.label,
      enabled: group.enabled,
      subcategories: group.subcategories,
    }));
  }

  private getNextOrderValue(): number {
    const currentMax = this.categories().reduce(
      (max, category) => Math.max(max, category.order),
      0,
    );

    return currentMax + 10;
  }

  private parseSubcategories(
    values: Array<{ label: string; enabled: boolean }>,
  ): MenuSubcategory[] {
    const map = new Map<string, MenuSubcategory>();

    for (const row of values) {
      const label = row.label.trim();
      const slug = this.normalizeSlug(label);

      if (!slug || !label) {
        continue;
      }

      if (!map.has(slug)) {
        map.set(slug, {
          slug,
          label,
          enabled: row.enabled !== false,
        });
      }
    }

    return Array.from(map.values());
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

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Si è verificato un errore inatteso.';
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { CategoriesApiService } from '../../../../core/services/categories-api.service';
import { Category, CategoryInput } from '../../../../core/models/category.model';
import { CategoryForm } from '../../components/category-form/category-form';

@Component({
  selector: 'app-category-edit',
  imports: [CategoryForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-category-form
      [esEdicion]="true"
      [category]="category()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class CategoryEdit {
  readonly store = inject(CategoriesStore);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.params()?.get('id') ?? '');

  readonly category = signal<Category | null>(null);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.categoriesApi.porId(id).subscribe({
        next: (respuesta) => this.category.set(respuesta.data),
        error: () => undefined
      });
    });
  }

  async guardar(datos: CategoryInput): Promise<void> {
    try {
      await this.store.actualizar(this.id(), datos);
      this.router.navigate(['/admin/categorias']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

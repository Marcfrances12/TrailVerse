import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { CategoryInput } from '../../../../core/models/category.model';
import { CategoryForm } from '../../components/category-form/category-form';

@Component({
  selector: 'app-category-create',
  imports: [CategoryForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-category-form
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class CategoryCreate {
  readonly store = inject(CategoriesStore);
  private readonly router = inject(Router);

  readonly errorServidor = signal<unknown>(null);

  async guardar(datos: CategoryInput): Promise<void> {
    try {
      await this.store.crear(datos);
      this.router.navigate(['/admin/categorias']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

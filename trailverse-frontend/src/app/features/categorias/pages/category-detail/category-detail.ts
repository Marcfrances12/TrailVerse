import { Component, inject, signal, computed, type Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { Category } from '../../../../core/models/category.model';
import { CategoriesApiService } from '../../../../core/services/categories-api.service';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-category-detail',
  imports: [RouterLink],
  templateUrl: './category-detail.html'
})
export class CategoryDetail {
  private readonly store = inject(CategoriesStore);
  private readonly api = inject(CategoriesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly recarga = signal(0);
  private readonly params = toSignal(this.route.paramMap);
  private readonly categoryId: Signal<string> = computed(() => this.params()?.get('id') ?? '');

  readonly category = toSignal(
    combineLatest([toObservable(this.categoryId), toObservable(this.recarga)]).pipe(
      switchMap(([id]) => (id ? this.api.porId(id) : of(null)))
    )
  );

  readonly formatFecha = formatFecha;

  async cambiarEstado(cat: Category): Promise<void> {
    const activar = !cat.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar?' : '¿Desactivar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      if (activar) await this.store.cambiarEstado(cat, true);
      else await this.store.cambiarEstado(cat, false);
      this.recarga.update((v) => v + 1);
    } catch { /* interceptor */ }
  }

  async eliminar(cat: Category): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar esta categoría?',
      text: `"${cat.name}" se borrará de forma lógica.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(cat);
      this.router.navigate(['/admin/categorias']);
    } catch { /* interceptor */ }
  }
}

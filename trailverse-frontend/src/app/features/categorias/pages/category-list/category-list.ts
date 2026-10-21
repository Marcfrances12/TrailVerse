import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { Category } from '../../../../core/models/category.model';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-category-list',
  imports: [RouterLink, SkeletonGrid, EmptyState, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-list.html'
})
export class CategoryList implements OnInit {
  readonly store = inject(CategoriesStore);
  readonly modoPapelera = signal(false);
  readonly formatFecha = formatFecha;

  ngOnInit(): void {
    this.store.cargar().catch(() => undefined);
  }

  reintentar(): void {
    this.store.cargar({ forzar: true }).catch(() => undefined);
  }

  reintentarPapelera(): void {
    this.store.cargarEliminados().catch(() => undefined);
  }

  alternarPapelera(): void {
    const activar = !this.modoPapelera();
    this.modoPapelera.set(activar);
    if (activar) {
      this.store.cargarEliminados().catch(() => undefined);
    }
  }

  async cambiarEstado(category: Category): Promise<void> {
    const activar = !category.isActive;
    const resultado = await Swal.fire({
      title: activar ? '¿Activar la categoría?' : '¿Desactivar la categoría?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, activar' : 'Sí, desactivar',
      confirmButtonColor: activar ? '#2d6a4f' : '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.cambiarEstado(category, activar);
    } catch {}
  }

  async eliminar(category: Category): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar esta categoría?',
      text: `"${category.name}" se borrará de forma lógica.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.eliminar(category);
    } catch {}
  }

  async restaurar(category: Category): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Restaurar esta categoría?',
      text: `"${category.name}" volverá a estar activa en el listado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      confirmButtonColor: '#2d6a4f',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.restaurar(category);
    } catch { /* interceptor */ }
  }

  async borrarDefinitivo(category: Category): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Eliminar definitivamente?',
      text: `"${category.name}" se borrará de forma permanente. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar para siempre',
      confirmButtonColor: '#b91c1c',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;
    try {
      await this.store.borrarDefinitivo(category);
    } catch { /* interceptor */ }
  }
}

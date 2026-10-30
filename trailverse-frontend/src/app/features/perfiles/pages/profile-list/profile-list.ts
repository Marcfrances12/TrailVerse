import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfilesStore } from '../../../../core/stores/profiles.store';
import { PerfilAdmin } from '../../../../core/models/profile.model';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SkeletonGrid } from '../../../../shared/components/skeleton-grid/skeleton-grid';

const ETIQUETAS_ESTADO: Record<PerfilAdmin['estado'], string> = {
  ok: 'Activo',
  'usuario-inactivo': 'Usuario inactivo',
  'usuario-no-existe': 'Usuario inexistente',
  'sin-perfil': 'Sin perfil'
};

@Component({
  selector: 'app-profile-list',
  imports: [RouterLink, EmptyState, ErrorState, SkeletonGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-list.html'
})
export class ProfileList implements OnInit {
  readonly store = inject(ProfilesStore);
  readonly etiquetas = ETIQUETAS_ESTADO;

  ngOnInit(): void {
    this.store.cargar().catch(() => undefined);
  }

  reintentar(): void {
    this.store.cargar().catch(() => undefined);
  }

  alternarIncidencias(): void {
    this.store.alternarIncidencias().catch(() => undefined);
  }

  puedeEditar(perfil: PerfilAdmin): boolean {
    return perfil.estado === 'ok' || perfil.estado === 'usuario-inactivo';
  }

  claseEstado(perfil: PerfilAdmin): string {
    switch (perfil.estado) {
      case 'ok':
        return 'bg-bosque-100 text-bosque-800';
      case 'usuario-inactivo':
        return 'bg-crema-200 text-tinta-suave';
      default:
        return 'bg-red-100 text-red-700';
    }
  }
}

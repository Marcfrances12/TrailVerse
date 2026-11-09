import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import Swal from 'sweetalert2';
import { map } from 'rxjs';
import { AuthStore } from '../../core/stores/auth.store';
import { ProfilesStore } from '../../core/stores/profiles.store';
import { Search } from '../../shared/components/search/search';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-public-navbar',
  imports: [RouterLink, RouterLinkActive, UserAvatar, Search],
  templateUrl: './public-navbar.html'
})
export class PublicNavbar {
  readonly store = inject(AuthStore);
  readonly perfiles = inject(ProfilesStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly busqueda = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('q') ?? '')),
    { initialValue: '' }
  );

  buscar(termino: string): void {
    const q = termino.trim();
    const enListado = this.router.url.split('?')[0] === '/shop';

    if (!q && !enListado) return;

    void this.router.navigate(['/shop'], {
      queryParams: { q: q || null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: enListado
    });
  }

  async cerrarSesion(): Promise<void> {
    const resultado = await Swal.fire({
      title: '¿Seguro que quieres cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      confirmButtonColor: '#2d6a4f',
      cancelButtonText: 'Cancelar'
    });
    if (!resultado.isConfirmed) return;

    await this.store.logout();
    await this.router.navigate(['/login']);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Sesión cerrada', showConfirmButton: false, timer: 2500, timerProgressBar: true });
  }
}

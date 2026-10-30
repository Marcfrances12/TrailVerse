import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthStore } from '../../core/stores/auth.store';
import { ProfilesStore } from '../../core/stores/profiles.store';
import { UserAvatar } from '../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, UserAvatar],
  templateUrl: './navbar.html'
})
export class Navbar {
  readonly store = inject(AuthStore);
  readonly perfiles = inject(ProfilesStore);
  private readonly router = inject(Router);

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

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfilesApiService } from '../../../../core/services/profiles-api.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ProfilesStore } from '../../../../core/stores/profiles.store';
import { Profile, ProfileUpdateInput } from '../../../../core/models/profile.model';
import { ProfileForm } from '../../components/profile-form/profile-form';
import { ProfileHeader } from '../../components/profile-header/profile-header';
import { LikesApiService } from '../../../../core/services/likes-api.service';
import { ShopRuta } from '../../../../core/models/shop.model';
import { ShopRutaCard } from '../../../shop/components/shop-ruta-card/shop-ruta-card';

@Component({
  selector: 'app-mi-perfil',
  imports: [ProfileForm, ProfileHeader, ShopRutaCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mi-perfil.html'
})
export class MiPerfil {
  private readonly api = inject(ProfilesApiService);
  readonly auth = inject(AuthStore);
  private readonly perfiles = inject(ProfilesStore);

  readonly perfil = signal<Profile | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorServidor = signal<unknown>(null);

  readonly rutasQueMeGustan = signal<ShopRuta[]>([]);
  readonly cargandoLikes = signal(true);
  readonly errorLikes = signal(false);

  constructor() {
    inject(LikesApiService).misLikes().subscribe({
      next: (respuesta) => {
        this.rutasQueMeGustan.set(respuesta.data);
        this.cargandoLikes.set(false);
      },
      error: () => {
        this.errorLikes.set(true);
        this.cargandoLikes.set(false);
      }
    });

    this.api.miPerfil().subscribe({
      next: (respuesta) => {
        this.perfil.set(respuesta.data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se ha podido cargar tu perfil.');
        this.cargando.set(false);
      }
    });
  }

  async guardar(datos: ProfileUpdateInput): Promise<void> {
    this.enviando.set(true);
    this.errorServidor.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.actualizarMiPerfil(datos));
      this.perfil.set(respuesta.data);
      this.perfiles.actualizarMiPerfil(respuesta.data);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Perfil actualizado', showConfirmButton: false, timer: 2500, timerProgressBar: true });
    } catch (error) {
      this.errorServidor.set(error);
    } finally {
      this.enviando.set(false);
    }
  }
}

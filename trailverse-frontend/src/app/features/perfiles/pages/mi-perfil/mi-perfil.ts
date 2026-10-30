import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ProfilesApiService } from '../../../../core/services/profiles-api.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ProfilesStore } from '../../../../core/stores/profiles.store';
import { Profile } from '../../../../core/models/profile.model';
import { ProfileForm } from '../../components/profile-form/profile-form';
import { ProfileHeader } from '../../components/profile-header/profile-header';

@Component({
  selector: 'app-mi-perfil',
  imports: [ProfileForm, ProfileHeader],
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

  constructor() {
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

  onGuardado(perfil: Profile): void {
    this.perfil.set(perfil);
    this.perfiles.actualizarMiPerfil(perfil);
  }
}

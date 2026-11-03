import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfilesApiService } from '../../../../core/services/profiles-api.service';
import { Profile, ProfileUpdateInput } from '../../../../core/models/profile.model';
import { ProfileForm } from '../../components/profile-form/profile-form';
import { ProfileHeader } from '../../components/profile-header/profile-header';

@Component({
  selector: 'app-profile-edit',
  imports: [RouterLink, ProfileForm, ProfileHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-edit.html'
})
export class ProfileEdit {
  private readonly api = inject(ProfilesApiService);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.paramMap);
  readonly userId = computed(() => this.params()?.get('userId') ?? '');

  readonly perfil = signal<Profile | null>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    effect(() => {
      const userId = this.userId();
      if (userId) this.cargar(userId);
    });
  }

  private cargar(userId: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.api.porUsuario(userId).subscribe({
      next: (respuesta) => {
        this.perfil.set(respuesta.data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se ha podido cargar el perfil.');
        this.cargando.set(false);
      }
    });
  }

  async guardar(datos: ProfileUpdateInput): Promise<void> {
    this.enviando.set(true);
    this.errorServidor.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.actualizarPorUsuario(this.userId(), datos));
      this.perfil.set(respuesta.data);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Perfil actualizado', showConfirmButton: false, timer: 2500, timerProgressBar: true });
    } catch (error) {
      this.errorServidor.set(error);
    } finally {
      this.enviando.set(false);
    }
  }
}

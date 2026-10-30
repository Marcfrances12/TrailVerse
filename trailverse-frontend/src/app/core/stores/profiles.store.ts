import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProfilesApiService } from '../services/profiles-api.service';
import { PerfilAdmin, Profile } from '../models/profile.model';

const ESTADOS_INCIDENCIA = ['usuario-no-existe', 'sin-perfil'];

@Injectable({ providedIn: 'root' })
export class ProfilesStore {
  private readonly api = inject(ProfilesApiService);

  private readonly _perfiles = signal<PerfilAdmin[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _soloIncidencias = signal(false);
  private readonly _miPerfil = signal<Profile | null>(null);

  readonly perfiles = this._perfiles.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly soloIncidencias = this._soloIncidencias.asReadonly();
  readonly miPerfil = this._miPerfil.asReadonly();

  readonly total = computed(() => this._perfiles().length);
  readonly incidencias = computed(() =>
    this._perfiles().filter((perfil) => ESTADOS_INCIDENCIA.includes(perfil.estado)).length
  );

  private mensajeDeError(error: unknown): string {
    const cuerpo = (error as any)?.error;
    if (typeof cuerpo?.error === 'string') return cuerpo.error;
    if (typeof (error as any)?.message === 'string') return (error as any).message;
    return 'Se ha producido un error inesperado.';
  }

  async cargar(): Promise<void> {
    this._cargando.set(true);
    this._error.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.listar({ soloIncidencias: this._soloIncidencias() }));
      this._perfiles.set(respuesta.data);
    } catch (error) {
      this._error.set(this.mensajeDeError(error));
      throw error;
    } finally {
      this._cargando.set(false);
    }
  }

  async alternarIncidencias(): Promise<void> {
    this._soloIncidencias.update((valor) => !valor);
    await this.cargar();
  }

  /** Perfil del usuario en sesión (avatar y nombre en el navbar). */
  async cargarMiPerfil(): Promise<void> {
    try {
      const respuesta = await firstValueFrom(this.api.miPerfil());
      this._miPerfil.set(respuesta.data);
    } catch {
      this._miPerfil.set(null);
    }
  }

  actualizarMiPerfil(perfil: Profile): void {
    this._miPerfil.set(perfil);
  }

  limpiarMiPerfil(): void {
    this._miPerfil.set(null);
  }
}

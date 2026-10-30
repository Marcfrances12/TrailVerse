import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthUser, LoginRequest, RolName } from '../models/auth.model';
import { RutasStore } from './rutas.store';
import { ProfilesStore } from './profiles.store';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService);
  private readonly rutas = inject(RutasStore);
  private readonly perfiles = inject(ProfilesStore);

  private readonly _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();

  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');
  readonly roles = computed<RolName[]>(() => {
    const usuario = this._user();
    return usuario ? [usuario.role] : [];
  });

  hasRole(rol: RolName): boolean {
    return this._user()?.role === rol;
  }

  /** Al arrancar la app: si la cookie de sesión sigue válida, recupera el usuario. */
  async restaurarSesion(): Promise<void> {
    try {
      const respuesta = await firstValueFrom(this.auth.me());
      this.cambiarUsuario(respuesta.data);
    } catch {
      this.cambiarUsuario(null);
    }
  }

  async login(datos: LoginRequest): Promise<AuthUser> {
    const respuesta = await firstValueFrom(this.auth.login(datos));
    this.cambiarUsuario(respuesta.data.user);
    return respuesta.data.user;
  }

  async logout(): Promise<void> {
    if (this._user()) {
      await firstValueFrom(this.auth.logout()).catch(() => undefined);
    }
    this.limpiar();
  }

  limpiar(): void {
    this.cambiarUsuario(null);
  }

  /** Cualquier cambio de sesión descarta la caché de rutas del usuario anterior. */
  private cambiarUsuario(usuario: AuthUser | null): void {
    this._user.set(usuario);
    this.rutas.limpiarCache();
    if (usuario) {
      this.perfiles.cargarMiPerfil();
    } else {
      this.perfiles.limpiarMiPerfil();
    }
  }
}

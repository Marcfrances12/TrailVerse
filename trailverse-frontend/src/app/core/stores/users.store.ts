import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { UsersApiService } from '../services/users-api.service';
import { User, UserInput, UserUpdateInput, UsersFiltros } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly api = inject(UsersApiService);

  private readonly _users = signal<User[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _cargada = signal(false);
  private readonly _filtros = signal<UsersFiltros>({});
  private ultimaClave = '';

  readonly users = this._users.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly cargada = this._cargada.asReadonly();
  readonly filtros = this._filtros.asReadonly();

  readonly total = computed(() => this._users().length);
  readonly activos = computed(() => this._users().filter((u) => u.isActive).length);

  private claveDe(filtros: UsersFiltros): string {
    return JSON.stringify(Object.entries(filtros).sort());
  }

  private mensajeDeError(error: unknown): string {
    const cuerpo = (error as any)?.error;
    if (typeof cuerpo?.error === 'string') return cuerpo.error;
    if (typeof (error as any)?.message === 'string') return (error as any).message;
    return 'Se ha producido un error inesperado.';
  }

  private avisar(titulo: string): void {
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: titulo, showConfirmButton: false, timer: 2500, timerProgressBar: true });
  }

  async cargar(opciones: { filtros?: UsersFiltros; forzar?: boolean } = {}): Promise<void> {
    const filtros = opciones.filtros ?? {};
    const clave = this.claveDe(filtros);
    if (!opciones.forzar && this._cargada() && clave === this.ultimaClave) return;

    this._cargando.set(true);
    this._error.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.listar(filtros));
      this._users.set(respuesta.data);
      this._filtros.set(filtros);
      this.ultimaClave = clave;
      this._cargada.set(true);
    } catch (error) {
      this._error.set(this.mensajeDeError(error));
      throw error;
    } finally {
      this._cargando.set(false);
    }
  }

  async crear(datos: UserInput): Promise<User> {
    const respuesta = await firstValueFrom(this.api.crear(datos));
    this.avisar('Usuario creado');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async actualizar(id: string, datos: UserUpdateInput): Promise<User> {
    const respuesta = await firstValueFrom(this.api.actualizar(id, datos));
    this.avisar('Usuario actualizado');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async cambiarEstado(user: User, activar: boolean): Promise<void> {
    if (activar) {
      await firstValueFrom(this.api.activar(user._id));
      this.avisar('Usuario activado');
    } else {
      await firstValueFrom(this.api.desactivar(user._id));
      this.avisar('Usuario desactivado');
    }
    await this.cargar({ forzar: true });
  }

  async eliminar(user: User): Promise<void> {
    await firstValueFrom(this.api.eliminar(user._id));
    this.avisar('Usuario eliminado');
    await this.cargar({ forzar: true });
  }
}

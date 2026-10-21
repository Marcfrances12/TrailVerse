import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { RolesApiService } from '../services/roles-api.service';
import { Role, RoleInput, RolesFiltros } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RolesStore {
  private readonly api = inject(RolesApiService);

  private readonly _roles = signal<Role[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _cargada = signal(false);
  private readonly _filtros = signal<RolesFiltros>({});
  private readonly _eliminados = signal<Role[]>([]);
  private readonly _cargandoEliminados = signal(false);
  private readonly _errorEliminados = signal<string | null>(null);
  private ultimaClave = '';

  readonly roles = this._roles.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly cargada = this._cargada.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly eliminados = this._eliminados.asReadonly();
  readonly cargandoEliminados = this._cargandoEliminados.asReadonly();
  readonly errorEliminados = this._errorEliminados.asReadonly();

  readonly total = computed(() => this._roles().length);
  readonly activos = computed(() => this._roles().filter((r) => r.isActive).length);
  readonly totalEliminados = computed(() => this._eliminados().length);

  private claveDe(filtros: RolesFiltros): string {
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

  async cargar(opciones: { filtros?: RolesFiltros; forzar?: boolean } = {}): Promise<void> {
    const filtros = opciones.filtros ?? {};
    const clave = this.claveDe(filtros);
    if (!opciones.forzar && this._cargada() && clave === this.ultimaClave) return;

    this._cargando.set(true);
    this._error.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.listar(filtros));
      this._roles.set(respuesta.data);
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

  async crear(datos: RoleInput): Promise<Role> {
    const respuesta = await firstValueFrom(this.api.crear(datos));
    this.avisar('Rol creado');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async actualizar(id: string, datos: Partial<RoleInput>): Promise<Role> {
    const respuesta = await firstValueFrom(this.api.actualizar(id, datos));
    this.avisar('Rol actualizado');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async cambiarEstado(role: Role, activar: boolean): Promise<void> {
    if (activar) {
      await firstValueFrom(this.api.activar(role._id));
      this.avisar('Rol activado');
    } else {
      await firstValueFrom(this.api.desactivar(role._id));
      this.avisar('Rol desactivado');
    }
    await this.cargar({ forzar: true });
  }

  async eliminar(role: Role): Promise<void> {
    await firstValueFrom(this.api.eliminar(role._id));
    this.avisar('Rol eliminado');
    await this.cargar({ forzar: true });
  }

  async cargarEliminados(): Promise<void> {
    this._cargandoEliminados.set(true);
    this._errorEliminados.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.eliminados());
      this._eliminados.set(respuesta.data);
    } catch (error) {
      this._errorEliminados.set(this.mensajeDeError(error));
      throw error;
    } finally {
      this._cargandoEliminados.set(false);
    }
  }

  async restaurar(role: Role): Promise<void> {
    await firstValueFrom(this.api.restaurar(role._id));
    this._eliminados.update((lista) => lista.filter((item) => item._id !== role._id));
    await this.cargar({ forzar: true });
    this.avisar('Rol restaurado');
  }

  async borrarDefinitivo(role: Role): Promise<void> {
    await firstValueFrom(this.api.borrarDefinitivo(role._id));
    this._eliminados.update((lista) => lista.filter((item) => item._id !== role._id));
    this.avisar('Rol eliminado definitivamente');
  }
}

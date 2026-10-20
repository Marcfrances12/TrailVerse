import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { HostsApiService } from '../services/hosts-api.service';
import { Host, HostInput, HostsFiltros } from '../models/host.model';

@Injectable({ providedIn: 'root' })
export class HostsStore {
  private readonly api = inject(HostsApiService);

  private readonly _hosts = signal<Host[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _cargada = signal(false);
  private readonly _filtros = signal<HostsFiltros>({});
  private ultimaClave = '';

  readonly hosts = this._hosts.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly cargada = this._cargada.asReadonly();
  readonly filtros = this._filtros.asReadonly();

  readonly total = computed(() => this._hosts().length);
  readonly activos = computed(() => this._hosts().filter((h) => h.isActive).length);

  private claveDe(filtros: HostsFiltros): string {
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

  async cargar(opciones: { filtros?: HostsFiltros; forzar?: boolean } = {}): Promise<void> {
    const filtros = opciones.filtros ?? {};
    const clave = this.claveDe(filtros);
    if (!opciones.forzar && this._cargada() && clave === this.ultimaClave) return;

    this._cargando.set(true);
    this._error.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.listar(filtros));
      this._hosts.set(respuesta.data);
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

  async crear(datos: HostInput): Promise<Host> {
    const respuesta = await firstValueFrom(this.api.crear(datos));
    this.avisar('Host creado');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async actualizar(id: string, datos: Partial<HostInput>): Promise<Host> {
    const respuesta = await firstValueFrom(this.api.actualizar(id, datos));
    this.avisar('Host actualizado');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async cambiarEstado(host: Host, activar: boolean): Promise<void> {
    if (activar) {
      await firstValueFrom(this.api.activar(host._id));
      this.avisar('Host activado');
    } else {
      await firstValueFrom(this.api.desactivar(host._id));
      this.avisar('Host desactivado');
    }
    await this.cargar({ forzar: true });
  }

  async eliminar(host: Host): Promise<void> {
    await firstValueFrom(this.api.eliminar(host._id));
    this.avisar('Host eliminado');
    await this.cargar({ forzar: true });
  }
}

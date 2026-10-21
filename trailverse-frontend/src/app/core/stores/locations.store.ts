import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { LocationsApiService } from '../services/locations-api.service';
import { Location, LocationInput, LocationsFiltros } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationsStore {
  private readonly api = inject(LocationsApiService);

  private readonly _locations = signal<Location[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _cargada = signal(false);
  private readonly _filtros = signal<LocationsFiltros>({});
  private readonly _eliminados = signal<Location[]>([]);
  private readonly _cargandoEliminados = signal(false);
  private readonly _errorEliminados = signal<string | null>(null);
  private ultimaClave = '';

  readonly locations = this._locations.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly cargada = this._cargada.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly eliminados = this._eliminados.asReadonly();
  readonly cargandoEliminados = this._cargandoEliminados.asReadonly();
  readonly errorEliminados = this._errorEliminados.asReadonly();

  readonly total = computed(() => this._locations().length);
  readonly activas = computed(() => this._locations().filter((l) => l.isActive).length);
  readonly totalEliminados = computed(() => this._eliminados().length);

  private claveDe(filtros: LocationsFiltros): string {
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

  async cargar(opciones: { filtros?: LocationsFiltros; forzar?: boolean } = {}): Promise<void> {
    const filtros = opciones.filtros ?? {};
    const clave = this.claveDe(filtros);
    if (!opciones.forzar && this._cargada() && clave === this.ultimaClave) return;

    this._cargando.set(true);
    this._error.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.listar(filtros));
      this._locations.set(respuesta.data);
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

  async crear(datos: LocationInput): Promise<Location> {
    const respuesta = await firstValueFrom(this.api.crear(datos));
    this.avisar('Localización creada');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async actualizar(id: string, datos: Partial<LocationInput>): Promise<Location> {
    const respuesta = await firstValueFrom(this.api.actualizar(id, datos));
    this.avisar('Localización actualizada');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async cambiarEstado(location: Location, activar: boolean): Promise<void> {
    if (activar) {
      await firstValueFrom(this.api.activar(location._id));
      this.avisar('Localización activada');
    } else {
      await firstValueFrom(this.api.desactivar(location._id));
      this.avisar('Localización desactivada');
    }
    await this.cargar({ forzar: true });
  }

  async eliminar(location: Location): Promise<void> {
    await firstValueFrom(this.api.eliminar(location._id));
    this.avisar('Localización eliminada');
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

  async restaurar(location: Location): Promise<void> {
    await firstValueFrom(this.api.restaurar(location._id));
    this._eliminados.update((lista) => lista.filter((item) => item._id !== location._id));
    await this.cargar({ forzar: true });
    this.avisar('Localización restaurada');
  }

  async borrarDefinitivo(location: Location): Promise<void> {
    await firstValueFrom(this.api.borrarDefinitivo(location._id));
    this._eliminados.update((lista) => lista.filter((item) => item._id !== location._id));
    this.avisar('Localización eliminada definitivamente');
  }
}

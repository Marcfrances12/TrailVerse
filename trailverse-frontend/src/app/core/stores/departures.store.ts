import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { DeparturesApiService } from '../services/departures-api.service';
import { Departure, DepartureInput, DeparturesFiltros } from '../models/departure.model';

@Injectable({ providedIn: 'root' })
export class DeparturesStore {
  private readonly api = inject(DeparturesApiService);

  private readonly _departures = signal<Departure[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _cargada = signal(false);
  private readonly _filtros = signal<DeparturesFiltros>({});
  private ultimaClave = '';

  readonly departures = this._departures.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly cargada = this._cargada.asReadonly();
  readonly filtros = this._filtros.asReadonly();

  readonly total = computed(() => this._departures().length);
  readonly activos = computed(() => this._departures().filter((d) => d.isActive).length);

  private claveDe(filtros: DeparturesFiltros): string {
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

  async cargar(opciones: { filtros?: DeparturesFiltros; forzar?: boolean } = {}): Promise<void> {
    const filtros = opciones.filtros ?? {};
    const clave = this.claveDe(filtros);
    if (!opciones.forzar && this._cargada() && clave === this.ultimaClave) return;

    this._cargando.set(true);
    this._error.set(null);
    try {
      const respuesta = await firstValueFrom(this.api.listar(filtros));
      this._departures.set(respuesta.data);
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

  async crear(datos: DepartureInput): Promise<Departure> {
    const respuesta = await firstValueFrom(this.api.crear(datos));
    this.avisar(`Salida creada (${respuesta.data.sku})`);
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async actualizar(id: string, datos: Partial<DepartureInput>): Promise<Departure> {
    const respuesta = await firstValueFrom(this.api.actualizar(id, datos));
    this.avisar('Salida actualizada');
    await this.cargar({ forzar: true });
    return respuesta.data;
  }

  async cambiarEstado(departure: Departure, activar: boolean): Promise<void> {
    if (activar) {
      await firstValueFrom(this.api.activar(departure._id));
      this.avisar('Salida activada');
    } else {
      await firstValueFrom(this.api.desactivar(departure._id));
      this.avisar('Salida desactivada');
    }
    await this.cargar({ forzar: true });
  }

  async eliminar(departure: Departure): Promise<void> {
    await firstValueFrom(this.api.eliminar(departure._id));
    this.avisar('Salida eliminada');
    await this.cargar({ forzar: true });
  }
}

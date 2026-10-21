import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { RutasApiService } from '../services/rutas-api.service';
import { Ruta, RutaInput, RutasFiltros } from '../models/ruta.model';

/**
 * Store global basado en Signals: caché de rutas, estado de carga,
 * error y selección. Se carga como máximo una vez y se comparte entre
 * componentes para evitar peticiones duplicadas.
 */
@Injectable({ providedIn: 'root' })
export class RutasStore {
  private readonly api = inject(RutasApiService);

  private readonly _rutas = signal<Ruta[]>([]);
  private readonly _seleccionada = signal<Ruta | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _cargada = signal(false);
  private readonly _filtros = signal<RutasFiltros>({});
  private readonly _eliminados = signal<Ruta[]>([]);
  private readonly _cargandoEliminados = signal(false);
  private readonly _errorEliminados = signal<string | null>(null);
  private ultimaClave = '';

  readonly rutas = this._rutas.asReadonly();
  readonly seleccionada = this._seleccionada.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly cargada = this._cargada.asReadonly();
  readonly filtros = this._filtros.asReadonly();
  readonly eliminados = this._eliminados.asReadonly();
  readonly cargandoEliminados = this._cargandoEliminados.asReadonly();
  readonly errorEliminados = this._errorEliminados.asReadonly();

  readonly total = computed(() => this._rutas().length);
  readonly activas = computed(() => this._rutas().filter((ruta) => ruta.isActive).length);
  readonly totalEliminados = computed(() => this._eliminados().length);

  private claveDe(filtros: RutasFiltros): string {
    return JSON.stringify(Object.entries(filtros).sort());
  }

  private mensajeDeError(error: unknown): string {
    const cuerpo = (error as any)?.error;
    if (typeof cuerpo?.error === 'string') return cuerpo.error;
    if (typeof (error as any)?.message === 'string') return (error as any).message;
    return 'Se ha producido un error inesperado.';
  }

  private avisar(titulo: string): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: titulo,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
  }

  /** Carga (o recarga) el listado. Usa la caché si los filtros no cambian. */
  async cargar(opciones: { filtros?: RutasFiltros; forzar?: boolean } = {}): Promise<void> {
    const filtros = opciones.filtros ?? {};
    const clave = this.claveDe(filtros);

    if (!opciones.forzar && this._cargada() && clave === this.ultimaClave) {
      return;
    }

    this._cargando.set(true);
    this._error.set(null);

    try {
      const respuesta = await firstValueFrom(this.api.listar(filtros));
      this._rutas.set(respuesta.data);
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

  /** Carga una ruta por su slug y la deja como selección actual. */
  async cargarPorSlug(slug: string, opciones: { forzar?: boolean } = {}): Promise<Ruta> {
    const actual = this._seleccionada();

    if (!opciones.forzar && actual?.slug === slug) {
      return actual;
    }

    this._cargando.set(true);
    this._error.set(null);

    try {
      const respuesta = await firstValueFrom(this.api.porSlug(slug));
      const ruta = respuesta.data;

      this._seleccionada.set(ruta);
      this.sincronizar(ruta);

      return ruta;
    } catch (error) {
      this._seleccionada.set(null);
      this._error.set(this.mensajeDeError(error));
      throw error;
    } finally {
      this._cargando.set(false);
    }
  }

  async crear(datos: RutaInput): Promise<Ruta> {
    this._cargando.set(true);
    try {
      const respuesta = await firstValueFrom(this.api.crear(datos));
      this._rutas.update((lista) => [respuesta.data, ...lista]);
      this._cargada.set(true);
      this.avisar('Ruta creada correctamente');
      return respuesta.data;
    } finally {
      this._cargando.set(false);
    }
  }

  async actualizar(id: string, datos: Partial<RutaInput>): Promise<Ruta> {
    this._cargando.set(true);
    try {
      const respuesta = await firstValueFrom(this.api.actualizar(id, datos));
      this.sincronizar(respuesta.data);
      this.avisar('Ruta actualizada correctamente');
      return respuesta.data;
    } finally {
      this._cargando.set(false);
    }
  }

  async cambiarEstado(ruta: Ruta, activar: boolean): Promise<Ruta> {
    this._cargando.set(true);
    try {
      const respuesta = activar
        ? await firstValueFrom(this.api.activar(ruta._id))
        : await firstValueFrom(this.api.desactivar(ruta._id));

      this.sincronizar(respuesta.data);
      this.avisar(
        activar ? 'Ruta activada correctamente' : 'Ruta desactivada correctamente'
      );
      return respuesta.data;
    } finally {
      this._cargando.set(false);
    }
  }

  async eliminar(ruta: Ruta): Promise<Ruta> {
    this._cargando.set(true);
    try {
      const respuesta = await firstValueFrom(this.api.eliminar(ruta._id));

      this._rutas.update((lista) => lista.filter((item) => item._id !== ruta._id));
      if (this._seleccionada()?._id === ruta._id) {
        this._seleccionada.set(null);
      }

      this.avisar('Ruta eliminada correctamente');
      return respuesta.data;
    } finally {
      this._cargando.set(false);
    }
  }

  /** Carga la lista de rutas eliminadas (soft delete) para la papelera. */
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

  /** Restaura una ruta de la papelera y la devuelve al listado. */
  async restaurar(ruta: Ruta): Promise<void> {
    await firstValueFrom(this.api.restaurar(ruta._id));
    this._eliminados.update((lista) => lista.filter((item) => item._id !== ruta._id));
    await this.cargar({ forzar: true });
    this.avisar('Ruta restaurada correctamente');
  }

  /** Elimina definitivamente una ruta (borrado físico). */
  async borrarDefinitivo(ruta: Ruta): Promise<void> {
    await firstValueFrom(this.api.borrarDefinitivo(ruta._id));
    this._eliminados.update((lista) => lista.filter((item) => item._id !== ruta._id));
    this.avisar('Ruta eliminada definitivamente');
  }

  limpiarSeleccion(): void {
    this._seleccionada.set(null);
  }

  /** Mantiene coherente el caché del listado con la ruta modificada. */
  private sincronizar(ruta: Ruta): void {
    this._rutas.update((lista) => {
      const indice = lista.findIndex((item) => item._id === ruta._id);
      if (indice === -1) return lista;

      const copia = [...lista];
      copia[indice] = ruta;
      return copia;
    });

    if (this._seleccionada()?._id === ruta._id) {
      this._seleccionada.set(ruta);
    }
  }
}

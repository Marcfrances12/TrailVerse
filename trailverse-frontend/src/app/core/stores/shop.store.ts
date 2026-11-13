import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ShopApiError, ShopApiService } from '../services/shop-api.service';
import {
  ShopFiltros,
  ShopFiltrosOpciones,
  ShopHome,
  ShopRuta,
  ShopRutaDetalle,
  ShopSalida
} from '../models/shop.model';
import {
  FILTROS_SHOP_POR_DEFECTO,
  ParamsLike,
  claveDeFiltros,
  filtrosDesdeParams,
  hayRangoPrecio,
  queryDesdeFiltros
} from '../utils/shop-query';

const MENSAJE_GENERICO = 'No se ha podido cargar la información. Inténtalo de nuevo.';
const MENSAJE_TIEMPO = 'La petición ha excedido el tiempo de espera.';

function mensajeDe(error: unknown): string {
  if (error instanceof ShopApiError) return error.message;
  if (error instanceof DOMException && error.name === 'TimeoutError') return MENSAJE_TIEMPO;
  return MENSAJE_GENERICO;
}

/**
 * Estado del shop: listado, filtros, home y detalle.
 * La URL es la fuente de verdad de los filtros: la UI llama a actualizarFiltros(),
 * el store navega y la lectura de la URL (sincronizarDesdeUrl) dispara la carga.
 */
@Injectable({ providedIn: 'root' })
export class ShopStore {
  private readonly api = inject(ShopApiService);
  private readonly router = inject(Router);

  private readonly _filtros = signal<ShopFiltros>({ ...FILTROS_SHOP_POR_DEFECTO });
  private readonly _rutas = signal<ShopRuta[]>([]);
  private readonly _total = signal(0);
  private readonly _totalPaginas = signal(0);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _opciones = signal<ShopFiltrosOpciones | null>(null);

  private readonly _home = signal<ShopHome | null>(null);
  private readonly _cargandoHome = signal(false);
  private readonly _errorHome = signal<string | null>(null);

  private readonly _detalle = signal<ShopRutaDetalle | null>(null);
  private readonly _salidas = signal<ShopSalida[]>([]);
  private readonly _relacionadas = signal<ShopRuta[]>([]);
  private readonly _salidaId = signal<string | null>(null);
  private readonly _cargandoDetalle = signal(false);
  private readonly _errorDetalle = signal<string | null>(null);

  private claveListado = '';
  private controladorListado: AbortController | null = null;
  private controladorHome: AbortController | null = null;
  private controladorDetalle: AbortController | null = null;

  readonly filtros = this._filtros.asReadonly();
  readonly rutas = this._rutas.asReadonly();
  readonly total = this._total.asReadonly();
  readonly totalPaginas = this._totalPaginas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly opciones = this._opciones.asReadonly();

  readonly home = this._home.asReadonly();
  readonly cargandoHome = this._cargandoHome.asReadonly();
  readonly errorHome = this._errorHome.asReadonly();

  readonly detalle = this._detalle.asReadonly();
  readonly salidas = this._salidas.asReadonly();
  readonly relacionadas = this._relacionadas.asReadonly();
  readonly cargandoDetalle = this._cargandoDetalle.asReadonly();
  readonly errorDetalle = this._errorDetalle.asReadonly();
  readonly salidaSeleccionada = computed(
    () => this._salidas().find((salida) => salida._id === this._salidaId()) ?? null
  );

  readonly hayFiltros = computed(() => {
    const filtros = this._filtros();
    return filtros.q !== ''
      || filtros.categoryId.length > 0
      || filtros.hostId !== ''
      || filtros.locationId !== ''
      || filtros.dificultad !== ''
      || hayRangoPrecio(filtros);
  });

  /** Lee la URL, actualiza los filtros y pide el listado solo si cambian. */
  sincronizarDesdeUrl(params: ParamsLike): void {
    const filtros = filtrosDesdeParams(params);
    this._filtros.set(filtros);

    if (claveDeFiltros(filtros) === this.claveListado) return;
    void this.cargarListado();
  }

  recargar(): void {
    this.claveListado = '';
    void this.cargarListado();
  }

  /** Cambia filtros o búsqueda. Sin página explícita vuelve a la primera. */
  actualizarFiltros(cambios: Partial<ShopFiltros>, opciones: { reemplazar?: boolean } = {}): void {
    const siguiente: ShopFiltros = { ...this._filtros(), ...cambios };
    if (!('page' in cambios)) siguiente.page = 1;
    this.navegar(siguiente, opciones.reemplazar ?? false);
  }

  irAPagina(pagina: number): void {
    this.navegar({ ...this._filtros(), page: pagina }, false);
  }

  limpiarFiltros(): void {
    this.navegar({ ...FILTROS_SHOP_POR_DEFECTO }, false);
  }

  async cargarOpciones(): Promise<void> {
    if (this._opciones()) return;

    try {
      const respuesta = await this.api.opciones();
      this._opciones.set(respuesta.data);
    } catch (error) {
      this._error.set(mensajeDe(error));
    }
  }

  async cargarHome(limite = 10): Promise<void> {
    this.controladorHome?.abort();
    const controlador = new AbortController();
    this.controladorHome = controlador;

    this._cargandoHome.set(true);
    this._errorHome.set(null);

    try {
      const respuesta = await this.api.home(limite, controlador.signal);
      if (controlador.signal.aborted) return;
      this._home.set(respuesta.data);
    } catch (error) {
      if (controlador.signal.aborted) return;
      this._errorHome.set(mensajeDe(error));
    } finally {
      if (this.controladorHome === controlador) this._cargandoHome.set(false);
    }
  }

  async cargarDetalle(slug: string): Promise<void> {
    this.controladorDetalle?.abort();
    const controlador = new AbortController();
    this.controladorDetalle = controlador;

    this._cargandoDetalle.set(true);
    this._errorDetalle.set(null);
    this._detalle.set(null);
    this._salidas.set([]);
    this._relacionadas.set([]);
    this._salidaId.set(null);

    try {
      const [ruta, salidas, relacionadas] = await Promise.all([
        this.api.detalle(slug, controlador.signal),
        this.api.salidas(slug, controlador.signal),
        // Las relacionadas son secundarias: si fallan, el detalle se muestra igualmente.
        this.api.relacionadas(slug, controlador.signal).catch((error: unknown) => {
          if (controlador.signal.aborted) throw error;
          return { ok: true, total: 0, data: [] as ShopRuta[] };
        })
      ]);
      if (controlador.signal.aborted) return;
      this._detalle.set(ruta.data);
      this._salidas.set(salidas.data);
      this._relacionadas.set(relacionadas.data);
    } catch (error) {
      if (controlador.signal.aborted) return;
      this._errorDetalle.set(mensajeDe(error));
    } finally {
      if (this.controladorDetalle === controlador) this._cargandoDetalle.set(false);
    }
  }

  /** Selección de departure para la futura reserva. */
  seleccionarSalida(id: string): void {
    this._salidaId.set(id);
  }

  /** Cancela todas las peticiones en curso. Se llama al salir de una página. */
  cancelar(): void {
    this.controladorListado?.abort();
    this.controladorHome?.abort();
    this.controladorDetalle?.abort();
    this.controladorListado = null;
    this.controladorHome = null;
    this.controladorDetalle = null;
    this.claveListado = '';
    this._cargando.set(false);
    this._cargandoHome.set(false);
    this._cargandoDetalle.set(false);
  }

  private async cargarListado(): Promise<void> {
    this.controladorListado?.abort();
    const controlador = new AbortController();
    this.controladorListado = controlador;
    this.claveListado = claveDeFiltros(this._filtros());

    this._cargando.set(true);
    this._error.set(null);

    try {
      const respuesta = await this.api.listarRutas(this._filtros(), controlador.signal);
      if (controlador.signal.aborted) return;
      this._rutas.set(respuesta.data);
      this._total.set(respuesta.total);
      this._totalPaginas.set(respuesta.totalPages);
    } catch (error) {
      if (controlador.signal.aborted) return;
      this._error.set(mensajeDe(error));
      this.claveListado = '';
    } finally {
      if (this.controladorListado === controlador) this._cargando.set(false);
    }
  }

  private navegar(filtros: ShopFiltros, reemplazar: boolean): void {
    void this.router.navigate(['/shop'], {
      queryParams: queryDesdeFiltros(filtros),
      replaceUrl: reemplazar
    });
  }
}

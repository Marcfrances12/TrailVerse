import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Dificultad } from '../../../../core/models/ruta.model';
import { ShopEntidad, ShopImagen, ShopRuta } from '../../../../core/models/shop.model';
import { ShopApiService } from '../../../../core/services/shop-api.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { FILTROS_SHOP_POR_DEFECTO } from '../../../../core/utils/shop-query';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ShopRutaCard } from '../../../shop/components/shop-ruta-card/shop-ruta-card';

/** Tarjeta visual (categoría, zona u organizador) con imagen propia o de una de sus rutas. */
interface Tesela {
  _id: string;
  nombre: string;
  total: number;
  imagen: ShopImagen | null;
  queryParams: Record<string, string>;
}

interface NivelDificultad {
  valor: Dificultad;
  titulo: string;
  enlace: string;
  texto: string;
  clases: string;
}

const MAX_DESTACADAS = 8;
// 1 grande (2x2) + 4 pequeñas llenan exactamente la rejilla de 4 columnas.
const MAX_CATEGORIAS = 5;
const MAX_ZONAS = 8;
// Límite máximo del listado público: con él basta para sacar destacadas e imágenes de respaldo.
const RUTAS_A_CARGAR = 50;

const NIVELES: NivelDificultad[] = [
  { valor: 'facil', titulo: 'Fácil', enlace: 'Ver rutas fáciles', texto: 'Paseos cómodos para ir en familia o empezar a caminar.', clases: 'from-bosque-500 to-bosque-700' },
  { valor: 'media', titulo: 'Media', enlace: 'Ver rutas de nivel medio', texto: 'Algo de desnivel y más kilómetros. Para quien ya sale al monte.', clases: 'from-amber-500 to-tierra-600' },
  { valor: 'dificil', titulo: 'Difícil', enlace: 'Ver rutas difíciles', texto: 'Cumbres y travesías largas. Buena forma física y experiencia.', clases: 'from-red-600 to-red-900' }
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, Carousel, ErrorState, ShopRutaCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html'
})
export class Home {
  readonly store = inject(ShopStore);
  readonly auth = inject(AuthStore);
  private readonly api = inject(ShopApiService);
  private readonly router = inject(Router);

  readonly niveles = NIVELES;
  readonly rutas = signal<ShopRuta[]>([]);
  readonly totalRutas = signal<number | null>(null);
  readonly busqueda = signal('');

  private controlador: AbortController | null = null;

  /** Las que más gustan a la comunidad (más likes); a igualdad, las más recientes. */
  readonly destacadas = computed(() =>
    [...this.rutas()].sort((a, b) => b.likes - a.likes).slice(0, MAX_DESTACADAS)
  );

  /** Foto del hero: la portada de la ruta más valorada que tenga imagen. */
  readonly imagenHero = computed<ShopImagen | null>(() => {
    const ruta = this.destacadas().find((r) => r.coverImage?.url);
    return ruta ? ruta.coverImage : null;
  });

  readonly categorias = computed(() =>
    this.teselas(this.store.home()?.categories ?? [], 'categoria', (r, id) => r.categoryIds.some((c) => c._id === id)).slice(0, MAX_CATEGORIAS)
  );

  readonly zonas = computed(() =>
    this.teselas(this.store.home()?.locations ?? [], 'localizacion', (r, id) => r.locationId?._id === id).slice(0, MAX_ZONAS)
  );

  readonly organizadores = computed(() =>
    this.teselas(this.store.home()?.hosts ?? [], 'host', (r, id) => r.hostId?._id === id)
  );

  readonly cifras = computed(() => {
    const home = this.store.home();
    return [
      { valor: this.totalRutas(), etiqueta: 'rutas' },
      { valor: home?.locations.length ?? null, etiqueta: 'zonas' },
      { valor: home?.hosts.length ?? null, etiqueta: 'organizadores' }
    ];
  });

  constructor() {
    this.store.cargarHome();
    void this.cargarRutas();
    inject(DestroyRef).onDestroy(() => {
      this.store.cancelar();
      this.controlador?.abort();
    });
  }

  reintentar(): void {
    this.store.cargarHome();
    void this.cargarRutas();
  }

  buscar(evento: Event): void {
    evento.preventDefault();
    const q = this.busqueda().trim();
    void this.router.navigate(['/shop'], { queryParams: q ? { q } : {} });
  }

  alEscribir(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  iniciales(nombre: string): string {
    return nombre.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
  }

  /** Clases del mosaico de categorías: la primera ocupa el doble. */
  claseCategoria(indice: number): string {
    return indice === 0 ? 'row-span-2 sm:col-span-2' : '';
  }

  private teselas(
    entidades: ShopEntidad[],
    parametro: string,
    perteneceA: (ruta: ShopRuta, id: string) => boolean
  ): Tesela[] {
    const rutas = this.rutas();
    return entidades.map((entidad) => ({
      _id: entidad._id,
      nombre: entidad.nombre,
      total: entidad.total ?? 0,
      imagen: entidad.imagen?.url
        ? entidad.imagen
        : rutas.find((ruta) => perteneceA(ruta, entidad._id) && ruta.coverImage?.url)?.coverImage ?? null,
      queryParams: { [parametro]: entidad.slug }
    }));
  }

  private async cargarRutas(): Promise<void> {
    this.controlador?.abort();
    const controlador = new AbortController();
    this.controlador = controlador;

    try {
      const respuesta = await this.api.listarRutas(
        { ...FILTROS_SHOP_POR_DEFECTO, limit: RUTAS_A_CARGAR },
        controlador.signal
      );
      if (controlador.signal.aborted) return;
      this.rutas.set(respuesta.data);
      this.totalRutas.set(respuesta.total);
    } catch {
      // Las rutas son un extra visual: si fallan, el home se muestra con lo que haya.
    }
  }
}

import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ComentarioEstadisticas } from '../../../../core/models/comment.model';
import { Dificultad, ETIQUETAS_DIFICULTAD } from '../../../../core/models/ruta.model';
import { ShopImagen } from '../../../../core/models/shop.model';
import { ShopStore } from '../../../../core/stores/shop.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { CartStore } from '../../../../core/stores/cart.store';
import { ChatContextService } from '../../../../core/services/chat-context.service';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { Estrellas } from '../../../../shared/components/estrellas/estrellas';
import {
  formatDuracion,
  formatFechaHora,
  formatKm,
  formatMetros,
  formatPrecio
} from '../../../../shared/utils/formatos';
import { Galeria } from '../../../../shared/components/galeria/galeria';
import { ShopRutaCard } from '../../components/shop-ruta-card/shop-ruta-card';
import { GuiaRutaComponent } from '../../components/guia-ruta/guia-ruta';
import { LikeButton } from '../../components/like-button/like-button';
import { ComentariosRuta } from '../../components/comentarios-ruta/comentarios-ruta';

/** Enlace de "Explora más": localización, organizador o categoría. */
interface Explorar {
  clave: string;
  tipo: string;
  nombre: string;
  imagen: ShopImagen | null;
  queryParams: Record<string, string>;
}

const CLASES_DIFICULTAD: Record<Dificultad, string> = {
  facil: 'bg-bosque-100 text-bosque-800',
  media: 'bg-amber-100 text-amber-800',
  dificil: 'bg-red-100 text-red-800'
};

const MAX_SALIDAS_VISIBLES = 4;

@Component({
  selector: 'app-shop-detail',
  imports: [
    RouterLink,
    Carousel,
    ShopRutaCard,
    Galeria,
    EmptyState,
    ErrorState,
    Estrellas,
    GuiaRutaComponent,
    LikeButton,
    ComentariosRuta
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-detail.html'
})
export class ShopDetail {
  readonly store = inject(ShopStore);
  readonly etiquetas = ETIQUETAS_DIFICULTAD;
  readonly clasesDificultad = CLASES_DIFICULTAD;
  readonly formatKm = formatKm;
  readonly formatMetros = formatMetros;
  readonly formatDuracion = formatDuracion;
  readonly formatFechaHora = formatFechaHora;
  readonly formatPrecio = formatPrecio;

  readonly opiniones = signal<ComentarioEstadisticas | null>(null);
  private readonly ruta = inject(ActivatedRoute);
  /** Si se llega con #opiniones (p. ej. desde "Mis opiniones"), se baja a ellas cuando cargan. */
  private irAOpinionesPendiente = false;
  readonly verTodasSalidas = signal(false);

  // --- Carrito ---
  private readonly auth = inject(AuthStore);
  private readonly carrito = inject(CartStore);
  private readonly router = inject(Router);
  readonly plazas = signal(1);
  readonly anadiendo = signal(false);

  /** Plazas de la salida elegida que ya están en el carrito. */
  readonly enCarrito = computed(() => {
    const salida = this.store.salidaSeleccionada();
    return salida ? this.carrito.cantidadDe(salida._id) : 0;
  });

  /** Plazas que aún se pueden añadir: stock menos lo que ya hay en el carrito. */
  readonly plazasLibres = computed(() => {
    const salida = this.store.salidaSeleccionada();
    return salida ? Math.max(0, salida.stock - this.enCarrito()) : 0;
  });

  readonly puedeAnadir = computed(() => {
    const salida = this.store.salidaSeleccionada();
    if (!salida || this.anadiendo()) return false;
    // Sin sesión el botón lleva al login.
    if (!this.auth.isAuthenticated()) return true;
    return salida.price.currency === 'EUR' && this.plazasLibres() >= this.plazas();
  });

  readonly textoBotonCarrito = computed(() => {
    const salida = this.store.salidaSeleccionada();
    if (!salida) return 'Elige una fecha';
    if (!this.auth.isAuthenticated()) return 'Inicia sesión para reservar';
    if (this.anadiendo()) return 'Añadiendo…';
    if (this.plazasLibres() === 0) return 'Ya tienes todas las plazas en el carrito';
    return `Añadir al carrito · ${formatPrecio(salida.price.amount * this.plazas(), salida.price.currency)}`;
  });

  readonly imagenes = computed(() => {
    const ruta = this.store.detalle();
    if (!ruta) return [];

    const galeria = ruta.images.filter((imagen) => imagen.url);
    if (galeria.length) return galeria;
    return ruta.coverImage.url ? [ruta.coverImage] : [];
  });

  readonly mediaTexto = computed(() => {
    const media = this.opiniones()?.media;
    return media == null ? '' : media.toFixed(1).replace('.', ',');
  });

  /** Salidas con plazas, de la más próxima a la más lejana. */
  readonly salidasOrdenadas = computed(() =>
    [...this.store.salidas()].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  );

  readonly salidasVisibles = computed(() =>
    this.verTodasSalidas() ? this.salidasOrdenadas() : this.salidasOrdenadas().slice(0, MAX_SALIDAS_VISIBLES)
  );

  readonly haySalidasOcultas = computed(() => this.salidasOrdenadas().length > MAX_SALIDAS_VISIBLES);

  readonly precioDesde = computed(() => {
    const conPlazas = this.store.salidas().filter((salida) => salida.stock > 0);
    if (!conPlazas.length) return null;
    return conPlazas.reduce((minima, salida) => (salida.price.amount < minima.price.amount ? salida : minima)).price;
  });

  readonly explorar = computed<Explorar[]>(() => {
    const ruta = this.store.detalle();
    if (!ruta) return [];

    const lista: Explorar[] = [];
    if (ruta.locationId) {
      lista.push({
        clave: `loc-${ruta.locationId._id}`,
        tipo: 'Zona',
        nombre: ruta.locationId.nombre,
        imagen: ruta.locationId.imagen ?? null,
        queryParams: { localizacion: ruta.locationId.slug }
      });
    }
    if (ruta.hostId) {
      lista.push({
        clave: `host-${ruta.hostId._id}`,
        tipo: 'Organiza',
        nombre: ruta.hostId.name,
        imagen: null,
        queryParams: { host: ruta.hostId.slug }
      });
    }
    for (const categoria of ruta.categoryIds) {
      lista.push({
        clave: `cat-${categoria._id}`,
        tipo: 'Categoría',
        nombre: categoria.name,
        imagen: categoria.imagen ?? null,
        queryParams: { categoria: categoria.slug }
      });
    }
    return lista;
  });

  constructor() {
    this.ruta.paramMap
      .pipe(map((params) => params.get('slug') ?? ''), takeUntilDestroyed())
      .subscribe((slug) => {
        this.irAOpinionesPendiente = this.ruta.snapshot.fragment === 'opiniones';
        this.opiniones.set(null);
        this.verTodasSalidas.set(false);
        this.store.cargarDetalle(slug);
      });

    // Al cambiar de fecha o de plazas libres (p. ej. tras añadir al carrito) el selector vuelve a 1.
    effect(() => {
      this.store.salidaSeleccionada();
      this.plazasLibres();
      this.plazas.set(1);
    });

    const contexto = inject(ChatContextService);
    effect(() => contexto.establecerRuta(this.store.detalle()?._id ?? null));

    inject(DestroyRef).onDestroy(() => {
      this.store.cancelar();
      contexto.establecerRuta(null);
    });
  }

  alCargarOpiniones(estadisticas: ComentarioEstadisticas): void {
    this.opiniones.set(estadisticas);
    if (this.irAOpinionesPendiente) {
      this.irAOpinionesPendiente = false;
      setTimeout(() => this.fijarEnOpiniones());
    }
  }

  /**
   * Salta a las opiniones y mantiene la posición mientras terminan de cargar las secciones de arriba
   * (guía, mapa, imágenes), que empujan el contenido. Se detiene si el usuario hace scroll o a los 4 s.
   * 'instant' anula el scroll-behavior: smooth global, que se corta mientras la página cambia de alto.
   */
  private fijarEnOpiniones(): void {
    const destino = document.getElementById('opiniones');
    if (!destino) return;

    const saltar = () => {
      const margen = parseFloat(getComputedStyle(destino).scrollMarginTop) || 0;
      window.scrollTo({ top: destino.getBoundingClientRect().top + window.scrollY - margen, behavior: 'instant' });
    };

    const observador = new ResizeObserver(() => saltar());
    const parar = () => {
      observador.disconnect();
      window.removeEventListener('wheel', parar);
      window.removeEventListener('touchstart', parar);
      window.removeEventListener('keydown', parar);
    };

    saltar();
    observador.observe(document.body);
    window.addEventListener('wheel', parar, { once: true, passive: true });
    window.addEventListener('touchstart', parar, { once: true, passive: true });
    window.addEventListener('keydown', parar, { once: true });
    setTimeout(parar, 4000);
  }

  seleccionar(salidaId: string): void {
    this.store.seleccionarSalida(salidaId);
  }

  cambiarPlazas(delta: number): void {
    this.plazas.update((actual) => Math.max(1, Math.min(actual + delta, this.plazasLibres())));
  }

  async anadirAlCarrito(): Promise<void> {
    const salida = this.store.salidaSeleccionada();
    if (!salida || !this.puedeAnadir()) return;

    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.anadiendo.set(true);
    try {
      await this.carrito.anadir(salida._id, this.plazas());
    } finally {
      this.anadiendo.set(false);
    }
  }

  irA(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  }
}

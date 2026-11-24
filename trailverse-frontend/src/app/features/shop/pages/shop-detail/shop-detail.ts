import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ComentarioEstadisticas } from '../../../../core/models/comment.model';
import { Dificultad, ETIQUETAS_DIFICULTAD } from '../../../../core/models/ruta.model';
import { ShopImagen } from '../../../../core/models/shop.model';
import { ShopStore } from '../../../../core/stores/shop.store';
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
  readonly verTodasSalidas = signal(false);

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
    inject(ActivatedRoute).paramMap
      .pipe(map((params) => params.get('slug') ?? ''), takeUntilDestroyed())
      .subscribe((slug) => {
        this.opiniones.set(null);
        this.verTodasSalidas.set(false);
        this.store.cargarDetalle(slug);
      });

    const contexto = inject(ChatContextService);
    effect(() => contexto.establecerRuta(this.store.detalle()?._id ?? null));

    inject(DestroyRef).onDestroy(() => {
      this.store.cancelar();
      contexto.establecerRuta(null);
    });
  }

  seleccionar(salidaId: string): void {
    this.store.seleccionarSalida(salidaId);
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

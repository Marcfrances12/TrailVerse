import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  untracked,
  viewChild
} from '@angular/core';
import * as L from 'leaflet';

export interface MarcadorMapa {
  nombre: string | null;
  etiqueta: string;
  categoria: string;
  lat: number;
  lng: number;
  distanciaM?: number;
}

const COLORES_CATEGORIA: Record<string, string> = {
  inicio: '#1f5b3a',
  restaurant: '#c2410c',
  lodging: '#7c3aed',
  transport: '#0369a1',
  parking: '#57534e'
};

// Mapa con teselas de OpenStreetMap (sin clave). Los nombres de OSM se pintan como texto, nunca como HTML.
@Component({
  selector: 'app-mapa-ruta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mapa-ruta.html'
})
export class MapaRuta {
  readonly inicio = input<{ lat: number; lng: number } | null>(null);
  readonly marcadores = input<MarcadorMapa[]>([]);

  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('contenedor');
  private mapa: L.Map | null = null;
  private capa: L.LayerGroup | null = null;

  constructor() {
    afterNextRender(() => {
      this.mapa = L.map(this.contenedor().nativeElement, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(this.mapa);
      this.capa = L.layerGroup().addTo(this.mapa);
      this.pintar();
    });

    effect(() => {
      this.inicio();
      this.marcadores();
      untracked(() => this.pintar());
    });

    inject(DestroyRef).onDestroy(() => this.mapa?.remove());
  }

  private pintar(): void {
    if (!this.mapa || !this.capa) return;

    this.capa.clearLayers();
    const puntos: L.LatLngExpression[] = [];

    const inicio = this.inicio();
    if (inicio) {
      L.circleMarker([inicio.lat, inicio.lng], {
        radius: 10,
        color: '#ffffff',
        weight: 3,
        fillColor: COLORES_CATEGORIA['inicio'],
        fillOpacity: 1
      })
        .bindPopup(this.contenidoPopup('Punto de inicio', 'Aquí empieza la ruta'))
        .addTo(this.capa);
      puntos.push([inicio.lat, inicio.lng]);
    }

    for (const marcador of this.marcadores()) {
      const subtitulo = [
        marcador.etiqueta,
        marcador.distanciaM !== undefined ? `a ${marcador.distanciaM} m` : null
      ]
        .filter(Boolean)
        .join(' · ');

      L.circleMarker([marcador.lat, marcador.lng], {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: COLORES_CATEGORIA[marcador.categoria] ?? '#57534e',
        fillOpacity: 1
      })
        .bindPopup(this.contenidoPopup(marcador.nombre ?? 'Sin nombre', subtitulo))
        .addTo(this.capa);
      puntos.push([marcador.lat, marcador.lng]);
    }

    if (puntos.length > 1) {
      this.mapa.fitBounds(L.latLngBounds(puntos), { padding: [24, 24], maxZoom: 15 });
    } else if (puntos.length === 1) {
      this.mapa.setView(puntos[0], 14);
    }
  }

  private contenidoPopup(titulo: string, subtitulo: string): HTMLElement {
    const contenedor = document.createElement('div');
    const negrita = document.createElement('strong');
    negrita.textContent = titulo;
    const texto = document.createElement('p');
    texto.textContent = subtitulo;
    contenedor.append(negrita, texto);
    return contenedor;
  }
}

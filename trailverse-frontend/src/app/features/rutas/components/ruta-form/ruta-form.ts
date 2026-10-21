import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RutasStore } from '../../../../core/stores/rutas.store';
import {
  DIFICULTADES,
  ESTADOS,
  Dificultad,
  EstadoRuta,
  Ruta,
  RutaInput,
  Location,
  Category,
  Host
} from '../../../../core/models/ruta.model';
import { environment } from '@environments/environment';
import { urlValidator } from '../../../../shared/utils/validators';
import { detallesDeError } from '../../../../shared/utils/errores';
import { capitalizar } from '../../../../shared/utils/formatos';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-ruta-form',
  imports: [ReactiveFormsModule, RouterLink, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ruta-form.html'
})
export class RutaForm {
  readonly store = inject(RutasStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly slugInput = input<string>('');

  private readonly params = toSignal(this.route.paramMap);
  readonly slug = computed(() => this.slugInput() || this.params()?.get('slug') || '');

  readonly esEdicion = computed(() => Boolean(this.slug()));
  readonly rutaOriginal = signal<Ruta | null>(null);
  readonly erroresServidor = signal<string[]>([]);

  readonly dificultades = DIFICULTADES;
  readonly estados = ESTADOS;
  readonly capitalizar = capitalizar;

  readonly locations = signal<Location[]>([]);
  readonly categorias = signal<Category[]>([]);
  readonly hosts = signal<Host[]>([]);
  readonly urlsImagenes = signal<string[]>(['']);

  readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    dificultad: ['', Validators.required],
    distanciaKm: [null as number | null, [Validators.required, Validators.min(0), Validators.max(500)]],
    desnivelM: [null as number | null, [Validators.required, Validators.min(0), Validators.max(10000)]],
    duracionHoras: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    locationId: ['', Validators.required],
    hostId: [''],
    categoryIds: [[] as string[]],
    circular: [false],
    status: ['published', Validators.required]
  });

  constructor() {
    this.cargarDatosAuxiliares();

    effect(() => {
      const slug = this.slug();
      if (slug && !this.rutaOriginal()) {
        this.store
          .cargarPorSlug(slug)
          .then(() => {
            const ruta = this.store.seleccionada();
            if (ruta) {
              this.rutaOriginal.set(ruta);
              this.rellenar(ruta);
            }
          })
          .catch(() => undefined);
      }
    });
  }

  private cargarDatosAuxiliares(): void {
    this.http.get<{ data: Location[] }>(`${environment.API_URL}/locations?isActive=true`)
      .subscribe({ next: (res) => this.locations.set(res.data.filter((l) => l.isActive)) });

    this.http.get<{ data: Category[] }>(`${environment.API_URL}/categories?type=ruta&isActive=true`)
      .subscribe({ next: (res) => this.categorias.set(res.data.filter((c) => c.isActive)) });

    this.http.get<{ data: Host[] }>(`${environment.API_URL}/hosts?isActive=true`)
      .subscribe({ next: (res) => this.hosts.set(res.data.filter((h) => h.isActive)) });
  }

  private rellenar(ruta: Ruta): void {
    const locId = typeof ruta.locationId === 'object' && ruta.locationId !== null ? ruta.locationId._id : ruta.locationId ?? '';
    const hostId = typeof ruta.hostId === 'object' && ruta.hostId !== null ? ruta.hostId._id : ruta.hostId ?? '';
    const catIds = ruta.categoryIds
      .map((c) => typeof c === 'object' && c !== null ? c._id : c)
      .filter(Boolean);

    this.formulario.patchValue({
      nombre: ruta.nombre,
      descripcion: ruta.descripcion,
      dificultad: ruta.dificultad,
      distanciaKm: ruta.distanciaKm,
      desnivelM: ruta.desnivelM,
      duracionHoras: ruta.duracionHoras,
      locationId: locId,
      hostId,
      categoryIds: catIds,
      circular: ruta.circular,
      status: ruta.status
    });

    const urls =
      ruta.images && ruta.images.length > 0
        ? ruta.images.map((imagen) => imagen.url)
        : ruta.coverImage?.url
          ? [ruta.coverImage.url]
          : [''];
    this.urlsImagenes.set(urls);
  }

  agregarImagen(): void {
    this.urlsImagenes.update((urls) => [...urls, '']);
  }

  eliminarImagen(indice: number): void {
    this.urlsImagenes.update((urls) => urls.filter((_, i) => i !== indice));
  }

  actualizarUrl(indice: number, valor: string): void {
    this.urlsImagenes.update((urls) => urls.map((u, i) => (i === indice ? valor : u)));
  }

  mostrarError(campo: string): string | null {
    const control = this.formulario.get(campo);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('min')) return `Mínimo ${control.getError('min').min}.`;
    if (control.hasError('max')) return `Máximo ${control.getError('max').max}.`;
    if (control.hasError('urlInvalida')) return 'URL no válida.';
    if (control.hasError('servidor')) return control.getError('servidor');
    return 'Valor no válido.';
  }

  etiquetaEstado(estado: EstadoRuta): string {
    switch (estado) {
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivada';
      default: return 'Publicada';
    }
  }

  async guardar(): Promise<void> {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);
    if (this.formulario.invalid) return;

    const valores = this.formulario.getRawValue();
    const imagenes = this.urlsImagenes().filter((u) => u.trim() !== '');

    const datos: RutaInput = {
      nombre: String(valores.nombre ?? '').trim(),
      descripcion: String(valores.descripcion ?? '').trim(),
      dificultad: (valores.dificultad as Dificultad) ?? 'facil',
      distanciaKm: Number(valores.distanciaKm),
      desnivelM: Number(valores.desnivelM),
      duracionHoras: Number(valores.duracionHoras),
      locationId: String(valores.locationId ?? ''),
      hostId: valores.hostId ? String(valores.hostId) : null,
      categoryIds: valores.categoryIds as string[],
      circular: Boolean(valores.circular),
      images: imagenes.map((url) => ({ url, alt: '' })),
      status: (valores.status as EstadoRuta) ?? 'published'
    };

    try {
      let ruta: Ruta;
      if (this.esEdicion()) {
        const original = this.rutaOriginal();
        if (!original) return;
        ruta = await this.store.actualizar(original._id, datos);
      } else {
        ruta = await this.store.crear(datos);
      }
      this.router.navigate(['/rutas', ruta.slug]);
    } catch (error) {
      this.aplicarErroresServidor(error);
    }
  }

  private aplicarErroresServidor(error: unknown): void {
    const mensajes: string[] = [];
    for (const detalle of detallesDeError(error)) {
      const control = this.formulario.get(detalle.campo);
      if (detalle.campo && control) {
        control.setErrors({ servidor: detalle.mensaje });
      } else {
        mensajes.push(detalle.mensaje);
      }
    }
    this.erroresServidor.set(mensajes);
  }
}

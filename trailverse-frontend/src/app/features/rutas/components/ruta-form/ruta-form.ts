import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  DIFICULTADES,
  ESTADOS,
  Dificultad,
  EstadoRuta,
  Ruta,
  RutaInput
} from '../../../../core/models/ruta.model';
import { Location } from '../../../../core/models/location.model';
import { Category } from '../../../../core/models/category.model';
import { Host } from '../../../../core/models/host.model';
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
  private readonly fb = inject(FormBuilder);

  readonly ruta = input<Ruta | null>(null);
  readonly locations = input<Location[]>([]);
  readonly categorias = input<Category[]>([]);
  readonly hosts = input<Host[]>([]);
  readonly esEdicion = input(false);
  readonly cargando = input(false);
  readonly enviando = input(false);
  readonly errorCarga = input<string | null>(null);
  readonly errorServidor = input<unknown>(null);

  readonly guardar = output<RutaInput>();

  readonly erroresServidor = signal<string[]>([]);

  readonly dificultades = DIFICULTADES;
  readonly estados = ESTADOS;
  readonly capitalizar = capitalizar;

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
    effect(() => {
      const ruta = this.ruta();
      if (ruta) this.rellenar(ruta);
    });

    effect(() => {
      const error = this.errorServidor();
      if (error) this.aplicarErroresServidor(error);
    });
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

  enviar(): void {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);
    if (this.formulario.invalid) return;

    const valores = this.formulario.getRawValue();
    const imagenes = this.urlsImagenes().filter((u) => u.trim() !== '');

    this.guardar.emit({
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
    });
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

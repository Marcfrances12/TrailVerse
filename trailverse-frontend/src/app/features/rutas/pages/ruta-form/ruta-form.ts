import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RutasStore } from '../../../../core/stores/rutas.store';
import {
  DIFICULTADES,
  ESTADOS,
  Dificultad,
  EstadoRuta,
  Ruta,
  RutaInput
} from '../../../../core/models/ruta.model';
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

  private readonly params = toSignal(this.route.paramMap);
  private readonly slug = computed(() => this.params()?.get('slug') ?? null);

  readonly esEdicion = computed(() => Boolean(this.slug()));
  readonly rutaOriginal = signal<Ruta | null>(null);
  readonly erroresServidor = signal<string[]>([]);

  readonly dificultades = DIFICULTADES;
  readonly estados = ESTADOS;

  readonly capitalizar = capitalizar;

  etiquetaEstado(estado: EstadoRuta): string {
    switch (estado) {
      case 'draft':
        return 'Borrador';
      case 'archived':
        return 'Archivada';
      default:
        return 'Publicada';
    }
  }

  readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    dificultad: ['', Validators.required],
    distanciaKm: [null as number | null, [Validators.required, Validators.min(0), Validators.max(500)]],
    desnivelM: [null as number | null, [Validators.required, Validators.min(0), Validators.max(10000)]],
    duracionHoras: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    locationId: ['', Validators.required],
    circular: [false],
    coverImageUrl: ['', [urlValidator, Validators.maxLength(500)]],
    status: ['published', Validators.required]
  });

  constructor() {
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

  private rellenar(ruta: Ruta): void {
    this.formulario.patchValue({
      nombre: ruta.nombre,
      descripcion: ruta.descripcion,
      dificultad: ruta.dificultad,
      distanciaKm: ruta.distanciaKm,
      desnivelM: ruta.desnivelM,
      duracionHoras: ruta.duracionHoras,
      locationId: typeof ruta.locationId === 'object' && ruta.locationId !== null ? ruta.locationId._id : ruta.locationId ?? '',
      circular: ruta.circular,
      coverImageUrl: ruta.coverImage?.url ?? '',
      status: ruta.status
    });
  }

  mostrarError(campo: string): string | null {
    const control = this.formulario.get(campo);

    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('minlength')) {
      return `Debe tener al menos ${control.getError('minlength').requiredLength} caracteres.`;
    }
    if (control.hasError('maxlength')) {
      return `No puede superar los ${control.getError('maxlength').requiredLength} caracteres.`;
    }
    if (control.hasError('min')) {
      return `El valor mínimo es ${control.getError('min').min}.`;
    }
    if (control.hasError('max')) {
      return `El valor máximo es ${control.getError('max').max}.`;
    }
    if (control.hasError('urlInvalida')) return 'Introduce una URL http(s) válida.';
    if (control.hasError('servidor')) return control.getError('servidor');

    return 'Valor no válido.';
  }

  async guardar(): Promise<void> {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);

    if (this.formulario.invalid) {
      return;
    }

    const valores = this.formulario.getRawValue();

    const datos: RutaInput = {
      nombre: String(valores.nombre ?? '').trim(),
      descripcion: String(valores.descripcion ?? '').trim(),
      dificultad: (valores.dificultad as Dificultad) ?? 'facil',
      distanciaKm: Number(valores.distanciaKm),
      desnivelM: Number(valores.desnivelM),
      duracionHoras: Number(valores.duracionHoras),
      locationId: String(valores.locationId ?? ''),
      circular: Boolean(valores.circular),
      coverImage: { url: String(valores.coverImageUrl ?? '').trim(), alt: '' },
      status: (valores.status as EstadoRuta) ?? 'published'
    };

    try {
      let ruta: Ruta;

      if (this.esEdicion()) {
        const original = this.rutaOriginal();
        if (!original) {
          return;
        }
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
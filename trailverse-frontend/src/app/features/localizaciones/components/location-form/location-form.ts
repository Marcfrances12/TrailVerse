import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LocationsStore } from '../../../../core/stores/locations.store';
import { Location, LocationInput } from '../../../../core/models/location.model';
import { LocationsApiService } from '../../../../core/services/locations-api.service';
import { environment } from '@environments/environment';
import { detallesDeError } from '../../../../shared/utils/errores';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-location-form',
  imports: [ReactiveFormsModule, RouterLink, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-form.html'
})
export class LocationForm {
  readonly store = inject(LocationsStore);
  private readonly api = inject(LocationsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly locationId = input<string>('');

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.locationId() || this.params()?.get('id') || '');
  readonly esEdicion = computed(() => Boolean(this.id()));

  readonly locationOriginal = signal<Location | null>(null);
  readonly erroresServidor = signal<string[]>([]);

  readonly formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    provincia: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    comunidad: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    pais: ['España', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    latitud: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitud: [null as number | null, [Validators.min(-180), Validators.max(180)]]
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (id && !this.locationOriginal()) {
        this.api.porId(id).subscribe({
          next: (res) => {
            const loc = res.data;
            this.locationOriginal.set(loc);
            this.formulario.patchValue({
              nombre: loc.nombre,
              provincia: loc.provincia,
              comunidad: loc.comunidad,
              pais: loc.pais,
              latitud: loc.geo?.coordinates?.[1] ?? null,
              longitud: loc.geo?.coordinates?.[0] ?? null
            });
          },
          error: () => undefined
        });
      }
    });
  }

  mostrarError(campo: string): string | null {
    const control = this.formulario.get(campo);
    if (!control || !control.touched || !control.errors) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('min')) return `Mínimo ${control.getError('min').min}.`;
    if (control.hasError('max')) return `Máximo ${control.getError('max').max}.`;
    if (control.hasError('servidor')) return control.getError('servidor');
    return 'Valor no válido.';
  }

  async guardar(): Promise<void> {
    this.formulario.markAllAsTouched();
    this.erroresServidor.set([]);
    if (this.formulario.invalid) return;

    const valores = this.formulario.getRawValue();
    const tieneCoordenadas = valores.latitud !== null && valores.longitud !== null;

    const datos: LocationInput = {
      nombre: String(valores.nombre ?? '').trim(),
      provincia: String(valores.provincia ?? '').trim(),
      comunidad: String(valores.comunidad ?? '').trim(),
      pais: String(valores.pais ?? '').trim()
    };

    if (tieneCoordenadas) {
      datos.geo = {
        type: 'Point',
        coordinates: [Number(valores.longitud), Number(valores.latitud)]
      };
    }

    try {
      if (this.esEdicion()) {
        await this.store.actualizar(this.id(), datos);
      } else {
        await this.store.crear(datos);
      }
      this.router.navigate(['/admin/localizaciones']);
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

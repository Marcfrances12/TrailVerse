import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Location, LocationInput } from '../../../../core/models/location.model';
import { detallesDeError } from '../../../../shared/utils/errores';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

@Component({
  selector: 'app-location-form',
  imports: [ReactiveFormsModule, RouterLink, ErrorState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-form.html'
})
export class LocationForm {
  private readonly fb = inject(FormBuilder);

  readonly location = input<Location | null>(null);
  readonly esEdicion = input(false);
  readonly cargando = input(false);
  readonly errorCarga = input<string | null>(null);
  readonly enviando = input(false);
  readonly errorServidor = input<unknown>(null);

  readonly guardar = output<LocationInput>();

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
      const loc = this.location();
      if (!loc) return;
      this.formulario.patchValue({
        nombre: loc.nombre,
        provincia: loc.provincia,
        comunidad: loc.comunidad,
        pais: loc.pais,
        latitud: loc.geo?.coordinates?.[1] ?? null,
        longitud: loc.geo?.coordinates?.[0] ?? null
      });
    });

    effect(() => {
      const error = this.errorServidor();
      if (error) this.aplicarErroresServidor(error);
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

  enviar(): void {
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

    this.guardar.emit(datos);
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

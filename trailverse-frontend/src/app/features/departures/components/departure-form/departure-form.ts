import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Departure,
  DepartureInput,
  DepartureStatus,
  ESTATUSES
} from '../../../../core/models/departure.model';
import { Ruta } from '../../../../core/models/ruta.model';
import { detallesDeError } from '../../../../shared/utils/errores';

@Component({
  selector: 'app-departure-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './departure-form.html'
})
export class DepartureForm {
  private readonly fb = inject(FormBuilder);

  readonly departure = input<Departure | null>(null);
  readonly rutas = input<Ruta[]>([]);
  readonly esEdicion = input(false);
  readonly enviando = input(false);
  readonly errorServidor = input<unknown>(null);

  readonly guardar = output<DepartureInput>();

  readonly erroresServidor = signal<string[]>([]);

  readonly statuses = ESTATUSES;
  readonly monedas = ['EUR', 'USD', 'GBP'];

  readonly formulario = this.fb.group({
    rutaId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: [''],
    meetingPoint: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    priceAmount: [null as number | null, [Validators.required, Validators.min(0)]],
    priceCurrency: ['EUR', Validators.required],
    capacity: [null as number | null, [Validators.required, Validators.min(1)]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    status: ['open' as DepartureStatus, Validators.required]
  });

  constructor() {
    effect(() => {
      const departure = this.departure();
      if (!departure) return;
      this.rellenar(departure);
    });

    effect(() => {
      const error = this.errorServidor();
      if (error) this.aplicarErroresServidor(error);
    });
  }

  private rellenar(d: Departure): void {
    const rutaId = typeof d.rutaId === 'object' && d.rutaId !== null ? d.rutaId._id : d.rutaId;
    this.formulario.patchValue({
      rutaId,
      startDate: this.aFechaInput(d.startDate),
      endDate: d.endDate ? this.aFechaInput(d.endDate) : '',
      meetingPoint: d.meetingPoint,
      priceAmount: d.price.amount,
      priceCurrency: d.price.currency,
      capacity: d.capacity,
      stock: d.stock,
      status: d.status
    });
  }

  private aFechaInput(valor: string | null): string {
    if (!valor) return '';
    const f = new Date(valor);
    if (isNaN(f.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}T${pad(f.getHours())}:${pad(f.getMinutes())}`;
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
    const datos: DepartureInput = {
      rutaId: String(valores.rutaId ?? ''),
      startDate: new Date(String(valores.startDate)).toISOString(),
      endDate: valores.endDate ? new Date(String(valores.endDate)).toISOString() : null,
      meetingPoint: String(valores.meetingPoint ?? '').trim(),
      price: {
        amount: Number(valores.priceAmount),
        currency: String(valores.priceCurrency ?? 'EUR')
      },
      capacity: Number(valores.capacity),
      stock: Number(valores.stock),
      status: valores.status as DepartureStatus
    };
    this.guardar.emit(datos);
  }

  private aplicarErroresServidor(error: unknown): void {
    const mensajes: string[] = [];
    for (const detalle of detallesDeError(error)) {
      const campo = this.campoDeError(detalle.campo);
      const control = campo ? this.formulario.get(campo) : null;
      if (campo && control) {
        control.setErrors({ servidor: detalle.mensaje });
      } else {
        mensajes.push(detalle.mensaje);
      }
    }
    this.erroresServidor.set(mensajes);
  }

  private campoDeError(campo: string): string {
    if (campo === 'price' || campo === 'price.amount') return 'priceAmount';
    return campo;
  }
}

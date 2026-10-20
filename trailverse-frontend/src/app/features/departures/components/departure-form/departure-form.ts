import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DeparturesStore } from '../../../../core/stores/departures.store';
import {
  Departure,
  DepartureInput,
  DepartureStatus,
  ESTATUSES
} from '../../../../core/models/departure.model';
import { DeparturesApiService } from '../../../../core/services/departures-api.service';
import { Ruta } from '../../../../core/models/ruta.model';
import { environment } from '@environments/environment';
import { detallesDeError } from '../../../../shared/utils/errores';

@Component({
  selector: 'app-departure-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './departure-form.html'
})
export class DepartureForm {
  readonly store = inject(DeparturesStore);
  private readonly api = inject(DeparturesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly departureId = input<string>('');

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.departureId() || this.params()?.get('id') || '');
  readonly esEdicion = computed(() => Boolean(this.id()));

  readonly departureOriginal = signal<Departure | null>(null);
  readonly erroresServidor = signal<string[]>([]);
  readonly rutas = signal<Ruta[]>([]);

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
    this.cargarRutas();

    effect(() => {
      const id = this.id();
      if (id && !this.departureOriginal()) {
        this.api.porId(id).subscribe({
          next: (res) => {
            const d = res.data;
            this.departureOriginal.set(d);
            this.rellenar(d);
          },
          error: () => undefined
        });
      }
    });
  }

  private cargarRutas(): void {
    this.http.get<{ data: Ruta[] }>(`${environment.API_URL}/rutas`).subscribe({
      next: (res) => this.rutas.set(res.data),
      error: () => undefined
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

  async guardar(): Promise<void> {
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

    try {
      if (this.esEdicion()) {
        await this.store.actualizar(this.id(), datos);
      } else {
        await this.store.crear(datos);
      }
      this.router.navigate(['/admin/departures']);
    } catch (error) {
      this.aplicarErroresServidor(error);
    }
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

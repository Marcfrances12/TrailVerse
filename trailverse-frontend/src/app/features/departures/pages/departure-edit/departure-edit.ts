import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DeparturesStore } from '../../../../core/stores/departures.store';
import { DeparturesApiService } from '../../../../core/services/departures-api.service';
import { RutasApiService } from '../../../../core/services/rutas-api.service';
import { Departure, DepartureInput } from '../../../../core/models/departure.model';
import { Ruta } from '../../../../core/models/ruta.model';
import { DepartureForm } from '../../components/departure-form/departure-form';

@Component({
  selector: 'app-departure-edit',
  imports: [DepartureForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-departure-form
      [esEdicion]="true"
      [departure]="departure()"
      [rutas]="rutas()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class DepartureEdit {
  readonly store = inject(DeparturesStore);
  private readonly api = inject(DeparturesApiService);
  private readonly rutasApi = inject(RutasApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.params()?.get('id') ?? '');

  readonly departure = signal<Departure | null>(null);
  readonly rutas = signal<Ruta[]>([]);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.api.porId(id).subscribe({
        next: (respuesta) => this.departure.set(respuesta.data),
        error: () => undefined
      });
    });

    this.rutasApi.listar({ isActive: true }).subscribe({
      next: (respuesta) => this.rutas.set(respuesta.data.filter((r) => r.isActive)),
      error: () => undefined
    });
  }

  async guardar(datos: DepartureInput): Promise<void> {
    try {
      await this.store.actualizar(this.id(), datos);
      this.router.navigate(['/admin/departures']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DeparturesStore } from '../../../../core/stores/departures.store';
import { RutasApiService } from '../../../../core/services/rutas-api.service';
import { Ruta } from '../../../../core/models/ruta.model';
import { DepartureInput } from '../../../../core/models/departure.model';
import { DepartureForm } from '../../components/departure-form/departure-form';

@Component({
  selector: 'app-departure-create',
  imports: [DepartureForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-departure-form
      [rutas]="rutas()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class DepartureCreate {
  readonly store = inject(DeparturesStore);
  private readonly rutasApi = inject(RutasApiService);
  private readonly router = inject(Router);

  readonly rutas = signal<Ruta[]>([]);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    this.rutasApi.listar({ isActive: true }).subscribe({
      next: (respuesta) => this.rutas.set(respuesta.data.filter((r) => r.isActive)),
      error: () => undefined
    });
  }

  async guardar(datos: DepartureInput): Promise<void> {
    try {
      await this.store.crear(datos);
      this.router.navigate(['/admin/departures']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

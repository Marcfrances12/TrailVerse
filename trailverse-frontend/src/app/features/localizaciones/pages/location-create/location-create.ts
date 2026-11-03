import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LocationsStore } from '../../../../core/stores/locations.store';
import { LocationInput } from '../../../../core/models/location.model';
import { LocationForm } from '../../components/location-form/location-form';

@Component({
  selector: 'app-location-create',
  imports: [LocationForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-location-form
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class LocationCreate {
  readonly store = inject(LocationsStore);
  private readonly router = inject(Router);

  readonly errorServidor = signal<unknown>(null);

  async guardar(datos: LocationInput): Promise<void> {
    try {
      await this.store.crear(datos);
      this.router.navigate(['/admin/localizaciones']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

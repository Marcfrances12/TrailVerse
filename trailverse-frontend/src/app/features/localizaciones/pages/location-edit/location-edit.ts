import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LocationsStore } from '../../../../core/stores/locations.store';
import { LocationsApiService } from '../../../../core/services/locations-api.service';
import { Location, LocationInput } from '../../../../core/models/location.model';
import { LocationForm } from '../../components/location-form/location-form';

@Component({
  selector: 'app-location-edit',
  imports: [LocationForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-location-form
      [esEdicion]="true"
      [location]="location()"
      [cargando]="cargando()"
      [errorCarga]="errorCarga()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class LocationEdit {
  readonly store = inject(LocationsStore);
  private readonly locationsApi = inject(LocationsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.params()?.get('id') ?? '');

  readonly location = signal<Location | null>(null);
  readonly cargando = signal(false);
  readonly errorCarga = signal<string | null>(null);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.cargando.set(true);
      this.errorCarga.set(null);
      this.locationsApi.porId(id).subscribe({
        next: (respuesta) => {
          this.location.set(respuesta.data);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.errorCarga.set('No se ha podido cargar la localización.');
        }
      });
    });
  }

  async guardar(datos: LocationInput): Promise<void> {
    try {
      await this.store.actualizar(this.id(), datos);
      this.router.navigate(['/admin/localizaciones']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

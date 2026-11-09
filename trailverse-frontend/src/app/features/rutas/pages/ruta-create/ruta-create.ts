import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RutasStore } from '../../../../core/stores/rutas.store';
import { LocationsApiService } from '../../../../core/services/locations-api.service';
import { CategoriesApiService } from '../../../../core/services/categories-api.service';
import { HostsApiService } from '../../../../core/services/hosts-api.service';
import { RutaInput } from '../../../../core/models/ruta.model';
import { Location } from '../../../../core/models/location.model';
import { Category } from '../../../../core/models/category.model';
import { Host } from '../../../../core/models/host.model';
import { RutaForm } from '../../components/ruta-form/ruta-form';

@Component({
  selector: 'app-ruta-create',
  imports: [RutaForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-ruta-form
      [locations]="locations()"
      [categorias]="categorias()"
      [hosts]="hosts()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class RutaCreate {
  readonly store = inject(RutasStore);
  private readonly locationsApi = inject(LocationsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly hostsApi = inject(HostsApiService);
  private readonly router = inject(Router);

  readonly locations = signal<Location[]>([]);
  readonly categorias = signal<Category[]>([]);
  readonly hosts = signal<Host[]>([]);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    this.locationsApi.listar().subscribe({
      next: (respuesta) => this.locations.set(respuesta.data.filter((l) => l.isActive)),
      error: () => undefined
    });

    this.categoriesApi.listar({ type: 'ruta' }).subscribe({
      next: (respuesta) => this.categorias.set(respuesta.data.filter((c) => c.isActive)),
      error: () => undefined
    });

    this.hostsApi.listar({ isActive: true }).subscribe({
      next: (respuesta) => this.hosts.set(respuesta.data.filter((h) => h.isActive)),
      error: () => undefined
    });
  }

  async guardar(datos: RutaInput): Promise<void> {
    try {
      const ruta = await this.store.crear(datos);
      this.router.navigate(['/shop', ruta.slug]);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

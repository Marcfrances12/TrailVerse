import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RutasStore } from '../../../../core/stores/rutas.store';
import { LocationsApiService } from '../../../../core/services/locations-api.service';
import { CategoriesApiService } from '../../../../core/services/categories-api.service';
import { HostsApiService } from '../../../../core/services/hosts-api.service';
import { Ruta, RutaInput } from '../../../../core/models/ruta.model';
import { Location } from '../../../../core/models/location.model';
import { Category } from '../../../../core/models/category.model';
import { Host } from '../../../../core/models/host.model';
import { RutaForm } from '../../components/ruta-form/ruta-form';

@Component({
  selector: 'app-ruta-edit',
  imports: [RutaForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-ruta-form
      [esEdicion]="true"
      [ruta]="ruta()"
      [locations]="locations()"
      [categorias]="categorias()"
      [hosts]="hosts()"
      [cargando]="store.cargando()"
      [enviando]="store.cargando()"
      [errorCarga]="store.error()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class RutaEdit {
  readonly store = inject(RutasStore);
  private readonly locationsApi = inject(LocationsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly hostsApi = inject(HostsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap);
  readonly slug = computed(() => this.params()?.get('slug') ?? '');

  readonly ruta = signal<Ruta | null>(null);
  readonly locations = signal<Location[]>([]);
  readonly categorias = signal<Category[]>([]);
  readonly hosts = signal<Host[]>([]);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (!slug) return;
      untracked(() => {
        this.store
          .cargarPorSlug(slug)
          .then((ruta) => this.ruta.set(ruta))
          .catch(() => undefined);
      });
    });

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
    const original = this.ruta();
    if (!original) return;
    try {
      const ruta = await this.store.actualizar(original._id, datos);
      this.router.navigate(['/shop', ruta.slug]);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

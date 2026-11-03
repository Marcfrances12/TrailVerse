import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RolesStore } from '../../../../core/stores/roles.store';
import { RolesApiService } from '../../../../core/services/roles-api.service';
import { Role, RoleInput } from '../../../../core/models/role.model';
import { RoleForm } from '../../components/role-form/role-form';

@Component({
  selector: 'app-role-edit',
  imports: [RoleForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-role-form
      [esEdicion]="true"
      [role]="role()"
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class RoleEdit {
  readonly store = inject(RolesStore);
  private readonly api = inject(RolesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly params = toSignal(this.route.paramMap);
  readonly id = computed(() => this.params()?.get('id') ?? '');

  readonly role = signal<Role | null>(null);
  readonly errorServidor = signal<unknown>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.api.porId(id).subscribe({
        next: (respuesta) => this.role.set(respuesta.data),
        error: () => undefined
      });
    });
  }

  async guardar(datos: RoleInput): Promise<void> {
    try {
      await this.store.actualizar(this.id(), datos);
      this.router.navigate(['/admin/roles']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

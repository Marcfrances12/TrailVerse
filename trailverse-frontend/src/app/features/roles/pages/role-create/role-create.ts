import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RolesStore } from '../../../../core/stores/roles.store';
import { RoleInput } from '../../../../core/models/role.model';
import { RoleForm } from '../../components/role-form/role-form';

@Component({
  selector: 'app-role-create',
  imports: [RoleForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-role-form
      [enviando]="store.cargando()"
      [errorServidor]="errorServidor()"
      (guardar)="guardar($event)" />
  `
})
export class RoleCreate {
  readonly store = inject(RolesStore);
  private readonly router = inject(Router);

  readonly errorServidor = signal<unknown>(null);

  async guardar(datos: RoleInput): Promise<void> {
    try {
      await this.store.crear(datos);
      this.router.navigate(['/admin/roles']);
    } catch (error) {
      this.errorServidor.set(error);
    }
  }
}

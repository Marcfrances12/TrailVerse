import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Role, PERMISOS } from '../../../../core/models/role.model';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-role-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-card.html'
})
export class RoleCard {
  readonly role = input.required<Role>();
  readonly papelera = input(false);
  readonly cambiarEstado = output<Role>();
  readonly eliminar = output<Role>();
  readonly restaurar = output<Role>();
  readonly borrarDefinitivo = output<Role>();
  readonly formatFecha = formatFecha;

  etiquetaPermiso(permiso: string): string {
    return PERMISOS.find((item) => item.valor === permiso)?.etiqueta ?? permiso;
  }
}

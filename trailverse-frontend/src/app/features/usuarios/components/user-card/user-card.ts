import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../../../core/models/user.model';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-user-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-card.html'
})
export class UserCard {
  readonly user = input.required<User>();
  readonly papelera = input(false);
  readonly cambiarEstado = output<User>();
  readonly eliminar = output<User>();
  readonly restaurar = output<User>();
  readonly borrarDefinitivo = output<User>();
  readonly formatFecha = formatFecha;

  nombreRol(user: User): string {
    const role = user.roleId;
    return typeof role === 'object' && role !== null ? role.name : '—';
  }
}

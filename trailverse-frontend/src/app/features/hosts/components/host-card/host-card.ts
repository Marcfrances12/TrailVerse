import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Host } from '../../../../core/models/host.model';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-host-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './host-card.html'
})
export class HostCard {
  readonly host = input.required<Host>();
  readonly papelera = input(false);
  readonly cambiarEstado = output<Host>();
  readonly eliminar = output<Host>();
  readonly restaurar = output<Host>();
  readonly borrarDefinitivo = output<Host>();
  readonly formatFecha = formatFecha;
}

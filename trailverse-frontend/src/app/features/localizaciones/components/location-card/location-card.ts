import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '../../../../core/models/location.model';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-location-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './location-card.html'
})
export class LocationCard {
  readonly location = input.required<Location>();
  readonly papelera = input(false);
  readonly cambiarEstado = output<Location>();
  readonly eliminar = output<Location>();
  readonly restaurar = output<Location>();
  readonly borrarDefinitivo = output<Location>();
  readonly formatFecha = formatFecha;
}

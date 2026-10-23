import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Departure, DepartureStatus, ESTATUSES } from '../../../../core/models/departure.model';
import { formatFecha } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-departure-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './departure-card.html'
})
export class DepartureCard {
  readonly departure = input.required<Departure>();
  readonly papelera = input(false);
  readonly cambiarEstado = output<Departure>();
  readonly eliminar = output<Departure>();
  readonly restaurar = output<Departure>();
  readonly borrarDefinitivo = output<Departure>();
  readonly formatFecha = formatFecha;

  nombreRuta(departure: Departure): string {
    const ruta = departure.rutaId;
    return typeof ruta === 'object' && ruta !== null ? ruta.nombre : '—';
  }

  etiquetaStatus(status: DepartureStatus): string {
    return ESTATUSES.find((item) => item.valor === status)?.etiqueta ?? status;
  }

  clasesStatus(status: DepartureStatus): string {
    switch (status) {
      case 'open':
        return 'bg-bosque-100 text-bosque-800';
      case 'full':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-red-100 text-red-700';
    }
  }
}

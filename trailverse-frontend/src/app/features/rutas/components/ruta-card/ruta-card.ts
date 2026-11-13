import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dificultad, ETIQUETAS_DIFICULTAD, Ruta } from '../../../../core/models/ruta.model';
import { ActionBotones } from '../../../../shared/components/action-botones/action-botones';
import { formatDuracion, formatKm, formatMetros } from '../../../../shared/utils/formatos';

@Component({
  selector: 'app-ruta-card',
  imports: [RouterLink, ActionBotones],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ruta-card.html'
})
export class RutaCard {
  readonly ruta = input.required<Ruta>();
  readonly activar = output<Ruta>();
  readonly eliminar = output<Ruta>();

  readonly etiquetasDificultad = ETIQUETAS_DIFICULTAD;
  readonly formatKm = formatKm;
  readonly formatMetros = formatMetros;
  readonly formatDuracion = formatDuracion;

  nombreUbicacion(): string {
    const loc = this.ruta().locationId;
    if (typeof loc === 'object' && loc !== null) {
      return `${loc.nombre} · ${loc.provincia}`;
    }
    return '';
  }

  clasesDificultad(dificultad: Dificultad): string {
    switch (dificultad) {
      case 'facil':
        return 'bg-bosque-100 text-bosque-800';
      case 'media':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  }
}

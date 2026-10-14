import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ruta, ETIQUETAS_DIFICULTAD, Dificultad } from '../../../core/models/ruta.model';
import { formatDuracion, formatKm, formatMetros } from '../../utils/formatos';
import { ActionBotones } from '../action-botones/action-botones';

@Component({
  selector: 'app-admin-table',
  imports: [RouterLink, ActionBotones],
  templateUrl: './admin-table.html'
})
export class AdminTable {
  readonly rutas = input<Ruta[]>([]);
  readonly cambiarEstado = output<Ruta>();
  readonly eliminar = output<Ruta>();

  readonly etiquetasDificultad = ETIQUETAS_DIFICULTAD;
  readonly formatKm = formatKm;
  readonly formatMetros = formatMetros;
  readonly formatDuracion = formatDuracion;

  nombreUbicacion(ruta: Ruta): string {
    const loc = ruta.locationId;
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

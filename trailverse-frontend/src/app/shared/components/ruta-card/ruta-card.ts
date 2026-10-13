import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ruta, ETIQUETAS_DIFICULTAD, Dificultad } from '../../../core/models/ruta.model';
import { formatDuracion, formatKm, formatMetros } from '../../utils/formatos';

@Component({
  selector: 'app-ruta-card',
  imports: [RouterLink],
  templateUrl: './ruta-card.html'
})
export class RutaCard {
  readonly ruta = input.required<Ruta>();

  readonly etiquetasDificultad = ETIQUETAS_DIFICULTAD;
  readonly formatKm = formatKm;
  readonly formatMetros = formatMetros;
  readonly formatDuracion = formatDuracion;

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
import { Component, input } from '@angular/core';
import { Ruta } from '../../../core/models/ruta.model';
import { RutaCard } from '../ruta-card/ruta-card';

@Component({
  selector: 'app-ruta-grid',
  imports: [RutaCard],
  templateUrl: './ruta-grid.html'
})
export class RutaGrid {
  readonly rutas = input<Ruta[]>([]);
}
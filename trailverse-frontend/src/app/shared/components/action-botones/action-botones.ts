import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ruta } from '../../../core/models/ruta.model';

@Component({
  selector: 'app-action-botones',
  imports: [RouterLink],
  templateUrl: './action-botones.html'
})
export class ActionBotones {
  readonly ruta = input.required<Ruta>();
  readonly activar = output<Ruta>();
  readonly eliminar = output<Ruta>();
}

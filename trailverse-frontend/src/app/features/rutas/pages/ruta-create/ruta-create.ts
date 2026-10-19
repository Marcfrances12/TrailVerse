import { Component } from '@angular/core';
import { RutaForm } from '../../components/ruta-form/ruta-form';

@Component({
  selector: 'app-ruta-create',
  imports: [RutaForm],
  template: '<app-ruta-form />'
})
export class RutaCreate {}

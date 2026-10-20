import { Component, input } from '@angular/core';
import { DepartureForm } from '../../components/departure-form/departure-form';

@Component({
  selector: 'app-departure-edit',
  imports: [DepartureForm],
  template: '<app-departure-form [departureId]="departureId()" />'
})
export class DepartureEdit {
  readonly departureId = input<string>('');
}

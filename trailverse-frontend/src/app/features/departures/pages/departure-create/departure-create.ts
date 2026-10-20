import { Component } from '@angular/core';
import { DepartureForm } from '../../components/departure-form/departure-form';

@Component({
  selector: 'app-departure-create',
  imports: [DepartureForm],
  template: '<app-departure-form />'
})
export class DepartureCreate {}

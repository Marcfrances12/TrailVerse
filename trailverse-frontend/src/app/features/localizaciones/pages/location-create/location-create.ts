import { Component } from '@angular/core';
import { LocationForm } from '../../components/location-form/location-form';

@Component({
  selector: 'app-location-create',
  imports: [LocationForm],
  template: '<app-location-form />'
})
export class LocationCreate {}

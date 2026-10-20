import { Component, input } from '@angular/core';
import { LocationForm } from '../../components/location-form/location-form';

@Component({
  selector: 'app-location-edit',
  imports: [LocationForm],
  template: '<app-location-form [locationId]="locationId()" />'
})
export class LocationEdit {
  readonly locationId = input<string>('');
}

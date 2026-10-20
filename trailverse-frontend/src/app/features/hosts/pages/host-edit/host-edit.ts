import { Component, input } from '@angular/core';
import { HostForm } from '../../components/host-form/host-form';

@Component({
  selector: 'app-host-edit',
  imports: [HostForm],
  template: '<app-host-form [hostId]="hostId()" />'
})
export class HostEdit {
  readonly hostId = input<string>('');
}

import { Component } from '@angular/core';
import { HostForm } from '../../components/host-form/host-form';

@Component({
  selector: 'app-host-create',
  imports: [HostForm],
  template: '<app-host-form />'
})
export class HostCreate {}

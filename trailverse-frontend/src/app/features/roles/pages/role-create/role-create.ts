import { Component } from '@angular/core';
import { RoleForm } from '../../components/role-form/role-form';

@Component({
  selector: 'app-role-create',
  imports: [RoleForm],
  template: '<app-role-form />'
})
export class RoleCreate {}

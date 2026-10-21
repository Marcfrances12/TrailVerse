import { Component, input } from '@angular/core';
import { RoleForm } from '../../components/role-form/role-form';

@Component({
  selector: 'app-role-edit',
  imports: [RoleForm],
  template: '<app-role-form [roleId]="roleId()" />'
})
export class RoleEdit {
  readonly roleId = input<string>('');
}

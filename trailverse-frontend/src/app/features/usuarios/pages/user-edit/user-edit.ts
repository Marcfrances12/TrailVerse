import { Component, input } from '@angular/core';
import { UserForm } from '../../components/user-form/user-form';

@Component({
  selector: 'app-user-edit',
  imports: [UserForm],
  template: '<app-user-form [userId]="userId()" />'
})
export class UserEdit {
  readonly userId = input<string>('');
}

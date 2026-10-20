import { Component } from '@angular/core';
import { UserForm } from '../../components/user-form/user-form';

@Component({
  selector: 'app-user-create',
  imports: [UserForm],
  template: '<app-user-form />'
})
export class UserCreate {}

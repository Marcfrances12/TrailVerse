import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoginBrand } from '../../components/login-brand/login-brand';
import { LoginForm } from '../../components/login-form/login-form';

@Component({
  selector: 'app-login',
  imports: [LoginBrand, LoginForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html'
})
export class Login {}

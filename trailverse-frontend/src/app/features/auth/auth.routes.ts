import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

export const AUTH_ROUTES: Routes = [
  { path: '', component: Login, title: 'Iniciar sesión · TrailVerse' }
];

export const REGISTER_ROUTES: Routes = [
  { path: '', component: Register, title: 'Crear cuenta · TrailVerse' }
];

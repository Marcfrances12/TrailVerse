import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';

export const INICIO_ROUTES: Routes = [
  { path: '', component: Inicio, title: 'Inicio · TrailVerse', data: { anchoCompleto: true } }
];

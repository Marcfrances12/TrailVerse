import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'rutas' },
  {
    path: 'rutas',
    loadChildren: () =>
      import('./features/rutas/rutas.routes').then((m) => m.RUTAS_ROUTES)
  },
  { path: '**', redirectTo: 'rutas' }
];
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'rutas' },
  {
    path: 'rutas',
    loadChildren: () =>
      import('./features/rutas/rutas.routes').then((m) => m.RUTAS_ROUTES)
  },
  {
    path: 'admin/localizaciones',
    loadChildren: () =>
      import('./features/localizaciones/localizaciones.routes').then((m) => m.LOCALIZACIONES_ROUTES)
  },
  {
    path: 'admin/categorias',
    loadChildren: () =>
      import('./features/categorias/categorias.routes').then((m) => m.CATEGORIAS_ROUTES)
  },
  {
    path: 'admin/hosts',
    loadChildren: () =>
      import('./features/hosts/hosts.routes').then((m) => m.HOSTS_ROUTES)
  },
  {
    path: 'admin/usuarios',
    loadChildren: () =>
      import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES)
  },
  {
    path: 'admin/departures',
    loadChildren: () =>
      import('./features/departures/departures.routes').then((m) => m.DEPARTURES_ROUTES)
  },
  { path: '**', redirectTo: 'rutas' }
];

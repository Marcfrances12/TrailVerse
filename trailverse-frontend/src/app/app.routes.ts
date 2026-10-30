import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'rutas' },
      {
        path: 'rutas',
        loadChildren: () =>
          import('./features/rutas/rutas.routes').then((m) => m.RUTAS_PUBLIC_ROUTES)
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/perfiles/perfiles.routes').then((m) => m.PERFILES_ROUTES)
      }
    ]
  },
  {
    path: 'admin',
    component: MainLayout,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'rutas' },
      {
        path: 'rutas',
        loadChildren: () =>
          import('./features/rutas/rutas.routes').then((m) => m.RUTAS_ADMIN_ROUTES)
      },
      {
        path: 'localizaciones',
        loadChildren: () =>
          import('./features/localizaciones/localizaciones.routes').then((m) => m.LOCALIZACIONES_ROUTES)
      },
      {
        path: 'categorias',
        loadChildren: () =>
          import('./features/categorias/categorias.routes').then((m) => m.CATEGORIAS_ROUTES)
      },
      {
        path: 'hosts',
        loadChildren: () =>
          import('./features/hosts/hosts.routes').then((m) => m.HOSTS_ROUTES)
      },
      {
        path: 'usuarios',
        loadChildren: () =>
          import('./features/usuarios/usuarios.routes').then((m) => m.USUARIOS_ROUTES)
      },
      {
        path: 'perfiles',
        loadChildren: () =>
          import('./features/perfiles/perfiles.routes').then((m) => m.PERFILES_ADMIN_ROUTES)
      },
      {
        path: 'departures',
        loadChildren: () =>
          import('./features/departures/departures.routes').then((m) => m.DEPARTURES_ROUTES)
      },
      {
        path: 'roles',
        loadChildren: () =>
          import('./features/roles/roles.routes').then((m) => m.ROLES_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'rutas' }
];

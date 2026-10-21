export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleInput {
  name: string;
  permissions?: string[];
}

export interface RolesFiltros {
  isActive?: boolean;
}

export const PERMISOS = [
  { valor: 'read', etiqueta: 'Leer' },
  { valor: 'manage_rutas', etiqueta: 'Gestionar rutas' },
  { valor: 'manage_departures', etiqueta: 'Gestionar departures' },
  { valor: 'manage_hosts', etiqueta: 'Gestionar hosts' },
  { valor: 'manage_categories', etiqueta: 'Gestionar categorías' },
  { valor: 'manage_locations', etiqueta: 'Gestionar localizaciones' },
  { valor: 'manage_users', etiqueta: 'Gestionar usuarios' },
  { valor: 'manage_roles', etiqueta: 'Gestionar roles' },
  { valor: 'all', etiqueta: 'Todos los permisos' }
] as const;

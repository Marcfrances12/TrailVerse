export interface Profile {
  _id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  bio: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateInput {
  name?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
}

export type EstadoPerfil = 'ok' | 'usuario-inactivo' | 'usuario-no-existe' | 'sin-perfil';

/** Fila del listado de admin: perfil más estado del usuario asociado. */
export interface PerfilAdmin {
  _id: string | null;
  userId: string;
  email: string | null;
  usuarioActivo: boolean | null;
  name: string | null;
  avatarUrl: string;
  bio: string;
  phone: string;
  estado: EstadoPerfil;
  created_at: string | null;
  updated_at: string | null;
}

export interface PerfilesFiltros {
  soloIncidencias?: boolean;
}

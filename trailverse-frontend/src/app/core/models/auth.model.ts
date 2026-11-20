export type RolName = 'ADMIN' | 'USER';

export interface AuthUser {
  _id: string;
  name: string | null;
  email: string;
  role: RolName;
}

export interface LoginRequest {
  /** Email o nombre de usuario. */
  identificador: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** Los tokens viajan en cookies HttpOnly (access_token y refresh_token); el cuerpo solo trae el usuario. */
export interface LoginResponse {
  user: AuthUser;
}

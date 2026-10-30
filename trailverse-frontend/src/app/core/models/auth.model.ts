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

/** El token viaja en una cookie HttpOnly; el cuerpo solo trae el usuario. */
export interface LoginResponse {
  user: AuthUser;
}

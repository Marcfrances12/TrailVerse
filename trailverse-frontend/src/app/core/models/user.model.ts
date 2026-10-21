export interface User {
  _id: string;
  name: string;
  email: string;
  roleId: string | { _id: string; name: string; permissions: string[] };
  isActive: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
}

export interface UsersFiltros {
  isActive?: boolean;
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

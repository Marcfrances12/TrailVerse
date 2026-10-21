export interface Host {
  _id: string;
  name: string;
  slug: string;
  bio: string;
  contactEmail: string;
  phone: string;
  userId: string | { _id: string; name: string; email: string };
  isActive: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HostInput {
  name: string;
  bio?: string;
  contactEmail: string;
  phone?: string;
  userId?: string | null;
}

export interface HostsFiltros {
  isActive?: boolean;
}

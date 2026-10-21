export type CategoryType = 'ruta';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
  isActive: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  type: CategoryType;
  parentId?: string | null;
}

export interface CategoriesFiltros {
  type?: CategoryType;
}

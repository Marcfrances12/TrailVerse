export type CategoryType = 'ruta' | 'producto' | 'evento';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
  isActive: boolean;
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

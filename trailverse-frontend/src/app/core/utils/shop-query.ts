import { Params } from '@angular/router';
import { Dificultad } from '../models/ruta.model';
import { ShopFiltros, SortValor } from '../models/shop.model';

export interface ParamsLike {
  get(clave: string): string | null;
}

export const LIMITE_SHOP = 12;

export const FILTROS_SHOP_POR_DEFECTO: ShopFiltros = {
  q: '',
  categoryId: [],
  categoryMode: 'any',
  hostId: '',
  locationId: '',
  dificultad: '',
  sort: '-created_at',
  page: 1,
  limit: LIMITE_SHOP
};

const DIFICULTADES: readonly Dificultad[] = ['facil', 'media', 'dificil'];

const ORDENES: readonly SortValor[] = [
  'nombre', '-nombre', 'created_at', '-created_at',
  'distanciaKm', '-distanciaKm', 'duracionHoras', '-duracionHoras'
];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugValido = (valor: string | null): string => {
  const slug = (valor ?? '').trim().toLowerCase();
  return SLUG.test(slug) ? slug : '';
};

const paginaDesde = (valor: string | null): number => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 ? numero : 1;
};

// Lee la URL y devuelve filtros válidos. Los valores no válidos vuelven a su valor por defecto.
export function filtrosDesdeParams(params: ParamsLike): ShopFiltros {
  const categoryId = (params.get('categoria') ?? '')
    .split(',')
    .map((slug) => slug.trim().toLowerCase())
    .filter((slug) => SLUG.test(slug))
    .slice(0, 10);

  const dificultad = params.get('dificultad') as Dificultad | null;
  const sort = params.get('sort') as SortValor | null;

  return {
    q: (params.get('q') ?? '').trim().slice(0, 100),
    categoryId,
    categoryMode: params.get('categoryMode') === 'all' ? 'all' : 'any',
    hostId: slugValido(params.get('host')),
    locationId: slugValido(params.get('localizacion')),
    dificultad: dificultad && DIFICULTADES.includes(dificultad) ? dificultad : '',
    sort: sort && ORDENES.includes(sort) ? sort : FILTROS_SHOP_POR_DEFECTO.sort,
    page: paginaDesde(params.get('page')),
    limit: LIMITE_SHOP
  };
}

// Parámetros que se envían a la API. Incluye siempre orden, página y límite.
export function parametrosApi(filtros: ShopFiltros): URLSearchParams {
  const params = new URLSearchParams({
    sort: filtros.sort,
    categoryMode: filtros.categoryMode,
    page: String(filtros.page),
    limit: String(filtros.limit)
  });

  if (filtros.q) params.set('q', filtros.q);
  if (filtros.categoryId.length) params.set('categoria', filtros.categoryId.join(','));
  if (filtros.hostId) params.set('host', filtros.hostId);
  if (filtros.locationId) params.set('localizacion', filtros.locationId);
  if (filtros.dificultad) params.set('dificultad', filtros.dificultad);

  return params;
}

// Query de la URL del navegador. Omite los valores por defecto para que la URL quede limpia.
export function queryDesdeFiltros(filtros: ShopFiltros): Params {
  const params: Params = {};

  if (filtros.q) params['q'] = filtros.q;
  if (filtros.categoryId.length) params['categoria'] = filtros.categoryId.join(',');
  if (filtros.categoryMode === 'all') params['categoryMode'] = 'all';
  if (filtros.hostId) params['host'] = filtros.hostId;
  if (filtros.locationId) params['localizacion'] = filtros.locationId;
  if (filtros.dificultad) params['dificultad'] = filtros.dificultad;
  if (filtros.sort !== FILTROS_SHOP_POR_DEFECTO.sort) params['sort'] = filtros.sort;
  if (filtros.page > 1) params['page'] = filtros.page;

  return params;
}

// Huella de los filtros: si no cambia, no hace falta volver a pedir la lista.
export function claveDeFiltros(filtros: ShopFiltros): string {
  return parametrosApi(filtros).toString();
}

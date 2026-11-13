import {
  FILTROS_SHOP_POR_DEFECTO,
  filtrosDesdeParams,
  parametrosApi,
  queryDesdeFiltros
} from './shop-query';

const params = (valores: Record<string, string>) => ({
  get: (clave: string): string | null => valores[clave] ?? null
});

describe('shop-query', () => {
  it('lee varias categorías por slug separadas por comas y descarta slugs no válidos', () => {
    const filtros = filtrosDesdeParams(params({ categoria: 'Montana,no valido,playa' }));

    expect(filtros.categoryId).toEqual(['montana', 'playa']);
  });

  it('lee host y localización por slug', () => {
    const filtros = filtrosDesdeParams(params({ host: 'juan-garcia', localizacion: 'sierra-norte' }));

    expect(filtros.hostId).toBe('juan-garcia');
    expect(filtros.locationId).toBe('sierra-norte');
  });

  it('vuelve a los valores por defecto ante parámetros no válidos', () => {
    const filtros = filtrosDesdeParams(params({
      dificultad: 'imposible',
      sort: 'password',
      page: '-3',
      categoryMode: 'raro',
      host: 'Juan Garcia'
    }));

    expect(filtros.dificultad).toBe('');
    expect(filtros.sort).toBe(FILTROS_SHOP_POR_DEFECTO.sort);
    expect(filtros.page).toBe(1);
    expect(filtros.categoryMode).toBe('any');
    expect(filtros.hostId).toBe('');
  });

  it('ignora los parámetros antiguos con IDs', () => {
    const filtros = filtrosDesdeParams(params({ categoryId: '67a000000000000000000001', hostId: '67a000000000000000000002' }));

    expect(filtros.categoryId).toEqual([]);
    expect(filtros.hostId).toBe('');
  });

  it('recorta la búsqueda a 100 caracteres sin espacios sobrantes', () => {
    const filtros = filtrosDesdeParams(params({ q: `  ${'a'.repeat(120)}  ` }));

    expect(filtros.q.length).toBe(100);
  });

  it('la query de la URL omite los valores por defecto', () => {
    const query = queryDesdeFiltros({ ...FILTROS_SHOP_POR_DEFECTO });

    expect(query).toEqual({});
  });

  it('la query de la URL usa slugs y conserva filtros, modo y página', () => {
    const query = queryDesdeFiltros({
      ...FILTROS_SHOP_POR_DEFECTO,
      q: 'sierra',
      categoryId: ['montana', 'playa'],
      hostId: 'juan-garcia',
      categoryMode: 'all',
      page: 3
    });

    expect(query).toEqual({
      q: 'sierra',
      categoria: 'montana,playa',
      host: 'juan-garcia',
      categoryMode: 'all',
      page: 3
    });
  });

  it('el rango de precio por defecto (0-50) no añade parámetros', () => {
    expect(queryDesdeFiltros({ ...FILTROS_SHOP_POR_DEFECTO })).toEqual({});
    expect(parametrosApi({ ...FILTROS_SHOP_POR_DEFECTO }).has('precioMin')).toBe(false);
    expect(parametrosApi({ ...FILTROS_SHOP_POR_DEFECTO }).has('precioMax')).toBe(false);
  });

  it('sin parámetros de precio el rango es 0-50 y no se envía filtro', () => {
    const filtros = filtrosDesdeParams(params({}));

    expect(filtros.precioMin).toBe(0);
    expect(filtros.precioMax).toBe(50);
    expect(parametrosApi(filtros).has('precioMin')).toBe(false);
    expect(parametrosApi(filtros).has('precioMax')).toBe(false);
  });

  it('lee el rango de precio de la URL y descarta valores fuera de 0-50', () => {
    const filtros = filtrosDesdeParams(params({ precioMin: '10', precioMax: '35' }));
    expect(filtros.precioMin).toBe(10);
    expect(filtros.precioMax).toBe(35);

    const invalidos = filtrosDesdeParams(params({ precioMin: '-4', precioMax: '90' }));
    expect(invalidos.precioMin).toBe(0);
    expect(invalidos.precioMax).toBe(50);
  });

  it('un rango de precio activo se envía a la API y a la URL', () => {
    const filtros = { ...FILTROS_SHOP_POR_DEFECTO, precioMin: 5, precioMax: 20 };

    expect(parametrosApi(filtros).get('precioMin')).toBe('5');
    expect(parametrosApi(filtros).get('precioMax')).toBe('20');
    expect(queryDesdeFiltros(filtros)).toEqual({ precioMin: 5, precioMax: 20 });
  });

  it('los parámetros de la API incluyen siempre página, límite y orden', () => {
    const api = parametrosApi({ ...FILTROS_SHOP_POR_DEFECTO, page: 2 });

    expect(api.get('page')).toBe('2');
    expect(api.get('limit')).toBe('12');
    expect(api.get('sort')).toBe('-created_at');
    expect(api.has('q')).toBe(false);
  });
});

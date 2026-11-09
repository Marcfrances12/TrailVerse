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

  it('los parámetros de la API incluyen siempre página, límite y orden', () => {
    const api = parametrosApi({ ...FILTROS_SHOP_POR_DEFECTO, page: 2 });

    expect(api.get('page')).toBe('2');
    expect(api.get('limit')).toBe('12');
    expect(api.get('sort')).toBe('-created_at');
    expect(api.has('q')).toBe(false);
  });
});

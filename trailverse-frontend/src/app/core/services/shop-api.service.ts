import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import {
  ShopFiltros,
  ShopFiltrosOpciones,
  ShopHome,
  ShopListaRespuesta,
  ShopRuta,
  ShopRutaDetalle,
  ShopSalida
} from '../models/shop.model';
import { parametrosApi } from '../utils/shop-query';

const MENSAJE_GENERICO = 'No se ha podido cargar la información.';

export class ShopApiError extends Error {
  constructor(mensaje: string, readonly status: number) {
    super(mensaje);
    this.name = 'ShopApiError';
  }
}

// Cliente público del shop. Usa fetch con AbortController para cancelar peticiones obsoletas.
@Injectable({ providedIn: 'root' })
export class ShopApiService {
  private readonly base = `${environment.API_URL}/shop`;

  buildUrl(filtros: ShopFiltros): string {
    return `${this.base}/rutas?${parametrosApi(filtros).toString()}`;
  }

  listarRutas(filtros: ShopFiltros, signal?: AbortSignal): Promise<ShopListaRespuesta> {
    return this.pedir<ShopListaRespuesta>(this.buildUrl(filtros), signal);
  }

  opciones(signal?: AbortSignal): Promise<{ ok: boolean; data: ShopFiltrosOpciones }> {
    return this.pedir(`${this.base}/filtros`, signal);
  }

  home(limite: number, signal?: AbortSignal): Promise<{ ok: boolean; data: ShopHome }> {
    return this.pedir(`${this.base}/home?limit=${limite}`, signal);
  }

  detalle(slug: string, signal?: AbortSignal): Promise<{ ok: boolean; data: ShopRutaDetalle }> {
    return this.pedir(`${this.base}/rutas/${encodeURIComponent(slug)}`, signal);
  }

  salidas(slug: string, signal?: AbortSignal): Promise<{ ok: boolean; total: number; data: ShopSalida[] }> {
    return this.pedir(`${this.base}/rutas/${encodeURIComponent(slug)}/departures`, signal);
  }

  relacionadas(slug: string, signal?: AbortSignal): Promise<{ ok: boolean; total: number; data: ShopRuta[] }> {
    return this.pedir(`${this.base}/rutas/${encodeURIComponent(slug)}/relacionadas`, signal);
  }

  private async pedir<T>(url: string, signal?: AbortSignal): Promise<T> {
    const tiempo = AbortSignal.timeout(environment.TIMEOUT_MS);
    const respuesta = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, tiempo]) : tiempo
    });

    const cuerpo = await respuesta.json().catch((error: unknown) => {
      if (respuesta.ok) throw error;
      return null;
    });

    if (!respuesta.ok) {
      throw new ShopApiError(cuerpo?.error ?? MENSAJE_GENERICO, respuesta.status);
    }

    return cuerpo as T;
  }
}

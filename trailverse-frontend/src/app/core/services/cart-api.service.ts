import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { RecursoRespuesta } from '../models/api-response';
import { Cart } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly api = inject(ApiService);

  obtener(): Observable<RecursoRespuesta<Cart>> {
    return this.api.get<RecursoRespuesta<Cart>>('/cart');
  }

  anadir(departureId: string, quantity = 1): Observable<RecursoRespuesta<Cart>> {
    return this.api.post<RecursoRespuesta<Cart>>('/cart/items', { departureId, quantity });
  }

  actualizar(departureId: string, quantity: number): Observable<RecursoRespuesta<Cart>> {
    return this.api.patch<RecursoRespuesta<Cart>>(this.item(departureId), { quantity });
  }

  quitar(departureId: string): Observable<RecursoRespuesta<Cart>> {
    return this.api.delete<RecursoRespuesta<Cart>>(this.item(departureId));
  }

  vaciar(): Observable<RecursoRespuesta<Cart>> {
    return this.api.delete<RecursoRespuesta<Cart>>('/cart');
  }

  private item(departureId: string): string {
    return `/cart/items/${encodeURIComponent(departureId)}`;
  }
}

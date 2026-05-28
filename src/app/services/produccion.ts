import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Produccion, FilterProduccionParams } from '../interfaces/produccion.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class ProduccionService {
  private apiUrl = `${environment.apiUrl}/produccion`;

  constructor(private http: HttpClient) {}

  getProducciones(
    params?: PaginationParams & Partial<FilterProduccionParams>
  ): Observable<PaginatedResponse<Produccion>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy !== undefined) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.order !== undefined) httpParams = httpParams.set('order', params.order);
      if (params.fecha !== undefined) httpParams = httpParams.set('fecha', params.fecha);
      if (params.lote !== undefined) httpParams = httpParams.set('lote', params.lote.toString());
    }

    return this.http.get<PaginatedResponse<Produccion>>(this.apiUrl, { params: httpParams });
  }

  createProduccion(produccion: {
    fecha: string;
    jumbo?: number;
    aaa?: number;
    aa?: number;
    a?: number;
    b?: number;
    c?: number;
    lote_id: number;
    creado_por: string;
  }): Observable<Produccion> {
    return this.http.post<Produccion>(this.apiUrl, produccion);
  }
}

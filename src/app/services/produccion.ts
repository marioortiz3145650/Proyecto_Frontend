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
      Object.keys(params).forEach(key => {
        const val = (params as any)[key];
        if (
          val !== undefined &&
          val !== null &&
          val !== '' &&
          val !== 'null' &&
          val !== 'undefined'
        ) {
          httpParams = httpParams.set(key, val.toString());
        }
      });
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

  updateProduccion(id: number, produccion: Partial<{
    fecha: string;
    jumbo?: number;
    aaa?: number;
    aa?: number;
    a?: number;
    b?: number;
    c?: number;
    lote_id: number;
    creado_por: string;
  }>): Observable<Produccion> {
    return this.http.patch<Produccion>(`${this.apiUrl}/${id}`, produccion);
  }

  deleteProduccion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

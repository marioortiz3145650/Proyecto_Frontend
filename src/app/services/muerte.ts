import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Muerte, FilterMuerteParams } from '../interfaces/muerte.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class MuerteService {
  private apiUrl = `${environment.apiUrl}/muertes`;

  constructor(private http: HttpClient) {}

  getMuertes(
    params?: PaginationParams & Partial<FilterMuerteParams>
  ): Observable<PaginatedResponse<Muerte>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy !== undefined) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.order !== undefined) httpParams = httpParams.set('order', params.order);
      if (params.fecha !== undefined) httpParams = httpParams.set('fecha', params.fecha);
      if (params.lote !== undefined) httpParams = httpParams.set('lote', params.lote.toString());
      if (params.causa !== undefined) httpParams = httpParams.set('causa', params.causa);
    }

    return this.http.get<PaginatedResponse<Muerte>>(this.apiUrl, { params: httpParams });
  }

  getMuerte(id: number): Observable<Muerte> {
    return this.http.get<Muerte>(`${this.apiUrl}/${id}`);
  }

  createMuerte(muerte: {
    fecha: string | Date;
    cantidad: number;
    causa: string;
    usuarioId: string;
    loteId: number;
  }): Observable<Muerte> {
    return this.http.post<Muerte>(this.apiUrl, muerte);
  }

  updateMuerte(id: number, muerte: {
    fecha?: string | Date;
    cantidad?: number;
    causa?: string;
    usuarioId?: string;
    loteId?: number;
  }): Observable<Muerte> {
    return this.http.patch<Muerte>(`${this.apiUrl}/${id}`, muerte);
  }

  deleteMuerte(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

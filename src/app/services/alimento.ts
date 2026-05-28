import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alimento, FilterAlimentoParams } from '../interfaces/alimento.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

@Injectable({
  providedIn: 'root',
})
export class AlimentoService {
  private apiUrl = `${environment.apiUrl}/alimentos`;

  constructor(private http: HttpClient) {}

  getAlimentos(
    params?: PaginationParams & Partial<FilterAlimentoParams>
  ): Observable<PaginatedResponse<Alimento>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy !== undefined) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.order !== undefined) httpParams = httpParams.set('order', params.order);
      if (params.nombre !== undefined) httpParams = httpParams.set('nombre', params.nombre);
      if (params.tipo_alimento !== undefined) httpParams = httpParams.set('tipo_alimento', params.tipo_alimento.toString());
      if (params.unidad_medida !== undefined) httpParams = httpParams.set('unidad_medida', params.unidad_medida.toString());
    }

    return this.http.get<PaginatedResponse<Alimento>>(this.apiUrl, { params: httpParams });
  }

  getAlimento(id: number): Observable<Alimento> {
    return this.http.get<Alimento>(`${this.apiUrl}/${id}`);
  }

  createAlimento(alimento: {
    nombre: string;
    tipo_alimento_id: number;
    unidad_medida_id: number;
    stock_actual: number;
    stock_minimo: number;
    precio_unitario: number;
  }): Observable<Alimento> {
    return this.http.post<Alimento>(this.apiUrl, alimento);
  }

  updateAlimento(id: number, alimento: {
    nombre?: string;
    tipo_alimento_id?: number;
    unidad_medida_id?: number;
    stock_actual?: number;
    stock_minimo?: number;
    precio_unitario?: number;
  }): Observable<Alimento> {
    return this.http.patch<Alimento>(`${this.apiUrl}/${id}`, alimento);
  }

  deleteAlimento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

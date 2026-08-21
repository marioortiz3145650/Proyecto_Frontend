import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { Lote } from '../interfaces/lote.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

export interface Tratamiento {
  uuid?: string;
  id_tratamiento: number;
  fecha: string | Date;
  tratamiento: string;
  lote_id: string;
  creado_por: any;
  lote?: Lote;
  creado_por_user?: { id_numeric: number; uuid: string; nombre: string };
}

export interface FilterTratamientoParams {
  lote?: string;
  fecha?: string;
  tratamiento?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TratamientoService {
  private apiUrl = `${environment.apiUrl}/tratamientos`;

  constructor(private http: HttpClient) {}

  getTratamientos(
    params?: PaginationParams & Partial<FilterTratamientoParams>
  ): Observable<PaginatedResponse<Tratamiento>> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        const val = (params as any)[key];
        if (val !== undefined && val !== null && val !== '') {
          httpParams = httpParams.set(key, val);
        }
      });
    }

    return this.http.get<PaginatedResponse<Tratamiento>>(this.apiUrl, { params: httpParams });
  }

  getTratamiento(uuid: string): Observable<Tratamiento> {
    return this.http.get<Tratamiento>(`${this.apiUrl}/${uuid}`);
  }

  createTratamiento(tratamiento: {
    fecha: string | Date;
    tratamiento: string;
    lote_id: string;
    creado_por: string;
  }): Observable<Tratamiento> {
    return this.http.post<Tratamiento>(this.apiUrl, tratamiento);
  }

  updateTratamiento(uuid: string, tratamiento: Partial<{
    fecha: string | Date;
    tratamiento: string;
    lote_id: string;
    creado_por: string;
  }>): Observable<Tratamiento> {
    return this.http.patch<Tratamiento>(`${this.apiUrl}/${uuid}`, tratamiento);
  }

  deleteTratamiento(uuid: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${uuid}`);
  }
}

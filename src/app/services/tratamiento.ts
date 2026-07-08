import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import { Lote } from '../interfaces/lote.interface';

export interface Tratamiento {
  uuid?: string;
  id_tratamiento: number;
  fecha: string | Date;
  tratamiento: string;
  lote_id: string;
  creado_por: string;
  lote?: Lote;
  creado_por_user?: { id_numeric: number; uuid: string; nombre: string };
}

@Injectable({
  providedIn: 'root',
})
export class TratamientoService {
  private apiUrl = `${environment.apiUrl}/tratamientos`;

  constructor(private http: HttpClient) {}

  getTratamientos(): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(this.apiUrl);
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

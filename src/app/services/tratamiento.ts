import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tratamiento {
  id_tratamiento: number;
  fecha: string | Date;
  tratamiento: string;
  lote_id: number;
  estado_id: number;
  creado_por: number;
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

  getTratamiento(id: number): Observable<Tratamiento> {
    return this.http.get<Tratamiento>(`${this.apiUrl}/${id}`);
  }

  createTratamiento(tratamiento: {
    fecha: string | Date;
    tratamiento: string;
    lote_id: number;
    estado_id: number;
    creado_por: number;
  }): Observable<Tratamiento> {
    return this.http.post<Tratamiento>(this.apiUrl, tratamiento);
  }

  updateTratamiento(id: number, tratamiento: Partial<{
    fecha: string | Date;
    tratamiento: string;
    lote_id: number;
    estado_id: number;
    creado_por: number;
  }>): Observable<Tratamiento> {
    return this.http.patch<Tratamiento>(`${this.apiUrl}/${id}`, tratamiento);
  }

  deleteTratamiento(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

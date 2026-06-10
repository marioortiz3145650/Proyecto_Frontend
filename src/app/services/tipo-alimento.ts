import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TipoAlimento } from '../interfaces/alimento.interface';

@Injectable({
  providedIn: 'root',
})
export class TipoAlimentoService {
  private apiUrl = `${environment.apiUrl}/tipo-de-alimentos`;

  constructor(private http: HttpClient) {}

  getTiposAlimento(): Observable<TipoAlimento[]> {
    return this.http.get<TipoAlimento[]>(this.apiUrl);
  }

  createTipoAlimento(tipo: { nombre: string }): Observable<TipoAlimento> {
    return this.http.post<TipoAlimento>(this.apiUrl, tipo);
  }

  updateTipoAlimento(id: number, tipo: Partial<{ nombre: string }>): Observable<TipoAlimento> {
    return this.http.patch<TipoAlimento>(`${this.apiUrl}/${id}`, tipo);
  }

  deleteTipoAlimento(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

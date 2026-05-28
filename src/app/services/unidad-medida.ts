import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UnidadMedida } from '../interfaces/alimento.interface';

@Injectable({
  providedIn: 'root',
})
export class UnidadMedidaService {
  private apiUrl = `${environment.apiUrl}/unidades-de-medida`;

  constructor(private http: HttpClient) {}

  getUnidadesMedida(): Observable<UnidadMedida[]> {
    return this.http.get<UnidadMedida[]>(this.apiUrl);
  }

  createUnidadMedida(unidad: { nombre: string; abreviatura: string }): Observable<UnidadMedida> {
    return this.http.post<UnidadMedida>(this.apiUrl, unidad);
  }
}

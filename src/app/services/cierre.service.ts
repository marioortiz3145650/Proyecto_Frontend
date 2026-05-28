import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cierre } from '../interfaces/cierre.interface';

@Injectable({
  providedIn: 'root',
})
export class CierreService {
  private apiUrl = `${environment.apiUrl}/lote-cierre`;

  constructor(private http: HttpClient) {}

  getCierres(): Observable<Cierre[]> {
    return this.http.get<Cierre[]>(this.apiUrl);
  }

  getCierre(id: number): Observable<Cierre> {
    return this.http.get<Cierre>(`${this.apiUrl}/${id}`);
  }

  createCierre(cierre: Partial<Cierre>): Observable<Cierre> {
    return this.http.post<Cierre>(this.apiUrl, cierre);
  }

  updateCierre(id: number, cierre: Partial<Cierre>): Observable<Cierre> {
    return this.http.patch<Cierre>(`${this.apiUrl}/${id}`, cierre);
  }

  deleteCierre(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

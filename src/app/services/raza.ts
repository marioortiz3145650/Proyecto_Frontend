import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Raza } from '../interfaces/raza.interface';

@Injectable({
  providedIn: 'root',
})
export class RazaService {
  private apiUrl = `${environment.apiUrl}/breed`;

  constructor(private http: HttpClient) {}

    getRazasAll(): Observable<Raza[]> {
    return this.http.get<Raza[]>(`${this.apiUrl}?all=true`);
  }

  getRazas(): Observable<Raza[]> {
    return this.http.get<Raza[]>(this.apiUrl);
  }

  getRaza(id: number): Observable<Raza> {
    return this.http.get<Raza>(`${this.apiUrl}/${id}`);
  }

  createRaza(raza: Partial<Raza>): Observable<Raza> {
    return this.http.post<Raza>(this.apiUrl, raza);
  }

  updateRaza(id: number, raza: Partial<Raza>): Observable<Raza> {
    return this.http.patch<Raza>(`${this.apiUrl}/${id}`, raza);
  }

  deleteRaza(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  restoreRaza(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/restore`, {});
  }
}

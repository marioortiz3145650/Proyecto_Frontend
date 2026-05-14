import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Galpon } from '../interfaces/galpon.interface';

@Injectable({
  providedIn: 'root'
})
export class GalponService {
  private apiUrl = `${environment.apiUrl}/galpones`;

  constructor(private http: HttpClient) {}

  getGalpones(): Observable<Galpon[]> {
    return this.http.get<Galpon[]>(this.apiUrl);
  }

  getGalpon(id: string): Observable<Galpon> {
    return this.http.get<Galpon>(`${this.apiUrl}/${id}`);
  }

  createGalpon(galpon: Partial<Galpon>): Observable<Galpon> {
    return this.http.post<Galpon>(this.apiUrl, galpon);
  }

  updateGalpon(id: string, galpon: Partial<Galpon>): Observable<Galpon> {
    return this.http.patch<Galpon>(`${this.apiUrl}/${id}`, galpon);
  }
}
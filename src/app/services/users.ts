import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../interfaces/usuario.interface';

export type { Usuario } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  getUser(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  createUser(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  updateUser(id: string, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  deactivateUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/activate`, {});
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FilterUsuarioParams, Usuario } from '../interfaces/usuario.interface';
import { PaginatedResponse, PaginationParams } from '../interfaces/pagination.interface';

export type { Usuario } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(
    params?: PaginationParams & Partial<FilterUsuarioParams>,
  ): Observable<PaginatedResponse<Usuario>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy !== undefined) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.order !== undefined) httpParams = httpParams.set('order', params.order);
      if (params.nombre !== undefined) httpParams = httpParams.set('nombre', params.nombre);
      if (params.correo !== undefined) httpParams = httpParams.set('correo', params.correo);
      if (params.nombre_usuario !== undefined) httpParams = httpParams.set('nombre_usuario', params.nombre_usuario);
      if (params.rol !== undefined) httpParams = httpParams.set('rol', params.rol.toString());
      if (params.activo !== undefined) httpParams = httpParams.set('activo', params.activo.toString());
      if (params.fecha_registro_inicio !== undefined) httpParams = httpParams.set('fecha_registro_inicio', params.fecha_registro_inicio);
      if (params.fecha_registro_fin !== undefined) httpParams = httpParams.set('fecha_registro_fin', params.fecha_registro_fin);
    }

    return this.http.get<PaginatedResponse<Usuario>>(this.apiUrl, { params: httpParams });
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

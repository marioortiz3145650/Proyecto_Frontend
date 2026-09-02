import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { catchError, tap, timeout } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

import { ToastService } from './toast.service';

interface LoginResponse {
  access_token: string;
}

interface JwtPayload {
  sub: string | number;
  username: string;
  rol: string;
  iat: number;
  exp: number;
  nombre?: string;
  correo?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'access_token';

  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/login`, { nombre_usuario: username, password })
      .pipe(
        timeout(8000),
        tap(() => this.toast.success('Sesión iniciada correctamente')),
        catchError(err => {
          this.toast.error('Credenciales inválidas. Verifica usuario o contraseña.');
          return throwError(() => err);
        })
      );
  }

  loginAsGuest(): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/visitante`, {})
      .pipe(
        timeout(8000),
        tap(() => this.toast.success('Acceso como visitante exitoso.')),
        catchError(err => {
          this.toast.error('No se pudo acceder como visitante.');
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.toast.success('Sesión cerrada correctamente');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = this.decodePayload(token);
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  getUser(): { id: string | number; username: string; rol: string; nombre?: string; correo?: string } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = this.decodePayload(token);
      return { 
        id: payload.sub, 
        username: payload.username, 
        rol: payload.rol || '',
        nombre: payload.nombre,
        correo: payload.correo
      };
    } catch {
      return null;
    }
  }

  getUserRole(): string {
    const user = this.getUser();
    return user?.rol || '';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'Administrador';
  }

  isAprendiz(): boolean {
    return this.getUserRole() === 'Aprendiz';
  }

  isVisitante(): boolean {
    return this.getUserRole() === 'Visitante';
  }

  canEdit(): boolean {
    return this.isAdmin();
  }

  canAccessUsers(): boolean {
    return this.isAdmin();
  }

  private decodePayload(token: string): JwtPayload {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }
}

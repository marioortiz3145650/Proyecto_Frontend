import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VisionService {
  private apiUrl = `${environment.apiUrl}/vision`;

  constructor(private http: HttpClient) {}

  startCamera(cameraIndex: number): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(`${this.apiUrl}/start`, { cameraIndex });
  }

  stopCamera(): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(`${this.apiUrl}/stop`, {});
  }
}

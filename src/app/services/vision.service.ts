import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VisionService {
  constructor(private http: HttpClient) {}

  startCamera(cameraIndex: number): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(
      `${environment.apiUrl}/vision/start`,
      { cameraIndex }
    );
  }

  stopCamera(): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(
      `${environment.apiUrl}/vision/stop`,
      {}
    );
  }

  // Le pregunta directo al script Python (puerto 5000), no al backend Nest,
  // porque es el que sabe qué cámaras físicas ve la máquina.
  listCameras(): Observable<{ cameras: { index: number; name: string }[] }> {
    return this.http.get<{ cameras: { index: number; name: string }[] }>(
      `http://localhost:5000/list_cameras`
    );
  }
}
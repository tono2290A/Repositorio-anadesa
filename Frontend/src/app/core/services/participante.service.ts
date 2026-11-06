import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Participante } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ParticipanteService {
  private apiUrl = environment.apiUrl + '/participantes';
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  ObtenerTodos(programa?: string): Observable<Participante[]> {
    let params = new HttpParams();
    if (programa) {
      params = params.set('programa', programa);
    }
    return this.http.get<Participante[]>(this.apiUrl, { params });
  }

  ObtenerPorId(id: number): Observable<Participante> {
    return this.http.get<Participante>(this.apiUrl + '/' + id);
  }

  ObtenerAsistencia(id: number): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + '/' + id + '/asistencia');
  }

  Crear(participante: any): Observable<Participante> {
    return this.http.post<Participante>(this.apiUrl, participante);
  }

  Actualizar(id: number, participante: any): Observable<Participante> {
    return this.http.put<Participante>(this.apiUrl + '/' + id, participante);
  }

  Eliminar(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + '/' + id);
  }

  SubirFotografia(id: number, archivo: File): Observable<{ ruta: string }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<{ ruta: string }>(this.apiUrl + '/' + id + '/fotografia', formData);
  }

  getFotoUrl(ruta?: string): string {
    if (!ruta) return '';
    if (ruta.startsWith('http')) return ruta;
    return this.baseUrl + ruta;
  }
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = environment.apiUrl + '/dashboard';

  constructor(private http: HttpClient) {}

  ObtenerEstadisticas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  /** Historial de actividad reciente para el panel lateral del dashboard. */
  ActividadReciente(limite: number = 15): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/actividad-reciente?limite=${limite}`);
  }

  /** Alertas / pendientes del sistema para el panel lateral del dashboard. */
  Pendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pendientes`);
  }
}

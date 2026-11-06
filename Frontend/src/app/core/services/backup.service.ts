import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackupItem {
  archivo: string;
  fecha: string;
  tamano_bytes: number;
  /** Manual | Automatico */
  tipo: string;
  /** false = el registro está en el historial pero el archivo ya no existe en disco */
  existe: boolean;
}

export interface BackupConfig {
  activo: boolean;
  /** horario | diario | semanal | mensual | anual */
  intervalo: string;
  /** HH:mm */
  hora: string;
  proxima_ejecucion: string | null;
  ultimo_respaldo: string | null;
  actualizado_en: string | null;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private apiUrl = `${environment.apiUrl}/backup`;

  constructor(private http: HttpClient) {}

  ObtenerTodos(): Observable<BackupItem[]> {
    return this.http.get<BackupItem[]>(this.apiUrl);
  }

  Crear(): Observable<BackupItem> {
    return this.http.post<BackupItem>(this.apiUrl, {});
  }

  /** Sube un .bak desde el equipo del usuario (recuperación si el servidor cae). */
  Cargar(archivo: File): Observable<BackupItem> {
    const formData = new FormData();
    formData.append('archivo', archivo, archivo.name);
    return this.http.post<BackupItem>(`${this.apiUrl}/cargar`, formData);
  }

  Descargar(nombre: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/archivo`, {
      params: { nombre },
      responseType: 'blob'
    });
  }

  Eliminar(nombre: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}`, { params: { nombre } });
  }

  Restaurar(nombre: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/restaurar`, null, { params: { nombre } });
  }

  ObtenerConfig(): Observable<BackupConfig> {
    return this.http.get<BackupConfig>(`${this.apiUrl}/configuracion`);
  }

  GuardarConfig(config: { activo: boolean; intervalo: string; hora: string }): Observable<BackupConfig> {
    return this.http.put<BackupConfig>(`${this.apiUrl}/configuracion`, config);
  }
}

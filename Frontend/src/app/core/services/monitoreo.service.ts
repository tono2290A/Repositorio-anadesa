import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Monitoreo {
  id_monitoreo: number;
  id_participante: number;
  participante: string;
  fecha: string;
  id_actividad: number;
  actividad: string;
  participacion: string;
  observaciones: string;
  estado: string;
  registrado_por: string;
  programa: string;
  tipo_monitoreo: string;
  id_grupo: number;
  grupo: string;
  id_programacion: number;
}

export interface ParticipanteMonitoreo {
  id_participante: number;
  nombre: string;
  programa: string;
  categoria: string;
  dpi: string;
  viene_de_asistencia: boolean;
}

export interface AreaMonitoreo {
  tipo: string;
  id: number;
  nombre: string;
  programa: string;
  cantidad: number;
}

export interface AreasMonitoreo {
  programas: AreaMonitoreo[];
  categorias: AreaMonitoreo[];
}

export interface GrupoMonitoreo {
  id_grupo: number;
  id_programa?: number | null;
  nombre: string;
  descripcion: string;
  programa: string;
  cantidad: number;
}

export interface ActividadMonitoreo {
  id_programacion: number;
  id_actividad: number;
  nombre: string;
  programa: string;
  fecha: string;
  lugar: string;
  estado: string;
  tipo_actividad: string;
  asignados: number;
}

export interface ResultadoMonitoreo {
  ok: boolean;
  mensaje: string;
  id: number;
  creados: number;
}

export interface CrearMonitoreoRequest {
  id_participante: number;
  fecha: string;
  id_actividad?: number | null;
  id_programacion?: number | null;
  participacion?: string | null;
  observaciones?: string | null;
  tipo_monitoreo?: string | null;
  id_grupo?: number | null;
}

export interface CrearLoteMonitoreoRequest {
  participantes: number[];
  fecha: string;
  id_actividad?: number | null;
  id_programacion?: number | null;
  participacion?: string | null;
  observaciones?: string | null;
  tipo_monitoreo?: string | null;
  id_grupo?: number | null;
}

export interface FiltrosParticipantes {
  id_programa?: number | null;
  id_categoria?: number | null;
  id_grupo?: number | null;
  id_programacion?: number | null;
}

/** Todas las llamadas del modulo Monitoreo van contra la API (sin datos locales). */
@Injectable({ providedIn: 'root' })
export class MonitoreoService {
  private apiUrl = environment.apiUrl + '/monitoreo';

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<Monitoreo[]> {
    return this.http.get<Monitoreo[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Monitoreo> {
    return this.http.get<Monitoreo>(`${this.apiUrl}/${id}`);
  }

  crear(data: CrearMonitoreoRequest): Observable<ResultadoMonitoreo> {
    return this.http.post<ResultadoMonitoreo>(this.apiUrl, data);
  }

  crearLote(data: CrearLoteMonitoreoRequest): Observable<ResultadoMonitoreo> {
    return this.http.post<ResultadoMonitoreo>(`${this.apiUrl}/lote`, data);
  }

  actualizar(id: number, data: CrearMonitoreoRequest): Observable<ResultadoMonitoreo> {
    return this.http.put<ResultadoMonitoreo>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<ResultadoMonitoreo> {
    return this.http.delete<ResultadoMonitoreo>(`${this.apiUrl}/${id}`);
  }

  participantes(filtros: FiltrosParticipantes = {}): Observable<ParticipanteMonitoreo[]> {
    let params = new HttpParams();
    if (filtros.id_programa) params = params.set('id_programa', filtros.id_programa);
    if (filtros.id_categoria) params = params.set('id_categoria', filtros.id_categoria);
    if (filtros.id_grupo) params = params.set('id_grupo', filtros.id_grupo);
    if (filtros.id_programacion) params = params.set('id_programacion', filtros.id_programacion);
    return this.http.get<ParticipanteMonitoreo[]>(`${this.apiUrl}/participantes`, { params });
  }

  areas(): Observable<AreasMonitoreo> {
    return this.http.get<AreasMonitoreo>(`${this.apiUrl}/areas`);
  }

  grupos(): Observable<GrupoMonitoreo[]> {
    return this.http.get<GrupoMonitoreo[]>(`${this.apiUrl}/grupos`);
  }

  actividades(): Observable<ActividadMonitoreo[]> {
    return this.http.get<ActividadMonitoreo[]>(`${this.apiUrl}/actividades`);
  }
}

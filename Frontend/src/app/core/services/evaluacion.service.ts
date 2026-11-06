import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParticipanteMonitoreo, GrupoMonitoreo, ActividadMonitoreo } from './monitoreo.service';

export interface DetalleEvaluacion {
  id_resultado: number;
  id_criterio: number;
  criterio: string;
  puntuacion?: number | null;
  resultado: string;
  observaciones: string;
}

export interface Evaluacion {
  id_evaluacion: number;
  id_participante: number;
  participante: string;
  fecha: string;
  programa: string;
  tipo_evaluacion: string;
  resultado_general: string;
  observaciones: string;
  estado: string;
  nivel?: number | null;
  nivel_texto: string;
  promedio: number;
  criterios: number;
  evaluado_por: string;
  id_grupo: number;
  grupo: string;
  id_programacion: number;
  actividad: string;
  origen?: string;
  detalle?: DetalleEvaluacion[];
}

export interface CriterioEvaluacion {
  id_criterio: number;
  nombre: string;
  descripcion: string;
  tipo_programa: string;
  puntuacion_maxima: number;
}

export interface ResultadoEvaluacion {
  ok: boolean;
  mensaje: string;
  id: number;
  creados: number;
}

export interface FilaLoteEvaluacion {
  id_participante: number;
  nivel?: number | null;
  resultado?: string | null;
  observaciones?: string | null;
}

export interface CrearEvaluacionRequest {
  id_participante: number;
  fecha: string;
  tipo_evaluacion?: string | null;
  id_programacion?: number | null;
  id_grupo?: number | null;
  nivel?: number | null;
  resultado?: string | null;
  observaciones?: string | null;
}

export interface CrearLoteEvaluacionRequest {
  fecha: string;
  participantes: FilaLoteEvaluacion[];
  tipo_evaluacion?: string | null;
  id_programacion?: number | null;
  id_grupo?: number | null;
}

export interface FiltrosParticipantes {
  id_programa?: number | null;
  id_categoria?: number | null;
  id_grupo?: number | null;
  id_programacion?: number | null;
}

export interface PermisosEvaluacion {
  modulo: string;
  alcance?: string | null;
  permisos: string[];
}

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private apiUrl = environment.apiUrl + '/evaluaciones';

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(this.apiUrl);
  }

  obtenerPorParticipante(idParticipante: number): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.apiUrl}/participante/${idParticipante}`);
  }

  obtenerPorId(id: number): Observable<Evaluacion> {
    return this.http.get<Evaluacion>(`${this.apiUrl}/${id}`);
  }

  permisos(): Observable<PermisosEvaluacion> {
    return this.http.get<PermisosEvaluacion>(`${this.apiUrl}/permisos`);
  }

  crear(data: CrearEvaluacionRequest): Observable<ResultadoEvaluacion> {
    return this.http.post<ResultadoEvaluacion>(this.apiUrl, data);
  }

  crearLote(data: CrearLoteEvaluacionRequest): Observable<ResultadoEvaluacion> {
    return this.http.post<ResultadoEvaluacion>(`${this.apiUrl}/lote`, data);
  }

  actualizar(id: number, data: CrearEvaluacionRequest): Observable<ResultadoEvaluacion> {
    return this.http.put<ResultadoEvaluacion>(`${this.apiUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<ResultadoEvaluacion> {
    return this.http.delete<ResultadoEvaluacion>(`${this.apiUrl}/${id}`);
  }

  participantes(filtros: FiltrosParticipantes = {}): Observable<ParticipanteMonitoreo[]> {
    let params = new HttpParams();
    if (filtros.id_programa) params = params.set('id_programa', filtros.id_programa);
    if (filtros.id_categoria) params = params.set('id_categoria', filtros.id_categoria);
    if (filtros.id_grupo) params = params.set('id_grupo', filtros.id_grupo);
    if (filtros.id_programacion) params = params.set('id_programacion', filtros.id_programacion);
    return this.http.get<ParticipanteMonitoreo[]>(`${this.apiUrl}/participantes`, { params });
  }

  grupos(): Observable<GrupoMonitoreo[]> {
    return this.http.get<GrupoMonitoreo[]>(`${this.apiUrl}/grupos`);
  }

  actividades(): Observable<ActividadMonitoreo[]> {
    return this.http.get<ActividadMonitoreo[]>(`${this.apiUrl}/actividades`);
  }

  criterios(): Observable<CriterioEvaluacion[]> {
    return this.http.get<CriterioEvaluacion[]>(`${this.apiUrl}/criterios`);
  }
}

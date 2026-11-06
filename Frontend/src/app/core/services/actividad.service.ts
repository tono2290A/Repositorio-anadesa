import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Actividad {
  id_actividad: number;
  id_programacion: number;
  id_programa: number;
  id_tipo_actividad: number;
  nombre: string;
  descripcion?: string;
  objetivo?: string;
  programa?: string;
  tipo_actividad?: string;
  fecha?: string;
  hora?: string;
  hora_fin?: string;
  lugar?: string;
  estado?: string;
  observaciones?: string;
  cantidad_planificada?: number;
  totalParticipantes?: number;
  responsable?: string;
  modalidad?: string;
  fecha_creacion: string;
  estado_activo: boolean;
}

export interface ParticipanteAsignado {
  id_participante: number;
  nombre: string;
  dpi?: string;
  telefono?: string;
  programa?: string;
  categoria?: string;
  presente: boolean;
}

export interface TipoActividad {
  id_tipo_actividad: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
}

export interface ProgramaItem {
  id_programa: number;
  nombre: string;
  tipo_programa?: string;
  estado: boolean;
}

export interface FacilitadorDisponible {
  id_usuario: number;
  nombre: string;
  usuario?: string;
  correo?: string;
  asignado: boolean;
}

export interface AsistenciaMarca {
  id_participante: number;
  presente: boolean;
  hora_registro?: string;
}

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private apiUrl = environment.apiUrl + '/actividades';

  constructor(private http: HttpClient) {}

  ObtenerTodas(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(this.apiUrl);
  }

  Crear(data: any): Observable<Actividad> {
    return this.http.post<Actividad>(this.apiUrl, data);
  }

  Actualizar(idActividad: number, idProgramacion: number, data: any): Observable<Actividad> {
    return this.http.put<Actividad>(`${this.apiUrl}/${idActividad}/${idProgramacion}`, data);
  }

  Eliminar(idActividad: number, idProgramacion: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${idActividad}/${idProgramacion}`);
  }

  ObtenerTipos(): Observable<TipoActividad[]> {
    return this.http.get<TipoActividad[]>(`${this.apiUrl}/tipos`);
  }

  ObtenerProgramas(): Observable<ProgramaItem[]> {
    return this.http.get<ProgramaItem[]>(`${this.apiUrl}/programas`);
  }

  ActualizarEstado(idProgramacion: number, estado: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/estado/${idProgramacion}`, { estado });
  }

  ObtenerParticipantesDisponibles(idProgramacion: number): Observable<ParticipanteAsignado[]> {
    return this.http.get<ParticipanteAsignado[]>(`${this.apiUrl}/participantes-disponibles/${idProgramacion}`);
  }

  AsignarParticipantes(idProgramacion: number, participantes: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignar-participantes/${idProgramacion}`, { participantes });
  }

  ObtenerFacilitadoresDisponibles(idProgramacion: number): Observable<FacilitadorDisponible[]> {
    return this.http.get<FacilitadorDisponible[]>(`${this.apiUrl}/facilitadores-disponibles/${idProgramacion}`);
  }

  AsignarFacilitadores(idProgramacion: number, usuarios: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignar-facilitadores/${idProgramacion}`, { usuarios });
  }

  ObtenerAsistencia(idProgramacion: number): Observable<AsistenciaMarca[]> {
    return this.http.get<AsistenciaMarca[]>(`${this.apiUrl}/asistencia/${idProgramacion}`);
  }

  MarcarAsistencia(idProgramacion: number, idParticipante: number, presente: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/asistencia/${idProgramacion}`, { id_participante: idParticipante, presente });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InscripcionAcademica {
  id_inscripcion: number;
  id_participante: number;
  id_grado: number;
  id_ciclo: number;
  fecha_inscripcion: string;
  estado: string;
  observaciones?: string;
  grado_nombre?: string;
  ciclo_anio?: string;
  participante_nombre?: string;
  promedios?: Promedio[];
}

export interface HistorialAcademico {
  id_historial: number;
  id_participante: number;
  id_grado: number;
  id_ciclo: number;
  promedio_final?: number;
  resultado?: string;
  observaciones?: string;
  fecha_registro: string;
  grado_nombre?: string;
  ciclo_anio?: string;
}

export interface Promedio {
  id_promedio: number;
  id_inscripcion: number;
  id_bloque: number;
  promedio: number;
  observaciones?: string;
  fecha_registro: string;
  bloque_nombre?: string;
}

export interface CicloEscolar {
  id_ciclo: number;
  anio: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: boolean;
}

export interface Grado {
  id_grado: number;
  nombre: string;
  nivel?: string;
  descripcion?: string;
  estado: boolean;
}

export interface BloqueAcademico {
  id_bloque: number;
  nombre: string;
  numero_bloque: number;
  descripcion?: string;
  estado: boolean;
}

@Injectable({ providedIn: 'root' })
export class AcademicoService {
  private apiUrl = environment.apiUrl + '/academico';

  constructor(private http: HttpClient) {}

  ObtenerInscripciones(idParticipante: number): Observable<InscripcionAcademica[]> {
    return this.http.get<InscripcionAcademica[]>(`${this.apiUrl}/inscripciones/${idParticipante}`);
  }

  CrearInscripcion(data: any): Observable<InscripcionAcademica> {
    return this.http.post<InscripcionAcademica>(`${this.apiUrl}/inscripciones`, data);
  }

  ObtenerHistorial(idParticipante: number): Observable<HistorialAcademico[]> {
    return this.http.get<HistorialAcademico[]>(`${this.apiUrl}/historial/${idParticipante}`);
  }

  CrearHistorial(data: any): Observable<HistorialAcademico> {
    return this.http.post<HistorialAcademico>(`${this.apiUrl}/historial`, data);
  }

  ObtenerPromedios(idInscripcion: number): Observable<Promedio[]> {
    return this.http.get<Promedio[]>(`${this.apiUrl}/promedios/${idInscripcion}`);
  }

  CrearPromedio(data: any): Observable<Promedio> {
    return this.http.post<Promedio>(`${this.apiUrl}/promedios`, data);
  }

  ObtenerCiclos(): Observable<CicloEscolar[]> {
    return this.http.get<CicloEscolar[]>(`${this.apiUrl}/ciclos`);
  }

  ObtenerGrados(): Observable<Grado[]> {
    return this.http.get<Grado[]>(`${this.apiUrl}/grados`);
  }

  ObtenerBloques(): Observable<BloqueAcademico[]> {
    return this.http.get<BloqueAcademico[]>(`${this.apiUrl}/bloques`);
  }

  EliminarInscripcion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/inscripciones/${id}`);
  }

  EliminarHistorial(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/historial/${id}`);
  }
}

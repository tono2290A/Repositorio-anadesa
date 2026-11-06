import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Grupo, CrearGrupoRequest, AsignarParticipanteGrupoRequest, GrupoParticipante, CatalogItem } from '../models/models';

@Injectable({ providedIn: 'root' })
export class GrupoService {
  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  ObtenerTodos(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(this.apiUrl);
  }

  ObtenerPorId(id: number): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.apiUrl}/${id}`);
  }

  Crear(grupo: CrearGrupoRequest): Observable<Grupo> {
    return this.http.post<Grupo>(this.apiUrl, grupo);
  }

  Actualizar(id: number, grupo: CrearGrupoRequest): Observable<Grupo> {
    return this.http.put<Grupo>(`${this.apiUrl}/${id}`, grupo);
  }

  Eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  AsignarParticipante(idGrupo: number, idParticipante: number): Observable<GrupoParticipante> {
    return this.http.post<GrupoParticipante>(`${this.apiUrl}/${idGrupo}/participantes`, { id_participante: idParticipante } as AsignarParticipanteGrupoRequest);
  }

  RemoverParticipante(idGrupoParticipante: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/participantes/${idGrupoParticipante}`);
  }

  ObtenerProgramas(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${environment.apiUrl}/catalog/programas`);
  }

  ObtenerParticipantes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/participantes`);
  }
}

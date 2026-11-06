import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Usuario, CrearUsuarioRequest, ActualizarUsuarioRequest,
  Rol, CrearRolRequest, ActualizarPermisosRequest,
  Modulo, Permiso, CatalogItem
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  ObtenerTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  ObtenerPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  Crear(request: CrearUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, request);
  }

  Actualizar(id: number, request: ActualizarUsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, request);
  }

  Eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class RolService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  ObtenerTodos(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.apiUrl);
  }

  ObtenerPorId(id: number): Observable<Rol> {
    return this.http.get<Rol>(`${this.apiUrl}/${id}`);
  }

  Crear(rol: CrearRolRequest): Observable<Rol> {
    return this.http.post<Rol>(this.apiUrl, rol);
  }

  Actualizar(id: number, rol: CrearRolRequest): Observable<Rol> {
    return this.http.put<Rol>(`${this.apiUrl}/${id}`, rol);
  }

  ActualizarPermisos(id: number, permisos: ActualizarPermisosRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/permisos`, permisos);
  }

  Eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  ObtenerModulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.apiUrl}/modulos`);
  }

  ObtenerPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}/permisos`);
  }
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private apiUrl = `${environment.apiUrl}/catalog`;

  constructor(private http: HttpClient) {}

  ObtenerTiposUsuario(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.apiUrl}/tipos-usuario`);
  }

  ObtenerProgramas(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.apiUrl}/programas`);
  }

  ObtenerCategorias(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.apiUrl}/categorias`);
  }

  ObtenerComunidades(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.apiUrl}/comunidades`);
  }

  ObtenerGrupos(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.apiUrl}/grupos`);
  }
}

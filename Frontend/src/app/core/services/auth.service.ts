import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest, Usuario } from '../models/models';
import { PermisoService } from './permiso.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUser: Usuario | null = null;

  constructor(private http: HttpClient, private permisoService: PermisoService) {
    const stored = localStorage.getItem('currentUser');
    if (stored) this.currentUser = JSON.parse(stored);
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.usuario));
        this.currentUser = response.usuario;
        // Los permisos pertenecen al usuario anterior: recargarlos.
        this.permisoService.limpiar();
      })
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, request);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.permisoService.limpiar();
    this.currentUser = null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): Usuario | null {
    return this.currentUser;
  }

  getRoles(): string[] {
    return this.currentUser?.roles?.map(r => r.nombre) || [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }
}

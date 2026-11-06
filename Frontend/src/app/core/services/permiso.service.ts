import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PermisoModulo {
  id_modulo: number;
  modulo: string;
  permisos: string[];
}

/**
 * Permisos del usuario autenticado por modulo.
 * Se obtienen desde la API (GET /api/auth/permisos); no se calculan en el cliente.
 */
@Injectable({ providedIn: 'root' })
export class PermisoService {
  private apiUrl = environment.apiUrl + '/auth/permisos';
  private cache: PermisoModulo[] = [];
  private cargado = false;

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('permisosModulos');
    const storedToken = localStorage.getItem('permisosModulosToken');
    const tokenActual = localStorage.getItem('token');
    if (stored && storedToken !== null && tokenActual && storedToken === tokenActual) {
      try {
        this.cache = JSON.parse(stored);
        this.cargado = true;
      } catch {
        this.borrarCache();
      }
    } else if (stored) {
      // Caché de otro usuario o sin sesión: descartar.
      this.borrarCache();
    }
  }

  /** Carga (o recarga) los permisos desde la API. */
  cargar(): Observable<PermisoModulo[]> {
    return this.http.get<PermisoModulo[]>(this.apiUrl).pipe(
      retry({ count: 2, delay: 600 }),
      tap(permisos => {
        const lista = permisos || [];
        // Si la API responde vacío por un fallo transitorio de la BD, NO
        // sobrescribir los permisos previos (evita que el menú desaparezca).
        if (lista.length > 0 || this.cache.length === 0) {
          this.cache = lista;
          localStorage.setItem('permisosModulos', JSON.stringify(this.cache));
          localStorage.setItem('permisosModulosToken', localStorage.getItem('token') || '');
        }
        this.cargado = true;
      }),
      catchError(() => {
        // Fallo transitorio: conservar los permisos previos (no borrar el caché)
        // para que el menú y los botones no desaparezcan.
        this.cargado = this.cache.length > 0;
        return of(this.cache);
      })
    );
  }

  limpiar(): void {
    this.cache = [];
    this.cargado = false;
    this.borrarCache();
  }

  private borrarCache(): void {
    localStorage.removeItem('permisosModulos');
    localStorage.removeItem('permisosModulosToken');
  }

  estaCargado(): boolean {
    return this.cargado;
  }

  todos(): PermisoModulo[] {
    return this.cache;
  }

  /** Permisos de un modulo concreto. */
  permisosDe(idModulo: number): string[] {
    return this.cache.find(m => m.id_modulo === idModulo)?.permisos || [];
  }

  /** true si el usuario tiene al menos uno de los permisos indicados. */
  puede(idModulo: number, ...permisos: string[]): boolean {
    const propios = this.permisosDe(idModulo);
    return permisos.some(p => propios.includes(p));
  }

  /** id_modulo -> permisos, para el menú lateral. */
  mapa(): Observable<Record<number, string[]>> {
    if (this.cargado) return of(this.mapaActual());
    return this.cargar().pipe(map(() => this.mapaActual()));
  }

  private mapaActual(): Record<number, string[]> {
    const r: Record<number, string[]> = {};
    this.cache.forEach(m => (r[m.id_modulo] = m.permisos));
    return r;
  }
}

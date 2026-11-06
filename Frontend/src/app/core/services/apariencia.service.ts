import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, take } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Apariencia {
  nombre_sistema: string;
  color_primario: string;
  color_acento: string;
  tamano_fuente: string;
  logo: string | null;
  imagen_login: string | null;
  actualizado_en?: string;
}

/** Tamaño de fuente raíz (afecta todo lo que usa rem). */
export const TAMANOS_FUENTE: Record<string, string> = {
  chica: '14px',
  mediana: '16px',
  grande: '18px'
};

@Injectable({ providedIn: 'root' })
export class AparienciaService {
  private apiUrl = `${environment.apiUrl}/configuracion/apariencia`;

  private readonly defecto: Apariencia = {
    nombre_sistema: 'ANADESA',
    color_primario: '#1E3278',
    color_acento: '#26781E',
    tamano_fuente: 'mediana',
    logo: null,
    imagen_login: null
  };

  private subject = new BehaviorSubject<Apariencia>(this.defecto);
  datos$ = this.subject.asObservable();

  constructor(private http: HttpClient) {}

  get datos(): Apariencia {
    return this.subject.value;
  }

  Obtener(): Observable<Apariencia> {
    return this.http.get<Apariencia>(this.apiUrl).pipe(take(1));
  }

  Guardar(apariencia: Apariencia): Observable<Apariencia> {
    return this.http.put<Apariencia>(this.apiUrl, apariencia).pipe(
      tap(datos => {
        this.subject.next(datos);
        this.aplicar(datos);
      })
    );
  }

  /**
   * Aplica la apariencia guardada en caliente (localStorage, antes de la
   * respuesta del servidor) y luego sincroniza con la API.
   */
  cargar() {
    try {
      const raw = localStorage.getItem('apariencia');
      if (raw) {
        const datos = { ...this.defecto, ...JSON.parse(raw) } as Apariencia;
        this.subject.next(datos);
        this.aplicar(datos);
      }
    } catch {
      /* sin localStorage se usa el aspecto por defecto */
    }

    this.Obtener().pipe(take(1)).subscribe({
      next: datos => {
        this.subject.next(datos);
        this.aplicar(datos);
      },
      error: () => { /* sin sesión o sin permiso: se conserva lo local */ }
    });
  }

  private aplicar(datos: Apariencia) {
    const raiz = document.documentElement.style;
    raiz.setProperty('--c-primario', datos.color_primario);
    raiz.setProperty('--c-acento', datos.color_acento);
    raiz.setProperty('--fuente-base', TAMANOS_FUENTE[datos.tamano_fuente] || TAMANOS_FUENTE['mediana']);
    if (datos.nombre_sistema) document.title = datos.nombre_sistema;
    try {
      localStorage.setItem('apariencia', JSON.stringify(datos));
    } catch {
      /* cuota excedida: se omite la copia local */
    }
  }
}

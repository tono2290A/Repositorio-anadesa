import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export type ProgramaClave = 'educacion' | 'mujeres';

export interface ProgramaTab {
  key: ProgramaClave;
  label: string;
  programa: string;
  color: string;
  icono: string;
}

/**
 * Alcance de programa por rol (aislamiento Educacion / Mujeres):
 *  - Facilitador de Educacion -> solo pestaña Educacion
 *  - Facilitador de Mujeres   -> solo pestaña Mujeres
 *  - Administrador / Coordinador -> ambas pestañas
 * Espejo del alcance del backend (Services/AlcancePrograma.cs).
 */
@Injectable({ providedIn: 'root' })
export class AlcanceService {
  constructor(private auth: AuthService) {}

  /** Clave de programa restringida por el rol, o null (ambos programas). */
  get alcance(): ProgramaClave | null {
    const roles = this.auth.getRoles();
    if (roles.some(r => r.includes('Administrador') || r.includes('Coordinador'))) return null;
    for (const rol of roles) {
      if (!rol.includes('Facilitador')) continue;
      if (rol.includes('Educaci')) return 'educacion';
      if (rol.includes('Mujer')) return 'mujeres';
    }
    return null;
  }

  /** Pestañas visibles para el rol. */
  get tabs(): ProgramaTab[] {
    const todas: ProgramaTab[] = [
      { key: 'educacion', label: 'Educación', programa: 'Educación', color: '#4B9CD3', icono: 'fa-graduation-cap' },
      { key: 'mujeres', label: 'Mujeres', programa: 'Mujeres', color: '#9333EA', icono: 'fa-venus' }
    ];
    return this.alcance ? todas.filter(t => t.key === this.alcance) : todas;
  }

  /** Pestaña inicial de las pantallas. */
  get inicial(): ProgramaClave {
    return this.alcance ?? 'educacion';
  }

  /** Etiqueta del chip de programa (Inicio y demas pantallas). */
  get etiqueta(): string {
    if (this.alcance === 'educacion') return 'Programa de Educación';
    if (this.alcance === 'mujeres') return 'Programa de Mujeres';
    return 'Ambos programas';
  }

  get color(): string {
    if (this.alcance === 'educacion') return '#4B9CD3';
    if (this.alcance === 'mujeres') return '#9333EA';
    return '#1E3278';
  }

  /** Traduce un nombre/tipo de programa ('Programa de Educación', 'Mujeres'...) a su clave. */
  claveDe(texto: string | null | undefined): ProgramaClave | null {
    if (!texto) return null;
    const t = texto.toLowerCase();
    if (t.includes('educac')) return 'educacion';
    if (t.includes('mujer')) return 'mujeres';
    return null;
  }

  /** True si el texto de programa pertenece a la clave indicada. */
  coincide(texto: string | null | undefined, clave: ProgramaClave): boolean {
    return this.claveDe(texto) === clave;
  }

  /** True si el rol puede ver/operar el programa indicado (false solo para facilitadores). */
  permite(clave: ProgramaClave): boolean {
    return !this.alcance || this.alcance === clave;
  }

  /** id_programa esperado para la clave (1 = Educación, 2 = Mujeres). */
  idDe(clave: ProgramaClave): number {
    return clave === 'educacion' ? 1 : 2;
  }
}

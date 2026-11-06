import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PermisoService } from '../services/permiso.service';

/** Orden de preferencia al redirigir cuando la ruta solicitada no está permitida. */
const FALLBACK_MODULOS = [7, 6, 5, 4, 3, 1];

function rutaDeModulo(idModulo: number): string {
  switch (idModulo) {
    case 1: return '/dashboard';
    case 3: return '/participantes';
    case 4: return '/registro-academico';
    case 5: return '/actividades';
    case 6: return '/monitoreo';
    case 7: return '/evaluacion';
    case 8: return '/reportes';
    case 9: return '/configuracion';
    default: return '/dashboard';
  }
}

/**
 * Guard de permisos por modulo (tabla rol_modulo_permisos).
 * Si el usuario no tiene el permiso se redirige al primer modulo que sí pueda
 * ver; si los permisos no se pueden determinar (fallo de API sin cache) deja
 * pasar y decide el backend con 403.
 */
export function permisoGuard(idModulo: number, permiso = 'Consultar'): CanActivateFn {
  return () => {
    const permisos = inject(PermisoService);
    const router = inject(Router);

    const decidir = (): boolean => {
      if (!permisos.estaCargado()) return true;
      if (permisos.puede(idModulo, permiso)) return true;
      const destino = FALLBACK_MODULOS.find(id => permisos.puede(id, 'Consultar'));
      router.navigate(destino !== undefined ? [rutaDeModulo(destino)] : ['/login']);
      return false;
    };

    if (permisos.estaCargado()) return decidir();

    return permisos.cargar().pipe(
      map(() => decidir()),
      catchError(() => of(true))
    );
  };
}

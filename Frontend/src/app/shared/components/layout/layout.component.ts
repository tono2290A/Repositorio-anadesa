import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription, fromEvent, take } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PermisoService } from '../../../core/services/permiso.service';
import { AparienciaService } from '../../../core/services/apariencia.service';
import { Usuario } from '../../../core/models/models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  currentUser: Usuario | null = null;
  toasts: { type: string; message: string }[] = [];
  tieneInicio = true;
  tieneParticipantes = true;
  tieneAcademico = true;
  tieneActividades = true;
  tieneConfiguracion = true;
  tieneMonitoreo = true;
  monitoreoAbierto = false;
  tieneEvaluacion = true;
  evaluacionAbierto = false;
  tieneReportes = true;
  esMovil = false;
  menuMovilAbierto = false;
  nombreSistema = 'ANADESA';
  logoUrl = '/LOGO_ANADESA.jpg';
  private subRuta?: Subscription;
  private subResize?: Subscription;
  private subApariencia?: Subscription;

  constructor(
    private authService: AuthService,
    private permisoService: PermisoService,
    private aparienciaService: AparienciaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.nombreSistema = this.aparienciaService.datos.nombre_sistema;
    this.logoUrl = this.aparienciaService.datos.logo || '/LOGO_ANADESA.jpg';
    this.subApariencia = this.aparienciaService.datos$.pipe(take(1)).subscribe(datos => {
      this.nombreSistema = datos.nombre_sistema;
      this.logoUrl = datos.logo || '/LOGO_ANADESA.jpg';
    });
    this.currentUser = this.authService.getCurrentUser();
    this.revisarMenus();
    this.permisoService.cargar().subscribe({
      next: () => this.revisarMenus(),
      error: () => this.revisarMenus()
    });
    this.detectarMovil();
    this.subResize = fromEvent(window, 'resize').subscribe(() => this.detectarMovil());
    this.monitoreoAbierto = this.router.url.startsWith('/monitoreo');
    this.evaluacionAbierto = this.router.url.startsWith('/evaluacion');
    this.subRuta = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        this.monitoreoAbierto = ev.urlAfterRedirects.startsWith('/monitoreo');
        this.evaluacionAbierto = ev.urlAfterRedirects.startsWith('/evaluacion');
        if (this.esMovil) this.menuMovilAbierto = false;
      }
    });
  }

  ngOnDestroy() {
    this.subRuta?.unsubscribe();
    this.subResize?.unsubscribe();
    this.subApariencia?.unsubscribe();
  }

  /** Pantallas de tablet/telefono: el menu lateral pasa a drawer deslizable. */
  private detectarMovil() {
    this.esMovil = window.innerWidth <= 992;
    if (!this.esMovil) this.menuMovilAbierto = false;
  }

  alternarMenuMovil() {
    this.menuMovilAbierto = !this.menuMovilAbierto;
  }

  cerrarMenuMovil() {
    this.menuMovilAbierto = false;
  }

  toggleMonitoreo() {
    this.monitoreoAbierto = !this.monitoreoAbierto;
  }

  toggleEvaluacion() {
    this.evaluacionAbierto = !this.evaluacionAbierto;
  }

  private revisarMenus() {
    if (!this.permisoService.estaCargado()) {
      // Sin datos aún (carga fallida o en curso): no ocultar el menú.
      return;
    }
    this.tieneInicio = this.permisoService.puede(1, 'Consultar');
    this.tieneParticipantes = this.permisoService.puede(3, 'Consultar');
    this.tieneAcademico = this.permisoService.puede(4, 'Consultar');
    this.tieneActividades = this.permisoService.puede(5, 'Consultar');
    this.tieneMonitoreo = this.permisoService.puede(6, 'Consultar');
    this.tieneEvaluacion = this.permisoService.puede(7, 'Consultar');
    this.tieneReportes = this.permisoService.puede(8, 'Consultar');
    this.tieneConfiguracion = this.permisoService.puede(9, 'Consultar');
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    const n = this.currentUser.primer_nombre?.[0] || '';
    const a = this.currentUser.primer_apellido?.[0] || '';
    return (n + a).toUpperCase();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  showToast(type: string, message: string) {
    this.toasts.push({ type, message });
    setTimeout(() => {
      this.toasts.shift();
    }, 4000);
  }
}

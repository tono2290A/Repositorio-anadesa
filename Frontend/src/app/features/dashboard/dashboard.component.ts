import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DashboardService } from '../../core/services/participante.service';
import { AlcanceService } from '../../core/services/alcance.service';
import { PermisoService } from '../../core/services/permiso.service';
import { AuthService } from '../../core/services/auth.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { PanelHistorialComponent } from '../../shared/components/panel-historial/panel-historial.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LayoutComponent, RouterModule, PanelHistorialComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: any = {};
  cards: any[] = [];
  modulos: any[] = [];

  constructor(
    private dashboardService: DashboardService,
    public alcanceService: AlcanceService,
    private permisoService: PermisoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.dashboardService.ObtenerEstadisticas().subscribe({
      next: (data: any) => {
        this.stats = data;
        const esAdmin = this.authService.hasRole('Administrador');
        this.cards = [
          { title: 'Participantes', value: data.totalParticipantes, icon: 'fa-users', color: '#1E3278', bg: '#EBF5FB' },
          { title: 'Monitoreos', value: data.totalMonitoreos, icon: 'fa-chart-line', color: '#0E6B23', bg: '#dcfce7' },
          { title: 'Evaluaciones', value: data.totalEvaluaciones, icon: 'fa-clipboard-check', color: '#F5A623', bg: '#fef3c7' },
          { title: 'Actividades', value: data.totalActividades, icon: 'fa-calendar-alt', color: '#F5A623', bg: '#FEF6E7' },
          ...(esAdmin ? [{ title: 'Usuarios', value: data.totalUsuarios, icon: 'fa-user-shield', color: '#9333EA', bg: '#f3e8ff' }] : []),
          { title: 'Grupos', value: data.totalGrupos, icon: 'fa-layer-group', color: '#4B9CD3', bg: '#EBF5FB' }
        ];
      }
    });

    this.permisoService.cargar().subscribe({
      next: () => {
        const todosModulos = [
          { id_modulo: 3, nombre: 'PARTICIPANTES', descripcion: 'Gestión de participantes registrados', icon: 'fa-users', gradient: 'linear-gradient(135deg, #1E3278 0%, #4B9CD3 100%)', ruta: '/participantes' },
          { id_modulo: 6, nombre: 'MONITOREO', descripcion: 'Seguimiento y control de actividades', icon: 'fa-chart-line', gradient: 'linear-gradient(135deg, #0E6B23 0%, #0E6B23 100%)', ruta: '/monitoreo' },
          { id_modulo: 7, nombre: 'EVALUACIONES', descripcion: 'Criterios y resultados de evaluación', icon: 'fa-clipboard-check', gradient: 'linear-gradient(135deg, #F5A623 0%, #F5A623 100%)', ruta: '/evaluaciones' },
          { id_modulo: 5, nombre: 'ACTIVIDADES', descripcion: 'Programación y facilitadores', icon: 'fa-calendar-alt', gradient: 'linear-gradient(135deg, #F5A623 0%, #F5A623 100%)', ruta: '/actividades' },
          { id_modulo: 4, nombre: 'REGISTRO ACADÉMICO', descripcion: 'Ciclos, grados e historial', icon: 'fa-graduation-cap', gradient: 'linear-gradient(135deg, #9333EA 0%, #A855F7 100%)', ruta: '/registro-academico' },
          { id_modulo: 8, nombre: 'REPORTES', descripcion: 'Informes y estadísticas', icon: 'fa-file-pdf', gradient: 'linear-gradient(135deg, #E11D48 0%, #FB7185 100%)', ruta: '/reportes' },
          { id_modulo: 9, nombre: 'CONFIGURACIÓN', descripcion: 'Usuarios, roles, permisos y ajustes', icon: 'fa-cog', gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)', ruta: '/configuracion' }
        ];

        this.modulos = todosModulos.filter(m => this.permisoService.puede(m.id_modulo, 'Consultar'));
      }
    });
  }

  navegar(ruta: string) {
    this.router.navigate([ruta]);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/services/participante.service';

interface EventoHistorial {
  tipo: string;
  titulo: string;
  detalle: string;
  fecha: string;
  estado?: string;
  responsable?: string;
  fecha_programada?: string;
  id_actividad?: number;
  id_programacion?: number;
}

interface Pendiente {
  tipo: string;
  titulo: string;
  detalle: string;
  severidad: string;
  cantidad: number;
}

@Component({
  selector: 'app-panel-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-historial.component.html',
  styleUrls: ['./panel-historial.component.css']
})
export class PanelHistorialComponent implements OnInit {
  expandido = true;
  cargando = false;
  actividad: EventoHistorial[] = [];
  pendientes: Pendiente[] = [];

  private iconos: Record<string, string> = {
    participante: 'fa-user-plus',
    monitoreo: 'fa-chart-line',
    evaluacion: 'fa-clipboard-check',
    grupo: 'fa-layer-group',
    actividad: 'fa-calendar-alt',
    usuario: 'fa-user-shield'
  };

  constructor(private dashboard: DashboardService, private router: Router) {
    this.expandido = typeof window !== 'undefined' ? window.innerWidth > 992 : true;
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    if (this.cargando) return;
    this.cargando = true;
    forkJoin({
      actividad: this.dashboard.ActividadReciente(15),
      pendientes: this.dashboard.Pendientes()
    }).subscribe({
      next: (res: any) => {
        this.actividad = res.actividad || [];
        this.pendientes = res.pendientes || [];
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  alternar() {
    this.expandido = !this.expandido;
    if (this.expandido && !this.actividad.length && !this.pendientes.length) this.cargar();
  }

  irActividad(idActividad: number | undefined, idProgramacion: number | undefined) {
    if (!idActividad || !idProgramacion) return;
    this.router.navigate(['/actividades'], { queryParams: { detalle: idActividad, programacion: idProgramacion } });
  }

  iconoDe(tipo: string): string {
    return this.iconos[tipo] || 'fa-circle';
  }

  estadoBadge(estado?: string): string {
    const map: Record<string, string> = { 'Programada': 'badge-blue', 'En curso': 'badge-yellow', 'Finalizada': 'badge-green', 'Cancelada': 'badge-red' };
    return map[estado || ''] || 'badge-gray';
  }

  estadoLabel(estado?: string): string {
    return estado || '—';
  }

  tiempoRelativo(fecha: string): string {
    if (!fecha) return '';
    const dif = Date.now() - new Date(fecha).getTime();
    if (isNaN(dif)) return '';
    const min = Math.floor(dif / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `hace ${d} d`;
    return new Date(fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
  }
}

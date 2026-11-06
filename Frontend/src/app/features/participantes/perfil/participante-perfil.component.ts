import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ParticipanteService } from '../../../core/services/participante.service';
import { AcademicoService, InscripcionAcademica, HistorialAcademico, Promedio, BloqueAcademico } from '../../../core/services/academico.service';
import { ReporteService } from '../../../core/services/reporte.service';
import { PermisoService } from '../../../core/services/permiso.service';
import { MonitoreoService, ActividadMonitoreo } from '../../../core/services/monitoreo.service';
import { EvaluacionService } from '../../../core/services/evaluacion.service';
import { ActividadService } from '../../../core/services/actividad.service';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { ReportePreviewComponent } from '../../../shared/components/reporte-preview/reporte-preview.component';
import { Participante } from '../../../core/models/models';

@Component({
  selector: 'app-participante-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, ReportePreviewComponent],
  templateUrl: './participante-perfil.component.html',
  styleUrls: ['./participante-perfil.component.css']
})
export class ParticipantePerfilComponent implements OnInit {
  participante: Participante | null = null;
  loading = true;
  error = '';
  activeTab = 'personal';
  monitoreos: any[] = [];
  evaluaciones: any[] = [];
  asistencia: any[] = [];
  inscripciones: InscripcionAcademica[] = [];
  historial: HistorialAcademico[] = [];
  promediosMap: Map<number, Promedio[]> = new Map();
  bloques: BloqueAcademico[] = [];

  catalogoActividades: ActividadMonitoreo[] = [];
  mostrarFormMonitoreo = false;
  guardandoMonitoreo = false;
  formMonitoreo: any = {};
  mostrarFormEvaluacion = false;
  guardandoEvaluacion = false;
  formEvaluacion: any = {};
  mensaje = '';

  puedeMonitorear = false;
  puedeEvaluar = false;
  puedeAsignarActividad = false;

  mostrarReporte = false;
  reporteHtml = '';
  puedeGenerarReportes = false;
  mostrarPickerReporte = false;
  seccionesReporte = { academico: true, historial: true, actividades: true, monitoreo: true, evaluaciones: true, beca: true };

  tabs = [
    { key: 'personal', label: 'Datos personales', icon: 'fa-user' },
    { key: 'tutor', label: 'Tutor/Encargado', icon: 'fa-user-tie' },
    { key: 'programa', label: 'Programa', icon: 'fa-folder' },
    { key: 'actividades', label: 'Actividades', icon: 'fa-calendar-check' },
    { key: 'monitoreo', label: 'Monitoreo', icon: 'fa-chart-line' },
    { key: 'evaluaciones', label: 'Evaluaciones', icon: 'fa-star' },
    { key: 'academico', label: 'Reg. Académico', icon: 'fa-graduation-cap' },
    { key: 'historial', label: 'Historial', icon: 'fa-clock' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public participanteService: ParticipanteService,
    private academicoService: AcademicoService,
    private reporteService: ReporteService,
    private permisoService: PermisoService,
    private monitoreoService: MonitoreoService,
    private evaluacionService: EvaluacionService,
    private actividadService: ActividadService
  ) {}

  ngOnInit() {
    this.revisarPermisoReportes();
    this.permisoService.cargar().subscribe({
      next: () => this.revisarPermisoReportes(),
      error: () => this.revisarPermisoReportes()
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadParticipante(Number(id));
  }

  private revisarPermisoReportes() {
    this.puedeGenerarReportes = this.permisoService.puede(8, 'Generar Reportes');
    this.puedeMonitorear = this.permisoService.puede(6, 'Monitorear', 'Crear', 'Actualizar', 'Eliminar');
    this.puedeEvaluar = this.permisoService.puede(7, 'Evaluar', 'Crear', 'Actualizar', 'Eliminar');
    this.puedeAsignarActividad = this.permisoService.puede(5, 'Actualizar', 'Crear');
    this.actualizarTabsVisibles();
  }

  loadParticipante(id: number) {
    this.loading = true;
    this.participanteService.ObtenerPorId(id).subscribe({
next: (data) => {
          this.participante = data;
          this.actualizarTabsVisibles();
          this.loading = false;
          this.loadAcademico(id);
          this.loadInformes(id);
        },
      error: () => { this.error = 'No se pudo cargar el participante'; this.loading = false; }
    });
  }

  loadAcademico(idParticipante: number) {
    this.academicoService.ObtenerInscripciones(idParticipante).subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.inscripciones.forEach(ins => {
          this.academicoService.ObtenerPromedios(ins.id_inscripcion).subscribe({
            next: (proms) => this.promediosMap.set(ins.id_inscripcion, proms),
            error: () => this.promediosMap.set(ins.id_inscripcion, [])
          });
        });
      },
      error: () => {}
    });
    this.academicoService.ObtenerHistorial(idParticipante).subscribe({
      next: (data) => this.historial = data,
      error: () => {}
    });
    this.academicoService.ObtenerBloques().subscribe({
      next: (data) => this.bloques = data,
      error: () => {}
    });
  }

  loadInformes(idParticipante: number) {
    this.monitoreoService.obtenerTodos().subscribe({
      next: (data) => this.monitoreos = (data || []).filter(m => m.id_participante === idParticipante),
      error: () => {}
    });
    this.evaluacionService.obtenerPorParticipante(idParticipante).subscribe({
      next: (data) => this.evaluaciones = data || [],
      error: () => {}
    });
    this.participanteService.ObtenerAsistencia(idParticipante).subscribe({
      next: (data) => this.asistencia = data || [],
      error: () => {}
    });
    this.monitoreoService.actividades().subscribe({
      next: (data) => this.catalogoActividades = data || [],
      error: () => this.catalogoActividades = []
    });
  }

  /* ------------------------- CRUD Monitoreo ------------------------- */

  abrirFormMonitoreo(m?: any) {
    this.formMonitoreo = m
      ? { id_monitoreo: m.id_monitoreo, fecha: m.fecha ? new Date(m.fecha).toISOString().slice(0, 10) : '', id_programacion: m.id_programacion || null, participacion: m.participacion || 'Media', tipo_monitoreo: m.tipo_monitoreo || 'Individual', observaciones: m.observaciones || '' }
      : { fecha: new Date().toISOString().slice(0, 10), id_programacion: null, participacion: 'Media', tipo_monitoreo: 'Individual', observaciones: '' };
    this.mostrarFormMonitoreo = true;
    this.mostrarFormEvaluacion = false;
    this.mensaje = '';
  }

  guardarMonitoreo() {
    if (!this.participante || !this.formMonitoreo.fecha) return;
    this.guardandoMonitoreo = true;
    const payload = {
      id_participante: this.participante.id_participante,
      fecha: this.formMonitoreo.fecha,
      id_programacion: this.formMonitoreo.id_programacion ? Number(this.formMonitoreo.id_programacion) : null,
      participacion: this.formMonitoreo.participacion,
      tipo_monitoreo: this.formMonitoreo.tipo_monitoreo,
      observaciones: this.formMonitoreo.observaciones || null
    };
    const req = this.formMonitoreo.id_monitoreo
      ? this.monitoreoService.actualizar(this.formMonitoreo.id_monitoreo, payload)
      : this.monitoreoService.crear(payload);
    req.subscribe({
      next: () => {
        this.guardandoMonitoreo = false;
        this.mostrarFormMonitoreo = false;
        this.mensaje = this.formMonitoreo.id_monitoreo ? 'Monitoreo actualizado' : 'Monitoreo registrado';
        this.recargarMonitoreos();
      },
      error: (err) => { this.guardandoMonitoreo = false; this.mensaje = err?.error?.mensaje || 'Error al guardar monitoreo'; }
    });
  }

  eliminarMonitoreo(m: any) {
    if (!confirm(`¿Eliminar el monitoreo del ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-GT') : ''}?`)) return;
    this.monitoreoService.eliminar(m.id_monitoreo).subscribe({
      next: () => { this.mensaje = 'Monitoreo eliminado'; this.recargarMonitoreos(); },
      error: (err) => { this.mensaje = err?.error?.mensaje || 'Error al eliminar monitoreo'; }
    });
  }

  private recargarMonitoreos() {
    if (!this.participante) return;
    this.monitoreoService.obtenerTodos().subscribe({
      next: (data) => this.monitoreos = (data || []).filter(m => m.id_participante === this.participante!.id_participante),
      error: () => {}
    });
  }

  /* ------------------------ CRUD Evaluaciones ------------------------ */

  abrirFormEvaluacion(e?: any) {
    this.formEvaluacion = e
      ? { id_evaluacion: e.id_evaluacion, fecha: e.fecha ? new Date(e.fecha).toISOString().slice(0, 10) : '', tipo_evaluacion: e.tipo_evaluacion || 'Individual', id_programacion: e.id_programacion || null, nivel: e.nivel ?? null, resultado: e.resultado_general || '', observaciones: e.observaciones || '' }
      : { fecha: new Date().toISOString().slice(0, 10), tipo_evaluacion: 'Individual', id_programacion: null, nivel: null, resultado: '', observaciones: '' };
    this.mostrarFormEvaluacion = true;
    this.mostrarFormMonitoreo = false;
    this.mensaje = '';
  }

  guardarEvaluacion() {
    if (!this.participante || !this.formEvaluacion.fecha) return;
    this.guardandoEvaluacion = true;
    const payload = {
      id_participante: this.participante.id_participante,
      fecha: this.formEvaluacion.fecha,
      tipo_evaluacion: this.formEvaluacion.tipo_evaluacion,
      id_programacion: this.formEvaluacion.id_programacion ? Number(this.formEvaluacion.id_programacion) : null,
      nivel: this.formEvaluacion.nivel !== null && this.formEvaluacion.nivel !== '' ? Number(this.formEvaluacion.nivel) : null,
      resultado: this.formEvaluacion.resultado || null,
      observaciones: this.formEvaluacion.observaciones || null
    };
    const req = this.formEvaluacion.id_evaluacion
      ? this.evaluacionService.actualizar(this.formEvaluacion.id_evaluacion, payload)
      : this.evaluacionService.crear(payload);
    req.subscribe({
      next: () => {
        this.guardandoEvaluacion = false;
        this.mostrarFormEvaluacion = false;
        this.mensaje = this.formEvaluacion.id_evaluacion ? 'Evaluación actualizada' : 'Evaluación registrada';
        this.recargarEvaluaciones();
      },
      error: (err) => { this.guardandoEvaluacion = false; this.mensaje = err?.error?.mensaje || 'Error al guardar evaluación'; }
    });
  }

  eliminarEvaluacion(e: any) {
    if (!confirm(`¿Eliminar la evaluación del ${e.fecha ? new Date(e.fecha).toLocaleDateString('es-GT') : ''}?`)) return;
    this.evaluacionService.eliminar(e.id_evaluacion).subscribe({
      next: () => { this.mensaje = 'Evaluación eliminada'; this.recargarEvaluaciones(); },
      error: (err) => { this.mensaje = err?.error?.mensaje || 'Error al eliminar evaluación'; }
    });
  }

  private recargarEvaluaciones() {
    if (!this.participante) return;
    this.evaluacionService.obtenerPorParticipante(this.participante.id_participante).subscribe({
      next: (data) => this.evaluaciones = data || [],
      error: () => {}
    });
  }

  /* -------------------- Asignar actividad (Asistencia) -------------------- */

  asignarActividad(idProgramacion: number) {
    const p = this.participante;
    if (!p || !idProgramacion) return;
    this.actividadService.AsignarParticipantes(idProgramacion, [p.id_participante]).subscribe({
      next: () => {
        this.mensaje = 'Participante asignado a la actividad';
        this.participanteService.ObtenerAsistencia(p.id_participante).subscribe({
          next: (data) => this.asistencia = data || [],
          error: () => {}
        });
      },
      error: (err) => { this.mensaje = err?.error?.message || 'No se pudo asignar (quizá ya estaba asignado)'; }
    });
  }

  asignarSeleccionada() {
    if (this.formMonitoreo?.id_asignar) this.asignarActividad(Number(this.formMonitoreo.id_asignar));
  }

  trackById(i: number, item: any) { return item?.id_monitoreo ?? item?.id_evaluacion ?? item?.id_asistencia ?? i; }

  getPromedios(inscripcion: InscripcionAcademica): Promedio[] {
    return this.promediosMap.get(inscripcion.id_inscripcion) || [];
  }

  getBloqueValor(promedios: Promedio[], numeroBloque: number): number | null {
    const p = promedios.find(pr => {
      const b = this.bloques.find(bl => bl.id_bloque === pr.id_bloque);
      return b && b.numero_bloque === numeroBloque;
    });
    return p ? p.promedio : null;
  }

  calcPromedio(promedios: Promedio[]): number | null {
    const vals = promedios.map(p => p.promedio).filter(v => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  get isMenor(): boolean {
    const edad = this.calcEdad(this.participante?.fecha_nacimiento);
    return edad !== null && edad < 18;
  }

  get esMujeres(): boolean {
    return (this.participante?.programa_nombre || '').includes('Mujer');
  }

  visibleTabs: typeof this.tabs = [];

  private actualizarTabsVisibles() {
    this.visibleTabs = this.tabs.filter(t =>
      (t.key !== 'tutor' || this.isMenor) &&
      (t.key !== 'academico' || !this.esMujeres)
    );
  }

  calcEdad(fecha?: string): number | null {
    if (!fecha) return null;
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  getInitials(): string {
    if (!this.participante) return '';
    return ((this.participante.primer_nombre?.[0] || '') + (this.participante.primer_apellido?.[0] || '')).toUpperCase();
  }

  getProgramaBadge(): string {
    return (this.participante?.programa_nombre || '').includes('Mujer') ? 'badge-purple' : 'badge-blue';
  }

  volver() { this.router.navigate(['/participantes']); }

  setTab(tab: string) { this.activeTab = tab; }

  descargarReporte(completo: boolean) {
    if (!this.participante) return;
    if (!this.puedeGenerarReportes) return;
    if (completo) {
      this.reporteHtml = this.reporteService.generarReportePerfil(this.participante, { completo: true, extrasHtml: this.seccionExtras({ academico: true, historial: true, actividades: true, monitoreo: true, evaluaciones: true, beca: true }) });
      this.mostrarReporte = true;
      return;
    }
    this.reporteHtml = this.reporteService.generarReportePerfil(this.participante, { completo: false });
    this.mostrarReporte = true;
  }

  abrirPickerReporte() {
    this.mostrarPickerReporte = true;
  }

  generarReportePersonalizado() {
    if (!this.participante) return;
    this.reporteHtml = this.reporteService.generarReportePerfil(this.participante, { completo: false, extrasHtml: this.seccionExtras(this.seccionesReporte) });
    this.mostrarPickerReporte = false;
    this.mostrarReporte = true;
  }

  /** Secciones del reporte COMPLETO: registro e historial academico. */
  private seccionExtras(secciones: { academico: boolean; historial: boolean; actividades: boolean; monitoreo: boolean; evaluaciones: boolean; beca: boolean }): string {
    const th = (t: string) => `<th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#fff;">${this.reporteService.esc(t)}</th>`;
    const td = (v?: string | number | null) =>
      `<td style="padding:8px 12px;font-size:12px;color:#1E3278;border-bottom:1px solid #F5F9FD;">${this.reporteService.esc(v == null ? '' : String(v)) || '-'}</td>`;
    const card = (titulo: string, icono: string, thead: string, body: string) =>
      body
        ? `<div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #4A90D9;padding-bottom:10px;">${icono} ${titulo}</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr style="background:#1E3278;">${thead}</tr></thead>
              <tbody>${body}</tbody>
            </table>
          </div>`
        : '';

    const filasIns = this.inscripciones.map((ins, i) => {
      const proms = this.getPromedios(ins);
      const bloquesCols = this.bloques.map(b => td(this.getBloqueValor(proms, b.numero_bloque))).join('');
      return `
      <tr style="background:${i % 2 ? '#F8FAFC' : '#fff'};">
        ${td(i + 1)}${td(ins.ciclo_anio)}${td(ins.grado_nombre)}
        ${td(ins.fecha_inscripcion ? new Date(ins.fecha_inscripcion).toLocaleDateString('es-GT') : '')}
        ${td(ins.estado)}${bloquesCols}${td(this.calcPromedio(proms))}
      </tr>`;
    }).join('');

    const filasHist = this.historial.map((h, i) => `
      <tr style="background:${i % 2 ? '#F8FAFC' : '#fff'};">
        ${td(i + 1)}${td(h.ciclo_anio)}${td(h.grado_nombre)}${td(h.promedio_final)}${td(h.resultado)}
        ${td(h.fecha_registro ? new Date(h.fecha_registro).toLocaleDateString('es-GT') : '')}
      </tr>`).join('');

    const filasEval = this.evaluaciones.map((e, i) => `
      <tr style="background:${i % 2 ? '#F8FAFC' : '#fff'};">
        ${td(i + 1)}${td(e.fecha ? new Date(e.fecha).toLocaleDateString('es-GT') : (e.fecha_evaluacion ? new Date(e.fecha_evaluacion).toLocaleDateString('es-GT') : ''))}
        ${td(e.actividad || e.tipo_evaluacion)}${td(e.nota ?? e.calificacion ?? e.valor)}${td(e.observaciones)}
      </tr>`).join('');

    const filasMon = this.monitoreos.map((m, i) => `
      <tr style="background:${i % 2 ? '#F8FAFC' : '#fff'};">
        ${td(i + 1)}${td(m.fecha ? new Date(m.fecha).toLocaleDateString('es-GT') : '')}
        ${td(m.actividad)}${td(m.tipo_monitoreo)}${td(m.participacion)}${td(m.observaciones)}
      </tr>`).join('');

    const filasAsis = this.asistencia.map((a, i) => `
      <tr style="background:${i % 2 ? '#F8FAFC' : '#fff'};">
        ${td(i + 1)}${td(a.fecha ? new Date(a.fecha).toLocaleDateString('es-GT') : '')}
        ${td(a.actividad)}${td(a.tipo_actividad)}${td(a.presente ? 'Presente' : 'Ausente')}${td(a.observaciones)}
      </tr>`).join('');

    const thBeca = this.participante?.beca
      ? `<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px 20px;margin-top:20px;">
           <h3 style="color:#166534;margin:0 0 8px;font-size:14px;">🎓 Beca: <strong>Activa</strong> — Monto: Q${Number(this.participante?.monto_beca || 0).toFixed(2)}</h3>
         </div>`
      : `<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 20px;margin-top:20px;">
           <h3 style="color:#64748B;margin:0 0 8px;font-size:14px;">🎓 Beca: Sin beca asignada</h3>
         </div>`;

    const bloquesTh = this.bloques.map(b => th(`Bl.${b.numero_bloque}`)).join('');

    return (
      (secciones.beca ? thBeca : '') +
      (secciones.academico
        ? card('Registro Academico', '🎓',
            th('No.') + th('Ciclo') + th('Grado') + th('Fecha inscripcion') + th('Estado') + bloquesTh + th('Promedio'),
            filasIns)
        : '') +
      (secciones.historial
        ? card('Historial Academico', '📜',
            th('No.') + th('Ciclo') + th('Grado') + th('Promedio final') + th('Resultado') + th('Fecha'),
            filasHist)
        : '') +
      (secciones.evaluaciones
        ? card('Evaluaciones', '⭐',
            th('No.') + th('Fecha') + th('Actividad/Tipo') + th('Nota') + th('Observaciones'),
            filasEval)
        : '') +
      (secciones.monitoreo
        ? card('Monitoreo', '📈',
            th('No.') + th('Fecha') + th('Actividad') + th('Tipo') + th('Participacion') + th('Observaciones'),
            filasMon)
        : '') +
      (secciones.actividades
        ? card('Asistencia / Actividades', '📋',
            th('No.') + th('Fecha') + th('Actividad') + th('Tipo') + th('Estado') + th('Observaciones'),
            filasAsis)
        : '')
    );
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !this.participante) return;
    this.participanteService.SubirFotografia(this.participante.id_participante, file).subscribe({
      next: (res) => {
        if (this.participante) {
          this.participante.fotografia_ruta = res.ruta;
        }
      },
      error: () => {}
    });
  }

  getInitialsForSize(): string {
    if (!this.participante) return '';
    return ((this.participante.primer_nombre?.[0] || '') + (this.participante.primer_apellido?.[0] || '')).toUpperCase();
  }
}

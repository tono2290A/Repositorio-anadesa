import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, take } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { ReportePreviewComponent } from '../../shared/components/reporte-preview/reporte-preview.component';
import { PermisoService } from '../../core/services/permiso.service';
import { AlcanceService, ProgramaClave } from '../../core/services/alcance.service';
import { DashboardService, ParticipanteService } from '../../core/services/participante.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { AcademicoService, InscripcionAcademica } from '../../core/services/academico.service';
import { ReporteService } from '../../core/services/reporte.service';
import { MonitoreoService, Monitoreo } from '../../core/services/monitoreo.service';
import { EvaluacionService, Evaluacion } from '../../core/services/evaluacion.service';
import { ActividadService, Actividad } from '../../core/services/actividad.service';
import { AuthService } from '../../core/services/auth.service';
import { Participante, Usuario } from '../../core/models/models';

interface OpcionReporte {
  tipo: string;
  label: string;
  icono: string;
}

interface TarjetaReporte {
  key: string;
  modulo: number;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  bg: string;
  opciones: OpcionReporte[];
}

/**
 * Centro de informes y reportes (modulo 8).
 * TODOS los reportes se generan aqui mismo, en la vista previa del modal,
 * sin navegar a otros modulos. Salidas permitidas: unicamente PDF y Excel.
 */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, ReportePreviewComponent],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportesComponent implements OnInit {
  stats: any = {};
  cargando = true;
  error = '';

  participantes: Participante[] = [];
  usuarios: Usuario[] = [];
  usuariosCargados = false;
  monitoreos: Monitoreo[] = [];
  monitoreosCargados = false;
  evaluaciones: Evaluacion[] = [];
  evaluacionesCargados = false;
  actividades: Actividad[] = [];
  actividadesCargados = false;

  filtroPrograma: '' | ProgramaClave = '';
  filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';
  busqueda = '';

  mostrarReporte = false;
  reporteHtml = '';
  reporteTitulo = '';
  reporteLista: Participante[] = [];
  reporteTipo: 'general' | 'perfil' = 'general';
  reporteModoHtml = false;
  generando = false;

  mensaje: { tipo: 'success' | 'error'; texto: string } | null = null;

  constructor(
    public permisos: PermisoService,
    public alcance: AlcanceService,
    private dashboardService: DashboardService,
    private participanteService: ParticipanteService,
    private usuarioService: UsuarioService,
    private academicoService: AcademicoService,
    private monitoreoService: MonitoreoService,
    private evaluacionService: EvaluacionService,
    private actividadService: ActividadService,
    private reporteService: ReporteService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.dashboardService.ObtenerEstadisticas().pipe(take(1)).subscribe({
      next: s => { this.stats = s; this.cargando = false; },
      error: () => { this.error = 'No se pudieron cargar las estadisticas.'; this.cargando = false; }
    });
    this.participanteService.ObtenerTodos().pipe(take(1)).subscribe({
      next: p => this.participantes = p,
      error: () => {}
    });
  }

  puedeConsultar(modulo: number): boolean {
    return this.permisos.puede(modulo, 'Consultar');
  }

  get puedeGenerar(): boolean {
    return this.permisos.puede(8, 'Generar Reportes');
  }

  get contadores() {
    const esAdmin = this.authService.hasRole('Administrador');
    const lista: any[] = [
      { titulo: 'Participantes', valor: this.stats.totalParticipantes ?? 0, icono: 'fa-users', color: '#1E3278', bg: '#EBF5FB' },
      { titulo: 'Activos', valor: this.stats.participantesActivos ?? 0, icono: 'fa-user-check', color: '#0E6B23', bg: '#dcfce7' },
      { titulo: 'Monitoreos', valor: this.stats.totalMonitoreos ?? 0, icono: 'fa-chart-line', color: '#0F766E', bg: '#ccfbf1' },
      { titulo: 'Evaluaciones', valor: this.stats.totalEvaluaciones ?? 0, icono: 'fa-clipboard-check', color: '#F5A623', bg: '#fef3c7' },
      { titulo: 'Actividades', valor: this.stats.totalActividades ?? 0, icono: 'fa-calendar-alt', color: '#F5A623', bg: '#FEF6E7' }
    ];
    if (esAdmin) {
      lista.push({ titulo: 'Usuarios', valor: this.stats.totalUsuarios ?? 0, icono: 'fa-user-shield', color: '#9333EA', bg: '#f3e8ff' });
    }
    return lista;
  }

  /** Tarjetas de reporte visibles segun los permisos del usuario. */
  get tarjetas(): TarjetaReporte[] {
    const lista: TarjetaReporte[] = [];

    if (this.puedeConsultar(3)) {
      lista.push({
        key: 'participantes', modulo: 3, nombre: 'Participantes',
        descripcion: 'Directorio con filtros avanzados por programa y estado',
        icono: 'fa-users', color: '#1E3278', bg: '#EBF5FB',
        opciones: [
          { tipo: 'general', label: 'Reporte general', icono: 'fa-list' },
          { tipo: 'activos', label: 'Solo activos', icono: 'fa-check' },
          { tipo: 'inactivos', label: 'Solo inactivos', icono: 'fa-times' }
        ]
      });
    }

    if (this.puedeConsultar(4)) {
      lista.push({
        key: 'academico', modulo: 4, nombre: 'Registro Academico',
        descripcion: 'Inscripciones por ciclo y grado de los participantes',
        icono: 'fa-graduation-cap', color: '#4B9CD3', bg: '#EBF5FB',
        opciones: [
          { tipo: 'general', label: 'Inscripciones', icono: 'fa-graduation-cap' }
        ]
      });
    }

    if (this.puedeConsultar(6)) {
      lista.push({
        key: 'monitoreo', modulo: 6, nombre: 'Monitoreo',
        descripcion: 'Registros de monitoreo individual, grupo y actividad',
        icono: 'fa-chart-line', color: '#0F766E', bg: '#ccfbf1',
        opciones: this.opcionesPrograma()
      });
    }

    if (this.puedeConsultar(7)) {
      lista.push({
        key: 'evaluacion', modulo: 7, nombre: 'Evaluacion',
        descripcion: 'Resultados de evaluaciones individual, grupo y actividad',
        icono: 'fa-clipboard-check', color: '#F5A623', bg: '#fef3c7',
        opciones: this.opcionesPrograma()
      });
    }

    if (this.puedeConsultar(5)) {
      lista.push({
        key: 'actividades', modulo: 5, nombre: 'Actividades',
        descripcion: 'Plan de actividades del sistema',
        icono: 'fa-calendar-alt', color: '#F5A623', bg: '#FEF6E7',
        opciones: [
          { tipo: 'general', label: 'Reporte general', icono: 'fa-file-alt' },
          { tipo: 'finalizadas', label: 'Finalizadas', icono: 'fa-check-circle' },
          { tipo: 'curso', label: 'En curso / Planificadas', icono: 'fa-spinner' }
        ]
      });
    }

    if (this.puedeConsultar(2)) {
      lista.push({
        key: 'usuarios', modulo: 2, nombre: 'Usuarios',
        descripcion: 'Cuentas, roles y acceso al sistema',
        icono: 'fa-user-shield', color: '#9333EA', bg: '#f3e8ff',
        opciones: [
          { tipo: 'general', label: 'Reporte general', icono: 'fa-user' }
        ]
      });
    }

    return lista;
  }

  /** Opciones por programa (solo las que el alcance del rol permite). */
  private opcionesPrograma(): OpcionReporte[] {
    const ops: OpcionReporte[] = [
      { tipo: 'general', label: 'Reporte general', icono: 'fa-file-alt' }
    ];
    if (this.alcance.permite('educacion')) {
      ops.push({ tipo: 'educacion', label: 'Programa Educacion', icono: 'fa-graduation-cap' });
    }
    if (this.alcance.permite('mujeres')) {
      ops.push({ tipo: 'mujeres', label: 'Programa Mujeres', icono: 'fa-venus' });
    }
    return ops;
  }

  get programasDisponibles() {
    return this.alcance.tabs;
  }

  /** Filtro avanzado de participantes (programa + estado + busqueda). */
  get participantesFiltrados(): Participante[] {
    let lista = this.participantes;
    if (this.filtroPrograma) {
      const clave = this.filtroPrograma as ProgramaClave;
      lista = lista.filter(p => this.alcance.coincide(p.programa_nombre, clave));
    }
    if (this.filtroEstado === 'activos') lista = lista.filter(p => p.estado);
    if (this.filtroEstado === 'inactivos') lista = lista.filter(p => !p.estado);
    const texto = this.busqueda.trim().toLowerCase();
    if (texto) {
      lista = lista.filter(p =>
        `${p.primer_nombre} ${p.segundo_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''} ${p.correo || ''}`
          .toLowerCase().includes(texto)
      );
    }
    return lista;
  }

  /** Genera el reporte aqui mismo, en la vista previa de este modulo. */
  async generar(tarjeta: TarjetaReporte, tipo: string) {
    console.log('[REPORTE] generar llamado:', tarjeta.key, tipo, 'puedeGenerar:', this.puedeGenerar, 'generando:', this.generando);
    if (!this.puedeGenerar) {
      this.mostrarMensaje('error', 'No tiene permiso para generar reportes.');
      return;
    }
    if (this.generando) return;
    this.generando = true;
    try {
      if (tarjeta.key === 'participantes') this.generarParticipantes(tipo);
      else if (tarjeta.key === 'usuarios') await this.generarUsuarios();
      else if (tarjeta.key === 'academico') await this.generarAcademico();
      else if (tarjeta.key === 'monitoreo') await this.generarMonitoreo(tipo);
      else if (tarjeta.key === 'evaluacion') await this.generarEvaluacion(tipo);
      else if (tarjeta.key === 'actividades') await this.generarActividades(tipo);
    } catch (e) {
      console.error('[REPORTE] Error:', e);
      this.mostrarMensaje('error', 'No se pudo generar el reporte.');
    } finally {
      this.generando = false;
    }
  }

  /** Carga perezosa de listas (una sola vez por sesion). */
  private async cargarMonitoreos(): Promise<Monitoreo[]> {
    if (!this.monitoreosCargados) {
      this.monitoreos = await new Promise<Monitoreo[]>((res, rej) =>
        this.monitoreoService.obtenerTodos().subscribe({ next: res, error: rej }));
      this.monitoreosCargados = true;
    }
    return this.monitoreos;
  }

  private async cargarEvaluaciones(): Promise<Evaluacion[]> {
    if (!this.evaluacionesCargados) {
      this.evaluaciones = await new Promise<Evaluacion[]>((res, rej) =>
        this.evaluacionService.obtenerTodos().subscribe({ next: res, error: rej }));
      this.evaluacionesCargados = true;
    }
    return this.evaluaciones;
  }

  private async cargarActividades(): Promise<Actividad[]> {
    if (!this.actividadesCargados) {
      this.actividades = await new Promise<Actividad[]>((res, rej) =>
        this.actividadService.ObtenerTodas().subscribe({ next: res, error: rej }));
      this.actividadesCargados = true;
    }
    return this.actividades;
  }

  private async generarMonitoreo(tipo: string) {
    const lista = await this.cargarMonitoreos();
    let filtrada = lista;
    let titulo = 'Reporte General de Monitoreo';
    if (tipo === 'educacion') {
      filtrada = lista.filter(m => this.alcance.coincide(m.programa, 'educacion'));
      titulo = 'Monitoreo - Programa de Educacion';
    } else if (tipo === 'mujeres') {
      filtrada = lista.filter(m => this.alcance.coincide(m.programa, 'mujeres'));
      titulo = 'Monitoreo - Programa de Mujeres';
    }
    const filas = filtrada.map((m, i) => [
      String(i + 1),
      m.participante || '-',
      m.programa || '-',
      m.fecha || '-',
      m.tipo_monitoreo || '-',
      m.participacion || '-',
      m.grupo || '-',
      m.actividad || '-',
      m.observaciones || '-',
      m.registrado_por || '-'
    ]);
    this.abrir(titulo, this.plantillaReporte(titulo, this.tablaHtml(
      ['No.', 'Participante', 'Programa', 'Fecha', 'Tipo', 'Participacion', 'Grupo', 'Actividad', 'Observaciones', 'Registrado por'],
      filas
    )));
  }

  private async generarEvaluacion(tipo: string) {
    const lista = await this.cargarEvaluaciones();
    let filtrada = lista;
    let titulo = 'Reporte General de Evaluaciones';
    if (tipo === 'educacion') {
      filtrada = lista.filter(e => this.alcance.coincide(e.programa, 'educacion'));
      titulo = 'Evaluaciones - Programa de Educacion';
    } else if (tipo === 'mujeres') {
      filtrada = lista.filter(e => this.alcance.coincide(e.programa, 'mujeres'));
      titulo = 'Evaluaciones - Programa de Mujeres';
    }
    const filas = filtrada.map((e, i) => [
      String(i + 1),
      e.participante || '-',
      e.programa || '-',
      e.fecha || '-',
      e.tipo_evaluacion || '-',
      e.nivel ? `Nivel ${e.nivel}` : 'Solo obs.',
      e.resultado_general || '-',
      e.grupo || '-',
      e.actividad || '-',
      e.observaciones || '-',
      e.evaluado_por || '-'
    ]);
    this.abrir(titulo, this.plantillaReporte(titulo, this.tablaHtml(
      ['No.', 'Participante', 'Programa', 'Fecha', 'Tipo', 'Nivel', 'Resultado', 'Grupo', 'Actividad', 'Observaciones', 'Evaluado por'],
      filas
    )));
  }

  private async generarActividades(tipo: string) {
    const lista = await this.cargarActividades();
    let filtrada = [...lista];
    let titulo = 'Reporte General de Actividades';
    if (tipo === 'finalizadas') {
      filtrada = lista.filter(a => a.estado === 'Finalizada');
      titulo = 'Actividades Finalizadas';
    } else if (tipo === 'curso') {
      filtrada = lista.filter(a => a.estado !== 'Finalizada' && a.estado !== 'Cancelada');
      titulo = 'Actividades en Curso / Planificadas';
    }
    const filas = filtrada.map((a, i) => [
      String(i + 1),
      a.nombre || '-',
      a.programa || '-',
      a.tipo_actividad || '-',
      `${a.fecha || '-'}${a.hora ? ' ' + a.hora : ''}`,
      a.lugar || '-',
      a.responsable || '-',
      a.estado || '-'
    ]);
    this.abrir(titulo, this.plantillaReporte(titulo, this.tablaHtml(
      ['No.', 'Actividad', 'Programa', 'Tipo', 'Fecha', 'Lugar', 'Responsable', 'Estado'],
      filas
    )));
  }

  /** Abre la vista previa aqui mismo, sin navegar a otros modulos. */
  private abrir(titulo: string, html: string) {
    console.log('[REPORTE] abrir modal:', titulo, 'html length:', html.length, 'modoHtml:', true);
    this.reporteHtml = html;
    this.reporteTitulo = titulo;
    this.reporteLista = [];
    this.reporteTipo = 'general';
    this.reporteModoHtml = true;
    this.mostrarReporte = true;
    console.log('[REPORTE] mostrarReporte establecido a:', this.mostrarReporte);
  }

  private generarParticipantes(tipo: string) {
    let lista = [...this.participantesFiltrados];
    let titulo = 'Reporte General de Participantes';
    if (tipo === 'activos') { lista = lista.filter(p => p.estado); titulo = 'Participantes Activos'; }
    if (tipo === 'inactivos') { lista = lista.filter(p => !p.estado); titulo = 'Participantes Inactivos'; }
    if (this.filtroPrograma === 'educacion') titulo += ' - Programa de Educacion';
    if (this.filtroPrograma === 'mujeres') titulo += ' - Programa de Mujeres';

    this.reporteHtml = this.reporteService.generarReporteGeneral(lista, titulo);
    this.reporteTitulo = titulo;
    this.reporteLista = lista;
    this.reporteTipo = 'general';
    this.reporteModoHtml = false;
    this.mostrarReporte = true;
  }

  private async generarUsuarios() {
    if (!this.usuariosCargados) {
      this.usuarios = await new Promise<Usuario[]>((resolve, reject) => {
        this.usuarioService.ObtenerTodos().subscribe({ next: resolve, error: reject });
      });
      this.usuariosCargados = true;
    }
    const filas = this.usuarios.map((u, i) => [
      String(i + 1),
      `${u.primer_nombre} ${u.segundo_nombre || ''} ${u.primer_apellido} ${u.segundo_apellido || ''}`.trim(),
      u.usuario,
      u.correo || '-',
      u.telefono || '-',
      u.roles?.map(r => r.nombre).join(', ') || u.tipo_usuario_nombre || '-',
      u.estado ? 'Activo' : 'Inactivo',
      u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString('es-GT') : '-'
    ]);
    const html = this.plantillaReporte('Reporte de Usuarios',
      this.tablaHtml(['No.', 'Nombre completo', 'Usuario', 'Correo', 'Telefono', 'Roles', 'Estado', 'Ultimo acceso'], filas));

    this.reporteHtml = html;
    this.reporteTitulo = 'Reporte de Usuarios';
    this.reporteLista = [];
    this.reporteTipo = 'general';
    this.reporteModoHtml = true;
    this.mostrarReporte = true;
  }

  private async generarAcademico() {
    const listas = await new Promise<InscripcionAcademica[][]>((resolve, reject) => {
      if (!this.participantes.length) { resolve([]); return; }
      forkJoin(
        this.participantes.map(p =>
          this.academicoService.ObtenerInscripciones(p.id_participante).pipe(catchError(() => of([])))
        )
      ).subscribe({ next: resolve, error: reject });
    });

    const filas: string[][] = [];
    this.participantes.forEach((p, idx) => {
      const nombre = `${p.primer_nombre} ${p.segundo_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''}`.trim();
      const inscripciones = listas[idx] || [];
      if (!inscripciones.length) {
        filas.push([String(p.id_participante), nombre, '-', '-', '-', 'Sin inscripcion']);
        return;
      }
      inscripciones.forEach(ins => {
        filas.push([
          String(p.id_participante),
          nombre,
          ins.ciclo_anio || '-',
          ins.grado_nombre || '-',
          ins.fecha_inscripcion ? new Date(ins.fecha_inscripcion).toLocaleDateString('es-GT') : '-',
          ins.estado || '-'
        ]);
      });
    });

    const html = this.plantillaReporte('Reporte de Registro Academico',
      this.tablaHtml(['ID', 'Participante', 'Ciclo', 'Grado', 'Fecha', 'Estado'], filas));

    this.reporteHtml = html;
    this.reporteTitulo = 'Reporte de Registro Academico';
    this.reporteLista = [];
    this.reporteTipo = 'general';
    this.reporteModoHtml = true;
    this.mostrarReporte = true;
  }

  /** Estandar de las plantillas de reporte generados en este modulo. */
  private plantillaReporte(titulo: string, contenido: string): string {
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    const t = this.reporteService.esc(titulo);
    return `<div style="font-family:Arial,sans-serif;color:#1e293b;padding:0;background:#fff;margin:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 32px;background:#fff;border-bottom:3px solid #0E6B23;">
        <div style="display:flex;align-items:center;gap:16px;">
          <img src="/LOGO_ANADESA.jpg" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">
          <div style="border-left:3px solid #0E6B23;padding-left:16px;">
            <h1 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Sistema de Gestion de</h1>
            <h1 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Participantes, Monitoreo y Evaluacion</h1>
            <p style="font-size:14px;color:#64748B;margin:4px 0 0 0;font-weight:500;">${t}</p>
          </div>
        </div>
        <div style="text-align:right;font-size:13px;color:#64748B;">
          <span style="color:#1E3278;font-weight:600;">${fecha}</span>
        </div>
      </div>
      <div style="padding:24px 32px;">${contenido}</div>
      <div style="margin-top:32px;padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B;display:flex;justify-content:space-between;">
        <span><strong style="color:#1E3278;">Asociacion ANADESA</strong> | Santiago Atitlan, Solola</span>
        <span style="color:#0E6B23;font-style:italic;">Mas oportunidades, mejores vidas</span>
      </div>
    </div>`;
  }

  /** Tabla HTML con escape de todos los valores (anti-injection). */
  private tablaHtml(titulos: string[], filas: string[][]): string {
    const th = titulos.map(t =>
      `<th style="padding:12px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${this.reporteService.esc(t)}</th>`
    ).join('');
    const rows = filas.map((f, i) =>
      `<tr style="border-bottom:1px solid #E2E8F0;background:${i % 2 ? '#F8FAFC' : '#fff'};">` +
      f.map(c => `<td style="padding:10px 16px;font-size:12px;color:#1E3278;">${this.reporteService.esc(c) || '-'}</td>`).join('') +
      `</tr>`
    ).join('');
    const vacio = `<tr><td colspan="${titulos.length}" style="padding:24px;text-align:center;color:#64748B;">Sin registros</td></tr>`;
    return `<table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <thead><tr style="background:linear-gradient(135deg,#1E3278 0%,#0E6B23 100%);color:#fff;">${th}</tr></thead>
      <tbody>${rows || vacio}</tbody>
    </table>`;
  }

  private mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    this.mensaje = { tipo, texto };
    setTimeout(() => { this.mensaje = null; }, 4000);
  }
}

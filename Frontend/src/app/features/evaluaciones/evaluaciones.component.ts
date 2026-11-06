import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { timeout, retry } from 'rxjs/operators';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { ProgramasTabsComponent } from '../../shared/components/programas-tabs/programas-tabs.component';
import { ReportePreviewComponent } from '../../shared/components/reporte-preview/reporte-preview.component';
import { PermisoService } from '../../core/services/permiso.service';
import { AlcanceService, ProgramaClave } from '../../core/services/alcance.service';
import {
  ParticipanteMonitoreo,
  GrupoMonitoreo,
  ActividadMonitoreo
} from '../../core/services/monitoreo.service';
import {
  EvaluacionService,
  Evaluacion,
  CriterioEvaluacion
} from '../../core/services/evaluacion.service';

const MODULO_EVALUACION = 7;

/** Una "cajita" de la lista agrupada: una por actividad o por grupo. */
export interface TarjetaEvaluacion {
  clave: number;
  tipo: 'Actividad' | 'Grupo';
  titulo: string;
  subtitulo: string;
  fecha: string;
  responsable: string;
  programa: string;
  resumen: string;
  registros: Evaluacion[];
}

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, ProgramasTabsComponent, ReportePreviewComponent],
  templateUrl: './evaluaciones.component.html',
  styleUrls: ['./evaluaciones.component.css']
})
export class EvaluacionesComponent implements OnInit {
  /* ------------------------------ permisos ------------------------------ */
  permisos: string[] = [];

  /* ------------------------------- datos -------------------------------- */
  data: Evaluacion[] = [];
  loading = true;
  error = '';
  errorModal = '';
  falloParticipantesForm = false;
  errorMasivo = '';

  /* ------------------------------ filtros ------------------------------- */
  search = '';
  fPrograma = '';
  fResultado = '';
  sortDir: 'asc' | 'desc' = 'asc';

  /** Pestaña de programa activa (Educación / Mujeres). */
  subTab: ProgramaClave = 'educacion';

  /* -------------------------- sección / modo ---------------------------- */
  modo: 'individual' | 'grupo' | 'actividad' = 'individual';

  private readonly seccionesValidas = ['individual', 'grupo', 'actividad'];
  private readonly tipoPorSeccion: Record<string, string> = {
    individual: 'Participante',
    grupo: 'Grupo',
    actividad: 'Actividad'
  };

  /* ------------------------- apoyos del modulo -------------------------- */
  grupos: GrupoMonitoreo[] = [];
  actividades: ActividadMonitoreo[] = [];
  participantes: ParticipanteMonitoreo[] = [];
  criterios: CriterioEvaluacion[] = [];

  /* -------------------------- formulario -------------------------------- */
  mostrarModal = false;
  editando = false;
  editId = 0;
  form: any = {};
  saving = false;
  participantesForm: ParticipanteMonitoreo[] = [];
  /** Participantes marcados en el formulario (seccion Grupo/Actividad: todos por defecto). */
  selForm: Set<number> = new Set();

  /* --------------------------- registro masivo -------------------------- */
  mostrarMasivo = false;
  masivo: any = {};
  participantesMasivos: ParticipanteMonitoreo[] = [];
  seleccionados: Set<number> = new Set();
  cargandoParticipantes = false;
  buscarParticipante = '';

  /* ---------------------------- confirmaciones -------------------------- */
  mostrarDialogo = false;
  dialogoTipo: 'create' | 'update' | 'delete' | 'lote' = 'create';
  dialogoItem: Evaluacion | null = null;
  /** Datos del lote mostrados en la confirmación (formulario o masivo). */
  dialogoLoteNivel: number | null = null;
  dialogoLoteCantidad = 0;

  /* ------------------------------ ficha --------------------------------- */
  mostrarFicha = false;
  fichaItem: Evaluacion | null = null;
  cargandoFicha = false;

  /* ------------------- detalle de tarjeta (actividad/grupo) ------------- */
  mostrarDetalleTarjeta = false;
  detalleTarjeta: TarjetaEvaluacion | null = null;

  /* ----------------------------- reportes ------------------------------- */
  mostrarReporte = false;
  reporteHtml = '';
  reporteTitulo = '';
  mostrarMenuReporte = false;

  /* ------------------------------ toasts -------------------------------- */
  toasts: { type: string; message: string }[] = [];

  /** Escala 1-5: el nivel equivale a puntuacion nivel x 20 en cada criterio. */
  niveles: { nivel: number; etiqueta: string }[] = [
    { nivel: 1, etiqueta: 'Necesita mejorar' },
    { nivel: 2, etiqueta: 'Básico' },
    { nivel: 3, etiqueta: 'En proceso' },
    { nivel: 4, etiqueta: 'Satisfactorio' },
    { nivel: 5, etiqueta: 'Excelente' }
  ];

  resultados = ['Aprobado', 'En proceso', 'Necesita apoyo'];
  tiposEvaluacion = ['Participante', 'Grupo', 'Actividad'];

  constructor(
    private evaluacionService: EvaluacionService,
    private permisoService: PermisoService,
    public alcanceService: AlcanceService,
    private route: ActivatedRoute
  ) {
    this.subTab = this.alcanceService.inicial;
    this.fPrograma = this.nombreDePrograma(this.subTab);
  }

  private nombreDePrograma(clave: ProgramaClave): string {
    return clave === 'educacion' ? 'Educación' : 'Mujeres';
  }

  cambiarPrograma(tab: ProgramaClave) {
    this.subTab = tab;
    this.fPrograma = this.nombreDePrograma(tab);
  }

  get conteoTabs(): Record<ProgramaClave, number> {
    const contar = (clave: ProgramaClave) =>
      this.data.filter(e => this.alcanceService.coincide(e.programa, clave)).length;
    return { educacion: contar('educacion'), mujeres: contar('mujeres') };
  }

  /** Listas de apoyo acotadas a la pestaña de programa activa. */
  private porPrograma<T extends { programa?: string | null }>(lista: T[]): T[] {
    return lista.filter(x => this.alcanceService.coincide(x.programa, this.subTab));
  }

  get gruposVisibles(): GrupoMonitoreo[] { return this.porPrograma(this.grupos); }
  get actividadesVisibles(): ActividadMonitoreo[] { return this.porPrograma(this.actividades); }
  get participantesCatalogo(): ParticipanteMonitoreo[] { return this.porPrograma(this.participantes); }

  /** Tipo de reporte pedido en la URL (?reporte=...) al llegar desde /reportes. */
  private reportePendiente: string | null = null;

  ngOnInit() {
    this.aplicarSeccion(this.route.snapshot.params['tipo']);
    this.reportePendiente = this.route.snapshot.queryParamMap.get('reporte');
    this.route.params.subscribe(p => {
      const seccion = (p['tipo'] || '').toLowerCase();
      if (seccion && seccion !== this.modo) {
        this.aplicarSeccion(seccion);
        this.iniciarMasivo();
      }
    });
    this.permisos = this.permisoService.permisosDe(MODULO_EVALUACION);
    this.permisoService.cargar().subscribe({
      next: () => {
        this.permisos = this.permisoService.permisosDe(MODULO_EVALUACION);
        this.ajustarModoObservaciones();
        if (!this.mostrarMasivo && !this.mostrarModal) this.iniciarMasivo();
      },
      error: () => {
        this.permisos = this.permisoService.permisosDe(MODULO_EVALUACION);
        this.ajustarModoObservaciones();
        if (!this.mostrarMasivo && !this.mostrarModal) this.iniciarMasivo();
      }
    });
    this.load();
    this.evaluacionService.grupos().pipe(timeout(15000), retry({ count: 2, delay: 1200 })).subscribe({
      next: g => { this.grupos = g; this.refrescarSeleccion(); },
      error: () => this.falloLista()
    });
    this.evaluacionService.actividades().pipe(timeout(15000), retry({ count: 2, delay: 1200 })).subscribe({
      next: a => { this.actividades = a; this.refrescarSeleccion(); },
      error: () => this.falloLista()
    });
    this.evaluacionService.participantes().pipe(timeout(15000), retry({ count: 2, delay: 1200 })).subscribe({
      next: p => {
        this.participantes = p;
        if (this.mostrarModal && !this.esLoteForm) {
          this.participantesForm = this.porPrograma(p);
          this.asignarParticipantePorDefecto();
        }
      },
      error: () => this.falloLista()
    });
    this.evaluacionService.criterios().pipe(timeout(15000), retry({ count: 2, delay: 1200 })).subscribe({
      next: c => (this.criterios = c),
      error: () => this.falloLista()
    });
    this.iniciarMasivo();
  }

  private avisoListas = false;

  /** Un solo aviso si falla la carga de datos auxiliares del módulo. */
  private falloLista() {
    if (this.avisoListas) return;
    this.avisoListas = true;
    this.showToast('error', 'No se pudieron cargar grupos, actividades, participantes o criterios. Verifique la conexión y recargue la página.');
  }

  /** Si los permisos cambian a "solo observaciones" con el modal abierto, limpia el nivel. */
  private ajustarModoObservaciones() {
    if (this.mostrarModal && this.soloObservaciones && this.form) {
      this.form.nivel = null;
      this.form.resultado = '';
    }
  }

  /* ---------------------------- permisos -------------------------------- */

  puede(permiso: string): boolean {
    return this.permisos.includes(permiso);
  }

  /** Alta de evaluaciones: el rol puede crear o evaluar. */
  puedeRegistrar(): boolean {
    return this.puede('Crear') || this.puede('Evaluar');
  }

  /**
   * Solo el rol con permiso "Crear" asigna nivel (1-5).
   * El Coordinador solo registra observaciones.
   */
  get soloObservaciones(): boolean {
    return !this.puede('Crear');
  }

  /* ----------------------------- secciones ------------------------------ */

  private aplicarSeccion(seccion?: string) {
    const s = (seccion || '').toLowerCase();
    this.modo = (this.seccionesValidas.includes(s) ? s : 'individual') as typeof this.modo;
  }

  get etiquetaSeccion(): string {
    return { individual: 'Individual', grupo: 'Grupo', actividad: 'Actividad' }[this.modo];
  }

  get tipoDeSeccion(): string {
    return this.tipoPorSeccion[this.modo] || 'Participante';
  }

  /** Tipos de evaluación que pertenecen a la sección actual (lista + reportes). */
  private tiposDeSeccion(): string[] {
    return this.modo === 'individual'
      ? ['Participante', 'Individual']
      : [this.tipoPorSeccion[this.modo]];
  }

  /** Tipos disponibles en el formulario: fijo al crear, completo al editar. */
  get tiposFormulario(): string[] {
    if (!this.editando) return [this.tipoDeSeccion];
    return Array.from(new Set([...this.tiposEvaluacion, this.form.tipo_evaluacion].filter(Boolean)));
  }

  /** Título de la tarjeta según la sección. */
  tituloCard(e: Evaluacion): string {
    if (this.modo === 'actividad') return e.actividad || 'Actividad sin nombre';
    if (this.modo === 'grupo') return e.grupo || 'Grupo sin nombre';
    return e.participante || 'Sin participante';
  }

  /** Línea secundaria de la tarjeta. */
  subtituloCard(e: Evaluacion): string {
    return this.modo === 'individual'
      ? (e.programa || 'Sin programa')
      : (e.participante || 'Sin participante');
  }

  get esAgrupado(): boolean {
    return this.modo === 'actividad' || this.modo === 'grupo';
  }

  get tarjetas(): TarjetaEvaluacion[] {
    if (!this.esAgrupado) return [];
    const agrupado = new Map<number, Evaluacion[]>();
    for (const e of this.filtered) {
      const clave = this.modo === 'actividad' ? (e.id_programacion || 0) : (e.id_grupo || 0);
      const arr = agrupado.get(clave) || [];
      arr.push(e);
      agrupado.set(clave, arr);
    }
    const lista: TarjetaEvaluacion[] = [];
    agrupado.forEach((registros, clave) => {
      const primero = registros[0];
      const esActividad = this.modo === 'actividad';
      lista.push({
        clave,
        tipo: esActividad ? 'Actividad' : 'Grupo',
        titulo: esActividad
          ? (primero.actividad || 'Actividad sin nombre')
          : (primero.grupo || 'Grupo sin nombre'),
        subtitulo: esActividad ? (primero.grupo || '') : (primero.programa || ''),
        fecha: registros.map(r => r.fecha || '').filter(Boolean).sort().pop() || '',
        responsable: primero.evaluado_por || '',
        programa: primero.programa || '',
        resumen: this.resumenNiveles(registros),
        registros
      });
    });
    return lista.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }

  /** Resumen de niveles de las evaluaciones de la tarjeta. */
  resumenNiveles(registros: Evaluacion[]): string {
    const conteo: Record<string, number> = {};
    registros.forEach(r => {
      const n = r.nivel ? `Nivel ${r.nivel}` : 'Solo obs.';
      conteo[n] = (conteo[n] || 0) + 1;
    });
    return Object.keys(conteo).map(n => `${n}: ${conteo[n]}`).join(' · ');
  }

  verDetalleTarjeta(t: TarjetaEvaluacion) {
    this.detalleTarjeta = t;
    this.mostrarDetalleTarjeta = true;
  }

  cerrarDetalleTarjeta() {
    this.mostrarDetalleTarjeta = false;
    this.detalleTarjeta = null;
  }

  reporteTarjeta(t: TarjetaEvaluacion) {
    if (!this.puede('Generar Reportes')) {
      this.showToast('error', 'No tiene permiso para generar reportes.');
      return;
    }
    const titulo = `${t.tipo === 'Actividad' ? 'Evaluación de Actividad' : 'Evaluación de Grupo'}: ${t.titulo}`;
    this.reporteHtml = this.generarHtmlReporte(t.registros, titulo);
    this.reporteTitulo = titulo;
    this.mostrarReporte = true;
  }

  load() {
    this.loading = true;
    this.error = '';
    this.evaluacionService.obtenerTodos().pipe(timeout(15000)).subscribe({
      next: d => { this.data = d; this.loading = false; this.consumirReportePendiente(); },
      error: () => { this.error = 'No se pudieron cargar las evaluaciones.'; this.loading = false; }
    });
  }

  /** Genera el reporte pedido por ?reporte= (llega desde el módulo /reportes). */
  private consumirReportePendiente() {
    const tipo = this.reportePendiente;
    this.reportePendiente = null;
    if (!tipo) return;
    const mapa: Record<string, 'general' | 'educacion' | 'mujeres'> = {
      general: 'general', educacion: 'educacion', mujeres: 'mujeres'
    };
    const t = mapa[tipo];
    if (!t) return;
    if (t !== 'general' && !this.alcanceService.permite(t)) return;
    this.generarReporte(t);
  }

  /* ------------------------------- filtros ------------------------------ */

  get filtered(): Evaluacion[] {
    let list = [...this.data];
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(e =>
        (e.participante || '').toLowerCase().includes(s) ||
        (e.actividad || '').toLowerCase().includes(s) ||
        (e.grupo || '').toLowerCase().includes(s) ||
        (e.observaciones || '').toLowerCase().includes(s) ||
        (e.resultado_general || '').toLowerCase().includes(s)
      );
    }
    if (this.fPrograma) list = list.filter(e => e.programa === this.fPrograma);
    if (this.fResultado) list = list.filter(e => e.resultado_general === this.fResultado);
    const tipos = this.tiposDeSeccion();
    list = list.filter(e => tipos.includes(e.tipo_evaluacion || ''));
    list.sort((a, b) => {
      const cmp = (a.participante || '').localeCompare(b.participante || '', 'es');
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }

  toggleSort() {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
  }

  get programasFiltrados(): string[] {
    return Array.from(new Set(this.data.map(e => e.programa).filter(Boolean)));
  }

  get resultadosFiltrados(): string[] {
    return Array.from(new Set(this.data.map(e => e.resultado_general).filter(Boolean)));
  }

  /* ------------------------ nivel / resultado --------------------------- */

  get nivelSeleccionado(): number | null {
    return this.form?.nivel ?? null;
  }

  get nivelMasivo(): number | null {
    return this.masivo?.nivel ?? null;
  }

  /** Elige un nivel 1-5 en el formulario individual. */
  elegirNivel(n: number) {
    if (this.soloObservaciones) return;
    this.form.nivel = n;
    if (!this.form.resultado || this.resultadoEsAutomatico(this.form.resultado)) {
      this.form.resultado = this.resultadoAutomatico(n);
    }
  }

  elegirNivelMasivo(n: number) {
    if (this.soloObservaciones) return;
    this.masivo.nivel = n;
    if (!this.masivo.resultado || this.resultadoEsAutomatico(this.masivo.resultado)) {
      this.masivo.resultado = this.resultadoAutomatico(n);
    }
  }

  /** Resultado derivado del nivel: >=4 Aprobado, 3 En proceso, resto Necesita apoyo. */
  resultadoAutomatico(nivel?: number | null): string {
    if (!nivel) return '';
    if (nivel >= 4) return 'Aprobado';
    if (nivel === 3) return 'En proceso';
    return 'Necesita apoyo';
  }

  private resultadoEsAutomatico(valor: string): boolean {
    return ['Aprobado', 'En proceso', 'Necesita apoyo'].includes(valor || '');
  }

  etiquetaNivel(nivel?: number | null): string {
    if (!nivel) return 'Solo obs.';
    return this.niveles.find(n => n.nivel === nivel)?.etiqueta || '';
  }

  badgeNivel(e: Evaluacion): string {
    return e.nivel ? `badge-nivel-${e.nivel}` : 'badge-soloobs';
  }

  /* --------------------- registro / edición individual ------------------ */

  abrirCrear() {
    this.editando = false;
    this.editId = 0;
    this.errorModal = '';
    const nivelInicial = this.soloObservaciones ? null : 4;
    this.form = {
      id_participante: this.porPrograma(this.participantes)[0]?.id_participante || null,
      fecha: new Date().toISOString().slice(0, 10),
      tipo_evaluacion: this.tipoDeSeccion,
      nivel: nivelInicial,
      resultado: nivelInicial ? this.resultadoAutomatico(nivelInicial) : '',
      observaciones: '',
      id_grupo: this.modo === 'grupo' ? (this.masivo?.id_grupo || null) : null,
      id_programacion: this.modo === 'actividad' ? (this.masivo?.id_programacion || null) : null
    };
    this.participantesForm = this.porPrograma(this.participantes);
    this.cargarParticipantesForm();
    this.mostrarModal = true;
  }

  abrirEditar(e: Evaluacion) {
    this.editando = true;
    this.editId = e.id_evaluacion;
    this.errorModal = '';
    this.form = {
      id_participante: e.id_participante,
      fecha: e.fecha || new Date().toISOString().slice(0, 10),
      tipo_evaluacion: e.tipo_evaluacion || 'Participante',
      nivel: e.nivel ?? null,
      resultado: e.resultado_general || '',
      observaciones: e.observaciones || '',
      id_programacion: e.id_programacion || null,
      id_grupo: e.id_grupo || null
    };
    this.participantesForm = this.porPrograma(this.participantes);
    if (!this.participantesForm.some(p => p.id_participante === e.id_participante)) {
      this.participantesForm = [
        { id_participante: e.id_participante, nombre: e.participante, programa: e.programa || '', categoria: '' } as ParticipanteMonitoreo,
        ...this.participantesForm
      ];
    }
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.errorModal = '';
  }

  /**
   * Filtros de participantes según la sección:
   *  - Actividad → participantes de esa actividad.
   *  - Grupo → participantes asignados al grupo.
   *  - Individual → todos los participantes.
   */
  private filtrosParticipantes(idGrupo?: number | null, idProgramacion?: number | null): any {
    if (this.modo === 'actividad' && idProgramacion) return { id_programacion: idProgramacion };
    if (this.modo === 'grupo' && idGrupo) return { id_grupo: idGrupo };
    return null;
  }

  get grupoForm(): GrupoMonitoreo | null {
    return this.grupos.find(g => g.id_grupo === this.form?.id_grupo) || null;
  }

  get grupoMasivo(): GrupoMonitoreo | null {
    return this.grupos.find(g => g.id_grupo === this.masivo?.id_grupo) || null;
  }

  private cargarParticipantesForm() {
    const filtros = this.filtrosParticipantes(this.form.id_grupo, this.form.id_programacion);
    if (!filtros) {
      this.participantesForm = this.esLoteForm ? [] : this.porPrograma(this.participantes);
      this.falloParticipantesForm = false;
      this.asignarParticipantePorDefecto();
      this.selForm = this.form.id_participante ? new Set([this.form.id_participante]) : new Set<number>();
      return;
    }
    this.falloParticipantesForm = false;
    this.evaluacionService.participantes(filtros).pipe(retry({ count: 2, delay: 1000 }), timeout(15000)).subscribe({
      next: p => {
        const lista = this.porPrograma(p);
        this.participantesForm = lista;
        this.falloParticipantesForm = false;
        if (this.esLoteForm) {
          this.selForm = new Set(lista.map(x => x.id_participante));
        } else {
          if (!lista.some(x => x.id_participante === this.form.id_participante)) {
            this.form.id_participante = lista[0]?.id_participante || null;
          }
          this.selForm = new Set(this.form.id_participante ? [this.form.id_participante] : []);
        }
      },
      error: () => {
        this.falloParticipantesForm = true;
        this.participantesForm = this.esLoteForm ? [] : this.porPrograma(this.participantes);
        this.asignarParticipantePorDefecto();
        this.selForm = new Set();
      }
    });
  }

  /** Si el formulario individual quedó sin participante (lista lenta o fallo), usa el primero disponible. */
  private asignarParticipantePorDefecto() {
    if (this.esLoteForm || this.form.id_participante || !this.participantesForm.length) return;
    this.form.id_participante = this.participantesForm[0].id_participante;
  }

  reintentarParticipantes() {
    this.cargarParticipantesForm();
  }

  /** En seccion Grupo/Actividad (alta) se evalúan todos los participantes marcados. */
  get esLoteForm(): boolean {
    return !this.editando && (this.modo === 'grupo' || this.modo === 'actividad');
  }

  toggleSelForm(id: number) {
    if (this.selForm.has(id)) this.selForm.delete(id);
    else this.selForm.add(id);
  }

  get todosSelForm(): boolean {
    return this.participantesForm.length > 0 &&
      this.participantesForm.every(p => this.selForm.has(p.id_participante));
  }

  alternarTodosSelForm() {
    if (this.todosSelForm) this.selForm = new Set();
    else this.selForm = new Set(this.participantesForm.map(p => p.id_participante));
  }

  get faltaSeleccionSeccion(): boolean {
    if (!this.esLoteForm) return false;
    if (this.modo === 'grupo') return !this.form.id_grupo;
    if (this.modo === 'actividad') return !this.form.id_programacion;
    return false;
  }

  cambiaGrupoOCategoria() {
    this.form.id_participante = null;
    this.cargarParticipantesForm();
  }

  private refrescarSeleccion() {
    if (!this.masivo) return;
    if (this.modo === 'grupo' && !this.masivo.id_grupo && this.grupos.length) {
      this.masivo.id_grupo = this.grupos[0].id_grupo;
      this.cargarParticipantesMasivo();
    } else if (this.modo === 'actividad' && !this.masivo.id_programacion && this.actividades.length) {
      this.masivo.id_programacion = this.actividades[0].id_programacion;
      this.cargarParticipantesMasivo();
    }
  }

  guardar() {
    this.errorModal = '';
    if (!this.editando && this.modo === 'grupo' && !this.form.id_grupo) {
      this.errorModal = 'Seleccione el grupo de la evaluación.';
      return;
    }
    if (!this.editando && this.modo === 'actividad' && !this.form.id_programacion) {
      this.errorModal = 'Seleccione la actividad de la evaluación.';
      return;
    }
    if (this.esLoteForm) {
      if (this.selForm.size === 0) {
        this.errorModal = 'Marque al menos un participante.';
        return;
      }
    } else if (!this.form.id_participante) {
      this.errorModal = 'Seleccione un participante.';
      return;
    }
    if (!this.form.fecha) {
      this.errorModal = 'La fecha de la evaluación es obligatoria.';
      return;
    }
    if (this.soloObservaciones) {
      if (!this.form.observaciones || !this.form.observaciones.trim()) {
        this.errorModal = 'Registre la observación de cumplimiento.';
        return;
      }
    } else if (!this.form.nivel) {
      this.errorModal = 'Seleccione el nivel de la evaluación (1 a 5).';
      return;
    }
    this.saving = true;
    this.dialogoTipo = this.editando ? 'update' : (this.esLoteForm ? 'lote' : 'create');
    this.dialogoLoteNivel = this.soloObservaciones ? null : (this.form.nivel || null);
    this.dialogoLoteCantidad = this.selForm.size;
    this.mostrarDialogo = true;
  }

  ejecutarAccion() {
    this.mostrarDialogo = false;
    if (this.dialogoTipo === 'delete') {
      const item = this.dialogoItem!;
      this.evaluacionService.eliminar(item.id_evaluacion).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', `Evaluación de ${item.participante} eliminada.`);
          this.load();
          if (this.mostrarDetalleTarjeta) this.cerrarDetalleTarjeta();
          this.mostrarFicha = false;
          this.saving = false;
        },
        error: err => {
          this.showToast('error', this.mensajeError(err, 'No se pudo eliminar la evaluación.'));
          this.saving = false;
        }
      });
      return;
    }
    if (this.dialogoTipo === 'lote') {
      this.ejecutarLote();
      return;
    }
    const nivel = this.soloObservaciones ? null : (this.form.nivel || null);
    const payload = {
      id_participante: this.form.id_participante,
      fecha: this.form.fecha,
      tipo_evaluacion: this.form.tipo_evaluacion || this.tipoDeSeccion,
      id_programacion: this.form.id_programacion || null,
      id_grupo: this.form.id_grupo || null,
      nivel,
      resultado: (this.form.resultado || '').trim() || null,
      observaciones: (this.form.observaciones || '').trim() || null
    };
    if (this.editando) {
      this.evaluacionService.actualizar(this.editId, payload).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', 'Evaluación actualizada.');
          this.load();
          if (this.mostrarDetalleTarjeta) this.cerrarDetalleTarjeta();
          this.cerrarModal();
          this.saving = false;
        },
        error: err => {
          this.errorModal = this.mensajeError(err, 'No se pudo actualizar la evaluación.');
          this.saving = false;
        }
      });
    } else if (this.esLoteForm) {
      const filas = Array.from(this.selForm).map(id => ({
        id_participante: id,
        nivel,
        resultado: (this.form.resultado || '').trim() || null,
        observaciones: (this.form.observaciones || '').trim() || null
      }));
      const lote: any = {
        fecha: this.form.fecha,
        tipo_evaluacion: this.form.tipo_evaluacion || this.tipoDeSeccion,
        participantes: filas
      };
      if (this.modo === 'grupo') lote.id_grupo = this.form.id_grupo;
      if (this.modo === 'actividad') lote.id_programacion = this.form.id_programacion;
      this.evaluacionService.crearLote(lote).pipe(timeout(20000)).subscribe({
        next: res => {
          this.showToast('success', res.mensaje || `${res.creados} evaluación(es) guardada(s).`);
          this.load();
          this.cerrarModal();
          this.saving = false;
        },
        error: err => {
          this.errorModal = this.mensajeError(err, 'No se pudo registrar la evaluación.');
          this.saving = false;
        }
      });
    } else {
      this.evaluacionService.crear(payload).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', 'Evaluación registrada correctamente.');
          this.load();
          this.cerrarModal();
          this.saving = false;
        },
        error: err => {
          this.errorModal = this.mensajeError(err, 'No se pudo registrar la evaluación.');
          this.saving = false;
        }
      });
    }
  }

  confirmarEliminar(e: Evaluacion) {
    this.dialogoTipo = 'delete';
    this.dialogoItem = e;
    this.mostrarDialogo = true;
    this.saving = true;
  }

  cancelarDialogo() {
    this.mostrarDialogo = false;
    this.saving = false;
  }

  /* ------------------------------ masivo -------------------------------- */

  abrirMasivo() {
    this.iniciarMasivo();
    this.errorMasivo = '';
    this.mostrarMasivo = true;
  }

  cerrarMasivo() {
    this.mostrarMasivo = false;
  }

  iniciarMasivo() {
    this.seleccionados = new Set();
    this.buscarParticipante = '';
    this.errorMasivo = '';
    const nivelInicial = this.soloObservaciones ? null : 4;
    this.masivo = {
      fecha: new Date().toISOString().slice(0, 10),
      nivel: nivelInicial,
      resultado: nivelInicial ? this.resultadoAutomatico(nivelInicial) : '',
      observaciones: '',
      id_grupo: null,
      id_programacion: null
    };
    if (this.modo === 'grupo' && this.grupos.length) {
      this.masivo.id_grupo = this.grupos[0].id_grupo;
      this.cargarParticipantesMasivo();
    } else if (this.modo === 'actividad' && this.actividades.length) {
      this.masivo.id_programacion = this.actividades[0].id_programacion;
      this.cargarParticipantesMasivo();
    }
  }

  cargarParticipantesMasivo() {
    this.seleccionados = new Set();
    this.cargandoParticipantes = true;
    const filtros = this.filtrosParticipantes(this.masivo.id_grupo, this.masivo.id_programacion) || {};
    this.evaluacionService.participantes(filtros).pipe(retry({ count: 2, delay: 1000 }), timeout(15000)).subscribe({
      next: p => {
        const lista = this.porPrograma(p);
        this.participantesMasivos = lista;
        this.seleccionados = new Set(lista.map(x => x.id_participante));
        this.cargandoParticipantes = false;
      },
      error: err => {
        this.participantesMasivos = [];
        this.cargandoParticipantes = false;
        this.showToast('error', this.mensajeError(err, 'No se pudieron cargar los participantes.'));
      }
    });
  }

  get participantesVisibles(): ParticipanteMonitoreo[] {
    if (!this.buscarParticipante) return this.participantesMasivos;
    const s = this.buscarParticipante.toLowerCase();
    return this.participantesMasivos.filter(p => p.nombre.toLowerCase().includes(s));
  }

  toggleSeleccion(id: number) {
    if (this.seleccionados.has(id)) this.seleccionados.delete(id);
    else this.seleccionados.add(id);
  }

  get todosSeleccionados(): boolean {
    return this.participantesVisibles.length > 0 &&
      this.participantesVisibles.every(p => this.seleccionados.has(p.id_participante));
  }

  seleccionarTodos() {
    if (this.todosSeleccionados) {
      this.participantesVisibles.forEach(p => this.seleccionados.delete(p.id_participante));
    } else {
      this.participantesVisibles.forEach(p => this.seleccionados.add(p.id_participante));
    }
  }

  guardarMasivo() {
    this.errorMasivo = '';
    if (this.modo === 'individual') {
      this.showToast('warning', 'Seleccione un modo de registro masivo (Grupo o Actividad).');
      return;
    }
    if (!this.masivo.fecha) {
      this.errorMasivo = 'La fecha de la evaluación es obligatoria.';
      return;
    }
    if (this.seleccionados.size === 0) {
      this.errorMasivo = 'Debe seleccionar al menos un participante.';
      return;
    }
    if (this.soloObservaciones) {
      if (!this.masivo.observaciones || !this.masivo.observaciones.trim()) {
        this.errorMasivo = 'Registre la observación de cumplimiento.';
        return;
      }
    } else if (!this.masivo.nivel) {
      this.errorMasivo = 'Seleccione el nivel de la evaluación (1 a 5).';
      return;
    }
    this.saving = true;
    this.dialogoTipo = 'lote';
    this.dialogoLoteNivel = this.soloObservaciones ? null : (this.masivo.nivel || null);
    this.dialogoLoteCantidad = this.seleccionados.size;
    this.mostrarDialogo = true;
  }

  private ejecutarLote() {
    const nivel = this.soloObservaciones ? null : (this.masivo.nivel || null);
    const resultado = (this.masivo.resultado || '').trim() || null;
    const observaciones = (this.masivo.observaciones || '').trim() || null;
    const payload: any = {
      fecha: this.masivo.fecha,
      tipo_evaluacion: this.modo === 'actividad' ? 'Actividad' : 'Grupo',
      participantes: Array.from(this.seleccionados).map(id => ({
        id_participante: id,
        nivel,
        resultado,
        observaciones
      }))
    };
    if (this.modo === 'grupo') payload.id_grupo = this.masivo.id_grupo;
    if (this.modo === 'actividad') payload.id_programacion = this.masivo.id_programacion;
    this.evaluacionService.crearLote(payload).pipe(timeout(20000)).subscribe({
      next: res => {
        this.showToast('success', res.mensaje || `${res.creados} evaluación(es) guardada(s).`);
        this.seleccionados = new Set();
        this.mostrarMasivo = false;
        this.load();
        this.saving = false;
      },
      error: err => {
        this.errorMasivo = this.mensajeError(err, 'No se pudo guardar la evaluación masiva.');
        this.saving = false;
      }
    });
  }

  /* ------------------------------- ficha -------------------------------- */

  verFicha(e: Evaluacion) {
    this.fichaItem = e;
    this.cargandoFicha = true;
    this.mostrarFicha = true;
    this.evaluacionService.obtenerPorId(e.id_evaluacion).pipe(timeout(15000)).subscribe({
      next: f => { this.fichaItem = f; this.cargandoFicha = false; },
      error: () => { this.cargandoFicha = false; this.showToast('error', 'No se pudo cargar la ficha de la evaluación.'); }
    });
  }

  /* ----------------------------- reportes ------------------------------- */

  generarReporte(tipo: 'general' | 'educacion' | 'mujeres') {
    this.mostrarMenuReporte = false;
    if (!this.puede('Generar Reportes')) {
      this.showToast('error', 'No tiene permiso para generar reportes.');
      return;
    }
    const tipos = this.tiposDeSeccion();
    let lista = this.data.filter(e => tipos.includes(e.tipo_evaluacion || ''));
    let titulo = this.modo === 'individual'
      ? 'Reporte General de Evaluaciones'
      : `Reporte de Evaluaciones - ${this.etiquetaSeccion}`;
    if (tipo === 'educacion') {
      lista = this.data.filter(e => (e.programa || '').toLowerCase().includes('educac'));
      titulo = 'Evaluaciones - Programa de Educación';
    } else if (tipo === 'mujeres') {
      lista = this.data.filter(e => (e.programa || '').toLowerCase().includes('mujer'));
      titulo = 'Evaluaciones - Programa de Mujeres';
    }
    this.reporteHtml = this.generarHtmlReporte(lista, titulo);
    this.reporteTitulo = titulo;
    this.mostrarReporte = true;
  }

  reporteIndividual(e: Evaluacion) {
    if (!this.puede('Generar Reportes')) {
      this.showToast('error', 'No tiene permiso para generar reportes.');
      return;
    }
    const titulo = `Ficha de Evaluación: ${e.participante}`;
    this.reporteHtml = this.generarHtmlReporte([e], titulo, true);
    this.reporteTitulo = titulo;
    this.mostrarReporte = true;
  }

  private generarHtmlReporte(lista: Evaluacion[], titulo: string, detalle = false): string {
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    const rows = lista.map((e, i) => `
      <tr style="border-bottom:1px solid #E2E8F0;">
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${i + 1}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#0F172A;">${this.esc(e.participante)}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1E3278;">${this.esc(e.programa) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(e.fecha) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(e.tipo_evaluacion) || '-'}</td>
        <td style="padding:10px 14px;">
          <span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${this.nivelBg(e)};color:${this.nivelColor(e)};">${this.esc(e.nivel ? `Nivel ${e.nivel}` : 'Solo obs.')}</span>
        </td>
        <td style="padding:10px 14px;font-size:12px;color:#334155;">${this.esc(e.resultado_general) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(e.grupo) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(e.actividad) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(e.observaciones) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(e.evaluado_por) || '-'}</td>
      </tr>`).join('');

    const cabecera = `<div style="font-family:Arial,sans-serif;color:#1e293b;background:#fff;margin:0;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 32px;border-bottom:3px solid #F5A623;">
        <div style="display:flex;align-items:center;gap:16px;">
          <img src="/LOGO_ANADESA.jpg" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">
          <div style="border-left:3px solid #F5A623;padding-left:16px;">
            <h1 style="font-size:17px;color:#1E3278;margin:0;font-weight:700;">Sistema de Gestión ANADESA</h1>
            <p style="font-size:13px;color:#64748B;margin:4px 0 0 0;">${titulo}</p>
          </div>
        </div>
        <div style="text-align:right;font-size:12px;color:#64748B;">
          <div style="color:#1E3278;font-weight:600;">📅 ${fecha}</div>
          <div style="margin-top:4px;">Total: <strong style="color:#F5A623;">${lista.length}</strong></div>
        </div>
      </div>`;

    const tabla = `<div style="padding:20px 32px;">
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background:linear-gradient(135deg,#1E3278 0%,#F5A623 100%);color:#fff;">
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">No.</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Participante</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Programa</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Fecha</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Tipo</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Nivel</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Resultado</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Grupo</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Actividad</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Observaciones</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Evaluado por</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="11" style="padding:24px;text-align:center;color:#94A3B8;">Sin datos</td></tr>'}</tbody>
      </table>
    </div>`;

    const resumen = detalle ? '' : this.resumenHtml(lista);
    const pie = `<div style="margin-top:30px;padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
      <div style="font-size:11px;color:#64748B;display:flex;justify-content:space-between;">
        <span><strong style="color:#1E3278;">Asociación ANADESA</strong> | Santiago Atitlán, Sololá</span>
        <span style="color:#F5A623;font-style:italic;">Más oportunidades, mejores vidas</span>
      </div>
    </div></div>`;

    return cabecera + tabla + resumen + pie;
  }

  private resumenHtml(lista: Evaluacion[]): string {
    const celdas = this.niveles.map(n => {
      const total = lista.filter(e => e.nivel === n.nivel).length;
      const pct = lista.length ? Math.round((total / lista.length) * 100) : 0;
      return `<div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:14px 16px;">
        <div style="font-size:11px;color:#64748B;text-transform:uppercase;font-weight:600;">Nivel ${n.nivel} · ${n.etiqueta}</div>
        <div style="font-size:22px;font-weight:700;color:#1E3278;margin-top:6px;">${total}</div>
        <div style="font-size:11px;color:#F5A623;font-weight:600;margin-top:2px;">${pct}%</div>
      </div>`;
    }).join('');
    const soloObs = lista.filter(e => !e.nivel).length;
    const pctObs = lista.length ? Math.round((soloObs / lista.length) * 100) : 0;
    const celdaObs = `<div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:14px 16px;">
      <div style="font-size:11px;color:#64748B;text-transform:uppercase;font-weight:600;">Solo obs.</div>
      <div style="font-size:22px;font-weight:700;color:#92400E;margin-top:6px;">${soloObs}</div>
      <div style="font-size:11px;color:#F5A623;font-weight:600;margin-top:2px;">${pctObs}%</div>
    </div>`;
    return `<div style="padding:0 32px 8px;">
      <h3 style="font-size:14px;color:#1E3278;margin:0 0 12px 0;">Resumen por nivel de evaluación (puntuación = nivel × 20)</h3>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;">${celdas}${celdaObs}</div>
    </div>`;
  }

  private esc(v?: string): string {
    if (!v) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  nivelBg(e: Evaluacion): string {
    const map: Record<string, string> = {
      1: '#FEF6E7',
      2: '#FEF3C7',
      3: '#EBF5FB',
      4: '#DCFCE7',
      5: '#CCFBF1'
    };
    return (e.nivel && map[e.nivel]) || '#FEF3C7';
  }

  nivelColor(e: Evaluacion): string {
    const map: Record<string, string> = {
      1: '#F5A623',
      2: '#B45309',
      3: '#1E3278',
      4: '#0E6B23',
      5: '#0F766E'
    };
    return (e.nivel && map[e.nivel]) || '#92400E';
  }

  /* ------------------------------ utilidades ---------------------------- */

  nombreParticipante(id: number): string {
    return this.participantesForm.find(p => p.id_participante === id)?.nombre
      || this.participantes.find(p => p.id_participante === id)?.nombre
      || 'el participante seleccionado';
  }

  private mensajeError(err: any, fallback: string): string {
    return err?.error?.message || fallback;
  }

  showToast(type: string, message: string) {
    this.toasts.push({ type, message });
    setTimeout(() => this.toasts.shift(), 4000);
  }
}

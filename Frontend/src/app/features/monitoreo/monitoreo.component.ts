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
  MonitoreoService,
  Monitoreo,
  ParticipanteMonitoreo,
  GrupoMonitoreo,
  ActividadMonitoreo
} from '../../core/services/monitoreo.service';

const MODULO_MONITOREO = 6;

/** Una "cajita" de la lista agrupada: una sola por actividad o por grupo. */
export interface TarjetaMonitoreo {
  clave: number;
  tipo: 'Actividad' | 'Grupo';
  titulo: string;
  subtitulo: string;
  fecha: string;
  responsable: string;
  programa: string;
  resumen: string;
  registros: Monitoreo[];
}

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, ProgramasTabsComponent, ReportePreviewComponent],
  templateUrl: './monitoreo.component.html',
  styleUrls: ['./monitoreo.component.css']
})
export class MonitoreoComponent implements OnInit {
  /* ------------------------------ permisos ------------------------------ */
  permisos: string[] = [];

  /* ------------------------------- datos -------------------------------- */
  data: Monitoreo[] = [];
  loading = true;
  error = '';
  errorModal = '';
  falloParticipantesForm = false;
  errorMasivo = '';

  /* ------------------------------ filtros ------------------------------- */
  search = '';
  fPrograma = '';
  fParticipacion = '';
  sortDir: 'asc' | 'desc' = 'asc';

  /** Pestaña de programa activa (Educación / Mujeres). */
  subTab: ProgramaClave = 'educacion';

  /* -------------------------- sección / modo ---------------------------- */
  modo: 'individual' | 'grupo' | 'actividad' = 'individual';

  private readonly seccionesValidas = ['individual', 'grupo', 'actividad'];
  private readonly tipoPorSeccion: Record<string, string> = {
    individual: 'Individual',
    grupo: 'Grupo',
    actividad: 'Actividad'
  };

  /* ------------------------- apoyos del modulo -------------------------- */
  grupos: GrupoMonitoreo[] = [];
  actividades: ActividadMonitoreo[] = [];
  participantes: ParticipanteMonitoreo[] = [];

  /* -------------------------- formulario individual --------------------- */
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
  dialogoItem: Monitoreo | null = null;

  /* ------------------------------ ficha --------------------------------- */
  mostrarFicha = false;
  fichaItem: Monitoreo | null = null;
  cargandoFicha = false;

  /* ------------------- detalle de tarjeta (actividad/grupo) ------------- */
  mostrarDetalleTarjeta = false;
  detalleTarjeta: TarjetaMonitoreo | null = null;

  /* ----------------------------- reportes ------------------------------- */
  mostrarReporte = false;
  reporteHtml = '';
  reporteTitulo = '';
  mostrarMenuReporte = false;

  /* ------------------------------ toasts -------------------------------- */
  toasts: { type: string; message: string }[] = [];

  niveles = ['Excelente', 'Buena', 'Regular', 'Baja', 'No participó'];
  tiposMonitoreo = ['Individual', 'Grupo', 'Actividad'];

  badgeNivel: Record<string, string> = {
    'Excelente': 'badge-excelente',
    'Buena': 'badge-buena',
    'Regular': 'badge-regular',
    'Baja': 'badge-baja',
    'No participó': 'badge-nopart'
  };

  constructor(
    private monitoreoService: MonitoreoService,
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
      this.data.filter(m => this.alcanceService.coincide(m.programa, clave)).length;
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
    this.permisos = this.permisoService.permisosDe(MODULO_MONITOREO);
    this.permisoService.cargar().subscribe({
      next: () => (this.permisos = this.permisoService.permisosDe(MODULO_MONITOREO)),
      error: () => (this.permisos = this.permisoService.permisosDe(MODULO_MONITOREO))
    });
    this.load();
    this.monitoreoService.grupos().pipe(timeout(15000), retry({ count: 2, delay: 1200 })).subscribe({
      next: g => { this.grupos = g; this.refrescarSeleccion(); },
      error: () => this.falloLista()
    });
    this.monitoreoService.actividades().pipe(timeout(15000), retry({ count: 2, delay: 1200 })).subscribe({
      next: a => { this.actividades = a; this.refrescarSeleccion(); },
      error: () => this.falloLista()
    });
    this.monitoreoService.participantes().pipe(timeout(15000), retry({ count: 2, delay: 1200 })).subscribe({
      next: p => {
        this.participantes = p;
        if (this.mostrarModal && !this.esLoteForm) {
          this.participantesForm = this.porPrograma(p);
          this.asignarParticipantePorDefecto();
        }
      },
      error: () => this.falloLista()
    });
    this.participantesForm = this.porPrograma(this.participantes);
    this.iniciarMasivo();
  }

  private avisoListas = false;

  /** Un solo aviso si falla la carga de grupos/actividades/participantes. */
  private falloLista() {
    if (this.avisoListas) return;
    this.avisoListas = true;
    this.showToast('error', 'No se pudieron cargar grupos, actividades o participantes. Verifique la conexión y recargue la página.');
  }

  /**
   * Filtros de participantes según la sección:
   *  - Actividad → participantes de esa actividad (asistencia real).
   *  - Grupo → participantes del PROGRAMA al que pertenece el grupo.
   *  - Individual → todos los participantes.
   */
  private filtrosParticipantes(idGrupo?: number | null, idProgramacion?: number | null): any {
    if (this.modo === 'actividad' && idProgramacion) return { id_programacion: idProgramacion };
    if (this.modo === 'grupo' && idGrupo) return { id_grupo: idGrupo };
    return null;
  }

  /** Grupo seleccionado en el formulario individual. */
  get grupoForm(): GrupoMonitoreo | null {
    return this.grupos.find(g => g.id_grupo === this.form?.id_grupo) || null;
  }

  /** Grupo seleccionado en el registro masivo. */
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
    this.monitoreoService.participantes(filtros).pipe(retry({ count: 2, delay: 1000 }), timeout(15000)).subscribe({
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

  /** En seccion Grupo/Actividad (alta) se registran todos los participantes marcados. */
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

  /** Falta elegir grupo/actividad antes de listar los participantes (alta en seccion). */
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

  /** Rellena la selección del modo masivo cuando los catálogos terminan de cargar. */
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

  puede(permiso: string): boolean {
    return this.permisos.includes(permiso);
  }

  puedeRegistrar(): boolean {
    return this.puede('Crear') || this.puede('Monitorear');
  }

  /* ----------------------------- secciones ------------------------------ */

  /** Aplica la sección elegida en el menú lateral (/monitoreo/:tipo). */
  private aplicarSeccion(seccion?: string) {
    const s = (seccion || '').toLowerCase();
    this.modo = (this.seccionesValidas.includes(s) ? s : 'individual') as typeof this.modo;
  }

  get etiquetaSeccion(): string {
    return {
      individual: 'Individual',
      grupo: 'Grupo',
      actividad: 'Actividad'
    }[this.modo];
  }

  get tipoDeSeccion(): string {
    return this.tipoPorSeccion[this.modo] || 'Individual';
  }

  /** Tipos de monitoreo que pertenecen a la sección actual (lista + reportes). */
  private tiposDeSeccion(): string[] {
    return this.modo === 'individual'
      ? ['Individual', 'Participante', 'Area/Categoria']
      : [this.tipoPorSeccion[this.modo]];
  }

  /** Tipos disponibles en el formulario: fijo al crear, completo al editar. */
  get tiposFormulario(): string[] {
    if (!this.editando) return [this.tipoDeSeccion];
    return Array.from(new Set([...this.tiposMonitoreo, this.form.tipo_monitoreo].filter(Boolean)));
  }

  /** Título de la tarjeta según la sección (actividad / grupo / participante). */
  tituloCard(m: Monitoreo): string {
    if (this.modo === 'actividad') return m.actividad || 'Actividad sin nombre';
    if (this.modo === 'grupo') return m.grupo || 'Grupo sin nombre';
    return m.participante || 'Sin participante';
  }

  /** Línea secundaria de la tarjeta. */
  subtituloCard(m: Monitoreo): string {
    return this.modo === 'individual'
      ? (m.programa || 'Sin programa')
      : (m.participante || 'Sin participante');
  }

  /** En Actividad y Grupo la lista se agrupa: una sola cajita por actividad / por grupo. */
  get esAgrupado(): boolean {
    return this.modo === 'actividad' || this.modo === 'grupo';
  }

  get tarjetas(): TarjetaMonitoreo[] {
    if (!this.esAgrupado) return [];
    const grupos = new Map<number, Monitoreo[]>();
    for (const m of this.filtered) {
      const clave = this.modo === 'actividad' ? (m.id_programacion || 0) : (m.id_grupo || 0);
      const arr = grupos.get(clave) || [];
      arr.push(m);
      grupos.set(clave, arr);
    }
    const lista: TarjetaMonitoreo[] = [];
    grupos.forEach((registros, clave) => {
      const primero = registros[0];
      const esActividad = this.modo === 'actividad';
      lista.push({
        clave,
        tipo: esActividad ? 'Actividad' : 'Grupo',
        titulo: esActividad
          ? (primero.actividad || 'Actividad sin nombre')
          : (primero.grupo || 'Grupo sin nombre'),
        subtitulo: esActividad
          ? (primero.grupo || '')
          : (primero.programa || ''),
        fecha: registros.map(r => r.fecha || '').filter(Boolean).sort().pop() || '',
        responsable: primero.registrado_por || '',
        programa: primero.programa || '',
        resumen: this.resumenNiveles(registros),
        registros
      });
    });
    return lista.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }

  /** Resumen de niveles de participación de los registros de la tarjeta. */
  resumenNiveles(registros: Monitoreo[]): string {
    const conteo: Record<string, number> = {};
    registros.forEach(r => {
      const n = r.participacion || 'Sin nivel';
      conteo[n] = (conteo[n] || 0) + 1;
    });
    return Object.keys(conteo).map(n => `${n}: ${conteo[n]}`).join(' · ');
  }

  verDetalleTarjeta(t: TarjetaMonitoreo) {
    this.detalleTarjeta = t;
    this.mostrarDetalleTarjeta = true;
  }

  cerrarDetalleTarjeta() {
    this.mostrarDetalleTarjeta = false;
    this.detalleTarjeta = null;
  }

  reporteTarjeta(t: TarjetaMonitoreo) {
    if (!this.puede('Generar Reportes')) {
      this.showToast('error', 'No tiene permiso para generar reportes.');
      return;
    }
    const titulo = `${t.tipo === 'Actividad' ? 'Monitoreo de Actividad' : 'Monitoreo de Grupo'}: ${t.titulo}`;
    this.reporteHtml = this.generarHtmlReporte(t.registros, titulo);
    this.reporteTitulo = titulo;
    this.mostrarReporte = true;
  }

  load() {
    this.loading = true;
    this.error = '';
    this.monitoreoService.obtenerTodos().pipe(timeout(15000)).subscribe({
      next: d => { this.data = d; this.loading = false; this.consumirReportePendiente(); },
      error: () => { this.error = 'No se pudieron cargar los registros de monitoreo.'; this.loading = false; }
    });
  }

  /* ------------------------------- filtros ------------------------------ */

  get filtered(): Monitoreo[] {
    let list = [...this.data];
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(m =>
        (m.participante || '').toLowerCase().includes(s) ||
        (m.actividad || '').toLowerCase().includes(s) ||
        (m.grupo || '').toLowerCase().includes(s) ||
        (m.observaciones || '').toLowerCase().includes(s)
      );
    }
    if (this.fPrograma) list = list.filter(m => m.programa === this.fPrograma);
    if (this.fParticipacion) list = list.filter(m => m.participacion === this.fParticipacion);
    const tipos = this.tiposDeSeccion();
    list = list.filter(m => tipos.includes(m.tipo_monitoreo || ''));
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
    return Array.from(new Set(this.data.map(m => m.programa).filter(Boolean)));
  }

  /* --------------------- registro / edición individual ------------------ */

  abrirCrear() {
    this.editando = false;
    this.editId = 0;
    this.errorModal = '';
    this.form = {
      id_participante: this.porPrograma(this.participantes)[0]?.id_participante || null,
      fecha: new Date().toISOString().slice(0, 10),
      tipo_monitoreo: this.tipoDeSeccion,
      participacion: 'Buena',
      observaciones: '',
      id_grupo: this.modo === 'grupo' ? (this.masivo?.id_grupo || null) : null,
      id_programacion: this.modo === 'actividad' ? (this.masivo?.id_programacion || null) : null
    };
    this.participantesForm = this.porPrograma(this.participantes);
    this.cargarParticipantesForm();
    this.mostrarModal = true;
  }

  abrirEditar(m: Monitoreo) {
    this.editando = true;
    this.editId = m.id_monitoreo;
    this.errorModal = '';
    this.form = {
      id_participante: m.id_participante,
      fecha: m.fecha || new Date().toISOString().slice(0, 10),
      tipo_monitoreo: m.tipo_monitoreo || 'Individual',
      participacion: m.participacion || '',
      observaciones: m.observaciones || '',
      id_actividad: m.id_actividad || null,
      id_programacion: m.id_programacion || null,
      id_grupo: m.id_grupo || null
    };
    this.participantesForm = this.porPrograma(this.participantes);
    if (!this.participantesForm.some(p => p.id_participante === m.id_participante)) {
      this.participantesForm = [
        { id_participante: m.id_participante, nombre: m.participante, programa: m.programa || '', categoria: '' } as ParticipanteMonitoreo,
        ...this.participantesForm
      ];
    }
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.errorModal = '';
  }

  guardar() {
    this.errorModal = '';
    if (!this.editando && this.modo === 'grupo' && !this.form.id_grupo) {
      this.errorModal = 'Seleccione el grupo del monitoreo.';
      return;
    }
    if (!this.editando && this.modo === 'actividad' && !this.form.id_programacion) {
      this.errorModal = 'Seleccione la actividad del monitoreo.';
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
      this.errorModal = 'La fecha del monitoreo es obligatoria.';
      return;
    }
    if (!this.form.participacion) {
      this.errorModal = 'Seleccione el nivel de participación.';
      return;
    }
    this.saving = true;
    this.dialogoTipo = this.editando ? 'update' : 'create';
    this.mostrarDialogo = true;
  }

  ejecutarAccion() {
    this.mostrarDialogo = false;
    if (this.dialogoTipo === 'delete') {
      const item = this.dialogoItem!;
      this.monitoreoService.eliminar(item.id_monitoreo).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', `Registro de ${item.participante} eliminado.`);
          this.load();
          if (this.mostrarDetalleTarjeta) this.cerrarDetalleTarjeta();
          this.saving = false;
        },
        error: err => {
          this.showToast('error', this.mensajeError(err, 'No se pudo eliminar el registro.'));
          this.saving = false;
        }
      });
      return;
    }
    if (this.dialogoTipo === 'lote') {
      this.ejecutarLote();
      return;
    }
    const payload = {
      id_participante: this.form.id_participante,
      fecha: this.form.fecha,
      participacion: this.form.participacion,
      observaciones: this.form.observaciones || null,
      tipo_monitoreo: this.form.tipo_monitoreo || 'Individual',
      id_actividad: this.form.id_actividad || null,
      id_programacion: this.form.id_programacion || null,
      id_grupo: this.form.id_grupo || null
    };
    if (this.editando) {
      this.monitoreoService.actualizar(this.editId, payload).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', 'Registro de monitoreo actualizado.');
          this.load();
          if (this.mostrarDetalleTarjeta) this.cerrarDetalleTarjeta();
          this.cerrarModal();
          this.saving = false;
        },
        error: err => {
          this.errorModal = this.mensajeError(err, 'No se pudo actualizar el registro.');
          this.saving = false;
        }
      });
    } else if (this.esLoteForm) {
      const lote: any = {
        participantes: Array.from(this.selForm),
        fecha: this.form.fecha,
        participacion: this.form.participacion,
        observaciones: this.form.observaciones || null,
        tipo_monitoreo: this.form.tipo_monitoreo || this.tipoDeSeccion
      };
      if (this.modo === 'grupo') lote.id_grupo = this.form.id_grupo;
      if (this.modo === 'actividad') lote.id_programacion = this.form.id_programacion;
      this.monitoreoService.crearLote(lote).pipe(timeout(20000)).subscribe({
        next: res => {
          this.showToast('success', `${res.creados} monitoreo(s) registrado(s).`);
          this.load();
          this.cerrarModal();
          this.saving = false;
        },
        error: err => {
          this.errorModal = this.mensajeError(err, 'No se pudo registrar el monitoreo.');
          this.saving = false;
        }
      });
    } else {
      this.monitoreoService.crear(payload).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', 'Monitoreo registrado correctamente.');
          this.load();
          this.cerrarModal();
          this.saving = false;
        },
        error: err => {
          this.errorModal = this.mensajeError(err, 'No se pudo registrar el monitoreo.');
          this.saving = false;
        }
      });
    }
  }

  confirmarEliminar(m: Monitoreo) {
    this.dialogoTipo = 'delete';
    this.dialogoItem = m;
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
    this.masivo = {
      fecha: new Date().toISOString().slice(0, 10),
      participacion: 'Buena',
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
    this.monitoreoService.participantes(filtros).pipe(retry({ count: 2, delay: 1000 }), timeout(15000)).subscribe({
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
      this.showToast('warning', 'Seleccione un modo de registro masivo (Área, Grupo o Actividad).');
      return;
    }
    if (!this.masivo.fecha) {
      this.errorMasivo = 'La fecha del monitoreo es obligatoria.';
      return;
    }
    if (this.seleccionados.size === 0) {
      this.errorMasivo = 'Debe seleccionar al menos un participante.';
      return;
    }
    this.saving = true;
    this.dialogoTipo = 'lote';
    this.mostrarDialogo = true;
  }

  private ejecutarLote() {
    const payload: any = {
      participantes: Array.from(this.seleccionados),
      fecha: this.masivo.fecha,
      participacion: this.masivo.participacion,
      observaciones: this.masivo.observaciones || null,
      tipo_monitoreo: this.modo === 'actividad' ? 'Actividad' : 'Grupo'
    };
    if (this.modo === 'grupo') payload.id_grupo = this.masivo.id_grupo;
    if (this.modo === 'actividad') payload.id_programacion = this.masivo.id_programacion;
    this.monitoreoService.crearLote(payload).pipe(timeout(20000)).subscribe({
      next: res => {
        this.showToast('success', `${res.creados} monitoreo(s) guardado(s).`);
        this.seleccionados = new Set();
        this.mostrarMasivo = false;
        this.load();
        this.saving = false;
      },
      error: err => {
        this.errorMasivo = this.mensajeError(err, 'No se pudo guardar el monitoreo masivo.');
        this.saving = false;
      }
    });
  }

  /* ------------------------------- ficha -------------------------------- */

  verFicha(m: Monitoreo) {
    this.fichaItem = m;
    this.cargandoFicha = true;
    this.mostrarFicha = true;
    this.monitoreoService.obtenerPorId(m.id_monitoreo).pipe(timeout(15000)).subscribe({
      next: f => { this.fichaItem = f; this.cargandoFicha = false; },
      error: () => { this.cargandoFicha = false; this.showToast('error', 'No se pudo cargar la ficha del monitoreo.'); }
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
    let lista = this.data.filter(m => tipos.includes(m.tipo_monitoreo || ''));
    let titulo = this.modo === 'individual'
      ? 'Reporte General de Monitoreo'
      : `Reporte de Monitoreo - ${this.etiquetaSeccion}`;
    if (tipo === 'educacion') {
      lista = this.data.filter(m => (m.programa || '').toLowerCase().includes('educac'));
      titulo = 'Monitoreo - Programa de Educación';
    } else if (tipo === 'mujeres') {
      lista = this.data.filter(m => (m.programa || '').toLowerCase().includes('mujer'));
      titulo = 'Monitoreo - Programa de Mujeres';
    }
    this.reporteHtml = this.generarHtmlReporte(lista, titulo);
    this.reporteTitulo = titulo;
    this.mostrarReporte = true;
  }

  reporteIndividual(m: Monitoreo) {
    if (!this.puede('Generar Reportes')) {
      this.showToast('error', 'No tiene permiso para generar reportes.');
      return;
    }
    const titulo = `Ficha de Monitoreo: ${m.participante}`;
    this.reporteHtml = this.generarHtmlReporte([m], titulo, true);
    this.reporteTitulo = titulo;
    this.mostrarReporte = true;
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

  private generarHtmlReporte(lista: Monitoreo[], titulo: string, detalle = false): string {
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    const rows = lista.map((m, i) => `
      <tr style="border-bottom:1px solid #E2E8F0;">
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${i + 1}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#0F172A;">${this.esc(m.participante)}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1E3278;">${this.esc(m.programa) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(m.fecha) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1E3278;">${this.esc(m.tipo_monitoreo) || '-'}</td>
        <td style="padding:10px 14px;">
          <span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${this.nivelBg(m.participacion)};color:${this.nivelColor(m.participacion)};">${this.esc(m.participacion) || '-'}</span>
        </td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(m.grupo) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(m.actividad) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(m.observaciones) || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${this.esc(m.registrado_por) || '-'}</td>
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
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Participación</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Grupo</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Actividad</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Observaciones</th>
            <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Registrado por</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="10" style="padding:24px;text-align:center;color:#94A3B8;">Sin datos</td></tr>'}</tbody>
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

  private resumenHtml(lista: Monitoreo[]): string {
    const niveles = this.niveles;
    const celdas = niveles.map(n => {
      const total = lista.filter(m => m.participacion === n).length;
      const pct = lista.length ? Math.round((total / lista.length) * 100) : 0;
      return `<div style="background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:14px 16px;">
        <div style="font-size:11px;color:#64748B;text-transform:uppercase;font-weight:600;">${n}</div>
        <div style="font-size:22px;font-weight:700;color:#1E3278;margin-top:6px;">${total}</div>
        <div style="font-size:11px;color:#F5A623;font-weight:600;margin-top:2px;">${pct}%</div>
      </div>`;
    }).join('');
    return `<div style="padding:0 32px 8px;">
      <h3 style="font-size:14px;color:#1E3278;margin:0 0 12px 0;">Resumen por nivel de participación</h3>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;">${celdas}</div>
    </div>`;
  }

  private esc(v?: string): string {
    if (!v) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  nivelBg(nivel?: string): string {
    const map: Record<string, string> = {
      'Excelente': '#DCFCE7',
      'Buena': '#EBF5FB',
      'Regular': '#FEF3C7',
      'Baja': '#FEF6E7',
      'No participó': '#FEF6E7'
    };
    return map[nivel || ''] || '#F5F9FD';
  }

  nivelColor(nivel?: string): string {
    const map: Record<string, string> = {
      'Excelente': '#0E6B23',
      'Buena': '#1E3278',
      'Regular': '#B45309',
      'Baja': '#F5A623',
      'No participó': '#F5A623'
    };
    return map[nivel || ''] || '#64748B';
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

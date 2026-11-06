import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { ProgramasTabsComponent } from '../../shared/components/programas-tabs/programas-tabs.component';
import { ReportePreviewComponent } from '../../shared/components/reporte-preview/reporte-preview.component';
import { ActividadService, Actividad, TipoActividad, ProgramaItem, ParticipanteAsignado, FacilitadorDisponible } from '../../core/services/actividad.service';
import { GrupoService } from '../../core/services/grupo.service';
import { AlcanceService, ProgramaClave } from '../../core/services/alcance.service';
import { CrearGrupoRequest, Grupo, GrupoParticipante, CatalogItem } from '../../core/models/models';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, ProgramasTabsComponent, ReportePreviewComponent],
  templateUrl: './actividades.component.html',
  styleUrls: ['./actividades.component.css']
})
export class ActividadesComponent implements OnInit {
  data: Actividad[] = [];
  loading = true;
  error = '';

  subTab: ProgramaClave = 'educacion';

  search = '';
  fEstado = '';
  sortDir: 'asc' | 'desc' = 'asc';

  mostrarModal = false;
  editando = false;
  editIdAct = 0;
  editIdProg = 0;
  form: any = {};
  saving = false;

  mostrarDialogo = false;
  dialogoTipo: 'create' | 'update' | 'delete' | 'delete-group' | 'remove-member' = 'create';
  dialogoItem: Actividad | null = null;
  dialogoGrupo: Grupo | null = null;
  dialogoGp: GrupoParticipante | null = null;

  tipos: TipoActividad[] = [];
  programas: ProgramaItem[] = [];

  mostrarReporte = false;
  reporteHtml = '';
  reporteTitulo = '';
  mostrarMenuReporte = false;

  toasts: { type: string; message: string }[] = [];

  estados = ['Programada', 'En curso', 'Finalizada', 'Cancelada'];
  modalidades = ['Individual', 'Grupal'];

  estadoBadge: Record<string, string> = {
    'Programada': 'badge-blue',
    'En curso': 'badge-yellow',
    'Finalizada': 'badge-green',
    'Cancelada': 'badge-red'
  };

  mostrarAsignar = false;
  asignarItem: Actividad | null = null;
  participantesDisponibles: ParticipanteAsignado[] = [];
  seleccionados: Set<number> = new Set();
  cargandoParticipantes = false;

  buscarParticipante = '';

  mostrarFacilitadores = false;
  facilitadorItem: Actividad | null = null;
  facilitadoresDisponibles: FacilitadorDisponible[] = [];
  cargandoFacilitadores = false;
  guardandoFacilitadores = false;

  /* ---------------- Submodulo Grupos (dentro de Actividades) ------------- */
  pestanaAct: 'actividades' | 'grupos' = 'actividades';
  grupoOrigenProgramacion = 0;
  gruposLista: Grupo[] = [];
  gruposCargando = false;
  filtroGrupo = '';
  nuevoGrupo: CrearGrupoRequest = { id_programa: 0, nombre: '', descripcion: '', estado: true };
  savingNuevoGrupo = false;
  programasGrupo: CatalogItem[] = [];
  grupoActivo: Grupo | null = null;
  grupoDetalle: Grupo | null = null;
  grupoDetalleCargando = false;
  disponiblesGrupo: any[] = [];
  filtroPartGrupo = '';
  selAgregarGrupo: Set<number> = new Set();
  agregandoGrupo = false;

  mostrarDetalles = false;
  detalleItem: Actividad | null = null;
  asistenciaMap: Record<number, boolean> = {};
  marcandoAsistencia: number | null = null;
  detalleParticipantes: ParticipanteAsignado[] = [];
  cargandoDetalle = false;

  constructor(private actividadService: ActividadService, private grupoService: GrupoService,
              private alcanceService: AlcanceService, private route: ActivatedRoute) {
    this.subTab = this.alcanceService.inicial;
  }

  get conteoTabs(): Record<ProgramaClave, number> {
    const contar = (clave: ProgramaClave) =>
      this.data.filter(a => this.pertenecePrograma(a, clave)).length;
    return { educacion: contar('educacion'), mujeres: contar('mujeres') };
  }

  cambiarPrograma(tab: ProgramaClave) {
    this.subTab = tab;
    if (this.grupoOrigenProgramacion === 0) {
      this.nuevoGrupo = { ...this.nuevoGrupo, id_programa: this.alcanceService.idDe(tab) };
    }
  }

  /** '14:30' → '2:30 PM' | '08:05' → '8:05 AM' */
  hora12(hora?: string | null): string {
    if (!hora) return '';
    const partes = hora.split(':');
    let h = parseInt(partes[0], 10);
    const m = partes[1] || '00';
    if (isNaN(h)) return hora;
    const sufijo = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${sufijo}`;
  }

  pertenecePrograma(item: { id_programa?: number | null; programa?: string | null }, clave: ProgramaClave): boolean {
    if (typeof item.id_programa === 'number' && item.id_programa > 0) {
      return item.id_programa === this.alcanceService.idDe(clave);
    }
    return this.alcanceService.coincide(item.programa, clave);
  }

  get programasVisibles(): ProgramaItem[] {
    return this.programas.filter(p => this.alcanceService.coincide(p.nombre, this.subTab));
  }

  get programasGrupoVisibles(): CatalogItem[] {
    return this.programasGrupo.filter(p => this.alcanceService.coincide(p.nombre, this.subTab));
  }

  /** Tipo de reporte pedido en la URL (?reporte=...) al llegar desde /reportes. */
  private reportePendiente: string | null = null;

  ngOnInit() {
    this.reportePendiente = this.route.snapshot.queryParamMap.get('reporte');
    this.load();
    this.actividadService.ObtenerTipos().pipe(timeout(12000)).subscribe({ next: d => this.tipos = d, error: () => {} });
    this.actividadService.ObtenerProgramas().pipe(timeout(12000)).subscribe({ next: d => this.programas = d, error: () => {} });
  }

  load() {
    this.loading = true;
    this.error = '';
    this.actividadService.ObtenerTodas().pipe(timeout(15000)).subscribe({
      next: (data) => { this.data = data; this.loading = false; this.consumirReportePendiente(); },
      error: () => { this.error = 'Error al cargar actividades.'; this.loading = false; }
    });
  }

  /** Genera el reporte pedido por ?reporte= (llega desde el módulo /reportes). */
  private consumirReportePendiente() {
    const tipo = this.reportePendiente;
    this.reportePendiente = null;
    if (!tipo) return;
    const mapa: Record<string, 'general' | 'finalizadas' | 'curso'> = {
      general: 'general', finalizadas: 'finalizadas', curso: 'curso', encurso: 'curso'
    };
    const t = mapa[tipo];
    if (t) this.generarReporte(t);
  }

  get filtered(): Actividad[] {
    let list = this.data.filter(a => this.pertenecePrograma(a, this.subTab));
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(a =>
        a.nombre.toLowerCase().includes(s) ||
        (a.responsable || '').toLowerCase().includes(s)
      );
    }
    if (this.fEstado) list = list.filter(a => a.estado === this.fEstado);
    list.sort((a, b) =>
      this.sortDir === 'asc'
        ? a.nombre.localeCompare(b.nombre, 'es')
        : b.nombre.localeCompare(a.nombre, 'es')
    );
    return list;
  }

  toggleSort() {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
  }

  abrirCrear() {
    this.editando = false;
    this.editIdAct = 0;
    this.editIdProg = 0;
    this.error = '';
    this.form = {
      nombre: '',
      descripcion: '',
      objetivo: '',
      id_programa: this.programas.find(p => this.alcanceService.coincide(p.nombre, this.subTab))?.id_programa
        || this.alcanceService.idDe(this.subTab),
      id_tipo_actividad: this.tipos[0]?.id_tipo_actividad || 1,
      fecha: new Date().toISOString().slice(0, 10),
      hora: '',
      hora_fin: '',
      lugar: '',
      estado: 'Programada',
      modalidad: 'Grupal',
      observaciones: '',
      cantidad_planificada: null
    };
    this.mostrarModal = true;
  }

  abrirEditar(a: Actividad) {
    this.editando = true;
    this.editIdAct = a.id_actividad;
    this.editIdProg = a.id_programacion;
    this.error = '';
    this.form = {
      nombre: a.nombre,
      descripcion: a.descripcion || '',
      objetivo: a.objetivo || '',
      id_programa: a.id_programa,
      id_tipo_actividad: a.id_tipo_actividad,
      fecha: a.fecha || new Date().toISOString().slice(0, 10),
      hora: a.hora || '',
      hora_fin: a.hora_fin || '',
      lugar: a.lugar || '',
      estado: a.estado || 'Programada',
      modalidad: a.modalidad || 'Grupal',
      observaciones: a.observaciones || '',
      cantidad_planificada: a.cantidad_planificada ?? null
    };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.error = '';
  }

  guardar() {
    this.error = '';
    if (!this.form.nombre?.trim()) {
      this.error = 'El nombre de la actividad es requerido.';
      return;
    }
    this.saving = true;
    this.dialogoTipo = this.editando ? 'update' : 'create';
    this.mostrarDialogo = true;
  }

  ejecutarAccion() {
    this.mostrarDialogo = false;

    if (this.dialogoTipo === 'delete-group' && this.dialogoGrupo) {
      const g = this.dialogoGrupo;
      this.grupoService.Eliminar(g.id_grupo).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', `Grupo "${g.nombre}" eliminado.`);
          if (this.grupoActivo?.id_grupo === g.id_grupo) { this.grupoActivo = null; this.grupoDetalle = null; }
          this.cargarGruposLista();
          this.saving = false;
        },
        error: (err) => {
          this.showToast('error', err?.status === 403 ? 'Solo un Administrador puede eliminar grupos.' : 'No se pudo eliminar el grupo.');
          this.saving = false;
        }
      });
      return;
    }

    if (this.dialogoTipo === 'remove-member' && this.dialogoGp) {
      const gp = this.dialogoGp;
      this.grupoService.RemoverParticipante(gp.id_grupo_participante).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', 'Participante removido del grupo.');
          if (this.grupoActivo) this.abrirMiembros(this.grupoActivo);
          this.cargarGruposLista();
          this.saving = false;
        },
        error: () => {
          this.showToast('error', 'No se pudo remover el participante.');
          this.saving = false;
        }
      });
      return;
    }

    const payload = {
      nombre: this.form.nombre,
      descripcion: this.form.descripcion || null,
      objetivo: this.form.objetivo || null,
      id_programa: this.form.id_programa,
      id_tipo_actividad: this.form.id_tipo_actividad,
      fecha: this.form.fecha || null,
      hora: this.form.hora || null,
      hora_fin: this.form.hora_fin || null,
      lugar: this.form.lugar || null,
      estado: this.form.estado || 'Programada',
      modalidad: this.form.modalidad || 'Grupal',
      observaciones: this.form.observaciones || null,
      cantidad_planificada: this.form.cantidad_planificada || null
    };

    if (this.dialogoTipo === 'delete' && this.dialogoItem) {
      this.actividadService.Eliminar(this.dialogoItem.id_actividad, this.dialogoItem.id_programacion).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', `Actividad "${this.dialogoItem!.nombre}" eliminada.`);
          this.load();
          this.saving = false;
        },
        error: () => {
          this.showToast('error', 'No se pudo eliminar la actividad.');
          this.saving = false;
        }
      });
    } else if (this.dialogoTipo === 'create') {
      this.actividadService.Crear(payload).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', 'Actividad registrada correctamente.');
          this.load();
          this.cerrarModal();
          this.saving = false;
        },
        error: () => {
          this.error = 'Error al registrar la actividad.';
          this.saving = false;
        }
      });
    } else if (this.dialogoTipo === 'update') {
      this.actividadService.Actualizar(this.editIdAct, this.editIdProg, payload).pipe(timeout(15000)).subscribe({
        next: () => {
          this.showToast('success', 'Actividad actualizada correctamente.');
          this.load();
          this.cerrarModal();
          this.saving = false;
        },
        error: () => {
          this.error = 'Error al actualizar la actividad.';
          this.saving = false;
        }
      });
    }
  }

  confirmarEliminar(a: Actividad) {
    this.dialogoTipo = 'delete';
    this.dialogoItem = a;
    this.mostrarDialogo = true;
  }

  cambiarEstadoRapido(a: Actividad, nuevoEstado: string) {
    if (!a.id_programacion || a.estado === nuevoEstado) return;
    this.actividadService.ActualizarEstado(a.id_programacion, nuevoEstado).pipe(timeout(12000)).subscribe({
      next: () => {
        a.estado = nuevoEstado;
        this.showToast('success', `Estado actualizado a "${nuevoEstado}".`);
      },
      error: () => this.showToast('error', 'No se pudo actualizar el estado.')
    });
  }

  abrirAsignar(a: Actividad) {
    this.asignarItem = a;
    this.seleccionados = new Set();
    this.buscarParticipante = '';
    this.cargandoParticipantes = true;
    this.mostrarAsignar = true;
    this.actividadService.ObtenerParticipantesDisponibles(a.id_programacion).pipe(timeout(12000)).subscribe({
      next: (list) => {
        this.participantesDisponibles = list;
        list.forEach(p => { if (p.presente) this.seleccionados.add(p.id_participante); });
        this.cargandoParticipantes = false;
      },
      error: () => {
        this.participantesDisponibles = [];
        this.showToast('error', 'No se pudieron cargar los participantes.');
        this.cargandoParticipantes = false;
      }
    });
  }

  toggleSeleccion(id: number) {
    if (this.seleccionados.has(id)) this.seleccionados.delete(id);
    else this.seleccionados.add(id);
  }

  get participantesFiltrados(): ParticipanteAsignado[] {
    if (!this.buscarParticipante) return this.participantesDisponibles;
    const s = this.buscarParticipante.toLowerCase();
    return this.participantesDisponibles.filter(p => p.nombre.toLowerCase().includes(s));
  }

  guardarAsignacion() {
    if (!this.asignarItem) return;
    const ids = Array.from(this.seleccionados);
    this.actividadService.AsignarParticipantes(this.asignarItem.id_programacion, ids).pipe(timeout(15000)).subscribe({
      next: () => {
        this.showToast('success', `${ids.length} participante(s) asignado(s).`);
        this.mostrarAsignar = false;
        this.load();
      },
      error: () => this.showToast('error', 'No se pudo guardar la asignación.')
    });
  }

  abrirFacilitadores(a: Actividad) {
    this.facilitadorItem = a;
    this.facilitadoresDisponibles = [];
    this.cargandoFacilitadores = true;
    this.mostrarFacilitadores = true;
    this.actividadService.ObtenerFacilitadoresDisponibles(a.id_programacion).pipe(timeout(12000)).subscribe({
      next: (list) => {
        this.facilitadoresDisponibles = list;
        this.cargandoFacilitadores = false;
      },
      error: () => {
        this.facilitadoresDisponibles = [];
        this.cargandoFacilitadores = false;
        this.showToast('error', 'No se pudieron cargar los facilitadores.');
      }
    });
  }

  toggleFacilitador(id: number) {
    const f = this.facilitadoresDisponibles.find(x => x.id_usuario === id);
    if (f) f.asignado = !f.asignado;
  }

  get facilitadoresSeleccionados(): number[] {
    return this.facilitadoresDisponibles.filter(f => f.asignado).map(f => f.id_usuario);
  }

  guardarFacilitadores() {
    if (!this.facilitadorItem) return;
    const ids = this.facilitadoresSeleccionados;
    this.guardandoFacilitadores = true;
    this.actividadService.AsignarFacilitadores(this.facilitadorItem.id_programacion, ids).pipe(timeout(15000)).subscribe({
      next: (res: any) => {
        this.guardandoFacilitadores = false;
        this.mostrarFacilitadores = false;
        this.showToast('success', res?.message || `${ids.length} facilitador(es) asignado(s).`);
        this.load();
      },
      error: () => {
        this.guardandoFacilitadores = false;
        this.showToast('error', 'No se pudo guardar la asignación de facilitadores.');
      }
    });
  }

  crearGrupoDesdeActividad(a: Actividad) {
    this.cambiarPestana('grupos');
    this.grupoOrigenProgramacion = a.id_programacion;
    this.grupoActivo = null;
    this.grupoDetalle = null;
    this.nuevoGrupo = {
      id_programa: a.id_programa || this.programasGrupo[0]?.id || this.programas[0]?.id_programa || 0,
      nombre: a.nombre,
      descripcion: `Grupo creado desde la actividad ${a.nombre}`,
      estado: true
    };
    this.showToast('success', `Pulse "Crear grupo": los participantes de "${a.nombre}" se asignan automáticamente.`);
  }

  /* --------------------- submodulo Grupos (Actividades) ------------------ */

  cambiarPestana(t: 'actividades' | 'grupos') {
    this.pestanaAct = t;
    this.grupoOrigenProgramacion = 0;
    if (t !== 'grupos') return;
    this.filtroGrupo = '';
    this.filtroPartGrupo = '';
    this.cargarGruposLista();
    if (!this.programasGrupo.length) {
      this.grupoService.ObtenerProgramas().pipe(timeout(12000)).subscribe({
        next: p => {
          this.programasGrupo = p;
          if (!this.nuevoGrupo.id_programa && p.length) {
            this.nuevoGrupo.id_programa = p.find(x => this.alcanceService.coincide(x.nombre, this.subTab))?.id
              || this.alcanceService.idDe(this.subTab);
          }
        },
        error: () => {}
      });
    }
  }

  cargarGruposLista() {
    this.gruposCargando = true;
    this.grupoService.ObtenerTodos().pipe(timeout(15000)).subscribe({
      next: g => {
        this.gruposLista = g;
        if (this.grupoActivo) {
          this.grupoActivo = g.find(x => x.id_grupo === this.grupoActivo!.id_grupo) || this.grupoActivo;
        }
        this.gruposCargando = false;
      },
      error: () => {
        this.gruposLista = [];
        this.gruposCargando = false;
        this.showToast('error', 'No se pudieron cargar los grupos.');
      }
    });
  }

  get gruposVisibles(): Grupo[] {
    const porPrograma = this.gruposLista.filter(g => this.pertenecePrograma(g, this.subTab));
    if (!this.filtroGrupo) return porPrograma;
    const f = this.filtroGrupo.toLowerCase();
    return porPrograma.filter(g =>
      g.nombre.toLowerCase().includes(f) ||
      (g.programa_nombre || '').toLowerCase().includes(f) ||
      (g.descripcion || '').toLowerCase().includes(f)
    );
  }

  crearGrupoNuevo() {
    const nombre = (this.nuevoGrupo.nombre || '').trim();
    if (!this.nuevoGrupo.id_programa) { this.showToast('error', 'Seleccione el programa del grupo.'); return; }
    if (!nombre) { this.showToast('error', 'Ingrese el nombre del grupo.'); return; }
    this.savingNuevoGrupo = true;
    const req: CrearGrupoRequest = {
      id_programa: this.nuevoGrupo.id_programa,
      nombre,
      descripcion: (this.nuevoGrupo.descripcion || '').trim() || undefined,
      estado: true
    };
    this.grupoService.Crear(req).pipe(timeout(15000)).subscribe({
      next: (g) => {
        this.savingNuevoGrupo = false;
        this.nuevoGrupo.nombre = '';
        this.nuevoGrupo.descripcion = '';
        this.cargarGruposLista();
        const origen = this.grupoOrigenProgramacion;
        this.grupoOrigenProgramacion = 0;
        if (origen) {
          this.asignarParticipantesOrigen(g, origen);
        } else {
          this.showToast('success', `Grupo "${g.nombre}" creado. Agregue sus participantes.`);
          this.abrirMiembros(g);
        }
      },
      error: (err) => {
        this.savingNuevoGrupo = false;
        if (err?.status === 403) this.showToast('error', 'Solo un Administrador puede crear grupos.');
        else this.showToast('error', err?.error?.message || 'No se pudo crear el grupo.');
      }
    });
  }

  private asignarParticipantesOrigen(g: Grupo, idProgramacion: number) {
    this.actividadService.ObtenerParticipantesDisponibles(idProgramacion).pipe(timeout(15000)).subscribe({
      next: (list) => {
        const ids = list.filter(p => p.presente).map(p => p.id_participante);
        if (!ids.length) {
          this.showToast('success', `Grupo "${g.nombre}" creado.`);
          this.abrirMiembros(g);
          return;
        }
        forkJoin(
          ids.map(id => this.grupoService.AsignarParticipante(g.id_grupo, id).pipe(catchError(() => of(null))))
        ).subscribe({
          next: (res) => {
            const ok = res.filter(r => r).length;
            this.showToast('success', `Grupo "${g.nombre}" creado con ${ok} participante(s).`);
            this.cargarGruposLista();
            this.abrirMiembros(g);
          },
          error: () => {
            this.showToast('error', 'Grupo creado, pero no se pudieron asignar los participantes.');
            this.abrirMiembros(g);
          }
        });
      },
      error: () => {
        this.showToast('success', `Grupo "${g.nombre}" creado.`);
        this.abrirMiembros(g);
      }
    });
  }

  abrirMiembros(g: Grupo) {
    this.grupoActivo = g;
    this.grupoDetalle = null;
    this.grupoDetalleCargando = true;
    this.selAgregarGrupo = new Set();
    this.filtroPartGrupo = '';
    this.disponiblesGrupo = [];
    this.grupoService.ObtenerPorId(g.id_grupo).pipe(timeout(15000)).subscribe({
      next: det => {
        this.grupoDetalle = det;
        this.grupoDetalleCargando = false;
        this.cargarDisponiblesGrupo(det);
      },
      error: () => {
        this.grupoDetalleCargando = false;
        this.showToast('error', 'No se pudo cargar el grupo.');
      }
    });
  }

  cerrarMiembros() {
    this.grupoActivo = null;
    this.grupoDetalle = null;
    this.disponiblesGrupo = [];
    this.selAgregarGrupo = new Set();
  }

  private cargarDisponiblesGrupo(det: Grupo) {
    this.grupoService.ObtenerParticipantes().pipe(timeout(15000)).subscribe({
      next: ps => {
        const asignados = (det.participantes || []).filter(p => p.estado).map(p => p.id_participante);
        this.disponiblesGrupo = ps.filter((p: any) => p.estado && !asignados.includes(p.id_participante));
        this.selAgregarGrupo = new Set(this.disponiblesGrupo.map((p: any) => p.id_participante));
      },
      error: () => this.showToast('error', 'No se pudieron cargar los participantes.')
    });
  }

  nombreParticipante(p: any): string {
    if (p?.nombre) return p.nombre;
    return [p?.primer_nombre, p?.segundo_nombre, p?.primer_apellido, p?.segundo_apellido]
      .filter(x => x).join(' ');
  }

  get miembrosVisibles(): GrupoParticipante[] {
    return (this.grupoDetalle?.participantes || []).filter(p => p.estado);
  }

  get disponiblesFiltrados(): any[] {
    if (!this.filtroPartGrupo) return this.disponiblesGrupo;
    const f = this.filtroPartGrupo.toLowerCase();
    return this.disponiblesGrupo.filter(p => this.nombreParticipante(p).toLowerCase().includes(f));
  }

  toggleAgregarGrupo(id: number) {
    if (this.selAgregarGrupo.has(id)) this.selAgregarGrupo.delete(id);
    else this.selAgregarGrupo.add(id);
  }

  get todosAgregadosSel(): boolean {
    return this.disponiblesFiltrados.length > 0 &&
      this.disponiblesFiltrados.every(p => this.selAgregarGrupo.has(p.id_participante));
  }

  alternarTodosAgregados() {
    if (this.todosAgregadosSel) this.selAgregarGrupo = new Set();
    else this.disponiblesFiltrados.forEach(p => this.selAgregarGrupo.add(p.id_participante));
  }

  agregarSeleccionadosGrupo() {
    if (!this.grupoDetalle) return;
    const ids = Array.from(this.selAgregarGrupo);
    if (!ids.length) { this.showToast('warning', 'Marque al menos un participante.'); return; }
    this.agregandoGrupo = true;
    forkJoin(
      ids.map(id => this.grupoService.AsignarParticipante(this.grupoDetalle!.id_grupo, id).pipe(catchError(() => of(null))))
    ).subscribe({
      next: (res) => {
        const ok = res.filter(r => r).length;
        this.agregandoGrupo = false;
        this.showToast('success', `${ok} participante(s) agregado(s) al grupo.`);
        this.selAgregarGrupo = new Set();
        this.cargarGruposLista();
        if (this.grupoActivo) this.abrirMiembros(this.grupoActivo);
      },
      error: () => {
        this.agregandoGrupo = false;
        this.showToast('error', 'No se pudieron agregar los participantes.');
      }
    });
  }

  confirmarEliminarGrupo(g: Grupo) {
    this.dialogoTipo = 'delete-group';
    this.dialogoGrupo = g;
    this.saving = true;
    this.mostrarDialogo = true;
  }

  confirmarRemoverMiembro(gp: GrupoParticipante) {
    this.dialogoTipo = 'remove-member';
    this.dialogoGp = gp;
    this.saving = true;
    this.mostrarDialogo = true;
  }

  verDetalles(a: Actividad) {
    this.detalleItem = a;
    this.detalleParticipantes = [];
    this.asistenciaMap = {};
    this.cargandoDetalle = a.id_programacion > 0;
    this.mostrarDetalles = true;
    if (a.id_programacion > 0) {
      this.actividadService.ObtenerParticipantesDisponibles(a.id_programacion).pipe(timeout(12000)).subscribe({
        next: (list) => {
          this.detalleParticipantes = list.filter(p => p.presente);
          this.cargandoDetalle = false;
        },
        error: () => {
          this.cargandoDetalle = false;
        }
      });
      this.actividadService.ObtenerAsistencia(a.id_programacion).pipe(timeout(12000)).subscribe({
        next: (lista) => {
          const map: Record<number, boolean> = {};
          lista.forEach(a2 => map[a2.id_participante] = a2.presente);
          this.asistenciaMap = map;
        },
        error: () => {}
      });
    }
  }

  toggleAsistencia(p: ParticipanteAsignado) {
    if (!this.detalleItem || this.detalleItem.id_programacion <= 0) return;
    const nuevo = !this.asistenciaMap[p.id_participante];
    this.marcandoAsistencia = p.id_participante;
    this.actividadService.MarcarAsistencia(this.detalleItem.id_programacion, p.id_participante, nuevo).subscribe({
      next: () => {
        this.asistenciaMap = { ...this.asistenciaMap, [p.id_participante]: nuevo };
        this.marcandoAsistencia = null;
        this.showToast('success', nuevo ? `${p.nombre}: presente ✓` : `${p.nombre}: ausente ✗`);
      },
      error: (err) => {
        this.marcandoAsistencia = null;
        this.showToast('error', err?.error?.message || 'No se pudo marcar la asistencia');
      }
    });
  }

  asistenciaTexto(id: number): string {
    return this.asistenciaMap[id] === true ? 'Presente' : this.asistenciaMap[id] === false ? 'Ausente' : 'Sin marcar';
  }

  get detalleAsignados(): ParticipanteAsignado[] {
    return this.detalleParticipantes;
  }

  reporteDesdeDetalle() {
    if (!this.detalleItem) return;
    this.mostrarDetalles = false;
    this.reporteActividad(this.detalleItem);
  }

  reporteActividad(a: Actividad) {
    this.actividadService.ObtenerParticipantesDisponibles(a.id_programacion).pipe(timeout(12000)).subscribe({
      next: (participantes) => {
        const asignados = participantes.filter(p => p.presente);
        const html = this.generarHtmlReporteActividad(a, asignados);
        this.reporteHtml = html;
        this.reporteTitulo = `Actividad: ${a.nombre}`;
        this.mostrarReporte = true;
      },
      error: () => this.showToast('error', 'No se pudo generar el reporte.')
    });
  }

  generarReporteParticipante() {
    this.mostrarMenuReporte = false;
    const titulo = 'Reporte de Actividades por Participante';
    const rows = this.data.map((a, i) => `
      <tr style="border-bottom:1px solid #E2E8F0;">
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${i + 1}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#0F172A;">${a.nombre}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1E3278;">${a.programa || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1E3278;">${a.modalidad || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${a.fecha || '-'}${a.hora ? ' ' + this.hora12(a.hora) : ''}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${a.totalParticipantes ?? 0}</td>
        <td style="padding:10px 14px;">
          <span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${this.getEstadoBg(a.estado)};color:${this.getEstadoColor(a.estado)};">${a.estado || '-'}</span>
        </td>
      </tr>`).join('');
    this.reporteHtml = this.cabeceraReporte(titulo, this.data.length) + `
      <div style="padding:20px 32px;">
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:linear-gradient(135deg,#1E3278 0%,#F5A623 100%);color:#fff;">
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">No.</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Actividad</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Programa</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Modalidad</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Fecha</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Participantes</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Estado</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="padding:24px;text-align:center;color:#94A3B8;">Sin datos</td></tr>'}</tbody>
        </table>
      </div>
      ${this.pieReporte()}`;
    this.reporteTitulo = titulo;
    this.mostrarReporte = true;
  }

  generarHtmlReporteActividad(a: Actividad, participantes: ParticipanteAsignado[]): string {
    const titulo = `Detalle de Actividad: ${a.nombre}`;
    const rows = participantes.map((p, i) => `
      <tr style="border-bottom:1px solid #E2E8F0;">
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${i + 1}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#0F172A;">${p.nombre}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1E3278;">${p.programa || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${p.categoria || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${p.dpi || '-'}</td>
        <td style="padding:10px 14px;">
          <span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:#DCFCE7;color:#0E6B23;">Asignado</span>
        </td>
      </tr>`).join('');
    return this.cabeceraReporte(titulo, participantes.length) + `
      <div style="padding:16px 32px 0;">
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px;">
          <div><strong style="color:#1E3278;">Tipo:</strong> ${a.tipo_actividad || '-'}</div>
          <div><strong style="color:#1E3278;">Programa:</strong> ${a.programa || '-'}</div>
          <div><strong style="color:#1E3278;">Modalidad:</strong> ${a.modalidad || '-'}</div>
          <div><strong style="color:#1E3278;">Estado:</strong> ${a.estado || '-'}</div>
          <div><strong style="color:#1E3278;">Fecha:</strong> ${a.fecha || '-'}${a.hora ? ' ' + this.hora12(a.hora) : ''}</div>
          <div><strong style="color:#1E3278;">Lugar:</strong> ${a.lugar || '-'}</div>
          <div><strong style="color:#1E3278;">Responsable:</strong> ${a.responsable || '-'}</div>
          <div><strong style="color:#1E3278;">Planificados:</strong> ${a.cantidad_planificada ?? '—'}</div>
          ${a.objetivo ? `<div style="grid-column:1/-1;"><strong style="color:#1E3278;">Objetivo:</strong> ${a.objetivo}</div>` : ''}
          ${a.observaciones ? `<div style="grid-column:1/-1;"><strong style="color:#1E3278;">Observaciones:</strong> ${a.observaciones}</div>` : ''}
        </div>
      </div>
      <div style="padding:20px 32px;">
        <h3 style="font-size:14px;color:#1E3278;margin:0 0 12px 0;">Participantes asignados (${participantes.length})</h3>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:linear-gradient(135deg,#1E3278 0%,#F5A623 100%);color:#fff;">
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">No.</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Nombre</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Programa</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Categoría</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">DPI</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Estado</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" style="padding:24px;text-align:center;color:#94A3B8;">Sin participantes asignados</td></tr>'}</tbody>
        </table>
      </div>
      ${this.pieReporte()}`;
  }

  cabeceraReporte(titulo: string, total: number): string {
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    return `<div style="font-family:Arial,sans-serif;color:#1e293b;background:#fff;margin:0;">
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
          <div style="margin-top:4px;">Total: <strong style="color:#F5A623;">${total}</strong></div>
        </div>
      </div>`;
  }

  pieReporte(): string {
    return `<div style="margin-top:30px;padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
      <div style="font-size:11px;color:#64748B;display:flex;justify-content:space-between;">
        <span><strong style="color:#1E3278;">Asociación ANADESA</strong> | Santiago Atitlán, Sololá</span>
        <span style="color:#F5A623;font-style:italic;">Más oportunidades, mejores vidas</span>
      </div>
    </div></div>`;
  }

  generarReporte(tipo: 'general' | 'finalizadas' | 'curso') {
    this.mostrarMenuReporte = false;
    let lista: Actividad[];
    let titulo: string;
    if (tipo === 'general') {
      lista = [...this.data];
      titulo = 'Reporte General de Actividades';
    } else if (tipo === 'finalizadas') {
      lista = this.data.filter(a => a.estado === 'Finalizada');
      titulo = 'Actividades Finalizadas';
    } else {
      lista = this.data.filter(a => a.estado !== 'Finalizada' && a.estado !== 'Cancelada');
      titulo = 'Actividades en Curso / Planificadas';
    }
    this.reporteHtml = this.generarHtmlReporte(lista, titulo);
    this.reporteTitulo = titulo;
    this.mostrarReporte = true;
  }

  generarHtmlReporte(lista: Actividad[], titulo: string): string {
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    const rows = lista.map((a, i) => `
      <tr style="border-bottom:1px solid #E2E8F0;">
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${i + 1}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:600;color:#0F172A;">${a.nombre}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1E3278;">${a.programa || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#1E3278;">${a.tipo_actividad || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${a.fecha || '-'}${a.hora ? ' ' + this.hora12(a.hora) : ''}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${a.lugar || '-'}</td>
        <td style="padding:10px 14px;font-size:12px;color:#64748B;">${a.responsable || '-'}</td>
        <td style="padding:10px 14px;">
          <span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${this.getEstadoBg(a.estado)};color:${this.getEstadoColor(a.estado)};">${a.estado || '-'}</span>
        </td>
      </tr>`).join('');

    return `<div style="font-family:Arial,sans-serif;color:#1e293b;background:#fff;margin:0;">
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
      </div>
      <div style="padding:20px 32px;">
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:linear-gradient(135deg,#1E3278 0%,#F5A623 100%);color:#fff;">
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">No.</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Actividad</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Programa</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Tipo</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Fecha</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Lugar</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Responsable</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;">Estado</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="8" style="padding:24px;text-align:center;color:#94A3B8;">Sin actividades</td></tr>'}</tbody>
        </table>
      </div>
      <div style="margin-top:30px;padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
        <div style="font-size:11px;color:#64748B;display:flex;justify-content:space-between;">
          <span><strong style="color:#1E3278;">Asociación ANADESA</strong> | Santiago Atitlán, Sololá</span>
          <span style="color:#F5A623;font-style:italic;">Más oportunidades, mejores vidas</span>
        </div>
      </div>
    </div>`;
  }

  getEstadoBg(estado?: string): string {
    const map: Record<string, string> = { 'Programada': '#EBF5FB', 'En curso': '#FEF3C7', 'Finalizada': '#DCFCE7', 'Cancelada': '#FEF6E7' };
    return map[estado || ''] || '#F5F9FD';
  }

  getEstadoColor(estado?: string): string {
    const map: Record<string, string> = { 'Programada': '#1E3278', 'En curso': '#B45309', 'Finalizada': '#0E6B23', 'Cancelada': '#F5A623' };
    return map[estado || ''] || '#64748B';
  }

  showToast(type: string, message: string) {
    this.toasts.push({ type, message });
    setTimeout(() => this.toasts.shift(), 3800);
  }
}

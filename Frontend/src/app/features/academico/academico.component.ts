import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { AcademicoService, InscripcionAcademica, HistorialAcademico, CicloEscolar, Grado, BloqueAcademico, Promedio } from '../../core/services/academico.service';
import { ParticipanteService } from '../../core/services/participante.service';
import { Participante } from '../../core/models/models';

@Component({
  selector: 'app-academico',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './academico.component.html',
  styleUrls: ['./academico.component.css']
})
export class AcademicoComponent implements OnInit {
  participantes: Participante[] = [];
  participanteSeleccionado: Participante | null = null;
  inscripciones: InscripcionAcademica[] = [];
  historial: HistorialAcademico[] = [];
  promediosMap: Map<number, Promedio[]> = new Map();
  ciclos: CicloEscolar[] = [];
  grados: Grado[] = [];
  bloques: BloqueAcademico[] = [];

  search = '';
  sortDir: 'asc' | 'desc' = 'asc';
  activeTab: 'inscripciones' | 'historial' = 'inscripciones';
  loading = false;

  mostrarModal = false;
  modalTipo: 'inscripcion' | 'historial' | 'historial-visualizacion' | 'calificacion' = 'inscripcion';
  editando = false;
  editId = 0;
  form: any = {};
  saving = false;
  error = '';

  inscripcionSeleccionada: InscripcionAcademica | null = null;
  formCalificacion: any = {};
  promedioVivo: number | null = null;

  particulasSeleccionadoParaHistorial: Participante | null = null;
  promedioCalculadoHistorico: number | null = null;
  resultadoCalculadoHistorico: string | null = null;

  mostrarConfirmacion = false;
  confirmTipo: 'delete-inscripcion' | 'delete-historial' = 'delete-inscripcion';
  confirmId = 0;
  confirmNombre = '';

  toasts: { type: string; message: string }[] = [];
  YEAR = new Date().getFullYear();

  constructor(
    private academicoService: AcademicoService,
    private participanteService: ParticipanteService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.participanteService.ObtenerTodos().subscribe({
      next: (data) => {
        this.participantes = data.filter(p => p.estado);
        this.loading = false;
      },
      error: () => this.loading = false
    });
    this.academicoService.ObtenerCiclos().subscribe({ next: (d) => this.ciclos = d });
    this.academicoService.ObtenerGrados().subscribe({ next: (d) => this.grados = d });
    this.academicoService.ObtenerBloques().subscribe({ next: (d) => this.bloques = d });
  }

  get participantesFiltrados() {
    let list = this.participantes.filter(p =>
      (p.programa_nombre || '').toLowerCase().includes('educación') ||
      (p.programa_nombre || '').toLowerCase().includes('educacion')
    );
    if (this.search) {
      const s = this.search.toLowerCase();
      list = list.filter(p =>
        `${p.primer_nombre} ${p.segundo_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''}`.toLowerCase().includes(s)
      );
    }
    list.sort((a, b) => {
      const na = `${a.primer_apellido} ${a.primer_nombre}`.toLowerCase();
      const nb = `${b.primer_apellido} ${b.primer_nombre}`.toLowerCase();
      return this.sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
    });
    return list;
  }

  toggleSort() { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }

  getIniciales(p: Participante): string {
    return ((p.primer_nombre?.[0] || '') + (p.primer_apellido?.[0] || '')).toUpperCase();
  }

  seleccionarParticipante(p: Participante) {
    this.participanteSeleccionado = p;
    this.loadDatosAcademicos(p.id_participante);
  }

  loadDatosAcademicos(id: number) {
    this.academicoService.ObtenerInscripciones(id).subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.inscripciones.forEach(ins => {
          this.academicoService.ObtenerPromedios(ins.id_inscripcion).subscribe({
            next: (proms) => this.promediosMap.set(ins.id_inscripcion, proms),
            error: () => this.promediosMap.set(ins.id_inscripcion, [])
          });
        });
      },
      error: () => this.inscripciones = []
    });
    this.academicoService.ObtenerHistorial(id).subscribe({
      next: (d) => this.historial = d,
      error: () => this.historial = []
    });
  }

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

  getResultado(promedio: number | null): string | null {
    if (promedio === null) return null;
    return promedio >= 60 ? 'Aprobado' : 'Reprobado';
  }

  getRegistrosOrdenados() {
    return [...this.inscripciones].sort((a, b) => (b.ciclo_anio || '').localeCompare(a.ciclo_anio || ''));
  }

  getHistorialOrdenado() {
    return [...this.historial].sort((a, b) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
  }

  getHistorialAutomatico(): InscripcionAcademica[] {
    return this.getRegistrosOrdenados().filter(ins => this.calcPromedio(this.getPromedios(ins)) !== null);
  }

  abrirModalInscripcion() {
    this.modalTipo = 'inscripcion';
    this.editando = false;
    const anioActual = new Date().getFullYear();
    this.form = { id_grado: null, anio: anioActual, observaciones: '' };
    this.error = '';
    this.mostrarModal = true;
  }

abrirModalHistorial() {
    // Ahora abre directamente el modo visualización
    this.verHistorialAutomatico();
}

verHistorialAutomatico() {
    if (!this.participanteSeleccionado) return;
    
    // Calculamos el promedio y resultado desde los promedios registrados
    const valores = this.inscripciones.flatMap(ins => this.getPromedios(ins).map(p => p.promedio)).filter(v => v !== null && v !== undefined);
    
    if (valores.length === 0) {
      this.showToast('info', 'No hay calificaciones registradas');
      this.cerrarModal();
      return;
    }
    
    const promedioGeneral = valores.reduce((a, b) => a + b, 0) / valores.length;
    const resultado = promedioGeneral >= 60 ? 'Aprobado' : 'Reprobado';
    
    this.particulasSeleccionadoParaHistorial = this.participanteSeleccionado;
    this.promedioCalculadoHistorico = promedioGeneral;
    this.resultadoCalculadoHistorico = resultado;
    this.mostrarModal = true;
    this.modalTipo = 'historial-visualizacion';
}

  cerrarModal() {
    this.mostrarModal = false;
    this.error = '';
    this.inscripcionSeleccionada = null;
    this.particulasSeleccionadoParaHistorial = null;
    this.promedioCalculadoHistorico = null;
    this.resultadoCalculadoHistorico = null;
  }

  abrirModalCalificacion(inscripcion: InscripcionAcademica) {
    this.inscripcionSeleccionada = inscripcion;
    this.modalTipo = 'calificacion';
    this.formCalificacion = {
      bloque_i: null,
      bloque_ii: null,
      bloque_iii: null,
      bloque_iv: null
    };
    this.calcPromedioVivoFn();
    this.error = '';
    this.mostrarModal = true;
  }

  calcPromedioVivoFn() {
    const vals = [this.formCalificacion.bloque_i, this.formCalificacion.bloque_ii, this.formCalificacion.bloque_iii, this.formCalificacion.bloque_iv]
      .filter((v: any) => v !== null && v !== undefined && v !== '');
    this.promedioVivo = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  }

  onBloqueChange() {
    this.calcPromedioVivoFn();
  }

  guardarCalificacion() {
    if (!this.inscripcionSeleccionada) return;
    const bloques = this.bloques.sort((a, b) => a.numero_bloque - b.numero_bloque);
    const valores = [
      { bloque: bloques[0], valor: this.formCalificacion.bloque_i },
      { bloque: bloques[1], valor: this.formCalificacion.bloque_ii },
      { bloque: bloques[2], valor: this.formCalificacion.bloque_iii },
      { bloque: bloques[3], valor: this.formCalificacion.bloque_iv }
    ].filter(v => v.valor !== null && v.valor !== undefined && v.valor !== '' && v.bloque);

    if (valores.length === 0) { this.error = 'Ingrese al menos una calificación'; return; }

    this.saving = true;
    let completados = 0;
    let errores = 0;

    valores.forEach(v => {
      this.academicoService.CrearPromedio({
        id_inscripcion: this.inscripcionSeleccionada!.id_inscripcion,
        id_bloque: v.bloque!.id_bloque,
        promedio: v.valor
      }).subscribe({
        next: () => {
          completados++;
          if (completados + errores === valores.length) {
            this.showToast('success', `${completados} calificación(es) guardada(s)`);
            this.loadDatosAcademicos(this.participanteSeleccionado!.id_participante);
            this.cerrarModal();
            this.saving = false;
          }
        },
        error: () => {
          errores++;
          if (completados + errores === valores.length) {
            if (errores === valores.length) this.showToast('error', 'Error al guardar calificaciones');
            else this.showToast('success', `${completados} calificación(es) guardada(s), ${errores} error(es)`);
            this.loadDatosAcademicos(this.participanteSeleccionado!.id_participante);
            this.cerrarModal();
            this.saving = false;
          }
        }
      });
    });
  }

  guardar() {
    if (this.modalTipo === 'inscripcion') {
      if (!this.form.id_grado) { this.error = 'Seleccione un grado'; return; }
      const anio = Number(this.form.anio);
      if (!anio || anio < 2000 || anio > 2100) { this.error = 'Escriba un año válido (2000-2100)'; return; }
      this.saving = true;
      const payload = {
        id_participante: this.participanteSeleccionado!.id_participante,
        id_grado: this.form.id_grado,
        anio,
        observaciones: this.form.observaciones
      };
      this.academicoService.CrearInscripcion(payload).subscribe({
        next: () => {
          this.showToast('success', `Inscripción ${anio} creada`);
          this.loadDatosAcademicos(this.participanteSeleccionado!.id_participante);
          this.cerrarModal();
          this.saving = false;
        },
        error: () => { this.error = 'Error al crear inscripción'; this.saving = false; }
      });
    } else if (this.modalTipo === 'historial') {
    // Modo visualización - no guardar en base de datos, solo mostrar datos calculados
    if (!this.form.id_grado) { this.error = 'Seleccione un grado'; return; }
    if (!this.form.id_ciclo) { this.error = 'Seleccione un ciclo'; return; }
    this.showToast('info', 'Modo visualización: los datos se calculan desde los bloques registrados');
    this.cerrarModal();
    this.saving = false;
}
  }

  confirmarEliminar(tipo: 'delete-inscripcion' | 'delete-historial', id: number, nombre: string) {
    this.confirmTipo = tipo;
    this.confirmId = id;
    this.confirmNombre = nombre;
    this.mostrarConfirmacion = true;
  }

  ejecutarEliminar() {
    this.mostrarConfirmacion = false;
    if (this.confirmTipo === 'delete-inscripcion') {
      this.academicoService.EliminarInscripcion(this.confirmId).subscribe({
        next: () => {
          this.showToast('success', 'Inscripción eliminada');
          this.loadDatosAcademicos(this.participanteSeleccionado!.id_participante);
        },
        error: () => this.showToast('error', 'Error al eliminar')
      });
    } else {
      this.academicoService.EliminarHistorial(this.confirmId).subscribe({
        next: () => {
          this.showToast('success', 'Historial eliminado');
          this.loadDatosAcademicos(this.participanteSeleccionado!.id_participante);
        },
        error: () => this.showToast('error', 'Error al eliminar')
      });
    }
  }

  showToast(type: string, message: string) {
    this.toasts.push({ type, message });
    setTimeout(() => this.toasts.shift(), 3800);
  }
}

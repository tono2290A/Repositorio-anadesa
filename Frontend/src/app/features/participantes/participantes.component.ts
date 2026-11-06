import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ParticipanteService } from '../../core/services/participante.service';
import { CatalogService } from '../../core/services/usuario.service';
import { ReporteService } from '../../core/services/reporte.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { ProgramasTabsComponent } from '../../shared/components/programas-tabs/programas-tabs.component';
import { ReportePreviewComponent } from '../../shared/components/reporte-preview/reporte-preview.component';
import { AlcanceService, ProgramaClave } from '../../core/services/alcance.service';
import { Participante, CatalogItem, CrearParticipanteRequest, Familiar, ContactoParticipante, Direccion } from '../../core/models/models';

@Component({
  selector: 'app-participantes',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, ProgramasTabsComponent, ReportePreviewComponent],
  templateUrl: './participantes.component.html',
  styleUrls: ['./participantes.component.css']
})
export class ParticipantesComponent implements OnInit {
  participantes: Participante[] = [];
  participantesFiltrados: Participante[] = [];
  subTab: ProgramaClave = 'educacion';
  search = '';
  fCategoria = '';
  fGenero = '';
  fEstado = '';
  fBeca = '';
  sortDir: 'asc' | 'desc' = 'asc';

  mostrarModal = false;
  editando = false;
  editId = 0;
  form: any = {};
  error = '';
  saving = false;

  mostrarDialogo = false;
  dialogoTipo: 'create' | 'update' | 'delete' = 'create';
  dialogoItem: any = null;

  toasts: { type: string; message: string }[] = [];

  mostrarReporte = false;
  reporteHtml = '';
  reporteTipo: 'general' | 'perfil' = 'general';
  reporteTitulo = '';
  reporteLista: Participante[] = [];

  categorias: CatalogItem[] = [];
  programas: CatalogItem[] = [];
  comunidades: CatalogItem[] = [];

  constructor(
    public participanteService: ParticipanteService,
    private catalogService: CatalogService,
    private reporteService: ReporteService,
    private alcanceService: AlcanceService,
    private router: Router
  ) {
    this.subTab = this.alcanceService.inicial;
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.participanteService.ObtenerTodos().subscribe({
      next: (data) => { this.participantes = data; this.filtrar(); },
      error: () => this.showToast('error', 'Error al cargar participantes')
    });
    this.catalogService.ObtenerCategorias().subscribe({ next: (d) => this.categorias = d });
    this.catalogService.ObtenerProgramas().subscribe({ next: (d) => this.programas = d });
    this.catalogService.ObtenerComunidades().subscribe({ next: (d) => this.comunidades = d });
  }

  get activeTabMeta() {
    return this.subTab === 'educacion'
      ? { key: 'educacion', label: 'Educación', programa: 'Educación', color: '#4B9CD3' }
      : { key: 'mujeres', label: 'Mujeres', programa: 'Mujeres', color: '#9333EA' };
  }

  get currentTabPrograma() { return this.activeTabMeta.programa; }

  /** Opciones del select "Programa" acotadas a la pestaña activa (y al alcance del rol). */
  get programasVisibles(): CatalogItem[] {
    return this.programas.filter(p => this.alcanceService.coincide(p.nombre, this.subTab));
  }

  get byPrograma() {
    return this.participantes.filter(p =>
      (p.programa_nombre || '').toLowerCase().includes(this.currentTabPrograma.toLowerCase())
    );
  }

  get catNames(): string[] {
    return [...new Set(this.byPrograma.map(p => p.categoria_nombre).filter(Boolean))] as string[];
  }

  get generos(): string[] {
    return [...new Set(this.byPrograma.map(p => p.sexo).filter(Boolean))] as string[];
  }

  get hasFilters(): boolean {
    return !!(this.search || this.fCategoria || this.fGenero || this.fEstado || this.fBeca);
  }

  getTabCount(tab: string): number {
    const prog = tab === 'educacion' ? 'Educación' : 'Mujeres';
    return this.participantes.filter(p =>
      (p.programa_nombre || '').toLowerCase().includes(prog.toLowerCase())
    ).length;
  }

  get conteoTabs(): Record<ProgramaClave, number> {
    return {
      educacion: this.getTabCount('educacion'),
      mujeres: this.getTabCount('mujeres')
    };
  }

  cambiarSubTab(tab: ProgramaClave) {
    this.subTab = tab;
    this.search = '';
    this.fCategoria = '';
    this.fGenero = '';
    this.fEstado = '';
    this.fBeca = '';
    this.filtrar();
  }

  filtrar() {
    let filtered = [...this.byPrograma];
    if (this.search) {
      const s = this.search.toLowerCase();
      filtered = filtered.filter(p =>
        `${p.primer_nombre} ${p.segundo_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''}`.toLowerCase().includes(s)
      );
    }
    if (this.fCategoria) filtered = filtered.filter(p => p.categoria_nombre === this.fCategoria);
    if (this.fGenero) filtered = filtered.filter(p => p.sexo === this.fGenero);
    if (this.fEstado === 'activo') filtered = filtered.filter(p => p.estado);
    if (this.fEstado === 'inactivo') filtered = filtered.filter(p => !p.estado);
    if (this.fBeca === 'beca') filtered = filtered.filter(p => p.beca);
    if (this.fBeca === 'sin') filtered = filtered.filter(p => !p.beca);
    filtered.sort((a, b) => {
      const na = `${a.primer_nombre} ${a.primer_apellido}`;
      const nb = `${b.primer_nombre} ${b.primer_apellido}`;
      return this.sortDir === 'asc' ? na.localeCompare(nb, 'es') : nb.localeCompare(na, 'es');
    });
    this.participantesFiltrados = filtered;
  }

  toggleSort() { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; this.filtrar(); }

  limpiarFiltros() {
    this.search = ''; this.fCategoria = ''; this.fGenero = ''; this.fEstado = ''; this.fBeca = '';
    this.filtrar();
  }

  calcEdad(fecha?: string): number | null {
    if (!fecha) return null;
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  getInitials(p: Participante): string {
    return ((p.primer_nombre?.[0] || '') + (p.primer_apellido?.[0] || '')).toUpperCase();
  }

  getProgramaBadge(p: Participante): string {
    return (p.programa_nombre || '').includes('Mujer') ? 'badge-purple' : 'badge-blue';
  }

  crearFormularioVacio() {
    let progId = 1;
    const tabKey = this.currentTabPrograma.toLowerCase();
    const found = this.programas.find(p => p.nombre.toLowerCase().includes(tabKey));
    if (found) progId = found.id;
    else if (this.programas.length > 0) {
      const fallback = this.programas.find(p => p.nombre.toLowerCase().includes('mujeres'));
      if (fallback && tabKey === 'mujeres') progId = fallback.id;
    }
    return {
      id_programa: progId,
      id_proyecto: undefined,
      id_categoria: this.categorias[0]?.id || 1,
      id_comunidad: undefined,
      primer_nombre: '', segundo_nombre: '', tercer_nombre: '',
      primer_apellido: '', segundo_apellido: '', tercer_apellido: '',
      fecha_nacimiento: '', sexo: '', dpi: '', telefono: '', correo: '',
      estado: true,
      beca: false, monto_beca: 0,
      contacto: { telefono_principal: '', telefono_secundario: '', correo: '', contacto_emergencia: '', telefono_emergencia: '' } as ContactoParticipante,
      direccion: { id_comunidad: undefined, direccion: '', referencia: '' } as Direccion,
      familiares: [{
        primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
        dpi: '', telefono: '', correo: '', parentesco: '', responsable: true
      }] as Familiar[]
    };
  }

  abrirCrear() {
    this.editando = false;
    this.error = '';
    this.form = this.crearFormularioVacio();
    this.mostrarModal = true;
  }

  abrirEditar(p: Participante) {
    this.editando = true;
    this.editId = p.id_participante;
    this.error = '';
    this.form = {
      id_programa: p.id_programa, id_proyecto: p.id_proyecto || undefined,
      id_categoria: p.id_categoria, id_comunidad: p.id_comunidad || undefined,
      primer_nombre: p.primer_nombre, segundo_nombre: p.segundo_nombre || '',
      tercer_nombre: p.tercer_nombre || '',
      primer_apellido: p.primer_apellido, segundo_apellido: p.segundo_apellido || '',
      tercer_apellido: p.tercer_apellido || '',
      fecha_nacimiento: p.fecha_nacimiento?.split('T')[0] || '',
      sexo: p.sexo || '', dpi: p.dpi || '', telefono: p.telefono || '', correo: p.correo || '',
      estado: p.estado,
      beca: p.beca || false, monto_beca: p.monto_beca || 0,
      contacto: {
        telefono_principal: p.contacto?.telefono_principal || '',
        telefono_secundario: p.contacto?.telefono_secundario || '',
        correo: p.contacto?.correo || '',
        contacto_emergencia: p.contacto?.contacto_emergencia || '',
        telefono_emergencia: p.contacto?.telefono_emergencia || ''
      },
      direccion: {
        id_comunidad: p.direccion?.id_comunidad || undefined,
        direccion: p.direccion?.direccion || '',
        referencia: p.direccion?.referencia || ''
      },
      familiares: p.familiares && p.familiares.length > 0 ? p.familiares.map(f => ({
        primer_nombre: f.primer_nombre, segundo_nombre: f.segundo_nombre || '',
        primer_apellido: f.primer_apellido, segundo_apellido: f.segundo_apellido || '',
        dpi: f.dpi || '', telefono: f.telefono || '', correo: f.correo || '',
        parentesco: f.parentesco || '', responsable: f.responsable
      })) : [{ primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', dpi: '', telefono: '', correo: '', parentesco: '', responsable: true }]
    };
    this.mostrarModal = true;
  }

  cerrarModal() { this.mostrarModal = false; this.error = ''; }

  get mostrarPadres(): boolean {
    const progNombre = this.programas.find(p => p.id === this.form.id_programa)?.nombre || this.currentTabPrograma;
    const esEducacion = progNombre.toLowerCase().includes('educación') || progNombre.toLowerCase().includes('educacion');
    const edad = this.calcEdad(this.form.fecha_nacimiento);
    const esMenor = edad !== null && edad < 18;
    return esEducacion || esMenor;
  }

  get edadCalculada(): number | null { return this.calcEdad(this.form.fecha_nacimiento); }
  get esMenor(): boolean { const e = this.edadCalculada; return e !== null && e < 18; }

  agregarFamiliar() {
    this.form.familiares.push({
      primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
      dpi: '', telefono: '', correo: '', parentesco: '', responsable: false
    });
  }

  eliminarFamiliar(i: number) { if (this.form.familiares.length > 1) this.form.familiares.splice(i, 1); }

  guardar() {
    this.error = '';
    if (!this.form.primer_nombre?.trim()) { this.error = 'El nombre es requerido.'; return; }
    if (!this.form.primer_apellido?.trim()) { this.error = 'El apellido es requerido.'; return; }
    if (!this.form.fecha_nacimiento) { this.error = 'La fecha de nacimiento es requerida.'; return; }
    if (!this.form.sexo) { this.error = 'El género es requerido.'; return; }
    if (!this.form.id_programa) { this.error = 'Debe seleccionar un programa.'; return; }
    if (!this.form.id_categoria) { this.error = 'Debe seleccionar una categoría.'; return; }
    if (this.mostrarPadres && !this.form.familiares[0]?.primer_nombre?.trim()) {
      const esEducacion = (this.programas.find(p => p.id === this.form.id_programa)?.nombre || '').toLowerCase().includes('educación');
      this.error = esEducacion
        ? 'Debe ingresar el nombre del padre, madre o encargado.'
        : 'Para menores de edad debe ingresar el nombre del encargado.';
      return;
    }
    this.saving = true;
    if (this.editando) {
      this.confirmarAccion('update');
    } else {
      this.confirmarAccion('create');
    }
  }

  confirmarAccion(tipo: 'create' | 'update' | 'delete', item?: any) {
    this.dialogoTipo = tipo;
    this.dialogoItem = item || null;
    this.mostrarDialogo = true;
  }

  ejecutarAccion() {
    this.mostrarDialogo = false;

    if (this.dialogoTipo === 'delete' && this.dialogoItem) {
      this.participanteService.Eliminar(this.dialogoItem.id_participante).subscribe({
        next: () => { this.showToast('success', `Participante '${this.dialogoItem.primer_nombre} ${this.dialogoItem.primer_apellido}' eliminado.`); this.load(); this.saving = false; },
        error: () => { this.showToast('error', 'No se pudo eliminar el participante'); this.saving = false; }
      });
      return;
    }

    const payload: CrearParticipanteRequest = {
      id_programa: this.form.id_programa,
      id_proyecto: this.form.id_proyecto,
      id_categoria: this.form.id_categoria,
      id_comunidad: this.form.id_comunidad,
      primer_nombre: this.form.primer_nombre,
      segundo_nombre: this.form.segundo_nombre || undefined,
      tercer_nombre: this.form.tercer_nombre || undefined,
      primer_apellido: this.form.primer_apellido,
      segundo_apellido: this.form.segundo_apellido || undefined,
      tercer_apellido: this.form.tercer_apellido || undefined,
      fecha_nacimiento: this.form.fecha_nacimiento,
      sexo: this.form.sexo || undefined,
      dpi: this.form.dpi || undefined,
      telefono: this.form.telefono || undefined,
      correo: this.form.correo || undefined,
      estado: this.form.estado,
      beca: this.form.beca || false,
      monto_beca: this.form.beca ? (this.form.monto_beca || 0) : 0,
      contacto: this.form.contacto,
      direccion: this.form.direccion,
      familiares: this.mostrarPadres && this.form.familiares ? this.form.familiares.filter((f: Familiar) => f.primer_nombre?.trim()) : undefined
    };

    if (this.dialogoTipo === 'create') {
      this.participanteService.Crear(payload).subscribe({
        next: (res) => {
          const afterSave = () => {
            this.showToast('success', 'Participante registrado correctamente.');
            this.load();
            this.cerrarModal();
            this.saving = false;
          };
          if (this.form.fotografia_archivo) {
            this.participanteService.SubirFotografia(res.id_participante, this.form.fotografia_archivo).subscribe({
              next: () => afterSave(),
              error: () => afterSave()
            });
          } else {
            afterSave();
          }
        },
        error: () => { this.showToast('error', 'No se pudo registrar el participante'); this.saving = false; }
      });
    } else if (this.dialogoTipo === 'update') {
      this.participanteService.Actualizar(this.editId, payload).subscribe({
        next: () => {
          const afterSave = () => {
            this.showToast('success', 'Participante actualizado correctamente.');
            this.load();
            this.cerrarModal();
            this.saving = false;
          };
          if (this.form.fotografia_archivo) {
            this.participanteService.SubirFotografia(this.editId, this.form.fotografia_archivo).subscribe({
              next: () => afterSave(),
              error: () => afterSave()
            });
          } else {
            afterSave();
          }
        },
        error: () => { this.showToast('error', 'No se pudo actualizar el participante'); this.saving = false; }
      });
    }
  }

  eliminar(p: Participante) { this.confirmarAccion('delete', p); }

  verPerfil(p: Participante) { this.router.navigate(['/participantes', p.id_participante]); }

  generarReporte(tipo: string) {
    let lista = [...this.participantesFiltrados];
    let titulo = 'Reporte General de Participantes';
    if (tipo === 'activos') { lista = lista.filter(p => p.estado); titulo = 'Participantes Activos'; }
    if (tipo === 'inactivos') { lista = lista.filter(p => !p.estado); titulo = 'Participantes Inactivos'; }
    this.reporteHtml = this.reporteService.generarReporteGeneral(lista, titulo);
    this.reporteTitulo = titulo;
    this.reporteLista = lista;
    this.reporteTipo = 'general';
    this.mostrarReporte = true;
  }

  descargarReporte(p: Participante) {
    this.reporteHtml = this.reporteService.generarReportePerfil(p);
    this.reporteTitulo = `Expediente - ${p.primer_nombre} ${p.primer_apellido}`;
    this.reporteLista = [p];
    this.reporteTipo = 'perfil';
    this.mostrarReporte = true;
  }

  descargarExcel(tipo: string) {
    let lista = [...this.participantesFiltrados];
    let titulo = 'Participantes';
    if (tipo === 'activos') { lista = lista.filter(p => p.estado); titulo = 'Participantes_Activos'; }
    if (tipo === 'inactivos') { lista = lista.filter(p => !p.estado); titulo = 'Participantes_Inactivos'; }
    this.reporteService.exportarExcel(lista, titulo);
    this.showToast('success', 'Excel descargado correctamente');
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.error = 'Seleccione una imagen válida'; return; }
    const reader = new FileReader();
    reader.onload = () => {
      this.form.fotografia_preview = reader.result as string;
      this.form.fotografia_archivo = file;
    };
    reader.readAsDataURL(file);
  }

  subirFotografia(idParticipante: number) {
    if (!this.form.fotografia_archivo) return;
    this.participanteService.SubirFotografia(idParticipante, this.form.fotografia_archivo).subscribe({
      next: (res) => { this.showToast('success', 'Fotografía subida'); },
      error: () => { this.showToast('error', 'Error al subir fotografía'); }
    });
  }

  showToast(type: string, message: string) {
    this.toasts.push({ type, message });
    setTimeout(() => this.toasts.shift(), 3800);
  }
}

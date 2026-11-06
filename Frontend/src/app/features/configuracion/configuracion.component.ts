import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import {
  UsuarioService, RolService, CatalogService
} from '../../core/services/usuario.service';
import { GrupoService } from '../../core/services/grupo.service';
import {
  Usuario, Rol, Permiso, Modulo, CrearUsuarioRequest, ActualizarUsuarioRequest,
  CrearRolRequest, ActualizarPermisosRequest, CatalogItem,
  Grupo, CrearGrupoRequest, GrupoParticipante
} from '../../core/models/models';
import { BackupService, BackupItem, BackupConfig } from '../../core/services/backup.service';
import { AparienciaService, Apariencia, TAMANOS_FUENTE } from '../../core/services/apariencia.service';
import { descargarArchivo } from '../../core/utils/descargar.util';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit {
  seccionActiva = 'usuarios';

  // Catalogs
  tiposUsuario: CatalogItem[] = [];

  // Usuarios
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtroUsuario = '';
  ordenAsc = true;
  mostrarModalUsuario = false;
  editandoUsuario = false;
  editUsuarioId = 0;
  formUsuario: any = {};
  usuarioRoles: number[] = [];

  // Roles
  roles: Rol[] = [];
  rolesFiltrados: Rol[] = [];
  filtroRol = '';
  mostrarModalRol = false;
  editandoRol = false;
  editRolId = 0;
  formRol: any = {};

  // Permisos
  modulos: Modulo[] = [];
  permisos: Permiso[] = [];
  rolSeleccionado: Rol | null = null;
  permisosModulos: { id_modulo: number; permisos: number[] }[] = [];

  // Dialog
  mostrarDialogo = false;
  dialogoTitulo = '';
  dialogoMensaje = '';
  dialogoTipo: 'info' | 'danger' = 'info';
  dialogoAccion: (() => void) | null = null;

  // Toast
  toasts: { type: string; message: string }[] = [];

  // Grupos
  grupos: Grupo[] = [];
  gruposFiltrados: Grupo[] = [];
  filtroGrupo = '';
  mostrarModalGrupo = false;
  editandoGrupo = false;
  editGrupoId = 0;
  formGrupo: any = {};
  programas: CatalogItem[] = [];
  participantes: any[] = [];
  participantesFiltrados: any[] = [];
  filtroParticipante = '';
  mostrarModalAsignar = false;
  grupoSeleccionado: Grupo | null = null;

  // Copia de seguridad
  backups: BackupItem[] = [];
  cargandoBackups = false;
  creandoBackup = false;
  configBackup: BackupConfig | null = null;
  formBackupConfig = { activo: false, intervalo: 'diario', hora: '02:00' };
  guardandoConfigBackup = false;
  cargandoRespaldo = false;

  // Apariencia
  formApariencia: Apariencia = {
    nombre_sistema: 'ANADESA',
    color_primario: '#1E3278',
    color_acento: '#26781E',
    tamano_fuente: 'mediana',
    logo: null,
    imagen_login: null
  };
  cargandoApariencia = false;
  guardandoApariencia = false;
  readonly tam = TAMANOS_FUENTE;
  readonly paleta = [
    { nombre: 'Verde Institucional', hex: '#0E6B23' },
    { nombre: 'Amarillo Sol', hex: '#F5A623' },
    { nombre: 'Azul Lago', hex: '#4B9CD3' },
    { nombre: 'Café Oscuro', hex: '#2B0F00' },
    { nombre: 'Blanco Neutro', hex: '#FFFFFF' },
    { nombre: 'Azul Claro', hex: '#EBF5FB' }
  ];

  constructor(
    private usuarioService: UsuarioService,
    private rolService: RolService,
    @Inject(CatalogService) private catalogService: CatalogService,
    private grupoService: GrupoService,
    private backupService: BackupService,
    private aparienciaService: AparienciaService
  ) {}

  ngOnInit() {
    this.cargarTiposUsuario();
    this.cargarUsuarios();
    this.formApariencia = { ...this.aparienciaService.datos };
  }

  cambiarSeccion(seccion: string) {
    this.seccionActiva = seccion;
    if (seccion === 'usuarios') this.cargarUsuarios();
    if (seccion === 'roles') this.cargarRoles();
    if (seccion === 'permisos') this.cargarPermisos();
    if (seccion === 'grupos') this.cargarGrupos();
    if (seccion === 'backup') {
      this.cargarBackups();
      this.cargarConfigBackup();
    }
    if (seccion === 'apariencia') this.cargarApariencia();
  }

  // === CATALOGS ===
  cargarTiposUsuario() {
    this.catalogService.ObtenerTiposUsuario().subscribe({
      next: (data) => this.tiposUsuario = data,
      error: () => {}
    });
  }

  getNombreTipoUsuario(id: number): string {
    const t = this.tiposUsuario.find(t => t.id === id);
    return t ? t.nombre : '';
  }

  // === USUARIOS ===
  cargarUsuarios() {
    this.usuarioService.ObtenerTodos().subscribe({
      next: (data) => { this.usuarios = data; this.filtrarUsuarios(); },
      error: () => this.showToast('error', 'No se pudieron cargar los usuarios')
    });
  }

  filtrarUsuarios() {
    let filtered = [...this.usuarios];
    if (this.filtroUsuario) {
      const f = this.filtroUsuario.toLowerCase();
      filtered = filtered.filter(u =>
        (u.usuario + ' ' + u.primer_nombre + ' ' + u.primer_apellido + ' ' + (u.correo || '') + ' ' + (u.tipo_usuario_nombre || '')).toLowerCase().includes(f)
      );
    }
    const dir = this.ordenAsc ? 1 : -1;
    filtered.sort((a, b) => a.usuario.localeCompare(b.usuario) * dir);
    this.usuariosFiltrados = filtered;
  }

  toggleOrdenUsuarios() {
    this.ordenAsc = !this.ordenAsc;
    this.filtrarUsuarios();
  }

  getInitials(u: Usuario): string {
    return ((u.primer_nombre?.[0] || '') + (u.primer_apellido?.[0] || '')).toUpperCase();
  }

  getRolBadgeClass(u: Usuario): string {
    const nombre = u.tipo_usuario_nombre || '';
    if (nombre.includes('Admin')) return 'badge-navy';
    if (nombre.includes('Educación') || nombre.includes('Educacion')) return 'badge-blue';
    if (nombre.includes('Mujeres')) return 'badge-purple';
    if (nombre.includes('Coordinador')) return 'badge-yellow';
    return 'badge-gray';
  }

  getRolNombre(u: Usuario): string {
    if (u.roles && u.roles.length > 0) return u.roles[0].nombre;
    return u.tipo_usuario_nombre || 'Sin rol';
  }

  abrirCrearUsuario() {
    this.editandoUsuario = false;
    this.usuarioRoles = [];
    this.formUsuario = {
      id_tipo_usuario: 3, primer_nombre: '', segundo_nombre: '',
      primer_apellido: '', segundo_apellido: '', usuario: '',
      contrasena: '', correo: '', telefono: '', estado: true
    };
    if (!this.roles.length) this.cargarRoles();
    this.mostrarModalUsuario = true;
  }

  abrirEditarUsuario(u: Usuario) {
    this.editandoUsuario = true;
    this.editUsuarioId = u.id_usuario;
    this.usuarioRoles = u.roles ? u.roles.map(r => r.id_rol) : [];
    this.formUsuario = {
      id_tipo_usuario: u.id_tipo_usuario,
      primer_nombre: u.primer_nombre, segundo_nombre: u.segundo_nombre || '',
      primer_apellido: u.primer_apellido, segundo_apellido: u.segundo_apellido || '',
      usuario: u.usuario, contrasena: '',
      correo: u.correo || '', telefono: u.telefono || '',
      estado: u.estado
    };
    if (!this.roles.length) this.cargarRoles();
    this.mostrarModalUsuario = true;
  }

  cerrarModalUsuario() {
    this.mostrarModalUsuario = false;
  }

  toggleRolUsuario(idRol: number) {
    const idx = this.usuarioRoles.indexOf(idRol);
    if (idx >= 0) this.usuarioRoles.splice(idx, 1);
    else this.usuarioRoles.push(idRol);
  }

  guardarUsuario() {
    if (!this.formUsuario.primer_nombre || !this.formUsuario.usuario) {
      this.showToast('error', 'Nombre y usuario son requeridos');
      return;
    }
    if (this.usuarioRoles.length === 0) {
      this.showToast('error', 'Selecciona al menos un rol en "Roles asignados"');
      return;
    }
    if (this.editandoUsuario) {
      const req: ActualizarUsuarioRequest = {
        id_tipo_usuario: this.formUsuario.id_tipo_usuario,
        primer_nombre: this.formUsuario.primer_nombre,
        segundo_nombre: this.formUsuario.segundo_nombre || undefined,
        primer_apellido: this.formUsuario.primer_apellido,
        segundo_apellido: this.formUsuario.segundo_apellido || undefined,
        usuario: this.formUsuario.usuario,
        contrasena: this.formUsuario.contrasena || undefined,
        correo: this.formUsuario.correo || undefined,
        telefono: this.formUsuario.telefono || undefined,
        estado: this.formUsuario.estado,
        roles: this.usuarioRoles.length > 0 ? this.usuarioRoles : undefined
      };
      this.usuarioService.Actualizar(this.editUsuarioId, req).subscribe({
        next: () => {
          this.showToast('success', 'Usuario actualizado correctamente');
          this.cargarUsuarios();
          this.cerrarModalUsuario();
        },
        error: (err) => this.showToast('error', err.error?.message || 'No se pudo actualizar el usuario')
      });
    } else {
      if (!this.formUsuario.contrasena) {
        this.showToast('error', 'La contraseña es requerida');
        return;
      }
      const req: CrearUsuarioRequest = {
        id_tipo_usuario: this.formUsuario.id_tipo_usuario,
        primer_nombre: this.formUsuario.primer_nombre,
        segundo_nombre: this.formUsuario.segundo_nombre || undefined,
        primer_apellido: this.formUsuario.primer_apellido,
        segundo_apellido: this.formUsuario.segundo_apellido || undefined,
        usuario: this.formUsuario.usuario,
        contrasena: this.formUsuario.contrasena,
        correo: this.formUsuario.correo || undefined,
        telefono: this.formUsuario.telefono || undefined,
        estado: this.formUsuario.estado,
        roles: this.usuarioRoles.length > 0 ? this.usuarioRoles : undefined
      };
      this.usuarioService.Crear(req).subscribe({
        next: () => {
          this.showToast('success', 'Usuario creado correctamente');
          this.cargarUsuarios();
          this.cerrarModalUsuario();
        },
        error: (err) => this.showToast('error', err.error?.message || 'No se pudo crear el usuario')
      });
    }
  }

  eliminarUsuario(u: Usuario) {
    this.dialogoTitulo = 'Eliminar usuario';
    this.dialogoMensaje = `¿Estás seguro de eliminar al usuario "${u.usuario}"? Esta acción no se puede deshacer.`;
    this.dialogoTipo = 'danger';
    this.dialogoAccion = () => {
      this.usuarioService.Eliminar(u.id_usuario).subscribe({
        next: () => {
          this.showToast('success', 'Usuario eliminado correctamente');
          this.cargarUsuarios();
        },
        error: () => this.showToast('error', 'No se pudo eliminar el usuario')
      });
    };
    this.mostrarDialogo = true;
  }

  // === ROLES ===
  cargarRoles() {
    this.rolService.ObtenerTodos().subscribe({
      next: (data) => { this.roles = data; this.filtrarRoles(); },
      error: () => this.showToast('error', 'No se pudieron cargar los roles')
    });
  }

  filtrarRoles() {
    let filtered = [...this.roles];
    if (this.filtroRol) {
      const f = this.filtroRol.toLowerCase();
      filtered = filtered.filter(r => r.nombre.toLowerCase().includes(f) || (r.descripcion || '').toLowerCase().includes(f));
    }
    this.rolesFiltrados = filtered;
  }

  getRolIcon(nombre: string): string {
    if (nombre.includes('Admin')) return 'fa-shield-alt';
    if (nombre.includes('Coordinador')) return 'fa-user-tie';
    if (nombre.includes('Educación') || nombre.includes('Educacion')) return 'fa-graduation-cap';
    if (nombre.includes('Mujeres')) return 'fa-venus';
    return 'fa-user';
  }

  abrirCrearRol() {
    this.editandoRol = false;
    this.formRol = { nombre: '', descripcion: '', estado: true };
    this.mostrarModalRol = true;
  }

  abrirEditarRol(r: Rol) {
    this.editandoRol = true;
    this.editRolId = r.id_rol;
    this.formRol = { nombre: r.nombre, descripcion: r.descripcion || '', estado: r.estado };
    this.mostrarModalRol = true;
  }

  cerrarModalRol() {
    this.mostrarModalRol = false;
  }

  guardarRol() {
    if (!this.formRol.nombre) {
      this.showToast('error', 'El nombre del rol es requerido');
      return;
    }
    const req: CrearRolRequest = {
      nombre: this.formRol.nombre,
      descripcion: this.formRol.descripcion || undefined,
      estado: this.formRol.estado
    };
    if (this.editandoRol) {
      this.rolService.Actualizar(this.editRolId, req).subscribe({
        next: () => {
          this.showToast('success', 'Rol actualizado correctamente');
          this.cargarRoles();
          this.cerrarModalRol();
        },
        error: () => this.showToast('error', 'No se pudo actualizar el rol')
      });
    } else {
      this.rolService.Crear(req).subscribe({
        next: () => {
          this.showToast('success', 'Rol creado correctamente');
          this.cargarRoles();
          this.cerrarModalRol();
        },
        error: () => this.showToast('error', 'No se pudo crear el rol')
      });
    }
  }

  eliminarRol(r: Rol) {
    this.dialogoTitulo = 'Eliminar rol';
    this.dialogoMensaje = `¿Estás seguro de eliminar el rol "${r.nombre}"? Esta acción no se puede deshacer.`;
    this.dialogoTipo = 'danger';
    this.dialogoAccion = () => {
      this.rolService.Eliminar(r.id_rol).subscribe({
        next: () => {
          this.showToast('success', 'Rol eliminado correctamente');
          this.cargarRoles();
        },
        error: () => this.showToast('error', 'No se pudo eliminar el rol')
      });
    };
    this.mostrarDialogo = true;
  }

  // === PERMISOS ===
  cargarPermisos() {
    this.rolService.ObtenerModulos().subscribe({
      next: (data) => this.modulos = data,
      error: () => {}
    });
    this.rolService.ObtenerPermisos().subscribe({
      next: (data) => this.permisos = data,
      error: () => {}
    });
    this.rolService.ObtenerTodos().subscribe({
      next: (data) => this.roles = data,
      error: () => {}
    });
  }

  seleccionarRolParaPermisos(r: Rol) {
    this.rolSeleccionado = r;
    this.rolService.ObtenerPorId(r.id_rol).subscribe({
      next: (rolDetalle) => {
        this.rolSeleccionado = rolDetalle;
        this.permisosModulos = this.modulos.map(m => ({
          id_modulo: m.id_modulo,
          permisos: (rolDetalle.permisos || []).filter(p => p.id_modulo === m.id_modulo).map(p => p.id_permiso)
        }));
      },
      error: () => this.showToast('error', 'No se pudieron cargar los permisos del rol')
    });
  }

  togglePermiso(idModulo: number, idPermiso: number) {
    const entry = this.permisosModulos.find(e => e.id_modulo === idModulo);
    if (!entry) return;
    const idx = entry.permisos.indexOf(idPermiso);
    if (idx >= 0) entry.permisos.splice(idx, 1);
    else entry.permisos.push(idPermiso);
  }

  tienePermiso(idModulo: number, idPermiso: number): boolean {
    const entry = this.permisosModulos.find(e => e.id_modulo === idModulo);
    return entry ? entry.permisos.includes(idPermiso) : false;
  }

  guardarPermisos() {
    if (!this.rolSeleccionado) return;
    const req: ActualizarPermisosRequest = {
      modulos: this.permisosModulos.filter(e => e.permisos.length > 0).map(e => e.id_modulo),
      permisosPorModulo: this.permisosModulos.filter(e => e.permisos.length > 0).map(e => ({
        id_modulo: e.id_modulo,
        permisos: e.permisos
      }))
    };
    this.rolService.ActualizarPermisos(this.rolSeleccionado.id_rol, req).subscribe({
      next: () => {
        this.showToast('success', 'Permisos actualizados correctamente');
        this.rolSeleccionado = null;
      },
      error: () => this.showToast('error', 'No se pudieron guardar los permisos')
    });
  }

  // === GRUPOS ===
  cargarGrupos() {
    this.grupoService.ObtenerTodos().subscribe({
      next: (data) => { this.grupos = data; this.filtrarGrupos(); },
      error: () => this.showToast('error', 'No se pudieron cargar los grupos')
    });
    this.grupoService.ObtenerProgramas().subscribe({
      next: (data) => this.programas = data,
      error: () => {}
    });
  }

  filtrarGrupos() {
    let filtered = [...this.grupos];
    if (this.filtroGrupo) {
      const f = this.filtroGrupo.toLowerCase();
      filtered = filtered.filter(g =>
        g.nombre.toLowerCase().includes(f) ||
        (g.descripcion || '').toLowerCase().includes(f) ||
        (g.programa_nombre || '').toLowerCase().includes(f)
      );
    }
    this.gruposFiltrados = filtered;
  }

  abrirCrearGrupo() {
    this.editandoGrupo = false;
    this.formGrupo = { id_programa: 0, nombre: '', descripcion: '', estado: true };
    this.mostrarModalGrupo = true;
  }

  abrirEditarGrupo(g: Grupo) {
    this.editandoGrupo = true;
    this.editGrupoId = g.id_grupo;
    this.formGrupo = {
      id_programa: g.id_programa,
      nombre: g.nombre,
      descripcion: g.descripcion || '',
      estado: g.estado
    };
    this.mostrarModalGrupo = true;
  }

  cerrarModalGrupo() {
    this.mostrarModalGrupo = false;
  }

  guardarGrupo() {
    if (!this.formGrupo.nombre || !this.formGrupo.id_programa) {
      this.showToast('error', 'Nombre y programa son requeridos');
      return;
    }
    const req: CrearGrupoRequest = {
      id_programa: this.formGrupo.id_programa,
      nombre: this.formGrupo.nombre,
      descripcion: this.formGrupo.descripcion || undefined,
      estado: this.formGrupo.estado
    };
    if (this.editandoGrupo) {
      this.grupoService.Actualizar(this.editGrupoId, req).subscribe({
        next: () => {
          this.showToast('success', 'Grupo actualizado correctamente');
          this.cargarGrupos();
          this.cerrarModalGrupo();
        },
        error: () => this.showToast('error', 'No se pudo actualizar el grupo')
      });
    } else {
      this.grupoService.Crear(req).subscribe({
        next: () => {
          this.showToast('success', 'Grupo creado correctamente');
          this.cargarGrupos();
          this.cerrarModalGrupo();
        },
        error: () => this.showToast('error', 'No se pudo crear el grupo')
      });
    }
  }

  eliminarGrupo(g: Grupo) {
    this.dialogoTitulo = 'Eliminar grupo';
    this.dialogoMensaje = `¿Estás seguro de eliminar el grupo "${g.nombre}"? Se eliminarán también las asignaciones de participantes.`;
    this.dialogoTipo = 'danger';
    this.dialogoAccion = () => {
      this.grupoService.Eliminar(g.id_grupo).subscribe({
        next: () => {
          this.showToast('success', 'Grupo eliminado correctamente');
          this.cargarGrupos();
        },
        error: () => this.showToast('error', 'No se pudo eliminar el grupo')
      });
    };
    this.mostrarDialogo = true;
  }

  // === ASIGNAR PARTICIPANTES ===
  abrirAsignarParticipante(g: Grupo) {
    this.grupoSeleccionado = g;
    this.filtroParticipante = '';
    this.grupoService.ObtenerParticipantes().subscribe({
      next: (data) => {
        const asignados = g.participantes?.filter(p => p.estado).map(p => p.id_participante) || [];
        this.participantes = data.filter((p: any) => !asignados.includes(p.id_participante) && p.estado);
        this.participantesFiltrados = [...this.participantes];
      },
      error: () => this.showToast('error', 'No se pudieron cargar los participantes')
    });
    this.mostrarModalAsignar = true;
  }

  filtrarParticipantes() {
    if (!this.filtroParticipante) {
      this.participantesFiltrados = [...this.participantes];
      return;
    }
    const f = this.filtroParticipante.toLowerCase();
    this.participantesFiltrados = this.participantes.filter(p =>
      (p.primer_nombre + ' ' + p.primer_apellido).toLowerCase().includes(f)
    );
  }

  asignarParticipante(idParticipante: number) {
    if (!this.grupoSeleccionado) return;
    this.grupoService.AsignarParticipante(this.grupoSeleccionado.id_grupo, idParticipante).subscribe({
      next: () => {
        this.showToast('success', 'Participante asignado correctamente');
        this.cargarGrupos();
        this.cerrarModalAsignar();
      },
      error: () => this.showToast('error', 'No se pudo asignar el participante')
    });
  }

  removerParticipante(gp: GrupoParticipante) {
    this.dialogoTitulo = 'Remover participante';
    this.dialogoMensaje = `¿Estás seguro de remover a "${gp.participante_nombre}" del grupo?`;
    this.dialogoTipo = 'danger';
    this.dialogoAccion = () => {
      this.grupoService.RemoverParticipante(gp.id_grupo_participante).subscribe({
        next: () => {
          this.showToast('success', 'Participante removido correctamente');
          this.cargarGrupos();
        },
        error: () => this.showToast('error', 'No se pudo remover el participante')
      });
    };
    this.mostrarDialogo = true;
  }

  cerrarModalAsignar() {
    this.mostrarModalAsignar = false;
    this.grupoSeleccionado = null;
  }

  getProgramaNombre(id: number): string {
    const p = this.programas.find(p => p.id === id);
    return p ? p.nombre : '';
  }

  // === COPIA DE SEGURIDAD ===
  cargarBackups() {
    this.cargandoBackups = true;
    this.backupService.ObtenerTodos().subscribe({
      next: (data) => { this.backups = data; this.cargandoBackups = false; },
      error: () => {
        this.cargandoBackups = false;
        this.showToast('error', 'No se pudieron cargar las copias de seguridad');
      }
    });
  }

  crearBackup() {
    this.creandoBackup = true;
    this.backupService.Crear().subscribe({
      next: (b) => {
        this.creandoBackup = false;
        this.showToast('success', `Copia creada: ${b.archivo}`);
        this.cargarBackups();
      },
      error: (err) => {
        this.creandoBackup = false;
        this.showToast('error', err.error?.message || 'No se pudo crear la copia de seguridad');
      }
    });
  }

  async descargarBackup(b: BackupItem) {
    this.backupService.Descargar(b.archivo).subscribe({
      next: async (blob) => {
        descargarArchivo(blob, b.archivo);
      },
      error: (err) => this.showToast('error', err.error?.message || 'No se pudo descargar la copia')
    });
  }

  eliminarBackup(b: BackupItem) {
    this.dialogoTitulo = 'Eliminar copia de seguridad';
    this.dialogoMensaje = `¿Eliminar el archivo "${b.archivo}"? Esta acción no se puede deshacer.`;
    this.dialogoTipo = 'danger';
    this.dialogoAccion = () => {
      this.backupService.Eliminar(b.archivo).subscribe({
        next: () => {
          this.showToast('success', 'Copia de seguridad eliminada');
          this.cargarBackups();
        },
        error: (err) => this.showToast('error', err.error?.message || 'No se pudo eliminar la copia')
      });
    };
    this.mostrarDialogo = true;
  }

  restaurarBackup(b: BackupItem) {
    this.dialogoTitulo = 'Restaurar copia de seguridad';
    this.dialogoMensaje = `Se restaurará la base de datos desde "${b.archivo}". Los cambios realizados DESPUÉS de esta copia se perderán. ¿Continuar?`;
    this.dialogoTipo = 'danger';
    this.dialogoAccion = () => {
      this.showToast('success', 'Restaurando base de datos, espere un momento...');
      this.backupService.Restaurar(b.archivo).subscribe({
        next: () => {
          this.showToast('success', 'Base de datos restaurada correctamente');
          this.cargarBackups();
        },
        error: (err) => this.showToast('error', err.error?.message || 'No se pudo restaurar la copia')
      });
    };
    this.mostrarDialogo = true;
  }

  formatoTamano(bytes: number): string {
    if (!bytes) return '0 B';
    const unidades = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${unidades[i]}`;
  }

  cargarRespaldo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.bak')) {
      this.showToast('error', 'Debe seleccionar un archivo con extensión .bak');
      return;
    }
    if (file.size > 1073741824) {
      this.showToast('error', 'El archivo supera el tamaño máximo de 1 GB');
      return;
    }
    this.cargandoRespaldo = true;
    this.backupService.Cargar(file).subscribe({
      next: (b) => {
        this.cargandoRespaldo = false;
        this.showToast('success', `Respaldo cargado: ${b.archivo}`);
        this.cargarBackups();
      },
      error: (err) => {
        this.cargandoRespaldo = false;
        this.showToast('error', err.error?.message || 'No se pudo cargar el respaldo');
      }
    });
  }

  cargarConfigBackup() {
    this.backupService.ObtenerConfig().subscribe({
      next: (c) => {
        this.configBackup = c;
        this.formBackupConfig = { activo: c.activo, intervalo: c.intervalo, hora: c.hora };
      },
      error: () => { /* sin permiso o API no disponible: se conserva el valor por defecto */ }
    });
  }

  guardarConfigBackup() {
    this.dialogoTitulo = '¿Guardar configuración de respaldo?';
    this.dialogoMensaje = 'Se actualizará la programación de copias de seguridad automáticas.';
    this.dialogoTipo = 'info';
    this.dialogoAccion = () => {
      this.guardandoConfigBackup = true;
      this.backupService.GuardarConfig({ ...this.formBackupConfig }).subscribe({
        next: (c) => {
          this.configBackup = c;
          this.formBackupConfig = { activo: c.activo, intervalo: c.intervalo, hora: c.hora };
          this.guardandoConfigBackup = false;
          this.showToast('success', 'Configuración de respaldo guardada');
        },
        error: (err) => {
          this.guardandoConfigBackup = false;
          this.showToast('error', err.error?.message || 'No se pudo guardar la configuración');
        }
      });
    };
    this.mostrarDialogo = true;
  }

  // === APARIENCIA ===
  cargarApariencia() {
    this.cargandoApariencia = true;
    this.aparienciaService.Obtener().subscribe({
      next: (a) => {
        this.formApariencia = { ...a };
        this.cargandoApariencia = false;
      },
      error: () => {
        this.cargandoApariencia = false;
        this.showToast('error', 'No se pudo cargar la configuración de apariencia');
      }
    });
  }

  guardarApariencia() {
    if (!this.formApariencia.nombre_sistema || !this.formApariencia.nombre_sistema.trim()) {
      this.showToast('error', 'El nombre mostrado en el sistema es requerido');
      return;
    }
    this.guardandoApariencia = true;
    this.aparienciaService.Guardar({ ...this.formApariencia }).subscribe({
      next: (a) => {
        this.formApariencia = { ...a };
        this.guardandoApariencia = false;
        this.showToast('success', 'Apariencia guardada y aplicada');
      },
      error: (err) => {
        this.guardandoApariencia = false;
        this.showToast('error', err.error?.message || 'No se pudo guardar la apariencia');
      }
    });
  }

  seleccionarImagen(event: Event, campo: 'logo' | 'imagen_login') {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.showToast('error', 'Seleccione un archivo de imagen válido');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.showToast('error', 'La imagen no puede superar los 3 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.formApariencia[campo] = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  quitarImagen(campo: 'logo' | 'imagen_login') {
    this.formApariencia[campo] = null;
  }

  // === DIALOG ===
  ejecutarAccion() {
    this.mostrarDialogo = false;
    if (this.dialogoAccion) this.dialogoAccion();
    this.dialogoAccion = null;
  }

  cerrarDialogo() {
    this.mostrarDialogo = false;
    this.dialogoAccion = null;
  }

  showToast(type: string, message: string) {
    this.toasts.push({ type, message });
    setTimeout(() => this.toasts.shift(), 4000);
  }
}

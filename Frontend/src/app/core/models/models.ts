export interface LoginRequest {
  Usuario: string;
  Contrasena: string;
}

export interface LoginResponse {
  token: string;
  expiracion: string;
  usuario: Usuario;
}

export interface Usuario {
  id_usuario: number;
  id_tipo_usuario: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  usuario: string;
  correo?: string;
  telefono?: string;
  fotografia?: string;
  estado: boolean;
  ultimo_acceso?: string;
  fecha_creacion: string;
  tipo_usuario_nombre?: string;
  roles?: Rol[];
}

export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  cantidad_usuarios?: number;
  permisos?: Permiso[];
  modulos?: Modulo[];
}

export interface Permiso {
  id_permiso: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  id_modulo?: number;
}

export interface Modulo {
  id_modulo: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  estado: boolean;
}

export interface CrearUsuarioRequest {
  id_tipo_usuario: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  usuario: string;
  contrasena: string;
  correo?: string;
  telefono?: string;
  estado: boolean;
  roles?: number[];
}

export interface ActualizarUsuarioRequest {
  id_tipo_usuario: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  usuario: string;
  contrasena?: string;
  correo?: string;
  telefono?: string;
  estado: boolean;
  roles?: number[];
}

export interface CrearRolRequest {
  nombre: string;
  descripcion?: string;
  estado: boolean;
}

export interface ActualizarPermisosRequest {
  modulos: number[];
  permisosPorModulo: RolModuloPermisoRequest[];
}

export interface RolModuloPermisoRequest {
  id_modulo: number;
  permisos: number[];
}

export interface CatalogItem {
  id: number;
  nombre: string;
  descripcion?: string;
  extra?: string;
}

export interface Participante {
  id_participante: number;
  id_programa: number;
  id_proyecto?: number;
  id_categoria: number;
  id_comunidad?: number;
  primer_nombre: string;
  segundo_nombre?: string;
  tercer_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  tercer_apellido?: string;
  fecha_nacimiento: string;
  sexo?: string;
  dpi?: string;
  telefono?: string;
  correo?: string;
  estado: boolean;
  fecha_registro: string;
  beca?: boolean;
  monto_beca?: number;
  programa_nombre?: string;
  categoria_nombre?: string;
  comunidad_nombre?: string;
  fotografia_ruta?: string;
  contacto?: ContactoParticipante;
  direccion?: Direccion;
  familiares?: Familiar[];
}

export interface ContactoParticipante {
  telefono_principal?: string;
  telefono_secundario?: string;
  correo?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
}

export interface Direccion {
  id_comunidad?: number;
  direccion?: string;
  referencia?: string;
}

export interface Familiar {
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  dpi?: string;
  telefono?: string;
  correo?: string;
  parentesco: string;
  responsable: boolean;
}

export interface CrearParticipanteRequest {
  id_programa: number;
  id_proyecto?: number;
  id_categoria: number;
  id_comunidad?: number;
  primer_nombre: string;
  segundo_nombre?: string;
  tercer_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  tercer_apellido?: string;
  fecha_nacimiento: string;
  sexo?: string;
  dpi?: string;
  telefono?: string;
  correo?: string;
  estado: boolean;
  beca?: boolean;
  monto_beca?: number;
  contacto?: ContactoParticipante;
  direccion?: Direccion;
  familiares?: Familiar[];
}

export interface Dashboard {
  totalParticipantes: number;
  participantesActivos: number;
  totalMonitoreos: number;
  totalEvaluaciones: number;
  totalActividades: number;
  totalUsuarios: number;
  totalGrupos: number;
}

export interface Grupo {
  id_grupo: number;
  id_programa: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  fecha_creacion: string;
  programa_nombre?: string;
  cantidad_participantes: number;
  participantes?: GrupoParticipante[];
}

export interface GrupoParticipante {
  id_grupo_participante: number;
  id_grupo: number;
  id_participante: number;
  participante_nombre?: string;
  fecha_ingreso: string;
  fecha_salida?: string;
  estado: boolean;
}

export interface CrearGrupoRequest {
  id_programa: number;
  nombre: string;
  descripcion?: string;
  estado: boolean;
}

export interface AsignarParticipanteGrupoRequest {
  id_participante: number;
}

export interface ForgotPasswordRequest {
  correo: string;
}

export interface ResetPasswordRequest {
  correo: string;
  codigo: string;
  nuevaContrasena: string;
}

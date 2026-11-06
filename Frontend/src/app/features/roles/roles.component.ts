import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolService } from '../../core/services/usuario.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { Rol, Modulo, Permiso, CrearRolRequest } from '../../core/models/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  modulos: Modulo[] = [];
  permisos: Permiso[] = [];
  mostrarFormulario = false;
  mostrarPermisos = false;
  rolSeleccionado: Rol | null = null;
  modulosSeleccionados: number[] = [];
  permisosAsignados: { id_modulo: number; id_permiso: number }[] = [];
  nuevoRol: CrearRolRequest = { nombre: '', descripcion: '', estado: true };

  constructor(private rolService: RolService) {}

  ngOnInit() {
    this.cargarRoles();
    this.rolService.ObtenerModulos().subscribe(m => this.modulos = m);
    this.rolService.ObtenerPermisos().subscribe(p => this.permisos = p);
  }

  cargarRoles() {
    this.rolService.ObtenerTodos().subscribe(r => this.roles = r);
  }

  abrirFormulario() {
    this.nuevoRol = { nombre: '', descripcion: '', estado: true };
    this.mostrarFormulario = true;
  }

  crearRol() {
    this.rolService.Crear(this.nuevoRol).subscribe(() => {
      this.cargarRoles();
      this.mostrarFormulario = false;
    });
  }

  editarPermisos(rol: Rol) {
    this.rolSeleccionado = rol;
    this.rolService.ObtenerPorId(rol.id_rol).subscribe(r => {
      this.modulosSeleccionados = r.modulos?.map(m => m.id_modulo) || [];
      this.permisosAsignados = [];
      if (r.permisos) {
        for (const p of r.permisos) {
          if (p.id_modulo) {
            this.permisosAsignados.push({ id_modulo: p.id_modulo, id_permiso: p.id_permiso });
          }
        }
      }
      this.mostrarPermisos = true;
    });
  }

  toggleModulo(id: number) {
    const idx = this.modulosSeleccionados.indexOf(id);
    if (idx >= 0) this.modulosSeleccionados.splice(idx, 1);
    else this.modulosSeleccionados.push(id);
  }

  togglePermiso(idModulo: number, idPermiso: number) {
    const idx = this.permisosAsignados.findIndex(p => p.id_modulo === idModulo && p.id_permiso === idPermiso);
    if (idx >= 0) this.permisosAsignados.splice(idx, 1);
    else this.permisosAsignados.push({ id_modulo: idModulo, id_permiso: idPermiso });
  }

  esPermisoAsignado(idModulo: number, idPermiso: number): boolean {
    return this.permisosAsignados.some(p => p.id_modulo === idModulo && p.id_permiso === idPermiso);
  }

  getNombreModulo(id: number): string {
    return this.modulos.find(m => m.id_modulo === id)?.nombre || '';
  }

  guardarPermisos() {
    if (!this.rolSeleccionado) return;
    const permisosPorModulo: any[] = [];
    for (const idMod of this.modulosSeleccionados) {
      const perms = this.permisosAsignados.filter(p => p.id_modulo === idMod).map(p => p.id_permiso);
      permisosPorModulo.push({ id_modulo: idMod, permisos: perms });
    }
    this.rolService.ActualizarPermisos(this.rolSeleccionado.id_rol, {
      modulos: this.modulosSeleccionados,
      permisosPorModulo
    }).subscribe(() => {
      this.mostrarPermisos = false;
      this.cargarRoles();
    });
  }

  eliminar(rol: Rol) {
    if (confirm('Desactivar el rol "' + rol.nombre + '"?')) {
      this.rolService.Eliminar(rol.id_rol).subscribe(() => this.cargarRoles());
    }
  }
}

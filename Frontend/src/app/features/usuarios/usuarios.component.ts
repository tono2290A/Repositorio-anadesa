import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, RolService } from '../../core/services/usuario.service';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { Usuario, CrearUsuarioRequest, Rol } from '../../core/models/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  roles: Rol[] = [];
  filtro = '';
  mostrarFormulario = false;
  editando = false;
  editId = 0;

  form: any = {
    id_tipo_usuario: 0,
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    usuario: '',
    contrasena: '',
    correo: '',
    telefono: '',
    estado: true,
    roles: []
  };

  constructor(private usuarioService: UsuarioService, private rolService: RolService) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.rolService.ObtenerTodos().subscribe(r => this.roles = r);
  }

  cargarUsuarios() {
    this.usuarioService.ObtenerTodos().subscribe(data => {
      this.usuarios = data;
      this.usuariosFiltrados = data;
    });
  }

  filtrar() {
    const f = this.filtro.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.primer_nombre.toLowerCase().includes(f) ||
      u.usuario.toLowerCase().includes(f) ||
      (u.correo && u.correo.toLowerCase().includes(f))
    );
  }

  abrirFormulario() {
    this.editando = false;
    this.form = { id_tipo_usuario: 0, primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', usuario: '', contrasena: '', correo: '', telefono: '', estado: true, roles: [] };
    this.mostrarFormulario = true;
  }

  editar(u: Usuario) {
    this.editando = true;
    this.editId = u.id_usuario;
    this.form = {
      id_tipo_usuario: u.id_tipo_usuario,
      primer_nombre: u.primer_nombre,
      segundo_nombre: u.segundo_nombre || '',
      primer_apellido: u.primer_apellido,
      segundo_apellido: u.segundo_apellido || '',
      usuario: u.usuario,
      contrasena: '',
      correo: u.correo || '',
      telefono: u.telefono || '',
      estado: u.estado,
      roles: u.roles?.map(r => r.id_rol) || []
    };
    this.mostrarFormulario = true;
  }

  toggleRol(id: number) {
    const idx = this.form.roles.indexOf(id);
    if (idx >= 0) this.form.roles.splice(idx, 1);
    else this.form.roles.push(id);
  }

  guardar() {
    if (this.editando) {
      this.usuarioService.Actualizar(this.editId, this.form).subscribe(() => {
        this.cargarUsuarios();
        this.cerrarFormulario();
      });
    } else {
      this.usuarioService.Crear(this.form).subscribe(() => {
        this.cargarUsuarios();
        this.cerrarFormulario();
      });
    }
  }

  eliminar(u: Usuario) {
    if (confirm('Esta seguro de desactivar al usuario ' + u.usuario + '?')) {
      this.usuarioService.Eliminar(u.id_usuario).subscribe(() => this.cargarUsuarios());
    }
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
  }
}

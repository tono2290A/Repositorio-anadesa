import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AparienciaService, Apariencia } from '../../core/services/apariencia.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario = '';
  contrasena = '';
  loading = false;
  error = '';
  mostrarContrasena = false;

  ape$!: Observable<Apariencia>;
  logoDefecto = 'LOGO_ANADESA.jpg';

  constructor(
    private authService: AuthService,
    private aparienciaService: AparienciaService,
    private router: Router
  ) {
    this.ape$ = this.aparienciaService.datos$;
  }

  onLogin() {
    this.loading = true;
    this.error = '';
    this.authService.login({ Usuario: this.usuario, Contrasena: this.contrasena }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Credenciales incorrectas';
      }
    });
  }
}

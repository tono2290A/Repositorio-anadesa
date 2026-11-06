import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  correo = '';
  codigo = '';
  nuevaContrasena = '';
  loading = false;
  message = '';
  errorMsg = false;

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(p => {
      const c = p.get('correo');
      if (c) this.correo = c;
    });
  }

  onSubmit() {
    this.loading = true;
    this.message = '';
    this.authService.resetPassword({
      correo: this.correo,
      codigo: this.codigo,
      nuevaContrasena: this.nuevaContrasena
    }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message;
        this.errorMsg = false;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Error al restablecer contrasena';
        this.errorMsg = true;
      }
    });
  }
}

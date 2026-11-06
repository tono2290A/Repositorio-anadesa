import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  correo = '';
  loading = false;
  message = '';
  error = false;

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe(p => {
      const c = p.get('correo');
      if (c) this.correo = c;
    });
  }

  onSubmit() {
    this.loading = true;
    this.message = '';
    this.authService.forgotPassword({ correo: this.correo }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.message = res.message;
        this.error = false;
      },
      error: (err) => {
        this.loading = false;
        this.message = err.error?.message || 'Error al enviar el correo';
        this.error = true;
      }
    });
  }

  irARestablecer() {
    this.router.navigate(['/reset-password'], { queryParams: { correo: this.correo } });
  }
}

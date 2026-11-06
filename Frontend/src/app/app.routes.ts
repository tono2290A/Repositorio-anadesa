import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { permisoGuard } from './core/guards/permiso.guard';
import { LoginComponent } from './features/login/login.component';
import { ForgotPasswordComponent } from './features/login/forgot-password.component';
import { ResetPasswordComponent } from './features/login/reset-password.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ParticipantesComponent } from './features/participantes/participantes.component';
import { ParticipantePerfilComponent } from './features/participantes/perfil/participante-perfil.component';
import { ConfiguracionComponent } from './features/configuracion/configuracion.component';
import { AcademicoComponent } from './features/academico/academico.component';
import { ActividadesComponent } from './features/actividades/actividades.component';
import { MonitoreoComponent } from './features/monitoreo/monitoreo.component';
import { EvaluacionesComponent } from './features/evaluaciones/evaluaciones.component';
import { ReportesComponent } from './features/reportes/reportes.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard, permisoGuard(1)] },
  { path: 'participantes', component: ParticipantesComponent, canActivate: [AuthGuard, permisoGuard(3)] },
  { path: 'participantes/:id', component: ParticipantePerfilComponent, canActivate: [AuthGuard, permisoGuard(3)] },
  { path: 'configuracion', component: ConfiguracionComponent, canActivate: [AuthGuard, permisoGuard(9)] },
  { path: 'registro-academico', component: AcademicoComponent, canActivate: [AuthGuard, permisoGuard(4)] },
  { path: 'actividades', component: ActividadesComponent, canActivate: [AuthGuard, permisoGuard(5)] },
  { path: 'monitoreo', component: MonitoreoComponent, canActivate: [AuthGuard, permisoGuard(6)] },
  { path: 'monitoreo/:tipo', component: MonitoreoComponent, canActivate: [AuthGuard, permisoGuard(6)] },
  { path: 'evaluacion', component: EvaluacionesComponent, canActivate: [AuthGuard, permisoGuard(7)] },
  { path: 'evaluacion/:tipo', component: EvaluacionesComponent, canActivate: [AuthGuard, permisoGuard(7)] },
  { path: 'reportes', component: ReportesComponent, canActivate: [AuthGuard, permisoGuard(8)] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

import { Injectable } from '@angular/core';
import { Participante } from '../models/models';
import { environment } from '../../../environments/environment';
import { descargarArchivo } from '../utils/descargar.util';

@Injectable({ providedIn: 'root' })
export class ReporteService {

  private getEmpresaConfig(): { nombre: string; color: string; verde: string; azul: string; amarillo: string } {
    return { nombre: 'ANADESA', color: '#1E3278', verde: '#0E6B23', azul: '#4A90D9', amarillo: '#F4A300' };
  }

  private resolvePhotoUrl(ruta?: string): string {
    if (!ruta) return '';
    if (ruta.startsWith('http')) return ruta;
    return environment.baseUrl + ruta;
  }

  private async imageToBase64(url: string): Promise<string> {
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      const blob = await resp.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  }

  private async preparePhotoForPdf(p: Participante, color: string): Promise<string> {
    const photoUrl = this.resolvePhotoUrl(p.fotografia_ruta);
    if (photoUrl) {
      const b64 = await this.imageToBase64(photoUrl);
      if (b64) {
        return `<img src="${b64}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`;
      }
    }
    return `<div style="width:40px;height:40px;border-radius:50%;background:${p.sexo === 'Femenino' ? '#9333EA' : color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">${(p.primer_nombre?.[0] || '') + (p.primer_apellido?.[0] || '')}</div>`;
  }

  /** Convierte todas las <img> con src externo (URL) a data-URI base64 para que html2canvas las capture en el PDF. */
  private async embedImagesAsBase64(html: string): Promise<string> {
    const imgRegex = /<img[^>]*\ssrc="([^"]*)"[^>]*>/gi;
    const matches = Array.from(html.matchAll(imgRegex));
    let result = html;
    for (const m of matches) {
      const src = m[1];
      if (!src || src.startsWith('data:')) continue;
      try {
        const b64 = await this.imageToBase64(src);
        if (b64) result = result.replace(m[0], m[0].replace(`src="${src}"`, `src="${b64}"`));
      } catch { /* se deja el src original */ }
    }
    return result;
  }

  private getLogoHtml(): string {
    return `<img src="/LOGO_ANADESA.jpg" style="width:48px;height:48px;border-radius:8px;object-fit:cover;">`;
  }

  private getPhotoHtmlPreview(p: Participante, size: number, color: string): string {
    const photoUrl = this.resolvePhotoUrl(p.fotografia_ruta);
    if (photoUrl) {
      return `<img src="${photoUrl}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div style="display:none;width:${size}px;height:${size}px;border-radius:50%;background:${p.sexo === 'Femenino' ? '#9333EA' : color};color:#fff;align-items:center;justify-content:center;font-size:${Math.round(size * 0.35)}px;font-weight:700;">${(p.primer_nombre?.[0] || '') + (p.primer_apellido?.[0] || '')}</div>`;
    }
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${p.sexo === 'Femenino' ? '#9333EA' : color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.35)}px;font-weight:700;">${(p.primer_nombre?.[0] || '') + (p.primer_apellido?.[0] || '')}</div>`;
  }

  generarReporteGeneral(participantes: Participante[], titulo: string): string {
    const cfg = this.getEmpresaConfig();
    const logoHtml = this.getLogoHtml();
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });

    const rows = participantes.map((p, i) => `
      <tr style="border-bottom:1px solid #E2E8F0;">
        <td style="padding:12px 16px;font-size:13px;color:#64748B;">${i + 1}</td>
        <td style="padding:12px 16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${this.getPhotoHtmlPreview(p, 36, cfg.color)}
            <div>
              <div style="font-weight:600;color:#1E3278;font-size:13px;">${this.esc(`${p.primer_nombre} ${p.segundo_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''}`)}</div>
            </div>
          </div>
        </td>
        <td style="padding:12px 16px;font-size:13px;color:#1E3278;font-weight:500;">${this.esc(p.categoria_nombre) || '-'}</td>
        <td style="padding:12px 16px;font-size:13px;color:#1E3278;font-weight:500;">${this.esc(p.programa_nombre) || '-'}</td>
        <td style="padding:12px 16px;font-size:13px;color:#64748B;">${p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-GT') : '-'}</td>
        <td style="padding:12px 16px;">
          <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${p.estado ? '#DCFCE7' : '#FEF6E7'};color:${p.estado ? '#0E6B23' : '#F5A623'};">${p.estado ? 'Activo' : 'Inactivo'}</span>
        </td>
      </tr>
    `).join('');

    return `<div style="font-family:Arial,sans-serif;color:#1e293b;padding:0;background:#fff;margin:0;">
      <!-- HEADER -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 32px;background:#fff;border-bottom:3px solid #0E6B23;">
        <div style="display:flex;align-items:center;gap:16px;">
          ${logoHtml}
          <div style="border-left:3px solid #0E6B23;padding-left:16px;">
            <h1 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Sistema de Gestión de</h1>
            <h1 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Participantes, Monitoreo y Evaluación</h1>
            <p style="font-size:14px;color:#64748B;margin:4px 0 0 0;font-weight:500;">${titulo}</p>
          </div>
        </div>
        <div style="text-align:right;font-size:13px;color:#64748B;display:flex;align-items:center;gap:8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3278" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span style="color:#1E3278;font-weight:600;">${fecha}</span>
        </div>
      </div>

      <!-- BANNER -->
      <div style="background:linear-gradient(135deg,#E8F4FD 0%,#D1E8FF 100%);padding:32px;margin:24px 32px;border-radius:16px;display:flex;align-items:center;justify-content:space-between;">
        <div style="flex:1;">
          <p style="font-size:14px;color:#1E3278;margin:0 0 4px 0;font-weight:500;">Bienvenido al</p>
          <h2 style="font-size:24px;color:#1E3278;margin:0 0 12px 0;font-weight:700;">${titulo}</h2>
          <p style="font-size:13px;color:#64748B;margin:0;max-width:500px;line-height:1.6;">Aquí podrás visualizar un resumen de la información más importante del sistema, incluyendo participantes, actividades, monitoreos y evaluaciones.</p>
        </div>
        <div style="width:120px;height:80px;display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
            <path d="M0 80 L30 40 L50 55 L80 20 L120 80 Z" fill="#0E6B23" opacity="0.3"/>
            <path d="M20 80 L50 45 L70 60 L100 25 L120 40 L120 80 Z" fill="#0E6B23" opacity="0.5"/>
            <circle cx="90" cy="20" r="12" fill="#F4A300"/>
            <path d="M60 80 L80 50 L100 65 L120 35 L120 80 Z" fill="#1E3278" opacity="0.4"/>
          </svg>
        </div>
      </div>

      <!-- TABLA -->
      <div style="padding:0 32px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E3278" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <h3 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Participantes Registrados</h3>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background:linear-gradient(135deg,#1E3278 0%,#0E6B23 100%);color:#fff;">
              <th style="padding:14px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">No.</th>
              <th style="padding:14px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Nombre Completo</th>
              <th style="padding:14px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Categoría</th>
              <th style="padding:14px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Programa</th>
              <th style="padding:14px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Fecha de Registro</th>
              <th style="padding:14px 16px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Estado</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <!-- FOOTER -->
      <div style="margin-top:40px;padding:24px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;position:relative;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;">
          <div style="font-size:12px;color:#64748B;">
            <span style="font-weight:600;color:#1E3278;">Asociación ANADESA</span> | Santiago Atitlán, Sololá
          </div>
          <div style="font-size:12px;color:#0E6B23;font-style:italic;font-weight:500;">
            Más oportunidades, mejores vidas
          </div>
        </div>
        <!-- Olas decorativas -->
        <svg style="position:absolute;bottom:0;left:0;width:100%;height:30px;" viewBox="0 0 1200 30" preserveAspectRatio="none">
          <path d="M0 30 Q150 0 300 30 T600 30 T900 30 T1200 30 V30 H0 Z" fill="#0E6B23" opacity="0.3"/>
          <path d="M0 30 Q200 10 400 30 T800 30 T1200 30 V30 H0 Z" fill="#1E3278" opacity="0.2"/>
        </svg>
      </div>
    </div>`;
  }

  /**
   * Reporte del participante.
   * - completo=true (default): expediente completo con tutor/encargado.
   * - completo=false: reporte "actual" (datos + contacto + programa, sin tutor).
   * - extrasHtml: secciones adicionales (historial, monitoreos, etc.) del reporte completo.
   */
  generarReportePerfil(participante: Participante, opciones?: { completo?: boolean; extrasHtml?: string }): string {
    const cfg = this.getEmpresaConfig();
    const logoHtml = this.getLogoHtml();
    const p = participante;
    const completo = opciones?.completo ?? true;
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    const edad = this.calcEdad(p.fecha_nacimiento);

    const photoUrl = this.resolvePhotoUrl(p.fotografia_ruta);
    const photoHtml = photoUrl
      ? `<img src="${photoUrl}" style="width:122px;height:122px;box-sizing:border-box;border-radius:12px;object-fit:cover;border:3px solid #0E6B23;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <div style="display:none;width:122px;height:122px;box-sizing:border-box;border-radius:12px;background:${p.sexo === 'Femenino' ? '#9333EA' : cfg.color};color:#fff;align-items:center;justify-content:center;font-size:40px;font-weight:800;">${(p.primer_nombre?.[0] || '') + (p.primer_apellido?.[0] || '')}</div>`
      : `<div style="width:122px;height:122px;box-sizing:border-box;border-radius:12px;background:${p.sexo === 'Femenino' ? '#9333EA' : cfg.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;">${(p.primer_nombre?.[0] || '') + (p.primer_apellido?.[0] || '')}</div>`;

    const tutorHtml = (completo && p.familiares && p.familiares.length > 0 && p.familiares[0].primer_nombre) ? `
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #F4A300;padding-bottom:10px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">👨‍👩‍👦</span> Tutor / Encargado
        </h3>
        ${p.familiares.map(f => `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;background:#F8FAFC;border-radius:8px;margin-bottom:8px;">
            <div><span style="font-size:11px;color:#64748B;display:block;">Nombre</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.primer_nombre} ${f.segundo_nombre || ''} ${f.primer_apellido} ${f.segundo_apellido || ''}</span></div>
            <div><span style="font-size:11px;color:#64748B;display:block;">Parentesco</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.parentesco || '-'}</span></div>
            <div><span style="font-size:11px;color:#64748B;display:block;">DPI</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.dpi || '-'}</span></div>
            <div><span style="font-size:11px;color:#64748B;display:block;">Teléfono</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.telefono || '-'}</span></div>
            <div style="grid-column:span 2;"><span style="font-size:11px;color:#64748B;display:block;">Correo</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.correo || '-'}</span></div>
          </div>
        `).join('')}
      </div>
    ` : '';

    return `<div style="font-family:Arial,sans-serif;color:#1e293b;padding:0;background:#fff;margin:0;">
      <!-- HEADER -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 32px;background:#fff;border-bottom:3px solid #0E6B23;">
        <div style="display:flex;align-items:center;gap:16px;">
          ${logoHtml}
          <div style="border-left:3px solid #0E6B23;padding-left:16px;">
            <h1 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Sistema de Gestión de</h1>
            <h1 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Participantes, Monitoreo y Evaluación</h1>
            <p style="font-size:14px;color:#64748B;margin:4px 0 0 0;font-weight:500;">Expediente del Participante</p>
          </div>
        </div>
        <div style="text-align:right;font-size:13px;color:#64748B;">
          <div style="color:#1E3278;font-weight:600;">📅 ${fecha}</div>
          <div style="margin-top:4px;">ID: <strong style="color:#0E6B23;">#${p.id_participante}</strong></div>
        </div>
      </div>

      <!-- BANNER CON FOTO -->
      <div style="background:linear-gradient(135deg,#E8F4FD 0%,#D1E8FF 100%);padding:32px;margin:24px 32px;border-radius:16px;display:flex;align-items:center;gap:24px;">
        ${photoHtml}
        <div style="flex:1;">
          <h2 style="font-size:22px;color:#1E3278;margin:0 0 8px 0;font-weight:700;">${p.primer_nombre} ${p.segundo_nombre || ''} ${p.tercer_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''} ${p.tercer_apellido || ''}</h2>
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${p.estado ? '#DCFCE7' : '#FEF6E7'};color:${p.estado ? '#0E6B23' : '#F5A623'};">${p.estado ? 'Activo' : 'Inactivo'}</span>
            <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(34,139,34,0.15);color:#0E6B23;">${p.programa_nombre || '-'}</span>
            <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(74,144,217,0.15);color:#4A90D9;">${p.categoria_nombre || '-'}</span>
            ${edad !== null && edad < 18 ? `<span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(244,163,0,0.15);color:#B45309;">Menor de edad</span>` : ''}
          </div>
          <div style="font-size:13px;color:#64748B;">
            ${edad ? edad + ' años · ' : ''}${p.comunidad_nombre || ''} ${p.correo ? '· ' + p.correo : ''} ${p.telefono ? '· ' + p.telefono : ''}
          </div>
        </div>
      </div>

      <!-- CONTENIDO -->
      <div style="padding:0 32px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <!-- Datos Personales -->
          <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #0E6B23;padding-bottom:10px;display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;">👤</span> Datos Personales
            </h3>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Nombre completo</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.primer_nombre} ${p.segundo_nombre || ''} ${p.tercer_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''} ${p.tercer_apellido || ''}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Fecha de nacimiento</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.fecha_nacimiento ? new Date(p.fecha_nacimiento).toLocaleDateString('es-GT') : '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Edad</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${edad !== null ? edad + ' años' : '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Género</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.sexo || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">DPI</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.dpi || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="font-size:12px;color:#64748B;">Estado</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.estado ? 'Activo' : 'Inactivo'}</span></div>
          </div>

          <!-- Contacto y Ubicación -->
          <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #4A90D9;padding-bottom:10px;display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;">📍</span> Contacto y Ubicación
            </h3>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Teléfono</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.telefono || p.contacto?.telefono_principal || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Correo</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.correo || p.contacto?.correo || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Dirección</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.direccion?.direccion || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Comunidad</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.comunidad_nombre || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Contacto emergencia</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.contacto?.contacto_emergencia || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="font-size:12px;color:#64748B;">Tel. emergencia</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.contacto?.telefono_emergencia || '-'}</span></div>
          </div>
        </div>

        ${tutorHtml}

        <!-- Programa -->
        <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #0E6B23;padding-bottom:10px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">📋</span> Programa
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
            <div style="padding:12px;background:#F0FDF4;border-radius:8px;"><span style="font-size:11px;color:#64748B;display:block;margin-bottom:4px;">Programa</span><span style="font-size:14px;color:#0E6B23;font-weight:700;">${p.programa_nombre || '-'}</span></div>
            <div style="padding:12px;background:#EBF5FB;border-radius:8px;"><span style="font-size:11px;color:#64748B;display:block;margin-bottom:4px;">Categoría</span><span style="font-size:14px;color:#4A90D9;font-weight:700;">${p.categoria_nombre || '-'}</span></div>
            <div style="padding:12px;background:#FEFCE8;border-radius:8px;"><span style="font-size:11px;color:#64748B;display:block;margin-bottom:4px;">Fecha de registro</span><span style="font-size:14px;color:#1E3278;font-weight:700;">${p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-GT') : '-'}</span></div>
          </div>
        </div>
        ${opciones?.extrasHtml || ''}
      </div>

      <!-- FOOTER -->
      <div style="margin-top:40px;padding:24px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;position:relative;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;">
          <div style="font-size:12px;color:#64748B;">
            <span style="font-weight:600;color:#1E3278;">Asociación ANADESA</span> | Santiago Atitlán, Sololá
          </div>
          <div style="font-size:12px;color:#0E6B23;font-style:italic;font-weight:500;">
            Más oportunidades, mejores vidas
          </div>
        </div>
        <svg style="position:absolute;bottom:0;left:0;width:100%;height:30px;" viewBox="0 0 1200 30" preserveAspectRatio="none">
          <path d="M0 30 Q150 0 300 30 T600 30 T900 30 T1200 30 V30 H0 Z" fill="#0E6B23" opacity="0.3"/>
          <path d="M0 30 Q200 10 400 30 T800 30 T1200 30 V30 H0 Z" fill="#1E3278" opacity="0.2"/>
        </svg>
      </div>
    </div>`;
  }

  async exportarExcel(participantes: Participante[], titulo: string): Promise<void> {
    const mod: any = await import('xlsx');
    const XLSX: any = mod.default ?? mod;

    const data = participantes.map((p, i) => ({
      '#': i + 1,
      'Nombre': `${p.primer_nombre} ${p.segundo_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''}`,
      'Programa': p.programa_nombre || '',
      'Categoría': p.categoria_nombre || '',
      'Edad': this.calcEdad(p.fecha_nacimiento) ?? '',
      'Género': p.sexo || '',
      'Estado': p.estado ? 'Activo' : 'Inactivo',
      'Correo': p.correo || '',
      'Teléfono': p.telefono || '',
      'Comunidad': p.comunidad_nombre || '',
      'DPI': p.dpi || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, titulo.substring(0, 31));

    ws['!cols'] = [
      { wch: 5 }, { wch: 35 }, { wch: 15 }, { wch: 15 },
      { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 25 },
      { wch: 15 }, { wch: 20 }, { wch: 15 }
    ];

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    descargarArchivo(blob, `${titulo.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  async generarPdf(participantes: Participante[], titulo: string): Promise<void> {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const cfg = this.getEmpresaConfig();
    const logoB64 = await this.imageToBase64('/LOGO_ANADESA.jpg');

    const participantesConFoto = await Promise.all(
      participantes.map(async (p) => ({
        ...p,
        _fotoB64: await this.preparePhotoForPdf(p, cfg.color)
      }))
    );

    const rows = participantesConFoto.map((p, i) => `
      <tr style="border-bottom:1px solid #E2E8F0;">
        <td style="padding:12px 16px;font-size:13px;color:#64748B;width: 30px;">${i + 1}</td>
        <td style="padding:12px 16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${p._fotoB64}
            <div>
              <div style="font-weight:600;color:#1E3278;font-size:13px;">${p.primer_nombre} ${p.segundo_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''}</div>
            </div>
          </div>
        </td>
        <td style="padding:12px 16px;font-size:13px;color:#1E3278;font-weight:500;width: 120px;">${p.categoria_nombre || '-'}</td>
        <td style="padding:12px 16px;font-size:13px;color:#1E3278;font-weight:500;width: 150px;">${p.programa_nombre || '-'}</td>
        <td style="padding:12px 16px;font-size:13px;color:#64748B;width: 50px;">${p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-GT') : '-'}</td>
        <td style="padding:12px 16px;">
          <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${p.estado ? '#DCFCE7' : '#FEF6E7'};color:${p.estado ? '#0E6B23' : '#F5A623'};">${p.estado ? 'Activo' : 'Inactivo'}</span>
        </td>
      </tr>
    `).join('');

    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `<div style="font-family:Arial,sans-serif;color:#1e293b;padding:0;background:#fff;margin:0;">
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);table-layout: fixed;">
        <!-- HEADER -->
        <tr style="background:linear-gradient(135deg,#1E3278 0%,#0E6B23 100%);color:#fff;">
          <th style="padding:14px 16px;width: 30px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">No.</th>
          <th style="padding:14px 16px;width: 120px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Nombre Completo</th>
          <th style="padding:14px 16px;width: 120px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Categoría</th>
          <th style="padding:14px 16px;width: 150px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Programa</th>
          <th style="padding:14px 16px;width: 50px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Fecha de Registro</th>
          <th style="padding:14px 16px;width: 80px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Estado</th>
        </tr>

      <!-- BANNER -->
      <div style="background:linear-gradient(135deg,#E8F4FD 0%,#D1E8FF 100%);padding:32px;margin:24px 32px;border-radius:16px;display:flex;align-items:center;justify-content:space-between;">
        <div style="flex:1;">
          <p style="font-size:14px;color:#1E3278;margin:0 0 4px 0;font-weight:500;">Bienvenido al</p>
          <h2 style="font-size:24px;color:#1E3278;margin:0 0 12px 0;font-weight:700;">${titulo}</h2>
          <p style="font-size:13px;color:#64748B;margin:0;max-width:500px;line-height:1.6;">Aquí podrás visualizar un resumen de la información más importante del sistema, incluyendo participantes, actividades, monitoreos y evaluaciones.</p>
        </div>
        <div style="width:120px;height:80px;display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" width="120" height="80">
            <path d="M0 80 L30 40 L50 55 L80 20 L120 80 Z" fill="#0E6B23" opacity="0.3"/>
            <path d="M20 80 L50 45 L70 60 L100 25 L120 40 L120 80 Z" fill="#0E6B23" opacity="0.5"/>
            <circle cx="90" cy="20" r="12" fill="#F4A300"/>
            <path d="M60 80 L80 50 L100 65 L120 35 L120 80 Z" fill="#1E3278" opacity="0.4"/>
          </svg>
        </div>
      </div>

      <!-- TABLA -->
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);table-layout: fixed;">
        <!-- HEADER -->
        <tr style="background:linear-gradient(135deg,#1E3278 0%,#0E6B23 100%);color:#fff;">
          <th style="padding:14px 16px;width: 30px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">No.</th>
          <th style="padding:14px 16px;width: 120px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Nombre Completo</th>
          <th style="padding:14px 16px;width: 120px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Categoría</th>
          <th style="padding:14px 16px;width: 150px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Programa</th>
          <th style="padding:14px 16px;width: 50px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Fecha de Registro</th>
          <th style="padding:14px 16px;width: 80px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Estado</th>
        </tr>
        <tbody>${rows}</tbody>
      </table>

      <!-- FOOTER -->
      <div style="margin-top:40px;padding:24px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;position:relative;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;">
          <div style="font-size:12px;color:#64748B;">
            <span style="font-weight:600;color:#1E3278;">Asociación ANADESA</span> | Santiago Atitlán, Sololá
          </div>
          <div style="font-size:12px;color:#0E6B23;font-style:italic;font-weight:500;">
            Más oportunidades, mejores vidas
          </div>
        </div>
        <!-- Olas decorativas -->
        <svg style="position:absolute;bottom:0;left:0;width:100%;height:30px;" viewBox="0 0 1200 30" preserveAspectRatio="none">
          <path d="M0 30 Q150 0 300 30 T600 30 T900 30 T1200 30 V30 H0 Z" fill="#0E6B23" opacity="0.3"/>
          <path d="M0 30 Q200 10 400 30 T800 30 T1200 30 V30 H0 Z" fill="#1E3278" opacity="0.2"/>
        </svg>
      </div>
    </div>`;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, logging: false });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${titulo.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /** Genera un PDF (multipágina) a partir de un bloque HTML ya armado. */
  async generarPdfDeHtml(html: string, titulo: string): Promise<void> {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '820px';
    container.style.background = '#fff';
    container.innerHTML = await this.embedImagesAsBase64(html);
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const scale = pageWidth / canvas.width;
      const sliceHeight = Math.floor(pageHeight / scale);

      let y = 0;
      let primera = true;
      while (y < canvas.height) {
        const h = Math.min(sliceHeight, canvas.height - y);
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = h;
        const ctx = slice.getContext('2d');
        if (!ctx) break;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);

        if (!primera) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, h * scale);
        primera = false;
        y += h;
      }

      pdf.save(`${(titulo || 'reporte').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  }

  async generarPdfPerfil(participante: Participante): Promise<void> {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const cfg = this.getEmpresaConfig();
    const logoB64 = await this.imageToBase64('/LOGO_ANADESA.jpg');
    const p = participante;
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
    const edad = this.calcEdad(p.fecha_nacimiento);

    const photoB64 = await this.preparePhotoForPdf(p, cfg.color);

    const tutorHtml = (p.familiares && p.familiares.length > 0 && p.familiares[0].primer_nombre) ? `
      <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #F4A300;padding-bottom:10px;">👨‍👩‍👦 Tutor / Encargado</h3>
        ${p.familiares.map(f => `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px;background:#F8FAFC;border-radius:8px;margin-bottom:8px;">
            <div><span style="font-size:11px;color:#64748B;display:block;">Nombre</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.primer_nombre} ${f.segundo_nombre || ''} ${f.primer_apellido} ${f.segundo_apellido || ''}</span></div>
            <div><span style="font-size:11px;color:#64748B;display:block;">Parentesco</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.parentesco || '-'}</span></div>
            <div><span style="font-size:11px;color:#64748B;display:block;">DPI</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.dpi || '-'}</span></div>
            <div><span style="font-size:11px;color:#64748B;display:block;">Teléfono</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.telefono || '-'}</span></div>
            <div style="grid-column:span 2;"><span style="font-size:11px;color:#64748B;display:block;">Correo</span><span style="font-size:13px;color:#1E3278;font-weight:600;">${f.correo || '-'}</span></div>
          </div>
        `).join('')}
      </div>
    ` : '';

    const htmlContent = `<div style="font-family:Arial,sans-serif;color:#1e293b;padding:0;background:#fff;margin:0;">
      <!-- HEADER -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 32px;background:#fff;border-bottom:3px solid #0E6B23;">
        <div style="display:flex;align-items:center;gap:16px;">
          <img src="${logoB64}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;">
          <div style="border-left:3px solid #0E6B23;padding-left:16px;">
            <h1 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Sistema de Gestión de</h1>
            <h1 style="font-size:18px;color:#1E3278;margin:0;font-weight:700;">Participantes, Monitoreo y Evaluación</h1>
            <p style="font-size:14px;color:#64748B;margin:4px 0 0 0;font-weight:500;">Expediente del Participante</p>
          </div>
        </div>
        <div style="text-align:right;font-size:13px;color:#64748B;">
          <div style="color:#1E3278;font-weight:600;">📅 ${fecha}</div>
          <div style="margin-top:4px;">ID: <strong style="color:#0E6B23;">#${p.id_participante}</strong></div>
        </div>
      </div>

      <!-- BANNER CON FOTO -->
      <div style="background:linear-gradient(135deg,#E8F4FD 0%,#D1E8FF 100%);padding:32px;margin:24px 32px;border-radius:16px;display:flex;align-items:center;gap:24px;">
        ${photoB64}
        <div>
          <h2 style="font-size:22px;color:#1E3278;margin:0 0 8px 0;font-weight:700;">${p.primer_nombre} ${p.segundo_nombre || ''} ${p.tercer_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''} ${p.tercer_apellido || ''}</h2>
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${p.estado ? '#DCFCE7' : '#FEF6E7'};color:${p.estado ? '#0E6B23' : '#F5A623'};">${p.estado ? 'Activo' : 'Inactivo'}</span>
            <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(34,139,34,0.15);color:#0E6B23;">${p.programa_nombre || '-'}</span>
            <span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(74,144,217,0.15);color:#4A90D9;">${p.categoria_nombre || '-'}</span>
            ${edad !== null && edad < 18 ? `<span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(244,163,0,0.15);color:#B45309;">Menor de edad</span>` : ''}
          </div>
          <div style="font-size:13px;color:#64748B;">
            ${edad ? edad + ' años · ' : ''}${p.comunidad_nombre || ''} ${p.correo ? '· ' + p.correo : ''} ${p.telefono ? '· ' + p.telefono : ''}
          </div>
        </div>
      </div>

      <!-- CONTENIDO -->
      <div style="padding:0 32px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
          <!-- Datos Personales -->
          <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #0E6B23;padding-bottom:10px;">👤 Datos Personales</h3>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Nombre completo</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.primer_nombre} ${p.segundo_nombre || ''} ${p.tercer_nombre || ''} ${p.primer_apellido} ${p.segundo_apellido || ''} ${p.tercer_apellido || ''}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Fecha de nacimiento</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.fecha_nacimiento ? new Date(p.fecha_nacimiento).toLocaleDateString('es-GT') : '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Edad</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${edad !== null ? edad + ' años' : '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Género</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.sexo || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="font-size:12px;color:#64748B;">Estado</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.estado ? 'Activo' : 'Inactivo'}</span></div>
          </div>

          <!-- Contacto y Ubicación -->
          <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #4A90D9;padding-bottom:10px;">📍 Contacto y Ubicación</h3>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Teléfono</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.telefono || p.contacto?.telefono_principal || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Correo</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.correo || p.contacto?.correo || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F5F9FD;"><span style="font-size:12px;color:#64748B;">Dirección</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.direccion?.direccion || '-'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="font-size:12px;color:#64748B;">Comunidad</span><span style="font-size:12px;color:#1E3278;font-weight:600;">${p.comunidad_nombre || '-'}</span></div>
          </div>
        </div>

        ${tutorHtml}

        <!-- Programa -->
        <div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-top:20px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <h3 style="color:#1E3278;margin-bottom:16px;font-size:16px;border-bottom:2px solid #0E6B23;padding-bottom:10px;">📋 Programa</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
            <div style="padding:12px;background:#F0FDF4;border-radius:8px;"><span style="font-size:11px;color:#64748B;display:block;margin-bottom:4px;">Programa</span><span style="font-size:14px;color:#0E6B23;font-weight:700;">${p.programa_nombre || '-'}</span></div>
            <div style="padding:12px;background:#EBF5FB;border-radius:8px;"><span style="font-size:11px;color:#64748B;display:block;margin-bottom:4px;">Categoría</span><span style="font-size:14px;color:#4A90D9;font-weight:700;">${p.categoria_nombre || '-'}</span></div>
            <div style="padding:12px;background:#FEFCE8;border-radius:8px;"><span style="font-size:11px;color:#64748B;display:block;margin-bottom:4px;">Fecha de registro</span><span style="font-size:14px;color:#1E3278;font-weight:700;">${p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-GT') : '-'}</span></div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="margin-top:40px;padding:24px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;position:relative;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;">
          <div style="font-size:12px;color:#64748B;">
            <span style="font-weight:600;color:#1E3278;">Asociación ANADESA</span> | Santiago Atitlán, Sololá
          </div>
          <div style="font-size:12px;color:#0E6B23;font-style:italic;font-weight:500;">
            Más oportunidades, mejores vidas
          </div>
        </div>
        <svg style="position:absolute;bottom:0;left:0;width:100%;height:30px;" viewBox="0 0 1200 30" preserveAspectRatio="none">
          <path d="M0 30 Q150 0 300 30 T600 30 T900 30 T1200 30 V30 H0 Z" fill="#0E6B23" opacity="0.3"/>
          <path d="M0 30 Q200 10 400 30 T800 30 T1200 30 V30 H0 Z" fill="#1E3278" opacity="0.2"/>
        </svg>
      </div>
    </div>`;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, logging: false });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Expediente_${p.primer_nombre}_${p.primer_apellido}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private calcEdad(fecha?: string): number | null {
    if (!fecha) return null;
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  /** Escapa texto antes de insertarlo en el HTML de un reporte (anti-injection). */
  esc(v?: string | null): string {
    if (v === null || v === undefined) return '';
    return String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Exporta a Excel la primera tabla HTML de un reporte (usado por los reportes
   * generados como HTML: monitoreo, evaluaciones, actividades, usuarios, etc.).
   */
  async exportarExcelDeHtml(html: string, titulo: string): Promise<void> {
    let XLSX: any;
    try {
      const mod: any = await import('xlsx');
      XLSX = mod.default ?? mod;
      if (typeof XLSX.write !== 'function' || !XLSX.utils) {
        XLSX = mod.default?.default ?? mod.default ?? mod;
      }
    } catch (e) {
      console.error('Error importando xlsx', e);
      this.mostrarMensajeErrorExcel('No se pudo cargar la librería de Excel');
      return;
    }

    if (typeof XLSX?.write !== 'function' || !XLSX?.utils) {
      console.error('xlsx inválido después de importar', XLSX);
      this.mostrarMensajeErrorExcel('No se pudo cargar la librería de Excel');
      return;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tablas = doc.querySelectorAll('table');
    const filas: string[][] = [];
    // La segunda tabla (índice 1) contiene los datos, la primera es solo encabezado
    if (tablas.length >= 2) {
      tablas[1].querySelectorAll('tr').forEach(tr => {
        const celdas = Array.from(tr.querySelectorAll('th,td')).map(td => {
          const texto = (td.textContent || '').replace(/\s+/g, ' ').trim();
          return texto;
        });
        if (celdas.length > 0) filas.push(celdas);
      });
    } else if (tablas.length === 1) {
      // Fallback: si solo hay una tabla, usarla como antes
      tablas[0].querySelectorAll('tr').forEach(tr => {
        const celdas = Array.from(tr.querySelectorAll('th,td')).map(td => {
          const texto = (td.textContent || '').replace(/\s+/g, ' ').trim();
          return texto;
        });
        if (celdas.length > 0) filas.push(celdas);
      });
    }
    if (!filas.length) filas.push(['Sin datos disponibles']);

    let ws: any;
    try {
      ws = XLSX.utils.aoa_to_sheet(filas);
    } catch (e) {
      console.error('Error creando hoja Excel', e);
      try {
        const data = filas.map((f, i) => ({
          '#': i + 1,
          ...f.reduce((obj: any, cell: string, j) => {
            obj[j] = cell;
            return obj;
          }, {})
        }));
        ws = XLSX.utils.json_to_sheet(data);
      } catch (e2) {
        console.error('Error alternativo creando hoja', e2);
        this.mostrarMensajeErrorExcel('Error al generar la hoja de Excel');
        return;
      }
    }

    const wb: any = XLSX.utils.book_new();
    try {
      XLSX.utils.book_append_sheet(wb, ws, (titulo || 'Reporte').substring(0, 31));
    } catch (e) {
      console.error('Error adjuntando hoja', e);
      this.mostrarMensajeErrorExcel('Error al adjuntar hoja Excel');
      return;
    }

    let numCols: number;
    try {
      numCols = Math.max(...filas.map(f => f.length));
    } catch (e) {
      numCols = 1;
    }
    try {
      ws['!cols'] = Array.from({ length: numCols }, (_, i) => {
        const ancho = Math.max(...filas.map(f => (f[i] || '').length));
        return { wch: Math.min(45, Math.max(10, ancho + 2)) };
      });
    } catch (e) {
      console.error('Error calculando columnas', e);
    }

    try {
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      descargarArchivo(blob, `${(titulo || 'reporte').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      console.error('Error escribiendo archivo Excel', e);
      this.mostrarMensajeErrorExcel('Error al generar el archivo Excel');
    }
  }

  private mostrarMensajeErrorExcel(texto: string) {
    // Este método se podría llamar desde el componente para mostrar error
    console.log('Error Excel:', texto);
  }
}

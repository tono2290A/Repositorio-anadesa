import { Component, Input, Output, EventEmitter, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReporteService } from '../../../core/services/reporte.service';
import { Participante } from '../../../core/models/models';

@Component({
  selector: 'app-reporte-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="visible" (click)="cerrar()">
      <div class="modal-panel modal-xl" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2><i class="fas fa-file-alt"></i> Vista Previa del Reporte</h2>
          <button class="modal-close" (click)="cerrar()"><i class="fas fa-times"></i></button>
        </div>
<div class="modal-body">
            <div class="report-actions">
              <button class="btn btn-navy" (click)="descargarPDF()" [disabled]="descargando">
                <i class="fas" [ngClass]="descargando ? 'fa-spinner fa-spin' : 'fa-file-pdf'"></i>
                {{ descargando ? 'Generando PDF...' : 'Descargar PDF' }}
              </button>
              <button class="btn btn-green" (click)="descargarExcel()" [disabled]="descargando || (!modoHtml && !participantes.length)">
                <i class="fas" [ngClass]="descargando ? 'fa-spinner fa-spin' : 'fa-file-excel'"></i> Descargar Excel
              </button>
            </div>
            <div *ngIf="mensaje" class="mensaje-error">
              {{ mensaje.texto }}
            </div>
            <div class="report-frame" [innerHTML]="safeHtml"
                 [style.max-height]="modoHtml ? '64vh' : null"
                 [style.overflow-y]="modoHtml ? 'auto' : null"></div>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
    .modal-panel { background: #fff; border-radius: 16px; width: 92%; max-height: 92vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.25); animation: modalIn 0.25s ease; display: flex; flex-direction: column; }
    .modal-xl { max-width: 850px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E2E8F0; flex-shrink: 0; background: linear-gradient(135deg, #1E3278 0%, #228B22 100%); color: #fff; }
    .modal-header h2 { font-size: 16px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px; color: #fff; }
    .modal-close { width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; transition: all 0.2s; }
    .modal-close:hover { background: rgba(255,255,255,0.35); }
    .modal-body { padding: 20px; overflow-y: auto; flex: 1; background: #F8FAFC; }
    .report-actions { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
    .report-frame { border: none; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .btn { padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-navy { background: #8cc8eb; color: #fff; }
    .btn-navy:hover:not(:disabled) { background: #162560; }
    .btn-green { background: #228B22; color: #fff; }
    .btn-green:hover:not(:disabled) { background: #1a6d1a; }
    .mensaje-error {
      background: #FEF2F2;
      color: #B91C1C;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 12px;
      text-align: center;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.92) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `]
})
export class ReportePreviewComponent {
  @Input() visible = false;
  @Input() html = '';
  @Input() tipo: 'general' | 'perfil' = 'general';
  @Input() participantes: Participante[] = [];
  @Input() titulo = '';
  /** true = el reporte se genera como HTML interno (salidas: PDF y Excel). */
  @Input() modoHtml = false;
  @Output() cerrarEvent = new EventEmitter<void>();

  descargando = false;
  safeHtml: SafeHtml = '';
  mensaje: { tipo: 'success' | 'error'; texto: string } | null = null;

  constructor(
    private reporteService: ReporteService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnChanges() {
    if (this.html) {
      this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.html);
    }
  }

  cerrar() { this.cerrarEvent.emit(); }

  async descargarPDF() {
    if (this.descargando) return;
    this.descargando = true;
    try {
      if (this.modoHtml) {
        if (this.html) {
          await this.reporteService.generarPdfDeHtml(this.html, this.titulo || 'Reporte');
        }
        return;
      }
      if (!this.participantes.length) return;
      if (this.tipo === 'perfil' && this.participantes.length === 1) {
        await this.reporteService.generarPdfPerfil(this.participantes[0]);
      } else {
        await this.reporteService.generarPdf(this.participantes, this.titulo || 'Reporte');
      }
    } catch (e) {
      console.error('Error al generar PDF:', e);
    } finally {
      this.descargando = false;
    }
  }

  async descargarExcel() {
    if (this.modoHtml) {
      if (!this.html) return;
      try {
        await this.reporteService.exportarExcelDeHtml(this.html, this.titulo || 'Reporte');
      } catch (e) {
        console.error('Error al generar Excel:', e);
        this.mostrarMensaje('error', 'No se pudo generar el archivo Excel. Intente de nuevo o use PDF.');
        return;
      }
      return;
    }
    if (!this.participantes.length) return;
    await this.reporteService.exportarExcel(this.participantes, this.titulo || 'Reporte');
  }

  mostrarMensaje(tipo: 'success' | 'error', texto: string) {
    this.mensaje = { tipo, texto };
    setTimeout(() => { this.mensaje = null; }, 4000);
  }
}

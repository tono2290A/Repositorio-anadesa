import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlcanceService, ProgramaClave, ProgramaTab } from '../../../core/services/alcance.service';

/**
 * Pestañas Educación / Mujeres (mismo estilo que Participantes).
 * Solo muestra las pestañas que el rol tiene permitidas.
 */
@Component({
  selector: 'app-programas-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabs-bar">
      <button type="button" class="tab-btn" *ngFor="let t of tabs"
        [class.active]="activo === t.key"
        [style.border-bottom-color]="activo === t.key ? t.color : 'transparent'"
        (click)="seleccionar(t.key)">
        <i class="fas {{ t.icono }}"></i> {{ t.label }}
        <span class="tab-count" *ngIf="conteos"
          [style.background]="activo === t.key ? t.color + '1A' : '#F5F9FD'"
          [style.color]="activo === t.key ? t.color : '#94A3B8'">{{ conteos[t.key] ?? 0 }}</span>
      </button>
    </div>
  `,
  styles: [`
    .tabs-bar {
      display: flex; gap: 0; border-bottom: 3px solid #E2E8F0;
      margin-bottom: 20px; background: #fff; border-radius: 12px 12px 0 0;
      padding: 0 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .tab-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 14px 22px; border: none; background: none;
      color: #64748B; font-size: 14px; font-weight: 500;
      cursor: pointer; border-bottom: 3px solid transparent;
      transition: all 0.15s ease; margin-bottom: -3px; border-radius: 8px 8px 0 0;
    }
    .tab-btn:hover { color: #1E3278; background: rgba(30,50,120,0.03); }
    .tab-btn.active { font-weight: 600; color: #1E3278; }
    .tab-btn i { font-size: 14px; }
    .tab-count {
      padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: 600; transition: all 0.15s ease;
    }
  `]
})
export class ProgramasTabsComponent {
  @Input() activo: ProgramaClave = 'educacion';
  @Output() activoChange = new EventEmitter<ProgramaClave>();
  @Input() conteos: Partial<Record<ProgramaClave, number>> | null = null;

  constructor(public alcanceService: AlcanceService) {}

  get tabs(): ProgramaTab[] {
    return this.alcanceService.tabs;
  }

  seleccionar(key: ProgramaClave): void {
    if (key === this.activo) return;
    this.activo = key;
    this.activoChange.emit(key);
  }
}

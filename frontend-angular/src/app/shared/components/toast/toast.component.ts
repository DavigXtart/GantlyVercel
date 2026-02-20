import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      @for (toast of (toastService.toasts | async); track toast.id) {
        <div class="animate-fade-in rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 text-sm font-medium"
             [class]="getToastClass(toast.type)">
          <span class="text-lg">{{ getIcon(toast.type) }}</span>
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="toastService.remove(toast.id)"
                  class="ml-2 opacity-60 hover:opacity-100 cursor-pointer text-base">&times;</button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  getToastClass(type: string): string {
    const base = 'border';
    switch (type) {
      case 'success': return `${base} bg-gentle-mint text-forest border-sage`;
      case 'error': return `${base} bg-red-50 text-red-800 border-red-300`;
      case 'warning': return `${base} bg-amber-50 text-amber-800 border-amber-300`;
      case 'info': return `${base} bg-blue-50 text-blue-800 border-blue-300`;
      default: return base;
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '\u2705';
      case 'error': return '\u274C';
      case 'warning': return '\u26A0\uFE0F';
      case 'info': return '\u2139\uFE0F';
      default: return '';
    }
  }
}

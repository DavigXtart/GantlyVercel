import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-12 gap-3">
      <div class="w-10 h-10 border-3 border-sage/30 border-t-sage rounded-full animate-spin"></div>
      @if (message) {
        <p class="text-sm text-gray-500">{{ message }}</p>
      }
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() message = 'Cargando...';
}

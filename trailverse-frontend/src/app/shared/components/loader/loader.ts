import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading.visible()) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-tinta/40 backdrop-blur-sm" role="status" aria-live="polite">
        <div class="relative h-16 w-16">
          <div class="absolute inset-0 rounded-full border-4 border-bosque-300 border-t-bosque-700 animate-spin"></div>
          <svg viewBox="0 0 24 24" class="absolute inset-3 text-bosque-800" aria-hidden="true">
            <path d="M2 20 L8.5 7 L12 13 L15 9.5 L22 20 Z" fill="currentColor" />
          </svg>
        </div>
        <span class="sr-only">Cargando…</span>
      </div>
    }
  `
})
export class Loader {
  constructor(readonly loading: LoadingService) {}
}
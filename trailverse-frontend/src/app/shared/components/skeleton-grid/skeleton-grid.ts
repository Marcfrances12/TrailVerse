import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-skeleton-grid',
  imports: [NgxSkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Cargando rutas">
      @for (item of [0, 1, 2, 3, 4, 5]; track item) {
        <div class="overflow-hidden rounded-2xl border border-crema-200 bg-white shadow-sm">
          <div class="relative">
            <ngx-skeleton-loader
              appearance="line"
              [theme]="{ height: '192px', width: '100%', 'border-radius': '0' }" />
          </div>
          <div class="space-y-3 p-4">
            <ngx-skeleton-loader
              appearance="line"
              [theme]="{ height: '16px', width: '70%', 'border-radius': '6px' }" />
            <ngx-skeleton-loader
              appearance="line"
              [theme]="{ height: '12px', width: '50%', 'border-radius': '6px' }" />
            <div class="grid grid-cols-3 gap-2 pt-2">
              <ngx-skeleton-loader
                appearance="line"
                [theme]="{ height: '36px', width: '100%', 'border-radius': '8px' }" />
              <ngx-skeleton-loader
                appearance="line"
                [theme]="{ height: '36px', width: '100%', 'border-radius': '8px' }" />
              <ngx-skeleton-loader
                appearance="line"
                [theme]="{ height: '36px', width: '100%', 'border-radius': '8px' }" />
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SkeletonGrid {}
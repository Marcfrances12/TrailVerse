import { ChangeDetectionStrategy, Component, ContentChild, TemplateRef, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../empty-state/empty-state';
import { ErrorState } from '../error-state/error-state';
import { SkeletonGrid } from '../skeleton-grid/skeleton-grid';

@Component({
  selector: 'app-admin-list-shell',
  imports: [NgTemplateOutlet, RouterLink, EmptyState, ErrorState, SkeletonGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-list-shell.html'
})
export class AdminListShell {
  readonly title = input.required<string>();
  readonly summary = input('');
  readonly isTrash = input(false);
  readonly activeLabel = input('Ver activos');
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly empty = input(false);
  readonly emptyTitle = input('Sin resultados');
  readonly emptyMessage = input('');
  readonly createRoute = input<string | null>(null);
  readonly createLabel = input('');

  readonly toggleTrash = output<void>();
  readonly retry = output<void>();

  @ContentChild('activeContent') activeContent?: TemplateRef<unknown>;
  @ContentChild('trashContent') trashContent?: TemplateRef<unknown>;
}

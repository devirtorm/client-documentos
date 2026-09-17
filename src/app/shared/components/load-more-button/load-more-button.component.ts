import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader2, lucideChevronDown } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-load-more-button',
  standalone: true,
  imports: [NgIcon, ...HlmButtonImports],
  providers: [provideIcons({ lucideLoader2, lucideChevronDown })],
  template: `
    <div class="flex justify-center py-3">
      <button
        hlmBtn
        variant="outline"
        size="sm"
        class="rounded-lg text-xs gap-1.5"
        [disabled]="loading()"
        (click)="loadMore.emit()"
      >
        @if (loading()) {
          <ng-icon name="lucideLoader2" size="14" class="animate-spin" />
          Cargando...
        } @else {
          <ng-icon name="lucideChevronDown" size="14" />
          Cargar más
        }
      </button>
    </div>
  `,
})
export class LoadMoreButtonComponent {
  /** Indica si hay una carga en progreso */
  loading = input<boolean>(false);

  /** Emitido cuando el usuario presiona el botón */
  loadMore = output<void>();
}

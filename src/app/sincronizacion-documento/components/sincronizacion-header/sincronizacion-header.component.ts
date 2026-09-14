import { Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader2, lucideRefreshCw } from '@ng-icons/lucide';

@Component({
  selector: 'app-sincronizacion-header',
  standalone: true,
  imports: [HlmButton, AppHeaderComponent, NgIcon],
  providers: [provideIcons({ lucideLoader2, lucideRefreshCw })],
  template: `
    <app-header title="Pendientes">
      
      <div subtitle-content class="text-[13px] text-muted-foreground mt-0.5">
        @if (count() > 0) {
          <span class="font-bold text-foreground"> {{ count() }} </span> documento{{ count() !== 1 ? 's' : '' }} por sincronizar
        } @else {
          Todos los documentos están sincronizados
        }
      </div>

      <div right-action>
        @if (count() > 0) {
          <button hlmBtn size="sm" [disabled]="isSyncing()" (click)="sincronizarTodo.emit()" class="gap-1.5 h-8 text-xs font-semibold">
            @if (isSyncing()) {
              <ng-icon name="lucideLoader2" class="animate-spin" size="14"></ng-icon>
              <span>Sincronizando...</span>
            } @else {
              <ng-icon name="lucideRefreshCw" size="13"></ng-icon>
              <span>Sincronizar todo</span>
            }
          </button>
        }
      </div>

    </app-header>
  `
})
export class SincronizacionHeaderComponent {
  count = input<number>(0);
  isSyncing = input<boolean>(false);
  sincronizarTodo = output<void>();
}

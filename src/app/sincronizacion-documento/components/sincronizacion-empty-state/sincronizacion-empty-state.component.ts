import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheckCircle2 } from '@ng-icons/lucide';

@Component({
  selector: 'app-sincronizacion-empty-state',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ lucideCheckCircle2 })],
  template: `
    <div class="flex flex-col items-center justify-center py-24 px-8 text-center">
        <div class="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-5">
            <ng-icon name="lucideCheckCircle2" size="28" class="text-muted-foreground/50"></ng-icon>
        </div>
        <p class="text-[15px] font-semibold text-foreground mb-1">Todo al día</p>
        <p class="text-[13px] text-muted-foreground leading-relaxed max-w-[240px]">
            No hay documentos pendientes de sincronizar.
        </p>
    </div>
  `
})
export class SincronizacionEmptyStateComponent {}

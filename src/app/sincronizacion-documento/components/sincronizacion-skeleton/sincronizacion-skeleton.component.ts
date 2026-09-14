import { Component } from '@angular/core';

@Component({
  selector: 'app-sincronizacion-skeleton',
  standalone: true,
  template: `
    <div class="rounded-2xl border border-border/70 bg-card overflow-hidden divide-y divide-border/40 animate-pulse">
        @for (i of [1, 2, 3, 4]; track i) {
        <div class="flex items-center gap-3 px-4 py-3">
            <div class="w-10 h-10 rounded-xl bg-muted shrink-0"></div>
            <div class="flex-1 space-y-1.5">
                <div class="h-3.5 bg-muted rounded w-1/2"></div>
                <div class="h-3 bg-muted/60 rounded w-1/3"></div>
            </div>
            <div class="h-7 w-20 bg-muted rounded-xl shrink-0"></div>
        </div>
        }
    </div>
  `
})
export class SincronizacionSkeletonComponent {}

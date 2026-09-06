import { Component } from '@angular/core';

@Component({
  selector: 'app-sincronizacion-skeleton',
  standalone: true,
  template: `
    <div class="flex flex-col gap-3 px-4 pt-4">
        @for (i of [1, 2, 3, 4]; track i) {
        <div class="rounded-2xl border border-border/70 bg-card p-4 animate-pulse">
            <div class="flex items-center justify-between">
                <div class="flex-1 space-y-2.5">
                    <div class="h-4 bg-muted rounded w-3/5"></div>
                    <div class="h-3 bg-muted/60 rounded w-1/3"></div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <div class="h-4 bg-muted rounded w-16"></div>
                    <div class="h-4 bg-muted/60 rounded-full w-20"></div>
                </div>
            </div>
        </div>
        }
    </div>
  `
})
export class SincronizacionSkeletonComponent {}

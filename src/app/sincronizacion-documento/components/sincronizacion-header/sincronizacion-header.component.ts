import { Component, input } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';

@Component({
  selector: 'app-sincronizacion-header',
  standalone: true,
  imports: [HlmButton, AppHeaderComponent],
  template: `
    <app-header title="Pendientes">
      
      <div subtitle-content class="text-[13px] text-muted-foreground mt-0.5">
        @if (count() > 0) {
          <span class="font-bold"> {{ count() }} </span> Documentos por sincronizar
        } @else {
          Todos los documentos están sincronizados
        }
      </div>

      <div right-action>
        @if (count() > 0) {
          <button hlmBtn size="sm">Sincronizar todo</button>
        }
      </div>

    </app-header>
  `
})
export class SincronizacionHeaderComponent {
  count = input<number>(0);
}

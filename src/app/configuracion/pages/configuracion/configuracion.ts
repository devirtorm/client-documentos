import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFileText,
  lucideShoppingCart,
  lucideSun,
  lucideMoon,
  lucideMonitor,
  lucideList,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { ConfiguracionService, TipoDocumento } from '../../../shared/services/configuracion.service';
import { ThemeService, Theme } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    NgIcon,
    ...HlmButtonImports,
    AppHeaderComponent,
  ],
  providers: [
    provideIcons({
      lucideFileText,
      lucideShoppingCart,
      lucideSun,
      lucideMoon,
      lucideMonitor,
      lucideList,
    }),
  ],
  templateUrl: './configuracion.html',
})
export class Configuracion {
  protected readonly cfg = inject(ConfiguracionService);
  protected readonly themeService = inject(ThemeService);

  // ── Tipo de documento ─────────────────────────────────
  protected readonly tiposDocumento: { value: TipoDocumento; label: string; desc: string; icon: string }[] = [
    { value: 'P', label: 'Pedido', desc: 'Genera documentos de tipo pedido', icon: 'lucideShoppingCart' },
    { value: 'M', label: 'Remisión', desc: 'Genera documentos de tipo remisión', icon: 'lucideFileText' },
  ];

  // ── Tema ──────────────────────────────────────────────
  protected readonly temas: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Claro', icon: 'lucideSun' },
    { value: 'dark', label: 'Oscuro', icon: 'lucideMoon' },
    { value: 'system', label: 'Sistema', icon: 'lucideMonitor' },
  ];

  setTipoDocumento(tipo: TipoDocumento): void {
    this.cfg.guardar({ tipoDocumento: tipo });
  }

  setTema(tema: Theme): void {
    this.themeService.setTheme(tema);
    this.cfg.guardar({ tema });
  }

  setItemsPorPagina(value: number): void {
    this.cfg.guardar({ itemsPorPagina: value });
  }
}

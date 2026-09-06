import { Component, input } from '@angular/core';
import { DocumentoHistorial } from '../../../interfaces/documento';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucidePackage, lucideCalendar, lucideUser } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-item-documento',
  imports: [NgIcon, ...HlmBadgeImports, ...HlmTableImports, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './item-documento.html',
  styleUrl: './item-documento.css',
  providers: [
    provideIcons({
      lucideChevronDown,
      lucidePackage,
      lucideCalendar,
      lucideUser,
    }),
  ],
})
export class ItemDocumento {
  documento = input.required<DocumentoHistorial>();
  expanded = false;

  toggle(): void {
    this.expanded = !this.expanded;
  }

  getStatusVariant(): 'default' | 'secondary' | 'destructive' | 'outline' {
    const status = this.documento().status?.toLowerCase() ?? '';
    if (status.includes('cancelad')) return 'destructive';
    if (status.includes('pendiente') || status.includes('parcial')) return 'outline';
    if (status.includes('surtid') || status.includes('complet') || status.includes('entregad')) return 'default';
    return 'secondary';
  }
}

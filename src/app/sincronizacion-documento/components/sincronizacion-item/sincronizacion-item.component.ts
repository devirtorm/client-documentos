import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideLoader2, lucideRefreshCw, lucideTrash2, lucideFileText, lucideAlertCircle, lucidePrinter } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Documento } from '../../../articulos/interfaces/documento';

@Component({
    selector: 'app-sincronizacion-item',
    standalone: true,
    imports: [CurrencyPipe, DatePipe, NgIcon, ...HlmButtonImports],
    providers: [provideIcons({ lucideChevronDown, lucideLoader2, lucideRefreshCw, lucideTrash2, lucideFileText, lucideAlertCircle, lucidePrinter })],
    templateUrl: './sincronizacion-item.component.html'
})
export class SincronizacionItemComponent {
    item = input.required<Documento>();
    isSyncing = input<boolean>(false);

    descartar = output<Documento>();
    sincronizar = output<Documento>();
    imprimir = output<Documento>();

    onDescartar() {
        this.descartar.emit(this.item());
    }

    onSincronizar() {
        this.sincronizar.emit(this.item());
    }

    onImprimir() {
        this.imprimir.emit(this.item());
    }
}

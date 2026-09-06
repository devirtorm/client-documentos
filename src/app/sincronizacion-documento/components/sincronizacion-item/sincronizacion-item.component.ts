import { Component, input, Output, EventEmitter } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Documento } from '../../../articulos/interfaces/documento';

@Component({
    selector: 'app-sincronizacion-item',
    standalone: true,
    imports: [CurrencyPipe, DatePipe, NgIcon, ...HlmButtonImports],
    providers: [provideIcons({ lucideChevronDown })],
    templateUrl: './sincronizacion-item.component.html'
})
export class SincronizacionItemComponent {
    item = input.required<Documento>();

    @Output() descartar = new EventEmitter<Documento>();
    @Output() sincronizar = new EventEmitter<Documento>();

    protected getInitials(descripcion: string): string {
        if (!descripcion) return '';
        return descripcion
            .split(' ')
            .slice(0, 2)
            .map((n) => n.charAt(0))
            .join('')
            .toUpperCase();
    }

    onDescartar() {
        this.descartar.emit(this.item());
    }

    onSincronizar() {
        this.sincronizar.emit(this.item());
    }
}

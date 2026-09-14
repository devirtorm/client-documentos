import { Component, effect, input, output, signal } from '@angular/core';
import { Articulo } from '../../../interfaces/articulo';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideMinus, lucidePlus, lucideShoppingCart, lucideTrash2 } from '@ng-icons/lucide';

export interface ArticuloCantidad {
  articulo: Articulo;
  cantidad: number;
}

@Component({
  selector: 'app-item-articulo',
  imports: [CurrencyPipe, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmInputImports],
  viewProviders: [provideIcons({ lucideMinus, lucidePlus, lucideShoppingCart, lucideTrash2 })],
  templateUrl: './item-articulo.html',
})
export class ItemArticulo {
  articulo = input.required<Articulo>();
  cantidadInicial = input<number>(0);
  precioBase = input<number>(0);
  precioEfectivo = input<number>(0);
  cantidadChange = output<ArticuloCantidad>();

  protected cantidad = signal(0);

  constructor() {
    effect(() => {
      this.cantidad.set(this.cantidadInicial());
    });
  }

  protected getInitials(descripcion: string): string {
    return descripcion
      .split(' ')
      .slice(0, 2)
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase();
  }

  protected incrementar(): void {
    this.cantidad.update((v) => v + 1);
    this.emitCantidad();
  }

  protected decrementar(): void {
    if (this.cantidad() > 0) {
      this.cantidad.update((v) => v - 1);
      this.emitCantidad();
    }
  }

  protected eliminar(): void {
    this.cantidad.set(0);
    this.emitCantidad();
  }

  protected onCantidadInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Math.max(0, Math.floor(Number(input.value) || 0));
    this.cantidad.set(value);
    this.emitCantidad();
  }

  private emitCantidad(): void {
    this.cantidadChange.emit({
      articulo: this.articulo(),
      cantidad: this.cantidad()
    });
  }
}

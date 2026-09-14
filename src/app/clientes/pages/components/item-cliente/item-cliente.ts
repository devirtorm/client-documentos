import { Component, inject, input, output } from '@angular/core';
import { Cliente } from '../../../interfaces/cliente';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideTrash, lucidePencil, lucideMapPin, lucidePhone } from '@ng-icons/lucide';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-item-cliente',
  imports: [NgIcon, RouterLink, CommonModule, ...HlmButtonImports],
  templateUrl: './item-cliente.html',
  providers: [
    provideIcons({
      lucideTrash,
      lucidePencil,
      lucideMapPin,
      lucidePhone
    })
  ]
})
export class ItemCliente {
  private router = inject(Router);
  cliente = input.required<Cliente>();
  delete = output<string>();

  protected getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase();
  }

  onEdit(): void {
    this.router.navigate(['/clientes/editar', this.cliente().clave]);
  }

  onDelete(): void {
    this.delete.emit(this.cliente().clave);
  }

}


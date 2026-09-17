import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Cliente } from '../../../interfaces/cliente';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideTrash, lucidePencil, lucideMapPin, lucidePhone, lucideAlertTriangle } from '@ng-icons/lucide';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-item-cliente',
  imports: [NgIcon, RouterLink, NgClass, ...HlmButtonImports, ...HlmCardImports],
  templateUrl: './item-cliente.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideTrash,
      lucidePencil,
      lucideMapPin,
      lucidePhone,
      lucideAlertTriangle,
    })
  ]
})
export class ItemCliente {
  private router = inject(Router);
  cliente = input.required<Cliente>();
  delete = output<string>();

  protected readonly showDeleteModal = signal(false);

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
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    this.showDeleteModal.set(false);
    this.delete.emit(this.cliente().clave);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

}

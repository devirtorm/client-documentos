import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShoppingCart } from '@ng-icons/lucide';
import { CarritoStateService } from '../../services/carrito-state.service';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-cart-fab',
  standalone: true,
  imports: [CommonModule, NgIcon, ...HlmButtonImports],
  providers: [provideIcons({ lucideShoppingCart })],
  template: `
    @if (mostrar() && carritoState.totalArticulos() > 0) {
      <button 
        (click)="irAlCarrito()"
        class="fixed bottom-24 right-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 animate-in zoom-in duration-300"
      >
        <ng-icon name="lucideShoppingCart" size="24"></ng-icon>

        <span class="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground shadow-sm ring-2 ring-background">
          {{ carritoState.totalArticulos() }}
        </span>
      </button>
    }
  `
})
export class CartFab {
  public carritoState = inject(CarritoStateService);
  private router = inject(Router);

  // No mostrar el FAB si ya estamos en la pantalla del carrito
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: any) => event.urlAfterRedirects || event.url)
    ),
    { initialValue: this.router.url }
  );

  public mostrar = computed(() => {
    const url = this.currentUrl();
    return url ? !url.includes('/carrito') : true;
  });

  irAlCarrito() {
    const cliente = this.carritoState.clienteActivo();
    if (cliente) {
      this.router.navigate(['/carrito'], { queryParams: { cliente } });
    }
  }
}

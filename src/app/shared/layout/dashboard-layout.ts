import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { BottomNav } from '../components/bottom-nav/bottom-nav';
import { filter } from 'rxjs/operators';
import { CarritoStateService } from '../services/carrito-state.service';
import { CartFab } from '../components/cart-fab/cart-fab';
import { SyncService } from '../services/sync.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, BottomNav, CartFab],
  template: `
    <router-outlet />
    <app-cart-fab />
    <app-bottom-nav />
  `,
  host: {
    class: 'block min-h-screen pb-16',
  },
})
export class DashboardLayout implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private carritoState = inject(CarritoStateService);
  private syncService = inject(SyncService);

  ngOnInit() {
    // Iniciar sync global al autenticarse (sin importar la ruta activa)
    this.syncService.iniciar();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.revisarClienteActivo();
    });
    this.revisarClienteActivo();
  }

  private revisarClienteActivo() {
    let currentRoute = this.route.root;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    
    const cliente = currentRoute.snapshot.queryParamMap.get('cliente');
    if (cliente) {
      this.carritoState.cargarCarritoDelCliente(cliente);
    }
  }
}


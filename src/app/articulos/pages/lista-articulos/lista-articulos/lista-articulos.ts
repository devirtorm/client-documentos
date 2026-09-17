import { Component, computed, inject, Signal, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesDB } from '../../../../clientes/services/clientes-db';
import { Clientes } from '../../../../clientes/services/clientes';
import { PricingService } from '../../../../shared/services/pricing.service';
import { Cliente } from '../../../../clientes/interfaces/cliente';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Articulo } from '../../../interfaces/articulo';
import { ItemArticulo, ArticuloCantidad } from "../../components/item-articulo/item-articulo";
import { Articulos } from '../../../services/articulos';
import { CarritoDB } from '../../../services/carrito-db';
import { Auth } from '../../../../auth/service/auth';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { lucidePackageSearch, lucideLoader2, lucideChevronDown } from '@ng-icons/lucide';
import { CurrencyPipe } from '@angular/common';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { LoadMoreButtonComponent } from '../../../../shared/components/load-more-button/load-more-button.component';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { ConfiguracionService } from '../../../../shared/services/configuracion.service';

@Component({
  selector: 'app-lista-articulos',
  imports: [...HlmInputImports, ...HlmButtonImports, ItemArticulo, NgIcon, CurrencyPipe, AppHeaderComponent, LoadMoreButtonComponent],
  templateUrl: './lista-articulos.html',
  styleUrl:'./lista-articulos.css',
  providers: [
    provideIcons({
      lucidePackageSearch,
      lucideLoader2,
      lucideChevronDown,
    })
  ]
})
export class ListaArticulos {
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly mostrarFiltros = signal(false);
  protected readonly ordenSeleccionado = signal('descripcion');
  protected readonly articulos = signal<Articulo[]>([]);
  protected readonly articulosCurrentPage = signal(0);
  protected readonly articulosTotalElements = signal(0);
  protected readonly articulosTotalPages = signal(0);
  protected readonly itemsPorPagina = signal(10);

  // Debounce search
  private readonly searchSubject = new Subject<string>();
  private readonly searchSubscription: Subscription;

  // Carrito: mapa de clave -> cantidad
  protected readonly carrito = signal<Map<string, ArticuloCantidad>>(new Map());

  private articulosService = inject(Articulos);
  private carritoDB = inject(CarritoDB);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clientesDB = inject(ClientesDB);
  private clientesService = inject(Clientes);
  private pricingService = inject(PricingService);
  private configService = inject(ConfiguracionService);
  protected clienteSeleccionado = signal<Cliente | undefined>(undefined);

  constructor() {
    this.searchSubscription = this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
    ).subscribe((query) => {
        this.searchQuery.set(query);
        this.cargarArticulos();
    });
  }

  protected readonly totalItemsCarrito = computed(() => {
    let total = 0;
    this.carrito().forEach((item) => {
      total += item.cantidad;
    });
    return total;
  });

  protected readonly totalPrecioCarrito = computed(() => {
    let total = 0;
    this.carrito().forEach((item) => {
      total += this.getPrecioEfectivo(item.articulo) * item.cantidad;
    });
    return Math.round(total * 100) / 100;
  });

  async ngOnInit(): Promise<void> {
    const clienteId = this.route.snapshot.queryParamMap.get('cliente');
    this.itemsPorPagina.set(this.configService.itemsPorPagina());
    if (clienteId) {
      const local = await this.clientesDB.getCliente(clienteId);
      if (local) {
        this.clienteSeleccionado.set(local);
      } else {
        this.clientesService.getCliente(clienteId).subscribe({
          next: (c) => {
            if (c) {
              this.clienteSeleccionado.set(c);
              this.clientesDB.guardarClientes([c]);
            }
          },
          error: (err) => console.error('Error cargando cliente:', err)
        });
      }
    }
    await this.cargarCarritoPersistido([]);
    this.cargarArticulos();
  }

  protected cargarArticulos(): void {
    this.isLoading.set(true);
    const query = this.searchQuery();
    this.articulosService.getAllArticulos(0, this.itemsPorPagina(), query).subscribe({
      next: async (page) => {
        this.articulos.set(page.content);
        this.articulosCurrentPage.set(page.page.number);
        this.articulosTotalPages.set(page.page.totalPages);
        this.articulosTotalElements.set(page.page.totalElements);
        await this.cargarCarritoPersistido(page.content);
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  private async cargarCarritoPersistido(articulos: Articulo[]): Promise<void> {
    const agenteId = this.auth.currentAgente();
    const clienteId = this.route.snapshot.queryParamMap.get('cliente');
    if (!agenteId || !clienteId) return;

    const items = await this.carritoDB.getCarrito(agenteId, clienteId);
    if (items.length === 0) {
      this.carrito.set(new Map());
      return;
    }

    const articulosMap = new Map(articulos.map(a => [a.clave, a]));
    const nuevoCarrito = new Map<string, ArticuloCantidad>(this.carrito());

    for (const item of items) {
      const articulo = articulosMap.get(item.articuloClave) || {
        clave: item.articuloClave,
        descripcion: item.articuloDescripcion,
        precio1: item.articuloPrecio,
        descuento1: item.descuento1,
        descuento2: item.descuento2,
        descuento3: item.descuento3
      };

      nuevoCarrito.set(item.articuloClave, {
        articulo,
        cantidad: item.cantidad
      });
    }

    this.carrito.set(nuevoCarrito);
  }

  protected readonly totalArticulos = computed(() => this.articulos().length);

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  protected toggleFiltros(): void {
    this.mostrarFiltros.update((v) => !v);
  }

  protected setOrden(orden: string): void {
    this.ordenSeleccionado.set(orden);
  }

  protected onCantidadChange(event: ArticuloCantidad): void {
    this.carrito.update((mapa) => {
      const nuevoMapa = new Map(mapa);
      if (event.cantidad === 0) {
        nuevoMapa.delete(event.articulo.clave);
      } else {
        nuevoMapa.set(event.articulo.clave, event);
      }
      return nuevoMapa;
    });
    this.persistirCambio(event);
  }

  private async persistirCambio(event: ArticuloCantidad): Promise<void> {
    const agenteId = this.auth.currentAgente();
    const clienteId = this.route.snapshot.queryParamMap.get('cliente');
    if (!agenteId || !clienteId) return;

    if (event.cantidad === 0) {
      await this.carritoDB.eliminarItem(agenteId, clienteId, event.articulo.clave);
    } else {
      const descsArticulo = this.pricingService.getDescuentosArticulo(event.articulo);
      await this.carritoDB.guardarItem({
        articuloClave: event.articulo.clave,
        articuloDescripcion: event.articulo.descripcion,
        articuloPrecio: this.pricingService.getPrecioBaseArticulo(event.articulo, this.clienteSeleccionado()),
        cantidad: event.cantidad,
        agenteId,
        clienteClave: clienteId,
        fechaAgregado: new Date().toISOString(),
        descuento1: descsArticulo.d1,
        descuento2: descsArticulo.d2,
        descuento3: descsArticulo.d3
      });
    }
  }

  protected getCantidad(clave: string): number {
    return this.carrito().get(clave)?.cantidad ?? 0;
  }

  protected verCarrito(): void {
    const clienteId = this.route.snapshot.queryParamMap.get('cliente');
    this.router.navigate(['/carrito'], { queryParams: { cliente: clienteId } });
  }

  searchQngOnDestroy(): void {
      this.searchSubscription.unsubscribe();
  }

  protected readonly hasMoreArticulos = computed(
      () => this.articulosCurrentPage() < this.articulosTotalPages() - 1,
  );

  protected loadMoreArticulos(): void {
      if (this.isLoadingMore() || !this.hasMoreArticulos()) return;

      this.isLoadingMore.set(true);
      const nextPage = this.articulosCurrentPage() + 1;
      const query = this.searchQuery();
      this.articulosService.getAllArticulos(nextPage, 10, query).subscribe({
          next: async (page) => {
              this.articulos.update((current) => [...current, ...page.content]);
              this.articulosCurrentPage.set(page.page.number);
              this.articulosTotalPages.set(page.page.totalPages);
              await this.cargarCarritoPersistido(page.content);
              this.isLoadingMore.set(false);
          },
          error: () => {
              this.isLoadingMore.set(false);
          },
      });
  }


  protected getPrecioBase(articulo: Articulo): number {
    return this.pricingService.getPrecioBaseArticulo(articulo, this.clienteSeleccionado());
  }

  protected getPrecioEfectivo(articulo: Articulo): number {
    return this.pricingService.getPrecioEfectivoArticulo(articulo, this.clienteSeleccionado());
  }
}

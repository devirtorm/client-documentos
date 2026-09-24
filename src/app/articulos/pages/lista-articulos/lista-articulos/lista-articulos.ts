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
import { CarritoStateService } from '../../../../shared/services/carrito-state.service';
import { Auth } from '../../../../auth/service/auth';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { 
  lucidePackageSearch, 
  lucideLoader2, 
  lucideChevronDown,
  lucideSearch,
  lucideSlidersHorizontal,
  lucideArrowDownAZ,
  lucideArrowUpZA,
  lucideArrowDown01,
  lucideArrowUp01,
  lucideDollarSign,
  lucideShoppingCart
} from '@ng-icons/lucide';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { LoadMoreButtonComponent } from '../../../../shared/components/load-more-button/load-more-button.component';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { ConfiguracionService } from '../../../../shared/services/configuracion.service';
import { toast } from '@spartan-ng/brain/sonner';

@Component({
  selector: 'app-lista-articulos',
  imports: [...HlmInputImports, ...HlmButtonImports, ItemArticulo, NgIcon, AppHeaderComponent, LoadMoreButtonComponent],
  templateUrl: './lista-articulos.html',
  styleUrl:'./lista-articulos.css',
  providers: [
    provideIcons({
      lucidePackageSearch,
      lucideLoader2,
      lucideChevronDown,
      lucideSearch,
      lucideSlidersHorizontal,
      lucideArrowDownAZ,
      lucideArrowUpZA,
      lucideArrowDown01,
      lucideArrowUp01,
      lucideDollarSign,
      lucideShoppingCart
    })
  ]
})
export class ListaArticulos {
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly mostrarFiltros = signal(false);
  protected readonly ordenSeleccionado = signal('descripcion');
  protected readonly ordenDireccion = signal<'asc' | 'desc'>('asc');
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
  private carritoState = inject(CarritoStateService);
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
          error: (err) => {
            console.error('Error cargando cliente:', err);
            toast.error('No se pudo cargar la información del cliente');
          }
        });
      }
    }
    await this.cargarCarritoPersistido([]);
    this.cargarArticulos();
  }

  /** Mapea la opción de UI al nombre de campo del API / Dexie con dirección (formato Spring: "campo,dir") */
  private getSortField(): string {
    const dir = this.ordenDireccion();
    const campoMap: Record<string, string> = {
      descripcion: 'descripcion',
      codigo: 'clave',
      precio: 'precio1',
    };
    const campo = campoMap[this.ordenSeleccionado()] ?? 'descripcion';
    return `${campo},${dir}`;
  }

  protected cargarArticulos(): void {
    this.isLoading.set(true);
    const query = this.searchQuery();
    const sort = this.getSortField();
    this.articulosService.getAllArticulos(0, this.itemsPorPagina(), query, sort).subscribe({
      next: async (page) => {
        this.articulos.set(page.content);
        this.articulosCurrentPage.set(page.page.number);
        this.articulosTotalPages.set(page.page.totalPages);
        this.articulosTotalElements.set(page.page.totalElements);
        await this.cargarCarritoPersistido(page.content);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        toast.error('Error al cargar la lista de artículos');
      }
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
    if (this.ordenSeleccionado() === orden) {
      // Mismo campo → alternar dirección
      this.ordenDireccion.set(this.ordenDireccion() === 'asc' ? 'desc' : 'asc');
    } else {
      // Campo distinto → resetear dirección a asc
      this.ordenSeleccionado.set(orden);
      this.ordenDireccion.set('asc');
    }
    this.cargarArticulos();
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
      await this.carritoState.recargar();
    } else {
      let precioBase = this.pricingService.getPrecioBaseArticulo(event.articulo, this.clienteSeleccionado());
      let descsArticulo = this.pricingService.getDescuentosArticulo(event.articulo);

      const especial = this.pricingService.preciosEspeciales().get(`${clienteId}-${event.articulo.clave}`);
      if (especial && this.pricingService.isDescuentoVigente(especial.fechaInicialDescuentos, especial.fechaFinalDescuentos)) {
          precioBase = especial.precioUP ? Number(especial.precioUP) : precioBase;
          descsArticulo = {
              d1: especial.descuento1 ? Number(especial.descuento1) : 0,
              d2: especial.descuento2 ? Number(especial.descuento2) : 0,
              d3: especial.descuento3 ? Number(especial.descuento3) : 0
          };
      }

      await this.carritoDB.guardarItem({
        articuloClave: event.articulo.clave,
        articuloDescripcion: event.articulo.descripcion,
        articuloPrecio: precioBase,
        cantidad: event.cantidad,
        agenteId,
        clienteClave: clienteId,
        fechaAgregado: new Date().toISOString(),
        descuento1: descsArticulo.d1,
        descuento2: descsArticulo.d2,
        descuento3: descsArticulo.d3
      });
      await this.carritoState.recargar();
    }
  }

  protected getCantidad(clave: string): number {
    return this.carrito().get(clave)?.cantidad ?? 0;
  }

  protected verCarrito(): void {
    const clienteId = this.route.snapshot.queryParamMap.get('cliente');
    this.router.navigate(['/carrito'], { queryParams: { cliente: clienteId } });
  }

  protected volverAClientes(): void {
    this.router.navigate(['/clientes']);
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
      const sort = this.getSortField();
      this.articulosService.getAllArticulos(nextPage, this.itemsPorPagina(), query, sort).subscribe({
          next: async (page) => {
              this.articulos.update((current) => [...current, ...page.content]);
              this.articulosCurrentPage.set(page.page.number);
              this.articulosTotalPages.set(page.page.totalPages);
              await this.cargarCarritoPersistido(page.content);
              this.isLoadingMore.set(false);
          },
          error: () => {
              this.isLoadingMore.set(false);
              toast.error('Error al cargar más artículos');
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

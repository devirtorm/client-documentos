import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Cliente } from '../../../interfaces/cliente';
import { ItemCliente } from "../../components/item-cliente/item-cliente";
import { Clientes } from '../../../services/clientes';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { lucideArrowDown10, lucideArrowDownAZ, lucideArrowUpZA, lucideTrash, lucideUserSearch, lucideLoader2, lucideChevronDown } from '@ng-icons/lucide';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-lista-clientes',
  imports: [RouterLink, ...HlmInputImports, ...HlmButtonImports, ItemCliente, NgIcon, AppHeaderComponent],
  templateUrl: './lista-clientes.html',
  providers: [
    provideIcons({
      lucideTrash,
      lucideUserSearch,
      lucideArrowDownAZ,
      lucideArrowUpZA,
      lucideArrowDown10,
      lucideLoader2,
      lucideChevronDown
    })
  ]
})
export class ListaClientes {
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly zonaSeleccionada = signal('todas');
  protected readonly diaRevisionSeleccionado = signal('todos');
  protected readonly ordenSeleccionado = signal('nombre');
  protected readonly ordenDireccion = signal<'asc'|'desc'>('asc');
  protected readonly mostrarFiltros = signal(false);
  
  // Pagination state
  protected readonly clientesCurrentPage = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly clientesTotalElements = signal(0);
  protected readonly clientesTotalPages = signal(0);

  protected readonly clientes = signal<Cliente[]>([]);

  private clientesService = inject(Clientes);

  // Debounce search
  private readonly searchSubject = new Subject<string>();
  private readonly searchSubscription: Subscription;

  protected readonly zonas = signal([
    'Todas',
    'Zona Norte',
    'Zona Sur',
    'Zona Centro',
    'Zona Oriente',
    'Zona Poniente',
  ]);

  protected readonly diasRevision = signal([
    'Todos',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
  ]);

  protected readonly clientesFiltrados = computed(() => this.clientes());

  constructor() {
    this.searchSubscription = this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
    ).subscribe((query) => {
        this.searchQuery.set(query);
        this.cargarClientes(true);
    });
  }

  ngOnInit(): void {
    this.cargarClientes(true);
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
        this.searchSubscription.unsubscribe();
    }
  }

  protected cargarClientes(reset: boolean = false): void {
    if (reset) {
        this.isLoading.set(true);
        this.clientesCurrentPage.set(0);
    } else {
        this.isLoadingMore.set(true);
    }

    const search = this.searchQuery();
    const dia = this.diaRevisionSeleccionado();
    const orden = this.ordenSeleccionado();
    const dir = this.ordenDireccion();
    const page = this.clientesCurrentPage();
    const size = this.pageSize();

    let sortParam = '';
    if (orden === 'nombre') sortParam = `nombre,${dir}`;
    else if (orden === 'codigo') sortParam = `clave,${dir}`;
    else if (orden === 'zona') sortParam = `ciudad,${dir}`;

    this.clientesService.getPagedClientes(page, size, search, dia, sortParam).subscribe({
        next: (pageRes) => {
            if (reset) {
                this.clientes.set(pageRes.content);
            } else {
                this.clientes.update(current => [...current, ...pageRes.content]);
            }
            console.log('Clientes cargados:', pageRes.page.totalPages, 'páginas,', pageRes.page.totalElements, 'elementos.', 'Página actual:', pageRes.page.number);
            this.clientesCurrentPage.set(pageRes.page.number);
            this.clientesTotalPages.set(pageRes.page.totalPages);
            this.clientesTotalElements.set(pageRes.page.totalElements);
            
            this.isLoading.set(false);
            this.isLoadingMore.set(false);
        },
        error: () => {
            this.isLoading.set(false);
            this.isLoadingMore.set(false);
        }
    });
  }

  protected readonly hasMoreClientes = computed(
      () => this.clientesCurrentPage() < this.clientesTotalPages() - 1,
  );

  protected loadMoreClientes(): void {
      if (this.isLoadingMore() || !this.hasMoreClientes()) return;
      this.clientesCurrentPage.update(p => p + 1);
      this.cargarClientes(false);
  }

  eliminarCliente(clave: string): void {
    this.clientesService.eliminarCliente(clave).subscribe(() => {
      this.cargarClientes(true);
    });
  }

  protected readonly totalClientes = computed(() => this.clientesTotalElements());

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  protected toggleFiltros(): void {
    this.mostrarFiltros.update((v) => !v);
  }

  protected setZona(zona: string): void {
    this.zonaSeleccionada.set(zona.toLowerCase());
  }

  protected setDiaRevision(dia: string): void {
    this.diaRevisionSeleccionado.set(dia.toLowerCase());
    this.cargarClientes(true);
  }

  protected setOrden(orden: string): void {
    if (this.ordenSeleccionado() === orden) {
      // Si hace click en el mismo filtro, alternar dirección
      this.ordenDireccion.set(this.ordenDireccion() === 'asc' ? 'desc' : 'asc');
    } else {
      // Si cambia de filtro, resetear dirección a asc
      this.ordenSeleccionado.set(orden);
      this.ordenDireccion.set('asc');
    }
    this.cargarClientes(true);
  }
}


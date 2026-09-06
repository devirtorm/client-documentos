import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Cliente } from '../../../interfaces/cliente';
import { ItemCliente } from "../../components/item-cliente/item-cliente";
import { Clientes } from '../../../services/clientes';
import { provideIcons, NgIcon } from '@ng-icons/core';
import { lucideTrash, lucideUserSearch } from '@ng-icons/lucide';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
@Component({
  selector: 'app-lista-clientes',
  imports: [RouterLink, ...HlmInputImports, ...HlmButtonImports, ItemCliente, NgIcon, AppHeaderComponent],
  templateUrl: './lista-clientes.html',
  providers: [
    provideIcons({
      lucideTrash,
      lucideUserSearch
    })
  ]
})
export class ListaClientes {
  protected readonly searchQuery = signal('');
  protected readonly zonaSeleccionada = signal('todas');
  protected readonly ordenSeleccionado = signal('nombre');
  protected readonly mostrarFiltros = signal(false);
  protected readonly clientes = signal<Cliente[]>([]);

  private clientesService = inject(Clientes);

  protected readonly zonas = signal([
    'Todas',
    'Zona Norte',
    'Zona Sur',
    'Zona Centro',
    'Zona Oriente',
    'Zona Poniente',
  ]);


  protected readonly clientesFiltrados = computed(() => {
    let resultado = this.clientes();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      resultado = resultado.filter(
        (c) =>
          c.nombre.toLowerCase().includes(query) ||
          c.clave.toLowerCase().includes(query),
      );
    }

    const zona = this.zonaSeleccionada();
    if (zona !== 'todas') {
      resultado = resultado.filter((c) => c.ciudad?.toLowerCase() === zona);
    }

    return resultado;
  });

  ngOnInit(): void {
    this.clientesService.getClientes().subscribe((clientes) => {
      this.clientes.set(clientes);
    });
  }

  eliminarCliente(clave: string): void {
    this.clientesService.eliminarCliente(clave).subscribe(() => {
      this.clientes.update((clientes) => clientes.filter((c) => c.clave !== clave));
    });
  }

  protected readonly totalClientes = computed(() => this.clientes().length);

  protected onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected toggleFiltros(): void {
    this.mostrarFiltros.update((v) => !v);
  }

  protected setZona(zona: string): void {
    this.zonaSeleccionada.set(zona.toLowerCase());
  }

  protected setOrden(orden: string): void {
    this.ordenSeleccionado.set(orden);
  }

}

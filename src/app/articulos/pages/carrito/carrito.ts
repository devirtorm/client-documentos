import { Component, computed, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    lucideArrowLeft,
    lucideTrash2,
    lucideShoppingCart,
    lucideMinus,
    lucidePlus,
    lucidePackageOpen,
} from '@ng-icons/lucide';
import { CarritoDB } from '../../services/carrito-db';
import { DocumentosDB } from '../../services/documentos-db';
import { Auth } from '../../../auth/service/auth';
import { CarritoItem } from '../../interfaces/carrito-item';
import { Documento } from '../../interfaces/documento';
import { Conexion } from '../../../shared/services/conexion';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { Documentos } from '../../../documentos/services/documentos';
import { Clientes } from '../../../clientes/services/clientes';
import { ClientesDB } from '../../../clientes/services/clientes-db';
import { GenerarDocumentoRequest } from '../../../documentos/interfaces/documento';
import { PricingService } from '../../../shared/services/pricing.service';
import { firstValueFrom } from 'rxjs';
import { ConfiguracionService } from '../../../shared/services/configuracion.service';
import { toast } from '@spartan-ng/brain/sonner';

@Component({
    selector: 'app-carrito',
    imports: [...HlmButtonImports, CurrencyPipe, DecimalPipe, NgIcon, AppHeaderComponent],
    templateUrl: './carrito.html',
    styleUrl: './carrito.css',
    providers: [
        provideIcons({
            lucideArrowLeft,
            lucideTrash2,
            lucideShoppingCart,
            lucideMinus,
            lucidePlus,
            lucidePackageOpen,
        }),
    ],
})
export class Carrito {
    private carritoDB = inject(CarritoDB);
    private documentosDB = inject(DocumentosDB);
    private auth = inject(Auth);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private conexionService = inject(Conexion);
    private documentosService = inject(Documentos);
    private clientesService = inject(Clientes);
    private clientesDB = inject(ClientesDB);
    private pricingService = inject(PricingService);
    private configService = inject(ConfiguracionService);

    protected readonly items = signal<CarritoItem[]>([]);
    protected readonly isLoading = signal(true);
    protected readonly clienteDescuentos = signal({ d1: 0, d2: 0, d3: 0 });
    protected readonly clienteNombre = signal<string>('');
    protected readonly isSubmitted = signal(false);

    protected readonly totalItems = computed(() =>
        this.items().reduce((sum, item) => sum + item.cantidad, 0),
    );

    protected getItemPrecioNeto(item: CarritoItem): number {
        const descsArt = {
            d1: item.descuento1 || 0,
            d2: item.descuento2 || 0,
            d3: item.descuento3 || 0
        };
        const precioArt = this.pricingService.calcularPrecioConDescuento(item.articuloPrecio, descsArt);
        return this.pricingService.calcularPrecioConDescuento(precioArt, this.clienteDescuentos());
    }

    protected getItemSubtotal(item: CarritoItem): number {
        return Math.round(this.getItemPrecioNeto(item) * item.cantidad * 100) / 100;
    }

    protected readonly subtotalBase = computed(() => {
        return this.items().reduce((sum, item) => sum + (item.articuloPrecio * item.cantidad), 0);
    });

    protected readonly totalPrecio = computed(() => {
        let total = 0;
        for (const item of this.items()) {
            total += this.getItemSubtotal(item);
        }
        return Math.round(total * 100) / 100;
    });

    protected readonly totalDescuento = computed(() => {
        const diff = this.subtotalBase() - this.totalPrecio();
        return Math.max(0, Math.round(diff * 100) / 100);
    });

    protected readonly isEmpty = computed(() => this.items().length === 0);

    async ngOnInit(): Promise<void> {
        await this.cargarCarrito();
    }

    private async cargarCarrito(): Promise<void> {
        const agenteId = this.auth.currentAgente();
        const clienteId = this.route.snapshot.queryParamMap.get('cliente');
        if (!agenteId || !clienteId) {
            this.isLoading.set(false);
            return;
        }

        // Cargar descuentos del cliente usando la base de datos local (Dexie)
        // o recurriendo a la API si no estaba en caché
        let cliente = await this.clientesDB.getCliente(clienteId);
        if (!cliente) {
            try {
                cliente = await firstValueFrom(this.clientesService.getCliente(clienteId));
                if (cliente) {
                    await this.clientesDB.guardarClientes([cliente]);
                }
            } catch (e) {
                console.error('Error al obtener cliente en carrito:', e);
            }
        }
        if (cliente) {
            this.clienteNombre.set(cliente.nombre);
            this.clienteDescuentos.set(this.pricingService.getDescuentosCliente(cliente));
        }

        const items = await this.carritoDB.getCarrito(agenteId, clienteId);
        this.items.set(items);
        this.isLoading.set(false);
    }

    protected async incrementar(item: CarritoItem): Promise<void> {
        const updated = { ...item, cantidad: item.cantidad + 1 };
        this.items.update((list) =>
            list.map((i) => (i.articuloClave === item.articuloClave ? updated : i)),
        );
        await this.carritoDB.guardarItem(updated);
    }

    protected async decrementar(item: CarritoItem): Promise<void> {
        if (item.cantidad <= 1) {
            await this.eliminarItem(item);
            return;
        }
        const updated = { ...item, cantidad: item.cantidad - 1 };
        this.items.update((list) =>
            list.map((i) => (i.articuloClave === item.articuloClave ? updated : i)),
        );
        await this.carritoDB.guardarItem(updated);
    }

    protected async eliminarItem(item: CarritoItem): Promise<void> {
        const agenteId = this.auth.currentAgente();
        const clienteId = this.route.snapshot.queryParamMap.get('cliente');
        if (!agenteId || !clienteId) return;

        this.items.update((list) => list.filter((i) => i.articuloClave !== item.articuloClave));
        await this.carritoDB.eliminarItem(agenteId, clienteId, item.articuloClave);
    }

    protected async limpiarTodo(): Promise<void> {
        const agenteId = this.auth.currentAgente();
        const clienteId = this.route.snapshot.queryParamMap.get('cliente');
        if (!agenteId || !clienteId) return;

        this.items.set([]);
        await this.carritoDB.limpiarCarrito(agenteId, clienteId);
    }

    protected volver(): void {
        const clienteId = this.route.snapshot.queryParamMap.get('cliente');
        this.router.navigate(['/articulos'], { queryParams: { cliente: clienteId } });
    }

    protected getInitials(descripcion: string): string {
        return descripcion
            .split(' ')
            .slice(0, 2)
            .map((n) => n.charAt(0))
            .join('')
            .toUpperCase();
    }

    protected guardarDocumento(): void {
        this.isSubmitted.set(true);
        const agenteId = this.auth.currentAgente();
        const clienteId = this.route.snapshot.queryParamMap.get('cliente');

        if (!this.conexionService.isOnline) {
            this.guardarOffline(agenteId!, clienteId!);
        } else {
            this.guardarOnline(agenteId!, clienteId!);
        }
    }

    protected async guardarOnline(agenteId: string, clienteId: string): Promise<void> {
        const almacen = this.auth.currentAlmacen() ?? '';
        const request: GenerarDocumentoRequest = {
            tipoDocumento: this.configService.tipoDocumento(), 
            cliProv: clienteId,
            agente: agenteId,
            almacen: almacen,
            claveMoneda: '001', 
            descuento1: this.clienteDescuentos().d1,
            descuento2: this.clienteDescuentos().d2,
            descuento3: this.clienteDescuentos().d3,
            detalles: this.items().map(item => ({
                articulo: item.articuloClave,
                descripcion: item.articuloDescripcion,
                cantidad: item.cantidad,
                precio: item.articuloPrecio,
                descuento1: item.descuento1 || 0,
                descuento2: item.descuento2 || 0,
                descuento3: item.descuento3 || 0
            }))
        };
        this.documentosService.generarDocumento(request).subscribe({
            next: async (response) => {
                if (response.success) {
                    await this.carritoDB.limpiarCarrito(agenteId, clienteId);
                    this.items.set([]);
                    toast.success('Pedido generado exitosamente');
                    this.volver(); 
                } else {
                    console.error('La API retornó error:', response.mensaje);
                    toast.error(response.mensaje || 'Error al generar el pedido');
                }
                this.isSubmitted.set(false);
            },
            error: (err) => {
                console.error('Error al generar el pedido online:', err);
                toast.error('Error al generar el pedido online' + (err?.error?.mensaje ? `: ${err.error.mensaje}` : ''));
                this.isSubmitted.set(false);
            }
        });
    }
    protected async guardarOffline(agenteId: string, clienteId: string): Promise<void> {
        const now = new Date();
        const id = `${agenteId}_${clienteId}_${now.getTime()}`;

        const documento: Documento = {
            id,
            folio: id,
            agenteId,
            clienteId,
            items: [...this.items()],
            total: this.totalPrecio(),
            fecha: now.toISOString(),
            estatus: 'pendiente',
            tipoDocumento: this.configService.tipoDocumento(),
        };

        await this.documentosDB.guardarDocumento(documento);
        await this.carritoDB.limpiarCarrito(agenteId, clienteId);
        toast.success('Documento guardado offline');
        this.isSubmitted.set(false);
        this.items.set([]);
        this.volver();
    }
}

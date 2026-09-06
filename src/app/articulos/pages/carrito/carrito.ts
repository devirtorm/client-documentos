import { Component, computed, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CurrencyPipe } from '@angular/common';
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

@Component({
    selector: 'app-carrito',
    imports: [...HlmButtonImports, CurrencyPipe, NgIcon, AppHeaderComponent],
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

    protected readonly items = signal<CarritoItem[]>([]);
    protected readonly isLoading = signal(true);

    protected readonly totalItems = computed(() =>
        this.items().reduce((sum, item) => sum + item.cantidad, 0),
    );

    protected readonly totalPrecio = computed(() =>
        this.items().reduce((sum, item) => sum + item.articuloPrecio * item.cantidad, 0),
    );

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

        const items = await this.carritoDB.getCarrito(agenteId, clienteId);
        this.items.set(items);
        this.isLoading.set(false);
    }

    protected async incrementar(item: CarritoItem): Promise<void> {
        console.log(item);
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
        const agenteId = this.auth.currentAgente();
        const clienteId = this.route.snapshot.queryParamMap.get('cliente');

        if (!this.conexionService.isOnline) {
            this.guardarOffline(agenteId!, clienteId!);
        } else {
            this.guardarOnline(agenteId!, clienteId!);
        }
    }

    protected async guardarOnline(agenteId: string, clienteId: string): Promise<void> {

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
        };

        console.log(documento);

        await this.documentosDB.guardarDocumento(documento);
        await this.carritoDB.limpiarCarrito(agenteId, clienteId);
        this.items.set([]);
        this.volver();
    }
}

import { Service, computed, inject, signal } from '@angular/core';
import { CarritoDB } from '../../articulos/services/carrito-db';
import { CarritoItem } from '../../articulos/interfaces/carrito-item';
import { Auth } from '../../auth/service/auth';

@Service()
export class CarritoStateService {
    private carritoDb = inject(CarritoDB);
    private auth = inject(Auth);

    // Estado reactivo global para el cliente actual
    public items = signal<CarritoItem[]>([]);
    public clienteActivo = signal<string | null>(null);

    public readonly totalArticulos = computed(() => {
        return this.items().reduce((acc, item) => acc + item.cantidad, 0);
    });

    public async cargarCarritoDelCliente(clienteClave: string) {
        this.clienteActivo.set(clienteClave);
        const agenteId = this.auth.currentAgente();
        if (!agenteId) return;

        const data = await this.carritoDb.getCarrito(agenteId, clienteClave);
        this.items.set(data);
    }

    public async recargar() {
        const cliente = this.clienteActivo();
        if (cliente) {
            await this.cargarCarritoDelCliente(cliente);
        }
    }
}

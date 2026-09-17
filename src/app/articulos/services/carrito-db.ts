import { Injectable, Service } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { CarritoItem } from '../interfaces/carrito-item';

class PedidosDB extends Dexie {
    carritoItems!: Table<CarritoItem>;

    constructor() {
        super('pedidos-db-v3');
        this.version(1).stores({
            'carrito-items': 'id, [agenteId+clienteClave]',
        });
        this.carritoItems = this.table('carrito-items');
    }
}

const db = new PedidosDB();

@Service()
export class CarritoDB {

    async guardarItem(item: CarritoItem): Promise<void> {
        const id = `${item.agenteId}_${item.clienteClave}_${item.articuloClave}`;
        const itemToSave = { ...item, id };
        await db.carritoItems.put(itemToSave);
    }

    async eliminarItem(agenteId: string, clienteClave: string, articuloClave: string): Promise<void> {
        const id = `${agenteId}_${clienteClave}_${articuloClave}`;
        await db.carritoItems.delete(id);
    }

    async getCarrito(agenteId: string, clienteClave: string): Promise<CarritoItem[]> {
        return db.carritoItems.where({ agenteId, clienteClave }).toArray();
    }

    async limpiarCarrito(agenteId: string, clienteClave: string): Promise<void> {
        await db.carritoItems.where({ agenteId, clienteClave }).delete();
    }
}

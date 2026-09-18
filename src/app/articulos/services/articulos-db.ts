import { Service } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Articulo } from '../interfaces/articulo';

class ArticulosDatabase extends Dexie {
    articulos!: Table<Articulo>;

    constructor() {
        super('articulos-offline-db');
        this.version(1).stores({
            articulos: 'clave, descripcion',
        });
        this.articulos = this.table('articulos');
    }
}

const db = new ArticulosDatabase();

@Service()
export class ArticulosDB {

    async guardarArticulos(articulos: Articulo[]): Promise<void> {
        await db.articulos.bulkPut(articulos);
    }

    async getPagedArticulos(page: number, size: number, search?: string) {
        let allArticulos = await db.articulos.toArray();
        if (search && search.trim() !== '') {
            const s = search.trim().toLowerCase();
            allArticulos = allArticulos.filter(a =>
                (a.descripcion && a.descripcion.toLowerCase().includes(s)) ||
                (a.clave && a.clave.toLowerCase().includes(s))
            );
        }
        const totalElements = allArticulos.length;
        const totalPages = Math.ceil(totalElements / size);
        const content = allArticulos.slice(page * size, (page + 1) * size);
        return {
            content,
            page: { totalElements, totalPages, size, number: page }
        };
    }

    async getArticulo(clave: string): Promise<Articulo | undefined> {
        return db.articulos.get(clave);
    }

    async limpiar(): Promise<void> {
        await db.articulos.clear();
    }
}

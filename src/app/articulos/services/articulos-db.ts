import { Service } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Articulo } from '../interfaces/articulo';
import { PrecioCliente } from '../interfaces/precio-cliente';

class ArticulosDatabase extends Dexie {
    articulos!: Table<Articulo>;
    preciosCliente!: Table<PrecioCliente>;

    constructor() {
        super('articulos-offline-db');
        this.version(1).stores({
            articulos: 'clave, descripcion',
        });
        
        // V2: Add preciosCliente with composite-like primary key [cliente+articulo]
        this.version(2).stores({
            articulos: 'clave, descripcion',
            preciosCliente: '[cliente+articulo]'
        });

        this.articulos = this.table('articulos');
        this.preciosCliente = this.table('preciosCliente');
    }
}

const db = new ArticulosDatabase();

@Service()
export class ArticulosDB {

    async guardarArticulos(articulos: Articulo[]): Promise<void> {
        await db.articulos.bulkPut(articulos);
    }

    async guardarPreciosCliente(precios: PrecioCliente[]): Promise<void> {
        await db.preciosCliente.clear(); // Limpiamos tabla anterior
        await db.preciosCliente.bulkPut(precios);
    }

    async getTodosPreciosCliente(): Promise<PrecioCliente[]> {
        return db.preciosCliente.toArray();
    }

    async getPagedArticulos(page: number, size: number, search?: string, sort: string = 'descripcion') {
        let allArticulos = await db.articulos.toArray();

        if (search && search.trim() !== '') {
            const s = search.trim().toLowerCase();
            allArticulos = allArticulos.filter(a =>
                (a.descripcion && a.descripcion.toLowerCase().includes(s)) ||
                (a.clave && a.clave.toLowerCase().includes(s))
            );
        }

        // Ordenamiento local equivalente al del servidor
        const partes = sort.split(',');
        const campo = partes[0];
        const dir = partes[1] ?? 'asc';

        allArticulos.sort((a, b) => {
            let cmp: number;
            if (campo === 'precio1') {
                cmp = (a.precio1 ?? 0) - (b.precio1 ?? 0);
            } else if (campo === 'clave') {
                cmp = (a.clave ?? '').localeCompare(b.clave ?? '');
            } else {
                cmp = (a.descripcion ?? '').localeCompare(b.descripcion ?? '', undefined, { sensitivity: 'base' });
            }
            return dir === 'desc' ? -cmp : cmp;
        });

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

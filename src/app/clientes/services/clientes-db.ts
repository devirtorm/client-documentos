import { Service } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Cliente } from '../interfaces/cliente';

class ClientesDatabase extends Dexie {
    clientes!: Table<Cliente>;

    constructor() {
        super('clientes-offline-db');
        this.version(1).stores({
            clientes: 'clave, nombre, agente, ciudad, diaRevision',
        });
        this.clientes = this.table('clientes');
    }
}

const db = new ClientesDatabase();

@Service()
export class ClientesDB {
    async guardarClientes(clientes: Cliente[]): Promise<void> {
        await db.clientes.bulkPut(clientes);
    }

    async getPagedClientes(page: number, size: number, search?: string, diaRevision?: string, sort?: string) {
        let allClients = await db.clientes.toArray();
        if (search && search.trim() !== '') {
            const s = search.trim().toLowerCase();
            allClients = allClients.filter(c => 
                (c.nombre && c.nombre.toLowerCase().includes(s)) || 
                (c.clave && c.clave.toLowerCase().includes(s))
            );
        }
        if (diaRevision && diaRevision.toLowerCase() !== 'todos') {
            const dia = diaRevision.toLowerCase();
            allClients = allClients.filter(c => c.diaRevision && c.diaRevision.toLowerCase() === dia);
        }
        if (sort) {
            const parts = sort.split(',');
            const prop = parts[0];
            const dir = parts.length > 1 ? parts[1] : 'asc';
            allClients.sort((a: any, b: any) => {
                const valA = String(a[prop] || '');
                const valB = String(b[prop] || '');
                return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }
        const totalElements = allClients.length;
        const totalPages = Math.ceil(totalElements / size);
        const content = allClients.slice(page * size, (page + 1) * size);
        return {
            content,
            page: { totalElements, totalPages, size, number: page }
        };
    }

    async getCliente(clave: string): Promise<Cliente | undefined> {
        return db.clientes.get(clave);
    }
}

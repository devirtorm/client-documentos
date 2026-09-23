import { Service } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Cliente } from '../interfaces/cliente';

export interface ClientePendiente extends Cliente {
    _pendienteId: string; // UUID local para identificar el registro
    _intentos: number;    // Número de intentos de sincronización fallidos
}

class ClientesDatabase extends Dexie {
    clientes!: Table<Cliente>;
    clientesPendientes!: Table<ClientePendiente>;

    constructor() {
        super('clientes-offline-db');
        this.version(1).stores({
            clientes: 'clave, nombre, agente, ciudad, diaRevision',
        });
        // Versión 2: agrega tabla de pendientes sin migración de datos previa
        this.version(2).stores({
            clientes: 'clave, nombre, agente, ciudad, diaRevision',
            clientesPendientes: '_pendienteId, clave',
        });
        this.clientes = this.table('clientes');
        this.clientesPendientes = this.table('clientesPendientes');
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

    /**
     * Calcula la siguiente clave sugerida basada en los registros locales.
     * Toma la clave numérica más alta de clientes y pendientes, y devuelve la siguiente
     * con el mismo formato de ceros a la izquierda.
     */
    async getLastClave(): Promise<string | null> {
        const [clientes, pendientes] = await Promise.all([
            db.clientes.toArray(),
            db.clientesPendientes.toArray(),
        ]);
        const todasLasClaves = [
            ...clientes.map(c => c.clave),
            ...pendientes.map(p => p.clave),
        ];
        const nums = todasLasClaves
            .map(c => parseInt(c, 10))
            .filter(n => !isNaN(n));
        if (nums.length === 0) return null;
        const max = Math.max(...nums);
        const siguiente = max + 1;
        // Conservar el mismo ancho de la clave más larga
        const maxLen = Math.max(...todasLasClaves.map(c => c.length));
        return String(siguiente).padStart(maxLen, '0');
    }

    // ── Clientes pendientes de sincronización ─────────────────────────────────

    async guardarClientePendiente(cliente: Cliente): Promise<string> {
        const pendienteId = crypto.randomUUID();
        await db.clientesPendientes.put({
            ...cliente,
            _pendienteId: pendienteId,
            _intentos: 0,
        });
        // También lo guardamos en clientes locales para que aparezca en la lista
        await db.clientes.put(cliente);
        return pendienteId;
    }

    async getClientesPendientes(): Promise<ClientePendiente[]> {
        return db.clientesPendientes.toArray();
    }

    async eliminarClientePendiente(pendienteId: string): Promise<void> {
        await db.clientesPendientes.delete(pendienteId);
    }

    async incrementarIntentosPendiente(pendienteId: string): Promise<void> {
        const pendiente = await db.clientesPendientes.get(pendienteId);
        if (pendiente) {
            await db.clientesPendientes.update(pendienteId, { _intentos: pendiente._intentos + 1 });
        }
    }

    async eliminarCliente(clave: string): Promise<void> {
        await db.clientes.delete(clave);
    }

    async hayClientesPendientes(): Promise<boolean> {
        const count = await db.clientesPendientes.count();
        return count > 0;
    }
}

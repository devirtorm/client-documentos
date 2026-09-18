import { Service } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Documento, DocumentoEstatus } from '../interfaces/documento';

class DocumentosDatabase extends Dexie {
    documentos!: Table<Documento>;

    constructor() {
        super('documentos-offline-db');
        this.version(1).stores({
            documentos: 'id, agenteId, clienteId, estatus, fecha',
        });
        this.documentos = this.table('documentos');
    }
}

const db = new DocumentosDatabase();

@Service()
export class DocumentosDB {

    async guardarDocumento(documento: Documento): Promise<void> {
        await db.documentos.put(documento);
    }

    async obtenerPendientes(): Promise<Documento[]> {
        return db.documentos.where('estatus').equals('pendiente' satisfies DocumentoEstatus).toArray();
    }

    async obtenerPorAgente(agenteId: string): Promise<Documento[]> {
        return db.documentos.where('agenteId').equals(agenteId).toArray();
    }

    async obtenerPorAgenteYCliente(agenteId: string, clienteId: string): Promise<Documento[]> {
        return db.documentos
            .where({ agenteId, clienteId })
            .toArray();
    }

    async marcarSincronizado(id: string): Promise<void> {
        await db.documentos.update(id, { estatus: 'sincronizado' satisfies DocumentoEstatus });
    }

    async marcarError(id: string): Promise<void> {
        await db.documentos.update(id, { estatus: 'error' satisfies DocumentoEstatus });
    }

    async eliminarDocumento(id: string): Promise<void> {
        await db.documentos.delete(id);
    }

    async eliminarSincronizados(): Promise<void> {
        await db.documentos.where('estatus').equals('sincronizado' satisfies DocumentoEstatus).delete();
    }

    async contarPendientes(): Promise<number> {
        return db.documentos.where('estatus').equals('pendiente' satisfies DocumentoEstatus).count();
    }

    async obtenerRemisionesPendientes(): Promise<Documento[]> {
        return db.documentos
            .where('estatus').equals('pendiente' satisfies DocumentoEstatus)
            .filter(doc => doc.tipoDocumento === 'M')
            .toArray();
    }
}

import { CarritoItem } from './carrito-item';

export type DocumentoEstatus = 'pendiente' | 'sincronizado' | 'error';

export interface Documento {
    id?: string;
    folio: string;
    agenteId: string;
    clienteId: string;
    items: CarritoItem[];
    total: number;
    fecha: string;
    estatus: DocumentoEstatus;
}

export interface DocumentoDetalle {
    consecutivo: number;
    articulo: string;
    descripcion: string;
    cantidad: number;
    precio: number;
    importeTotal: number;
}

export interface DocumentoHistorial {
    folio: string;
    fecha: string;
    cliProv: string;
    agente: string;
    status: string;
    total: number;
    detalles: DocumentoDetalle[];
}


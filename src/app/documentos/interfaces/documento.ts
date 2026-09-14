export interface DetalleRequest {
    articulo: string;
    descripcion?: string;
    cantidad: number;
    precio: number;
    descuento1?: number;
    descuento2?: number;
    descuento3?: number;
}

export interface GenerarDocumentoRequest {
    tipoDocumento: string;
    cliProv: string;
    agente: string;
    almacen: string;
    claveMoneda: string;
    descuento1?: number;
    descuento2?: number;
    descuento3?: number;
    detalles: DetalleRequest[];
}

export interface TotalesDocumento {
    subtotalGravado: number;
    subtotalExento: number;
    descuento: number;
    iva: number;
    totalFinal: number;
}

export interface DatosDocumento {
    folioGenerado: string;
    tipoDocumento: string;
    fechaGeneracion: string;
    totales: TotalesDocumento;
}

export interface GenerarDocumentoResponse {
    success: boolean;
    mensaje: string;
    datos: DatosDocumento;
}

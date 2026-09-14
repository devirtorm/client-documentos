export interface Articulo {
    clave: string;
    descripcion: string;
    precio1?: number;
    precio2?: number;
    precio3?: number;
    precio4?: number;
    precio5?: number;
    fechaInicialDescuentos?: string;
    fechaFinalDescuentos?: string;
    descuento1?: number;
    descuento2?: number;
    descuento3?: number;
    existenciaTotal?: number;
    unidadPrimaria?: string;
    imagen?: string;
}

export interface Cliente {
    clave: string;
    nombre: string;
    telefono?: string;
    ciudad?: string;
    diaRevision?: string;
    esClienteBase?: string;
    email?: string;
    direccion?: string;
    descuento1?: string;
    descuento2?: string;
    descuento3?: string;
    listaPrecios?: string;
    fechaInicialDescuentos?: string;
    fechaFinalDescuentos?: string;
    extra1?: string;
    extra2?: string;
    extra3?: string;
    extra4?: string;
    extraN1?: string | number;
    extraN2?: string | number;
    extraN3?: string | number;
    extraN4?: string | number;
}

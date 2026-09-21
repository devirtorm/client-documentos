export interface PrecioCliente {
  cliente: string;
  articulo: string;
  precioUP: number;
  precioUS: number;
  descuento1: number;
  descuento2: number;
  descuento3: number;
  fechaInicialDescuentos?: string;
  fechaFinalDescuentos?: string;
  fechaInicialPrecios?: string;
  fechaFinalPrecios?: string;
}

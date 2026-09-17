import { Injectable } from '@angular/core';
import { Cliente } from '../../clientes/interfaces/cliente';
import { Articulo } from '../../articulos/interfaces/articulo';

@Injectable({ providedIn: 'root' })
export class PricingService {

    isDescuentoVigente(fechaInicial?: string, fechaFinal?: string): boolean {
        const now = new Date().getTime();

        if (fechaInicial) {
            const start = new Date(fechaInicial).getTime();
            if (now < start) return false; // Aún no empieza
        }

        if (fechaFinal) {
            const end = new Date(fechaFinal);
            end.setHours(23, 59, 59, 999);
            if (now > end.getTime()) return false;
        }

        return true; 
    }

    getDescuentosCliente(cliente?: Cliente) {
        if (!cliente) return { d1: 0, d2: 0, d3: 0 };
        if (this.isDescuentoVigente(cliente.fechaInicialDescuentos, cliente.fechaFinalDescuentos)) {
            return {
                d1: parseFloat(cliente.descuento1 || '0'),
                d2: parseFloat(cliente.descuento2 || '0'),
                d3: parseFloat(cliente.descuento3 || '0')
            };
        }
        return { d1: 0, d2: 0, d3: 0 };
    }
    
    getDescuentosArticulo(articulo: Articulo) {
        if (this.isDescuentoVigente(articulo.fechaInicialDescuentos, articulo.fechaFinalDescuentos)) {
            return {
                d1: parseFloat(String(articulo.descuento1 || 0)),
                d2: parseFloat(String(articulo.descuento2 || 0)),
                d3: parseFloat(String(articulo.descuento3 || 0))
            };
        }
        return { d1: 0, d2: 0, d3: 0 };
    }

    getPrecioBaseArticulo(articulo: Articulo, cliente?: Cliente): number {
        const rawLista = cliente?.listaPrecios ? String(cliente.listaPrecios) : '1';
        // Extrae el dígito: 'Lista 2' -> '2', '2' -> '2', '1' -> '1'
        const matched = rawLista.match(/\d+/);
        const lista = matched ? matched[0] : '1';

        switch (lista) {
            case '1': return Number(articulo.precio1 || 0);
            case '2': return Number(articulo.precio2 || 0);
            case '3': return Number(articulo.precio3 || 0);
            case '4': return Number(articulo.precio4 || 0);
            case '5': return Number(articulo.precio5 || 0);
            default: return Number(articulo.precio1 || 0);
        }
    }
    
    calcularPrecioConDescuento(precioBase: number, descuentos: {d1: number, d2: number, d3: number}): number {
        let total = Number(precioBase || 0);
        if (descuentos.d1) total = total - (total * (descuentos.d1 / 100));
        if (descuentos.d2) total = total - (total * (descuentos.d2 / 100));
        if (descuentos.d3) total = total - (total * (descuentos.d3 / 100));
        return Math.round(total * 100) / 100;
    }

    getPrecioEfectivoArticulo(articulo: Articulo, cliente?: Cliente): number {
        const precioBase = this.getPrecioBaseArticulo(articulo, cliente);
        const descsArticulo = this.getDescuentosArticulo(articulo);
        const precioConDescsArticulo = this.calcularPrecioConDescuento(precioBase, descsArticulo);
        const descsCliente = this.getDescuentosCliente(cliente);
        return this.calcularPrecioConDescuento(precioConDescsArticulo, descsCliente);
    }
}

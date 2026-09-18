import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Inventario } from '../interfaces/inventario';
import { Page } from '../../shared/interfaces/pagination';
import { Conexion } from '../../shared/services/conexion';
import { ArticulosDB } from '../../articulos/services/articulos-db';
import { DocumentosDB } from '../../articulos/services/documentos-db';

@Injectable({ providedIn: 'root' })
export class Inventarios {
    private readonly apiUrl = environment.apiUrl + '/inventario';
    private readonly http = inject(HttpClient);
    private readonly conexion = inject(Conexion);
    private readonly articulosDB = inject(ArticulosDB);
    private readonly documentosDB = inject(DocumentosDB);

    getInventario(page: number = 0, size: number = 10, search: string = ''): Observable<Page<Inventario>> {
        if (!this.conexion.isOnline) {
            return from(this.articulosDB.getPagedArticulos(page, size, search)).pipe(
                switchMap(localPage => {
                    const mappedInventario: Inventario[] = localPage.content.map(a => ({
                        articulo: a.clave,
                        descripcion: a.descripcion,
                        existencia: a.existenciaTotal ?? 0,
                        vendida: 0
                    }));
                    return from(this.ajustarExistencias(mappedInventario)).pipe(
                        map(adjusted => ({
                            content: adjusted,
                            page: localPage.page
                        }))
                    );
                })
            );
        }

        const almacen = localStorage.getItem('currentAlmacen') ?? 'R2';
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<Page<Inventario>>(`${this.apiUrl}/almacen/${almacen}`, { params }).pipe(
            switchMap(pageRes => from(this.ajustarExistencias(pageRes.content)).pipe(
                map(adjusted => ({
                    content: adjusted,
                    page: pageRes.page
                }))
            ))
        );
    }

    private async ajustarExistencias(inventarios: Inventario[]): Promise<Inventario[]> {
        const remisionesPendientes = await this.documentosDB.obtenerRemisionesPendientes();

        if (remisionesPendientes.length === 0) {
            return inventarios;
        }

        const vendidoOffline = new Map<string, number>();
        for (const remision of remisionesPendientes) {
            for (const item of remision.items) {
                const actual = vendidoOffline.get(item.articuloClave) ?? 0;
                vendidoOffline.set(item.articuloClave, actual + item.cantidad);
            }
        }

        return inventarios.map(inv => {
            const cantidadVendida = vendidoOffline.get(inv.articulo);
            if (cantidadVendida == null) {
                return inv;
            }
            return {
                ...inv,
                existencia: Math.max(0, inv.existencia - cantidadVendida),
                vendida: (inv.vendida ?? 0) + cantidadVendida
            };
        });
    }
}

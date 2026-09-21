import { inject, Service } from '@angular/core';
import { Observable, from, map, switchMap, tap } from 'rxjs';
import { Articulo } from '../interfaces/articulo';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from '../../auth/service/auth';
import { Page } from '../../shared/interfaces/pagination';
import { Conexion } from '../../shared/services/conexion';
import { ArticulosDB } from './articulos-db';
import { DocumentosDB } from './documentos-db';
import { PricingService } from '../../shared/services/pricing.service';

@Service()
export class Articulos {
    private readonly apiUrl = environment.apiUrl + '/articulos';
    private readonly http = inject(HttpClient);
    private readonly auth = inject(Auth);
    private readonly conexion = inject(Conexion);
    private readonly articulosDB = inject(ArticulosDB);
    private readonly documentosDB = inject(DocumentosDB);
    private readonly pricingService = inject(PricingService);

    constructor() {
        this.conexion.isOnline$.subscribe(isOnline => {
            if (isOnline) {
                console.log('Sincronizando artículos hacia la BD local...');
                this.sincronizarArticulosBackendToLocal().subscribe({
                    next: () => console.log('Artículos sincronizados exitosamente en Dexie'),
                    error: (err) => console.error('Error sincronizando artículos', err)
                });
            }
        });
    }

    sincronizarArticulosBackendToLocal(): Observable<void> {
        return this.getArticulosOffline().pipe(
            switchMap(articulos => from(this.articulosDB.guardarArticulos(articulos))),
            // Usamos any para el cast rápido o revisamos si el objeto currentUser tiene clave
            switchMap(() => {
                const currentUser: string | null = this.auth.currentAgente();
                return this.getPreciosEspecialesOffline(currentUser ?? '');
            }),
            switchMap(precios => from(this.articulosDB.guardarPreciosCliente(precios))),
            tap(() => {
                this.pricingService.cargarPreciosEnMemoria();
            })
        );
    }

    private getPreciosEspecialesOffline(agente: string): Observable<import('../interfaces/precio-cliente').PrecioCliente[]> {
        if (!agente) return from([[]]);
        return this.http.get<import('../interfaces/precio-cliente').PrecioCliente[]>(`${this.apiUrl}/precios-especiales/offline/agente/${agente}`);
    }

    private getArticulosOffline(): Observable<Articulo[]> {
        const almacen = this.auth.currentAlmacen() ?? '';
        const params = new HttpParams().set('almacen', almacen);
        return this.http.get<Articulo[]>(`${this.apiUrl}/offline`, { params });
    }

    getArticulos(page: number = 0, size: number = 10, search: string = ''): Observable<Page<Articulo>> {
        return this.getAllArticulosByAlmacen(page, size, search);
    }

    getAllArticulos(page: number, size: number = 10, search: string = ''): Observable<Page<Articulo>> {
        if (!this.conexion.isOnline) {
            return from(this.articulosDB.getPagedArticulos(page, size, search)).pipe(
                switchMap(localPage => from(this.ajustarExistencias(localPage.content)).pipe(
                    map(adjusted => ({
                        content: adjusted,
                        page: localPage.page
                    }))
                ))
            );
        }

        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('search', search);

        return this.http.get<Page<Articulo>>(`${this.apiUrl}`, { params }).pipe(
            tap(pageRes => {
                if (pageRes?.content?.length) {
                    this.articulosDB.guardarArticulos(pageRes.content);
                }
            }),
            switchMap(pageRes => from(this.ajustarExistencias(pageRes.content)).pipe(
                map(adjusted => ({
                    content: adjusted,
                    page: pageRes.page
                }))
            ))
        );
    }

    getAllArticulosByAlmacen(page: number, size: number = 10, search: string = ''): Observable<Page<Articulo>> {
        if (!this.conexion.isOnline) {
            return from(this.articulosDB.getPagedArticulos(page, size, search)).pipe(
                switchMap(localPage => from(this.ajustarExistencias(localPage.content)).pipe(
                    map(adjusted => ({
                        content: adjusted,
                        page: localPage.page
                    }))
                ))
            );
        }

        const almacen = this.auth.currentAlmacen() ?? '';
        const params = new HttpParams()
            .set('almacen', almacen)
            .set('page', page.toString())
            .set('size', size.toString())
            .set('search', search);

        return this.http.get<Page<Articulo>>(`${this.apiUrl}/byAlmacen`, { params }).pipe(
            tap(pageRes => {
                if (pageRes?.content?.length) {
                    this.articulosDB.guardarArticulos(pageRes.content);
                }
            }),
            switchMap(pageRes => from(this.ajustarExistencias(pageRes.content)).pipe(
                map(adjusted => ({
                    content: adjusted,
                    page: pageRes.page
                }))
            ))
        );
    }

    private async ajustarExistencias(articulos: Articulo[]): Promise<Articulo[]> {
        const remisionesPendientes = await this.documentosDB.obtenerRemisionesPendientes();

        if (remisionesPendientes.length === 0) {
            return articulos;
        }

        // Acumular cantidades vendidas offline por clave de artículo
        const vendidoOffline = new Map<string, number>();
        for (const remision of remisionesPendientes) {
            for (const item of remision.items) {
                const actual = vendidoOffline.get(item.articuloClave) ?? 0;
                vendidoOffline.set(item.articuloClave, actual + item.cantidad);
            }
        }

        return articulos.map(articulo => {
            const cantidadVendida = vendidoOffline.get(articulo.clave);
            if (cantidadVendida == null) {
                return articulo;
            }
            return {
                ...articulo,
                existenciaTotal: Math.max(0, (articulo.existenciaTotal ?? 0) - cantidadVendida)
            };
        });
    }
}

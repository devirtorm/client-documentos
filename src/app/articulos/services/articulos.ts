import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Articulo } from '../interfaces/articulo';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from '../../auth/service/auth';
import { Page } from '../../shared/interfaces/pagination';

@Service()
export class Articulos {
    private readonly apiUrl = environment.apiUrl + '/articulos';
    private readonly http = inject(HttpClient);
    private readonly auth = inject(Auth);

    getArticulos(page: number = 0, size: number = 10, search: string = ''): Observable<Page<Articulo>> {
        return this.getAllArticulosByAlmacen(page, size, search);
    }

    getAllArticulos(page: number, size: number = 10, search: string = ''): Observable<Page<Articulo>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('search', search);

        return this.http.get<Page<Articulo>>(`${this.apiUrl}`, { params });
    }

    getAllArticulosByAlmacen(page: number, size: number = 10, search: string = ''): Observable<Page<Articulo>> {
        const almacen = this.auth.currentAlmacen() ?? '';
        const params = new HttpParams()
            .set('almacen', almacen)
            .set('page', page.toString())
            .set('size', size.toString())
            .set('search', search);

        return this.http.get<Page<Articulo>>(`${this.apiUrl}/byAlmacen`, { params });
    }
}

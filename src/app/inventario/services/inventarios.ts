import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Inventario } from '../interfaces/inventario';
import { Page } from '../../shared/interfaces/pagination';

@Injectable({ providedIn: 'root' })
export class Inventarios {
    private readonly apiUrl = environment.apiUrl + '/inventario';
    private readonly http = inject(HttpClient);

    getInventario(page: number = 0, size: number = 10, search: string = ''): Observable<Page<Inventario>> {
        const almacen = localStorage.getItem('currentAlmacen') ?? 'R2'; // Default to R2 just in case
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (search) {
            params = params.set('search', search);
        }

        return this.http.get<Page<Inventario>>(`${this.apiUrl}/almacen/${almacen}`, { params });
    }
}

import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Auth } from '../../auth/service/auth';
import { RemisionHistorial } from '../interfaces/remision';
import { Page } from '../../shared/interfaces/pagination';

@Service()
export class Remisiones {
    private readonly apiUrl = environment.apiUrl + '/remision';
    private readonly http = inject(HttpClient);
    private readonly auth = inject(Auth);

    getHistorialByAgente(page: number = 0, size: number = 10, query: string = ''): Observable<Page<RemisionHistorial>> {
        const agenteId = this.auth.currentAgente();
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', 'fecha,desc')
            .set('search', query);

        return this.http.get<Page<RemisionHistorial>>(`${this.apiUrl}/${agenteId}`, { params });
    }
}

import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from '../../auth/service/auth';
import { Observable } from 'rxjs';
import { Page } from '../../shared/interfaces/pagination';
import { PedidoHistorial } from '../interfaces/pedidos';

@Service()
export class Pedidos {
    private readonly apiUrl = environment.apiUrl + '/pedidos';
    private readonly http = inject(HttpClient);
    private readonly authService = inject(Auth);

    getHistorialByAgente(page: number = 0, size: number = 10, query: string = ''): Observable<Page<PedidoHistorial>> {
        const agenteId = this.authService.currentAgente();
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', 'fecha,desc')
            .set('search', query);

        return this.http.get<Page<PedidoHistorial>>(`${this.apiUrl}/${agenteId}`, { params })
    }

    getHistorialByCliente(page: number = 0, size: number = 10, clienteId: string, query: string = ''): Observable<Page<PedidoHistorial>> {
        const agenteId = this.authService.currentAgente();
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', 'fecha,desc')
            .set('search', query);

        return this.http.get<Page<PedidoHistorial>>(`${this.apiUrl}/${agenteId}/cliente/${clienteId}`, { params })
    }

}

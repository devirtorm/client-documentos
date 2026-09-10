import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from '../interfaces/cliente';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from '../../auth/service/auth';

@Service()
export class Clientes {
    private readonly apiUrl = environment.apiUrl + '/clientes-mixtos'
    private readonly http = inject(HttpClient);
    private readonly auth = inject(Auth);

    getClientes(): Observable<Cliente[]> {
        const claveAgente = this.auth.currentAgente();
        const claveUsuario = this.auth.currentUser();
        const params = new HttpParams()
            .set('idUsuario', claveUsuario ?? '');
        return this.http.get<Cliente[]>(`${this.apiUrl}/${claveAgente}`, { params });
    }

    crearCliente(cliente: Omit<Cliente, 'id'>): Observable<Cliente> {
        const claveAgente = this.auth.currentAgente();
        const payload = { ...cliente, agente: claveAgente };
        return this.http.post<Cliente>(`${this.apiUrl}`, payload);
    }

    eliminarCliente(clave: string): Observable<void> {
        const claveAgente = this.auth.currentAgente();
        return this.http.delete<void>(`${this.apiUrl}/${claveAgente}/${clave}`);
    }

    getCliente(clave: string): Observable<Cliente> {
        const claveAgente = this.auth.currentAgente();
        const claveUsuario = this.auth.currentUser();
        const options = {
            params: {
                clienteId: clave
            }
        }
        return this.http.get<Cliente>(`${this.apiUrl}/agente/${claveAgente}`, options);
    }
    actualizarCliente(clave: string, cliente: Partial<Cliente>): Observable<Cliente> {
        const claveAgente = this.auth.currentAgente();
        const payload = { ...cliente, agente: claveAgente };
        return this.http.put<Cliente>(`${this.apiUrl}/${claveAgente}/${clave}`, payload);
    }

}


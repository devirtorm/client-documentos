import { inject, Service } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Cliente } from '../interfaces/cliente';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from '../../auth/service/auth';
import { Conexion } from '../../shared/services/conexion';
import { ClientesDB } from './clientes-db';
import { Page } from '../../shared/interfaces/pagination';

@Service()
export class Clientes {
    private readonly apiUrl = environment.apiUrl + '/clientes-mixtos'
    private readonly http = inject(HttpClient);
    private readonly auth = inject(Auth);
    private readonly conexion = inject(Conexion);
    private readonly clientesDB = inject(ClientesDB);

    constructor() {
        // Escuchar cambios en la conectividad (isOnlineSubject)
        this.conexion.isOnline$.subscribe(isOnline => {
            if (isOnline) {
                // Cuando estamos online, recargamos la base de datos local
                console.log('Sincronizando clientes hacia la BD local...');
                this.sincronizarClientesBackendToLocal().subscribe({
                    next: () => console.log('Clientes sincronizados exitosamente en Dexie'),
                    error: (err) => console.error('Error sincronizando clientes', err)
                });
            }
        });
    }

    // Método para el Sync Manager (Descarga masiva cuando hay internet)
    sincronizarClientesBackendToLocal(): Observable<void> {
        return this.getClientesOffline().pipe(
            switchMap(clientes => from(this.clientesDB.guardarClientes(clientes)))
        );
    }

    private getClientesOffline(): Observable<Cliente[]> {
        const claveAgente = this.auth.currentAgente();
        const claveUsuario = this.auth.currentUser();
        const params = new HttpParams()
            .set('idUsuario', claveUsuario ?? '');
        return this.http.get<Cliente[]>(`${this.apiUrl}/${claveAgente}/offline`, { params });
    }

    getPagedClientes(page: number, size: number, search?: string, diaRevision?: string, sort?: string): Observable<Page<Cliente>> {
        // Interceptar: Si NO hay conexión, leemos de la base de datos local Dexie
        if (!this.conexion.isOnline) {
            return from(this.clientesDB.getPagedClientes(page, size, search, diaRevision, sort));
        }

        // Si HAY conexión, vamos al backend
        const claveAgente = this.auth.currentAgente();
        const claveUsuario = this.auth.currentUser();
        
        let params = new HttpParams()
            .set('idUsuario', claveUsuario ?? '')
            .set('page', page.toString())
            .set('size', size.toString());

        if (search && search.trim() !== '') {
            params = params.set('search', search.trim());
        }
        if (diaRevision && diaRevision.toLowerCase() !== 'todos') {
            params = params.set('diaRevision', diaRevision);
        }
        if (sort) {
            params = params.set('sort', sort);
        }

        console.log('Fetching paged clientes', `${this.apiUrl}/${claveAgente}` + ' with params:', params.toString());
        return this.http.get<Page<Cliente>>(`${this.apiUrl}/${claveAgente}`, { params }).pipe(
            tap(pageRes => {
                if (pageRes?.content?.length) {
                    this.clientesDB.guardarClientes(pageRes.content);
                }
            })
        );
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
        return this.http.get<Cliente>(`${this.apiUrl}/agente/${claveAgente}`, options).pipe(
            tap(cliente => {
                if (cliente) {
                    this.clientesDB.guardarClientes([cliente]);
                }
            })
        );
    }
    actualizarCliente(clave: string, cliente: Partial<Cliente>): Observable<Cliente> {
        const claveAgente = this.auth.currentAgente();
        
        const params = new HttpParams()
            .set('idCliente', clave ?? '');

        const payload = { ...cliente, agente: claveAgente };
        return this.http.put<Cliente>(`${this.apiUrl}/${claveAgente}`, payload, { params });
    }

}


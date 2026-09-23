import { inject, Service } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Cliente } from '../interfaces/cliente';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Auth } from '../../auth/service/auth';
import { Conexion } from '../../shared/services/conexion';
import { ClientesDB } from './clientes-db';
import { Page } from '../../shared/interfaces/pagination';
import { firstValueFrom } from 'rxjs';

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
                // Cuando estamos online, sincronizamos pendientes y luego recargamos la BD local
                console.log('Conexión recuperada: sincronizando clientes pendientes...');
                this.sincronizarClientesPendientes().then(() => {
                    console.log('Clientes pendientes procesados. Sincronizando clientes hacia la BD local...');
                    this.sincronizarClientesBackendToLocal().subscribe({
                        next: () => console.log('Clientes sincronizados exitosamente en Dexie'),
                        error: (err) => console.error('Error sincronizando clientes', err)
                    });
                });
            }
        });
    }

    // ── Sync Backend → Local ──────────────────────────────────────────────────

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

    // ── Sync Local → Backend (clientes creados offline) ───────────────────────

    async sincronizarClientesPendientes(): Promise<void> {
        const pendientes = await this.clientesDB.getClientesPendientes();
        if (pendientes.length === 0) return;

        console.log(`Sincronizando ${pendientes.length} clientes pendientes...`);

        for (const pendiente of pendientes) {
            const { _pendienteId, _intentos, ...clienteData } = pendiente;
            try {
                await firstValueFrom(this.crearClienteEnServidor(clienteData));
                await this.clientesDB.eliminarClientePendiente(_pendienteId);
                console.log(`Cliente ${clienteData.clave} sincronizado exitosamente.`);
            } catch (err) {
                await this.clientesDB.incrementarIntentosPendiente(_pendienteId);
                console.error(`Error sincronizando cliente ${clienteData.clave} (intento ${_intentos + 1}):`, err);
            }
        }
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

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

        return this.http.get<Page<Cliente>>(`${this.apiUrl}/${claveAgente}`, { params }).pipe(
            tap(pageRes => {
                if (pageRes?.content?.length) {
                    this.clientesDB.guardarClientes(pageRes.content);
                }
            })
        );
    }

    /**
     * Crea un cliente. Si no hay conexión, lo guarda localmente como pendiente
     * y lo sincroniza automáticamente cuando se recupere internet.
     */
    crearCliente(cliente: Omit<Cliente, 'id'>): Observable<Cliente> {
        const claveAgente = this.auth.currentAgente();
        const clienteConAgente = { ...cliente, agente: claveAgente } as Cliente;

        if (!this.conexion.isOnline) {
            // Guardamos offline y emitimos el objeto local como respuesta
            return from(
                this.clientesDB.guardarClientePendiente(clienteConAgente).then(() => clienteConAgente)
            );
        }

        return this.crearClienteEnServidor(clienteConAgente);
    }

    private crearClienteEnServidor(cliente: Cliente): Observable<Cliente> {
        return this.http.post<Cliente>(`${this.apiUrl}`, cliente).pipe(
            tap(clienteCreado => {
                // Guardar en local para disponibilidad offline inmediata
                this.clientesDB.guardarClientes([clienteCreado]);
            })
        );
    }

    eliminarCliente(clave: string): Observable<void> {
        const claveAgente = this.auth.currentAgente();

        if (!this.conexion.isOnline) {
            // Sin conexión: eliminar solo localmente
            return from(this.clientesDB.eliminarCliente(clave));
        }

        // Con conexión: eliminar en el backend y luego en local
        return this.http.delete<void>(`${this.apiUrl}/${claveAgente}/${clave}`).pipe(
            switchMap(() => from(this.clientesDB.eliminarCliente(clave)))
        );
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

    getLastClave(): Observable<string> {
        if (!this.conexion.isOnline) {
            return from(
                this.clientesDB.getLastClave().then(clave => clave ?? '00001')
            );
        }
        const claveAgente = this.auth.currentAgente();
        return this.http.get(`${this.apiUrl}/agente/${claveAgente}/last-clave`, { responseType: 'text' });
    }

}


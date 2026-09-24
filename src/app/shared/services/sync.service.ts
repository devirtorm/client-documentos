import { inject, Service } from '@angular/core';
import { Conexion } from './conexion';
import { Articulos } from '../../articulos/services/articulos';
import { Clientes } from '../../clientes/services/clientes';

/**
 * Servicio que centraliza la sincronización de datos al recuperar la conexión.
 * Se instancia en el DashboardLayout para garantizar que corra siempre que el
 * usuario esté autenticado, independientemente de la ruta activa.
 *
 * Sin este servicio, los syncs de cada módulo solo ocurren al visitar su sección
 * (porque los servicios son lazy por naturaleza del DI de Angular).
 */
@Service()
export class SyncService {
    private conexion = inject(Conexion);
    private articulosService = inject(Articulos);
    private clientesService = inject(Clientes);

    /**
     * Llama a este método una sola vez al arrancar el DashboardLayout.
     * Escucha cambios de conexión y dispara todos los syncs cuando se va online.
     */
    iniciar(): void {
        this.conexion.isOnline$.subscribe(isOnline => {
            if (!isOnline) return;
            this.sincronizarTodo();
        });
    }

    private sincronizarTodo(): void {
        // 1. Artículos: backend → Dexie local
        this.articulosService.sincronizarArticulosBackendToLocal().subscribe({
            next: () => console.log('[Sync] Artículos sincronizados'),
            error: (err) => console.error('[Sync] Error artículos:', err)
        });

        // 2. Clientes: primero sube pendientes offline, luego descarga del backend
        this.clientesService.sincronizarClientesPendientes().then(() => {
            this.clientesService.sincronizarClientesBackendToLocal().subscribe({
                next: () => console.log('[Sync] Clientes sincronizados'),
                error: (err) => console.error('[Sync] Error clientes:', err)
            });
        });
    }
}

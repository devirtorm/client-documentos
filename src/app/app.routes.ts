import { Routes } from '@angular/router';
import { Layout } from './auth/layout/layout';
import { authGuard } from './auth/guard/auth-guard';
import { guestGuard } from './auth/guard/guest-guard';
import { DashboardLayout } from './shared/layout/dashboard-layout';
import { unsavedChangesGuard } from './shared/guards/unsaved-changes.guard';

export const routes: Routes = [
    {
        path: 'auth',
        component: Layout,
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                loadComponent: () => import('./auth/components/login/login').then(m => m.Login),
            },
            {
                path: 'register-device',
                loadComponent: () => import('./auth/components/device-registration/device-registration').then(m => m.DeviceRegistration),
            },
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '',
        component: DashboardLayout,
        canActivate: [authGuard],
        children: [
            {
                path: 'clientes',
                loadComponent: () => import('./clientes/pages/lista-clientes/lista-clientes/lista-clientes').then(m => m.ListaClientes),
            },
            {
                path: 'clientes/nuevo',
                loadComponent: () => import('./clientes/pages/registrar-cliente/registrar-cliente').then(m => m.RegistrarCliente),
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'clientes/editar/:clave',
                loadComponent: () => import('./clientes/pages/registrar-cliente/registrar-cliente').then(m => m.RegistrarCliente),
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'historial',
                loadComponent: () => import('./historial/pages/historial/historial').then(m => m.Historial),
            },
            {
                path: 'articulos',
                loadComponent: () => import('./articulos/pages/lista-articulos/lista-articulos/lista-articulos').then(m => m.ListaArticulos),
            },
            {
                path: 'carrito',
                loadComponent: () => import('./articulos/pages/carrito/carrito').then(m => m.Carrito),
            },
            {
                path: 'sincronizar',
                loadComponent: () => import('./sincronizacion-documento/pages/sincronizacion-documentos/sincronizacion-documentos').then(m => m.SincronizacionDocumentos)
            },
            {
                path: 'inventario',
                loadComponent: () => import('./inventario/pages/inventario/inventario').then(m => m.Inventario)
            },
            {
                path: '',
                redirectTo: 'clientes',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'auth'
    }
];


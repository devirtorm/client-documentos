import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse, LoginDTO } from '../interfaces/loginDTO';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const STORAGE_KEY_ALMACEN = 'currentAlmacen';

@Service()
export class Auth {

    private url = environment.apiUrl + '/auth'

    private http = inject(HttpClient);
    private router = inject(Router);

    currentUser  = signal<string | null>(null);
    currentAgente = signal<string | null>(null);
    currentAlmacen = signal<string | null>(
        localStorage.getItem(STORAGE_KEY_ALMACEN)
    );

    login(credentials: LoginDTO) {
        return this.http.post<AuthResponse>(`${this.url}/login`, credentials, { withCredentials: true }).pipe(
            tap((response) => {
                this.currentUser.set(response.user ?? null);
                this.currentAgente.set(response.agente ?? null);
                this.setAlmacen(response.almacen ?? null);
            })
        );
    }

    logout(): void {
        this.http.post(`${this.url}/logout`, {}, { withCredentials: true }).pipe(
            catchError(() => of(null))
        ).subscribe(() => {
            this.currentUser.set(null);
            this.currentAgente.set(null);
            this.setAlmacen(null);
            this.router.navigate(['/auth/login']);
        });
    }

    checkSession() {
        return this.http.get<AuthResponse>(`${this.url}/me`).pipe(
            tap((response) => {
                this.currentUser.set(response.user ?? null);
                this.currentAgente.set(response.agente ?? null);
                this.setAlmacen(response.almacen ?? null);
            }),
            catchError(() => {
                this.clearSession();
                return of(null);
            })
        );
    }

    /** Limpia el estado local sin hacer petición al servidor */
    clearSession(): void {
        this.currentUser.set(null);
        this.currentAgente.set(null);
        this.setAlmacen(null);
    }

    private setAlmacen(almacen: string | null): void {
        if (almacen) {
            localStorage.setItem(STORAGE_KEY_ALMACEN, almacen);
        } else {
            localStorage.removeItem(STORAGE_KEY_ALMACEN);
        }
        this.currentAlmacen.set(almacen);
    }
}

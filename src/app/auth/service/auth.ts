import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse, LoginDTO } from '../interfaces/loginDTO';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Service()
export class Auth {

    private url = environment.apiUrl + '/auth'

    private http = inject(HttpClient);
    private router = inject(Router);

    currentUser = signal<any | null>(null);
    currentAgente = signal<string | null>(null);

    login(credentials: LoginDTO) {
        return this.http.post<AuthResponse>(`${this.url}/login`, credentials, { withCredentials: true }).pipe(
            tap((response) => {
                this.currentUser.set(response.user);
                this.currentAgente.set(response.agente ?? null);
            })
        )
    }

    logout(): void {
        this.http.post(`${this.url}/logout`, {}, { withCredentials: true }).pipe(
            catchError(() => of(null))
        ).subscribe(() => {
            this.currentUser.set(null);
            this.currentAgente.set(null);
            this.router.navigate(['/auth/login']);
        });
    }

    checkSession() {
        return this.http.get<AuthResponse>(`${this.url}/me`).pipe(
            tap((response) => {
                this.currentUser.set(response.user);
                this.currentAgente.set(response.agente ?? null);
            }),
            catchError(() => {
                this.currentUser.set(null);
                this.currentAgente.set(null);
                return of(null);
            })
        )
    }

}


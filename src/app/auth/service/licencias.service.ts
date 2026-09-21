import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface RegistroDispositivoPayload {
    nombre: string;
    clave: string;
    idDispositivo: string;
}

@Service()
export class LicenciasService {
    private http = inject(HttpClient);
    // Asegúrate de tener la ruta correcta según tu environment
    private url = environment.apiUrl + '/auth/licencias';

    registrarDispositivo(payload: RegistroDispositivoPayload) {
        return this.http.post<{ token: string, exito: boolean, mensaje: string }>(
            `${this.url}/registrar`, 
            payload
        );
    }
}

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { GenerarDocumentoRequest, GenerarDocumentoResponse } from '../interfaces/documento';
import { Auth } from '../../auth/service/auth';

@Injectable({ providedIn: 'root' })
export class Documentos {
    private readonly apiUrl = environment.apiUrl + '/documentos';
    private readonly http = inject(HttpClient);
    private readonly auth = inject(Auth);

    generarDocumento(request: GenerarDocumentoRequest): Observable<GenerarDocumentoResponse> {
        // Si hay que inyectar el agente o usuario actual en la petición (opcional, por seguridad)
        // const claveAgente = this.auth.currentAgente();
        // request.agente = claveAgente ?? request.agente;

        return this.http.post<GenerarDocumentoResponse>(`${this.apiUrl}/generar`, request);
    }
}

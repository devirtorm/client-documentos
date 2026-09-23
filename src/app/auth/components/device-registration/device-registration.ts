import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { Auth } from '../../service/auth';
import { LicenciasService } from '../../service/licencias.service';

@Component({
  selector: 'app-device-registration',
  imports: [HlmCardImports, HlmButtonImports, HlmInputImports, HlmLabelImports, ReactiveFormsModule, RouterLink],
  templateUrl: './device-registration.html',
  host: {
    class: 'w-full flex flex-col items-center justify-center px-4 py-8',
  },
})
export class DeviceRegistration {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);
  private licenciasService = inject(LicenciasService);

  public readonly errorMessage = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', Validators.required],
    password: ['', Validators.required]
  })

  registrarDispositivo() {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = this.generateUUID();
      localStorage.setItem('deviceId', deviceId);
    }

    const formValue = this.form.getRawValue();
    const payload = {
      nombre: formValue.nombre,
      clave: formValue.password.toUpperCase(),
      idDispositivo: deviceId
    };

    this.licenciasService.registrarDispositivo(payload)
      .subscribe({
        next: (res) => {
          console.log('Licencia activada con éxito:', res);
          localStorage.setItem('licenseToken', res.token);
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          console.error('Error validando la licencia:', err);
          try {
            // El backend retorna un string JSON cuando hay error de HttpClientErrorException
            const errorObj = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
            this.errorMessage.set(errorObj.message || 'Ocurrió un error al validar la licencia.');
          } catch (e) {
            this.errorMessage.set('Error de conexión o licencia inválida.');
          }
        }
      });
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback para browsers que no soportan crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

}

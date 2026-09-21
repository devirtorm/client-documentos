import { Component, inject, signal } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../service/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [HlmCardImports, HlmButtonImports, HlmInputImports, HlmLabelImports, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  host: {
    class: 'w-full flex flex-col items-center justify-center px-4 py-8',
  },
})
export class Login {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);

  public readonly errorMessage = signal<string | null>(null);
  public readonly currentYear = signal<number>(new Date().getFullYear());

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  })


  onsubmit() {
    this.errorMessage.set(null);
    if (this.form.valid) {
      const credentials = this.form.getRawValue();
      const payload = {
        ...credentials,
        licenseToken: localStorage.getItem('licenseToken') || ''
      };

      this.auth.login(payload).subscribe({
        next: () => {
          this.router.navigate(['/clientes']);
        },
        error: (err: any) => {
          console.error('Error de autenticación', err);
          if (err.status === 401) {
            this.errorMessage.set('La contraseña es incorrecta.');
          } else if (err.status === 404) {
            this.errorMessage.set('El usuario no existe.');
          } else if (err.status === 403) {
            this.errorMessage.set('Dispositivo no autorizado o licencia vencida. Por favor, registre este equipo.');
          } else {
            this.errorMessage.set('Ocurrió un error inesperado al iniciar sesión.');
          }
        }
      });
    }
  }

  // Helpers
  public readonly showPassword = signal(false);

  public togglePassword(): void {
    this.showPassword.update((show) => !show);
  }
}

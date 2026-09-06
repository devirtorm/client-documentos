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
    class: 'w-full flex items-center justify-center',
  },
})
export class Login {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  })


  onsubmit() {
    if (this.form.valid) {
      this.auth.login(this.form.getRawValue()).subscribe({
        next: () => {
          this.router.navigate(['/clientes']);
        },
        error: (err: any) => console.error('Error de autenticación', err)
      });
    }
  }

  // Helpers
  public readonly showPassword = signal(false);

  public togglePassword(): void {
    this.showPassword.update((show) => !show);
  }
}

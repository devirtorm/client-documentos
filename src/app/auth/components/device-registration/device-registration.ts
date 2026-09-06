import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { Auth } from '../../service/auth';

@Component({
  selector: 'app-device-registration',
  imports: [HlmCardImports, HlmButtonImports, HlmInputImports, HlmLabelImports, ReactiveFormsModule, RouterLink],
  templateUrl: './device-registration.html',
  host: {
    class: 'w-full flex items-center justify-center',
  },
})
export class DeviceRegistration {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private auth = inject(Auth);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  })


}

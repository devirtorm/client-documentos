import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideUserPlus, lucideSave, lucideLoader2, lucideAlertTriangle, lucideWifiOff } from '@ng-icons/lucide';
import { Clientes } from '../../services/clientes';
import { Conexion } from '../../../shared/services/conexion';
import { CanComponentDeactivate } from '../../../shared/guards/unsaved-changes.guard';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';

@Component({
  selector: 'app-registrar-cliente',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    ...HlmCardImports,
    ...HlmButtonImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    AppHeaderComponent
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideUserPlus,
      lucideSave,
      lucideLoader2,
      lucideAlertTriangle,
      lucideWifiOff,
    }),
  ],
  templateUrl: './registrar-cliente.html',
})
export class RegistrarCliente implements CanComponentDeactivate {
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clientesService = inject(Clientes);
  protected readonly conexion = inject(Conexion);

  protected readonly isEditMode = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingClave = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showLeaveModal = signal(false);
  protected readonly clienteNombre = signal('');
  protected readonly savedOffline = signal(false);  // ← nuevo: cliente guardado sin internet
  private leaveResponse?: Subject<boolean>;

  form = this.fb.group({
    clave: ['', Validators.required],
    nombre: ['', Validators.required],
    telefono: [''],
    email: [''],
    ciudad: [''],
    direccion: [''],
    diaRevision: [''],
    ordenVisita: [''],
    esClienteBase: [''],
    extra2: [''],
    extra3: [''],
    extra4: [''],
    extraN1: [''],
    extraN2: [''],
    extraN3: [''],
    extraN4: [''],
  });

  ngOnInit(): void {
    const clave = this.route.snapshot.paramMap.get('clave');
    if (clave) {
      // Modo edición
      this.isEditMode.set(true);
      this.isLoading.set(true);
      this.form.controls.clave.disable();

      this.clientesService.getCliente(clave).subscribe({
        next: (cliente) => {
          this.form.patchValue({
            clave: cliente.clave,
            nombre: cliente.nombre,
            telefono: cliente.telefono ?? '',
            email: cliente.email ?? '',
            ciudad: cliente.ciudad ?? '',
            direccion: cliente.direccion ?? '',
            diaRevision: cliente.diaRevision ?? '',
            ordenVisita: cliente.ordenVisita ?? '',
            esClienteBase: cliente.esClienteBase ?? '',
            extra2: cliente.extra2 ?? '',
            extra3: cliente.extra3 ?? '',
            extra4: cliente.extra4 ?? '',
            extraN1: String(cliente.extraN1 ?? ''),
            extraN2: String(cliente.extraN2 ?? ''),
            extraN3: String(cliente.extraN3 ?? ''),
            extraN4: String(cliente.extraN4 ?? ''),
          });
          this.clienteNombre.set(cliente.nombre);
          this.form.markAsPristine();
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.isLoading.set(false);
          this.errorMessage.set('No se pudo cargar los datos del cliente.');
          console.error('Error al cargar cliente:', err);
        },
      });
    } else {
      // Modo nuevo: cargar última clave sugerida
      this.isLoadingClave.set(true);
      this.form.controls.clave.disable();
      this.clientesService.getLastClave().subscribe({
        next: (lastClave) => {
          this.form.controls.clave.enable();
          this.form.patchValue({ clave: lastClave });
          this.form.markAsPristine();
          this.isLoadingClave.set(false);
        },
        error: () => {
          this.form.controls.clave.enable();
          this.isLoadingClave.set(false);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.savedOffline.set(false);

    const formData = this.form.getRawValue();

    const request$ = this.isEditMode()
      ? this.clientesService.actualizarCliente(formData.clave, formData)
      : this.clientesService.crearCliente(formData);

    request$.subscribe({
      next: () => {
        this.form.markAsPristine();
        if (!this.isEditMode() && !this.conexion.isOnline) {
          // Modo offline: resetear formulario y recargar siguiente clave sugerida
          this.isSubmitting.set(false);
          this.savedOffline.set(true);
          this.form.reset();
          this.form.controls.clave.disable();
          this.isLoadingClave.set(true);
          this.clientesService.getLastClave().subscribe({
            next: (lastClave) => {
              this.form.controls.clave.enable();
              this.form.patchValue({ clave: lastClave });
              this.form.markAsPristine();
              this.isLoadingClave.set(false);
            },
            error: () => {
              this.form.controls.clave.enable();
              this.isLoadingClave.set(false);
            },
          });
        } else {
          this.router.navigate(['/clientes']);
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          this.isEditMode()
            ? 'No se pudo actualizar el cliente. Intente de nuevo.'
            : 'No se pudo registrar el cliente. Intente de nuevo.'
        );
        console.error('Error:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/clientes']);
  }

  canDeactivate(): Observable<boolean> | boolean {
    if (this.form.dirty && !this.isSubmitting()) {
      this.leaveResponse = new Subject<boolean>();
      this.showLeaveModal.set(true);
      return this.leaveResponse.asObservable();
    }
    return true;
  }

  confirmLeave(): void {
    this.showLeaveModal.set(false);
    if (this.leaveResponse) {
      this.leaveResponse.next(true);
      this.leaveResponse.complete();
    }
  }

  cancelLeave(): void {
    this.showLeaveModal.set(false);
    if (this.leaveResponse) {
      this.leaveResponse.next(false);
      this.leaveResponse.complete();
    }
  }
}

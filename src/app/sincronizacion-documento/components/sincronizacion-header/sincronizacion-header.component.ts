import { Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader2, lucideRefreshCw, lucideBluetooth, lucideBluetoothOff, lucideBluetoothConnected } from '@ng-icons/lucide';
import { PrinterStatus } from '../../../shared/services/bluetooth-printer.service';

@Component({
  selector: 'app-sincronizacion-header',
  standalone: true,
  imports: [HlmButton, AppHeaderComponent, NgIcon],
  providers: [provideIcons({ lucideLoader2, lucideRefreshCw, lucideBluetooth, lucideBluetoothOff, lucideBluetoothConnected })],
  template: `
    <app-header title="Pendientes">
      
      <div subtitle-content class="text-[13px] text-muted-foreground mt-0.5">
        @if (count() > 0) {
          <span class="font-bold text-foreground"> {{ count() }} </span> documento{{ count() !== 1 ? 's' : '' }} por sincronizar
        } @else {
          Todos los documentos están sincronizados
        }
      </div>

      <div right-action class="flex items-center gap-2">

        <!-- Botón Bluetooth -->
        <button hlmBtn
          [variant]="btStatus() === 'connected' ? 'outline' : 'ghost'"
          size="sm"
          class="gap-1.5 h-8 text-xs font-semibold px-2.5"
          [class.text-green-600]="btStatus() === 'connected'"
          [class.border-green-500]="btStatus() === 'connected'"
          [class.text-muted-foreground]="btStatus() === 'disconnected' || btStatus() === 'error'"
          [disabled]="btStatus() === 'connecting'"
          (click)="btStatus() === 'connected' ? desconectarBT.emit() : conectarBT.emit()"
          [title]="btStatus() === 'connected' ? ('Conectado: ' + (btDeviceName() ?? '')) : 'Conectar impresora Bluetooth'"
        >
          @switch (btStatus()) {
            @case ('connecting') {
              <ng-icon name="lucideLoader2" class="animate-spin" size="14"></ng-icon>
            }
            @case ('connected') {
              <ng-icon name="lucideBluetoothConnected" size="14"></ng-icon>
            }
            @case ('error') {
              <ng-icon name="lucideBluetoothOff" size="14" class="text-destructive"></ng-icon>
            }
            @default {
              <ng-icon name="lucideBluetooth" size="14"></ng-icon>
            }
          }
          <span class="hidden sm:inline">
            @switch (btStatus()) {
              @case ('connecting') { Conectando... }
              @case ('connected')  { {{ btDeviceName() ?? 'Impresora' }} }
              @case ('error')      { Error BT }
              @default             { Bluetooth }
            }
          </span>
        </button>

        <!-- Sincronizar todo -->
        @if (count() > 0) {
          <button hlmBtn size="sm" [disabled]="isSyncing()" (click)="sincronizarTodo.emit()" class="gap-1.5 h-8 text-xs font-semibold">
            @if (isSyncing()) {
              <ng-icon name="lucideLoader2" class="animate-spin" size="14"></ng-icon>
              <span>Sincronizando...</span>
            } @else {
              <ng-icon name="lucideRefreshCw" size="13"></ng-icon>
              <span>Sincronizar todo</span>
            }
          </button>
        }
      </div>

    </app-header>
  `
})
export class SincronizacionHeaderComponent {
  count          = input<number>(0);
  isSyncing      = input<boolean>(false);
  btStatus       = input<PrinterStatus>('disconnected');
  btDeviceName   = input<string | null>(null);

  sincronizarTodo = output<void>();
  conectarBT      = output<void>();
  desconectarBT   = output<void>();
}

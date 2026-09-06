import { Component, inject, signal } from '@angular/core';
import { lucideHome, lucideUsers, lucideContactRound, lucideListOrdered, lucideFileArchive, lucideFile, lucideCloudSync } from '@ng-icons/lucide';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { Conexion } from '../../services/conexion';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Auth } from '../../../auth/service/auth';
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, FormsModule, NgIcon, ...HlmButtonImports, ...HlmSwitchImports],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
  providers: [
    provideIcons({
      lucideHome,
      lucideUsers,
      lucideFile,
      lucideFileArchive,
      lucideContactRound,
      lucideCloudSync
    })
  ],
  host: {
    class: 'block fixed bottom-0 left-0 right-0 z-50',
  },
})
export class BottomNav {
  isOnline: boolean = true;
  private networkSub!: Subscription;

  private auth = inject(Auth);
  private conexionService = inject(Conexion);
  public estadoRed = signal(navigator.onLine ? 'Conectado' : 'Desconectado');

  protected readonly navItems = [
    { label: 'Perfil', route: '/profile', icon: 'lucideContactRound' },
    { label: 'Clientes', route: '/clientes', icon: 'lucideUsers' },
    { label: 'Sincronizar Doc.', route: '/sincronizar', icon: 'lucideCloudSync' },
    { label: 'Historial', route: '/historial', icon: 'lucideFile' },
  ];

  ngOnInit() {
    this.networkSub = this.conexionService.isOnline$.subscribe(status => {
      console.log('estado actual', status);
      this.isOnline = status;
    });
  }

  ngOnDestroy() {
    if (this.networkSub) {
      this.networkSub.unsubscribe();
    }
  }

  logout(): void {
    this.auth.logout();
  }

  onToggleChange(isOffline: boolean) {
    this.conexionService.setOnlineMode(!isOffline);
  }
}

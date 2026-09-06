import { Component, computed, inject, signal } from '@angular/core';
import { Auth } from '../../../auth/service/auth';
import { DocumentosDB } from '../../../articulos/services/documentos-db';
import { Documento } from '../../../articulos/interfaces/documento';
import { SincronizacionHeaderComponent } from '../../components/sincronizacion-header/sincronizacion-header.component';
import { SincronizacionSkeletonComponent } from '../../components/sincronizacion-skeleton/sincronizacion-skeleton.component';
import { SincronizacionEmptyStateComponent } from '../../components/sincronizacion-empty-state/sincronizacion-empty-state.component';
import { SincronizacionItemComponent } from '../../components/sincronizacion-item/sincronizacion-item.component';

@Component({
  selector: 'app-sincronizacion-documentos',
  standalone: true,
  imports: [
    SincronizacionHeaderComponent,
    SincronizacionSkeletonComponent,
    SincronizacionEmptyStateComponent,
    SincronizacionItemComponent
  ],
  templateUrl: './sincronizacion-documentos.html'
})
export class SincronizacionDocumentos {
  private authService = inject(Auth);
  private documentoDB = inject(DocumentosDB);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly items = signal<Documento[]>([]);
  protected readonly isEmpty = computed(() => this.items().length === 0);

  async ngOnInit(): Promise<void> {
    await this.cargarDocumentos();
  }

  private async cargarDocumentos(): Promise<void> {
    const agenteId = this.authService.currentAgente();
    if (!agenteId) {
      this.isLoading.set(false);
      return;
    }

    const items = await this.documentoDB.obtenerPorAgente(agenteId);
    this.items.set(items);
    this.isLoading.set(false);
  }

  async onDescartarItem(documentoId: string): Promise<void> {
    await this.documentoDB.eliminarDocumento(documentoId);
    await this.cargarDocumentos();
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { Auth } from '../../../auth/service/auth';
import { DocumentosDB } from '../../../articulos/services/documentos-db';
import { Documento } from '../../../articulos/interfaces/documento';
import { Documentos } from '../../../documentos/services/documentos';
import { ClientesDB } from '../../../clientes/services/clientes-db';
import { Clientes } from '../../../clientes/services/clientes';
import { PricingService } from '../../../shared/services/pricing.service';
import { Conexion } from '../../../shared/services/conexion';
import { GenerarDocumentoRequest } from '../../../documentos/interfaces/documento';
import { ConfiguracionService } from '../../../shared/services/configuracion.service';
import { BluetoothPrinterService } from '../../../shared/services/bluetooth-printer.service';
import { SincronizacionHeaderComponent } from '../../components/sincronizacion-header/sincronizacion-header.component';
import { SincronizacionSkeletonComponent } from '../../components/sincronizacion-skeleton/sincronizacion-skeleton.component';
import { SincronizacionEmptyStateComponent } from '../../components/sincronizacion-empty-state/sincronizacion-empty-state.component';
import { SincronizacionItemComponent } from '../../components/sincronizacion-item/sincronizacion-item.component';
import { firstValueFrom } from 'rxjs';

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
  private documentosService = inject(Documentos);
  private clientesDB = inject(ClientesDB);
  private clientesService = inject(Clientes);
  private pricingService = inject(PricingService);
  private conexionService = inject(Conexion);
  private configuracionService = inject(ConfiguracionService);
  readonly btPrinter = inject(BluetoothPrinterService);

  protected readonly isLoading = signal<boolean>(true);
  protected readonly isSyncingAll = signal<boolean>(false);
  protected readonly syncingDocId = signal<string | null>(null);

  protected readonly items = signal<Documento[]>([]);
  protected readonly isEmpty = computed(() => this.items().length === 0);

  async ngOnInit(): Promise<void> {
    await this.cargarDocumentos();
  }

  protected async cargarDocumentos(): Promise<void> {
    const agenteId = this.authService.currentAgente();
    if (!agenteId) {
      this.isLoading.set(false);
      return;
    }

    const items = await this.documentoDB.obtenerPorAgente(agenteId);
    this.items.set(items.filter(doc => doc.estatus !== 'sincronizado'));
    this.isLoading.set(false);
  }

  async onDescartarItem(documentoId: string): Promise<void> {
    await this.documentoDB.eliminarDocumento(documentoId);
    await this.cargarDocumentos();
  }

  async onSincronizarIndividual(doc: Documento): Promise<void> {
    if (!doc.id || this.syncingDocId() === doc.id) return;
    this.syncingDocId.set(doc.id);

    try {
      await this.sincronizarDocumento(doc);
    } finally {
      this.syncingDocId.set(null);
      await this.cargarDocumentos();
    }
  }

  async onSincronizarTodo(): Promise<void> {
    if (this.isSyncingAll() || this.items().length === 0) return;
    this.isSyncingAll.set(true);

    try {
      const docs = [...this.items()];
      for (const doc of docs) {
        if (doc.id) {
          this.syncingDocId.set(doc.id);
          await this.sincronizarDocumento(doc);
        }
      }
    } finally {
      this.syncingDocId.set(null);
      this.isSyncingAll.set(false);
      await this.cargarDocumentos();
    }
  }

  private async sincronizarDocumento(doc: Documento): Promise<boolean> {
    try {
      const agenteId = doc.agenteId || this.authService.currentAgente() || '';
      const almacen = this.authService.currentAlmacen() ?? '';

      // 1. Obtener cliente para descuentos
      let cliente = await this.clientesDB.getCliente(doc.clienteId);
      if (!cliente) {
        try {
          cliente = await firstValueFrom(this.clientesService.getCliente(doc.clienteId));
          if (cliente) {
            await this.clientesDB.guardarClientes([cliente]);
          }
        } catch (e) {
          console.warn('No se pudo obtener cliente por red al sincronizar:', e);
        }
      }

      const descsCliente = this.pricingService.getDescuentosCliente(cliente);

      // 2. Construir GenerarDocumentoRequest para Delphi
      const request: GenerarDocumentoRequest = {
        tipoDocumento: this.configuracionService.tipoDocumento(),
        cliProv: doc.clienteId,
        agente: agenteId,
        almacen: almacen,
        claveMoneda: '001',
        descuento1: descsCliente.d1,
        descuento2: descsCliente.d2,
        descuento3: descsCliente.d3,
        detalles: doc.items.map(item => ({
          articulo: item.articuloClave,
          descripcion: item.articuloDescripcion,
          cantidad: item.cantidad,
          precio: item.articuloPrecio,
          descuento1: item.descuento1 || 0,
          descuento2: item.descuento2 || 0,
          descuento3: item.descuento3 || 0
        }))
      };

      // 3. Enviar a la API
      const response = await firstValueFrom(this.documentosService.generarDocumento(request));
      if (response && response.success) {
        console.log('Documento sincronizado con éxito:', doc.folio, response);
        await this.documentoDB.eliminarDocumento(doc.id!);
        return true;
      } else {
        console.error('Error al sincronizar documento:', doc.folio, response?.mensaje);
        await this.documentoDB.marcarError(doc.id!);
        return false;
      }
    } catch (err) {
      console.error('Excepción al sincronizar documento:', doc.folio, err);
      if (doc.id) {
        await this.documentoDB.marcarError(doc.id);
      }
      return false;
    }
  }

  async onImprimirItem(doc: Documento): Promise<void> {
    // Si hay un device conocido pero está desconectado, reconectar sin diálogo
    if (!this.btPrinter.isConnected && this.btPrinter.device) {
      try {
        await this.btPrinter.reconnect();
      } catch {
        alert('No se pudo reconectar con la impresora. Verifica que esté encendida.');
        return;
      }
    }

    // Si aún no hay conexión (nunca se seleccionó impresora)
    if (!this.btPrinter.isConnected) {
      alert('Conecta primero la impresora usando el botón Bluetooth del encabezado.');
      return;
    }

    try {
      const empresa = this.authService.currentAgente() ?? 'Mi Empresa';
      await this.btPrinter.imprimirDocumento(doc, empresa);
    } catch (err) {
      console.error('[Impresión BT] Error:', err);
      alert('Error al imprimir. Verifica la conexión con la impresora.');
    }
  }
}

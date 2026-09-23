import { Injectable, signal } from '@angular/core';
import { Documento } from '../../articulos/interfaces/documento';

// ── Constantes ESC/POS ────────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;

// ── UUIDs de servicios conocidos en impresoras térmicas BLE chinas ────────────
// Declarar todos en optionalServices permite que el browser los exponga si existen.
const KNOWN_SERVICES: { service: string; char: string }[] = [
    // NE-512 / Xprinter / Gprinter más comunes
    { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
    // BLE Serial (otro firmware NE-512 y clones)
    { service: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', char: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f' },
    // Feasycom FSC-BT826 / RPP02N y similares
    { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
    // FF00 — muy común en marcas blancas chinas (ZJ-5805DD, etc.)
    { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff02-0000-1000-8000-00805f9b34fb' },
    // FEE7 - Común en varias marcas
    { service: '0000fee7-0000-1000-8000-00805f9b34fb', char: '0000fec9-0000-1000-8000-00805f9b34fb' },
    // FEE0
    { service: '0000fee0-0000-1000-8000-00805f9b34fb', char: '0000fee1-0000-1000-8000-00805f9b34fb' }
];

const ALL_SERVICE_UUIDS = KNOWN_SERVICES.map(s => s.service);

/** Tamaño máximo de cada chunk BLE (MTU conservador para impresoras baratas) */
const CHUNK_SIZE = 100;

// ── Helpers ESC/POS ───────────────────────────────────────────────────────────

function bytes(...args: number[]): Uint8Array {
    return new Uint8Array(args);
}

/** Codifica texto a bytes Latin-1 compatible con la mayoría de impresoras térmicas */
function encodeText(text: string): Uint8Array {
    const out: number[] = [];
    for (const ch of text) {
        const code = ch.charCodeAt(0);
        out.push(code < 256 ? code : 0x3f); // '?' para fuera de rango
    }
    return new Uint8Array(out);
}

function initPrinter():   Uint8Array { return bytes(ESC, 0x40); }
function alignCenter():   Uint8Array { return bytes(ESC, 0x61, 0x01); }
function alignLeft():     Uint8Array { return bytes(ESC, 0x61, 0x00); }
function alignRight():    Uint8Array { return bytes(ESC, 0x61, 0x02); }
function boldOn():        Uint8Array { return bytes(ESC, 0x45, 0x01); }
function boldOff():       Uint8Array { return bytes(ESC, 0x45, 0x00); }
function doubleSizeOn():  Uint8Array { return bytes(ESC, 0x21, 0x10); }
function doubleSizeOff(): Uint8Array { return bytes(ESC, 0x21, 0x00); }
function lineFeed(n = 1): Uint8Array { return bytes(ESC, 0x64, n); }
function cutPaper():      Uint8Array { return bytes(GS,  0x56, 0x42, 0x00); }

function separator(char = '-', len = 32): Uint8Array {
    return encodeText(char.repeat(len) + '\n');
}

function tableRow(left: string, right: string, totalWidth = 32): Uint8Array {
    const rightLen  = right.length;
    const leftMax   = totalWidth - rightLen - 1;
    const truncated = left.length > leftMax ? left.substring(0, leftMax) : left;
    const padding   = totalWidth - truncated.length - rightLen;
    const line      = truncated + ' '.repeat(Math.max(1, padding)) + right + '\n';
    return encodeText(line);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
    const total  = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(total);
    let offset   = 0;
    for (const arr of arrays) { result.set(arr, offset); offset += arr.length; }
    return result;
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function truncate(text: string, max: number): string {
    return text.length > max ? text.substring(0, max - 1) + '…' : text;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

@Injectable({ providedIn: 'root' })
export class BluetoothPrinterService {

    readonly status     = signal<PrinterStatus>('disconnected');
    readonly deviceName = signal<string | null>(null);

    private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
    device: BluetoothDevice | null = null;

    get isConnected(): boolean {
        return this.status() === 'connected' && this.characteristic !== null;
    }

    // ── Conexión ──────────────────────────────────────────────────────────────

    async connect(): Promise<void> {
        if (!('bluetooth' in navigator)) {
            alert('Tu navegador no soporta Web Bluetooth.\nUsa Chrome o Edge en Android/desktop.');
            return;
        }
        if (this.status() === 'connecting') return;

        this.status.set('connecting');
        try {
            // acceptAllDevices + optionalServices declarados = máxima compatibilidad.
            // El browser sólo permite acceder a servicios listados en optionalServices.
            this.device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ALL_SERVICE_UUIDS,
            });

            await this.conectarDispositivo(this.device!);

        } catch (err: any) {
            const userCancelled = err?.code === 8 || err?.name === 'NotFoundError';
            if (!userCancelled) {
                console.error('[BT Printer] Error al conectar:', err);
                // En Linux con impresoras dual-mode (Clásico + BLE), el sistema puede
                // rechazar la conexión BLE si el device ya está pareado como Clásico.
                // Solución: desempareja la impresora desde Bluetooth del sistema y
                // vuelve a intentar. En Android este problema no ocurre.
                this.status.set('error');
                alert(
                    'No se pudo conectar a la impresora.\n\n' +
                    'Si estás en Linux: desempareja la impresora desde la configuración ' +
                    'de Bluetooth del sistema y vuelve a intentarlo.\n\n' +
                    'En Android este problema no ocurre.'
                );
            } else {
                this.status.set('disconnected');
            }
            this.characteristic = null;
        }
    }

    /**
     * Conecta/reconecta al BluetoothDevice almacenado sin volver a mostrar el diálogo.
     * Lanza error si falla — el caller decide cómo manejarlo.
     */
    private async conectarDispositivo(device: BluetoothDevice): Promise<void> {
        device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        device.addEventListener('gattserverdisconnected', this.onDisconnected);

        const server = await device.gatt!.connect();
        this.characteristic = await this.resolveCharacteristic(server);

        this.deviceName.set(device.name ?? 'Impresora BT');
        this.status.set('connected');
        console.log('[BT Printer] Conectado a:', device.name);
    }

    /**
     * Reconecta al último dispositivo sin mostrar el diálogo al usuario.
     * LANZA el error para que el caller pueda reaccionar.
     */
    async reconnect(): Promise<void> {
        if (!this.device) throw new Error('Sin dispositivo previo');
        if (this.status() === 'connected') return;

        this.status.set('connecting');
        try {
            await this.conectarDispositivo(this.device);
        } catch (err) {
            console.error('[BT Printer] Error al reconectar:', err);
            this.status.set('error');
            this.characteristic = null;
            throw err; // ← Re-lanzar para que el caller lo maneje
        }
    }

    private readonly onDisconnected = () => {
        console.warn('[BT Printer] Desconectado (evento GATT)');
        this.status.set('disconnected');
        this.characteristic = null;
        // Conservar `device` y `deviceName` para poder reconectar sin diálogo
    };

    /**
     * Itera por TODOS los servicios conocidos del dispositivo hasta encontrar
     * una característica con permiso de escritura. Esto funciona con cualquier
     * firmware de NE-512 independientemente del UUID que use.
     */
    private async resolveCharacteristic(
        server: BluetoothRemoteGATTServer
    ): Promise<BluetoothRemoteGATTCharacteristic> {
        const errors: string[] = [];

        for (const { service, char } of KNOWN_SERVICES) {
            try {
                const svc      = await server.getPrimaryService(service);
                const charObj  = await svc.getCharacteristic(char);
                console.log(`[BT Printer] ✓ Servicio encontrado: ${service}`);
                return charObj;
            } catch (e: any) {
                const msg = `${service.substring(4, 8)}: ${e?.message ?? e}`;
                errors.push(msg);
                console.warn(`[BT Printer] Servicio ${service.substring(4, 8)} no disponible`);
            }
        }

        // Último recurso: intentar enumerar todos los servicios y buscar uno escribible
        try {
            const services = await server.getPrimaryServices();
            console.log('[BT Printer] Servicios disponibles:', services.map(s => s.uuid));
            for (const svc of services) {
                const chars = await svc.getCharacteristics();
                for (const c of chars) {
                    if (c.properties.write || c.properties.writeWithoutResponse) {
                        console.log(`[BT Printer] ✓ Característica escribible encontrada: svc=${svc.uuid} char=${c.uuid}`);
                        return c;
                    }
                }
            }
        } catch (e) {
            console.warn('[BT Printer] No se pudieron enumerar servicios:', e);
        }

        throw new Error(
            `No se encontró ningún servicio de impresión compatible.\n` +
            `Intentados: ${errors.join(', ')}\n` +
            `Asegúrate de que la impresora sea BLE (no Bluetooth Clásico).`
        );
    }

    async disconnect(): Promise<void> {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.status.set('disconnected');
        this.characteristic = null;
        this.deviceName.set(null);
    }

    // ── Impresión ─────────────────────────────────────────────────────────────

    async imprimirDocumento(doc: Documento, empresa: string = 'Mi Empresa'): Promise<void> {
        if (!this.characteristic) {
            throw new Error('Impresora no conectada');
        }
        const data = this.buildTicket(doc, empresa);
        await this.writeChunked(data);
    }

    private async writeChunked(data: Uint8Array): Promise<void> {
        const canWriteWithoutResponse = this.characteristic!.properties.writeWithoutResponse;
        for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
            const chunk = data.slice(offset, offset + CHUNK_SIZE);
            if (canWriteWithoutResponse) {
                await this.characteristic!.writeValueWithoutResponse(chunk);
            } else {
                await this.characteristic!.writeValue(chunk);
            }
            await delay(20);
        }
    }

    // ── Construcción del ticket ESC/POS ───────────────────────────────────────

    private buildTicket(doc: Documento, empresa: string): Uint8Array {
        const fecha = new Date(doc.fecha).toLocaleString('es-MX', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
        const tipoLabel = doc.tipoDocumento === 'P' ? 'PEDIDO' : 'REMISION';
        const parts: Uint8Array[] = [];

        parts.push(initPrinter());

        // Cabecera
        parts.push(alignCenter());
        parts.push(boldOn());
        parts.push(doubleSizeOn());
        parts.push(encodeText(empresa.toUpperCase() + '\n'));
        parts.push(doubleSizeOff());
        parts.push(boldOff());
        parts.push(encodeText(tipoLabel + '\n'));
        parts.push(separator('='));

        // Meta
        parts.push(alignLeft());
        parts.push(encodeText(`Folio  : ${doc.folio}\n`));
        parts.push(encodeText(`Cliente: ${doc.clienteId}\n`));
        parts.push(encodeText(`Agente : ${doc.agenteId}\n`));
        parts.push(encodeText(`Fecha  : ${fecha}\n`));
        parts.push(separator());

        // Artículos
        parts.push(boldOn());
        parts.push(tableRow('ARTICULO', 'TOTAL'));
        parts.push(boldOff());
        parts.push(separator());

        for (const item of doc.items) {
            parts.push(encodeText(truncate(item.articuloDescripcion, 32) + '\n'));
            const subtotal = `$${(item.cantidad * item.articuloPrecio).toFixed(2)}`;
            const detalle  = `${item.articuloClave} ${item.cantidad}x$${item.articuloPrecio.toFixed(2)}`;
            parts.push(tableRow(detalle, subtotal));
        }

        parts.push(separator());

        // Total
        parts.push(boldOn());
        parts.push(doubleSizeOn());
        parts.push(alignRight());
        parts.push(encodeText(`$${doc.total.toFixed(2)}\n`));
        parts.push(doubleSizeOff());
        parts.push(boldOff());

        // Pie
        parts.push(alignCenter());
        parts.push(separator());
        parts.push(encodeText(`${doc.items.length} art(s) | Doc. offline\n`));
        parts.push(encodeText('Gracias por su preferencia\n'));

        // Avanzar y cortar
        parts.push(lineFeed(4));
        parts.push(cutPaper());

        return concat(...parts);
    }
}

import { Injectable } from '@angular/core';
import { Documento } from '../../articulos/interfaces/documento';

@Injectable({ providedIn: 'root' })
export class TicketPrintService {

    /**
     * Imprime un documento guardado localmente usando un iframe oculto.
     * Compatible con impresoras térmicas de 58mm/80mm (NE-512, ESC/POS).
     */
    imprimir(doc: Documento, nombreEmpresa: string = 'Mi Empresa'): void {
        const html = this.generarHTML(doc, nombreEmpresa);

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';

        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } finally {
                // Remover iframe después de un pequeño delay para que el diálogo de impresión aparezca
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }
        };
    }

    private generarHTML(doc: Documento, empresa: string): string {
        const fecha = new Date(doc.fecha).toLocaleString('es-MX', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
        const tipoLabel = doc.tipoDocumento === 'P' ? 'PEDIDO' : 'REMISIÓN';

        const itemsHTML = doc.items.map(item => {
            const subtotal = (item.cantidad * item.articuloPrecio).toFixed(2);
            return `
            <tr>
                <td colspan="3" class="desc">${item.articuloDescripcion}</td>
            </tr>
            <tr>
                <td class="clave">${item.articuloClave}</td>
                <td class="qty">${item.cantidad} x $${item.articuloPrecio.toFixed(2)}</td>
                <td class="sub">$${subtotal}</td>
            </tr>`;
        }).join('');

        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket ${doc.folio}</title>
<style>
    /* ── Reset ── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Papel: 58mm de ancho (aprox. 216px a 96dpi) ── */
    body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 9pt;
        width: 58mm;
        margin: 0 auto;
        color: #000;
        background: #fff;
    }

    /* ── Cabecera ── */
    .header {
        text-align: center;
        border-bottom: 1px dashed #000;
        padding-bottom: 4px;
        margin-bottom: 4px;
    }
    .header .empresa {
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
    }
    .header .tipo {
        font-size: 10pt;
        font-weight: bold;
        letter-spacing: 2px;
    }

    /* ── Meta (folio, cliente, fecha) ── */
    .meta {
        font-size: 8pt;
        margin-bottom: 4px;
        border-bottom: 1px dashed #000;
        padding-bottom: 4px;
    }
    .meta p { margin: 1px 0; }
    .meta .label { font-weight: bold; }

    /* ── Tabla de artículos ── */
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8pt;
        margin-bottom: 4px;
    }
    th {
        border-bottom: 1px solid #000;
        border-top: 1px solid #000;
        padding: 1px 0;
        font-size: 7.5pt;
    }
    th.col-desc  { text-align: left; width: 50%; }
    th.col-qty   { text-align: center; width: 30%; }
    th.col-sub   { text-align: right; width: 20%; }

    td.desc  { text-align: left; font-weight: bold; padding-top: 3px; }
    td.clave { text-align: left; color: #444; font-size: 7pt; padding-bottom: 2px; }
    td.qty   { text-align: center; }
    td.sub   { text-align: right; font-weight: bold; }

    /* ── Total ── */
    .total-section {
        border-top: 1px dashed #000;
        padding-top: 4px;
        text-align: right;
        font-size: 10pt;
        font-weight: bold;
        margin-bottom: 4px;
    }

    /* ── Pie ── */
    .footer {
        text-align: center;
        font-size: 7.5pt;
        color: #444;
        border-top: 1px dashed #000;
        padding-top: 4px;
        margin-top: 2px;
    }

    /* ── Print: ocultar todo excepto el ticket ── */
    @media print {
        @page {
            margin: 0;
            size: 58mm auto;
        }
        body {
            width: 58mm;
        }
    }
</style>
</head>
<body>
    <div class="header">
        <p class="empresa">${empresa}</p>
        <p class="tipo">${tipoLabel}</p>
    </div>

    <div class="meta">
        <p><span class="label">Folio:</span> ${doc.folio}</p>
        <p><span class="label">Cliente:</span> ${doc.clienteId}</p>
        <p><span class="label">Agente:</span> ${doc.agenteId}</p>
        <p><span class="label">Fecha:</span> ${fecha}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th class="col-desc" colspan="2">Artículo / Clave</th>
                <th class="col-sub">Total</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHTML}
        </tbody>
    </table>

    <div class="total-section">
        TOTAL: $${doc.total.toFixed(2)}
    </div>

    <div class="footer">
        <p>${doc.items.length} artículo${doc.items.length !== 1 ? 's' : ''}</p>
        <p>*** Documento generado offline ***</p>
        <p>Gracias por su compra</p>
    </div>
</body>
</html>`;
    }
}

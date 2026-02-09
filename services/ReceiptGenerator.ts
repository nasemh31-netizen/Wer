
import { Invoice, InvoiceItem, Organization, Partner } from '../types';

export const ReceiptGenerator = {
  generateHTML(invoice: Invoice, items: InvoiceItem[], org?: Organization, customer?: Partner): string {
    const date = new Date(invoice.date).toLocaleString('fr-MA'); // Use Moroccan Locale
    
    // Simulate a QR Code Content
    const qrData = `Seller: ${org?.name || 'Supermarché'}\nICE: 000123456\nTotal: ${invoice.grand_total} MAD\nTax: ${invoice.tax_total}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;

    const itemsHtml = items.map(item => `
      <div class="item">
        <div class="row">
          <span class="name">${item.product_name}</span>
        </div>
        <div class="row details">
          <span>${item.qty} x ${item.price.toFixed(2)}</span>
          <span class="total">${item.total.toFixed(2)}</span>
        </div>
        ${item.discount > 0 ? `<div class="row discount">Remise: -${item.discount.toFixed(2)}</div>` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="fr" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body { font-family: 'Cairo', sans-serif; width: 80mm; margin: 0; padding: 10px; font-size: 13px; color: #000; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .title { font-size: 20px; font-weight: bold; margin: 5px 0; }
          .info { font-size: 11px; margin-bottom: 3px; }
          .items { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .item { margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; }
          .details { color: #444; font-size: 12px; margin-top: 2px; }
          .discount { font-style: italic; font-size: 10px; color: #666; }
          .totals { text-align: right; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 10px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 5px; }
          .qr-container { text-align: center; margin: 15px 0; }
          .footer { text-align: center; font-size: 11px; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${org?.name || 'Supermarché'}</div>
          <div class="info">ICE: ${org?.tax_number || '000000000'}</div>
          <div class="info">Facture N°: ${invoice.invoice_number}</div>
          <div class="info">Date: ${date}</div>
          ${customer ? `<div class="info">Client: ${customer.name}</div>` : ''}
          <div class="info"><strong>${invoice.type === 'SALE_RETURN' ? 'AVOIR (RETOUR)' : 'TICKET DE CAISSE'}</strong></div>
        </div>
        
        <div class="items">
          <div class="row" style="font-weight: bold; border-bottom: 1px solid #eee; margin-bottom: 5px; padding-bottom: 2px;">
             <span>Article</span>
             <span>Total</span>
          </div>
          ${itemsHtml}
        </div>

        <div class="totals">
          <div class="row"><span>Total HT:</span> <span>${invoice.subtotal.toFixed(2)}</span></div>
          ${invoice.discount_total > 0 ? `<div class="row"><span>Remise:</span> <span>${invoice.discount_total.toFixed(2)}</span></div>` : ''}
          <div class="row"><span>TVA (20%):</span> <span>${invoice.tax_total.toFixed(2)}</span></div>
          <div class="total-row">
            <span>Total TTC:</span>
            <span>${invoice.grand_total.toFixed(2)} DH</span>
          </div>
        </div>

        <div class="qr-container">
           <img src="${qrUrl}" alt="QR Code" width="120" height="120" />
           <div style="font-size: 9px; color: #888; margin-top: 5px;">Merci de votre visite</div>
        </div>

        <div class="footer">
          MERCI DE VOTRE VISITE<br/>
          À BIENTÔT
        </div>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
  },

  print(invoice: Invoice, items: InvoiceItem[], org?: Organization, customer?: Partner) {
    const html = this.generateHTML(invoice, items, org, customer);
    const popup = window.open('', '_blank', 'width=450,height=700');
    if (popup) {
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
    }
  }
};

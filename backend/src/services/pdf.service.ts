import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class PdfService {
  static async generatePO(poData: any, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // Header
      doc.fontSize(20).text('PURCHASE ORDER', { align: 'right' });
      doc.fontSize(10).text('VendorBridge ERP Ltd', 50, 50);
      doc.text('123 Enterprise Way, Tech City, IN 560001');
      doc.text('support@vendorbridge.com');
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Info Table
      const yPos = doc.y;
      doc.text(`PO Number: ${poData.poNumber}`, 50, yPos);
      doc.text(`Order Date: ${new Date(poData.orderDate).toLocaleDateString()}`, 50, yPos + 15);
      doc.text(`Status: ${poData.status}`, 50, yPos + 30);

      doc.text('Vendor:', 300, yPos);
      doc.text(poData.vendor.companyName, 300, yPos + 15);
      doc.text(poData.vendor.address, 300, yPos + 30);
      doc.text(`${poData.vendor.city}, ${poData.vendor.country}`, 300, yPos + 45);

      doc.moveDown(4);
      doc.fontSize(12).text('Line Items', 50, doc.y, { underline: true });
      doc.moveDown();

      // Draw table header
      let itemY = doc.y;
      doc.fontSize(10);
      doc.text('Item Description', 50, itemY);
      doc.text('Qty', 300, itemY, { align: 'right' });
      doc.text('Unit Price', 380, itemY, { align: 'right' });
      doc.text('Total', 480, itemY, { align: 'right' });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      poData.items.forEach((item: any) => {
        itemY = doc.y;
        doc.text(item.itemName, 50, itemY);
        doc.text(item.quantity.toString(), 300, itemY, { align: 'right' });
        doc.text(`$${item.unitPrice.toFixed(2)}`, 380, itemY, { align: 'right' });
        doc.text(`$${item.totalPrice.toFixed(2)}`, 480, itemY, { align: 'right' });
        doc.moveDown();
      });

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Totals
      const totalY = doc.y;
      doc.text('Subtotal:', 350, totalY, { align: 'right' });
      doc.text(`$${poData.subtotal.toFixed(2)}`, 480, totalY, { align: 'right' });

      doc.text('Tax (GST 18%):', 350, totalY + 15, { align: 'right' });
      doc.text(`$${poData.taxAmount.toFixed(2)}`, 480, totalY + 15, { align: 'right' });

      doc.font('Helvetica-Bold');
      doc.text('Grand Total:', 350, totalY + 30, { align: 'right' });
      doc.text(`$${poData.grandTotal.toFixed(2)}`, 480, totalY + 30, { align: 'right' });
      doc.font('Helvetica');

      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
    });
  }

  static async generateInvoice(invoiceData: any, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);

      doc.pipe(writeStream);

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'right' });
      doc.fontSize(10).text(invoiceData.vendor.companyName, 50, 50);
      doc.text(invoiceData.vendor.address);
      doc.text(`GST: ${invoiceData.vendor.gstNumber}`);
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Info Table
      const yPos = doc.y;
      doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 50, yPos);
      doc.text(`PO Reference: ${invoiceData.purchaseOrder.poNumber}`, 50, yPos + 15);
      doc.text(`Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}`, 50, yPos + 30);
      doc.text(`Status: ${invoiceData.status}`, 50, yPos + 45);

      doc.text('Bill To:', 300, yPos);
      doc.text('VendorBridge ERP Ltd', 300, yPos + 15);
      doc.text('123 Enterprise Way, Tech City, IN 560001');

      doc.moveDown(4);
      doc.fontSize(12).text('Billing Details', 50, doc.y, { underline: true });
      doc.moveDown();

      // Draw table header
      let itemY = doc.y;
      doc.fontSize(10);
      doc.text('Subtotal', 50, itemY);
      doc.text('Tax Amount (GST)', 200, itemY);
      doc.text('Grand Total', 350, itemY);
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      itemY = doc.y;
      doc.text(`$${invoiceData.subtotal.toFixed(2)}`, 50, itemY);
      doc.text(`$${invoiceData.taxAmount.toFixed(2)}`, 200, itemY);
      doc.font('Helvetica-Bold');
      doc.text(`$${invoiceData.grandTotal.toFixed(2)}`, 350, itemY);
      doc.font('Helvetica');

      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
    });
  }
}

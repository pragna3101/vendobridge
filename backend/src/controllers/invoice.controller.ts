import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { InvoiceStatus } from '../types/enums';
import { AppError } from '../middleware/error.middleware';
import { PdfService } from '../services/pdf.service';
import { emailService } from '../services/email.service';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const getInvoices = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { status, vendorId } = req.query;

    const where: any = {
      deletedAt: null,
    };

    if (status) {
      where.status = status as InvoiceStatus;
    }

    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      });
      if (!vendor) return next(new AppError('Vendor profile not found', 404));
      where.vendorId = vendor.id;
    } else if (vendorId) {
      where.vendorId = Number(vendorId);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        vendor: true,
        purchaseOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { invoices },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseOrder: true,
      }
    });

    if (!invoice || invoice.deletedAt) {
      return next(new AppError('Invoice not found', 404));
    }

    // Access check for vendor
    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      });
      if (!vendor || invoice.vendorId !== vendor.id) {
        return next(new AppError('Unauthorized access to Invoice', 403));
      }
    }

    res.status(200).json({
      status: 'success',
      data: { invoice },
    });
  } catch (error) {
    next(error);
  }
};

export const generateInvoice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { poId } = req.body;

    if (!poId) {
      return next(new AppError('poId is required', 400));
    }

    // Verify PO exists and belongs to this vendor if they are a vendor
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: Number(poId) },
      include: { vendor: true }
    });

    if (!purchaseOrder || purchaseOrder.deletedAt) {
      return next(new AppError('Purchase Order not found', 404));
    }

    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      });
      if (!vendor || purchaseOrder.vendorId !== vendor.id) {
        return next(new AppError('Unauthorized: PO belongs to another vendor', 403));
      }
    }

    // Check if invoice already exists for this PO
    const existingInvoice = await prisma.invoice.findFirst({
      where: { poId: purchaseOrder.id, deletedAt: null }
    });

    if (existingInvoice) {
      return next(new AppError('An invoice has already been generated for this Purchase Order', 400));
    }

    // Generate unique Invoice number
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        poId: purchaseOrder.id,
        vendorId: purchaseOrder.vendorId,
        subtotal: purchaseOrder.subtotal,
        taxAmount: purchaseOrder.taxAmount,
        grandTotal: purchaseOrder.grandTotal,
        status: 'DRAFT',
      },
      include: {
        vendor: true,
        purchaseOrder: true,
      }
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'GENERATE_INVOICE',
        module: 'INVOICE',
        description: `Invoice ${invoice.invoiceNumber} created for PO ${purchaseOrder.poNumber}`,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { invoice },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // SENT, PAID, CANCELLED

    if (!['DRAFT', 'SENT', 'PAID', 'CANCELLED'].includes(status)) {
      return next(new AppError('Invalid invoice status', 400));
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { vendor: true, purchaseOrder: true }
    });

    if (!invoice || invoice.deletedAt) {
      return next(new AppError('Invoice not found', 404));
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: status as InvoiceStatus }
    });

    // Notify Procurement Officers on Paid Invoice
    if (status === 'PAID') {
      const officers = await prisma.user.findMany({
        where: { role: 'PROCUREMENT_OFFICER', status: 'ACTIVE' }
      });

      for (const officer of officers) {
        await prisma.notification.create({
          data: {
            userId: officer.id,
            title: 'Invoice Paid',
            message: `Invoice ${invoice.invoiceNumber} from vendor ${invoice.vendor.companyName} has been marked as PAID`,
            type: 'SUCCESS',
          }
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { invoice: updatedInvoice },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseOrder: true,
      }
    });

    if (!invoice || invoice.deletedAt) {
      return next(new AppError('Invoice not found', 404));
    }

    const fileName = `INV_${invoice.invoiceNumber}.pdf`;
    const uploadsDir = path.join(__dirname, '../../uploads/documents');
    const filePath = path.join(uploadsDir, fileName);

    await PdfService.generateInvoice(invoice, filePath);

    // Save pdfUrl in DB if not already saved
    const dbUrl = `/uploads/documents/${fileName}`;
    if (invoice.pdfUrl !== dbUrl) {
      await prisma.invoice.update({
        where: { id },
        data: { pdfUrl: dbUrl }
      });
    }

    res.download(filePath, fileName);
  } catch (error) {
    next(error);
  }
};

export const sendInvoiceEmail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { vendor: true, purchaseOrder: true }
    });

    if (!invoice || invoice.deletedAt) {
      return next(new AppError('Invoice not found', 404));
    }

    const emailContent = `
      <h3>Invoice #${invoice.invoiceNumber} Generated</h3>
      <p>Hello,</p>
      <p>An invoice has been generated for your Purchase Order reference: ${invoice.purchaseOrder.poNumber}.</p>
      <p><strong>Grand Total:</strong> $${invoice.grandTotal.toFixed(2)}</p>
      <p>You can download the invoice PDF from the ERP dashboard.</p>
      <p>Regards,<br/>VendorBridge Procurement ERP</p>
    `;

    await emailService.sendEmail(invoice.vendor.email, `Invoice #${invoice.invoiceNumber} Issued`, emailContent);

    await prisma.invoice.update({
      where: { id },
      data: { emailSent: true }
    });

    res.status(200).json({
      status: 'success',
      message: 'Invoice emailed to vendor successfully',
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { POStatus } from '../types/enums';
import { AppError } from '../middleware/error.middleware';
import { PdfService } from '../services/pdf.service';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const getPurchaseOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { status, vendorId } = req.query;

    const where: any = {
      deletedAt: null,
    };

    if (status) {
      where.status = status as POStatus;
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

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: true,
        quotation: {
          include: { rfq: true }
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { purchaseOrders },
    });
  } catch (error) {
    next(error);
  }
};

export const getPOById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: true,
        quotation: {
          include: { rfq: true }
        }
      }
    });

    if (!purchaseOrder || purchaseOrder.deletedAt) {
      return next(new AppError('Purchase Order not found', 404));
    }

    // Access check for vendor
    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      });
      if (!vendor || purchaseOrder.vendorId !== vendor.id) {
        return next(new AppError('Unauthorized access to Purchase Order', 403));
      }
    }

    res.status(200).json({
      status: 'success',
      data: { purchaseOrder },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePOStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // SENT, ACCEPTED, COMPLETED

    if (!['GENERATED', 'SENT', 'ACCEPTED', 'COMPLETED'].includes(status)) {
      return next(new AppError('Invalid PO status', 400));
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { vendor: true }
    });

    if (!purchaseOrder || purchaseOrder.deletedAt) {
      return next(new AppError('Purchase Order not found', 404));
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as POStatus }
    });

    // Notify Procurement Officers on Vendor Accept
    if (status === 'ACCEPTED' && req.user.role === 'VENDOR') {
      const officers = await prisma.user.findMany({
        where: { role: 'PROCUREMENT_OFFICER', status: 'ACTIVE' }
      });

      for (const officer of officers) {
        await prisma.notification.create({
          data: {
            userId: officer.id,
            title: 'PO Accepted by Vendor',
            message: `Vendor ${purchaseOrder.vendor.companyName} accepted Purchase Order ${purchaseOrder.poNumber}`,
            type: 'SUCCESS',
          }
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: { purchaseOrder: updatedPO },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadPO = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: true,
      }
    });

    if (!purchaseOrder || purchaseOrder.deletedAt) {
      return next(new AppError('Purchase Order not found', 404));
    }

    const fileName = `PO_${purchaseOrder.poNumber}.pdf`;
    const uploadsDir = path.join(__dirname, '../../uploads/documents');
    const filePath = path.join(uploadsDir, fileName);

    await PdfService.generatePO(purchaseOrder, filePath);

    // Save pdfUrl in DB if not already saved
    const dbUrl = `/uploads/documents/${fileName}`;
    if (purchaseOrder.pdfUrl !== dbUrl) {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { pdfUrl: dbUrl }
      });
    }

    res.download(filePath, fileName);
  } catch (error) {
    next(error);
  }
};

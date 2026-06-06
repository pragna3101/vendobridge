import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { QuotationStatus } from '../types/enums';
import { AppError } from '../middleware/error.middleware';
import { quotationSchema } from '../utils/validators';

const prisma = new PrismaClient();

export const getQuotations = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { rfqId, vendorId, status } = req.query;

    const where: any = {
      deletedAt: null,
    };

    if (rfqId) where.rfqId = Number(rfqId);
    if (status) where.status = status as QuotationStatus;

    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      });
      if (!vendor) return next(new AppError('Vendor profile not found', 404));
      where.vendorId = vendor.id;
    } else if (vendorId) {
      where.vendorId = Number(vendorId);
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        rfq: true,
        vendor: {
          include: { category: true }
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { quotations },
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        rfq: {
          include: { items: true }
        },
        vendor: true,
        items: true,
      },
    });

    if (!quotation || quotation.deletedAt) {
      return next(new AppError('Quotation not found', 404));
    }

    // Access check for vendor
    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      });
      if (!vendor || quotation.vendorId !== vendor.id) {
        return next(new AppError('Unauthorized access to quotation', 403));
      }
    }

    res.status(200).json({
      status: 'success',
      data: { quotation },
    });
  } catch (error) {
    next(error);
  }
};

export const submitQuotation = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.user.role !== 'VENDOR') {
      return next(new AppError('Forbidden: Only vendors can submit quotations', 403));
    }

    const parsed = quotationSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError('Validation Error', 400, parsed.error.flatten().fieldErrors));
    }

    const { rfqId, deliveryTimeline, taxRate, notes, items } = parsed.data;

    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id }
    });
    if (!vendor) {
      return next(new AppError('Vendor profile not found', 404));
    }

    // Verify RFQ is open
    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq || rfq.status !== 'OPEN' || rfq.deletedAt) {
      return next(new AppError('RFQ is not open for bidding', 400));
    }

    // Verify invitation
    const invite = await prisma.vendorInvitation.findUnique({
      where: { rfqId_vendorId: { rfqId, vendorId: vendor.id } }
    });
    if (!invite) {
      return next(new AppError('You are not invited to submit a quotation for this RFQ', 403));
    }

    // Check if vendor already submitted a quotation
    const existingQuotation = await prisma.quotation.findFirst({
      where: { rfqId, vendorId: vendor.id, deletedAt: null }
    });

    if (existingQuotation) {
      return next(new AppError('Quotation already submitted. Please edit existing quotation instead.', 400));
    }

    // Calculate prices
    let subtotal = 0;
    const itemsData = items.map(item => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    // Generate unique Quotation number
    const count = await prisma.quotation.count();
    const quotationNumber = `QTN-2026-${String(count + 1).padStart(4, '0')}`;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        rfqId,
        vendorId: vendor.id,
        deliveryTimeline,
        taxRate,
        taxAmount,
        subtotal,
        grandTotal,
        notes,
        status: 'SUBMITTED',
        items: {
          create: itemsData,
        }
      },
      include: { items: true }
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'SUBMIT_QUOTATION',
        module: 'QUOTATION',
        description: `Quotation ${quotation.quotationNumber} submitted for RFQ ${rfq.rfqNumber}`,
        ipAddress: req.ip,
      },
    });

    // Notify procurement officers
    const officers = await prisma.user.findMany({
      where: { role: 'PROCUREMENT_OFFICER', status: 'ACTIVE' }
    });

    for (const officer of officers) {
      await prisma.notification.create({
        data: {
          userId: officer.id,
          title: 'Quotation Submitted',
          message: `Vendor ${vendor.companyName} submitted quotation ${quotation.quotationNumber} for RFQ ${rfq.rfqNumber}`,
          type: 'SUCCESS',
        }
      });
    }

    res.status(201).json({
      status: 'success',
      data: { quotation },
    });
  } catch (error) {
    next(error);
  }
};

export const getComparisonByRFQId = async (req: any, res: Response, next: NextFunction) => {
  try {
    const rfqId = Number(req.params.rfqId);

    const rfq = await prisma.rfq.findUnique({
      where: { id: rfqId },
      include: { items: true }
    });

    if (!rfq || rfq.deletedAt) {
      return next(new AppError('RFQ not found', 404));
    }

    const quotations = await prisma.quotation.findMany({
      where: { rfqId, status: 'SUBMITTED', deletedAt: null },
      include: {
        vendor: true,
        items: true,
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        rfq,
        quotations,
      }
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApprovalStatus, POStatus } from '../types/enums';
import { AppError } from '../middleware/error.middleware';
import { approvalSchema } from '../utils/validators';

const prisma = new PrismaClient();

export const createApprovalRequest = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { rfqId, quotationId } = req.body;

    if (!rfqId || !quotationId) {
      return next(new AppError('rfqId and quotationId are required', 400));
    }

    // Verify RFQ
    const rfq = await prisma.rfq.findUnique({ where: { id: rfqId } });
    if (!rfq) return next(new AppError('RFQ not found', 404));

    // Verify Quotation
    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quotation) return next(new AppError('Quotation not found', 404));

    // Find any manager to assign (we can notify all managers)
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER', status: 'ACTIVE' }
    });

    if (managers.length === 0) {
      return next(new AppError('No active Managers found to approve this request', 400));
    }

    // Create Approval record
    const approval = await prisma.approval.create({
      data: {
        rfqId,
        quotationId,
        managerId: managers[0].id, // Assign to first manager in our mock/setup
        status: 'PENDING',
      }
    });

    // Update RFQ status to CLOSED (meaning no new quotes, pending award)
    await prisma.rfq.update({
      where: { id: rfqId },
      data: { status: 'CLOSED' }
    });

    // Notify Managers
    for (const manager of managers) {
      await prisma.notification.create({
        data: {
          userId: manager.id,
          title: 'New Approval Request',
          message: `Procurement Officer ${req.user.email} requested approval for RFQ ${rfq.rfqNumber} and Quotation ${quotation.quotationNumber}`,
          type: 'WARNING',
        }
      });
    }

    res.status(201).json({
      status: 'success',
      data: { approval },
    });
  } catch (error) {
    next(error);
  }
};

export const getApprovalQueue = async (req: any, res: Response, next: NextFunction) => {
  try {
    const where: any = {};
    if (req.user.role === 'MANAGER') {
      where.managerId = req.user.id;
    }

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        rfq: {
          include: { createdBy: true }
        },
        quotation: {
          include: { vendor: true, items: true }
        },
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { approvals },
    });
  } catch (error) {
    next(error);
  }
};

export const reviewApproval = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const parsed = approvalSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError('Validation Error', 400, parsed.error.flatten().fieldErrors));
    }

    const { status, remarks } = parsed.data;

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: { rfq: true, quotation: { include: { vendor: true, items: true } } }
    });

    if (!approval) {
      return next(new AppError('Approval request not found', 404));
    }

    if (approval.status !== 'PENDING') {
      return next(new AppError('Approval request has already been reviewed', 400));
    }

    // Update approval details
    const updatedApproval = await prisma.approval.update({
      where: { id },
      data: {
        status: status as ApprovalStatus,
        remarks,
      }
    });

    if (status === 'APPROVED') {
      // 1. Accept this quotation, reject other quotations for this RFQ
      await prisma.quotation.update({
        where: { id: approval.quotationId },
        data: { status: 'ACCEPTED' }
      });

      await prisma.quotation.updateMany({
        where: {
          rfqId: approval.rfqId,
          id: { not: approval.quotationId }
        },
        data: { status: 'REJECTED' }
      });

      // 2. Award the RFQ
      await prisma.rfq.update({
        where: { id: approval.rfqId },
        data: { status: 'AWARDED' }
      });

      // 3. Automatically generate Purchase Order
      const poCount = await prisma.purchaseOrder.count();
      const poNumber = `PO-2026-${String(poCount + 1).padStart(4, '0')}`;

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          quotationId: approval.quotationId,
          vendorId: approval.quotation.vendorId,
          subtotal: approval.quotation.subtotal,
          taxAmount: approval.quotation.taxAmount,
          grandTotal: approval.quotation.grandTotal,
          status: 'GENERATED',
          items: {
            create: approval.quotation.items.map(item => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: approval.quotation.taxRate,
              totalPrice: item.totalPrice,
            }))
          }
        }
      });

      // 4. Log and notify
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'APPROVE_QUOTATION',
          module: 'APPROVAL',
          description: `Quotation ${approval.quotation.quotationNumber} approved. PO ${poNumber} generated.`,
          ipAddress: req.ip,
        }
      });

      // Notify Vendor
      if (approval.quotation.vendor.userId) {
        await prisma.notification.create({
          data: {
            userId: approval.quotation.vendor.userId,
            title: 'Quotation Accepted & PO Issued',
            message: `Congratulations, your bid for RFQ ${approval.rfq.rfqNumber} has been accepted. Purchase Order ${poNumber} has been generated.`,
            type: 'SUCCESS',
          }
        });
      }
    } else {
      // REJECTED
      await prisma.quotation.update({
        where: { id: approval.quotationId },
        data: { status: 'REJECTED' }
      });

      // Reopen RFQ so vendor bids can still be compared or submitted
      await prisma.rfq.update({
        where: { id: approval.rfqId },
        data: { status: 'OPEN' }
      });

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'REJECT_QUOTATION',
          module: 'APPROVAL',
          description: `Quotation ${approval.quotation.quotationNumber} was rejected. Remarks: ${remarks}`,
          ipAddress: req.ip,
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: { approval: updatedApproval },
    });
  } catch (error) {
    next(error);
  }
};

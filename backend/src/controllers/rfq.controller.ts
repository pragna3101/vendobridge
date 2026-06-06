import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { RFQStatus } from '../types/enums';
import { AppError } from '../middleware/error.middleware';
import { rfqSchema } from '../utils/validators';
import { emailService } from '../services/email.service';

const prisma = new PrismaClient();

export const getRFQs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { rfqNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as RFQStatus;
    }

    // Vendor context filtering: Vendors can only view RFQs they are invited to.
    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id },
      });
      if (!vendor) {
        return next(new AppError('Vendor profile not found for user', 404));
      }

      where.invitations = {
        some: { vendorId: vendor.id },
      };
      // For Vendors, let's only return OPEN, CLOSED, or AWARDED RFQs (no drafts)
      where.status = {
        in: ['OPEN', 'CLOSED', 'AWARDED'],
      };
    }

    const [rfqs, total] = await prisma.$transaction([
      prisma.rfq.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          items: true,
          invitations: {
            include: {
              vendor: true,
            }
          },
          _count: {
            select: { quotations: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.rfq.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        rfqs,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRFQById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    // Vendor access validation
    let vendorId: number | null = null;
    if (req.user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user.id }
      });
      if (!vendor) return next(new AppError('Vendor profile not found', 404));
      vendorId = vendor.id;

      // Verify invitation
      const invite = await prisma.vendorInvitation.findUnique({
        where: { rfqId_vendorId: { rfqId: id, vendorId } }
      });
      if (!invite) return next(new AppError('Unauthorized: You are not invited to this RFQ', 403));
    }

    const rfq = await prisma.rfq.findUnique({
      where: { id },
      include: {
        items: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        invitations: {
          include: { vendor: true }
        },
        quotations: {
          where: req.user.role === 'VENDOR' ? { vendorId: vendorId || 0 } : undefined,
          include: { vendor: true, items: true }
        }
      }
    });

    if (!rfq || rfq.deletedAt) {
      return next(new AppError('RFQ not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { rfq },
    });
  } catch (error) {
    next(error);
  }
};

export const createRFQ = async (req: any, res: Response, next: NextFunction) => {
  try {
    const parsed = rfqSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError('Validation Error', 400, parsed.error.flatten().fieldErrors));
    }

    const { title, description, categoryId, deadline, budget, items, vendorIds } = parsed.data;

    // Generate unique RFQ number
    const count = await prisma.rfq.count();
    const rfqNumber = `RFQ-2026-${String(count + 1).padStart(4, '0')}`;

    const rfq = await prisma.rfq.create({
      data: {
        rfqNumber,
        title,
        description,
        categoryId,
        deadline,
        budget,
        status: 'OPEN', // Automatically publish as OPEN
        createdById: req.user.id,
        items: {
          create: items.map(item => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
          }))
        },
        invitations: {
          create: vendorIds.map(vendorId => ({
            vendorId,
            status: 'PENDING',
          }))
        }
      },
      include: {
        items: true,
        invitations: {
          include: { vendor: true }
        }
      }
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_RFQ',
        module: 'RFQ',
        description: `RFQ ${rfq.rfqNumber} created with ${items.length} items`,
        ipAddress: req.ip,
      },
    });

    // Send email notifications to invited vendors
    for (const invite of rfq.invitations) {
      const vendorEmail = invite.vendor.email;
      const emailContent = `
        <h3>New RFQ Invitation: ${rfq.title}</h3>
        <p>Hello ${invite.vendor.contactPerson},</p>
        <p>You have been invited to submit a quotation for the following RFQ:</p>
        <ul>
          <li><strong>RFQ Number:</strong> ${rfq.rfqNumber}</li>
          <li><strong>Deadline:</strong> ${new Date(rfq.deadline).toLocaleDateString()}</li>
          <li><strong>Description:</strong> ${rfq.description}</li>
        </ul>
        <p>Please log into your VendorBridge dashboard to submit your quotation before the deadline.</p>
        <p>Regards,<br/>VendorBridge Procurement Team</p>
      `;

      await emailService.sendEmail(vendorEmail, `Invitation to Bid: ${rfq.rfqNumber}`, emailContent);

      // Create app notification for vendor
      if (invite.vendor.userId) {
        await prisma.notification.create({
          data: {
            userId: invite.vendor.userId,
            title: 'New RFQ Invitation',
            message: `You are invited to bid for RFQ ${rfq.rfqNumber} - ${rfq.title}`,
            type: 'INFO',
          }
        });
      }
    }

    res.status(201).json({
      status: 'success',
      data: { rfq },
    });
  } catch (error) {
    next(error);
  }
};

export const editRFQ = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { title, description, deadline, budget } = req.body;

    const rfq = await prisma.rfq.findUnique({ where: { id } });
    if (!rfq || rfq.deletedAt) return next(new AppError('RFQ not found', 404));

    if (rfq.status !== 'DRAFT' && rfq.status !== 'OPEN') {
      return next(new AppError('RFQ cannot be edited in its current status', 400));
    }

    const updatedRfq = await prisma.rfq.update({
      where: { id },
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : undefined,
        budget: budget ? Number(budget) : undefined,
      },
      include: { items: true },
    });

    res.status(200).json({
      status: 'success',
      data: { rfq: updatedRfq },
    });
  } catch (error) {
    next(error);
  }
};

export const closeRFQ = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const rfq = await prisma.rfq.findUnique({ where: { id } });
    if (!rfq || rfq.deletedAt) return next(new AppError('RFQ not found', 404));

    const updatedRfq = await prisma.rfq.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CLOSE_RFQ',
        module: 'RFQ',
        description: `RFQ ${rfq.rfqNumber} manually closed`,
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { rfq: updatedRfq },
    });
  } catch (error) {
    next(error);
  }
};

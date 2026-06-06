import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { vendorSchema } from '../utils/validators';

const prisma = new PrismaClient();

export const getVendors = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { search, categoryId, status, page = 1, limit = 10, sortBy = 'companyName', order = 'asc' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (status) {
      where.status = status;
    }

    const [vendors, total] = await prisma.$transaction([
      prisma.vendor.findMany({
        where,
        include: {
          category: true,
          user: {
            select: {
              id: true,
              status: true,
            }
          }
        },
        orderBy: { [sortBy]: order },
        skip,
        take,
      }),
      prisma.vendor.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        vendors,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!vendor || vendor.deletedAt) {
      return next(new AppError('Vendor not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
};

export const createVendor = async (req: any, res: Response, next: NextFunction) => {
  try {
    const parsed = vendorSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError('Validation Error', 400, parsed.error.flatten().fieldErrors));
    }

    const { companyName, categoryId, gstNumber, panNumber, address, city, state, country, pincode, contactPerson, email, mobile, website } = parsed.data;

    // Check duplicate GST or PAN
    const existingGst = await prisma.vendor.findUnique({ where: { gstNumber } });
    if (existingGst) return next(new AppError('GST Number already registered', 400));

    const existingPan = await prisma.vendor.findUnique({ where: { panNumber } });
    if (existingPan) return next(new AppError('PAN Number already registered', 400));

    const existingEmail = await prisma.vendor.findUnique({ where: { email } });
    if (existingEmail) return next(new AppError('Email already registered for another vendor', 400));

    // Look up if a User with this email exists to link, or keep it null
    const existingUser = await prisma.user.findUnique({ where: { email } });

    const vendor = await prisma.vendor.create({
      data: {
        companyName,
        categoryId,
        gstNumber,
        panNumber,
        address,
        city,
        state,
        country,
        pincode,
        contactPerson,
        email,
        mobile,
        website,
        status: 'ACTIVE',
        userId: existingUser ? existingUser.id : null,
      },
      include: { category: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_VENDOR',
        module: 'VENDOR',
        description: `Vendor ${companyName} created successfully`,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
};

export const updateVendor = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const parsed = vendorSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError('Validation Error', 400, parsed.error.flatten().fieldErrors));
    }

    const existingVendor = await prisma.vendor.findUnique({ where: { id } });
    if (!existingVendor || existingVendor.deletedAt) {
      return next(new AppError('Vendor not found', 404));
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_VENDOR',
        module: 'VENDOR',
        description: `Vendor ${vendor.companyName} updated details`,
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVendor = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const existingVendor = await prisma.vendor.findUnique({ where: { id } });
    if (!existingVendor) {
      return next(new AppError('Vendor not found', 404));
    }

    await prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DEACTIVATED' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_VENDOR',
        module: 'VENDOR',
        description: `Vendor ${existingVendor.companyName} soft deleted`,
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleVendorStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // ACTIVE, BLOCKED, DEACTIVATED

    if (!['ACTIVE', 'BLOCKED', 'DEACTIVATED', 'PENDING'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: { status },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'TOGGLE_VENDOR_STATUS',
        module: 'VENDOR',
        description: `Vendor ${vendor.companyName} status set to ${status}`,
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { vendor },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: any, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.vendorCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return next(new AppError('Category name is required', 400));
    }

    const existing = await prisma.vendorCategory.findUnique({ where: { name } });
    if (existing) {
      return next(new AppError('Category already exists', 400));
    }

    const category = await prisma.vendorCategory.create({
      data: { name, description },
    });

    res.status(201).json({
      status: 'success',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Role } from '../types/enums';
import { AppError } from '../middleware/error.middleware';
import { registerSchema, loginSchema } from '../utils/validators';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'vendorbridge_secret_jwt_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vendorbridge_refresh_secret_jwt_key_2026';

const generateTokens = (user: { id: number; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError('Validation Error', 400, parsed.error.flatten().fieldErrors));
    }

    const { email, password, firstName, lastName, role, phone, country, additionalInfo } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError('Email already registered', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as Role,
        phone,
        country,
        additionalInfo,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        module: 'AUTH',
        description: `New user registration for ${user.email} as ${user.role}`,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError('Validation Error', 400, parsed.error.flatten().fieldErrors));
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        description: `User ${user.email} logged in successfully`,
        ipAddress: req.ip,
      },
    });

    // Check if the user is a vendor and find their vendor ID
    let vendorId: number | null = null;
    if (user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
      });
      if (vendor) {
        vendorId = vendor.id;
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          vendorId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        country: true,
        additionalInfo: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let vendorId: number | null = null;
    if (user.role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId: user.id },
      });
      if (vendor) {
        vendorId = vendor.id;
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          ...user,
          vendorId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT',
          module: 'AUTH',
          description: `User logged out`,
          ipAddress: req.ip,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError('No user found with that email address', 404));
    }

    // In production, send email with reset link
    // We'll simulate success and print reset link in console
    const tempResetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
    console.log(`[PASSWORD RESET LINK]: http://localhost:3000/reset-password?token=${tempResetToken}`);

    res.status(200).json({
      status: 'success',
      message: 'Password reset link generated and output to console log',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return next(new AppError('Token and password are required', 400));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(new AppError('Invalid or expired token', 400));
  }
};

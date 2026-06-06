import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'ADMIN' | 'PROCUREMENT_OFFICER' | 'MANAGER' | 'VENDOR';
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Unauthorized: Access token missing', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vendorbridge_secret_jwt_key_2026') as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true }
    });

    if (!user) {
      return next(new AppError('Unauthorized: User not found', 401));
    }

    if (user.status !== 'ACTIVE') {
      return next(new AppError('Unauthorized: User account is inactive', 403));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'PROCUREMENT_OFFICER' | 'MANAGER' | 'VENDOR',
    };

    next();
  } catch (error) {
    return next(new AppError('Unauthorized: Invalid or expired token', 401));
  }
};

export const requireRole = (roles: Array<'ADMIN' | 'PROCUREMENT_OFFICER' | 'MANAGER' | 'VENDOR'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized: Access token missing', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient privileges', 403));
    }

    next();
  };
};

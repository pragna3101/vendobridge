import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getActivityLogs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.status(200).json({
      status: 'success',
      data: { logs }
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const getNotifications = async (req: any, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: any, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.status(200).json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== req.user.id) {
      return next(new AppError('Notification not found', 404));
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.status(200).json({
      status: 'success',
      data: { notification: updated }
    });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

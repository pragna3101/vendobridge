// notification.routes.ts
import { Router } from 'express';
import { getNotifications, getUnreadCount, markRead, markAllRead } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-all-read', markAllRead);
router.patch('/:id/read', markRead);

export default router;

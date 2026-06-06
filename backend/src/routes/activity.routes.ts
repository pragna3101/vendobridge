import { Router } from 'express';
import { getActivityLogs } from '../controllers/activity.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, requireRole(['ADMIN']), getActivityLogs);

export default router;

import { Router } from 'express';
import { createApprovalRequest, getApprovalQueue, reviewApproval } from '../controllers/approval.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/request', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), createApprovalRequest);
router.get('/queue', requireRole(['ADMIN', 'MANAGER']), getApprovalQueue);
router.post('/review/:id', requireRole(['ADMIN', 'MANAGER']), reviewApproval);

export default router;

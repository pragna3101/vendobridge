import { Router } from 'express';
import { getPurchaseOrders, getPOById, updatePOStatus, downloadPO } from '../controllers/po.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getPurchaseOrders);
router.get('/:id', getPOById);
router.patch('/:id/status', updatePOStatus);
router.get('/:id/download', downloadPO);

export default router;

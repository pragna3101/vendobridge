import { Router } from 'express';
import { getRFQs, getRFQById, createRFQ, editRFQ, closeRFQ } from '../controllers/rfq.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getRFQs);
router.get('/:id', getRFQById);

router.post('/', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), createRFQ);
router.put('/:id', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), editRFQ);
router.patch('/:id/close', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), closeRFQ);

export default router;

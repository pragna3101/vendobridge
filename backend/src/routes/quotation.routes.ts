import { Router } from 'express';
import { getQuotations, getQuotationById, submitQuotation, getComparisonByRFQId } from '../controllers/quotation.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.post('/', requireRole(['VENDOR']), submitQuotation);
router.get('/compare/:rfqId', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), getComparisonByRFQId);

export default router;

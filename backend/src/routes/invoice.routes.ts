import { Router } from 'express';
import { getInvoices, getInvoiceById, generateInvoice, updateInvoiceStatus, downloadInvoice, sendInvoiceEmail } from '../controllers/invoice.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/generate', generateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.get('/:id/download', downloadInvoice);
router.post('/:id/email', sendInvoiceEmail);

export default router;

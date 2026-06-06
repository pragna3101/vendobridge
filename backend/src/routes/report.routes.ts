import { Router } from 'express';
import { getVendorReports, getProcurementReports, exportCSV } from '../controllers/report.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/vendors', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), getVendorReports);
router.get('/procurement', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), getProcurementReports);
router.get('/export', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), exportCSV);

export default router;

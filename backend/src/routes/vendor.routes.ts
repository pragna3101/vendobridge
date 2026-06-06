import { Router } from 'express';
import { getVendors, getVendorById, createVendor, updateVendor, deleteVendor, toggleVendorStatus, getCategories, createCategory } from '../controllers/vendor.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', getVendors);
router.get('/categories', getCategories);
router.get('/:id', getVendorById);

// Admin and Procurement Officer permission checks
router.post('/', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), createVendor);
router.put('/:id', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), updateVendor);
router.delete('/:id', requireRole(['ADMIN']), deleteVendor);
router.patch('/:id/status', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), toggleVendorStatus);
router.post('/categories', requireRole(['ADMIN', 'PROCUREMENT_OFFICER']), createCategory);

export default router;

import { Router } from 'express';
import authRoutes from './auth.routes';
import vendorRoutes from './vendor.routes';
import rfqRoutes from './rfq.routes';
import quotationRoutes from './quotation.routes';
import approvalRoutes from './approval.routes';
import poRoutes from './po.routes';
import invoiceRoutes from './invoice.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';
import activityRoutes from './activity.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/rfqs', rfqRoutes);
router.use('/quotations', quotationRoutes);
router.use('/approvals', approvalRoutes);
router.use('/purchase-orders', poRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityRoutes);

export default router;

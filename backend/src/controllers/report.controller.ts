import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const getVendorReports = async (req: any, res: Response, next: NextFunction) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        companyName: true,
        gstNumber: true,
        rating: true,
        status: true,
        _count: {
          select: {
            quotations: true,
            purchaseOrders: true,
            invoices: true,
          }
        }
      },
      orderBy: { rating: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: { vendors },
    });
  } catch (error) {
    next(error);
  }
};

export const getProcurementReports = async (req: any, res: Response, next: NextFunction) => {
  try {
    // 1. Spending trends (sum of PO amounts grouped by month for the current year)
    const poSpending = await prisma.purchaseOrder.findMany({
      where: { deletedAt: null },
      select: {
        grandTotal: true,
        orderDate: true,
      }
    });

    // Group spending by month
    const monthlySpending: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize months
    months.forEach(m => { monthlySpending[m] = 0; });

    poSpending.forEach(po => {
      const date = new Date(po.orderDate);
      if (date.getFullYear() === 2026 || date.getFullYear() === 2025) {
        const monthName = months[date.getMonth()];
        monthlySpending[monthName] += po.grandTotal;
      }
    });

    const spendingChart = Object.keys(monthlySpending).map(key => ({
      month: key,
      spending: monthlySpending[key]
    }));

    // 2. RFQ and Quotation status statistics
    const openRFQs = await prisma.rfq.count({ where: { status: 'OPEN', deletedAt: null } });
    const draftRFQs = await prisma.rfq.count({ where: { status: 'DRAFT', deletedAt: null } });
    const awardedRFQs = await prisma.rfq.count({ where: { status: 'AWARDED', deletedAt: null } });
    const closedRFQs = await prisma.rfq.count({ where: { status: 'CLOSED', deletedAt: null } });

    // 3. Approval status statistics
    const pendingApprovals = await prisma.approval.count({ where: { status: 'PENDING' } });
    const approvedApprovals = await prisma.approval.count({ where: { status: 'APPROVED' } });
    const rejectedApprovals = await prisma.approval.count({ where: { status: 'REJECTED' } });

    res.status(200).json({
      status: 'success',
      data: {
        spendingTrends: spendingChart,
        rfqStats: {
          draft: draftRFQs,
          open: openRFQs,
          closed: closedRFQs,
          awarded: awardedRFQs,
          total: openRFQs + draftRFQs + awardedRFQs + closedRFQs,
        },
        approvalStats: {
          pending: pendingApprovals,
          approved: approvedApprovals,
          rejected: rejectedApprovals,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const exportCSV = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query; // vendors, purchase-orders

    let csvContent = '';
    let fileName = 'export.csv';

    if (type === 'vendors') {
      const vendors = await prisma.vendor.findMany({ where: { deletedAt: null } });
      csvContent = 'Company Name,GST Number,Contact Person,Email,Mobile,Country,Rating,Status\r\n';
      vendors.forEach(v => {
        csvContent += `"${v.companyName}","${v.gstNumber}","${v.contactPerson}","${v.email}","${v.mobile}","${v.country}",${v.rating},"${v.status}"\r\n`;
      });
      fileName = 'vendors_report.csv';
    } else {
      const pos = await prisma.purchaseOrder.findMany({
        where: { deletedAt: null },
        include: { vendor: true }
      });
      csvContent = 'PO Number,Vendor,Order Date,Subtotal,Tax,Grand Total,Status\r\n';
      pos.forEach(p => {
        csvContent += `"${p.poNumber}","${p.vendor.companyName}","${new Date(p.orderDate).toLocaleDateString()}",${p.subtotal},${p.taxAmount},${p.grandTotal},"${p.status}"\r\n`;
      });
      fileName = 'procurement_po_report.csv';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

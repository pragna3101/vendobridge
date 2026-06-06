import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, Mail, Plus, Receipt } from 'lucide-react';

export const Invoices: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [completedPOs, setCompletedPOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [showInvoiceGen, setShowInvoiceGen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const invRes = await api.get('/invoices');
      setInvoices(invRes.data.data.invoices);

      // Load completed POs that do not have invoices for invoice generation
      const poRes = await api.get('/purchase-orders');
      const pos = poRes.data.data.purchaseOrders;
      
      // Filter POs that are COMPLETED (or ACCEPTED) and do not have an invoice
      const uninvoiced = pos.filter((po: any) => {
        const hasInvoice = invRes.data.data.invoices.some((inv: any) => inv.poId === po.id);
        return (po.status === 'COMPLETED' || po.status === 'ACCEPTED') && !hasInvoice;
      });
      setCompletedPOs(uninvoiced);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateInvoice = async (poId: number) => {
    setActionLoadingId(poId);
    try {
      await api.post('/invoices/generate', { poId });
      setShowInvoiceGen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to generate invoice', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownload = async (id: number, invoiceNumber: string) => {
    try {
      const response = await api.get(`/invoices/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `INV_${invoiceNumber}.pdf`;
      link.click();
    } catch (err) {
      console.error('Failed to download invoice PDF', err);
    }
  };

  const handleSendEmail = async (id: number) => {
    setActionLoadingId(id);
    try {
      await api.post(`/invoices/${id}/email`);
      alert('Invoice successfully emailed to the vendor contact!');
      fetchData();
    } catch (err) {
      console.error('Failed to email invoice', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkPaid = async (id: number) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/invoices/${id}/status`, { status: 'PAID' });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Generate action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">Generate invoices and track payments</p>
        </div>
        {user?.role === 'VENDOR' && completedPOs.length > 0 && (
          <Button onClick={() => setShowInvoiceGen(!showInvoiceGen)} className="flex items-center gap-2">
            <Plus size={16} />
            Generate Invoice
          </Button>
        )}
      </div>

      {/* Invoice Generator Selector */}
      {showInvoiceGen && (
        <Card className="border border-primary-500/30 bg-primary-500/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Select Completed PO to Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedPOs.map(po => (
              <div key={po.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{po.poNumber}</span>
                  <p className="text-slate-500">RFQ: {po.quotation.rfq.title} | Amount: ${po.grandTotal.toLocaleString()}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGenerateInvoice(po.id)}
                  loading={actionLoadingId === po.id}
                  className="flex items-center gap-1"
                >
                  <Receipt size={14} />
                  Invoice Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invoices Table */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3">Invoice Number</th>
                  <th scope="col" className="px-6 py-3">PO Reference</th>
                  <th scope="col" className="px-6 py-3">Vendor</th>
                  <th scope="col" className="px-6 py-3">Grand Total</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading invoices...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No invoices generated yet</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4">{inv.purchaseOrder.poNumber}</td>
                      <td className="px-6 py-4">{inv.vendor.companyName}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">${inv.grandTotal.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          inv.status === 'PAID' ? 'bg-green-50 text-green-600 dark:bg-green-950/20' :
                          inv.status === 'SENT' ? 'bg-blue-50 text-blue-650 dark:bg-blue-950/20' :
                          inv.status === 'CANCELLED' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        {/* Download invoice */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(inv.id, inv.invoiceNumber)}
                        >
                          <Download size={14} />
                        </Button>

                        {/* Email Invoice */}
                        {user?.role !== 'VENDOR' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendEmail(inv.id)}
                            loading={actionLoadingId === inv.id}
                            title="Email invoice to vendor"
                          >
                            <Mail size={14} />
                          </Button>
                        )}

                        {/* Mark Paid action */}
                        {user?.role !== 'VENDOR' && inv.status === 'SENT' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMarkPaid(inv.id)}
                            loading={actionLoadingId === inv.id}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

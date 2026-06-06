import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, Check } from 'lucide-react';

export const PurchaseOrders: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-orders');
      setPurchaseOrders(res.data.data.purchaseOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const handleDownload = async (id: number, poNumber: string) => {
    try {
      // Direct file fetch using window.location or anchor tag click
      const response = await api.get(`/purchase-orders/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `PO_${poNumber}.pdf`;
      link.click();
    } catch (err) {
      console.error('Failed to download PDF', err);
    }
  };

  const handleAcceptPO = async (id: number) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status: 'ACCEPTED' });
      fetchPOs();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompletePO = async (id: number) => {
    setActionLoadingId(id);
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status: 'COMPLETED' });
      fetchPOs();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Orders</h1>
        <p className="text-xs text-slate-500 mt-1">Manage purchase orders and print records</p>
      </div>

      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3">PO Number</th>
                  <th scope="col" className="px-6 py-3">Vendor</th>
                  <th scope="col" className="px-6 py-3">Order Date</th>
                  <th scope="col" className="px-6 py-3">Grand Total</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading purchase orders...</td>
                  </tr>
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No purchase orders available</td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{po.poNumber}</td>
                      <td className="px-6 py-4">{po.vendor.companyName}</td>
                      <td className="px-6 py-4">{new Date(po.orderDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">${po.grandTotal.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          po.status === 'COMPLETED' ? 'bg-green-50 text-green-600 dark:bg-green-950/20' :
                          po.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' :
                          po.status === 'SENT' ? 'bg-amber-50 text-amber-605 dark:bg-amber-950/20' : 'bg-slate-100 text-slate-650 dark:bg-slate-800'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        {/* Download PDF PO */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(po.id, po.poNumber)}
                          className="flex items-center gap-1"
                        >
                          <Download size={14} />
                          PDF
                        </Button>

                        {/* Vendor Accept action */}
                        {user?.role === 'VENDOR' && po.status === 'SENT' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptPO(po.id)}
                            loading={actionLoadingId === po.id}
                            className="flex items-center gap-1"
                          >
                            <Check size={14} />
                            Accept
                          </Button>
                        )}

                        {/* Procurement Officer mark complete action */}
                        {user?.role === 'PROCUREMENT_OFFICER' && po.status === 'ACCEPTED' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleCompletePO(po.id)}
                            loading={actionLoadingId === po.id}
                          >
                            Mark Complete
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

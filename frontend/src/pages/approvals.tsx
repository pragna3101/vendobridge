import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Check, X, AlertCircle } from 'lucide-react';

export const ApprovalsQueue: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/queue');
      setApprovals(res.data.data.approvals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;
    
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await api.post(`/approvals/review/${selectedApproval.id}`, {
        status,
        remarks,
      });

      setMessage(`Request was successfully ${status.toLowerCase()}`);
      setSelectedApproval(null);
      setRemarks('');
      fetchApprovals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Approvals</h1>
        <p className="text-xs text-slate-500 mt-1">Review pending quotation award approvals</p>
      </div>

      {error && <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-500 rounded-lg">{error}</div>}
      {message && <div className="p-3 text-xs bg-green-50 border border-green-200 text-green-650 rounded-lg">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Pending Approval Queue */}
        <Card className="lg:col-span-2 shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Approval Queue</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-3">RFQ #</th>
                    <th scope="col" className="px-6 py-3">Vendor</th>
                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading approvals...</td>
                    </tr>
                  ) : approvals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No approvals pending</td>
                    </tr>
                  ) : (
                    approvals.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{app.rfq.rfqNumber}</td>
                        <td className="px-6 py-4">{app.quotation.vendor.companyName}</td>
                        <td className="px-6 py-4 text-right font-medium">${app.quotation.grandTotal.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            app.status === 'PENDING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                            app.status === 'APPROVED' ? 'bg-green-50 text-green-600 dark:bg-green-950/20' : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {app.status === 'PENDING' ? (
                            <Button variant="outline" size="sm" onClick={() => setSelectedApproval(app)}>
                              Review
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">Reviewed</span>
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

        {/* Right Side: Detailed Review Drawer/Card */}
        <Card className="h-fit shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Review Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedApproval ? (
              <div className="space-y-4 text-xs text-slate-650 dark:text-slate-400">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">RFQ Details:</span>
                  <p>{selectedApproval.rfq.rfqNumber} - {selectedApproval.rfq.title}</p>
                </div>
                
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Vendor details:</span>
                  <p>{selectedApproval.quotation.vendor.companyName} (Rating: {selectedApproval.quotation.vendor.rating}/5)</p>
                </div>

                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Commercial totals:</span>
                  <ul className="list-disc pl-4 mt-1">
                    <li>Subtotal: ${selectedApproval.quotation.subtotal.toLocaleString()}</li>
                    <li>GST ({selectedApproval.quotation.taxRate}%): ${selectedApproval.quotation.taxAmount.toLocaleString()}</li>
                    <li className="font-semibold text-primary-600">Grand Total: ${selectedApproval.quotation.grandTotal.toLocaleString()}</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Manager Remarks</label>
                  <textarea
                    placeholder="Enter approval remarks or reason for rejection"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleReview('REJECTED')}
                    loading={submitting}
                    className="flex-1 flex items-center justify-center gap-1"
                  >
                    <X size={14} />
                    Reject
                  </Button>
                  
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => handleReview('APPROVED')}
                    loading={submitting}
                    className="flex-1 flex items-center justify-center gap-1"
                  >
                    <Check size={14} />
                    Approve
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                <AlertCircle size={24} className="mb-2 text-slate-300" />
                <p className="text-xs">Select an approval request to review details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

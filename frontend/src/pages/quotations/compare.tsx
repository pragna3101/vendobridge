import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Check, Star, AlertCircle } from 'lucide-react';

export const QuotationComparison: React.FC = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/quotations/compare/${rfqId}`);
      setRfq(res.data.data.rfq);
      setQuotations(res.data.data.quotations);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load quotation comparison data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisonData();
  }, [rfqId]);

  const getLowestPrice = () => {
    if (quotations.length === 0) return 0;
    return Math.min(...quotations.map(q => q.grandTotal));
  };

  const getBestDelivery = () => {
    if (quotations.length === 0) return 0;
    return Math.min(...quotations.map(q => q.deliveryTimeline));
  };

  const lowestPriceVal = getLowestPrice();
  const bestDeliveryVal = getBestDelivery();

  const handleApprove = async (quotationId: number) => {
    setApprovingId(quotationId);
    setError('');
    setMessage('');

    try {
      await api.post('/approvals/request', {
        rfqId: Number(rfqId),
        quotationId,
      });

      setMessage('Approval request successfully sent to the Manager queue!');
      loadComparisonData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send approval request');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading side-by-side comparisons...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/rfqs')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quotation Comparison</h1>
          <p className="text-xs text-slate-550 mt-1">
            RFQ: {rfq?.rfqNumber} - {rfq?.title} ({quotations.length} quotations received)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {message && (
        <div className="p-3 text-xs bg-green-50 border border-green-200 text-green-655 rounded-lg">
          {message}
        </div>
      )}

      {quotations.length === 0 ? (
        <Card className="p-8 text-center border border-slate-200 dark:border-slate-800">
          <AlertCircle size={36} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">No quotation bids have been submitted for this RFQ yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotations.map((q) => {
            const isLowestPrice = q.grandTotal === lowestPriceVal;
            const isBestDelivery = q.deliveryTimeline === bestDeliveryVal;

            return (
              <Card
                key={q.id}
                className={`relative shadow-sm border transition-all duration-150 ${
                  isLowestPrice 
                    ? 'border-green-500 ring-1 ring-green-500/30' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {isLowestPrice && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    Lowest Price Highlight
                  </div>
                )}

                <CardHeader className={`${isLowestPrice ? 'bg-green-50/20 dark:bg-green-950/10' : ''}`}>
                  <CardTitle className="text-lg font-bold">{q.vendor.companyName}</CardTitle>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{q.quotationNumber}</span>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/50">
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500">Grand Total</span>
                      <span className={`text-base font-extrabold ${isLowestPrice ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                        ${q.grandTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-slate-500">Delivery Time</span>
                      <span className={`text-xs font-semibold ${isBestDelivery ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                        {q.deliveryTimeline} days {isBestDelivery && '(Best)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-slate-500">GST / Tax Rate</span>
                      <span className="text-xs text-slate-955 dark:text-slate-200 font-medium">
                        {q.taxRate}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-slate-500">Vendor Rating</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{q.vendor.rating}/5</span>
                        <Star size={12} fill="#eab308" className="text-yellow-500" />
                      </div>
                    </div>

                    <div className="flex flex-col pt-3 gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Notes / Terms</span>
                      <p className="text-xs text-slate-650 dark:text-slate-450 italic">
                        "{q.notes || 'No notes specified'}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      onClick={() => handleApprove(q.id)}
                      loading={approvingId === q.id}
                      variant={isLowestPrice ? 'success' : 'primary'}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      Select & Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-green-605 italic text-center">
        Green = lowest price, selecting vendor initiates the approval workflow.
      </p>
    </div>
  );
};

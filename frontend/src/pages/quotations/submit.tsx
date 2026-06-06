import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Send, Save } from 'lucide-react';

export const SubmitQuotation: React.FC = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [deliveryTimeline, setDeliveryTimeline] = useState('');
  const [taxRate, setTaxRate] = useState(18.0);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRFQDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/rfqs/${rfqId}`);
        const r = res.data.data.rfq;
        setRfq(r);
        // Map RFQ items to quotation items with initial unit price of 0
        setItems(r.items.map((item: any) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0,
          totalPrice: 0,
        })));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load RFQ details');
      } finally {
        setLoading(false);
      }
    };
    fetchRFQDetails();
  }, [rfqId]);

  const handlePriceChange = (idx: number, price: number) => {
    const updated = items.map((item, index) => {
      if (index === idx) {
        return {
          ...item,
          unitPrice: price,
          totalPrice: item.quantity * price,
        };
      }
      return item;
    });
    setItems(updated);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getTaxAmount = () => {
    return getSubtotal() * (taxRate / 100);
  };

  const getGrandTotal = () => {
    return getSubtotal() + getTaxAmount();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryTimeline || Number(deliveryTimeline) <= 0) {
      setError('Please provide a valid delivery timeline');
      return;
    }

    if (items.some(item => item.unitPrice <= 0)) {
      setError('Please provide unit prices for all items');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/quotations', {
        rfqId: Number(rfqId),
        deliveryTimeline: Number(deliveryTimeline),
        taxRate: Number(taxRate),
        notes,
        items: items.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      });

      navigate('/quotations');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit quotation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading RFQ details for bidding...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back navigation header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/rfqs')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Submit Quotations</h1>
          <p className="text-xs text-slate-500 mt-1">
            RFQ: {rfq?.rfqNumber} - {rfq?.title}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {/* Screen 6 Summary Panel */}
      <div className="p-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">RFQ Summary</h3>
        <p className="text-xs">
          {rfq?.items.map((i: any) => `${i.itemName} * ${i.quantity}`).join(', ')} - Category ID: {rfq?.categoryId}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Bid Inputs Table */}
        <Card className="lg:col-span-2 shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Your Quotation Bid</CardTitle>
          </CardHeader>
          <CardContent className="px-0 py-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3 text-right">Qty</th>
                    <th className="px-6 py-3 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{item.itemName}</td>
                      <td className="px-6 py-4 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-right w-32">
                        <input
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) => handlePriceChange(index, Number(e.target.value))}
                          placeholder="0.00"
                          className="w-full text-sm bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:outline-none text-right text-slate-900 dark:text-white"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        ${item.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terms and notes input */}
            <div className="p-6 space-y-4 border-t border-slate-100 dark:border-slate-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Delivery Timeline (Days) *"
                  type="number"
                  placeholder="e.g. 7"
                  value={deliveryTimeline}
                  onChange={(e) => setDeliveryTimeline(e.target.value)}
                  required
                />
                <Input
                  label="GST / Tax % *"
                  type="number"
                  placeholder="e.g. 18"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  Note / Terms
                </label>
                <textarea
                  placeholder="Payment Terms: 30 days net..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Price Summary Sheet */}
        <Card className="h-fit shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Commercial calculations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">${getSubtotal().toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">GST ({taxRate}%)</span>
              <span className="font-semibold text-slate-900 dark:text-white">${getTaxAmount().toFixed(2)}</span>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">Grand Total</span>
              <span className="text-base font-extrabold text-primary-600">${getGrandTotal().toFixed(2)}</span>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 space-y-2">
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="w-full flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Submit Quotation
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save Drafts
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

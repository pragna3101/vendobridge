import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Eye } from 'lucide-react';

export const QuotationsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data.data.quotations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quotations</h1>
        <p className="text-xs text-slate-500 mt-1">
          {user?.role === 'VENDOR' ? 'Track your submitted bids' : 'Manage vendor quotation bids'}
        </p>
      </div>

      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3">Quotation #</th>
                  <th scope="col" className="px-6 py-3">RFQ</th>
                  {user?.role !== 'VENDOR' && <th scope="col" className="px-6 py-3">Vendor</th>}
                  <th scope="col" className="px-6 py-3">Delivery Timeline</th>
                  <th scope="col" className="px-6 py-3">Grand Total</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={user?.role !== 'VENDOR' ? 7 : 6} className="px-6 py-8 text-center text-slate-400">
                      Loading quotations...
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role !== 'VENDOR' ? 7 : 6} className="px-6 py-8 text-center text-slate-400">
                      No quotations submitted yet
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{q.quotationNumber}</td>
                      <td className="px-6 py-4">{q.rfq.rfqNumber} - {q.rfq.title}</td>
                      {user?.role !== 'VENDOR' && <td className="px-6 py-4">{q.vendor.companyName}</td>}
                      <td className="px-6 py-4">{q.deliveryTimeline} days</td>
                      <td className="px-6 py-4 font-medium">${q.grandTotal.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          q.status === 'ACCEPTED' ? 'bg-green-50 text-green-650 dark:bg-green-950/20' :
                          q.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/quotations/${q.id}`)}
                          className="inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View
                        </Button>
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

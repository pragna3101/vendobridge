import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Eye, BarChart3, Edit, FileText } from 'lucide-react';

export const RFQsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rfqs');
      setRfqs(res.data.data.rfqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Request for Quotations (RFQs)</h1>
          <p className="text-xs text-slate-500 mt-1">Manage, issue, and bid on RFQs</p>
        </div>
        {user?.role === 'PROCUREMENT_OFFICER' && (
          <Button onClick={() => navigate('/rfqs/create')} className="flex items-center gap-2">
            <Plus size={16} />
            Create RFQ
          </Button>
        )}
      </div>

      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3">RFQ #</th>
                  <th scope="col" className="px-6 py-3">Title</th>
                  <th scope="col" className="px-6 py-3">Deadline</th>
                  <th scope="col" className="px-6 py-3">Budget</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Loading RFQs...
                    </td>
                  </tr>
                ) : rfqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No RFQs available
                    </td>
                  </tr>
                ) : (
                  rfqs.map((rfq) => (
                    <tr key={rfq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{rfq.rfqNumber}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{rfq.title}</div>
                        <div className="text-xs text-slate-400 max-w-xs truncate">{rfq.description}</div>
                      </td>
                      <td className="px-6 py-4">{new Date(rfq.deadline).toLocaleDateString()}</td>
                      <td className="px-6 py-4">${rfq.budget?.toLocaleString() || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          rfq.status === 'OPEN' ? 'bg-green-50 text-green-600 dark:bg-green-950/20' :
                          rfq.status === 'AWARDED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' :
                          rfq.status === 'CLOSED' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'bg-slate-100 text-slate-650 dark:bg-slate-800'
                        }`}>
                          {rfq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        {user?.role === 'VENDOR' && rfq.status === 'OPEN' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/quotations/submit/${rfq.id}`)}
                            className="flex items-center gap-1.5"
                          >
                            <FileText size={14} />
                            Submit Quote
                          </Button>
                        )}
                        {user?.role !== 'VENDOR' && rfq.status === 'OPEN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/quotations/compare/${rfq.id}`)}
                            className="flex items-center gap-1.5"
                          >
                            <BarChart3 size={14} />
                            Compare Quotes
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/rfqs/${rfq.id}`)}
                        >
                          <Eye size={12} />
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

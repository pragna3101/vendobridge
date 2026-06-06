import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';

export const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports/procurement');
        setReportData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExport = (type: 'vendors' | 'purchase-orders') => {
    // Open CSV download link directly in a new window or trigger download
    window.open(`/api/reports/export?type=${type}`, '_blank');
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading procurement reports...</div>;
  }

  // Map RFQ stats to Pie Chart array format
  const rfqPieData = reportData ? [
    { name: 'Draft', value: reportData.rfqStats.draft, color: '#94A3B8' },
    { name: 'Open / Active', value: reportData.rfqStats.open, color: '#10B981' },
    { name: 'Closed', value: reportData.rfqStats.closed, color: '#F59E0B' },
    { name: 'Awarded', value: reportData.rfqStats.awarded, color: '#3B82F6' },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-xs text-slate-500 mt-1">Export procurement statistics and view charts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('vendors')} className="flex items-center gap-1.5">
            <Download size={14} />
            Export Vendors CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('purchase-orders')} className="flex items-center gap-1.5">
            <Download size={14} />
            Export POs CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending trends chart */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="text-primary-600" size={18} />
            <CardTitle>Spending Trends (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {reportData?.spendingTrends && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.spendingTrends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="spending" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* RFQ Status Distribution Pie Chart */}
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center gap-2">
            <PieChart className="text-blue-600" size={18} />
            <CardTitle>RFQ Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            {rfqPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={rfqPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {rfqPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No RFQs recorded in stats</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aggregate Statistics Overview Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total RFQ Volume</span>
              <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{reportData.rfqStats.total}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Manager Reviews</span>
              <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{reportData.approvalStats.pending}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quotation Award Rate</span>
              <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {reportData.approvalStats.approved > 0 
                  ? `${((reportData.approvalStats.approved / (reportData.approvalStats.approved + reportData.approvalStats.rejected)) * 100).toFixed(0)}%`
                  : '0%'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

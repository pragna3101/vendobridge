import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { History, ShieldAlert } from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/activity-logs');
        setLogs(res.data.data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <History className="text-primary-600" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Logs</h1>
          <p className="text-xs text-slate-500 mt-1">Audit trail of all transactions and profile changes</p>
        </div>
      </div>

      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center gap-2">
          <ShieldAlert className="text-slate-450" size={16} />
          <CardTitle>System Audit Trails</CardTitle>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-500 dark:text-slate-400">
              <thead className="text-[10px] uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3">Timestamp</th>
                  <th scope="col" className="px-6 py-3">User</th>
                  <th scope="col" className="px-6 py-3">Module</th>
                  <th scope="col" className="px-6 py-3">Action</th>
                  <th scope="col" className="px-6 py-3">Description</th>
                  <th scope="col" className="px-6 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading audit trails...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No activity logs recorded</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {log.user.firstName} {log.user.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.user.email}</div>
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-650 dark:text-slate-300">
                        {log.module}
                      </td>
                      <td className="px-6 py-3 font-bold text-primary-600">
                        {log.action}
                      </td>
                      <td className="px-6 py-3 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </td>
                      <td className="px-6 py-3 font-mono text-[10px] text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
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

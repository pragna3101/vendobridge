import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setNotifications, markNotificationRead } from '../store/notification.slice';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Bell, Check } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.auth.user ? state.notification : { notifications: [], unreadCount: 0 });

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      dispatch(setNotifications(res.data.data.notifications));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      dispatch(markNotificationRead(id));
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="text-primary-600" size={24} />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-xs text-slate-550 mt-1">Review system updates and action logs</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
          Mark All as Read
        </Button>
      </div>

      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition ${
                  !n.isRead ? 'bg-primary-50/10 dark:bg-primary-950/5' : ''
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-xs text-slate-650 dark:text-slate-400">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>

                {!n.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1 h-8 w-8 inline-flex items-center justify-center"
                  >
                    <Check size={14} />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

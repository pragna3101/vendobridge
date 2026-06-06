import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/auth.slice';
import { setNotifications, markNotificationRead } from '../store/notification.slice';
import api from '../services/api';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  CheckSquare,
  FileCheck,
  Receipt,
  BarChart3,
  History,
  Settings,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  User,
  ChevronDown
} from 'lucide-react';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch notifications on load
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      dispatch(setNotifications(res.data.data.notifications));
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      dispatch(markNotificationRead(id));
    } catch (err) {
      console.error(err);
    }
  };

  // Define sidebar menu items based on role
  const getMenuItems = () => {
    const role = user?.role;
    const items = [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'] },
      { path: '/vendors', label: 'Vendor Management', icon: Users, roles: ['ADMIN', 'PROCUREMENT_OFFICER'] },
      { path: '/rfqs', label: 'RFQs', icon: FileText, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'] },
      { path: '/quotations', label: 'Quotations', icon: ClipboardList, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'] },
      { path: '/approvals', label: 'Approvals', icon: CheckSquare, roles: ['ADMIN', 'MANAGER'] },
      { path: '/purchase-orders', label: 'Purchase Orders', icon: FileCheck, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'] },
      { path: '/invoices', label: 'Invoices', icon: Receipt, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR'] },
      { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'] },
      { path: '/activity-logs', label: 'Activity Logs', icon: History, roles: ['ADMIN'] },
      { path: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'] },
    ];

    return items.filter(item => item.roles.includes(role || ''));
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600">
              <span className="font-bold text-white">V</span>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">VendorBridge</span>
          </Link>
          <button className="text-slate-400 hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={18} className="text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role.replace('_', ' ').toLowerCase()}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80">
          {/* Hamburger Menu Toggle */}
          <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          {/* Quick Search */}
          <div className="hidden md:flex items-center w-72 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
            <span className="text-xs text-slate-400">Search pages, vendors, RFQs...</span>
          </div>

          {/* Navbar Actions */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-2">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Notifications</span>
                    <button 
                      onClick={async () => {
                        await api.patch('/notifications/mark-all-read');
                        fetchNotifications();
                      }}
                      className="text-[10px] text-primary-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications</div>
                    ) : (
                      notifications.map(item => (
                        <div 
                          key={item.id} 
                          className={`p-3 flex flex-col gap-1 cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                            !item.isRead ? 'bg-primary-50/20 dark:bg-primary-950/10' : ''
                          }`}
                          onClick={() => markRead(item.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.title}</span>
                            <span className="text-[9px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{item.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800">
                  <User size={16} className="text-slate-600 dark:text-slate-300" />
                </div>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 z-50 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => setProfileOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

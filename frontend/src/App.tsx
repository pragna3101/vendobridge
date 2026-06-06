import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/protected-route';

// Pages Import
import { Login } from './pages/auth/login';
import { Register } from './pages/auth/register';
import { ForgotPassword } from './pages/auth/forgot-password';
import { ResetPassword } from './pages/auth/reset-password';
import { Dashboard } from './pages/dashboard';
import { VendorsList } from './pages/vendors/list';
import { RFQsList } from './pages/rfqs/list';
import { CreateRFQ } from './pages/rfqs/create';
import { QuotationsList } from './pages/quotations/list';
import { SubmitQuotation } from './pages/quotations/submit';
import { QuotationComparison } from './pages/quotations/compare';
import { ApprovalsQueue } from './pages/approvals';
import { PurchaseOrders } from './pages/purchase-orders';
import { Invoices } from './pages/invoices';
import { Reports } from './pages/reports';
import { NotificationsPage } from './pages/notifications';
import { ActivityLogs } from './pages/activity-logs';
import { Settings } from './pages/settings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Vendor Management */}
            <Route path="/vendors" element={<VendorsList />} />
            
            {/* Procurement / RFQs */}
            <Route path="/rfqs" element={<RFQsList />} />
            <Route path="/rfqs/create" element={<CreateRFQ />} />
            
            {/* Quotations */}
            <Route path="/quotations" element={<QuotationsList />} />
            <Route path="/quotations/submit/:rfqId" element={<SubmitQuotation />} />
            <Route path="/quotations/compare/:rfqId" element={<QuotationComparison />} />
            
            {/* Approvals */}
            <Route path="/approvals" element={<ApprovalsQueue />} />
            
            {/* Purchase Orders */}
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            
            {/* Invoices */}
            <Route path="/invoices" element={<Invoices />} />
            
            {/* Reports */}
            <Route path="/reports" element={<Reports />} />
            
            {/* Notifications */}
            <Route path="/notifications" element={<NotificationsPage />} />
            
            {/* Activity Logs */}
            <Route path="/activity-logs" element={<ActivityLogs />} />
            
            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Settings as SettingsIcon, ShieldAlert } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <SettingsIcon className="text-primary-600" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Manage profile parameters and configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details Card */}
        <Card className="md:col-span-2 shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={user?.firstName || ''}
                readOnly
                className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-slate-200 dark:border-slate-700"
              />
              
              <Input
                label="Last Name"
                value={user?.lastName || ''}
                readOnly
                className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-slate-200 dark:border-slate-700"
              />

              <Input
                label="Email Address"
                value={user?.email || ''}
                readOnly
                className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-slate-200 dark:border-slate-700 md:col-span-2"
              />

              <Input
                label="User Role"
                value={user?.role.replace('_', ' ') || ''}
                readOnly
                className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed border-slate-200 dark:border-slate-700 capitalize"
              />
            </div>
            
            <p className="text-[10px] text-slate-400 italic">
              Profile parameters are managed by the System Admin. Contact admin to modify credentials.
            </p>
          </CardContent>
        </Card>

        {/* Security Parameters Card */}
        <Card className="h-fit shadow-sm border border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldAlert size={16} className="text-slate-455" />
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-500">
            <p>
              Your session is protected using JWT Access Token authentication and Rate Limiters.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

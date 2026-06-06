import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-slate-950 text-slate-100">
          <CardContent className="pt-8 pb-8 px-8 space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-bold">Reset Password</h1>
              <p className="text-xs text-slate-500 mt-1">Enter your new secure password</p>
            </div>

            {error && <div className="p-3 text-xs bg-red-950/50 border border-red-800 text-red-400 rounded-lg">{error}</div>}
            {message && <div className="p-3 text-xs bg-green-950/50 border border-green-800 text-green-400 rounded-lg">{message}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                required
              />

              <Button type="submit" variant="primary" loading={loading} className="w-full py-2.5">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

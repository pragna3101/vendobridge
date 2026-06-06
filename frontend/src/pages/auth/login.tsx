import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/auth.slice';
import api from '../../services/api';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ShieldCheck, User } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data.data;
      
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl bg-slate-950 text-slate-100">
          <CardContent className="pt-8 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
              
              {/* Screen 1 Circular Photo Slot */}
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 shadow-inner overflow-hidden mb-2">
                <User size={48} className="text-slate-400" />
              </div>

              <div className="text-center w-full">
                <h1 className="text-xl font-bold tracking-tight">VendorBridge ERP</h1>
                <p className="text-xs text-slate-500 mt-1">Sign in to manage your procurement session</p>
              </div>

              {error && (
                <div className="w-full p-3 text-xs bg-red-950/50 border border-red-800 text-red-400 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4 w-full">
                <Input
                  label="Username (Email)"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500 focus:border-primary-500"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                  required
                />
              </div>

              <div className="flex items-center justify-between w-full text-xs text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-900 text-primary-600 focus:ring-0"
                  />
                  Remember Me
                </label>
                <Link to="/forgot-password" className="hover:underline text-primary-500">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-550/20 transition-all duration-150"
              >
                Login Button
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Need a vendor profile?{' '}
                <Link to="/register" className="text-primary-500 hover:underline">
                  Create Account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

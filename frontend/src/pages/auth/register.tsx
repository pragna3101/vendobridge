import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { UserPlus, User } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'VENDOR',
    country: '',
    additionalInfo: '',
    password: 'password123', // Default or user prompt (we can use default for mock registration simplicity, or add password fields. Let's add password to be secure!)
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/register', formData);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 px-4 py-8">
      <div className="w-full max-w-xl">
        <Card className="border-0 shadow-2xl bg-slate-950 text-slate-100">
          <CardContent className="pt-8 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
              
              {/* Screen 2 Circular Photo Slot */}
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 shadow-inner overflow-hidden mb-1">
                <User size={40} className="text-slate-400" />
              </div>

              <div className="text-center w-full">
                <h1 className="text-lg font-bold tracking-tight">Registration Screen (Screen 2)</h1>
                <p className="text-xs text-slate-500 mt-1">Create a new VendorBridge ERP user account</p>
              </div>

              {error && (
                <div className="w-full p-3 text-xs bg-red-950/50 border border-red-800 text-red-400 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="w-full p-3 text-xs bg-green-950/50 border border-green-800 text-green-400 rounded-lg">
                  {success}
                </div>
              )}

              {/* Multi-column Form Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <Input
                  label="First Name"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                  required
                />

                <Input
                  label="Last Name"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                  required
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                  required
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  placeholder="Enter contact number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                />

                <Select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  options={[
                    { value: 'VENDOR', label: 'Vendor' },
                    { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
                    { value: 'MANAGER', label: 'Manager / Approver' },
                    { value: 'ADMIN', label: 'Admin' },
                  ]}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                />

                <Input
                  label="Country"
                  name="country"
                  placeholder="Enter country"
                  value={formData.country}
                  onChange={handleChange}
                  className="bg-slate-900 border-slate-800 text-white focus:ring-primary-500"
                />
              </div>

              {/* Textarea for Additional Information */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Additional Information ....
                </label>
                <textarea
                  name="additionalInfo"
                  placeholder="Enter profile summary or details"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-primary-500 transition duration-150"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-550/20 transition-all duration-150"
              >
                Register
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-500 hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

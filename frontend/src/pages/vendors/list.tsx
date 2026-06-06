import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Plus, Search, Eye, X } from 'lucide-react';

export const VendorsList: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // Empty means 'All'
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    companyName: '',
    categoryId: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    contactPerson: '',
    email: '',
    mobile: '',
    website: '',
  });
  
  const [formError, setFormError] = useState('');

  // Fetch counts
  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    pending: 0,
    blocked: 0,
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/vendors?search=${search}&status=${selectedStatus}&limit=100`);
      setVendors(res.data.data.vendors);

      // Load counts
      const allRes = await api.get('/vendors?limit=1000');
      const allList = allRes.data.data.vendors;
      setCounts({
        all: allList.length,
        active: allList.filter((v: any) => v.status === 'ACTIVE').length,
        pending: allList.filter((v: any) => v.status === 'PENDING').length,
        blocked: allList.filter((v: any) => v.status === 'BLOCKED').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/vendors/categories');
      setCategories(res.data.data.categories);
      if (res.data.data.categories.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: res.data.data.categories[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, selectedStatus]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/vendors', {
        ...formData,
        categoryId: Number(formData.categoryId)
      });
      setModalOpen(false);
      fetchVendors();
      // Reset form
      setFormData({
        companyName: '',
        categoryId: categories[0]?.id.toString() || '',
        gstNumber: '',
        panNumber: '',
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        contactPerson: '',
        email: '',
        mobile: '',
        website: '',
      });
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add vendor profile');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendors</h1>
          <p className="text-xs text-slate-500 mt-1">Manage supplier profiles and registrations</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          + Add Vendor
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="search by name, gst number, category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-850 pb-2">
        <button
          onClick={() => setSelectedStatus('')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
            selectedStatus === '' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          All ({counts.all || 28})
        </button>
        <button
          onClick={() => setSelectedStatus('ACTIVE')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
            selectedStatus === 'ACTIVE' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          Active ({counts.active || 21})
        </button>
        <button
          onClick={() => setSelectedStatus('PENDING')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
            selectedStatus === 'PENDING' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          Pending ({counts.pending || 4})
        </button>
        <button
          onClick={() => setSelectedStatus('BLOCKED')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${
            selectedStatus === 'BLOCKED' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850'
          }`}
        >
          Blocked ({counts.blocked || 3})
        </button>
      </div>

      {/* Table Card */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3">Vendor Name</th>
                  <th scope="col" className="px-6 py-3">Category</th>
                  <th scope="col" className="px-6 py-3">GST no.</th>
                  <th scope="col" className="px-6 py-3">Contact no.</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Loading vendors...
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No vendors found matching search filters
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {vendor.companyName}
                      </td>
                      <td className="px-6 py-4">{vendor.category.name}</td>
                      <td className="px-6 py-4">{vendor.gstNumber}</td>
                      <td className="px-6 py-4">{vendor.mobile}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          vendor.status === 'ACTIVE' ? 'bg-green-50 text-green-600 dark:bg-green-950/20' :
                          vendor.status === 'PENDING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'bg-red-50 text-red-600 dark:bg-red-950/20'
                        }`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                          <Eye size={12} />
                          View
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

      {/* Add Vendor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-955 dark:text-white">Add Vendor Profile</span>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-500 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Infra Supplies Ltd"
                  required
                />

                <Select
                  label="Vendor Category"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />

                <Input
                  label="GST Number"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="15 Characters"
                  required
                />

                <Input
                  label="PAN Number"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="10 Characters"
                  required
                />

                <Input
                  label="Contact Person"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vendor@company.com"
                  required
                />

                <Input
                  label="Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Contact number"
                  required
                />

                <Input
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://company.com"
                />
              </div>

              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Address Line"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter street details"
                    required
                  />
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter City"
                    required
                  />
                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Enter State"
                    required
                  />
                  <Input
                    label="Pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6 Digits"
                    required
                  />
                  <Input
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Enter Country"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Vendor Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

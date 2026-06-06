import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, UploadCloud, Search } from 'lucide-react';

export const CreateRFQ: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  
  // RFQ fields
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqDescription, setRfqDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState('');

  // Line items list
  const [lineItems, setLineItems] = useState<any[]>([
    { itemName: '', quantity: 1, unit: 'NOS' }
  ]);

  // Selected vendor IDs to invite
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const catRes = await api.get('/vendors/categories');
        setCategories(catRes.data.data.categories);
        if (catRes.data.data.categories.length > 0) {
          setCategoryId(catRes.data.data.categories[0].id.toString());
        }

        const venRes = await api.get('/vendors?limit=1000');
        setVendors(venRes.data.data.vendors);
      } catch (err) {
        console.error(err);
      }
    };
    loadInitData();
  }, []);

  const addLineItem = () => {
    setLineItems([...lineItems, { itemName: '', quantity: 1, unit: 'NOS' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleLineItemChange = (index: number, field: string, val: any) => {
    const updated = lineItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setLineItems(updated);
  };

  const toggleVendorSelection = (id: number) => {
    if (selectedVendorIds.includes(id)) {
      setSelectedVendorIds(selectedVendorIds.filter(vId => vId !== id));
    } else {
      setSelectedVendorIds([...selectedVendorIds, id]);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'OPEN') => {
    if (!rfqTitle || !rfqDescription || !categoryId || !deadline) {
      setError('Please fill out all required fields');
      return;
    }

    if (lineItems.some(i => !i.itemName || i.quantity <= 0)) {
      setError('Please verify all line items details');
      return;
    }

    if (selectedVendorIds.length === 0) {
      setError('Please invite at least one vendor to submit quotations');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/rfqs', {
        title: rfqTitle,
        description: rfqDescription,
        categoryId: Number(categoryId),
        deadline: new Date(deadline).toISOString(),
        budget: budget ? Number(budget) : undefined,
        items: lineItems.map(item => ({
          itemName: item.itemName,
          quantity: Number(item.quantity),
          unit: item.unit
        })),
        vendorIds: selectedVendorIds,
      });

      navigate('/rfqs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit RFQ');
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors based on search query and category (must match RFQ category)
  const filteredVendors = vendors.filter(v => {
    const matchCat = v.categoryId === Number(categoryId);
    const matchSearch = v.companyName.toLowerCase().includes(vendorSearch.toLowerCase()) || 
      v.contactPerson.toLowerCase().includes(vendorSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/rfqs')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create RFQ's</h1>
          <p className="text-xs text-slate-500 mt-1">new request for quotation</p>
        </div>
      </div>

      {/* Excalidraw Step flow indicator */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto py-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                step >= s ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {s}
              </div>
              <span className={`text-xs font-semibold hidden md:inline ${
                step === s ? 'text-primary-650 dark:text-primary-400' : 'text-slate-500'
              }`}>
                {s === 1 ? 'Details' : s === 2 ? 'Items & Vendors' : 'Review & Send'}
              </span>
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 mx-4 ${step > s ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-800'}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-500 rounded-lg">
          {error}
        </div>
      )}

      {/* Main card steps content */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="RFQ Title *"
                value={rfqTitle}
                onChange={(e) => setRfqTitle(e.target.value)}
                placeholder="e.g. Office Furniture procurement Q2"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Category *"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />

                <Input
                  label="Deadline *"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Estimated Budget (Optional)"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 250000"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description *
                </label>
                <textarea
                  placeholder="Ergonomic chairs and standing desks for 3rd floor..."
                  value={rfqDescription}
                  onChange={(e) => setRfqDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition duration-150"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Line Items section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Line Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="flex items-center gap-1">
                    <Plus size={14} />
                    Add line item
                  </Button>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-350">
                      <tr>
                        <th className="px-4 py-2.5">Item Description</th>
                        <th className="px-4 py-2.5 w-24 text-right">Qty</th>
                        <th className="px-4 py-2.5 w-24">Unit</th>
                        <th className="px-4 py-2.5 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              placeholder="e.g. Ergonomic chair"
                              value={item.itemName}
                              onChange={(e) => handleLineItemChange(index, 'itemName', e.target.value)}
                              className="w-full text-sm bg-transparent border-0 focus:outline-none text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                              className="w-full text-sm bg-transparent border-0 focus:outline-none text-right text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                              className="w-full text-sm bg-transparent border-0 focus:outline-none text-slate-900 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-red-500 hover:text-red-650"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vendor selection section */}
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Assign Vendors</h3>
                  <p className="text-xs text-slate-500">Invite vendors to submit quotations for this RFQ category</p>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search category vendors..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="w-full text-xs bg-transparent border-0 focus:outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                  {filteredVendors.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No vendors found for this category</div>
                  ) : (
                    filteredVendors.map(vendor => (
                      <label key={vendor.id} className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">{vendor.companyName}</span>
                          <span className="text-[10px] text-slate-500">{vendor.contactPerson} ({vendor.email})</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedVendorIds.includes(vendor.id)}
                          onChange={() => toggleVendorSelection(vendor.id)}
                          className="rounded border-slate-350 bg-white text-primary-600 focus:ring-0 w-4 h-4"
                        />
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Excalidraw attachments component */}
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer">
                <UploadCloud size={40} className="text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drag & drop files or click to upload</span>
                <span className="text-[10px] text-slate-400 mt-1">PDF, DOCX up to 10MB</span>
              </div>

              {/* RFQ summary checklist */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Summary Details</h4>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                  <li><strong>Title:</strong> {rfqTitle}</li>
                  <li><strong>Deadline:</strong> {deadline ? new Date(deadline).toLocaleDateString() : ''}</li>
                  <li><strong>Budget:</strong> ${budget || 'Not specified'}</li>
                  <li><strong>Line Items:</strong> {lineItems.length} listed</li>
                  <li><strong>Invited Vendors:</strong> {selectedVendorIds.length} suppliers selected</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back and Next / Save buttons */}
      <div className="flex items-center justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {step < 3 ? (
            <Button type="button" onClick={() => setStep(step + 1)} className="flex items-center gap-1">
              Next
              <ArrowRight size={16} />
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleSave('DRAFT')} loading={loading}>
                Save as Draft
              </Button>
              <Button type="button" onClick={() => handleSave('OPEN')} loading={loading} className="flex items-center gap-2">
                <Save size={16} />
                Save & Send to Vendors
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

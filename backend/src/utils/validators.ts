import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR']),
  phone: z.string().optional(),
  country: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const vendorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  categoryId: z.number().int('Category ID must be an integer'),
  gstNumber: z.string().min(15, 'GST number must be 15 characters').max(15),
  panNumber: z.string().min(10, 'PAN number must be 10 characters').max(10),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pincode: z.string().min(6, 'Pincode must be 6 digits'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export const rfqSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.number().int(),
  deadline: z.string().transform((str) => new Date(str)),
  budget: z.number().positive().optional(),
  items: z.array(z.object({
    itemName: z.string().min(1, 'Item name is required'),
    quantity: z.number().positive(),
    unit: z.string().min(1, 'Unit is required'),
  })).min(1, 'At least one item is required'),
  vendorIds: z.array(z.number().int()).min(1, 'At least one vendor must be invited'),
});

export const quotationSchema = z.object({
  rfqId: z.number().int(),
  deliveryTimeline: z.number().int().positive('Delivery timeline must be positive days'),
  taxRate: z.number().nonnegative().default(18.0),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemName: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

export const approvalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

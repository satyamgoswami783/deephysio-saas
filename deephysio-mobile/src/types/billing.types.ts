import { Patient } from './patient.types';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'Cash' | 'Card' | 'Online' | 'UPI' | 'Bank Transfer';

export interface Service {
  id: number;
  name: string;
  category?: string | null;
  duration: number;
  price: number | string;
  is_active?: boolean;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: string;
  service: string;
  rate: number | string;
  qty: number;
}

export interface Payment {
  id: string;
  invoice_id?: string | null;
  patient_id: number;
  amount: number | string;
  date: string;
  method?: string | null;
  status?: PaymentStatus;
  description?: string | null;
  patient?: Patient;
  invoice?: Invoice;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: number;
  date: string;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  status: InvoiceStatus;
  notes?: string | null;
  items?: InvoiceItem[];
  patient?: Patient;
  payments?: Payment[];
  created_at?: string;
  updated_at?: string;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid';
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'cheque';

export interface Payment {
  id: number;
  tenant_id: number;
  invoice_id: number;
  amount: number | string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  paid_at: string;
}

export interface Invoice {
  id: number;
  tenant_id: number;
  order_id: number;
  invoice_number: string;
  amount_due: number | string;
  amount_paid: number | string;
  due_date: string;
  status: InvoiceStatus;
  customer_name?: string;
  customer_email?: string;
  total_amount?: number | string;
  created_at: string;
  updated_at: string;
  payments?: Payment[];
}

export interface RecordPaymentPayload {
  amount: number;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
}

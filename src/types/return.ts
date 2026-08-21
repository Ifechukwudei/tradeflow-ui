export type ReturnStatus = 'requested' | 'approved' | 'restocked' | 'refunded' | 'rejected';

export interface CreditNote {
  id: number;
  tenant_id: number;
  return_id: number;
  credit_note_number: string;
  amount: number | string;
  status: 'pending' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface ReturnItem {
  id?: number;
  tenant_id?: number;
  return_id?: number;
  product_id: number;
  quantity: number;
  product_name?: string;
  sku?: string;
  unit_price?: number | string;
}

export interface ReturnOrder {
  id: number;
  tenant_id: number;
  order_id: number;
  reason: string;
  status: ReturnStatus;
  notes?: string;
  customer_name?: string;
  order_total?: number | string;
  created_at: string;
  updated_at: string;
  items?: ReturnItem[];
  credit_note?: CreditNote | null;
}

export interface CreateReturnPayload {
  order_id: number;
  reason: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}
